import { validateSecretStrength } from './validate-secrets';

const STRONG = 'a'.repeat(16) + '9f3c1d7b8e2a4f60';

describe('validateSecretStrength', () => {
  const prod = (over: Record<string, string> = {}) =>
    ({ NODE_ENV: 'production', ...over }) as NodeJS.ProcessEnv;

  it('passes when no secrets are configured (guards fail closed)', () => {
    expect(() => validateSecretStrength(prod())).not.toThrow();
  });

  it('passes for generated-looking secrets', () => {
    expect(() =>
      validateSecretStrength(
        prod({ JWT_SECRET: STRONG, INTERNAL_AUTH_TOKEN: STRONG }),
      ),
    ).not.toThrow();
  });

  it('rejects the dated <project>.<audience>@<year> scheme', () => {
    expect(() =>
      validateSecretStrength(
        prod({ INTERNAL_AUTH_TOKEN: 'base.internal@2026' }),
      ),
    ).toThrow(/INTERNAL_AUTH_TOKEN/);
  });

  it('rejects the .example-env placeholder', () => {
    expect(() =>
      validateSecretStrength(
        prod({ DEV_API_SECRET_KEY: 'your-secret-key-here' }),
      ),
    ).toThrow(/DEV_API_SECRET_KEY/);
  });

  it('rejects secrets shorter than 32 characters', () => {
    expect(() => validateSecretStrength(prod({ JWT_SECRET: 'short' }))).toThrow(
      /at least 32/,
    );
  });

  it('never leaks the secret value in the error message', () => {
    const weak = 'base.internal@2026';
    expect(() =>
      validateSecretStrength(prod({ INTERNAL_AUTH_TOKEN: weak })),
    ).toThrow(expect.not.stringContaining(weak) as unknown as string);
  });

  it('reports every weak secret at once', () => {
    try {
      validateSecretStrength(
        prod({ JWT_SECRET: 'short', DEV_API_SECRET_KEY: 'dev-secret-2026' }),
      );
      fail('expected a throw');
    } catch (error) {
      expect((error as Error).message).toMatch(/JWT_SECRET/);
      expect((error as Error).message).toMatch(/DEV_API_SECRET_KEY/);
    }
  });

  it('stays silent outside production', () => {
    expect(() =>
      validateSecretStrength({
        NODE_ENV: 'local',
        INTERNAL_AUTH_TOKEN: 'base.internal@2026',
      } as NodeJS.ProcessEnv),
    ).not.toThrow();
  });
});
