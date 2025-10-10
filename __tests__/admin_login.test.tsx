import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import AdminLogin from '@/pages/admin/login';
import '@testing-library/jest-dom';

// Mock `next/router`
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

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

describe('AdminLogin', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    localStorage.clear();
    (global.fetch as jest.Mock).mockReset(); // reset fetch mock
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ควรแสดงข้อผิดพลาดเมื่อไม่มีการกรอกข้อมูล', async () => {
    render(<AdminLogin />);
    const loginButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i });

    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('กรุณากรอก Admin ID')).toBeInTheDocument();
    });
  });

  it('ควรเข้าสู่ระบบสำเร็จและ redirect ไปที่ dashboard', async () => {
    // Mock fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, adminId: 'testAdmin123' }),
    } as Response);

    render(<AdminLogin />);
    fireEvent.change(screen.getByPlaceholderText('กรอก Admin ID'), { target: { value: 'testAdmin123' } });
    fireEvent.change(screen.getByPlaceholderText('กรอกรหัสผ่าน'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin-login', expect.anything());
    });

    await waitFor(() => {
      expect(localStorage.getItem('loggedInAdmin')).toBe('testAdmin123');
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('ควรแสดงข้อผิดพลาดเมื่อเข้าสู่ระบบล้มเหลว', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: 'Admin ID หรือ Password ไม่ถูกต้อง' }),
    } as Response);

    render(<AdminLogin />);
    fireEvent.change(screen.getByPlaceholderText('กรอก Admin ID'), { target: { value: 'wrongAdmin' } });
    fireEvent.change(screen.getByPlaceholderText('กรอกรหัสผ่าน'), { target: { value: 'wrongPassword' } });
    fireEvent.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/i }));

    await waitFor(() => {
      expect(screen.getByText('Admin ID หรือ Password ไม่ถูกต้อง')).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
