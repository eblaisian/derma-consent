/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.ts', '!**/*.spec.ts', '!**/*.module.ts', '!main.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^otplib$': '<rootDir>/../test/__mocks__/otplib.ts',
    '^qrcode$': '<rootDir>/../test/__mocks__/qrcode.ts',
  },
};
