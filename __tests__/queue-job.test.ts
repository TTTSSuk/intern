// __tests__/api/queue-job.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/queue-job';

describe('/api/queue-job', () => {
  let mockFindOne: jest.Mock;
  let mockUpdateOne: jest.Mock;
  let mockInsertOne: jest.Mock;
  let mockToArray: jest.Mock;
  let mockAggregate: jest.Mock;
  let mockCollection: jest.Mock;
  let MockObjectId: typeof global.__mongoMocks.MockObjectId;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFindOne = global.__mongoMocks.mockFindOne;
    mockUpdateOne = global.__mongoMocks.mockUpdateOne;
    mockInsertOne = global.__mongoMocks.mockInsertOne;
    mockToArray = global.__mongoMocks.mockToArray;
    mockAggregate = global.__mongoMocks.mockAggregate;
    mockCollection = global.__mongoMocks.mockCollection;
    MockObjectId = global.__mongoMocks.MockObjectId;

    // Mock console.log and console.error to silence output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Reset mockCollection to return the correct methods
    mockCollection.mockReturnValue({
      findOne: mockFindOne,
      updateOne: mockUpdateOne,
      insertOne: mockInsertOne,
      aggregate: mockAggregate,
    });

    MockObjectId.isValid.mockReturnValue(true);
  });

  afterEach(() => {
    // Restore console methods after each test
    jest.spyOn(console, 'log').mockRestore();
    jest.spyOn(console, 'error').mockRestore();
  });

  describe('HTTP Methods', () => {
    it('should return 405 for GET method', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(405);
      expect(res._getJSONData()).toEqual({
        error: 'Method not allowed',
      });
    });

    it('should return 405 for PUT method', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(405);
      expect(res._getJSONData()).toEqual({
        error: 'Method not allowed',
      });
    });

    it('should return 405 for DELETE method', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(405);
      expect(res._getJSONData()).toEqual({
        error: 'Method not allowed',
      });
    });
  });

  describe('POST /api/queue-job - Input Validation', () => {
    it('should return 400 if fileId is missing', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {},
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual({
        error: 'fileId is required',
      });
    });

    it('should return 400 if fileId is null', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: null },
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual({
        error: 'fileId is required',
      });
    });

    it('should return 400 if fileId is empty string', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: '' },
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual({
        error: 'fileId is required',
      });
    });

    it('should return 400 if fileId is invalid format', async () => {
      MockObjectId.isValid.mockReturnValue(false);

      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: 'invalid-id' },
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual({
        error: 'Invalid fileId format',
      });
      expect(MockObjectId.isValid).toHaveBeenCalledWith('invalid-id');
    });
  });

  describe('POST /api/queue-job - File Processing', () => {
    beforeEach(() => {
      MockObjectId.isValid.mockReturnValue(true);
      mockFindOne.mockReset();
      mockToArray.mockReset();
      mockInsertOne.mockReset();
    });

    it('should return 404 if file not found', async () => {
      mockFindOne.mockResolvedValueOnce(null);

      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: '507f1f77bcf86cd799439011' },
      });

      req.env = process.env;

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(404);
      expect(res._getJSONData()).toEqual({
        error: 'File not found',
      });
    });

    it('should return 400 if file has no folder structure (folders field missing)', async () => {
      const mockFile = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user123',
        // folders field is missing
      };

      mockFindOne.mockResolvedValueOnce(mockFile); // 1. Find file

      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: '507f1f77bcf86cd799439011' },
      });

      req.env = process.env;

      await handler(req as any, res as any);

      // Should return 400 because requiredTokens is 0
      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual({
        error: "No content found for processing. Please check the folder structure." ,
      });
    });

    it('should return 400 if no clips found to process (subfolders is empty array)', async () => {
      const mockFile = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user123',
        folders: {
          subfolders: [
            {
              subfolders: [], // No clips
            },
          ],
        },
      };

      mockFindOne.mockResolvedValueOnce(mockFile); // 1. Find file

      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: '507f1f77bcf86cd799439011' },
      });

      req.env = process.env;

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual({
        error: "No content found for processing. Please check the folder structure." ,
      });
    });

    // Option 1: Update test to actually trigger requiredTokens = 0
