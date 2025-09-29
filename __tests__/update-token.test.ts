// __tests__/update-token.test.ts
import { createMocks } from 'node-mocks-http';
import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../pages/api/update-token';

describe('Update Token API Handler', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    Object.values(global.__mongoMocks).forEach(mock => {
      if (typeof mock.mockReset === 'function') {
        mock.mockReset();
      }
    });

    // Setup the MongoDB mock chain properly
    global.__mongoMocks.mockDb.mockReturnValue({
      collection: global.__mongoMocks.mockCollection
    });

    global.__mongoMocks.mockCollection.mockReturnValue({
      find: global.__mongoMocks.mockFind,
      findOne: global.__mongoMocks.mockFindOne,
      updateOne: global.__mongoMocks.mockUpdateOne,
      insertOne: global.__mongoMocks.mockInsertOne,
    });
  });

  // Test Case: Successful token addition
  test('should successfully add tokens to user', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'user123',
        tokens: 10,
        reason: 'Purchase tokens'
      },
    });

    // Mock successful database update
    global.__mongoMocks.mockUpdateOne.mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: null
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      success: true,
      message: 'Token updated successfully'
    });

    // Verify database operations
    expect(global.__mongoMocks.mockUpdateOne).toHaveBeenCalledWith(
      { userId: 'user123' },
      {
        $inc: { tokens: 10 },
        $push: {
          tokenHistory: {
            date: expect.any(Date),
            change: 10,
            reason: 'Purchase tokens'
          }
        }
      },
      { upsert: true }
    );
  });

  // Test Case: Successful token deduction
  test('should successfully deduct tokens from user', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'user456',
        tokens: -5,
        reason: 'Video processing'
      },
    });

    global.__mongoMocks.mockUpdateOne.mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: null
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      success: true,
      message: 'Token updated successfully'
    });

    expect(global.__mongoMocks.mockUpdateOne).toHaveBeenCalledWith(
      { userId: 'user456' },
      {
        $inc: { tokens: -5 },
        $push: {
          tokenHistory: {
            date: expect.any(Date),
            change: -5,
            reason: 'Video processing'
          }
        }
      },
      { upsert: true }
    );
  });

  // Test Case: New user creation (upsert)
  test('should create new user token record via upsert', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'newuser789',
        tokens: 20
      },
    });

    // Mock upsert operation (new document created)
    global.__mongoMocks.mockUpdateOne.mockResolvedValue({
      matchedCount: 0,
      modifiedCount: 0,
      upsertedCount: 1,
      upsertedId: 'new_doc_id'
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      success: true,
      message: 'Token updated successfully'
    });

    expect(global.__mongoMocks.mockUpdateOne).toHaveBeenCalledWith(
      { userId: 'newuser789' },
      {
        $inc: { tokens: 20 },
        $push: {
          tokenHistory: {
            date: expect.any(Date),
            change: 20,
            reason: 'เพิ่ม token' // Default reason for positive tokens
          }
        }
      },
      { upsert: true }
    );
  });

  // Test Case: Default reason for negative tokens
  test('should use default reason for negative tokens when reason not provided', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'user123',
        tokens: -3
      },
    });

    global.__mongoMocks.mockUpdateOne.mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: null
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(global.__mongoMocks.mockUpdateOne).toHaveBeenCalledWith(
      { userId: 'user123' },
      {
        $inc: { tokens: -3 },
        $push: {
          tokenHistory: {
            date: expect.any(Date),
            change: -3,
            reason: 'ปรับ token' // Default reason for negative tokens
          }
        }
      },
      { upsert: true }
    );
  });

  // Test Case: Method not allowed
  test('should return 405 for non-POST methods', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(405);
    expect(res._getJSONData()).toEqual({
      message: 'Method Not Allowed'
    });

    // Should not call any database operations
    expect(global.__mongoMocks.mockUpdateOne).not.toHaveBeenCalled();
  });

  // Test Case: Missing userId
  test('should return 400 when userId is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        tokens: 10,
        reason: 'Test'
      },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({
      message: 'userId and tokens are required'
    });

    expect(global.__mongoMocks.mockUpdateOne).not.toHaveBeenCalled();
  });

  // Test Case: Missing tokens
  test('should return 400 when tokens is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'user123',
        reason: 'Test'
      },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({
      message: 'userId and tokens are required'
    });

    expect(global.__mongoMocks.mockUpdateOne).not.toHaveBeenCalled();
  });

  // Test Case: Invalid token type
  test('should return 400 when tokens is not a number', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'user123',
        tokens: 'invalid',
        reason: 'Test'
      },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({
      message: 'userId and tokens are required'
    });

    expect(global.__mongoMocks.mockUpdateOne).not.toHaveBeenCalled();
  });

  // Test Case: Zero tokens
  test('should handle zero tokens correctly', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'user123',
        tokens: 0,
        reason: 'Reset tokens'
      },
    });

    global.__mongoMocks.mockUpdateOne.mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: null
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      success: true,
      message: 'Token updated successfully'
    });

    expect(global.__mongoMocks.mockUpdateOne).toHaveBeenCalledWith(
      { userId: 'user123' },
      {
        $inc: { tokens: 0 },
        $push: {
          tokenHistory: {
            date: expect.any(Date),
            change: 0,
            reason: 'Reset tokens'
          }
        }
      },
      { upsert: true }
    );
  });

  // Test Case: Database error handling
  test('should handle database errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'user123',
        tokens: 10,
        reason: 'Test'
      },
    });

    // Mock database error
    global.__mongoMocks.mockUpdateOne.mockRejectedValue(new Error('Database connection failed'));

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({
      message: 'Internal server error'
    });

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

    consoleSpy.mockRestore();
  });

  // Test Case: Large token values
  test('should handle large token values', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'user123',
        tokens: 999999,
        reason: 'Bulk purchase'
      },
    });

    global.__mongoMocks.mockUpdateOne.mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: null
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      success: true,
      message: 'Token updated successfully'
    });

    expect(global.__mongoMocks.mockUpdateOne).toHaveBeenCalledWith(
      { userId: 'user123' },
      {
        $inc: { tokens: 999999 },
        $push: {
          tokenHistory: {
            date: expect.any(Date),
            change: 999999,
            reason: 'Bulk purchase'
          }
        }
      },
      { upsert: true }
    );
  });

  // Test Case: Empty userId
  test('should return 400 when userId is empty string', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: '',
        tokens: 10,
        reason: 'Test'
      },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({
      message: 'userId and tokens are required'
    });

    expect(global.__mongoMocks.mockUpdateOne).not.toHaveBeenCalled();
  });

  // Test Case: Null values
  test('should return 400 when userId or tokens is null', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: null,
        tokens: null,
        reason: 'Test'
      },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({
      message: 'userId and tokens are required'
    });

    expect(global.__mongoMocks.mockUpdateOne).not.toHaveBeenCalled();
  });
});