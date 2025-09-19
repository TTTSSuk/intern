// __tests__/list-files.test.ts
import httpMocks from 'node-mocks-http';
import handler from '../pages/api/list-files';
import { readFolderRecursive } from '@/lib/readFolderRecursive';
import path from 'path';

// Mock readFolderRecursive (MongoDB is already mocked in jest.setup.js)
jest.mock('@/lib/readFolderRecursive', () => ({
    readFolderRecursive: jest.fn(),
}));

// Mock path.resolve to avoid real file system access
jest.spyOn(path, 'resolve').mockImplementation((...args: string[]) => args.join('/'));

describe('List Files API Endpoint', () => {
    let mockRequest: httpMocks.MockRequest<any>;
    let mockResponse: httpMocks.MockResponse<any>;

    beforeEach(() => {
        // Create fresh mock request/response for each test
        mockRequest = httpMocks.createRequest();
        mockResponse = httpMocks.createResponse();
        
        // Clear all mocks
        jest.clearAllMocks();

        // Reset MongoDB mocks to default behavior (using global mocks from jest.setup.js)
        const { 
            mockToArray, 
            mockSort, 
            mockProject, 
            mockFind, 
            mockCollection, 
            mockDb,
            mockClient 
        } = global.__mongoMocks;
        
        // Setup the MongoDB chain
        mockToArray.mockResolvedValue([]);
        mockSort.mockReturnValue({ toArray: mockToArray });
        mockProject.mockReturnValue({ 
            sort: mockSort, 
            toArray: mockToArray 
        });
        mockFind.mockReturnValue({ 
            sort: mockSort, 
            project: mockProject,
            toArray: mockToArray
        });
        mockCollection.mockReturnValue({ find: mockFind });
        mockDb.mockReturnValue({ collection: mockCollection });
        
        // Ensure mockClient.db points to our mocked db
        mockClient.db = mockDb;
    });

    // Test 1: Reject non-GET methods
    test('should return 405 if method is not GET', async () => {
        mockRequest.method = 'POST';

        await handler(mockRequest, mockResponse);

        expect(mockResponse._getStatusCode()).toBe(405);
        expect(mockResponse._getJSONData()).toEqual({ message: 'Method not allowed' });
    });

    // Test 2: Reject request with no userId
    test('should return 400 if userId is missing from query', async () => {
        mockRequest.method = 'GET';
        mockRequest.query = {}; // No userId

        await handler(mockRequest, mockResponse);

        expect(mockResponse._getStatusCode()).toBe(400);
        expect(mockResponse._getJSONData()).toEqual({ message: 'User ID is required' });
    });

    // Test 3: Successfully fetch files with pre-existing folder data
    test('should fetch and process files with pre-existing folders data from DB', async () => {
        mockRequest.method = 'GET';
        mockRequest.query = { userId: 'user123' };

        const mockRawFiles = [{
            _id: { toString: () => '60c72b2f9b1d8e001c1f7b8c' },
            userId: 'user123',
            originalName: 'test1.zip',
            extractPath: 'uploads/extracted/folder1',
            status: 'done',
            createdAt: new Date('2023-01-01'),
            clips: [{ name: 'clip1.mp4' }],
            folders: {
                files: ['image.png', 'video.mp4'],
                subfolders: [],
            },
        }];

        // Override the mockToArray for this specific test
        global.__mongoMocks.mockToArray.mockResolvedValueOnce(mockRawFiles);

        await handler(mockRequest, mockResponse);

        const responseData = mockResponse._getJSONData();
        
        expect(mockResponse._getStatusCode()).toBe(200);
        expect(responseData.files).toHaveLength(1);
        
        const file = responseData.files[0];
        expect(file.videoCreated).toBe(true);
        expect(file.folders[0].files).toEqual(['image.png']); // .mp4 should be filtered out
        expect(readFolderRecursive).not.toHaveBeenCalled(); // Should not read from disk
    });
    
    // Test 4: Successfully fetch files and read folder data from disk
    test('should fetch and read folder structure from disk if not in DB', async () => {
        mockRequest.method = 'GET';
        mockRequest.query = { userId: 'user456' };

        const mockRawFiles = [{
            _id: { toString: () => '60c72b2f9b1d8e001c1f7b8d' },
            userId: 'user456',
            originalName: 'test2.zip',
            extractPath: 'uploads/extracted/folder2',
            status: 'pending',
            createdAt: new Date('2023-01-02'),
            // No folders field - should read from disk
        }];

        global.__mongoMocks.mockToArray.mockResolvedValueOnce(mockRawFiles);
        
        // Mock the file system read
        (readFolderRecursive as jest.Mock).mockReturnValue({
            files: ['file1.txt', 'file2.mp4', 'image.jpeg'],
            subfolders: [{ name: 'sub', files: ['sub-file.png', 'sub-vid.mp4'], subfolders: [] }],
        });

        await handler(mockRequest, mockResponse);

        const responseData = mockResponse._getJSONData();
        
        expect(mockResponse._getStatusCode()).toBe(200);
        expect(readFolderRecursive).toHaveBeenCalled(); // Should read from disk
        
        const file = responseData.files[0];
        expect(file.folders[0].files).toEqual(['file1.txt', 'image.jpeg']); // mp4 filtered out
        expect(file.folders[0].subfolders[0].files).toEqual(['sub-file.png']); // mp4 filtered out
    });

    // Test 5: Handle internal server error
    test('should return 500 if an internal server error occurs', async () => {
        mockRequest.method = 'GET';
        mockRequest.query = { userId: 'user999' };

        // Mock console.error to avoid chalk dependency issue
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // Make the find method throw an error
        global.__mongoMocks.mockFind.mockImplementation(() => {
            throw new Error('Database connection failed');
        });

        await handler(mockRequest, mockResponse);

        expect(mockResponse._getStatusCode()).toBe(500);
        expect(mockResponse._getJSONData()).toEqual({ message: 'Failed to fetch files' });
        
        // Verify that error was logged
        expect(consoleSpy).toHaveBeenCalledWith('❌ Error fetching files:', expect.any(Error));
        
        // Restore console.error
        consoleSpy.mockRestore();
    });
});