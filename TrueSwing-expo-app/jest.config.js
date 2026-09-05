module.exports = {
  // The first test in a file pays the cold Babel transform of the React Native tree,
  // because CI persists the npm cache but not Jest's transform cache. That is ~3s on a
  // fast machine and over Jest's 5s default on CI runners, which failed PaywallModal's
  // purchase test. The cost is one-time and bounded, so headroom is the fix.
  testTimeout: 20000,
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Mirror app.json tsconfigPaths: bare imports resolve from project root.
    '^lib/(.*)$': '<rootDir>/lib/$1',
    '^features/(.*)$': '<rootDir>/features/$1',
  },
};