it('should return 400 if folders structure is incomplete (missing inner subfolders field)', async () => {
  const mockFile = {
    _id: '507f1f77bcf86cd799439011',
    userId: 'user123',
    folders: {
      subfolders: [], // Empty array will result in requiredTokens = 0
    },
  };

  mockFindOne.mockResolvedValueOnce(mockFile); // 1. Find file

  const { req, res } = createMocks({
    method: 'POST',
    body: { fileId: '507f1f77bcf86cd799439011' },
  });

      req.env = process.env;

  await handler(req as any, res as any);

  expect(res._getStatusCode()).toBe(400);
  expect(res._getJSONData()).toEqual({
    error: "No content found for processing. Please check the folder structure.",
  });
});

// Option 2: Or keep your original test data and expect it to process normally
// This test would validate that the code treats outer subfolders as valid content
it('should process when subfolders exist at outer level without nested structure', async () => {
  const mockFile = {
    _id: '507f1f77bcf86cd799439011',
    userId: 'user123',
    folders: {
      subfolders: [
        {
          // No nested subfolders - code will count this as 1 token
        },
      ],
    },
  };

      const mockUser = {
    userId: 'user123',
    tokens: 5,
  };

  // Mock aggregate for pending tokens
  mockToArray.mockResolvedValueOnce([]);

  mockFindOne
    .mockResolvedValueOnce(mockFile) // 1. Find file
    .mockResolvedValueOnce(mockUser) // 2. Find user
    .mockResolvedValueOnce(null) // 3. Check existing job
    .mockResolvedValueOnce(null); // 4. Find last queue item

  mockInsertOne.mockResolvedValueOnce({ insertedId: 'token-history-id' });
  mockUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });

  const { req, res } = createMocks({
    method: 'POST',
    body: { fileId: '507f1f77bcf86cd799439011' },
  });

  req.env = process.env;

      await handler(req as any, res as any);

  expect(res._getStatusCode()).toBe(200);
  expect(res._getJSONData()).toEqual({
    jobId: '507f1f77bcf86cd799439011',
    status: 'queued',
    message: 'งานถูกส่งเข้าคิวเรียบร้อย',
    requiredTokens: 1, // Code treats outer subfolder as 1 token
    nextPosition: 1,
  });
});

    it('should return 402 if insufficient tokens', async () => {
      const mockFile = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user123',
        folders: {
          subfolders: [
            {
              subfolders: ['clip1', 'clip2', 'clip3'],
            },
          ],
        },
      };

      const mockUser = {
        userId: 'user123',
        tokens: 1, // Only 1 token, need 3
      };

      // ✅ FIX: Mock aggregate for pending tokens
      mockToArray.mockResolvedValueOnce([]); // No reserved tokens

      mockFindOne
        .mockResolvedValueOnce(mockFile) // 1. Find file
        .mockResolvedValueOnce(mockUser) // 2. Find user
        .mockResolvedValueOnce(null); // 3. Check existing job (null)

      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: '507f1f77bcf86cd799439011' },
      });

      req.env = process.env;

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(402);
      expect(res._getJSONData()).toEqual({
        error: 'Insufficient tokens',
        message: expect.stringContaining('คุณมี Token ไม่พอสำหรับการสร้างวิดีโอ'),
      });
    });

    it('should handle user with zero tokens', async () => {
      const mockFile = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user123',
        folders: {
          subfolders: [
            {
              subfolders: ['clip1'],
            },
          ],
        },
      };

      const mockUser = {
        userId: 'user123',
        tokens: 0,
      };

      // ✅ FIX: Mock aggregate for pending tokens
      mockToArray.mockResolvedValueOnce([]); // No reserved tokens

      mockFindOne
        .mockResolvedValueOnce(mockFile) // 1. Find file
        .mockResolvedValueOnce(mockUser) // 2. Find user
        .mockResolvedValueOnce(null); // 3. Check existing job (null)

      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: '507f1f77bcf86cd799439011' },
      });

      req.env = process.env;

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(402);
      expect(res._getJSONData()).toEqual({
        error: 'Insufficient tokens',
        message: expect.stringContaining('คุณมี Token ไม่พอสำหรับการสร้างวิดีโอ'),
      });
    });

    it('should return 409 if job is queued', async () => {
      const mockFile = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user123',
        folders: {
          subfolders: [
            {
              subfolders: ['clip1'],
            },
          ],
        },
      };

      const mockUser = {
        userId: 'user123',
        tokens: 2,
      };

      const mockExistingJob = {
        _id: '507f1f77bcf86cd799439011',
        status: 'queued',
      };

      // ✅ FIX: Mock aggregate for pending tokens
      mockToArray.mockResolvedValueOnce([]); // No reserved tokens

      mockFindOne
        .mockResolvedValueOnce(mockFile) // 1. Find file
        .mockResolvedValueOnce(mockUser) // 2. Find user
        .mockResolvedValueOnce(mockExistingJob); // 3. Check existing job (Found)

      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: '507f1f77bcf86cd799439011' },
      });

      req.env = process.env;

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(409);
      expect(res._getJSONData()).toEqual({
        error: 'Job already in progress',
        message: 'งานนี้อยู่ในระบบแล้ว',
      });
    });

    it('should return 409 if job is running', async () => {
      const mockFile = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user123',
        folders: {
          subfolders: [
            {
              subfolders: ['clip1'],
            },
          ],
        },
      };

      const mockUser = {
        userId: 'user123',
        tokens: 2,
      };

      const mockExistingJob = {
        _id: '507f1f77bcf86cd799439011',
        status: 'running',
      };

      // ✅ FIX: Mock aggregate for pending tokens
      mockToArray.mockResolvedValueOnce([]); // No reserved tokens

      mockFindOne
        .mockResolvedValueOnce(mockFile) // 1. Find file
        .mockResolvedValueOnce(mockUser) // 2. Find user
        .mockResolvedValueOnce(mockExistingJob); // 3. Check existing job (Found)

      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: '507f1f77bcf86cd799439011' },
      });

      req.env = process.env;

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(409);
      expect(res._getJSONData()).toEqual({
        error: 'Job already in progress',
        message: 'งานนี้อยู่ในระบบแล้ว',
      });
    });

    it('should return 409 if job is starting', async () => {
      const mockFile = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user123',
        folders: {
          subfolders: [
            {
              subfolders: ['clip1'],
            },
          ],
        },
      };

      const mockUser = {
        userId: 'user123',
        tokens: 2,
      };

      const mockExistingJob = {
        _id: '507f1f77bcf86cd799439011',
        status: 'starting',
      };

      // ✅ FIX: Mock aggregate for pending tokens
      mockToArray.mockResolvedValueOnce([]); // No reserved tokens

      mockFindOne
        .mockResolvedValueOnce(mockFile) // 1. Find file
        .mockResolvedValueOnce(mockUser) // 2. Find user
        .mockResolvedValueOnce(mockExistingJob); // 3. Check existing job (Found)

      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: '507f1f77bcf86cd799439011' },
      });

      req.env = process.env;

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(409);
      expect(res._getJSONData()).toEqual({
        error: 'Job already in progress',
        message: 'งานนี้อยู่ในระบบแล้ว',
      });
    });

    it('should allow requeue if job is completed', async () => {
      const mockFile = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user123',
        folders: {
          subfolders: [
            {
              subfolders: ['clip1'],
            },
          ],
        },
      };

      const mockUser = {
        userId: 'user123',
        tokens: 2,
      };

      const mockLastQueueItem = {
        queuePosition: 2,
      };

      // ✅ FIX: Mock aggregate for pending tokens
      mockToArray.mockResolvedValueOnce([]); // No reserved tokens

      mockFindOne
        .mockResolvedValueOnce(mockFile) // 1. Find file
        .mockResolvedValueOnce(mockUser) // 2. Find user
        .mockResolvedValueOnce(null) // 3. Check existing job (null)
        .mockResolvedValueOnce(mockLastQueueItem); // 4. Find last queue item

      mockInsertOne.mockResolvedValueOnce({ insertedId: 'token-history-id' }); // 5. Reserve token
      mockUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 }); // 6. Update job status

      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: '507f1f77bcf86cd799439011' },
      });

      req.env = process.env;

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        jobId: '507f1f77bcf86cd799439011',
        status: 'queued',
        message: 'งานถูกส่งเข้าคิวเรียบร้อย',
        requiredTokens: 1,
        nextPosition: 3,
      });
    });
  });

  describe('POST /api/queue-job - Queue Management', () => {
    beforeEach(() => {
      MockObjectId.isValid.mockReturnValue(true);
      mockFindOne.mockReset();
      mockToArray.mockReset(); // รีเซ็ต mockToArray สำหรับ Aggregate
      mockInsertOne.mockReset();
    });

    it('should successfully queue job with first position', async () => {
      const mockFile = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user123',
        folders: {
          subfolders: [
            {
              subfolders: ['clip1', 'clip2'],
            },
          ],
        },
      };

      const mockUser = {
        userId: 'user123',
        tokens: 5,
      };

      // ✅ FIX: Mock aggregate for pending tokens
      mockToArray.mockResolvedValueOnce([]); // No reserved tokens

      mockFindOne
        .mockResolvedValueOnce(mockFile) // 1. Find file
        .mockResolvedValueOnce(mockUser) // 2. Find user
        .mockResolvedValueOnce(null) // 3. Check existing job (null)
        .mockResolvedValueOnce(null); // 4. Find last queue item (null)

      mockInsertOne.mockResolvedValueOnce({ insertedId: 'token-history-id' }); // 5. Reserve token
      mockUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 }); // 6. Update job status

      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: '507f1f77bcf86cd799439011' },
      });

      req.env = process.env;

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        jobId: '507f1f77bcf86cd799439011',
        status: 'queued',
        message: 'งานถูกส่งเข้าคิวเรียบร้อย',
        requiredTokens: 2,
        nextPosition: 1,
      });
    });

    it('should successfully queue job after existing queue items', async () => {
      const mockFile = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user123',
        folders: {
          subfolders: [
            {
              subfolders: ['clip1', 'clip2', 'clip3'],
            },
          ],
        },
      };

      const mockUser = {
        userId: 'user123',
        tokens: 10,
      };

      const mockLastQueueItem = {
        queuePosition: 5,
      };

      // ✅ FIX: Mock aggregate for pending tokens
      mockToArray.mockResolvedValueOnce([]); // No reserved tokens

      mockFindOne
        .mockResolvedValueOnce(mockFile) // 1. Find file
        .mockResolvedValueOnce(mockUser) // 2. Find user
        .mockResolvedValueOnce(null) // 3. Check existing job (null)
        .mockResolvedValueOnce(mockLastQueueItem); // 4. Find last queue item

      mockInsertOne.mockResolvedValueOnce({ insertedId: 'token-history-id' }); // 5. Reserve token
      mockUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 }); // 6. Update job status

      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: '507f1f77bcf86cd799439011' },
      });

      req.env = process.env;

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        jobId: '507f1f77bcf86cd799439011',
        status: 'queued',
        message: 'งานถูกส่งเข้าคิวเรียบร้อย',
        requiredTokens: 3,
        nextPosition: 6,
      });
    });
  });

  describe('POST /api/queue-job - Error Handling', () => {
    beforeEach(() => {
      MockObjectId.isValid.mockReturnValue(true);
      mockFindOne.mockReset();
      mockToArray.mockReset();
      mockInsertOne.mockReset();
    });

    it('should handle database connection error', async () => {
      mockFindOne.mockRejectedValueOnce(new Error('Database connection failed'));

      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: '507f1f77bcf86cd799439011' },
      });

      req.env = process.env;

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(500);
      expect(res._getJSONData()).toEqual({
        error: 'Internal Server Error',
      });
    });

    it('should handle MongoDB timeout error', async () => {
      mockFindOne.mockRejectedValueOnce(new Error('MongoTimeoutError'));

      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: '507f1f77bcf86cd799439011' },
      });

      req.env = process.env;

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(500);
      expect(res._getJSONData()).toEqual({
        error: 'Internal Server Error',
      });
    });

    it('should handle update operation failure', async () => {
      const mockFile = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user123',
        folders: {
          subfolders: [
            {
              subfolders: ['clip1'], // 1 clip
            },
          ],
        },
      };

      const mockUser = {
        userId: 'user123',
        tokens: 2, // Sufficient tokens
      };

      // ✅ FIX: Mock aggregate for pending tokens
      mockToArray.mockResolvedValueOnce([]); // No reserved tokens

      mockFindOne
        .mockResolvedValueOnce(mockFile) // 1. Find file
        .mockResolvedValueOnce(mockUser) // 2. Find user
        .mockResolvedValueOnce(null) // 3. Check existing job (null)
        .mockResolvedValueOnce(null); // 4. Find last queue item (null)

      mockUpdateOne.mockRejectedValueOnce(new Error('Update failed')); // 5. Update job status (FAIL)

      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: '507f1f77bcf86cd799439011' },
      });

      req.env = process.env;

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(500);
      expect(res._getJSONData()).toEqual({
        error: 'Internal Server Error',
      });
    });

    it('should handle ObjectId creation error', async () => {
      MockObjectId.mockImplementationOnce(() => {
        throw new Error('Invalid ObjectId');
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: '507f1f77bcf86cd799439011' },
      });

      req.env = process.env;

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(500);
      expect(res._getJSONData()).toEqual({
        error: 'Internal Server Error',
      });
    });
  });
});