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
      // Règles de base
      'prefer-const': 'warn',
      'no-console': 'warn',
      
      // Règles TypeScript plus permissives
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      
      // Règles générales plus permissives
      'no-undef': 'warn',
      'no-case-declarations': 'warn',
    },
    ignores: [
      'node_modules/',
      '.next/',
      'out/',
      'build/',
      'dist/',
      'coverage/',
      '__tests__/**/*', // Ignorer temporairement les tests
    ],
  },
];
