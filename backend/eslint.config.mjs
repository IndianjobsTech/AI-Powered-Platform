import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import n from "eslint-plugin-n";

const eslintConfig = defineConfig([
  // Global ignores
  globalIgnores([
    "dist/**",
    "node_modules/**",
  ]),

  // Base JavaScript recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // Node.js recommended rules & project-specific overrides
  {
    plugins: {
      n,
    },
    rules: {
      // Node.js plugin rules
      "n/no-missing-import": "off", // TypeScript handles module resolution
      "n/no-unpublished-import": "off", // Dev deps used in tooling is fine
      "n/hashbang": "off", // Not a CLI tool
      "n/no-unsupported-features/es-syntax": "off", // TypeScript handles transpilation
      "n/no-missing-require": "off", // TypeScript builds handle this
      "n/no-process-exit": "warn", // Legitimate use in graceful shutdown
      "n/exports-style": "off",

      // TypeScript-specific rules
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",

      // General quality rules
      "no-console": "warn",
      "no-undef": "off", // TypeScript handles this
    },
  },
]);

export default eslintConfig;
