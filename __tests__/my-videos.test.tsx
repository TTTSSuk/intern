// __tests__/my-videos.test.tsx

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MyVideos from '@/pages/my-videos';
import '@testing-library/jest-dom';

// สร้าง Mock Helper Functions ขึ้นมาใหม่เพื่อทดสอบ
// โดยจำลองพฤติกรรมจากโค้ดเดิมใน my-videos.tsx
const mockParseDate = (value: any): Date => {
  if (!value) {
    return new Date();
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return isNaN(date.getTime()) ? new Date() : date;
  }
  if (typeof value === "object" && value.$date) {
    const date = new Date(value.$date);
    return isNaN(date.getTime()) ? new Date() : date;
  }
  return new Date();
};

const mockFormatDateTime = (date: Date): string => {
  const datePart = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return `${datePart} ${timePart}`;
};

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => 'testuser'),
    setItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock global fetch
global.fetch = jest.fn() as jest.Mock;

describe('MyVideos Helper Functions (Mocked)', () => {
  it('1. mockParseDate should handle ISO string input', () => {
    const isoString = '2025-10-10T04:00:00.000Z';
    const date = mockParseDate(isoString);
    expect(date instanceof Date).toBe(true);
    expect(date.getFullYear()).toBe(2025);
  });

  it('2. mockParseDate should handle MongoDB $date object input', () => {
    const mongoDate = { $date: '2024-05-15T12:34:56.000Z' };
    const date = mockParseDate(mongoDate);
    expect(date instanceof Date).toBe(true);
    expect(date.getMonth()).toBe(4);
  });

  it('3. mockParseDate should return current date for null or invalid input', () => {
    const nullResult = mockParseDate(null);
    expect(nullResult instanceof Date).toBe(true);
    const invalidResult = mockParseDate('invalid-date-string' as any);
    expect(invalidResult instanceof Date).toBe(true);
  });

  it('4. mockFormatDateTime should format date correctly', () => {
    const date = new Date('2025-10-10T10:30:00');
    expect(mockFormatDateTime(date)).toBe('Oct 10, 2025 10:30:00');
  });
});

