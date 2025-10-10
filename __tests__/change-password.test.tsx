jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChangePassword from '../pages/change-password';
import { useRouter } from 'next/router';

// Mocking useRouter
const mockBack = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  back: mockBack,
});

// Mocking fetch API
const mockFetch = jest.spyOn(global, 'fetch');

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

describe('ChangePassword', () => {
  beforeEach(() => {
    localStorageMock.clear();
    mockBack.mockClear();
    mockFetch.mockClear();

    // กำหนดค่าเริ่มต้นใน localStorage: ล็อกอินอยู่
    localStorage.setItem('loggedInUser', 'user456');
  });

  const setup = () => {
    render(<ChangePassword />);
    const currentPassInput = screen.getAllByLabelText(/รหัสผ่านปัจจุบัน:/i)[0];
    const newPassInput = screen.getAllByLabelText(/รหัสผ่านใหม่:/i)[0];
    const confirmPassInput = screen.getAllByLabelText(/ยืนยันรหัสผ่านใหม่:/i)[0];
    const submitButton = screen.getByRole('button', { name: /เปลี่ยนรหัสผ่าน/i });
    return { currentPassInput, newPassInput, confirmPassInput, submitButton };
  };

  it('ควรเรียก router.back เมื่อคลิกปุ่มย้อนกลับ', () => {
    render(<ChangePassword />);
    const backButton = screen.getByLabelText('ย้อนกลับ');

    fireEvent.click(backButton);

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('ควรแสดงข้อผิดพลาดเมื่อรหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน', async () => {
    const { currentPassInput, newPassInput, confirmPassInput, submitButton } = setup();

    fireEvent.change(currentPassInput, { target: { value: 'oldpass' } });
    fireEvent.change(newPassInput, { target: { value: 'newpass123' } });
    fireEvent.change(confirmPassInput, { target: { value: 'newpass456' } }); // ไม่ตรงกัน

    fireEvent.click(submitButton);

    // ตรวจสอบข้อความแสดงผล - ใช้ rgb format แทน
    const errorMessage = screen.getByText('รหัสผ่านใหม่กับยืนยันรหัสผ่านไม่ตรงกัน');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('ควรแสดงข้อผิดพลาดเมื่อไม่มี userId ใน localStorage', async () => {
    localStorage.clear(); // ล้าง localStorage เพื่อจำลองว่าไม่ได้ล็อกอิน
    const { currentPassInput, newPassInput, confirmPassInput, submitButton } = setup();

    fireEvent.change(currentPassInput, { target: { value: 'oldpass' } });
    fireEvent.change(newPassInput, { target: { value: 'newpass123' } });
    fireEvent.change(confirmPassInput, { target: { value: 'newpass123' } });

    fireEvent.click(submitButton);

    // ตรวจสอบข้อความแสดงผล
    const errorMessage = screen.getByText('กรุณาล็อกอินก่อนเปลี่ยนรหัสผ่าน');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('ควรเปลี่ยนรหัสผ่านสำเร็จเมื่อส่งข้อมูลถูกต้อง', async () => {
    // 1. Mock API call ให้สำเร็จ
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Password changed successfully' }),
    } as Response);

    const { currentPassInput, newPassInput, confirmPassInput, submitButton } = setup();

    // 2. ป้อนข้อมูลที่ถูกต้อง
    fireEvent.change(currentPassInput, { target: { value: 'oldpass' } });
    fireEvent.change(newPassInput, { target: { value: 'newpass123' } });
    fireEvent.change(confirmPassInput, { target: { value: 'newpass123' } });
    fireEvent.click(submitButton);

    // 3. ตรวจสอบการเรียก fetch
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/change-password');
    expect(JSON.parse(options?.body as string)).toEqual({
      userId: 'user456',
      currentPassword: 'oldpass',
      newPassword: 'newpass123',
    });

    // 4. ตรวจสอบข้อความและค่าในฟอร์ม - รอให้ state update เสร็จ
    await waitFor(() => {
      const successMessage = screen.getByText('เปลี่ยนรหัสผ่านสำเร็จ');
      expect(successMessage).toBeInTheDocument();
      expect(successMessage).toHaveStyle({ color: 'rgb(0, 128, 0)' });
    });

    expect(currentPassInput).toHaveValue('');
    expect(newPassInput).toHaveValue('');
    expect(confirmPassInput).toHaveValue('');
  });

  it('ควรแสดงข้อผิดพลาดเมื่อ API ตอบกลับไม่สำเร็จ', async () => {
    // 1. Mock API call ให้ล้มเหลว
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }),
    } as Response);

    const { currentPassInput, newPassInput, confirmPassInput, submitButton } = setup();

    // 2. ป้อนข้อมูล
    fireEvent.change(currentPassInput, { target: { value: 'wrongpass' } });
    fireEvent.change(newPassInput, { target: { value: 'newpass123' } });
    fireEvent.change(confirmPassInput, { target: { value: 'newpass123' } });

    fireEvent.click(submitButton);

    // 3. ตรวจสอบข้อความแสดงผล
    await waitFor(() => {
      const errorMessage = screen.getByText('รหัสผ่านปัจจุบันไม่ถูกต้อง');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    });
  });
});