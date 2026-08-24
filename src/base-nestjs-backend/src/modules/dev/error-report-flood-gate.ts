import { Injectable } from '@nestjs/common';

/**
 * Caps how many error reports reach Slack per minute, regardless of who sent
 * them.
 *
 * The per-IP throttle stops one abuser; it does nothing about a botnet sending
 * one report per address, and nothing about a genuine outage where thousands of
 * real customers each hit the same broken page from a different address. Either
 * way the failure mode is the same and it is the worst one: **a real alert
 * buried under noise, at the exact moment alerts matter.**
 *
 * Suppressed reports are still logged to stdout by the caller, so Cloud Logging
 * and GCP Error Reporting keep the complete record — only the Slack fan-out is
 * capped, and the next window says how much it swallowed rather than dropping
 * silently.
 *
 * In-memory and per Cloud Run instance by design: N instances mean at worst
 * N×`MAX_PER_WINDOW` per minute, which is still bounded and needs no shared
 * state. It also keeps us under Slack's ~1 message/second channel limit.
 *
 * Rationale: see "Error alerting" in the backend CLAUDE.md.
 */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

export interface FloodGateDecision {
  /** Whether this report may go to Slack. */
  send: boolean;
  /**
   * Set only on the first admission of a new window, when the previous window
   * dropped something. The caller posts it as one extra message.
   */
  summary?: string;
}

@Injectable()
export class ErrorReportFloodGate {
  private windowStart = 0;
  private sentInWindow = 0;
  private suppressed = 0;

  admit(now: number = Date.now()): FloodGateDecision {
    let summary: string | undefined;

    if (now - this.windowStart >= WINDOW_MS) {
      this.windowStart = now;
      this.sentInWindow = 0;
      if (this.suppressed > 0) {
        summary = `⚠️ flood control: ${this.suppressed} error report(s) suppressed in the previous minute (all are in Cloud Logging)`;
        this.suppressed = 0;
      }
    }

    if (this.sentInWindow < MAX_PER_WINDOW) {
      this.sentInWindow += 1;
      return { send: true, summary };
    }

    // No `summary` here: it is only ever set by the rollover above, which also
    // resets `sentInWindow` to 0 — so a call that produces a summary always
    // takes the branch above. Returning it would be dead code.
    this.suppressed += 1;
    return { send: false };
  }
}
