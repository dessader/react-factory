import nx from "@nx/eslint-plugin";
import type { Linter } from "eslint";
import { defineConfig } from "eslint/config";

const nxBase = nx.configs["flat/base"] as Linter.Config[];
const nxTypescript = nx.configs["flat/typescript"] as Linter.Config[];
const nxJavascript = nx.configs["flat/javascript"] as Linter.Config[];

export default defineConfig([
  ...nxBase,
  ...nxTypescript,
  ...nxJavascript,
  {
    ignores: ["**/dist", "**/out-tsc"],
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    rules: {
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: true,
          allow: ["^.*/eslint(\\.base)?\\.config(\\.[cm]?[jt]s)?$"],
          depConstraints: [
            {
              sourceTag: "*",
              onlyDependOnLibsWithTags: ["*"],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "**/*.ts",
      "**/*.tsx",
      "**/*.cts",
      "**/*.mts",
      "**/*.js",
      "**/*.jsx",
      "**/*.cjs",
      "**/*.mjs",
    ],
    rules: {},
  },
]);
