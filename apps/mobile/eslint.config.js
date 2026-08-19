const expo = require("eslint-config-expo/flat");
const { defineConfig } = require("eslint/config");

module.exports = defineConfig([
  {
    ignores: [".expo/**", ".venv-branding/**", "**/.venv/**"],
  },
  ...expo,
  {
    settings: {
      react: { version: "19" },
    },
    rules: {
      // React Compiler experimental rule — too strict for current codebase patterns.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);
