// __tests__/status-wf.test.ts - Fixed Version
import { createMocks } from 'node-mocks-http';
import handler from '../pages/api/status-wf';

// Mock start-wf module
jest.mock('../pages/api/start-wf', () => ({
    updateExecutionHistory: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('Status Workflow API Endpoint', () => {
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
        
        // Reset MongoDB mocks properly
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

        // Set up environment variables
        process.env.N8N_API_KEY = 'test-api-key';
        process.env.N8N_API_BASE_URL = 'http://test-n8n.com';

        // Reset fetch mock
        (global.fetch as jest.Mock).mockReset();
    });

    test('should return 400 if id or executionId is missing', async () => {
        const { req, res } = createMocks({
            method: 'GET',
            query: {}
        });

        await handler(req as any, res as any);

        expect(res._getStatusCode()).toBe(400);
        expect(res._getJSONData()).toEqual({ error: 'File ID or execution ID is required' });
    });

    test('should return 400 if id format is invalid', async () => {
        global.__mongoMocks.MockObjectId.isValid.mockReturnValue(false);

        const { req, res } = createMocks({
            method: 'GET',
            query: { id: 'invalid-id-format' }
        });

        await handler(req as any, res as any);

        expect(res._getStatusCode()).toBe(400);
        expect(res._getJSONData()).toEqual({ error: 'Invalid file ID format' });
    });

    test('should return 404 if file is not found by ID', async () => {
        global.__mongoMocks.MockObjectId.isValid.mockReturnValue(true);
        global.__mongoMocks.mockFindOne.mockResolvedValue(null);

        const { req, res } = createMocks({
            method: 'GET',
            query: { id: '60c72b2f9b1d8e001c1f7b8c' }
        });

        await handler(req as any, res as any);

        expect(res._getStatusCode()).toBe(404);
        expect(res._getJSONData()).toEqual({ 
            error: 'File not found'
        });
    });

    test('should return 500 if internal server error occurs', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        // Mock MongoDB to throw an error
        global.__mongoMocks.mockFindOne.mockRejectedValue(new Error('MongoDB error'));

        const { req, res } = createMocks({
            method: 'GET',
            query: { id: '60c72b2f9b1d8e001c1f7b8c' }
        });

        await handler(req as any, res as any);

        expect(res._getStatusCode()).toBe(500);
        expect(res._getJSONData()).toEqual({ 
            error: 'Internal Server Error',
            details: 'MongoDB error'
        });
        
        consoleSpy.mockRestore();
    });

    test('should return status and clips by file ID', async () => {
        global.__mongoMocks.MockObjectId.isValid.mockReturnValue(true);
        global.__mongoMocks.mockFindOne.mockResolvedValue({
            _id: { toString: () => '60c72b2f9b1d8e001c1f7b8c' },
            executionId: 'exec123',
            status: undefined,
            clips: [{ video: 'http://example.com/video1.mp4' }]
        });

        // Mock N8N API response
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                status: 'running',
                finished: false,
                data: { resultData: {} }
            })
        });

        const { req, res } = createMocks({
            method: 'GET',
            query: { id: '60c72b2f9b1d8e001c1f7b8c' }
        });

        await handler(req as any, res as any);

        expect(res._getStatusCode()).toBe(200);
        expect(res._getJSONData()).toEqual({
            status: 'running',
            executionId: 'exec123',
            finished: false,
            documentId: '60c72b2f9b1d8e001c1f7b8c',
            clips: [{ video: 'http://example.com/video1.mp4' }],
            folders: []
        });
    });

    test('should return status by executionId', async () => {
        global.__mongoMocks.mockFindOne.mockResolvedValue({
            _id: { toString: () => '60c72b2f9b1d8e001c1f7b8d' },
            executionId: 'exec456',
            status: undefined,
            clips: []
        });

        // Mock N8N API response for succeeded status
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                status: 'succeeded',
                finished: true,
                data: { resultData: {} }
            })
        });

        const { req, res } = createMocks({
            method: 'GET',
            query: { executionId: 'exec456' }
        });

        await handler(req as any, res as any);

        expect(res._getStatusCode()).toBe(200);
        expect(res._getJSONData()).toEqual({
            status: 'completed', // API converts 'succeeded' to 'completed'
            executionId: 'exec456',
            finished: true,
            documentId: '60c72b2f9b1d8e001c1f7b8d',
            clips: [],
            folders: []
        });
    });

    test('should correctly handle succeeded workflow and update history', async () => {
        global.__mongoMocks.MockObjectId.isValid.mockReturnValue(true);
        global.__mongoMocks.mockFindOne.mockResolvedValue({
            _id: { toString: () => '60c72b2f9b1d8e001c1f7b8c' },
            executionId: 'exec123',
            status: undefined,
            startTime: new Date('2023-01-01T00:00:00Z')
        });

        // Mock N8N API response
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                status: 'succeeded',
                finished: true,
                data: { resultData: {} }
            })
        });

        const { req, res } = createMocks({
            method: 'GET',
            query: { id: '60c72b2f9b1d8e001c1f7b8c' }
        });

        await handler(req as any, res as any);

        expect(res._getStatusCode()).toBe(200);
        expect(res._getJSONData().status).toBe('completed'); // API converts 'succeeded' to 'completed'
        expect(require('../pages/api/start-wf').updateExecutionHistory).toHaveBeenCalledWith(
            '60c72b2f9b1d8e001c1f7b8c',
            'exec123',
            expect.any(Date),
            'completed', // Expected 'completed' instead of 'succeeded'
            undefined,
            undefined, // clips parameter
            undefined  // folders parameter
        );
    });

    test('should correctly handle failed workflow and update history', async () => {
        global.__mongoMocks.MockObjectId.isValid.mockReturnValue(true);
        global.__mongoMocks.mockFindOne.mockResolvedValue({
            _id: { toString: () => '60c72b2f9b1d8e001c1f7b8c' },
            executionId: 'exec123',
            status: undefined,
            startTime: new Date('2023-01-01T00:00:00Z')
        });

        // Mock N8N API response for error
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                status: 'error',
                finished: true,
                data: {
                    resultData: {
                        error: { message: 'Some error occurred' }
                    }
                }
            })
        });

        const { req, res } = createMocks({
            method: 'GET',
            query: { id: '60c72b2f9b1d8e001c1f7b8c' }
        });

        await handler(req as any, res as any);

        expect(res._getStatusCode()).toBe(200);
        expect(res._getJSONData().status).toBe('error');
        expect(require('../pages/api/start-wf').updateExecutionHistory).toHaveBeenCalledWith(
            '60c72b2f9b1d8e001c1f7b8c',
            'exec123',
            expect.any(Date),
            'error',
            'Some error occurred',
            undefined, // clips parameter
            undefined  // folders parameter
        );
    });

    test('should handle queued status without calling N8N API', async () => {
        global.__mongoMocks.MockObjectId.isValid.mockReturnValue(true);
        global.__mongoMocks.mockFindOne.mockResolvedValue({
            _id: { toString: () => '60c72b2f9b1d8e001c1f7b8c' },
            executionId: undefined, // No execution ID yet
            status: 'queued',
            queuePosition: 3,
            clips: []
        });

        const { req, res } = createMocks({
            method: 'GET',
            query: { id: '60c72b2f9b1d8e001c1f7b8c' }
        });

        await handler(req as any, res as any);

        expect(res._getStatusCode()).toBe(200);
        expect(res._getJSONData()).toEqual({
            status: 'queued',
            finished: false,
            message: 'Job is queued',
            queuePosition: 3,
            clips: []
        });

        // Should not call N8N API
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should handle completed status without calling N8N API', async () => {
        global.__mongoMocks.MockObjectId.isValid.mockReturnValue(true);
        global.__mongoMocks.mockFindOne.mockResolvedValue({
            _id: { toString: () => '60c72b2f9b1d8e001c1f7b8c' },
            executionId: 'exec123',
            status: 'completed',
            executionIdHistory: true, // Already processed
            clips: [{ video: 'completed-video.mp4' }],
            folders: ['folder1']
        });

        const { req, res } = createMocks({
            method: 'GET',
            query: { id: '60c72b2f9b1d8e001c1f7b8c' }
        });

        await handler(req as any, res as any);

        expect(res._getStatusCode()).toBe(200);
        expect(res._getJSONData()).toEqual({
            status: 'completed',
            finished: true,
            executionId: 'exec123',
            documentId: '60c72b2f9b1d8e001c1f7b8c',
            clips: [{ video: 'completed-video.mp4' }],
            folders: ['folder1']
        });

        // Should not call N8N API
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should handle N8N API 404 error and update status', async () => {
        global.__mongoMocks.MockObjectId.isValid.mockReturnValue(true);
        global.__mongoMocks.mockFindOne.mockResolvedValue({
            _id: { toString: () => '60c72b2f9b1d8e001c1f7b8c' },
            executionId: 'exec123',
            status: undefined,
            startTime: new Date('2023-01-01T00:00:00Z')
        });

        // Mock N8N API 404 response
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 404
        });

        const { req, res } = createMocks({
            method: 'GET',
            query: { id: '60c72b2f9b1d8e001c1f7b8c' }
        });

        await handler(req as any, res as any);

        expect(res._getStatusCode()).toBe(200);
        expect(res._getJSONData()).toEqual({
            status: 'error',
            finished: true,
            error: 'Execution not found on N8N',
            executionId: 'exec123',
            documentId: '60c72b2f9b1d8e001c1f7b8c'
        });

        // Should call updateExecutionHistory with error status
        expect(require('../pages/api/start-wf').updateExecutionHistory).toHaveBeenCalledWith(
            '60c72b2f9b1d8e001c1f7b8c',
            'exec123',
            expect.any(Date),
            'error',
            'Execution not found on N8N.'
        );
    });
});