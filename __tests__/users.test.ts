// __tests__/api/users.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/admin/users';

describe('/api/users', () => {
  let mockToArray: jest.Mock;
  let mockFindOne: jest.Mock;
  let mockInsertOne: jest.Mock;
  let mockUpdateOne: jest.Mock;
  let mockCollection: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock console.error
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Reset mocks
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

  afterEach(() => {
    consoleErrorSpy.mockRestore();
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
      mockInsertOne.mockResolvedValue({ insertedId: 'history-id' }); // ✅ สำหรับ token_history

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
      expect(res._getJSONData()).toEqual({
        success: true,
        message: 'อัปเดตสถานะผู้ใช้สำเร็จ'
      });

      // ✅ ตรวจสอบว่า updateOne ถูกเรียกเพื่ออัพเดท tokens ใน user_tokens
      expect(mockUpdateOne).toHaveBeenCalledWith(
        { userId: 'user123' },
        { $set: { tokens: 150 } }
      );

      // ✅ ตรวจสอบว่า insertOne ถูกเรียกเพื่อเพิ่ม history ใน token_history collection
      expect(mockInsertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          change: 100, // 150 - 50 = 100
          reason: 'Admin added tokens',
          type: 'admin_adjustment',
          date: expect.any(Date)
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

    it('should not update if tokens value is the same', async () => {
      const existingTokenData = {
        userId: 'user123',
        tokens: 100,
      };

      mockFindOne.mockResolvedValue(existingTokenData);

      const { req, res } = createMocks({
        method: 'PATCH',
        body: {
          userId: 'user123',
          tokens: 100, // Same value, no change
        },
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual({
        success: false,
        message: 'ไม่มีข้อมูลที่จะอัปเดต'
      });

      // Should not call updateOne or insertOne when no change
      expect(mockUpdateOne).not.toHaveBeenCalled();
      expect(mockInsertOne).not.toHaveBeenCalled();
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