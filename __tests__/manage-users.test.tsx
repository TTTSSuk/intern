// __tests__/manage-users.test.tsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ManageUsers from '@/pages/admin/manage-users';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    pathname: '/admin/manage-users',
    query: {},
  })),
}));

// Mock AdminLayout
jest.mock('@/components/Layouts/AdminLayout', () => {
  return function MockAdminLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="admin-layout">{children}</div>;
  };
});

describe('ManageUsers Component', () => {
  const mockUsers = [
    {
      userId: 'user1',
      name: 'John Doe',
      isActive: true,
      isSuspended: false,
      lastActive: new Date().toISOString(),
    },
    {
      userId: 'user2',
      name: 'Jane Smith',
      isActive: true,
      isSuspended: false,
      lastActive: new Date(Date.now() - 10 * 60000).toISOString(),
    },
    {
      userId: 'user3',
      name: 'Bob Wilson',
      isActive: false,
      isSuspended: true,
      lastActive: new Date(Date.now() - 2 * 60000).toISOString(),
    },
    {
      userId: 'user4',
      name: 'Alice Brown',
      isActive: true,
      isSuspended: false,
      lastActive: new Date(Date.now() - 1 * 60000).toISOString(),
    },
    {
      userId: 'user5',
      name: 'Charlie Green',
      isActive: false,
      isSuspended: false,
      lastActive: new Date(Date.now() - 60 * 60000).toISOString(),
    },
  ];

  // Suppress console.error for act() warnings
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn((...args) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('Not wrapped in act')
      ) {
        return;
      }
      originalError.call(console, ...args);
    });
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            users: mockUsers,
          }),
      })
    ) as jest.Mock;
  });

  test('1. should render AdminLayout wrapper', () => {
    render(<ManageUsers />);
    expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
  });

  test('2. should display loading state initially', () => {
    render(<ManageUsers />);
    expect(screen.getByText(/กำลังโหลดข้อมูลผู้ใช้/)).toBeInTheDocument();
  });

  test('3. should fetch and display users after loading', async () => {
    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.queryByText(/กำลังโหลดข้อมูลผู้ใช้/)).not.toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
  });

  test('4. should display correct user count', async () => {
    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getByText(/จำนวน 5 คน/)).toBeInTheDocument();
    });
  });

  test('5. should filter users based on search term', async () => {
    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.queryByText(/กำลังโหลดข้อมูลผู้ใช้/)).not.toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/ค้นหาชื่อผู้ใช้/);
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  test('6. should show "no users found" message when search has no results', async () => {
    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.queryByText(/กำลังโหลดข้อมูลผู้ใช้/)).not.toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/ค้นหาชื่อผู้ใช้/);
    fireEvent.change(searchInput, { target: { value: 'NonExistentUser' } });

    await waitFor(() => {
      expect(screen.getByText(/ไม่พบข้อมูลผู้ใช้ที่ตรงกับการค้นหา/)).toBeInTheDocument();
    });
  });

  test('7. should display active/inactive status correctly', async () => {
    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.queryByText(/กำลังโหลดข้อมูลผู้ใช้/)).not.toBeInTheDocument();
    });

    const activeLabels = screen.getAllByText('เปิดใช้งาน');
    const inactiveLabels = screen.getAllByText('ปิดใช้งาน');

    expect(activeLabels.length).toBeGreaterThan(0);
    expect(inactiveLabels.length).toBeGreaterThan(0);
  });

  test('8. should show online/offline status for users', async () => {
    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.queryByText(/กำลังโหลดข้อมูลผู้ใช้/)).not.toBeInTheDocument();
    });

    const tbody = document.querySelector('tbody');
    expect(tbody).toBeInTheDocument();
    
    const statusSpans = tbody!.querySelectorAll('span.inline-flex.items-center');
    const statusLabels = Array.from(statusSpans).filter(
      el => el.textContent?.includes('ออนไลน์') || el.textContent?.includes('ออฟไลน์')
    );
    
    expect(statusLabels.length).toBe(5);
    
    const onlineCount = statusLabels.filter(el => el.textContent?.includes('ออนไลน์')).length;
    const offlineCount = statusLabels.filter(el => el.textContent?.includes('ออฟไลน์')).length;
    
    expect(onlineCount).toBeGreaterThan(0);
    expect(offlineCount).toBeGreaterThan(0);
  });

  test('9. should display suspended status correctly', async () => {
    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.queryByText(/กำลังโหลดข้อมูลผู้ใช้/)).not.toBeInTheDocument();
    });

    const suspendedLabels = screen.getAllByText('ระงับบัญชี');
    const normalLabels = screen.getAllByText('ปกติ');

    expect(suspendedLabels.length).toBeGreaterThan(0);
    expect(normalLabels.length).toBeGreaterThan(0);
  });

  test('10. should navigate to user detail page when manage button is clicked', async () => {
    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.queryByText(/กำลังโหลดข้อมูลผู้ใช้/)).not.toBeInTheDocument();
    });

    const manageButtons = screen.getAllByRole('button', { name: /จัดการ/i });
    fireEvent.click(manageButtons[0]);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/user/user1');
    });
  });

  test('11. should handle pagination correctly', async () => {
    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.queryByText(/กำลังโหลดข้อมูลผู้ใช้/)).not.toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    expect(screen.getByText('Alice Brown')).toBeInTheDocument();
    expect(screen.getByText('Charlie Green')).toBeInTheDocument();
  });

  test('12. should not show pagination info when users fit in one page', async () => {
    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.queryByText(/กำลังโหลดข้อมูลผู้ใช้/)).not.toBeInTheDocument();
    });

    // With 5 users and 5 per page, pagination controls should not appear
    expect(screen.queryByText(/แสดง.*จาก/)).not.toBeInTheDocument();
  });

  test('13. should handle fetch errors gracefully', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Fetch error'))) as jest.Mock;

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.queryByText(/กำลังโหลดข้อมูลผู้ใช้/)).not.toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching users:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  test('14. should display empty state when no users exist', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            users: [],
          }),
      })
    ) as jest.Mock;

    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getByText(/ไม่พบข้อมูลผู้ใช้ที่ตรงกับการค้นหา/)).toBeInTheDocument();
    });
  });

  test('15. should show pagination when there are more than 5 users', async () => {
    const manyUsers = Array.from({ length: 12 }, (_, i) => ({
      userId: `user${i + 1}`,
      name: `User ${i + 1}`,
      isActive: true,
      isSuspended: false,
      lastActive: new Date().toISOString(),
    }));

    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            users: manyUsers,
          }),
      })
    ) as jest.Mock;

    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.queryByText(/กำลังโหลดข้อมูลผู้ใช้/)).not.toBeInTheDocument();
    });

    // Should show pagination info
    expect(screen.getByText(/แสดง 1-5 จาก 12 คน/)).toBeInTheDocument();
    
    // Should show page buttons
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
  });

  test('16. should navigate between pages', async () => {
    const manyUsers = Array.from({ length: 12 }, (_, i) => ({
      userId: `user${i + 1}`,
      name: `User ${i + 1}`,
      isActive: true,
      isSuspended: false,
      lastActive: new Date().toISOString(),
    }));

    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            users: manyUsers,
          }),
      })
    ) as jest.Mock;

    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.queryByText(/กำลังโหลดข้อมูลผู้ใช้/)).not.toBeInTheDocument();
    });

    // First page shows User 1-5
    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.queryByText('User 6')).not.toBeInTheDocument();

    // Click page 2
    const page2Button = screen.getByRole('button', { name: '2' });
    fireEvent.click(page2Button);

    // Second page shows User 6-10
    await waitFor(() => {
      expect(screen.getByText('User 6')).toBeInTheDocument();
      expect(screen.queryByText('User 1')).not.toBeInTheDocument();
    });
  });

  test('17. should reset to page 1 when search term changes', async () => {
    const manyUsers = Array.from({ length: 12 }, (_, i) => ({
      userId: `user${i + 1}`,
      name: `User ${i + 1}`,
      isActive: true,
      isSuspended: false,
      lastActive: new Date().toISOString(),
    }));

    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            users: manyUsers,
          }),
      })
    ) as jest.Mock;

    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.queryByText(/กำลังโหลดข้อมูลผู้ใช้/)).not.toBeInTheDocument();
    });

    // Go to page 2
    const page2Button = screen.getByRole('button', { name: '2' });
    fireEvent.click(page2Button);

    await waitFor(() => {
      expect(screen.getByText('User 6')).toBeInTheDocument();
    });

    // Search for "User 1" - this will find User 1, 10, 11, 12 (4 users - fits in one page)
    const searchInput = screen.getByPlaceholderText(/ค้นหาชื่อผู้ใช้/);
    fireEvent.change(searchInput, { target: { value: 'User 1' } });

    // After search, should show results and pagination should disappear (only 4 results)
    await waitFor(() => {
      expect(screen.getByText('User 1')).toBeInTheDocument();
      expect(screen.getByText('User 10')).toBeInTheDocument();
      // Pagination should not exist because only 4 results fit in one page
      expect(screen.queryByRole('button', { name: '2' })).not.toBeInTheDocument();
    });
  });
});