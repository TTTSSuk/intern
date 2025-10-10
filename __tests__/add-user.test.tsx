import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import AddUserPage from '@/pages/admin/add-user';

// Mock `next/router`
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock `AdminLayout`
jest.mock('@/components/Layouts/AdminLayout', () => {
  return ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
});

describe('AddUserPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (global.fetch as jest.Mock) = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ควรส่งข้อมูลการเพิ่มผู้ใช้ไปยัง API และแสดงข้อความสำเร็จ', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<AddUserPage />);

    const nameInput = screen.getByPlaceholderText('ชื่อผู้ใช้');
    const addButton = screen.getByRole('button', { name: /เพิ่มผู้ใช้/i });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"name":"Test User"'),
      });
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('เพิ่มผู้ใช้สำเร็จ!'));
    });
  });

  it('ควรยกเลิกการเพิ่มผู้ใช้เมื่อผู้ใช้กด cancel ใน confirm box', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(<AddUserPage />);

    const nameInput = screen.getByPlaceholderText('ชื่อผู้ใช้');
    const addButton = screen.getByRole('button', { name: /เพิ่มผู้ใช้/i });

    fireEvent.change(nameInput, { target: { value: 'Cancel User' } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
