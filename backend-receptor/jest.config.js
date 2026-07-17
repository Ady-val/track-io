// Los contenedores de producción corren en UTC (docker-compose no define TZ) y
// la planta opera en otra zona. Forzar UTC aquí garantiza que los tests de
// paros programados detecten cualquier uso accidental de la hora local del
// proceso en vez de PLANT_TIMEZONE, aunque el desarrollador tenga otra zona.
// Ver documentation/PLAN_MIGRACION_IOTRACK.md §1.4.
process.env.TZ = 'UTC';

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



