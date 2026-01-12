import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://192.168.68.108/", // Vite default port
    // baseUrl: "http://localhost:5173", // Vite default port
    env: {
      // URL del backend de testing (diferente del dev/prod)
      apiUrl: "http://192.168.68.108:3000",
      // apiUrl: "http://localhost:3001",
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    viewportWidth: 1280,
    viewportHeight: 768,
    video: false, // Desactivar videos para acelerar los tests
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000, // 10 segundos
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
  },
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
    specPattern: "cypress/component/**/*.cy.{js,jsx,ts,tsx}",
  },
});
