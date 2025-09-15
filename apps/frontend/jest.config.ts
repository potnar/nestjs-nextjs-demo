// apps/frontend/jest.config.ts
import nextJest from 'next/jest';
import type { Config } from 'jest';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/src/**/__tests__/**/*.(test|spec).(ts|tsx)'],

  // ⬇️ Kluczowe: pozwól transformować ESM w node_modules
  transformIgnorePatterns: [
    '/node_modules/(?!next-intl|use-intl|intl-messageformat|@formatjs/icu-messageformat-parser)/',
  ],
};

export default createJestConfig(config);
