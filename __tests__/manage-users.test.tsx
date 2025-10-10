import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/router';
import ManageUsers from '@/pages/admin/manage-users';
import '@testing-library/jest-dom';

// Mock `next/router`
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock `AdminLayout`
jest.mock('@/components/Layouts/AdminLayout', () => {
  return ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
});

// Mock data
const mockUsers = [
  { userId: 'u1', name: 'Alice', isActive: true, isSuspended: false, lastActive: new Date().toISOString() },
  { userId: 'u2', name: 'Bob', isActive: true, isSuspended: false, lastActive: new Date(Date.now() - 10 * 60000).toISOString() }, // Offline
  { userId: 'u3', name: 'Charlie', isActive: false, isSuspended: false, lastActive: null },
  { userId: 'u4', name: 'David', isActive: true, isSuspended: true, lastActive: new Date().toISOString() },
  { userId: 'u5', name: 'Eve', isActive: true, isSuspended: false, lastActive: new Date().toISOString() },
  { userId: 'u6', name: 'Frank', isActive: true, isSuspended: false, lastActive: new Date().toISOString() },
  { userId: 'u7', name: 'Grace', isActive: true, isSuspended: false, lastActive: new Date().toISOString() },
];

describe('ManageUsers', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, users: mockUsers }),
    } as Response);
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ควรแสดงข้อความกำลังโหลดเมื่อข้อมูลกำลังถูกดึง', () => {
    render(<ManageUsers />);
    expect(screen.getByText('กำลังโหลดข้อมูลผู้ใช้...')).toBeInTheDocument();
  });

  it('ควรแสดงรายชื่อผู้ใช้เมื่อข้อมูลถูกดึงมาสำเร็จ', async () => {
    render(<ManageUsers />);
    await waitFor(() => expect(screen.getByText('รายชื่อผู้ใช้')).toBeInTheDocument());
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    
    // The component shows 5 users per page + 1 header row = 6 rows
    // Not all 7 users are displayed due to pagination
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(6); // 5 users + 1 header
  });

  it('ควรกรองผู้ใช้เมื่อมีการค้นหา', async () => {
    render(<ManageUsers />);
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText('ค้นหาชื่อผู้ใช้...');
    fireEvent.change(searchInput, { target: { value: 'Bob' } });

    await waitFor(() => expect(screen.queryByText('Alice')).not.toBeInTheDocument());
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('ควรจัดการ pagination ได้อย่างถูกต้อง', async () => {
    const mockManyUsers = Array.from({ length: 12 }, (_, i) => ({
      userId: `u${i + 1}`,
      name: `User ${i + 1}`,
      isActive: true,
      isSuspended: false,
      lastActive: new Date().toISOString(),
    }));
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, users: mockManyUsers }),
    } as Response);

    render(<ManageUsers />);
    await waitFor(() => expect(screen.getByText('User 1')).toBeInTheDocument());
    expect(screen.queryByText('User 6')).not.toBeInTheDocument();

    // Find the next page button (page 2 button)
    const page2Button = screen.getByRole('button', { name: '2' });
    fireEvent.click(page2Button);
    
    await waitFor(() => expect(screen.getByText('User 6')).toBeInTheDocument());
    expect(screen.queryByText('User 1')).not.toBeInTheDocument();
  });

  it('ควรแสดงสถานะของผู้ใช้อย่างถูกต้อง', async () => {
  render(<ManageUsers />);
  await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

  // ตรวจสอบว่ามีผู้ใช้ที่ออนไลน์/ออฟไลน์
  expect(screen.getAllByText('ออนไลน์').length).toBeGreaterThan(0);
  expect(screen.getAllByText('ออฟไลน์').length).toBeGreaterThan(0);

  // ตรวจสอบสถานะเปิดใช้งาน/ปิดใช้งาน
  expect(screen.getAllByText('เปิดใช้งาน').length).toBeGreaterThan(0);
  expect(screen.getAllByText('ปิดใช้งาน').length).toBeGreaterThan(0);

  // ตรวจสอบสถานะระงับ
  expect(screen.getAllByText('ระงับบัญชี').length).toBeGreaterThan(0);
  expect(screen.getAllByText('ปกติ').length).toBeGreaterThan(0);
});

  it('ควรนำทางไปยังหน้าจัดการผู้ใช้เมื่อคลิกปุ่มจัดการ', async () => {
    render(<ManageUsers />);
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

    // Get all "จัดการ" buttons and click the first one
    const manageButtons = screen.getAllByRole('button', { name: 'จัดการ' });
    fireEvent.click(manageButtons[0]);

    expect(mockPush).toHaveBeenCalledWith('/admin/user/u1');
  });

  it('ควรแสดงข้อความเมื่อไม่พบผู้ใช้จากการค้นหา', async () => {
    render(<ManageUsers />);
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText('ค้นหาชื่อผู้ใช้...');
    fireEvent.change(searchInput, { target: { value: 'NonExistentUser' } });

    await waitFor(() => {
      expect(screen.getByText('ไม่พบข้อมูลผู้ใช้ที่ตรงกับการค้นหา')).toBeInTheDocument();
    });
  });

  it('ควรแสดงจำนวนผู้ใช้ที่ถูกต้อง', async () => {
    render(<ManageUsers />);
    await waitFor(() => {
      expect(screen.getByText(`จำนวน ${mockUsers.length} คน`)).toBeInTheDocument();
    });
  });

  it('ควรรีเซ็ตหน้าเป็น 1 เมื่อมีการค้นหา', async () => {
    const mockManyUsers = Array.from({ length: 12 }, (_, i) => ({
      userId: `u${i + 1}`,
      name: `User ${i + 1}`,
      isActive: true,
      isSuspended: false,
      lastActive: new Date().toISOString(),
    }));
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, users: mockManyUsers }),
    } as Response);

    render(<ManageUsers />);
    await waitFor(() => expect(screen.getByText('User 1')).toBeInTheDocument());

    // Go to page 2
    const page2Button = screen.getByRole('button', { name: '2' });
    fireEvent.click(page2Button);
    await waitFor(() => expect(screen.getByText('User 6')).toBeInTheDocument());

    // Search - should reset to page 1
    const searchInput = screen.getByPlaceholderText('ค้นหาชื่อผู้ใช้...');
    fireEvent.change(searchInput, { target: { value: 'User 1' } });

    await waitFor(() => {
      expect(screen.getByText('User 1')).toBeInTheDocument();
      // Page 2 button should not exist when filtered results fit on one page
      expect(screen.queryByRole('button', { name: '2' })).not.toBeInTheDocument();
    });
  });
});