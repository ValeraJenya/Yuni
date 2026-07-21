/** @type {import('jest').Config} */
module.exports = {
  clearMocks: true,
  globalSetup: '<rootDir>/test/profile-completion-e2e-environment.cjs',
  moduleFileExtensions: ['js', 'json', 'ts'],
  preset: 'ts-jest',
  rootDir: '.',
  setupFiles: ['<rootDir>/test/profile-completion-e2e-environment.cjs'],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
};
