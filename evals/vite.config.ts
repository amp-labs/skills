import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    jsPlugins: [{ name: "evals", specifier: "./lint-plugin.ts" }],
    rules: {
      "evals/no-comments": "error",
      "typescript/no-explicit-any": "error",
      "typescript/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "typescript/no-non-null-assertion": "error",
      "typescript/no-unsafe-argument": "error",
      "typescript/no-unsafe-assignment": "error",
      "typescript/no-unsafe-call": "error",
      "typescript/no-unsafe-member-access": "error",
      "typescript/no-unsafe-return": "error",
      "typescript/no-floating-promises": "error",
      "typescript/no-misused-promises": "error",
      "typescript/switch-exhaustiveness-check": "error",
      "no-console": "error",
    },
    options: {
      typeAware: true,
      typeCheck: true,
      denyWarnings: true,
    },
  },
  staged: {
    "*": "vp check --fix",
  },
});
