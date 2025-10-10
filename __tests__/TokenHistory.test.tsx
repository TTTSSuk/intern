//__tests__/TokenHistory.test.tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TokenHistoryPage from '../pages/TokenHistory';
import { useRouter } from 'next/router';

// Mock useRouter
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

// ✅ Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    length: 0,
    key: jest.fn(),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// ✅ ข้อมูล Mock ที่ตรงกับโครงสร้างที่ API ส่งกลับมา
const mockApiResponse = {
  tokens: 100,
  reservedTokens: 10,
  tokenHistory: [
    { 
      _id: { $oid: 'id1' }, 
      date: '2025-01-01T10:00:00Z', 
      change: -10, 
      reason: 'สร้างวิดีโอ', 
      type: 'video_creation',
      executionId: 'exec123', 
      folderName: 'Project A', 
      fileName: 'File A.zip' 
    },
    { 
      _id: { $oid: 'id2' }, 
      date: '2025-01-05T14:00:00Z', 
      change: 5, 
      reason: 'ซื้อ Token', 
      type: 'purchase' 
    },
  ],
};

describe('TokenHistoryPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // ✅ Set userId ใน localStorage
    localStorageMock.setItem('loggedInUser', 'testUserId');
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      query: {},
      isReady: true,
    });
    
    // Mock การเรียก API
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it('ควรแสดงผลและดึงข้อมูลสถานะโทเค็นอย่างถูกต้อง', async () => {
    render(<TokenHistoryPage />);

    // ✅ ตรวจสอบ Loading state ด้วยข้อความที่ถูกต้อง
    expect(screen.getByText(/กำลังโหลดข้อมูล.../i)).toBeInTheDocument();
    
    // ✅ รอให้โหลดเสร็จและตรวจสอบข้อมูล
    await waitFor(() => {
      // ตรวจสอบจำนวนโทเค็น
      expect(screen.getByText('100')).toBeInTheDocument();
    }, { timeout: 3000 });

    // ตรวจสอบโทเค็นที่ถูกจอง
    expect(screen.getByText(/จอง 10 Tokens/i)).toBeInTheDocument();

    // ตรวจสอบรายการประวัติ - ใช้ getByText แบบ exact: false
    expect(screen.getByText('สร้างวิดีโอ', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('ซื้อ Token', { exact: false })).toBeInTheDocument();
  });

  it('ควรแสดงรายละเอียดเมื่อคลิกที่รายการ', async () => {
    render(<TokenHistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('สร้างวิดีโอ', { exact: false })).toBeInTheDocument();
    }, { timeout: 3000 });

    // ✅ คลิกที่แถวของตาราง
    const videoCreationText = screen.getByText('สร้างวิดีโอ', { exact: false });
    const row = videoCreationText.closest('tr');
    
    if (row) {
      fireEvent.click(row);
    }

    // ตรวจสอบว่ามี Modal แสดงรายละเอียด
    await waitFor(() => {
      expect(screen.getByText(/รายละเอียด/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // ตรวจสอบข้อมูลที่แสดงใน modal
    expect(screen.getByText('Project A')).toBeInTheDocument();
    expect(screen.getByText('File A.zip')).toBeInTheDocument();
    expect(screen.getByText('exec123')).toBeInTheDocument();
  });

  it('ควร redirect ไปหน้า login ถ้าไม่มี userId ใน localStorage', () => {
    localStorageMock.clear();

    render(<TokenHistoryPage />);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('ควรแสดงข้อความเมื่อไม่มีข้อมูลประวัติ', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        tokens: 0,
        reservedTokens: 0,
        tokenHistory: [],
      }),
    });

    render(<TokenHistoryPage />);

    await waitFor(() => {
      expect(screen.getByText(/ไม่พบข้อมูลที่ตรงกับตัวกรอง/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});