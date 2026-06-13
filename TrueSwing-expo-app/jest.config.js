module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Mirror app.json tsconfigPaths: bare imports resolve from project root.
    '^lib/(.*)$': '<rootDir>/lib/$1',
    '^features/(.*)$': '<rootDir>/features/$1',
  },
};
