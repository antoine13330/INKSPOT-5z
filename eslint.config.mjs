import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '**/*.config.js',
      '**/*.config.mjs',
      '**/*.config.ts',
      'prisma/**',
      'scripts/**',
      'docs-astro/**',
      'public/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        ...globals.serviceworker,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-undef': 'off',
    },
  },
  {
    files: ['**/__tests__/**', '**/*.test.*', '**/*.spec.*'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  }
)
