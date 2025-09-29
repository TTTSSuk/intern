// __tests__/api/queue-job.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/queue-job';

describe('/api/queue-job', () => {
  let mockFindOne: jest.Mock;
  let mockUpdateOne: jest.Mock;
  let mockCollection: jest.Mock;
  let MockObjectId: typeof global.__mongoMocks.MockObjectId;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFindOne = global.__mongoMocks.mockFindOne;
    mockUpdateOne = global.__mongoMocks.mockUpdateOne;
    mockCollection = global.__mongoMocks.mockCollection;
    MockObjectId = global.__mongoMocks.MockObjectId;

    // Mock console.log and console.error to silence output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Reset mockCollection to return the correct methods
    mockCollection.mockReturnValue({
      findOne: mockFindOne,
      updateOne: mockUpdateOne,
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
      expect(mockFindOne).toHaveBeenCalledWith({ _id: expect.any(Object) });
    });

    it('should return 400 if file has no folder structure', async () => {
      const mockFile = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user123',
        // folders field is missing
      };

      mockFindOne.mockResolvedValueOnce(mockFile);

      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: '507f1f77bcf86cd799439011' },
      });

      req.env = process.env;

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual({
        error: 'No clips found to process in the file structure.',
      });
    });

    it('should return 400 if no clips found to process', async () => {
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

      mockFindOne.mockResolvedValueOnce(mockFile);

      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: '507f1f77bcf86cd799439011' },
      });

      req.env = process.env;

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual({
        error: 'No clips found to process in the file structure.',
      });
    });

    it('should return 400 if folders structure is incomplete', async () => {
      const mockFile = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user123',
        folders: {
          subfolders: [
            {
              // subfolders field is missing
            },
          ],
        },
      };

      mockFindOne.mockResolvedValueOnce(mockFile);

      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: '507f1f77bcf86cd799439011' },
      });

      req.env = process.env;

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual({
        error: 'No clips found to process in the file structure.',
      });
    });
  });

  describe('POST /api/queue-job - User Token Validation', () => {
    beforeEach(() => {
      MockObjectId.isValid.mockReturnValue(true);
      // Reset mockFindOne for each test to avoid interference
      mockFindOne.mockReset();
    });

    it('should return 404 if user not found', async () => {
      const mockFile = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user123',
        folders: {
          subfolders: [
            {
              subfolders: ['clip1', 'clip2', 'clip3'], // 3 clips
            },
          ],
        },
      };

      mockFindOne
        .mockResolvedValueOnce(mockFile) // File found
        .mockResolvedValueOnce(null); // User not found

      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: '507f1f77bcf86cd799439011' },
      });

      req.env = process.env;

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(404);
      expect(res._getJSONData()).toEqual({
        error: 'User not found',
      });
    });

    it('should return 402 if insufficient tokens', async () => {
      const mockFile = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user123',
        folders: {
          subfolders: [
            {
              subfolders: ['clip1', 'clip2', 'clip3'], // 3 clips required
            },
          ],
        },
      };

      const mockUser = {
        userId: 'user123',
        tokens: 1, // Only 1 token, need 3
      };

      mockFindOne
        .mockResolvedValueOnce(mockFile) // File found
        .mockResolvedValueOnce(mockUser) // User found but insufficient tokens
        .mockResolvedValueOnce(null); // No existing job

      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: '507f1f77bcf86cd799439011' },
      });

      req.env = process.env;

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(402);
      expect(res._getJSONData()).toEqual({
        error: 'Insufficient tokens',
        message: 'คุณมี Token ไม่พอสำหรับการสร้างวิดีโอ ต้องใช้ 3 Token แต่คุณมีแค่ 1 Token',
      });
    });

    it('should handle user with zero tokens', async () => {
      const mockFile = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user123',
        folders: {
          subfolders: [
            {
              subfolders: ['clip1'], // 1 clip required
            },
          ],
        },
      };

      const mockUser = {
        userId: 'user123',
        tokens: 0, // Zero tokens
      };

      mockFindOne
        .mockResolvedValueOnce(mockFile) // File found
        .mockResolvedValueOnce(mockUser) // User found but zero tokens
        .mockResolvedValueOnce(null); // No existing job

      const { req, res } = createMocks({
        method: 'POST',
        body: { fileId: '507f1f77bcf86cd799439011' },
      });

      req.env = process.env;

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(402);
      expect(res._getJSONData()).toEqual({
        error: 'Insufficient tokens',
        message: 'คุณมี Token ไม่พอสำหรับการสร้างวิดีโอ ต้องใช้ 1 Token แต่คุณมีแค่ 0 Token',
      });
    });

    it('should return 409 if job is queued', async () => {
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

      const mockExistingJob = {
        _id: '507f1f77bcf86cd799439011',
        status: 'queued',
      };

      mockFindOne
        .mockResolvedValueOnce(mockFile) // File found
        .mockResolvedValueOnce(mockUser) // User found with sufficient tokens
        .mockResolvedValueOnce(mockExistingJob); // Job is queued

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
              subfolders: ['clip1'], // 1 clip
            },
          ],
        },
      };

      const mockUser = {
        userId: 'user123',
        tokens: 2, // Sufficient tokens
      };

      const mockExistingJob = {
        _id: '507f1f77bcf86cd799439011',
        status: 'running',
      };

      mockFindOne
        .mockResolvedValueOnce(mockFile) // File found
        .mockResolvedValueOnce(mockUser) // User found with sufficient tokens
        .mockResolvedValueOnce(mockExistingJob); // Job is running

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
              subfolders: ['clip1'], // 1 clip
            },
          ],
        },
      };

      const mockUser = {
        userId: 'user123',
        tokens: 2, // Sufficient tokens
      };

      const mockExistingJob = {
        _id: '507f1f77bcf86cd799439011',
        status: 'starting',
      };

      mockFindOne
        .mockResolvedValueOnce(mockFile) // File found
        .mockResolvedValueOnce(mockUser) // User found with sufficient tokens
        .mockResolvedValueOnce(mockExistingJob); // Job is starting

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
              subfolders: ['clip1'], // 1 clip
            },
          ],
        },
      };

      const mockUser = {
        userId: 'user123',
        tokens: 2, // Sufficient tokens
      };

      const mockLastQueueItem = {
        queuePosition: 2,
      };

      mockFindOne
        .mockResolvedValueOnce(mockFile) // File found
        .mockResolvedValueOnce(mockUser) // User found with sufficient tokens
        .mockResolvedValueOnce(null) // No job in progress
        .mockResolvedValueOnce(mockLastQueueItem); // Last queue item

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
        requiredTokens: 1,
        nextPosition: 3,
      });
    });
  });

  describe('POST /api/queue-job - Queue Management', () => {
    beforeEach(() => {
      MockObjectId.isValid.mockReturnValue(true);
      mockFindOne.mockReset();
    });

    it('should successfully queue job with first position', async () => {
      const mockFile = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user123',
        folders: {
          subfolders: [
            {
              subfolders: ['clip1', 'clip2'], // 2 clips
            },
          ],
        },
      };

      const mockUser = {
        userId: 'user123',
        tokens: 5, // Sufficient tokens
      };

      mockFindOne
        .mockResolvedValueOnce(mockFile) // File found
        .mockResolvedValueOnce(mockUser) // User found with sufficient tokens
        .mockResolvedValueOnce(null) // No existing job
        .mockResolvedValueOnce(null); // No last queue item (first in queue)

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
        requiredTokens: 2,
        nextPosition: 1,
      });

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { _id: expect.any(Object) },
        {
          $set: {
            status: 'queued',
            queuePosition: 1,
            updatedAt: expect.any(Date),
          },
          $unset: {
            executionId: '',
            startTime: '',
            error: '',
            executionIdHistory: '',
          },
        }
      );
    });

    it('should successfully queue job after existing queue items', async () => {
      const mockFile = {
        _id: '507f1f77bcf86cd799439011',
        userId: 'user123',
        folders: {
          subfolders: [
            {
              subfolders: ['clip1', 'clip2', 'clip3'], // 3 clips
            },
          ],
        },
      };

      const mockUser = {
        userId: 'user123',
        tokens: 10, // Sufficient tokens
      };

      const mockLastQueueItem = {
        queuePosition: 5, // There are already 5 items in queue
      };

      mockFindOne
        .mockResolvedValueOnce(mockFile) // File found
        .mockResolvedValueOnce(mockUser) // User found with sufficient tokens
        .mockResolvedValueOnce(null) // No existing job
        .mockResolvedValueOnce(mockLastQueueItem); // Last queue item

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
        requiredTokens: 3,
        nextPosition: 6,
      });

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { _id: expect.any(Object) },
        {
          $set: {
            status: 'queued',
            queuePosition: 6,
            updatedAt: expect.any(Date),
          },
          $unset: {
            executionId: '',
            startTime: '',
            error: '',
            executionIdHistory: '',
          },
        }
      );
    });
  });

  describe('POST /api/queue-job - Error Handling', () => {
    beforeEach(() => {
      MockObjectId.isValid.mockReturnValue(true);
      mockFindOne.mockReset();
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

      mockFindOne
        .mockResolvedValueOnce(mockFile) // File found
        .mockResolvedValueOnce(mockUser) // User found with sufficient tokens
        .mockResolvedValueOnce(null) // No existing job
        .mockResolvedValueOnce(null); // No last queue item

      mockUpdateOne.mockRejectedValueOnce(new Error('Update failed'));

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