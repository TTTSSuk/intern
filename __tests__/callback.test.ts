// __tests__/callback.test.ts
import { createMocks } from 'node-mocks-http';
import callback from '../pages/api/callback';
import { NextApiRequest, NextApiResponse } from 'next'; // ✅ เพิ่มบรรทัดนี้

const { __mongoMocks } = global;

describe('Callback API Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully add a video clip', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        executionId: 'exec123',
        video: '/path/to/video1.mp4',
      },
    });
    (req as any).env = process.env;
    await callback(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

    expect(__mongoMocks.mockUpdateOne).toHaveBeenCalledWith(
      { executionId: 'exec123' },
      expect.objectContaining({
        $push: { clips: expect.any(Object) },
        $set: { status: 'running' },
      }),
      { upsert: true }
    );
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ status: 'ok' });
  });

  // Test Case: เพิ่มวิดีโอสุดท้ายสำเร็จ
  test('should successfully add a final video', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        executionId: 'exec456',
        resultVideo: '/path/to/finalvideo.mp4',
      },
    });
    (req as any).env = process.env;
    await callback(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

    // ตรวจสอบว่า mockUpdateOne ถูกเรียกด้วย upsert: true และข้อมูลที่ถูกต้อง
    expect(__mongoMocks.mockUpdateOne).toHaveBeenCalledWith(
      { executionId: 'exec456' },
      expect.objectContaining({
        $push: { clips: expect.any(Object) },
        $set: { status: 'completed' },
      }),
      { upsert: true }
    );
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ status: 'ok' });
  });

  // Test Case: ข้อมูลไม่ครบถ้วน
  test('should return 400 if missing required fields', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        executionId: 'exec789',
        // ทั้ง video และ resultVideo หายไป
      },
    });

// เพิ่ม env ให้ req
(req as any).env = process.env;

// cast เป็น NextApiRequest / NextApiResponse
await callback(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ status: 'error', message: 'Missing required fields' });
  });
});