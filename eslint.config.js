const js = require('@eslint/js');
const nextPlugin = require('@next/eslint-plugin-next');
const tseslint = require('typescript-eslint');

module.exports = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      'prefer-const': 'warn',
      'no-console': 'warn',
    },
    ignores: [
      'node_modules/',
      '.next/',
      'out/',
      'build/',
      'dist/',
      'coverage/',
    ],
  },
];
