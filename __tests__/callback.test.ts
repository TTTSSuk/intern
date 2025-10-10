// __tests__/callback.test.ts - Fixed Version
import { createMocks } from 'node-mocks-http';
import handler from '../pages/api/callback';

describe('Callback API Handler', () => {
  // Mock console.error ทุก test
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  beforeEach(() => {
    // Reset all mocks before each test
    Object.values(global.__mongoMocks).forEach(mock => {
      if (typeof mock.mockReset === 'function') {
        mock.mockReset();
      }
    });

    // Setup the mock chain properly
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
  
  // Test Case: เพิ่มคลิปวิดีโอสำเร็จ
  test('should successfully add a video clip', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        executionId: 'exec123',
        video: 'https://example.com/video1.mp4'
      },
    });

    // Mock database responses
    global.__mongoMocks.mockFindOne.mockResolvedValueOnce({
      _id: 'file_id_123',
      executionId: 'exec123',
      userId: 'user123',
      clips: []
    });
    
    // Mock both updateOne calls to succeed
    global.__mongoMocks.mockUpdateOne
      .mockResolvedValueOnce({ modifiedCount: 1 }) // For listFileCollection.updateOne
      .mockResolvedValueOnce({ modifiedCount: 1 }); // For userTokensCollection.updateOne

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ status: 'success' });
    
    // Verify the correct database operations were called
    expect(global.__mongoMocks.mockUpdateOne).toHaveBeenCalledTimes(2);
    expect(global.__mongoMocks.mockFindOne).toHaveBeenCalledWith({ executionId: 'exec123' });
  });

  // Test Case: เพิ่มวิดีโอสุดท้ายสำเร็จ
  test('should successfully add a final video', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        executionId: 'exec456',
        resultVideo: 'https://example.com/final-video.mp4'
      },
    });

    // Mock only one updateOne call for final video (no token deduction)
    global.__mongoMocks.mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ status: 'success' });
    
    // Verify only one database operation was called (for final video)
    expect(global.__mongoMocks.mockUpdateOne).toHaveBeenCalledTimes(1);
   expect(global.__mongoMocks.mockFindOne).toHaveBeenCalledTimes(1); // หรือจำนวนจริงตาม handler
  });

  // Test Case: ข้อมูลไม่ครบถ้วน
  test('should return 400 for missing required fields', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        executionId: 'exec789'
        // Missing video and resultVideo
      },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({
      status: 'error',
      message: 'Missing required fields'
    });
  });

  // Test Case: Method ไม่ถูกต้อง
  test('should return 405 for non-POST methods', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(405);
    expect(res._getJSONData()).toEqual({
      status: 'Method not allowed'
    });
  });

  // Test Case: Database Error
  test('should handle database errors gracefully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        executionId: 'exec999',
        video: 'https://example.com/video.mp4'
      },
    });

    // Mock database error
    global.__mongoMocks.mockUpdateOne.mockRejectedValue(new Error('Database connection failed'));

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({
      status: 'error',
      message: 'Internal Server Error'
    });
  });
});