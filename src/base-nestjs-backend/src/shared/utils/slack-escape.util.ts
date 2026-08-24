/**
 * Making untrusted text safe to put in a Slack message.
 *
 * Anything that reaches `LoggerService.error` can end up rendered in a channel,
 * and exception payloads routinely quote request data — a URL, a validation
 * message, a stack frame naming a user-supplied value. Slack parses control
 * sequences out of the plain `text` field, so unescaped text can ping everyone
 * in the workspace.
 *
 * Two separate concerns, deliberately kept separate: `escapeSlackText` stops the
 * text from *doing* anything, `redactPhones` stops it from *revealing* anything.
 */

/**
 * Final caps applied at the Slack sink. Deliberately tighter than the DTO's
 * `@MaxLength` limits, so an over-long field is truncated *visibly* here rather
 * than rejected with a 400 — a hostile report should still produce a (bounded)
 * alert, not vanish.
 */
export const SLACK_TEXT_LIMITS = {
  message: 300,
  stack: 2000,
  path: 200,
  userAgent: 200,
} as const;

/**
 * Neutralise Slack's mrkdwn control characters and cap the length.
 *
 * The three replaced characters are the ones Slack's own docs require escaping:
 * they are what makes `<!channel>` (pings everyone), `<@U123>` (pings a person)
 * and `<https://evil|innocent text>` (a disguised link) work. Escaped, they
 * render as literal text.
 *
 * Triple backticks are neutralised separately because a sender may wrap a stack
 * in a code fence — without this, reported text could close the fence and
 * re-enter mrkdwn context, undoing the escaping above.
 *
 * `&` is replaced first on purpose: escape it last and an input that already
 * reads `&lt;!channel&gt;` would round-trip back into a live `<!channel>`.
 */
export function escapeSlackText(input: string, max: number): string {
  const capped =
    input.length > max ? `${input.slice(0, max)}… [truncated]` : input;
  return capped
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('```', "'''");
}

/**
 * Vietnamese phone shapes, redacted from any text bound for Slack.
 *
 * Defence in depth rather than the primary control — the field-level redaction
 * in `AllExceptionsFilter` is what removes a phone number stored under a known
 * key. This catches the other case: a number quoted inside a free-text error
 * *message*, where no key names it. A Slack channel is a wider audience than the
 * database, and often a shared one.
 *
 * Matches `0901234567`, `+84901234567`, `84 90 123 4567`, `090.123.4567`.
 */
// The hyphen is last in the class, where it is a literal and needs no escape.
//
// The boundaries matter as much as the digits. Without them the pattern matched
// *inside* longer alphanumeric runs, so a record code (`ABC0123456789`) came out
// as `ABC[PHONE]` and any epoch timestamp containing `84`/`0` followed by enough
// digits was mangled too — destroying the identifiers an alert is read for. A
// phone is a standalone token, so require that on both sides.
const PHONE_PATTERN = /(?<![\w])(?:\+?84|0)(?:[\s.-]?\d){8,10}(?![\d])/g;

export function redactPhones(input: string): string {
  return input.replace(PHONE_PATTERN, '[PHONE]');
}

/** The two together, in the order the sender needs: redact, then escape, then cap. */
export function safeSlackField(input: string, max: number): string {
  return escapeSlackText(redactPhones(input), max);
}