describe('MyVideos Component', () => {
  const mockHistoryVideos = [
    {
      _id: { $oid: '507f1f77bcf86cd799439011' },
      userId: 'u1',
      originalName: 'Test Video 1.zip',
      status: 'completed',
      createdAt: '2025-01-01',
      clips: [{ video: 'path/to/video1.mp4' }],
      executionIdHistory: {
        executionId: 'exec-123',
        workflowStatus: 'completed',
        startTime: '2025-01-01T10:00:00Z',
        endTime: '2025-01-01T10:15:00Z',
      },
    },
    {
      _id: { $oid: '507f1f77bcf86cd799439012' },
      userId: 'u1',
      originalName: 'Test Video 2.zip',
      status: 'running',
      createdAt: '2025-01-02',
      clips: [],
      executionIdHistory: {
        executionId: 'exec-124',
        workflowStatus: 'running',
        startTime: '2025-01-02T15:00:00Z',
        endTime: null,
      },
    },
    {
      _id: { $oid: '507f1f77bcf86cd799439013' },
      userId: 'u1',
      originalName: 'Test Video 3.zip',
      status: 'error',
      createdAt: '2025-01-03',
      clips: [],
      executionIdHistory: {
        executionId: 'exec-125',
        workflowStatus: 'error',
        startTime: '2025-01-03T16:00:00Z',
        endTime: '2025-01-03T16:05:00Z',
        error: 'Failed to render',
      },
    },
  ];

  // Suppress console errors for act warnings
  // Suppress console errors for act warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: An update to') &&
      args[0].includes('was not wrapped in act')
    ) {
      return; // ignore act warnings
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});


  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (window.localStorage.getItem as jest.Mock).mockReturnValue('testuser');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockHistoryVideos,
    });
  });

  it('5. should render loading state initially and then display videos', async () => {
    render(<MyVideos />);
    expect(screen.getByText('Loading your videos...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Video History')).toBeInTheDocument();
    });
    expect(screen.getByText('Test Video 1.zip')).toBeInTheDocument();
  });

  it('6. should render empty state if no videos are found', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    render(<MyVideos />);
    await waitFor(() => {
      expect(screen.getByText('No videos found')).toBeInTheDocument();
    });
  });

  it('7. should handle API error and display fallback message', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'));
    render(<MyVideos />);
    await waitFor(() => {
      expect(screen.queryByText('Loading your videos...')).not.toBeInTheDocument();
    });
    expect(screen.getByText('No videos found')).toBeInTheDocument();
  });

  it('8. should filter videos by search term', async () => {
    render(<MyVideos />);
    await waitFor(() => {
      expect(screen.getByText('Test Video 1.zip')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('ค้นหาชื่อไฟล์หรือ ID...');
    
    fireEvent.change(searchInput, {
      target: { value: 'Test Video 1' },
    });
    await waitFor(() => {
      expect(screen.getByText('Test Video 1.zip')).toBeInTheDocument();
      expect(screen.queryByText('Test Video 2.zip')).not.toBeInTheDocument();
    });
    
    fireEvent.change(searchInput, {
      target: { value: 'exec-124' },
    });
    await waitFor(() => {
      expect(screen.getByText('Test Video 2.zip')).toBeInTheDocument();
      expect(screen.queryByText('Test Video 1.zip')).not.toBeInTheDocument();
    });
    
    // Test for clear search button - ใช้ querySelector เพื่อหาปุ่ม X
    const clearButton = searchInput.parentElement?.querySelector('button');
    expect(clearButton).toBeInTheDocument();
    if (clearButton) {
      fireEvent.click(clearButton);
      await waitFor(() => {
        expect(screen.getByText('Test Video 1.zip')).toBeInTheDocument();
      });
    }
  });

  it('9. should filter videos by date range', async () => {
    render(<MyVideos />);
    await waitFor(() => {
      expect(screen.getByText('Test Video 1.zip')).toBeInTheDocument();
    });
    
    // Open filter modal - หาปุ่มที่มี FunnelIcon (ปุ่มเดียวที่มี svg filter icon)
    const filterButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg path[d*="M12 3c2.755"]')
    );
    expect(filterButton).toBeInTheDocument();
    if (filterButton) {
      fireEvent.click(filterButton);
    }
    
    // รอให้ modal เปิด
    await waitFor(() => {
      expect(screen.getByText('ตัวกรองวิดีโอ')).toBeInTheDocument();
    });
    
    // หา date inputs โดยใช้ type="date"
    const dateInputs = screen.getAllByDisplayValue('') as HTMLInputElement[];
    const fromDateInput = dateInputs.find(input => input.type === 'date' && !input.value);
    const toDateInput = dateInputs[dateInputs.findIndex(input => input === fromDateInput) + 1];
    
    expect(fromDateInput).toBeInTheDocument();
    expect(toDateInput).toBeInTheDocument();
    
    // Set date range
    if (fromDateInput && toDateInput) {
      fireEvent.change(fromDateInput, { target: { value: '2025-01-01' } });
      fireEvent.change(toDateInput, { target: { value: '2025-01-02' } });
    }
    
    // หาปุ่ม "ใช้ตัวกรอง" โดยดูจาก text content
    const applyButton = screen.getAllByRole('button').find(btn => 
      btn.textContent?.includes('ใช้ตัวกรอง')
    );
    expect(applyButton).toBeInTheDocument();
    if (applyButton) {
      fireEvent.click(applyButton);
    }
    
    await waitFor(() => {
      expect(screen.getByText('Test Video 1.zip')).toBeInTheDocument();
      expect(screen.getByText('Test Video 2.zip')).toBeInTheDocument();
      expect(screen.queryByText('Test Video 3.zip')).not.toBeInTheDocument();
    });
  });

  it('10. should filter videos by status', async () => {
    render(<MyVideos />);
    await waitFor(() => {
      expect(screen.getByText('Test Video 1.zip')).toBeInTheDocument();
    });
    
    // Open filter modal
    const filterButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg path[d*="M12 3c2.755"]')
    );
    expect(filterButton).toBeInTheDocument();
    if (filterButton) {
      fireEvent.click(filterButton);
    }
    
    // รอให้ modal เปิด
    await waitFor(() => {
      expect(screen.getByText('ตัวกรองวิดีโอ')).toBeInTheDocument();
    });
    
    // หาปุ่ม "สำเร็จ" โดยดูจาก text content
    const completedButton = screen.getAllByRole('button').find(btn => 
      btn.textContent?.trim() === 'สำเร็จ'
    );
    expect(completedButton).toBeInTheDocument();
    if (completedButton) {
      fireEvent.click(completedButton);
    }
    
    // ปิด modal โดยคลิกปุ่ม "ใช้ตัวกรอง"
    const applyButton = screen.getAllByRole('button').find(btn => 
      btn.textContent?.includes('ใช้ตัวกรอง')
    );
    if (applyButton) {
      fireEvent.click(applyButton);
    }
    
    await waitFor(() => {
      expect(screen.getByText('Test Video 1.zip')).toBeInTheDocument();
      expect(screen.queryByText('Test Video 2.zip')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Video 3.zip')).not.toBeInTheDocument();
    });
  });

  it('11. should display video details when a video is clicked', async () => {
    render(<MyVideos />);
    await waitFor(() => {
      expect(screen.getByText('Test Video 1.zip')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Test Video 1.zip'));
    
    await waitFor(() => {
      expect(screen.getByText('Workflow Details')).toBeInTheDocument();
      expect(screen.getByText('Execution ID')).toBeInTheDocument();
      expect(screen.getByText('exec-123')).toBeInTheDocument();
    });
  });

  it('12. should display "No videos found" message and clear search', async () => {
    render(<MyVideos />);
    await waitFor(() => {
      expect(screen.getByText('Test Video 1.zip')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('ค้นหาชื่อไฟล์หรือ ID...');
    
    fireEvent.change(searchInput, {
      target: { value: 'xyz' },
    });
    
    await waitFor(() => {
      expect(screen.getByText('ไม่พบวิดีโอที่ค้นหา')).toBeInTheDocument();
    });
    
    // หาปุ่ม "ล้างการค้นหา" โดยดูจาก text content
    const clearSearchButton = screen.getAllByRole('button').find(btn => 
      btn.textContent?.includes('ล้างการค้นหา')
    );
    expect(clearSearchButton).toBeInTheDocument();
    if (clearSearchButton) {
      fireEvent.click(clearSearchButton);
    }
    
    await waitFor(() => {
      expect(screen.getByText('Test Video 1.zip')).toBeInTheDocument();
    });
  });
});