// __tests__/change-password.test.ts
import { createMocks } from 'node-mocks-http';
import changePasswordHandler from '../pages/api/change-password';
import { NextApiRequest, NextApiResponse } from 'next'; // ✅ เพิ่มบรรทัดนี้

const { __mongoMocks } = global;

describe('Change Password API Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test Case: เปลี่ยนรหัสผ่านสำเร็จ
  test('should change password successfully', async () => {
    __mongoMocks.mockFindOne.mockResolvedValueOnce({
      userId: 'testuser',
      password: 'oldpassword',
      name: 'Test User',
    });

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'testuser',
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      },
    });

    // ✅ เพิ่ม env ให้ req
    (req as any).env = process.env;

    // ✅ cast ให้ตรง type Next.js
    await changePasswordHandler(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    expect(__mongoMocks.mockFindOne).toHaveBeenCalledWith({ userId: 'testuser' });
    expect(__mongoMocks.mockUpdateOne).toHaveBeenCalledWith(
      { userId: 'testuser' },
      { $set: { password: 'newpassword' } }
    );
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  });

  // Test Case: ผู้ใช้ไม่พบ
  test('should return 404 if user is not found', async () => {
    __mongoMocks.mockFindOne.mockResolvedValueOnce(null);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'nonexistentuser',
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      },
    });

    (req as any).env = process.env;

    await changePasswordHandler(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    expect(res._getStatusCode()).toBe(404);
    expect(res._getJSONData()).toEqual({ message: 'ไม่พบผู้ใช้' });
  });

  // Test Case: รหัสผ่านปัจจุบันไม่ถูกต้อง
  test('should return 401 if current password is incorrect', async () => {
    __mongoMocks.mockFindOne.mockResolvedValueOnce({
      userId: 'testuser',
      password: 'incorrectpassword',
      name: 'Test User',
    });

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'testuser',
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      },
    });

    (req as any).env = process.env;

    await changePasswordHandler(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toEqual({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
  });
});
