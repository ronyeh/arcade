module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // Changed from 'node' to 'jsdom'
  moduleNameMapper: {
    '^phaser$': '<rootDir>/node_modules/phaser/src/phaser.js', // Adjust if your phaser entry is different
    '^phaser3spectorjs$': '<rootDir>/__mocks__/phaser3spectorjs.js', // Mock for phaser3spectorjs
  },
  // transform: {
  //   '^.+\\.ts$': 'ts-jest',
  // },
};
