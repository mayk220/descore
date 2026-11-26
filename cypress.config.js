import codeCoverageTask from "@cypress/code-coverage/task";
import { defineConfig } from "cypress";

process.env.VITE_COVERAGE = "true";

export default defineConfig({
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
    specPattern: "cypress/component/**/*.cy.{js,jsx}",
    supportFile: "cypress/support/component.js",
    setupNodeEvents(on, config) {
      codeCoverageTask(on, config);
      return config;
    },
  },
});
