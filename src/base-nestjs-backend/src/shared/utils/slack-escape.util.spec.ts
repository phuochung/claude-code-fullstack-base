import {
  escapeSlackText,
  redactPhones,
  safeSlackField,
} from './slack-escape.util';

describe('escapeSlackText', () => {
  it('defuses the sequences that ping a whole workspace', () => {
    // The attack this whole util exists for: text whose contents ping everyone
    // in the channel.
    expect(escapeSlackText('<!channel>', 100)).toBe('&lt;!channel&gt;');
    expect(escapeSlackText('<!here>', 100)).toBe('&lt;!here&gt;');
    expect(escapeSlackText('<@U12345678>', 100)).toBe('&lt;@U12345678&gt;');
  });

  it('defuses a disguised link', () => {
    expect(escapeSlackText('<https://evil.example|click me>', 100)).toBe(
      '&lt;https://evil.example|click me&gt;',
    );
  });

  it('escapes & first so an escape cannot be forged', () => {
    // If & were escaped last, the input `&lt;!channel&gt;` would round-trip
    // back into a live `<!channel>` when Slack decodes it.
    expect(escapeSlackText('&lt;!channel&gt;', 100)).toBe(
      '&amp;lt;!channel&amp;gt;',
    );
  });

  it('stops reported text from closing the code fence it is wrapped in', () => {
    expect(escapeSlackText('```\n<!channel>\n```', 100)).toBe(
      "'''\n&lt;!channel&gt;\n'''",
    );
  });

  it('truncates visibly rather than silently', () => {
    expect(escapeSlackText('x'.repeat(50), 10)).toBe(
      `${'x'.repeat(10)}… [truncated]`,
    );
  });

  it('leaves ordinary error text readable', () => {
    expect(escapeSlackText('TypeError: x is not a function', 100)).toBe(
      'TypeError: x is not a function',
    );
  });
});

describe('redactPhones', () => {
  it('redacts the Vietnamese phone shapes a user would have typed', () => {
    expect(redactPhones('lookup failed for 0901234567')).toBe(
      'lookup failed for [PHONE]',
    );
    expect(redactPhones('+84901234567')).toBe('[PHONE]');
    expect(redactPhones('090.123.4567')).toBe('[PHONE]');
    expect(redactPhones('090-123-4567')).toBe('[PHONE]');
  });

  it('leaves ordinary numbers alone', () => {
    expect(redactPhones('took 42ms')).toBe('took 42ms');
    expect(redactPhones('HTTP 500')).toBe('HTTP 500');
  });

  it('does not mangle the identifiers an alert is read for', () => {
    // A phone is a standalone token. Without boundary guards this matched
    // *inside* longer runs and destroyed record codes and timestamps — the
    // fields that make an alert actionable.
    expect(redactPhones('record ABC0123456789 failed')).toBe(
      'record ABC0123456789 failed',
    );
    expect(redactPhones('errorId 1786430705589')).toBe('errorId 1786430705589');
    expect(redactPhones('sku 8412345678901')).toBe('sku 8412345678901');
  });

  it('still redacts a phone next to punctuation', () => {
    expect(redactPhones('(0901234567)')).toBe('([PHONE])');
    expect(redactPhones('phone=0901234567&code=X')).toBe(
      'phone=[PHONE]&code=X',
    );
  });
});

describe('safeSlackField', () => {
  it('redacts before escaping, so a phone cannot hide behind markup', () => {
    expect(safeSlackField('<!channel> call 0901234567', 100)).toBe(
      '&lt;!channel&gt; call [PHONE]',
    );
  });
});
