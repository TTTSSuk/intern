// __tests__/list-file.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ListFile from '@/pages/list-file';
import '@testing-library/jest-dom';

// Mock useRouter, useStep
const mockRouterPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

const mockSetCurrentStep = jest.fn();
jest.mock('@/context/StepContext', () => ({
  useStep: () => ({
    currentStep: 2,
    setCurrentStep: mockSetCurrentStep,
    setFileId: jest.fn(),
  }),
}));

global.fetch = jest.fn() as jest.Mock;

describe('ListFile Component', () => {
  const mockFiles = [
     { 
    _id: 'file-3', 
    userId: 'user123', 
    originalName: 'file_c.zip', 
    extractPath: '/path/c', 
    status: 'pending', 
    createdAt: '2025-01-03T10:00:00Z',
    videoCreated: false  // เพิ่มบรรทัดนี้
  },
  { 
    _id: 'file-1', 
    userId: 'user123', 
    originalName: 'file_a.zip', 
    extractPath: '/path/a', 
    status: 'error', 
    createdAt: '2025-01-01T10:00:00Z',
    videoCreated: false  // เพิ่มบรรทัดนี้
  },
  { 
    _id: 'file-2', 
    userId: 'user123', 
    originalName: 'file_b.zip', 
    extractPath: '/path/b', 
    status: 'completed', 
    createdAt: '2025-01-02T10:00:00Z',
    videoCreated: false  // เพิ่มบรรทัดนี้
  },
  { 
    _id: 'file-4', 
    userId: 'user123', 
    originalName: 'file_d.zip', 
    extractPath: '/path/d', 
    status: 'done', 
    createdAt: '2025-01-04T10:00:00Z',
    videoCreated: false  // เพิ่มบรรทัดนี้
  },
];

  // Suppress console errors
  const originalError = console.error;
  beforeAll(() => {
    console.error = (...args: any[]) => {
      // Suppress all console.error during tests
      return;
    };
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ files: mockFiles }),
    });

    jest.spyOn(window, 'confirm').mockReturnValue(true);

    Object.defineProperty(window, 'localStorage', {
      value: { getItem: jest.fn(() => 'user123') },
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('1. should render loading state initially', () => {
    render(<ListFile />);
    expect(screen.getByText('กำลังโหลดข้อมูลไฟล์ที่แตก...')).toBeInTheDocument();
  });

  it('2. should render files after successful fetch, sorted correctly', async () => {
    render(<ListFile />);
    
    // รอให้หน้าโหลดเสร็จโดยรอหา element ที่แน่ใจว่ามี
    await screen.findByText('file_d.zip');

    expect(screen.getByText('file_a.zip')).toBeInTheDocument();
    expect(screen.getByText('file_b.zip')).toBeInTheDocument();
    expect(screen.getByText('file_d.zip')).toBeInTheDocument();
    expect(screen.queryByText('file_c.zip')).not.toBeInTheDocument();

    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings.map(h => h.textContent)).toEqual(['file_d.zip', 'file_b.zip', 'file_a.zip']);
  });

  it('3. should show error if fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    render(<ListFile />);
    expect(await screen.findByText('เกิดข้อผิดพลาด')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('4. should show message when no files available', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ files: [] }),
    });
    render(<ListFile />);

    const noFileTexts = await screen.findAllByText('ไม่มีไฟล์');
    expect(noFileTexts.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('ยังไม่มีไฟล์ที่แตกจาก ZIP')).toBeInTheDocument();
  });

  it('5. should select a file when radio clicked', async () => {
    render(<ListFile />);
    await screen.findByText('file_a.zip');
    const radios = screen.getAllByRole('radio');
    const fileARadio = radios[2];
    expect(fileARadio).not.toBeChecked();

    fireEvent.click(fileARadio);
    expect(fileARadio).toBeChecked();
  });

  it('6. should go to /create-video when next clicked', async () => {
    render(<ListFile />);
    await screen.findByText('file_a.zip');

    // เลือกไฟล์ file_a.zip (index 2)
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[2]);

    // รอให้ปุ่ม "ถัดไป" ปรากฏขึ้นหลังจากเลือกไฟล์
    const nextButton = await screen.findByRole('button', { name: 'ถัดไป' });
    fireEvent.click(nextButton);

    expect(mockRouterPush).toHaveBeenCalledWith('/create-video?id=file-1');
    expect(mockSetCurrentStep).toHaveBeenCalledWith(3);
  });

  it('7. should not show next button when no file selected', async () => {
    render(<ListFile />);
    await screen.findByText('file_a.zip');
    
    // ตรวจสอบว่าไม่มีปุ่ม "ถัดไป" แสดงอยู่
    expect(screen.queryByRole('button', { name: 'ถัดไป' })).not.toBeInTheDocument();
  });

  it('8. should delete a file when "ลบ" clicked', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ files: mockFiles }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<ListFile />);
    await screen.findByText('file_d.zip');

    const deleteButtons = screen.getAllByText('ลบ');
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith('คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์นี้?');
    expect(global.fetch).toHaveBeenCalledWith('/api/delete-extracted-file', expect.any(Object));
  });
});