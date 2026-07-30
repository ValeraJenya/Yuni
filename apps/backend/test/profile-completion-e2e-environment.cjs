const { spawnSync } = require('node:child_process');

function configureTestEnvironment() {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

  if (!testDatabaseUrl) {
    throw new Error(
      'TEST_DATABASE_URL or DATABASE_URL is required for backend e2e tests',
    );
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(testDatabaseUrl);
  } catch {
    throw new Error('TEST_DATABASE_URL must be a valid PostgreSQL URL');
  }

  if (!['postgres:', 'postgresql:'].includes(parsedUrl.protocol)) {
    throw new Error('TEST_DATABASE_URL must use the PostgreSQL protocol');
  }

  const databaseName = decodeURIComponent(parsedUrl.pathname.replace(/^\//, ''));
  if (!databaseName.endsWith('_test') && !databaseName.endsWith('_ci')) {
    throw new Error(
      'Refusing to run e2e tests: database name must end with _test or _ci',
    );
  }

  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.FRONTEND_URL = 'http://localhost:3000';
  process.env.JWT_ACCESS_SECRET =
    'synthetic-e2e-access-secret-at-least-32-characters';
  process.env.JWT_REFRESH_SECRET =
    'synthetic-e2e-refresh-secret-at-least-32-characters';
  process.env.JWT_ACCESS_TTL_SECONDS = '900';
  process.env.REFRESH_TOKEN_TTL_DAYS = '1';
}

configureTestEnvironment();

module.exports = async () => {
  const isWindows = process.platform === 'win32';
  const command = isWindows ? process.env.ComSpec || 'cmd.exe' : 'corepack';
  const args = isWindows
    ? ['/d', '/s', '/c', 'corepack pnpm exec prisma migrate deploy']
    : ['pnpm', 'exec', 'prisma', 'migrate', 'deploy'];
  const migration = spawnSync(
    command,
    args,
    {
      cwd: __dirname + '/..',
      env: process.env,
      encoding: 'utf8',
    },
  );

  if (migration.status !== 0) {
    throw new Error(
      `Could not apply e2e migrations:\n${migration.error ?? ''}\n${migration.stdout ?? ''}\n${migration.stderr ?? ''}`,
    );
  }
};
