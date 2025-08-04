const nextJest = require("next/jest")

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  testMatch: ["**/__tests__/**/*.test.(ts|tsx|js)"],
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@/app/(.*)$": "<rootDir>/app/$1",
    "^@/components/(.*)$": "<rootDir>/components/$1",
    "^@/lib/(.*)$": "<rootDir>/lib/$1",
    "^@/types/(.*)$": "<rootDir>/types/$1",
  },
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {
      tsconfig: "tsconfig.json"
    }]
  },
  transformIgnorePatterns: [
    "node_modules/(?!(next|@next|@auth|@prisma)/)"
  ],
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/"
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json"
    }
  },
  // Handle async operations in tests
  testTimeout: 10000,
  // Setup for Next.js API routes
  testEnvironmentOptions: {
    url: "http://localhost:3000"
  }
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
