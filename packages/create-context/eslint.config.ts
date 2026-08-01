import { defineConfig } from "eslint/config";
import baseConfig from "../../eslint.config";

export default defineConfig([
  ...baseConfig,
  {
    files: ["**/*.json"],
    rules: {
      "@nx/dependency-checks": [
        "error",
        {
          ignoredFiles: [
            "{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}",
            "{projectRoot}/vite.config.{js,ts,mjs,mts}",
            "{projectRoot}/test-setup.{js,ts,mjs,mts}",
            "{projectRoot}/src/**/*.{test,spec}.{js,ts,jsx,tsx}",
          ],
        },
      ],
    },
    languageOptions: {
      parser: await import("jsonc-eslint-parser"),
    },
  },
  {
    ignores: ["**/out-tsc"],
  },
]);
