// __tests__/login.test.ts
import httpMocks from 'node-mocks-http';
import handler from '../pages/api/login';

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
      MockObjectId: Object.assign(jest.fn(() => ({})), { isValid: jest.fn(() => true) }),
    };
  }
  return {
    __esModule: true,
    default: jest.fn(() => global.__mongoMocks.mockClient),
  };
});

// #2: Setup Test Suite
describe('User Login API Endpoint', () => {
  let mockRequest: httpMocks.MockRequest<any>;
  let mockResponse: httpMocks.MockResponse<any>;

  beforeEach(() => {
    mockRequest = httpMocks.createRequest();
    mockResponse = httpMocks.createResponse();
    jest.clearAllMocks();

    // Setup the mock MongoDB chain for `login.ts`
    global.__mongoMocks.mockCollection.mockReturnValue({
      findOne: global.__mongoMocks.mockFindOne,
      updateOne: global.__mongoMocks.mockUpdateOne,
    });
    global.__mongoMocks.mockDb.mockReturnValue({
      collection: global.__mongoMocks.mockCollection,
    });
    global.__mongoMocks.mockClient = {
      db: global.__mongoMocks.mockDb,
    };
  });

  // #3: Test Cases
  
  // Case 1: Reject non-POST methods
  test('should return 405 if method is not POST', async () => {
    mockRequest.method = 'GET';

    await handler(mockRequest, mockResponse);

    expect(mockResponse._getStatusCode()).toBe(405);
    expect(mockResponse._getJSONData()).toEqual({ message: 'Method GET not allowed' });
  });

  // Case 2: Reject request with missing userId or password
  test('should return 400 if userId or password is missing', async () => {
    mockRequest.method = 'POST';
    mockRequest.body = { userId: 'testuser' }; // password is missing

    await handler(mockRequest, mockResponse);

    expect(mockResponse._getStatusCode()).toBe(400);
    expect(mockResponse._getJSONData()).toEqual({ message: 'กรุณาระบุ userId และ password' });
  });

  // Case 3: User not found
  test('should return 401 if user is not found', async () => {
    mockRequest.method = 'POST';
    mockRequest.body = { userId: 'notfound', password: 'password123' };

    global.__mongoMocks.mockFindOne.mockResolvedValueOnce(null);

    await handler(mockRequest, mockResponse);

    expect(mockResponse._getStatusCode()).toBe(401);
    expect(mockResponse._getJSONData()).toEqual({ message: 'User ไม่ถูกต้อง' });
  });

  // Case 4: User is suspended
  test('should return 403 if account is suspended', async () => {
    mockRequest.method = 'POST';
    mockRequest.body = { userId: 'suspended', password: 'password123' };

    const mockUser = {
      userId: 'suspended',
      password: 'password123',
      isSuspended: true,
    };

    global.__mongoMocks.mockFindOne.mockResolvedValueOnce(mockUser);

    await handler(mockRequest, mockResponse);

    expect(mockResponse._getStatusCode()).toBe(403);
    expect(mockResponse._getJSONData()).toEqual({ message: 'บัญชีนี้ถูกระงับการใช้งาน' });
  });

  // Case 5: User is not active
  test('should return 403 if account is not active', async () => {
    mockRequest.method = 'POST';
    mockRequest.body = { userId: 'inactive', password: 'password123' };

    const mockUser = {
      userId: 'inactive',
      password: 'password123',
      isActive: false,
    };

    global.__mongoMocks.mockFindOne.mockResolvedValueOnce(mockUser);

    await handler(mockRequest, mockResponse);

    expect(mockResponse._getStatusCode()).toBe(403);
    expect(mockResponse._getJSONData()).toEqual({ message: 'บัญชีนี้ถูกปิดการใช้งาน' });
  });

  // Case 6: Incorrect password
  test('should return 401 if password is incorrect', async () => {
    mockRequest.method = 'POST';
    mockRequest.body = { userId: 'testuser', password: 'wrongpassword' };

    const mockUser = {
      userId: 'testuser',
      password: 'correctpassword',
    };

    global.__mongoMocks.mockFindOne.mockResolvedValueOnce(mockUser);

    await handler(mockRequest, mockResponse);

    expect(mockResponse._getStatusCode()).toBe(401);
    expect(mockResponse._getJSONData()).toEqual({ message: 'Password ไม่ถูกต้อง' });
  });

  // Case 7: Successful login
  test('should return 200 on successful login and update lastActive', async () => {
    mockRequest.method = 'POST';
    mockRequest.body = { userId: 'testuser', password: 'correctpassword' };

    const mockUser = {
      userId: 'testuser',
      password: 'correctpassword',
      name: 'Test User',
      isSuspended: false,
      isActive: true,
    };

    global.__mongoMocks.mockFindOne.mockResolvedValueOnce(mockUser);
    global.__mongoMocks.mockUpdateOne.mockResolvedValueOnce({ matchedCount: 1 });

    await handler(mockRequest, mockResponse);

    expect(mockResponse._getStatusCode()).toBe(200);
    expect(mockResponse._getJSONData()).toEqual({
      success: true,
      userId: 'testuser',
      name: 'Test User',
    });
    // Verify that updateOne was called correctly
    expect(global.__mongoMocks.mockUpdateOne).toHaveBeenCalledWith(
      { userId: 'testuser' },
      { '$set': expect.any(Object) }
    );
  });

  // Case 8: Internal server error
  test('should return 500 if a server error occurs', async () => {
    mockRequest.method = 'POST';
    mockRequest.body = { userId: 'testuser', password: 'password123' };

    global.__mongoMocks.mockFindOne.mockRejectedValue(new Error('MongoDB connection failed'));

    await handler(mockRequest, mockResponse);

    expect(mockResponse._getStatusCode()).toBe(500);
    expect(mockResponse._getJSONData()).toEqual({ message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
  });
});