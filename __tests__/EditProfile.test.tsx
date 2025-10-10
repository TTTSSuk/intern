import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditProfile from '../pages/EditProfile';

// Mocking localStorage
const localStorageMock = (function () {
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

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mocking alert
const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

// Mock Router
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    back: mockBack,
  })),
}));

describe('EditProfile', () => {
  beforeEach(() => {
    localStorageMock.clear();
    mockPush.mockClear();
    mockBack.mockClear();
    (global.fetch as jest.Mock).mockClear(); // ✅ ใช้ global.fetch
    mockAlert.mockClear();

    localStorage.setItem('loggedInUser', 'user123');
    localStorage.setItem('userName', 'เดิมชื่อ');
    localStorage.setItem('avatarUrl', 'http://old.avatar/url.jpg');
  });

  it('ควรโหลดค่าเริ่มต้นจาก localStorage และแสดงผลอย่างถูกต้อง', () => {
    render(<EditProfile />);

    expect(screen.getByLabelText(/User ID:/i)).toHaveValue('user123');
    expect(screen.getByLabelText(/ชื่อ:/i)).toHaveValue('เดิมชื่อ');
  });

  it('ควรอัพเดทสถานะเมื่อเปลี่ยนชื่อผู้ใช้', () => {
    render(<EditProfile />);
    const nameInput = screen.getByLabelText(/ชื่อ:/i);

    fireEvent.change(nameInput, { target: { value: 'ชื่อใหม่' } });

    expect(nameInput).toHaveValue('ชื่อใหม่');
  });

  it('ควรเรียก router.back เมื่อคลิกปุ่มย้อนกลับ', () => {
    render(<EditProfile />);
    const backButton = screen.getByLabelText('ย้อนกลับ');

    fireEvent.click(backButton);

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('ควรเรียก router.back เมื่อคลิกปุ่มยกเลิก', () => {
    render(<EditProfile />);
    const cancelButton = screen.getByRole('button', { name: /ยกเลิก/i });

    fireEvent.click(cancelButton);

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('ควรปิดใช้งานปุ่มบันทึกเมื่อชื่อว่างเปล่า', () => {
    render(<EditProfile />);
    const nameInput = screen.getByLabelText(/ชื่อ:/i);
    const saveButton = screen.getByRole('button', { name: /บันทึก/i });

    // ทดสอบเมื่อชื่อไม่ว่าง
    fireEvent.change(nameInput, { target: { value: 'ชื่อที่ป้อน' } });
    expect(saveButton).toBeEnabled();

    // ทดสอบเมื่อชื่อว่าง
    fireEvent.change(nameInput, { target: { value: '  ' } });
    expect(saveButton).toBeDisabled();
    
    fireEvent.change(nameInput, { target: { value: '' } });
    expect(saveButton).toBeDisabled();
  });

  it('ควรส่งข้อมูลและบันทึกใน localStorage เมื่อสำเร็จ', async () => {
    // ✅ Mock API call ให้สำเร็จ - ใช้ global.fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ avatarUrl: 'http://new.avatar/url.jpg' }),
    });
    
    render(<EditProfile />);
    const nameInput = screen.getByLabelText(/ชื่อ:/i);
    const saveButton = screen.getByRole('button', { name: /บันทึก/i });
    
    fireEvent.change(nameInput, { target: { value: 'ชื่อทดสอบ' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1); // ✅ ใช้ global.fetch
    });

    // ตรวจสอบการเรียก fetch
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0]; // ✅ ใช้ global.fetch
    expect(url).toBe('/api/users/update');
    expect(options?.method).toBe('POST');
    
    // ตรวจสอบ localStorage และการนำทาง
    expect(localStorage.getItem('userName')).toBe('ชื่อทดสอบ');
    expect(localStorage.getItem('avatarUrl')).toBe('http://new.avatar/url.jpg');
    expect(mockAlert).toHaveBeenCalledWith('บันทึกข้อมูลเรียบร้อยแล้ว');
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('ควรแสดงข้อผิดพลาดเมื่อ API ตอบกลับไม่สำเร็จ', async () => {
    // ✅ Mock API call ให้ล้มเหลว - ใช้ global.fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'ชื่อนี้ถูกใช้แล้ว' }),
    });
    
    render(<EditProfile />);
    const nameInput = screen.getByLabelText(/ชื่อ:/i);
    const saveButton = screen.getByRole('button', { name: /บันทึก/i });
    
    fireEvent.change(nameInput, { target: { value: 'ชื่อใหม่' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1); // ✅ ใช้ global.fetch
    });

    // ตรวจสอบการแจ้งเตือน
    expect(mockAlert).toHaveBeenCalledWith('ชื่อนี้ถูกใช้แล้ว');
    expect(mockPush).not.toHaveBeenCalled();
  });
});