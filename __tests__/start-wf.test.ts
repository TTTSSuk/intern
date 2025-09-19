// __tests__/start-wf.test.ts

// Mock fetch
global.fetch = jest.fn();

import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../pages/api/start-wf';

// Get mocks from global setup
const {
  mockToArray,
  mockSort,
  mockFind,
  mockFindOne,
  mockUpdateOne,
  mockCollection,
  mockDb,
  mockClient,
  MockObjectId
} = global.__mongoMocks;

// ---- Helper for mock response ----
type MockRes = {
  status: jest.Mock<any, any>;
  json: jest.Mock<any, any>;
};

const createMockRes = (): MockRes => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe('/api/start-wf', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods to avoid output and chalk dependency issues
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Reset ObjectId.isValid to default behavior
    MockObjectId.isValid.mockReturnValue(true);
  });

  afterEach(() => {
    // Restore console methods
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  test('should return 405 for non-POST requests', async () => {
    const req = { method: 'GET' } as unknown as NextApiRequest;
    const res = createMockRes();

    await handler(req, res as unknown as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  test('should return 400 when _id is missing', async () => {
    const req = { method: 'POST', body: {} } as unknown as NextApiRequest;
    const res = createMockRes();

    await handler(req, res as unknown as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: '_id is required' });
  });

  test('should return 400 for invalid _id format', async () => {
    MockObjectId.isValid.mockReturnValue(false);

    const req = { method: 'POST', body: { _id: 'invalid-id' } } as unknown as NextApiRequest;
    const res = createMockRes();

    await handler(req, res as unknown as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid _id format' });
  });

  test('should return 404 when file not found', async () => {
    mockFindOne.mockResolvedValue(null);

    const req = { method: 'POST', body: { _id: 'valid-object-id' } } as unknown as NextApiRequest;
    const res = createMockRes();

    await handler(req, res as unknown as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'File not found' });
    expect(mockFindOne).toHaveBeenCalled();
  });

  test('should handle n8n webhook error', async () => {
    mockFindOne.mockResolvedValue({ _id: 'valid-id', extractPath: './uploads/extracted/1234567890' });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 });

    const req = { method: 'POST', body: { _id: 'valid-object-id' } } as unknown as NextApiRequest;
    const res = createMockRes();

    await handler(req, res as unknown as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'HTTP error! status: 500' });
    
    // Verify that error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Failed to start workflow:', expect.any(Error));
  });

  test('should handle missing executionId from n8n', async () => {
    mockFindOne.mockResolvedValue({ _id: 'valid-id', extractPath: './uploads/extracted/1234567890' });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    const req = { method: 'POST', body: { _id: 'valid-object-id' } } as unknown as NextApiRequest;
    const res = createMockRes();

    await handler(req, res as unknown as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'No executionId received from n8n' });
    
    // Verify that response and error were logged
    expect(consoleLogSpy).toHaveBeenCalledWith('📥 Response from n8n:', {});
    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Failed to start workflow:', expect.any(Error));
  });

  test('should start workflow successfully', async () => {
    mockFindOne.mockResolvedValue({ _id: 'valid-id', extractPath: './uploads/extracted/1234567890' });
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({ executionId: 'test-execution-id' }) });

    const req = { method: 'POST', body: { _id: 'valid-object-id' } } as unknown as NextApiRequest;
    const res = createMockRes();

    await handler(req, res as unknown as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Workflow started and saved successfully!',
      executionId: 'test-execution-id',
      _id: 'valid-object-id',
    });

    expect(mockFindOne).toHaveBeenCalledWith({ _id: expect.anything() });
    expect(mockUpdateOne).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5678/webhook/start-wf',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: 'valid-object-id', extractPath: '/extracted/1234567890' }),
      })
    );

    // Verify that success messages were logged
    expect(consoleLogSpy).toHaveBeenCalledWith('📥 Response from n8n:', { executionId: 'test-execution-id' });
    expect(consoleLogSpy).toHaveBeenCalledWith('💾 Saved to database successfully');
  });

  test('should transform extractPath correctly', async () => {
    mockFindOne.mockResolvedValue({ _id: 'valid-id', extractPath: './uploads/extracted/test-folder-123' });
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({ executionId: 'test-execution-id' }) });

    const req = { method: 'POST', body: { _id: 'test-id' } } as unknown as NextApiRequest;
    const res = createMockRes();

    await handler(req, res as unknown as NextApiResponse);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5678/webhook/start-wf',
      expect.objectContaining({
        body: JSON.stringify({ _id: 'test-id', extractPath: '/extracted/test-folder-123' }),
      })
    );

    // Verify logging
    expect(consoleLogSpy).toHaveBeenCalledWith('📥 Response from n8n:', { executionId: 'test-execution-id' });
    expect(consoleLogSpy).toHaveBeenCalledWith('💾 Saved to database successfully');
  });
});