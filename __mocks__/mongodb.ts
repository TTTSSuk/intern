// **mocks**/mongodb.ts

// ---------------- Mock Functions ----------------
const mockToArray = jest.fn<Promise<any[]>, []>();
const mockSort = jest.fn(() => ({ toArray: mockToArray }));
const mockFind = jest.fn(() => ({ sort: mockSort }));
const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();

const mockCollection = jest.fn(() => ({
  find: mockFind,
  findOne: mockFindOne,
  updateOne: mockUpdateOne,
}));

const mockDb = jest.fn(() => ({
  collection: mockCollection,
}));

// ---------------- Mock Client ----------------
const mockClient = {
  db: mockDb,
  connect: jest.fn(async function() { return this; }),
};

// ---------------- Mock MongoClient Constructor ----------------
function MockMongoClient(uri?: string, options?: any) {
  return mockClient;
}

// Ensure it works with 'new' operator
MockMongoClient.prototype = {};

// ---------------- Export everything ----------------
export {
  MockMongoClient as MongoClient,
  mockClient,
  mockDb,
  mockCollection,
  mockFind,
  mockSort,
  mockToArray,
  mockFindOne,
  mockUpdateOne,
};

// Export other MongoDB types that might be needed
export const ObjectId = jest.fn().mockImplementation((id?: string) => ({
  toString: () => id || 'mock-object-id',
}));

// Add static methods to ObjectId
(ObjectId as any).isValid = jest.fn().mockReturnValue(true);