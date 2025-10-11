import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from '@/pages/admin/dashboard';
import '@testing-library/jest-dom';

// Mock `AdminLayout` เพื่อไม่ให้เกิดข้อผิดพลาดในการเรนเดอร์
jest.mock('@/components/Layouts/AdminLayout', () => {
  return ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
});

// Mock `localStorage`
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('AdminDashboard', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = () => { return; };
  });
  afterAll(() => {
    console.error = originalError;
  });
  
  beforeEach(() => {
    (global.fetch as jest.Mock) = jest.fn();
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ควรแสดงข้อความกำลังโหลดในขณะที่ข้อมูลกำลังถูกเรียก', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<AdminDashboard />);
    expect(screen.getByText('กำลังโหลดข้อมูล...')).toBeInTheDocument();
  });

  it('ควรแสดงข้อมูลแดชบอร์ดเมื่อการเรียก API สำเร็จ', async () => {
    const mockStats = {
      adminName: 'Admin Test',
      totalUsers: 1500,
      onlineUsers: 5,
      totalVideos: 300,
      growthRate: 15.5,
      pendingApprovals: 2,
      newUsersThisMonth: 50,
      onlineUsersList: [{ id: 'u1', name: 'User A', email: 'a@example.com', lastActive: '2025-10-10T10:00:00Z' }],
      recentUsers: [{ id: 'u2', name: 'User B', email: 'b@example.com', lastActive: '2025-10-10T09:00:00Z' }],
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats,
    });

    localStorage.setItem('loggedInAdmin', 'testAdmin123');

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('ยินดีต้อนรับ Admin Test 👋')).toBeInTheDocument();
    });

    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText('2 รออนุมัติ')).toBeInTheDocument();
    expect(screen.getByText('User A')).toBeInTheDocument();
  });

  it('ควรแสดงข้อผิดพลาดเมื่อการเรียก API ล้มเหลว', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API failed'));

    localStorage.setItem('loggedInAdmin', 'testAdmin123');

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('ไม่สามารถโหลดข้อมูลได้')).toBeInTheDocument();
    });
  });
});
