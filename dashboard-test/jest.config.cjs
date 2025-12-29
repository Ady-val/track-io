module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        useESM: false,
        tsconfig: "tsconfig.test.json",
        diagnostics: {
          ignoreCodes: [1343],
        },
        astTransformers: {
          before: [
            {
              path: "ts-jest-mock-import-meta",
              options: {
                metaObjectReplacement: {
                  env: {
                    VITE_API_URL: "http://localhost:3000",
                    MODE: "test",
                    DEV: false,
                    PROD: false,
                    SSR: false,
                  },
                },
              },
            },
          ],
        },
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@components/atoms$": "<rootDir>/src/components/atoms",
    "^@components/molecules$": "<rootDir>/src/components/molecules",
    "^@components/organisms$": "<rootDir>/src/components/organisms",
    "^@components/templates$": "<rootDir>/src/components/templates",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(@heroui|@react-aria|@react-stately|@internationalized|@react-types|framer-motion|tailwind-variants|msw|until-async)/)",
  ],
  setupFiles: ["<rootDir>/jest.setup-before.ts"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{ts,tsx}",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
    "!src/main.tsx",
    "!src/vite-env.d.ts",
    "!src/test-utils/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 70,
      statements: 70,
    },
  },
  clearMocks: true,
  restoreMocks: true,
  verbose: false,
  silent: true,
  // Timeout más corto para evitar que los tests se congelen
  testTimeout: 10000, // 10 segundos máximo por test
  // Forzar salida después de los tests
  // @testing-library/user-event crea un MessagePort interno que no se cierra automáticamente.
  // Este es un comportamiento conocido de la librería y no afecta la funcionalidad de los tests.
  // QueryClient ya se limpia correctamente en jest.setup.ts, este handle restante es de userEvent.
  forceExit: true,
};

