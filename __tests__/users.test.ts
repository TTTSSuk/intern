// __tests__/api/users.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/admin/users';

describe('/api/users', () => {
  let mockToArray: jest.Mock;
  let mockFindOne: jest.Mock;
  let mockInsertOne: jest.Mock;
  let mockUpdateOne: jest.Mock;
  let mockCollection: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockToArray = global.__mongoMocks.mockToArray;
    mockFindOne = global.__mongoMocks.mockFindOne;
    mockInsertOne = global.__mongoMocks.mockInsertOne;
    mockUpdateOne = global.__mongoMocks.mockUpdateOne;
    mockCollection = global.__mongoMocks.mockCollection;

    // Mock aggregate method
    const mockAggregate = jest.fn().mockReturnValue({
      toArray: mockToArray
    });
    mockCollection.mockReturnValue({
      findOne: mockFindOne,
      insertOne: mockInsertOne,
      updateOne: mockUpdateOne,
      aggregate: mockAggregate,
    });
  });

  describe('GET /api/users', () => {
    it('should return users with token data', async () => {
      const mockUsers = [
        {
          _id: 'user1',
          userId: 'user123',
          name: 'Test User',
          isActive: true,
          isSuspended: false,
          tokens: 100,
          tokenHistory: []
        }
      ];

      mockToArray.mockResolvedValue(mockUsers);

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req as any, res as any);


      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        success: true,
        users: mockUsers
      });
    });

    it('should handle database error in GET', async () => {
      mockToArray.mockRejectedValue(new Error('Database error'));

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(500);
      expect(res._getJSONData()).toEqual({
        success: false,
        message: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้'
      });
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user successfully', async () => {
      mockFindOne.mockResolvedValue(null); // User doesn't exist
      mockInsertOne.mockResolvedValue({ insertedId: 'new-user-id' });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: 'newuser123',
          password: 'password123',
          name: 'New User'
        },
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(201);
      expect(res._getJSONData()).toEqual({
        success: true,
        message: 'เพิ่มผู้ใช้สำเร็จ'
      });
      expect(mockInsertOne).toHaveBeenCalledTimes(2); // users + user_tokens
    });

    it('should return 400 if required fields are missing', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: 'user123',
          // missing password and name
        },
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    });

    it('should return 409 if user already exists', async () => {
      mockFindOne.mockResolvedValue({ userId: 'user123' });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: 'user123',
          password: 'password123',
          name: 'Test User'
        },
      });

      await handler(req as any, res as any);


      expect(res._getStatusCode()).toBe(409);
      expect(res._getJSONData()).toEqual({
        success: false,
        message: 'User ID นี้มีอยู่แล้ว'
      });
    });
  });

  describe('PATCH /api/users', () => {
    it('should update user status successfully', async () => {
      mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });

      const { req, res } = createMocks({
        method: 'PATCH',
        body: {
          userId: 'user123',
          isActive: false,
          isSuspended: true,
          suspensionReason: 'Policy violation'
        },
      });

      await handler(req as any, res as any);


      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        success: true,
        message: 'อัปเดตสถานะผู้ใช้สำเร็จ'
      });
    });

    it('should update tokens and add history entry', async () => {
      const existingTokenData = {
        userId: 'user123',
        tokens: 50,
        tokenHistory: []
      };

      mockFindOne.mockResolvedValue(existingTokenData);
      mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });

      const { req, res } = createMocks({
        method: 'PATCH',
        body: {
          userId: 'user123',
          tokens: 150,
          reason: 'Admin added tokens'
        },
      });

      await handler(req as any, res as any);


      expect(res._getStatusCode()).toBe(200);
      expect(mockUpdateOne).toHaveBeenCalledWith(
        { userId: 'user123' },
        expect.objectContaining({
          $set: expect.objectContaining({
            tokens: 150,
            tokenHistory: expect.arrayContaining([
              expect.objectContaining({
                change: 100,
                reason: 'Admin added tokens'
              })
            ])
          })
        })
      );
    });

    it('should return 400 if userId is missing', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        body: {
          isActive: false
        },
      });

      await handler(req as any, res as any);


      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual({
        success: false,
        message: 'กรุณาระบุ userId'
      });
    });

    it('should return 404 if token data not found for token update', async () => {
      mockFindOne.mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'PATCH',
        body: {
          userId: 'user123',
          tokens: 100
        },
      });

      await handler(req as any, res as any);


      expect(res._getStatusCode()).toBe(404);
      expect(res._getJSONData()).toEqual({
        success: false,
        message: 'ไม่พบข้อมูลโทเค็นของผู้ใช้'
      });
    });
  });

  describe('Invalid HTTP methods', () => {
    it('should return 405 for unsupported methods', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
      });

      await handler(req as any, res as any);


      expect(res._getStatusCode()).toBe(405);
    });
  });
});
