// __tests__/list-files.test.ts
import httpMocks from 'node-mocks-http';
import handler from '../pages/api/list-files';
import { readFolderRecursive } from '@/lib/readFolderRecursive';
import path from 'path';

// #1: Mock Dependencies
// Mock MongoDB client and the global __mongoMocks object
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
            MockObjectId: Object.assign(jest.fn(() => ({})), { isValid: jest.fn(() => true) }),        };
    }
    return {
        __esModule: true,
        default: jest.fn(() => global.__mongoMocks.mockClient),
    };
});

// Mock readFolderRecursive to simulate file system reads
jest.mock('@/lib/readFolderRecursive', () => ({
    readFolderRecursive: jest.fn(),
}));

// Mock path.resolve to avoid real file system access
jest.spyOn(path, 'resolve').mockImplementation((...args: string[]) => args.join('/'));

// #2: Setup Test Suite
describe('List Files API Endpoint', () => {
    let mockRequest: httpMocks.MockRequest<any>;
    let mockResponse: httpMocks.MockResponse<any>;

    beforeEach(() => {
        mockRequest = httpMocks.createRequest();
        mockResponse = httpMocks.createResponse();
        jest.clearAllMocks();

        // Setup the mock MongoDB chain to allow for fluid testing
        global.__mongoMocks.mockToArray.mockResolvedValue([]);
        global.__mongoMocks.mockSort.mockReturnValue({ toArray: global.__mongoMocks.mockToArray });
        global.__mongoMocks.mockProject.mockReturnValue({ sort: global.__mongoMocks.mockSort });
        global.__mongoMocks.mockFind.mockReturnValue({ project: global.__mongoMocks.mockProject });
        global.__mongoMocks.mockCollection.mockReturnValue({ find: global.__mongoMocks.mockFind });
        global.__mongoMocks.mockDb.mockReturnValue({ collection: global.__mongoMocks.mockCollection });
        global.__mongoMocks.mockClient = { db: global.__mongoMocks.mockDb };
    });

    // #3: Test Cases
    
    // Case 1: Reject non-GET methods
    test('should return 405 if method is not GET', async () => {
        mockRequest.method = 'POST';

        await handler(mockRequest, mockResponse);

        expect(mockResponse._getStatusCode()).toBe(405);
        expect(mockResponse._getJSONData()).toEqual({ message: 'Method not allowed' });
    });

    // Case 2: Reject request with no userId
    test('should return 400 if userId is missing from query', async () => {
        mockRequest.method = 'GET';
        mockRequest.query = {};

        await handler(mockRequest, mockResponse);

        expect(mockResponse._getStatusCode()).toBe(400);
        expect(mockResponse._getJSONData()).toEqual({ message: 'User ID is required' });
    });

    // Case 3: Successfully fetch files with pre-existing folder data
    test('should fetch and process files with pre-existing folders data from DB', async () => {
        mockRequest.method = 'GET';
        mockRequest.query = { userId: 'user123' };

        const mockRawFiles = [{
            _id: '60c72b2f9b1d8e001c1f7b8c',
            userId: 'user123',
            originalName: 'test1.zip',
            extractPath: 'uploads/extracted/folder1',
            status: 'done',
            createdAt: new Date(),
            clips: [{ name: 'clip1.mp4' }],
            folders: {
                files: ['image.png', 'video.mp4'],
                subfolders: [],
            },
        }];

        global.__mongoMocks.mockToArray.mockResolvedValueOnce(mockRawFiles);

        await handler(mockRequest, mockResponse);

        const responseData = mockResponse._getJSONData();
        const file = responseData.files[0];

        expect(mockResponse._getStatusCode()).toBe(200);
        expect(file.videoCreated).toBe(true);
        expect(file.folders[0].files).toEqual(['image.png']); // .mp4 should be filtered out
        expect(readFolderRecursive).not.toHaveBeenCalled(); // Should not read from disk
    });
    
    // Case 4: Successfully fetch files and read folder data from disk
    test('should fetch and read folder structure from disk if not in DB', async () => {
        mockRequest.method = 'GET';
        mockRequest.query = { userId: 'user456' };

        const mockRawFiles = [{
            _id: '60c72b2f9b1d8e001c1f7b8d',
            userId: 'user456',
            originalName: 'test2.zip',
            extractPath: 'uploads/extracted/folder2',
            status: 'pending',
            createdAt: new Date(),
        }];

        global.__mongoMocks.mockToArray.mockResolvedValueOnce(mockRawFiles);
        (readFolderRecursive as jest.Mock).mockReturnValue({
            files: ['file1.txt', 'file2.mp4', 'image.jpeg'],
            subfolders: [{ name: 'sub', files: ['sub-file.png', 'sub-vid.mp4'], subfolders: [] }],
        });

        await handler(mockRequest, mockResponse);

        const responseData = mockResponse._getJSONData();
        const file = responseData.files[0];

        expect(mockResponse._getStatusCode()).toBe(200);
        expect(readFolderRecursive).toHaveBeenCalled(); // Should read from disk
        expect(file.folders[0].files).toEqual(['file1.txt', 'image.jpeg']);
        expect(file.folders[0].subfolders[0].files).toEqual(['sub-file.png']);
    });

    // Case 5: Handle internal server error
    test('should return 500 if an internal server error occurs', async () => {
        mockRequest.method = 'GET';
        mockRequest.query = { userId: 'user999' };

        global.__mongoMocks.mockFind.mockImplementation(() => {
            throw new Error('Database connection failed');
        });

        await handler(mockRequest, mockResponse);

        expect(mockResponse._getStatusCode()).toBe(500);
        expect(mockResponse._getJSONData()).toEqual({ message: 'Failed to fetch files' });
    });
});