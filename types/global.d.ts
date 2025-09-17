// types/global.d.ts (หรือไฟล์ global.d.ts ที่คุณมีอยู่แล้ว)

import { NextApiRequest as NextRequest, NextApiResponse as NextResponse } from 'next';
import { Request as MockRequest, Response as MockResponse } from 'node-mocks-http';

declare module 'next' {
  // Use a utility type to merge the properties without conflicts
  type MockedRequest = MockRequest & {
    query: NextRequest['query'];
    cookies: NextRequest['cookies'];
    body: NextRequest['body'];
    env: NodeJS.ProcessEnv; 
  };

  type MockedResponse = MockResponse & {
    send: NextResponse['send'];
    json: NextResponse['json'];
    status: NextResponse['status'];
    redirect: NextResponse['redirect'];
    end: NextResponse['end'];
    setHeader: NextResponse['setHeader'];
    // เพิ่มคุณสมบัติสำหรับ mock จาก node-mocks-http
    _getStatusCode: () => number;
    _getHeaders: () => Record<string, string | number | string[]>;
    _getJSONData: () => any;
  };

  export interface NextApiRequest extends MockedRequest {}
  export interface NextApiResponse extends MockedResponse {}
}

declare global {
  namespace NodeJS {
    interface Global {
      __mongoMocks: {
        mockToArray: jest.Mock;
        mockSort: jest.Mock;
        mockProject: jest.Mock;
        mockFind: jest.Mock;
        mockFindOne: jest.Mock;
        mockUpdateOne: jest.Mock;
        mockInsertOne: jest.Mock;
        mockCollection: jest.Mock;
        mockDb: jest.Mock;
        mockClient: any;
        MockObjectId: jest.Mock & { isValid: jest.Mock };
      };
    }
  }

  var __mongoMocks: {
    mockToArray: jest.Mock;
    mockSort: jest.Mock;
    mockProject: jest.Mock;
    mockFind: jest.Mock;
    mockFindOne: jest.Mock;
    mockUpdateOne: jest.Mock;
    mockInsertOne: jest.Mock;
    mockCollection: jest.Mock;
    mockDb: jest.Mock;
    mockClient: any;
    MockObjectId: jest.Mock & { isValid: jest.Mock };
  };
}

export {};

// // // types/global.d.ts
// import { NextApiRequest as NextRequest, NextApiResponse as NextResponse } from 'next';
// import { Request as MockRequest, Response as MockResponse } from 'node-mocks-http';

// // Correctly extend the Next.js types with properties from node-mocks-http
// declare module 'next' {
//   // Use a utility type to merge the properties without conflicts
//   type MockedRequest = MockRequest & {
//     query: NextRequest['query'];
//     cookies: NextRequest['cookies'];
//     body: NextRequest['body'];
//     env: NodeJS.ProcessEnv; // Fix for missing 'env' property
//   };

//   type MockedResponse = MockResponse & {
//     send: NextApiResponse['send'];
//     json: NextApiResponse['json'];
//     status: NextApiResponse['status'];
//     redirect: NextApiResponse['redirect'];
//     end: NextApiResponse['end'];
//     setHeader: NextApiResponse['setHeader'];
//   };

//   export interface NextApiRequest extends MockedRequest {}
//   export interface NextApiResponse extends MockedResponse {}
// }

// declare global {
//   namespace NodeJS {
//     interface Global {
//       __mongoMocks: {
//         mockToArray: jest.Mock;
//         mockSort: jest.Mock;
//         mockProject: jest.Mock;
//         mockFind: jest.Mock;
//         mockFindOne: jest.Mock;
//         mockUpdateOne: jest.Mock;
//         mockInsertOne: jest.Mock;
//         mockCollection: jest.Mock;
//         mockDb: jest.Mock;
//         mockClient: any;
//         MockObjectId: jest.Mock & { isValid: jest.Mock };
//       };
//     }
//   }

//   var __mongoMocks: {
//     mockToArray: jest.Mock;
//     mockSort: jest.Mock;
//     mockProject: jest.Mock;
//     mockFind: jest.Mock;
//     mockFindOne: jest.Mock;
//     mockUpdateOne: jest.Mock;
//     mockInsertOne: jest.Mock;
//     mockCollection: jest.Mock;
//     mockDb: jest.Mock;
//     mockClient: any;
//     MockObjectId: jest.Mock & { isValid: jest.Mock };
//   };
// }

// export {};
// declare global {
//   namespace NodeJS {
//     interface Global {
//       __mongoMocks: {
//         mockToArray: jest.Mock;
//         mockSort: jest.Mock;
//         mockProject: jest.Mock;
//         mockFind: jest.Mock;
//         mockFindOne: jest.Mock;
//         mockUpdateOne: jest.Mock;
//         mockInsertOne: jest.Mock;
//         mockCollection: jest.Mock;
//         mockDb: jest.Mock;
//         mockClient: any;
//         MockObjectId: jest.Mock & { isValid: jest.Mock };
//       };
//     }
//   }

//   var __mongoMocks: {
//     mockToArray: jest.Mock;
//     mockSort: jest.Mock;
//     mockProject: jest.Mock;
//     mockFind: jest.Mock;
//     mockFindOne: jest.Mock;
//     mockUpdateOne: jest.Mock;
//     mockInsertOne: jest.Mock;
//     mockCollection: jest.Mock;
//     mockDb: jest.Mock;
//     mockClient: any;
//     MockObjectId: jest.Mock & { isValid: jest.Mock };
//   };
// }

// export {};