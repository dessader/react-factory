import nextEslintPluginNext from "@next/eslint-plugin-next";
import nx from "@nx/eslint-plugin";
import type { Linter } from "eslint";
import { defineConfig } from "eslint/config";
import baseConfig from "../../eslint.config";

// @typescript-eslint/utils' FlatConfig.Config predates @eslint/core's LanguageOptions
// index signature, so this nx-provided config needs a cast to Linter.Config.
const nxReactTypescript = nx.configs["flat/react-typescript"] as Linter.Config[];

export default defineConfig([
  { plugins: { "@next/next": nextEslintPluginNext } },
  ...nxReactTypescript,
  ...baseConfig,
  {
    ignores: [".next/**/*", "**/out-tsc"],
  },
]);
