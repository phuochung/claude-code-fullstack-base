import { Injectable } from '@nestjs/common';
import { SlackService } from '../../shared/services/slack.service';
import {
  SLACK_TEXT_LIMITS,
  safeSlackField,
} from '../../shared/utils/slack-escape.util';
import { ErrorReportFieldsDto } from './dto/report-error.dto';
import { ErrorReportSourceEnum } from './enums/error-report.enum';
import { ErrorReportFloodGate } from './error-report-flood-gate';

/**
 * How long one fingerprint stays "already alerted". Long enough that a broken
 * page hit by a stream of customers is one message rather than one per visitor;
 * short enough that a persisting problem re-announces itself instead of going
 * quiet after the first alert.
 */
const DEDUPE_WINDOW_MS = 5 * 60 * 1000;

/**
 * Ceiling on tracked fingerprints, so a flood of *distinct* errors cannot grow
 * this map without bound. Reaching it is already pathological, so the recovery
 * is blunt: drop everything and start over.
 */
const MAX_TRACKED_FINGERPRINTS = 500;

/**
 * Turns a reported error into a Slack alert, with three independent brakes:
 * de-duplication (same error, many customers), the flood gate (many different
 * errors at once), and the per-IP throttle on the controller.
 *
 * Every report is logged to stdout **before** any of them, so Cloud Logging and
 * GCP Error Reporting always hold the complete record — that is the backstop
 * that survives both a Slack outage and every suppression rule here.
 */
@Injectable()
export class ErrorReportService {
  /** fingerprint → when this window opened, and how many hits it swallowed. */
  private readonly seen = new Map<
    string,
    { firstAt: number; suppressed: number }
  >();

  constructor(
    private readonly slackService: SlackService,
    private readonly floodGate: ErrorReportFloodGate,
  ) {}

  /**
   * Record one report and, unless suppressed, alert on it.
   *
   * Never throws: every caller has just caught a crash, and nothing downstream
   * of an alert is worth a 500 to a customer.
   */
  report(source: ErrorReportSourceEnum, dto: ErrorReportFieldsDto): void {
    const receivedAt = new Date().toISOString();

    // Unescaped and unsuppressed on purpose — this is the Cloud Logging record,
    // not a mrkdwn context, and it must reflect every single report.
    console.error(
      '[error-report]',
      JSON.stringify({ source, ...dto, receivedAt }),
    );

    try {
      const now = Date.now();
      const key = fingerprintOf(source, dto);
      const previous = this.seen.get(key);

      if (previous && now - previous.firstAt < DEDUPE_WINDOW_MS) {
        previous.suppressed += 1;
        return;
      }

      const decision = this.floodGate.admit(now);
      if (decision.summary) {
        void this.slackService.sendMessage('flood-control', decision.summary);
      }

      // Marked seen only when we actually alert. Recording it before the flood
      // gate meant a brand-new error whose first sighting landed mid-flood was
      // treated as "already reported" and stayed silent for the full dedupe
      // window — the one error most worth hearing about, muted by the noise
      // around it. Left unmarked it simply retries next window, and the gate
      // keeps the volume bounded in the meantime.
      if (!decision.send) return;

      this.prune(now);
      this.seen.set(key, { firstAt: now, suppressed: 0 });

      void this.slackService.sendMessage(
        receivedAt,
        this.format(source, dto, previous?.suppressed ?? 0),
      );
    } catch (alertError) {
      // The alert path failing must not fail the report — the log line above
      // already preserved it.
      console.error('[error-report] failed to alert', alertError);
    }
  }

  /**
   * Build the Slack message.
   *
   * **Every interpolated value goes through `safeSlackField`** (phone redaction
   * → mrkdwn escaping → hard cap). Nothing reaches the channel raw: `message`,
   * `stack`, `path` and `userAgent` are all attacker-reachable text.
   */
  private format(
    source: ErrorReportSourceEnum,
    dto: ErrorReportFieldsDto,
    repeats: number,
  ): string {
    const field = (value: string | undefined, max: number) =>
      value ? safeSlackField(value, max) : undefined;

    const lines = [
      `*${source === ErrorReportSourceEnum.DASHBOARD ? 'Dashboard' : 'Website'} error* — \`${source}\``,
      `path: \`${field(dto.path, SLACK_TEXT_LIMITS.path) ?? '?'}\``,
    ];

    const route = field(dto.route, SLACK_TEXT_LIMITS.path);
    if (route) lines.push(`route: \`${route}\``);

    const renderSource = field(dto.renderSource, 50);
    if (renderSource) lines.push(`render: \`${renderSource}\``);

    // Not escaped through `field` because the DTO's @Matches already restricts
    // it to [\w-], which contains nothing mrkdwn reacts to.
    if (dto.digest) lines.push(`Error code: \`${dto.digest}\``);

    lines.push(`> ${field(dto.message, SLACK_TEXT_LIMITS.message) ?? ''}`);

    const stack = field(dto.stack, SLACK_TEXT_LIMITS.stack);
    // The fence is safe because `escapeSlackText` turns any ``` in the reported
    // text into ''' — reported content cannot close it and re-enter mrkdwn.
    if (stack) lines.push('```' + stack + '```');

    const userAgent = field(dto.userAgent, SLACK_TEXT_LIMITS.userAgent);
    if (userAgent) lines.push(`_${userAgent}_`);

    if (repeats > 0) {
      lines.push(
        `_(${repeats} identical report(s) suppressed since the last alert)_`,
      );
    }

    return lines.join('\n');
  }

  /** Drop expired windows; clear everything if distinct errors outgrew the ceiling. */
  private prune(now: number): void {
    for (const [key, entry] of this.seen) {
      if (now - entry.firstAt >= DEDUPE_WINDOW_MS) {
        this.seen.delete(key);
      }
    }
    if (this.seen.size >= MAX_TRACKED_FINGERPRINTS) {
      this.seen.clear();
    }
  }
}

/**
 * What counts as "the same error".
 *
 * Message alone over-merges (two unrelated `undefined is not a function`s); the
 * whole stack under-merges (line numbers shift between builds, browser stacks
 * carry per-session URLs). Message + first stack frame + route is the balance
 * the storefront's client-side dedupe uses too, so a repeat suppressed in the
 * browser and one suppressed here mean the same thing.
 *
 * Deliberately **not** the path: one broken product template failing on fifty
 * cakes is one bug, and keying on the path would alert per cake.
 */
function fingerprintOf(
  source: ErrorReportSourceEnum,
  dto: ErrorReportFieldsDto,
): string {
  const topFrame = (dto.stack ?? '')
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('at ') || line.includes('@'));

  return [
    source,
    dto.digest ?? '',
    dto.message,
    topFrame ?? '',
    dto.route ?? '',
  ].join('|');
}
