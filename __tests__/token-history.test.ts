import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/users/token-history';

describe('/api/users/token-history', () => {
  let mockFindOne: jest.Mock;
  let mockFind: jest.Mock;
  let mockToArray: jest.Mock;
  let mockSort: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFindOne = global.__mongoMocks.mockFindOne;
    mockFind = global.__mongoMocks.mockFind;
    mockToArray = global.__mongoMocks.mockToArray;
    mockSort = global.__mongoMocks.mockSort;

    // ✅ Setup default mock chain for find().toArray()
    mockToArray.mockResolvedValue([]);
    mockSort.mockReturnValue({ toArray: mockToArray });
    mockFind.mockReturnValue({ 
      toArray: mockToArray,
      sort: mockSort 
    });

    // Mock console.log and console.error to silence output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.spyOn(console, 'log').mockRestore();
    jest.spyOn(console, 'error').mockRestore();
  });

  describe('GET /api/users/token-history', () => {
    it('should return 400 if userId is not provided', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {},
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual({
        message: 'userId is required'
      });
    });

    it('should return 400 if userId is not a string', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 123 },
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual({
        message: 'userId is required'
      });
    });

    it('should return empty data when user token document not found', async () => {
      // ✅ Mock findOne for user_tokens collection
      mockFindOne.mockResolvedValueOnce(null);

      // ✅ Mock find for token_history collection (reserved history)
      mockToArray
        .mockResolvedValueOnce([]) // First call: reserved history
        .mockResolvedValueOnce([]); // Second call: token history

      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'user123' },
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        tokens: 0,
        reservedTokens: 0,
        tokenHistory: [],
      });
      expect(mockFindOne).toHaveBeenCalledWith({ userId: 'user123' });
    });

    it('should return user tokens and history when found', async () => {
      const mockTokenDoc = {
        userId: 'user123',
        tokens: 50,
      };

      const mockReservedHistory = [
        {
          userId: 'user123',
          type: 'token_reserved',
          change: -2,
          fileName: 'video1.mp4'
        }
      ];

      const mockTokenHistory = [
        {
          date: new Date('2023-01-01'),
          change: 100,
          reason: 'เติม token',
          type: 'purchase'
        },
        {
          date: new Date('2023-01-02'),
          change: -50,
          reason: 'ใช้ token',
          type: 'usage'
        }
      ];

      // ✅ Mock findOne for user_tokens
      mockFindOne.mockResolvedValueOnce(mockTokenDoc);

      // ✅ Mock find().toArray() for reserved history and token history
      mockToArray
        .mockResolvedValueOnce(mockReservedHistory) // First call: reserved history
        .mockResolvedValueOnce(mockTokenHistory);    // Second call: token history

      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'user123' },
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        tokens: 50,
        reservedTokens: 2, // Math.abs(-2)
        tokenHistory: [
          { 
            date: '2023-01-01T00:00:00.000Z', 
            change: 100, 
            reason: 'เติม token',
            type: 'purchase',
            executionId: undefined,
            folderName: undefined,
            fileName: undefined,
            video: undefined
          },
          { 
            date: '2023-01-02T00:00:00.000Z', 
            change: -50, 
            reason: 'ใช้ token',
            type: 'usage',
            executionId: undefined,
            folderName: undefined,
            fileName: undefined,
            video: undefined
          },
        ],
      });
    });

    it('should calculate reserved tokens correctly', async () => {
      const mockTokenDoc = {
        userId: 'user123',
        tokens: 100,
      };

      const mockReservedHistory = [
        {
          userId: 'user123',
          type: 'token_reserved',
          change: -5, // จอง 5 tokens
          fileName: 'video1.mp4'
        },
        {
          userId: 'user123',
          type: 'token_reserved',
          change: -3, // จอง 3 tokens
          fileName: 'video2.mp4'
        },
        {
          userId: 'user123',
          type: 'token_released',
          change: 2, // ปล่อย 2 tokens
          fileName: 'video1.mp4'
        }
      ];

      mockFindOne.mockResolvedValueOnce(mockTokenDoc);
      mockToArray
        .mockResolvedValueOnce(mockReservedHistory) // Reserved history
        .mockResolvedValueOnce([]); // Token history

      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'user123' },
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      // -5 + -3 + 2 = -6, Math.abs(-6) = 6
      expect(res._getJSONData().reservedTokens).toBe(6);
    });

    it('should handle tokens field with fallback to 0', async () => {
      const mockTokenDoc = {
        userId: 'user123',
        // tokens field is missing
      };

      mockFindOne.mockResolvedValueOnce(mockTokenDoc);
      mockToArray
        .mockResolvedValueOnce([]) // Reserved history
        .mockResolvedValueOnce([
          {
            date: new Date('2023-01-01'),
            change: 100,
            reason: 'เติม token',
            type: 'purchase'
          }
        ]); // Token history

      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'user123' },
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData().tokens).toBe(0);
    });

    it('should handle tokenHistory field with fallback to empty array', async () => {
      const mockTokenDoc = {
        userId: 'user123',
        tokens: 75,
      };

      mockFindOne.mockResolvedValueOnce(mockTokenDoc);
      mockToArray
        .mockResolvedValueOnce([]) // Reserved history
        .mockResolvedValueOnce([]); // Token history (empty)

      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'user123' },
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        tokens: 75,
        reservedTokens: 0,
        tokenHistory: [],
      });
    });

    it('should handle database error', async () => {
      mockFindOne.mockRejectedValueOnce(new Error('Database error'));

      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'user123' },
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(500);
      expect(res._getJSONData()).toEqual({
        message: 'Internal server error'
      });
    });

    it('should handle database connection timeout', async () => {
      mockFindOne.mockRejectedValueOnce(new Error('Connection timeout'));

      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'user123' },
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(500);
      expect(res._getJSONData()).toEqual({
        message: 'Internal server error'
      });
    });
  });
});