// //jest.config.js
// module.exports = {
//   preset: 'ts-jest',
//   testEnvironment: 'node',
//   testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
//   setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
//   moduleNameMapper: {
//     '^@/(.*)$': '<rootDir>/$1',
//   },
//   // silent: true, // เพิ่มบรรทัดนี้
// };

//jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Add global setup to ensure types are loaded
  globals: {
    'ts-jest': {
      tsconfig: {
        types: ['jest', 'node'],
        typeRoots: ['./node_modules/@types', './types']
      }
    }
  },
  // silent: true, // เพิ่มบรรทัดนี้ถ้าต้องการซ่อน console output
};