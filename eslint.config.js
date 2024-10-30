import globals from "globals";
import eslintPluginJs from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import { fileURLToPath } from "url";
import { dirname } from "path";

// For ES Module compatibility with __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      globals: globals.browser,
      parser: tsParser,
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react": reactPlugin,
    },
    rules: {
      ...eslintPluginJs.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...reactPlugin.configs.flat.recommended.rules,
      'react/react-in-jsx-scope': 'off',
    },
  },
  // Add the overrides section here
  {
    files: ["tailwind.config.cjs", "vite.config.js", "*.mjs"],
    languageOptions: {
      parserOptions: {
        project: null, // Disable project for these files
      },
    },
  },
];
