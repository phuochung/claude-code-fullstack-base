import { LoggerService } from './logger.service';
import { SlackService } from './slack.service';

/**
 * The point of these tests is the *asymmetry*: the console copy must stay raw
 * (Cloud Logging is not a mrkdwn context, and we want the real values when
 * debugging), while the Slack copy is sanitised because that channel is a wider
 * — often shared — audience.
 */
describe('LoggerService', () => {
  let slack: { sendMessage: jest.Mock };
  let logger: LoggerService;
  let consoleError: jest.SpyInstance;

  /** The single string handed to SlackService.sendMessage. */
  const slackText = (): string => {
    const [, text] = slack.sendMessage.mock.calls[0] as [string, string];
    return text;
  };

  /** Everything written to the console, joined. */
  const consoleText = (): string =>
    (consoleError.mock.calls as unknown[][])
      .map((args) => args.map((arg) => String(arg)).join(' '))
      .join('\n');

  beforeEach(() => {
    slack = { sendMessage: jest.fn().mockResolvedValue('') };
    logger = new LoggerService(slack as unknown as SlackService);
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('redacts a phone number from the Slack copy', () => {
    logger.error({ message: 'lookup failed for 0901234567' });

    expect(slackText()).not.toContain('0901234567');
    expect(slackText()).toContain('[PHONE]');
  });

  it('keeps the raw value on the console for debugging', () => {
    logger.error({ message: 'lookup failed for 0901234567' });

    expect(consoleText()).toContain('0901234567');
  });

  it('defuses a workspace ping smuggled through an exception message', () => {
    logger.error({ message: 'boom <!channel>' });

    expect(slackText()).toContain('&lt;!channel&gt;');
    expect(slackText()).not.toContain('<!channel>');
  });

  it('caps an oversized payload instead of posting it whole', () => {
    logger.error({ stack: 'x'.repeat(5000) });

    expect(slackText()).toContain('[truncated]');
    expect(slackText().length).toBeLessThan(3100);
  });

  it('leaves an ordinary stack trace readable', () => {
    logger.error({ message: 'TypeError: x is not a function' });

    expect(slackText()).toContain('TypeError: x is not a function');
  });

  it('passes the error id through so console and Slack can be correlated', () => {
    logger.error({ message: 'boom' }, 'error-42');

    const [errorId] = slack.sendMessage.mock.calls[0] as [string, string];
    expect(errorId).toBe('error-42');
    expect(consoleText()).toContain('error-42');
  });

  it('does not reject when Slack delivery fails', async () => {
    slack.sendMessage.mockRejectedValue(new Error('slack down'));

    expect(() => logger.error({ message: 'boom' })).not.toThrow();
    // Let the fire-and-forget rejection settle so it cannot leak into
    // another test as an unhandled rejection.
    await Promise.resolve();
  });
});
