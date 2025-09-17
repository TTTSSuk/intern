import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../pages/api/history-videos';

// Mocks
const { mockToArray, mockSort, mockFind, mockProject } = global.__mongoMocks;
mockFind.mockReturnValue({ project: mockProject });

// สร้าง type ของ mock response
type MockRes = {
  status: jest.Mock<any, any>;
  json: jest.Mock<any, any>;
};

const createMockRes = (): MockRes => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe('/api/history-videos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 405 for non-GET requests', async () => {
    const req = { method: 'POST' } as unknown as NextApiRequest;
    const res = createMockRes();

    await handler(req, res as unknown as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ message: 'Method not allowed' });
  });

  test('should return 400 when userId is missing', async () => {
    const req = { method: 'GET', query: {} } as unknown as NextApiRequest;
    const res = createMockRes();

    await handler(req, res as unknown as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Missing or invalid userId' });
  });

  test('should fetch history videos successfully', async () => {
    const mockHistoryData = [
      { _id: 'id1', userId: 'u1', originalName: 'v1', status: 'done', createdAt: new Date(), clips: [], executionIdHistory: null, folders: [], extractPath: './' }
    ];
    mockToArray.mockResolvedValue(mockHistoryData);

    const req = { method: 'GET', query: { userId: 'u1' } } as unknown as NextApiRequest;
    const res = createMockRes();

    await handler(req, res as unknown as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockHistoryData);
  });
});
