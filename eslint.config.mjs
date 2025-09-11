import globals from "globals";
import pluginImport from "eslint-plugin-import";

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: globals.node,
    },
    plugins: { import: pluginImport },
    settings: {
      "import/resolver": {
        node: { extensions: [".js", ".json"], caseSensitive: true }
      }
    },
    rules: {
      "import/no-unresolved": ["error", { caseSensitive: true }],
      // adjust any other rules you use:
      "import/no-extraneous-dependencies": "off",
    },
  },
];
