//jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // ต้องเป็น jsdom สำหรับ React component
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|scss|sass)$': 'identity-obj-proxy', // สำหรับ import CSS
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        types: ['jest', 'node', 'react'],
        jsx: 'react-jsx', // สำหรับ JSX/TSX
      },
    },
  },
};


// module.exports = {
//   preset: 'ts-jest',
//   testEnvironment: 'node',
//   testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts','**/__tests__/**/*.tsx',],
//   setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
//   moduleNameMapper: {
//     '^@/(.*)$': '<rootDir>/$1',
//   },
//   // Add global setup to ensure types are loaded
//   globals: {
//     'ts-jest': {
//       tsconfig: {
//         types: ['jest', 'node'],
//         typeRoots: ['./node_modules/@types', './types']
//       }
//     }
//   },
//   // silent: true, // เพิ่มบรรทัดนี้ถ้าต้องการซ่อน console output
// };


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
