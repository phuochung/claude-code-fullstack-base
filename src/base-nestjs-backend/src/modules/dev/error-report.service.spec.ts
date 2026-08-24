import { Test, TestingModule } from '@nestjs/testing';
import { ErrorReportService } from './error-report.service';
import { ErrorReportFloodGate } from './error-report-flood-gate';
import { SlackService } from '../../shared/services/slack.service';
import { ReportErrorDto } from './dto/report-error.dto';
import { ErrorReportSourceEnum } from './enums/error-report.enum';

describe('ErrorReportService', () => {
  let service: ErrorReportService;
  let slackService: { sendMessage: jest.Mock };
  let consoleError: jest.SpyInstance;

  const report = (overrides: Partial<ReportErrorDto> = {}): ReportErrorDto =>
    ({
      message: 'boom',
      stack: 'Error: boom\n    at Page (/app/product/page.js:12:3)',
      path: '/san-pham/banh-a',
      route: '/product/[slug]',
      ...overrides,
    }) as ReportErrorDto;

  /** Report with the website-server source unless a test overrides it. */
  const send = (
    dto: ReportErrorDto,
    source: ErrorReportSourceEnum = ErrorReportSourceEnum.WEBSITE_SERVER,
  ) => service.report(source, dto);

  /** The message bodies that actually reached Slack. */
  const alerts = (): string[] =>
    slackService.sendMessage.mock.calls.map(([, text]) => text as string);

  beforeEach(async () => {
    jest.useFakeTimers();
    slackService = { sendMessage: jest.fn().mockResolvedValue('') };
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ErrorReportService,
        ErrorReportFloodGate,
        { provide: SlackService, useValue: slackService },
      ],
    }).compile();

    service = module.get<ErrorReportService>(ErrorReportService);
  });

  afterEach(() => {
    consoleError.mockRestore();
    jest.useRealTimers();
  });

  it('alerts on the first report, tagged with its source', () => {
    send(report());

    expect(alerts()).toHaveLength(1);
    expect(alerts()[0]).toContain('website-server');
    expect(alerts()[0]).toContain('*Website error*');
    expect(alerts()[0]).toContain('/san-pham/banh-a');
    expect(alerts()[0]).toContain('boom');
  });

  it('labels a dashboard report so a glance says whose problem it is', () => {
    send(report(), ErrorReportSourceEnum.DASHBOARD);
    expect(alerts()[0]).toContain('*Dashboard error*');
    expect(alerts()[0]).toContain('`dashboard`');
  });

  it('shows the digest as the code the customer can quote', () => {
    send(report({ digest: '3389677190' }));
    expect(alerts()[0]).toContain('Error code: `3389677190`');
  });

  describe('hostile input', () => {
    it('never lets a report ping the workspace', () => {
      send(
        report({
          message: '<!channel> <https://evil.example|click>',
          stack: '```\n<!here>\n```',
          path: '/x',
        }),
      );

      const text = alerts()[0];
      expect(text).not.toContain('<!channel>');
      expect(text).not.toContain('<!here>');
      expect(text).toContain('&lt;!channel&gt;');
    });

    it('does not let a reported stack break out of its code fence', () => {
      send(report({ stack: '``` <!channel> ```' }));
      // Exactly two fence markers: the ones the formatter opened and closed.
      expect((alerts()[0].match(/```/g) ?? []).length).toBe(2);
    });

    it('redacts a phone number quoted in an error message', () => {
      send(report({ message: 'lookup failed for 0901234567' }));
      expect(alerts()[0]).not.toContain('0901234567');
      expect(alerts()[0]).toContain('[PHONE]');
    });

    it('caps an oversized stack instead of posting it whole', () => {
      send(report({ stack: 'x'.repeat(4000) }));
      expect(alerts()[0]).toContain('[truncated]');
      expect(alerts()[0].length).toBeLessThan(3000);
    });
  });

  describe('volume control', () => {
    it('sends one alert when many customers hit the same broken page', () => {
      for (let i = 0; i < 20; i += 1) send(report());
      expect(alerts()).toHaveLength(1);
    });

    it('logs every report even while suppressing the alerts', () => {
      for (let i = 0; i < 20; i += 1) send(report());
      // The Cloud Logging backstop must never be deduped or flood-gated.
      expect(consoleError).toHaveBeenCalledTimes(20);
    });

    it('caps Slack volume when a botnet sends DISTINCT errors', () => {
      // Dedupe cannot help here — every message differs, which is exactly the
      // "bury the real alert" attack the flood gate exists for.
      for (let i = 0; i < 100; i += 1) {
        send(report({ message: `unique failure ${i}` }));
      }
      expect(alerts().length).toBeLessThanOrEqual(10);
      expect(consoleError).toHaveBeenCalledTimes(100);
    });

    it('says how much it suppressed instead of dropping silently', () => {
      for (let i = 0; i < 100; i += 1) {
        send(report({ message: `unique failure ${i}` }));
      }
      jest.advanceTimersByTime(61_000);
      send(report({ message: 'a new minute' }));

      expect(alerts().some((text) => text.includes('flood control'))).toBe(
        true,
      );
    });

    it('does not mute a new error first seen during a flood', () => {
      // Saturate the gate with unrelated noise...
      for (let i = 0; i < 30; i += 1) {
        send(report({ message: `noise ${i}` }));
      }
      const duringFlood = alerts().length;

      // ...then a genuinely new error arrives and is flood-dropped.
      send(report({ message: 'the real bug' }));
      expect(alerts()).toHaveLength(duringFlood);

      // Next window it must alert. Marking it "seen" when it was dropped
      // silenced it for the full 5-minute dedupe window instead — muting the
      // one error most worth hearing about because of the noise around it.
      jest.advanceTimersByTime(61_000);
      send(report({ message: 'the real bug' }));
      expect(alerts().some((t) => t.includes('the real bug'))).toBe(true);
    });

    it('re-alerts once the dedupe window elapses, carrying the repeat count', () => {
      send(report());
      send(report());
      send(report());

      jest.advanceTimersByTime(5 * 60 * 1000 + 1);
      send(report());

      expect(alerts()).toHaveLength(2);
      expect(alerts()[1]).toContain('2 identical report(s) suppressed');
    });

    it('treats the same failure on two product pages as one bug', () => {
      send(report({ path: '/san-pham/banh-a' }));
      send(report({ path: '/san-pham/banh-b' }));
      expect(alerts()).toHaveLength(1);
    });

    it('separates a browser crash from a server crash with the same message', () => {
      send(report(), ErrorReportSourceEnum.WEBSITE_SERVER);
      send(report(), ErrorReportSourceEnum.WEBSITE_CLIENT);
      expect(alerts()).toHaveLength(2);
    });

    it('separates a dashboard crash from an identical website one', () => {
      send(report(), ErrorReportSourceEnum.WEBSITE_CLIENT);
      send(report(), ErrorReportSourceEnum.DASHBOARD);
      expect(alerts()).toHaveLength(2);
    });
  });

  it('never throws when the alert pipeline fails', () => {
    slackService.sendMessage.mockImplementation(() => {
      throw new Error('slack is down');
    });
    expect(() => send(report())).not.toThrow();
  });
});
