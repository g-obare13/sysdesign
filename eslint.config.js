import { tanstackConfig } from "@tanstack/eslint-config"

export default [
  {
    ignores: [".output/**", "types/**"],
  },
  ...tanstackConfig,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "no-shadow": "off",
      "import/order": "off",
    },
  },
]
