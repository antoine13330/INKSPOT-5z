/** Jest config sans next/jest pour éviter les erreurs SWC bindings (Windows).
 *  Utilise ts-jest pour la transpilation TypeScript/JSX, sans dépendance aux binaires SWC.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          module: 'commonjs',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
    '<rootDir>/e2e/',
    '<rootDir>/__tests__/helpers/',
  ],
  collectCoverageFrom: [
    'lib/redis-cache.ts',
    'lib/validation.ts',
    'lib/performance-monitor.ts',
    'lib/notifications.ts',
    'lib/websocket-manager.ts',
    'lib/auth.ts',
    'hooks/usePaymentStatus.ts',
    'app/api/bookings/route.ts',
    'app/api/stripe/webhook/route.ts',
    'app/api/security/alerts/route.ts',
    'app/profile/page.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)'],
}
