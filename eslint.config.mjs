import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...nextCoreWebVitals,
  {
    ignores: [".next/**", "node_modules/**", "tsconfig.tsbuildinfo"],
  },
  {
    rules: {
      // Stylistic; unescaped apostrophes in JSX text render correctly
      "react/no-unescaped-entities": "off",
      // Flags legitimate sync-from-external-system patterns (URL init,
      // localStorage init, DOM measurement); keep visible but non-blocking
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default config;
