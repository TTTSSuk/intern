// __tests__/status-wf.test.ts
import httpMocks from 'node-mocks-http';
import handler from '../pages/api/status-wf';
import { ObjectId } from 'mongodb';

// #1: Mock Dependencies
jest.mock('@/lib/mongodb', () => {
    if (!global.__mongoMocks) {
        global.__mongoMocks = {
            mockToArray: jest.fn(),
            mockSort: jest.fn(),
            mockProject: jest.fn(),
            mockFind: jest.fn(),
            mockFindOne: jest.fn(),
            mockUpdateOne: jest.fn(),
            mockInsertOne: jest.fn(),
            mockCollection: jest.fn(),
            mockDb: jest.fn(),
            mockClient: {},
            MockObjectId: Object.assign(jest.fn(() => ({})), { isValid: jest.fn(() => true) }),
        };
    }
    return {
        __esModule: true,
        default: jest.fn(() => global.__mongoMocks.mockClient),
    };
});

jest.mock('../pages/api/start-wf', () => ({
    updateExecutionHistory: jest.fn(),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

const OLD_ENV = process.env;
beforeAll(() => {
    process.env = { ...OLD_ENV, N8N_API_KEY: 'test-key', N8N_API_BASE_URL: 'http://test-n8n.com' };
});

afterAll(() => {
    process.env = OLD_ENV;
});

// #2: Setup Test Suite
describe('Status Workflow API Endpoint', () => {
    let mockRequest: httpMocks.MockRequest<any>;
    let mockResponse: httpMocks.MockResponse<any>;

    beforeEach(() => {
        mockRequest = httpMocks.createRequest();
        mockResponse = httpMocks.createResponse();
        jest.clearAllMocks();

        global.__mongoMocks.mockCollection.mockReturnValue({
            findOne: global.__mongoMocks.mockFindOne,
        });
        global.__mongoMocks.mockDb.mockReturnValue({
            collection: global.__mongoMocks.mockCollection,
        });
        global.__mongoMocks.mockClient = {
            db: global.__mongoMocks.mockDb,
        };
        (ObjectId.isValid as jest.Mock).mockReturnValue(true);
    });

    // #3: Test Cases: Error Handling

    test('should return 400 if id or executionId is missing', async () => {
        mockRequest.query = {};
        await handler(mockRequest, mockResponse);
        expect(mockResponse._getStatusCode()).toBe(400);
        expect(mockResponse._getJSONData()).toEqual({ error: 'Missing id or executionId' });
    });

    test('should return 400 if id format is invalid', async () => {
        mockRequest.query = { id: 'invalid-id-format' };
        (ObjectId.isValid as jest.Mock).mockReturnValue(false);
        await handler(mockRequest, mockResponse);
        expect(mockResponse._getStatusCode()).toBe(400);
        expect(mockResponse._getJSONData()).toEqual({ error: 'Invalid file ID format' });
    });

    test('should return 404 if file is not found by ID', async () => {
        mockRequest.query = { id: '60c72b2f9b1d8e001c1f7b8c' };
        global.__mongoMocks.mockFindOne.mockResolvedValue(null);
        await handler(mockRequest, mockResponse);
        expect(mockResponse._getStatusCode()).toBe(404);
        expect(mockResponse._getJSONData()).toEqual({ error: 'File not found', executionId: null, status: 'idle' });
    });

    test('should return 500 if N8N API key is not configured', async () => {
        process.env.N8N_API_KEY = '';
        mockRequest.query = { id: '60c72b2f9b1d8e001c1f7b8c' };
        await handler(mockRequest, mockResponse);
        expect(mockResponse._getStatusCode()).toBe(500);
        expect(mockResponse._getJSONData()).toEqual({ error: 'N8N API key or base URL is not configured' });
    });

    test('should return 500 if internal server error occurs', async () => {
        process.env.N8N_API_KEY = 'test-key';
        mockRequest.query = { id: '60c72b2f9b1d8e001c1f7b8c' };
        global.__mongoMocks.mockFindOne.mockRejectedValue(new Error('MongoDB error'));
        await handler(mockRequest, mockResponse);
        expect(mockResponse._getStatusCode()).toBe(500);
        expect(mockResponse._getJSONData()).toEqual({ error: 'Internal Server Error' });
    });

    // #4: Test Cases: Successful Scenarios

    test('should return status and clips by file ID', async () => {
        mockRequest.query = { id: '60c72b2f9b1d8e001c1f7b8c' };
        const mockDoc = { _id: new ObjectId('60c72b2f9b1d8e001c1f7b8c'), executionId: 'exec123', clips: [{ name: 'clip1' }] };
        global.__mongoMocks.mockFindOne.mockResolvedValue(mockDoc);
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ status: 'running', finished: false }),
        });
        await handler(mockRequest, mockResponse);
        expect(mockResponse._getStatusCode()).toBe(200);
        expect(mockResponse._getJSONData()).toEqual({
            status: 'running',
            executionId: 'exec123',
            finished: false,
            documentId: '60c72b2f9b1d8e001c1f7b8c',
            clips: [{ name: 'clip1' }],
        });
        expect(global.__mongoMocks.mockFindOne).toHaveBeenCalledWith({ _id: new ObjectId('60c72b2f9b1d8e001c1f7b8c') });
    });

    test('should return status by executionId', async () => {
        mockRequest.query = { executionId: 'exec456' };
        const mockDoc = { _id: new ObjectId('60c72b2f9b1d8e001c1f7b8d'), executionId: 'exec456' };
        global.__mongoMocks.mockFindOne.mockResolvedValue(mockDoc);
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ status: 'succeeded', finished: true }),
        });
        await handler(mockRequest, mockResponse);
        expect(mockResponse._getStatusCode()).toBe(200);
        expect(mockResponse._getJSONData()).toEqual({
            status: 'succeeded',
            executionId: 'exec456',
            finished: true,
            documentId: '60c72b2f9b1d8e001c1f7b8d',
            clips: [],
        });
        expect(global.__mongoMocks.mockFindOne).toHaveBeenCalledWith({ executionId: 'exec456' });
    });

    test('should correctly handle succeeded workflow and update history', async () => {
        mockRequest.query = { id: '60c72b2f9b1d8e001c1f7b8c' };
        const mockDoc = { _id: new ObjectId('60c72b2f9b1d8e001c1f7b8c'), executionId: 'exec123', startTime: new Date() };
        global.__mongoMocks.mockFindOne.mockResolvedValue(mockDoc);
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ status: 'succeeded', finished: true, data: { resultData: {} } }),
        });
        await handler(mockRequest, mockResponse);
        expect(mockResponse._getStatusCode()).toBe(200);
        expect(mockResponse._getJSONData().status).toBe('succeeded');
        expect(require('../pages/api/start-wf').updateExecutionHistory).toHaveBeenCalledWith(
            '60c72b2f9b1d8e001c1f7b8c',
            'exec123',
            expect.any(Date),
            'completed',
            undefined
        );
    });

    test('should correctly handle failed workflow and update history', async () => {
        mockRequest.query = { id: '60c72b2f9b1d8e001c1f7b8c' };
        const mockDoc = { _id: new ObjectId('60c72b2f9b1d8e001c1f7b8c'), executionId: 'exec123', startTime: new Date() };
        global.__mongoMocks.mockFindOne.mockResolvedValue(mockDoc);
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                status: 'error',
                finished: true,
                data: {
                    resultData: {
                        error: { message: 'Some error occurred' }
                    }
                }
            }),
        });
        await handler(mockRequest, mockResponse);
        expect(mockResponse._getStatusCode()).toBe(200);
        expect(mockResponse._getJSONData().status).toBe('error');
        expect(require('../pages/api/start-wf').updateExecutionHistory).toHaveBeenCalledWith(
            '60c72b2f9b1d8e001c1f7b8c',
            'exec123',
            expect.any(Date),
            'error',
            'Some error occurred'
        );
    });
});