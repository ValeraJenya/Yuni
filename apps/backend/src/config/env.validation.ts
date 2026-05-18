export type AppEnvironment = 'development' | 'test' | 'production';

export interface ValidatedEnv {
  NODE_ENV: AppEnvironment;
  PORT: number;
  DATABASE_URL: string;
  FRONTEND_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  CORS_ALLOWED_ORIGINS?: string;
}

const allowedEnvironments = new Set<AppEnvironment>([
  'development',
  'test',
  'production',
]);

export function validateEnv(config: Record<string, unknown>): ValidatedEnv {
  const nodeEnv = String(config.NODE_ENV ?? 'development') as AppEnvironment;
  const port = Number(config.PORT ?? 4000);
  const databaseUrl = String(config.DATABASE_URL ?? '');
  const frontendUrl = String(config.FRONTEND_URL ?? 'http://localhost:3000');
  const accessSecret = String(config.JWT_ACCESS_SECRET ?? '');
  const refreshSecret = String(config.JWT_REFRESH_SECRET ?? '');
  const corsAllowedOrigins = config.CORS_ALLOWED_ORIGINS
    ? String(config.CORS_ALLOWED_ORIGINS)
    : undefined;

  const errors: string[] = [];

  if (!allowedEnvironments.has(nodeEnv)) {
    errors.push('NODE_ENV must be one of: development, test, production');
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push('PORT must be a valid TCP port');
  }

  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    errors.push('DATABASE_URL must be a PostgreSQL connection string');
  }

  if (!frontendUrl.startsWith('http://') && !frontendUrl.startsWith('https://')) {
    errors.push('FRONTEND_URL must be an http(s) URL');
  }

  if (accessSecret.length < 32) {
    errors.push('JWT_ACCESS_SECRET must be at least 32 characters long');
  }

  if (refreshSecret.length < 32) {
    errors.push('JWT_REFRESH_SECRET must be at least 32 characters long');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid backend environment:\n- ${errors.join('\n- ')}`);
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL: databaseUrl,
    FRONTEND_URL: frontendUrl,
    JWT_ACCESS_SECRET: accessSecret,
    JWT_REFRESH_SECRET: refreshSecret,
    CORS_ALLOWED_ORIGINS: corsAllowedOrigins,
  };
}
