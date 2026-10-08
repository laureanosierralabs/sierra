import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Read-only template clone and agent docs, not app code.
    "_reference/**",
    ".agents/**",
  ]),
  // Vendored TailGrids primitives: keep them identical to upstream so CLI updates
  // stay diffable. The React Compiler rules flag floating-ui refs / effect state
  // patterns that are fine here; empty prop interfaces are the upstream convention.
  {
    files: ["components/tailgrids/**"],
    rules: {
      "@typescript-eslint/no-empty-object-type": [
        "error",
        { allowInterfaces: "with-single-extends" },
      ],
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
