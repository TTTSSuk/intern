// __tests__/user.test.ts
import { createMocks } from 'node-mocks-http';
import userHandler from '../pages/api/user'; // ✅ เปลี่ยน path ให้ตรงกับ Next.js API
import { NextApiRequest, NextApiResponse } from 'next';

const { __mongoMocks } = global;

describe('User API Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test Case: สร้างผู้ใช้ใหม่สำเร็จ
  test('should create a new user successfully', async () => {
    __mongoMocks.mockFindOne.mockResolvedValueOnce(null);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'testuser',
        password: 'password123',
        name: 'Test User',
      },
    });

    (req as any).env = process.env;

    await userHandler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

    expect(__mongoMocks.mockFindOne).toHaveBeenCalledWith({ userId: 'testuser' });
    expect(__mongoMocks.mockInsertOne).toHaveBeenCalledWith({
      userId: 'testuser',
      password: 'password123',
      name: 'Test User',
      role: 'user',
    });
    expect(res._getStatusCode()).toBe(201);
    expect(res._getJSONData()).toEqual({ message: 'สร้างผู้ใช้สำเร็จ' });
  });

  // Test Case: userId ซ้ำ
  test('should return 409 if userId already exists', async () => {
    __mongoMocks.mockFindOne.mockResolvedValueOnce({
      userId: 'existinguser',
      password: '...',
    });

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'existinguser',
        password: 'password123',
        name: 'Existing User',
      },
    });

    (req as any).env = process.env;

    await userHandler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

    expect(__mongoMocks.mockInsertOne).not.toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(409);
    expect(res._getJSONData()).toEqual({ message: 'userId นี้ถูกใช้แล้ว' });
  });

  // Test Case: ข้อมูลไม่ครบ
  test('should return 400 if missing required fields', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'testuser',
      },
    });

    (req as any).env = process.env;

    await userHandler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ message: 'กรุณาใส่ userId, password และ name' });
  });

  // Test Case: Method ไม่อนุญาต
test('should return 405 for non-POST methods', async () => {
  const { req, res } = createMocks({
    method: 'GET',
  });

  (req as any).env = process.env;

  await userHandler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

  expect(res._getStatusCode()).toBe(405);

  // แก้ expect ให้ตรงกับ node-mocks-http เวอร์ชันใหม่
  expect(res._getHeaders().allow).toEqual(['POST']);
});
});
