// __tests__/admin-login.test.ts
import httpMocks from 'node-mocks-http';
import handler from '../pages/api/admin-login';

// Mock `clientPromise`
jest.mock('@/lib/mongodb', () => {
    // ให้มีการกำหนดค่าเริ่มต้นของ __mongoMocks และ mock clientPromise
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
            MockObjectId: Object.assign(jest.fn(() => ({})), { isValid: jest.fn(() => true) })
        };
        // เพิ่ม property isValid ที่ถูกต้องตาม type definition
        global.__mongoMocks.MockObjectId.isValid = jest.fn(() => true); 
    }
    return {
        __esModule: true,
        default: jest.fn(() => global.__mongoMocks.mockClient),
    };
});

describe('Admin Login API Endpoint', () => {
    let mockRequest: httpMocks.MockRequest<any>;
    let mockResponse: httpMocks.MockResponse<any>;

    // เตรียม mock ก่อนการทดสอบแต่ละครั้ง
    beforeEach(() => {
        mockRequest = httpMocks.createRequest();
        mockResponse = httpMocks.createResponse();
        
        // Reset mocks
        jest.clearAllMocks();

        // Setup mock collection, db and client
        global.__mongoMocks.mockCollection.mockReturnValue({
            findOne: global.__mongoMocks.mockFindOne,
        });
        global.__mongoMocks.mockDb.mockReturnValue({
            collection: global.__mongoMocks.mockCollection,
        });
        global.__mongoMocks.mockClient = {
            db: global.__mongoMocks.mockDb,
        };
    });

    // Case 1: ทดสอบเมธอดที่ไม่ใช่ POST
    test('should return 405 if method is not POST', async () => {
        mockRequest.method = 'GET';

        await handler(mockRequest, mockResponse);

        // ตรวจสอบสถานะโค้ดและ message
        expect(mockResponse._getStatusCode()).toBe(405);
        expect(mockResponse._getHeaders()).toEqual({ 'Allow': 'POST' });
        expect(mockResponse._getJSONData()).toEqual({ message: 'Method GET ไม่ได้รับอนุญาต' });
    });

    // Case 2: ทดสอบกรณีที่ไม่มี adminId หรือ password
    test('should return 400 if adminId or password is missing', async () => {
        mockRequest.method = 'POST';
        mockRequest.body = { adminId: 'testadmin' }; // password หายไป

        await handler(mockRequest, mockResponse);

        // ตรวจสอบสถานะโค้ดและ message
        expect(mockResponse._getStatusCode()).toBe(400);
        expect(mockResponse._getJSONData()).toEqual({ message: 'กรุณาใส่ adminId และ password' });
    });

    // Case 3: ทดสอบกรณีที่ admin ไม่พบในฐานข้อมูล
    test('should return 401 if adminId is not found', async () => {
        mockRequest.method = 'POST';
        mockRequest.body = { adminId: 'notfound', password: 'password123' };

        // Mock findOne ให้คืนค่า null (ไม่พบ admin)
        global.__mongoMocks.mockFindOne.mockResolvedValue(null);

        await handler(mockRequest, mockResponse);

        // ตรวจสอบว่า `findOne` ถูกเรียกใช้ด้วย AdminId ที่ถูกต้อง
        expect(global.__mongoMocks.mockFindOne).toHaveBeenCalledWith({ AdminId: 'notfound' });
        expect(mockResponse._getStatusCode()).toBe(401);
        expect(mockResponse._getJSONData()).toEqual({ message: 'Admin ID หรือ Password ไม่ถูกต้อง' });
    });

    // Case 4: ทดสอบกรณีที่ password ไม่ถูกต้อง
    test('should return 401 if password is incorrect', async () => {
        mockRequest.method = 'POST';
        mockRequest.body = { adminId: 'testadmin', password: 'wrongpassword' };

        // Mock findOne ให้คืนค่า admin ที่มี password ไม่ตรงกัน
        global.__mongoMocks.mockFindOne.mockResolvedValue({
            AdminId: 'testadmin',
            password: 'correctpassword',
        });

        await handler(mockRequest, mockResponse);

        expect(mockResponse._getStatusCode()).toBe(401);
        expect(mockResponse._getJSONData()).toEqual({ message: 'Admin ID หรือ Password ไม่ถูกต้อง' });
    });

    // Case 5: ทดสอบการเข้าสู่ระบบสำเร็จ
    test('should return 200 on successful login', async () => {
        mockRequest.method = 'POST';
        mockRequest.body = { adminId: 'testadmin', password: 'correctpassword' };

        // Mock findOne ให้คืนค่า admin ที่ถูกต้อง
        global.__mongoMocks.mockFindOne.mockResolvedValue({
            AdminId: 'testadmin',
            password: 'correctpassword',
            name: 'Test Admin',
        });

        await handler(mockRequest, mockResponse);

        expect(mockResponse._getStatusCode()).toBe(200);
        expect(mockResponse._getJSONData()).toEqual({ message: 'เข้าสู่ระบบสำเร็จ' });
    });

    // Case 6: ทดสอบกรณีเกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
    test('should return 500 if an internal server error occurs', async () => {
        mockRequest.method = 'POST';
        mockRequest.body = { adminId: 'testadmin', password: 'password123' };
        
        // Mock findOne ให้ throw error
        global.__mongoMocks.mockFindOne.mockRejectedValue(new Error('MongoDB connection error'));
        
        await handler(mockRequest, mockResponse);
        
        expect(mockResponse._getStatusCode()).toBe(500);
        expect(mockResponse._getJSONData()).toEqual({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    });
});