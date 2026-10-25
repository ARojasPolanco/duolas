import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import react from 'eslint-plugin-react';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/migrations/**',
      'package-lock.json',
    ],
  },
  js.configs.recommended,
  prettier,
  {
    files: ['apps/api/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['apps/web/**/*.{js,jsx}'],
    plugins: { react },
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
    },
  },
  {
    files: ['apps/web/*.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['packages/shared/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-empty': 'warn',
    },
  },
];
