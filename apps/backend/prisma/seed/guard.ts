// The seed deletes/overwrites rows for its fixed persona set. Running it
// against the wrong database is not "unlikely", it has to be impossible.
export function assertSafeToSeed(
  databaseUrl: string | undefined,
  nodeEnv: string | undefined,
): void {
  if (nodeEnv === 'production') {
    throw new Error('Refusing to seed: NODE_ENV is "production".');
  }

  if (!databaseUrl) {
    throw new Error('Refusing to seed: DATABASE_URL is not set.');
  }

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error('Refusing to seed: DATABASE_URL is not a valid URL.');
  }

  const isExplicitLocalHost =
    parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

  if (!isExplicitLocalHost) {
    throw new Error(
      `Refusing to seed: DATABASE_URL host "${parsed.hostname}" has no explicit local marker (expected localhost or 127.0.0.1).`,
    );
  }

  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ''));

  if (databaseName === 'yuni_test') {
    throw new Error(
      'Refusing to seed: yuni_test is reserved for the e2e suite, not for demo data.',
    );
  }
}
