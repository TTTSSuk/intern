// jest.setup.js
// ---------------- Mock MongoDB Functions ----------------
const mockToArray = jest.fn();
const mockSort = jest.fn(() => ({ toArray: mockToArray }));
const mockProject = jest.fn(() => ({ sort: mockSort }));
const mockFind = jest.fn(() => ({ sort: mockSort, project: mockProject }));
const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockInsertOne = jest.fn();

const mockCollection = jest.fn(() => ({
  find: mockFind,
  findOne: mockFindOne,
  updateOne: mockUpdateOne,
  insertOne: mockInsertOne,
}));

const mockDb = jest.fn(() => ({
  collection: mockCollection,
}));


const mockClient = {
  db: mockDb,
  connect: jest.fn(async function () {
    return this;
  }),
};

// ---------------- Mock ObjectId ----------------
const MockObjectId = jest.fn().mockImplementation((id) => ({
  toString: () => id || 'mock-id',
}));
MockObjectId.isValid = jest.fn().mockReturnValue(true);

// ---------------- Mock mongodb package ----------------
jest.doMock('mongodb', () => ({
  MongoClient: jest.fn(() => mockClient),
  ObjectId: MockObjectId,
}));

// ---------------- Mock clientPromise ----------------
jest.doMock('@/lib/mongodb', () => Promise.resolve(mockClient));

// ---------------- Export mocks globally ----------------
global.__mongoMocks = {
  mockToArray,
  mockSort,
  mockProject,
  mockFind,
  mockFindOne,
  mockUpdateOne,
  mockInsertOne,
  mockCollection,
  mockDb,
  mockClient,
  MockObjectId,
};
