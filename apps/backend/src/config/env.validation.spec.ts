import { validateEnv } from './env.validation';

const validConfig = {
  NODE_ENV: 'test',
  PORT: '4001',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/yuni_test',
  FRONTEND_URL: 'http://localhost:3000',
  JWT_ACCESS_SECRET: 'test-access-secret-minimum-32-chars',
  JWT_REFRESH_SECRET: 'test-refresh-secret-minimum-32-chars',
  JWT_ACCESS_TTL_SECONDS: '900',
  REFRESH_TOKEN_TTL_DAYS: '30',
};

describe('validateEnv', () => {
  it('returns normalized values for a valid test config', () => {
    expect(validateEnv(validConfig)).toEqual({
      NODE_ENV: 'test',
      PORT: 4001,
      DATABASE_URL: validConfig.DATABASE_URL,
      FRONTEND_URL: validConfig.FRONTEND_URL,
      JWT_ACCESS_SECRET: validConfig.JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET: validConfig.JWT_REFRESH_SECRET,
      JWT_ACCESS_TTL_SECONDS: 900,
      REFRESH_TOKEN_TTL_DAYS: 30,
      CORS_ALLOWED_ORIGINS: undefined,
    });
  });

  it('rejects invalid critical backend environment values', () => {
    expect(() =>
      validateEnv({
        ...validConfig,
        NODE_ENV: 'staging',
        DATABASE_URL: 'mysql://localhost/yuni',
        JWT_ACCESS_SECRET: 'short',
      }),
    ).toThrow(/Invalid backend environment/);
  });
});
