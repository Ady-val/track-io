module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/migrations/**',
    '!**/main.ts',
    '!**/*.module.ts',
    '!**/*.entity.ts',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testEnvironment: 'node',
  clearMocks: true,
  restoreMocks: true,
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  reporters: [
    'default',
    [
      'jest-progress-bar-reporter',
      {
        barChar: '█',
        successChar: '█',
        failureChar: '█',
        pendingChar: '█',
      },
    ],
  ],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
  },
  verbose: false,
  silent: true,
};



