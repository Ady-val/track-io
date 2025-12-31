// @ts-nocheck
import path from "node:path";
import { fileURLToPath } from "node:url";
import eslint from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import unusedImports from "eslint-plugin-unused-imports";
import importPlugin from "eslint-plugin-import";
import jsxA11Y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-plugin-prettier";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import tseslint from "@typescript-eslint/eslint-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: eslint.configs.recommended,
  allConfig: eslint.configs.all,
});

export default [
  {
    ignores: [
      "eslint.config.mjs",
      "dist/**/*",
      "node_modules/**/*",
      "coverage/**/*",
      "build/**/*",
      ".next/**/*",
      "public/**/*",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
      ".cache/**/*",
    ],
  },
  eslint.configs.recommended,
  ...fixupConfigRules(
    compat.extends(
      "plugin:react/recommended",
      "plugin:react-hooks/recommended",
      "plugin:jsx-a11y/recommended",
      "plugin:prettier/recommended"
    )
  ),
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx", "**/__tests__/**/*"],
    plugins: {
      react: fixupPluginRules(react),
      "react-hooks": fixupPluginRules(reactHooks),
      "unused-imports": unusedImports,
      import: fixupPluginRules(importPlugin),
      "@typescript-eslint": tseslint,
      "jsx-a11y": fixupPluginRules(jsxA11Y),
      prettier: fixupPluginRules(prettier),
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        typescript: true,
        node: true,
      },
    },
    rules: {
      "no-console": "off",
      "no-debugger": "error",
      "no-alert": "warn",
      "no-unused-vars": "off",

      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "none",
          ignoreRestSiblings: true,
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
      "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",

      "react/prop-types": "off",
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "react/self-closing-comp": "warn",
      "react/jsx-boolean-value": ["warn", "never"],
      "react/jsx-curly-brace-presence": [
        "warn",
        { props: "never", children: "never" },
      ],
      "react/jsx-no-useless-fragment": "warn",
      "react/jsx-sort-props": [
        "warn",
        {
          callbacksLast: true,
          shorthandFirst: true,
          noSortAlphabetically: false,
          reservedFirst: true,
        },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/interactive-supports-focus": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/no-autofocus": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": "off",
      "import/order": [
        "warn",
        {
          groups: [
            "type",
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          pathGroups: [
            {
              pattern: "react",
              group: "builtin",
              position: "before",
            },
            {
              pattern: "@/**",
              group: "internal",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["react"],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "no-var": "error",
      "prefer-const": "error",
      "prefer-arrow-callback": "error",
      "arrow-spacing": "error",
      "comma-spacing": "error",
      "comma-style": "error",
      "computed-property-spacing": "error",
      "func-call-spacing": "error",
      "key-spacing": "error",
      "keyword-spacing": "error",
      "object-curly-spacing": ["error", "always"],
      "semi": ["error", "always"],
      "semi-spacing": "error",
      "space-before-blocks": "error",
      "space-before-function-paren": [
        "error",
        {
          anonymous: "always",
          named: "never",
          asyncArrow: "always",
        },
      ],
      "space-in-parens": "error",
      "space-infix-ops": "error",
      "space-unary-ops": "error",
      "spaced-comment": "error",
      "template-curly-spacing": "error",
      "no-trailing-spaces": "error",
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
      "eol-last": "error",
      "no-mixed-spaces-and-tabs": "error",
      "prettier/prettier": "warn",
      indent: "off",
      quotes: "off",
      "max-len": "off",
      "padding-line-between-statements": [
        "warn",
        {
          blankLine: "always",
          prev: "*",
          next: "return",
        },
        {
          blankLine: "always",
          prev: ["const", "let", "var"],
          next: "*",
        },
        {
          blankLine: "any",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"],
        },
      ],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx", "**/__tests__/**/*"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
      },
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        // No usar project para archivos de test ya que están excluidos del tsconfig.json
      },
    },
    plugins: {
      react: fixupPluginRules(react),
      "react-hooks": fixupPluginRules(reactHooks),
      "@typescript-eslint": tseslint,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      // Deshabilitar reglas que requieren type checking para archivos de test
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
      // Reglas de React para archivos de test
      "react/prop-types": "off",
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      // Deshabilitar reglas de variables no usadas para parámetros de funciones mock
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "none",
          ignoreRestSiblings: true,
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["**/migrations/**/*.ts", "**/migrations/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },
];
