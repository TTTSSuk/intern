import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/users/token-history';

describe('/api/users/token-history', () => {
  let mockFindOne: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFindOne = global.__mongoMocks.mockFindOne;
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
      mockFindOne.mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'user123' },
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        tokens: 0,
        tokenHistory: [],
      });
      expect(mockFindOne).toHaveBeenCalledWith({ userId: 'user123' });
    });

    it('should return user tokens and history when found', async () => {
      const mockTokenDoc = {
        userId: 'user123',
        tokens: 50,
        tokenHistory: [
          {
            date: new Date('2023-01-01'),
            change: 100,
            reason: 'เติม token'
          },
          {
            date: new Date('2023-01-02'),
            change: -50,
            reason: 'ใช้ token'
          }
        ]
      };

      mockFindOne.mockResolvedValue(mockTokenDoc);

      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'user123' },
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        tokens: 50,
        tokenHistory: [
          { date: '2023-01-01T00:00:00.000Z', change: 100, reason: 'เติม token' },
          { date: '2023-01-02T00:00:00.000Z', change: -50, reason: 'ใช้ token' },
        ],
      });
    });

    it('should handle tokens field with fallback to 0', async () => {
      const mockTokenDoc = {
        userId: 'user123',
        // tokens field is missing
        tokenHistory: [
          {
            date: new Date('2023-01-01'),
            change: 100,
            reason: 'เติม token'
          }
        ]
      };

      mockFindOne.mockResolvedValue(mockTokenDoc);

      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'user123' },
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        tokens: 0,
        tokenHistory: [
          { date: '2023-01-01T00:00:00.000Z', change: 100, reason: 'เติม token' },
        ],
      });
    });

    it('should handle tokenHistory field with fallback to empty array', async () => {
      const mockTokenDoc = {
        userId: 'user123',
        tokens: 75,
        // tokenHistory field is missing
      };

      mockFindOne.mockResolvedValue(mockTokenDoc);

      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'user123' },
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        tokens: 75,
        tokenHistory: [],
      });
    });

    it('should handle database error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockFindOne.mockRejectedValue(new Error('Database error'));

      const { req, res } = createMocks({
        method: 'GET',
        query: { userId: 'user123' },
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(500);
      expect(res._getJSONData()).toEqual({
        message: 'Internal server error'
      });

      consoleSpy.mockRestore();
    });

    it('should handle database connection timeout', async () => {
      mockFindOne.mockRejectedValue(new Error('Connection timeout'));

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
