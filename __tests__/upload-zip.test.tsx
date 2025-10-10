//__tests__/upload-zip.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UploadZip from '../pages/upload-zip';
import { useRouter } from 'next/navigation';
import { useStep } from '@/context/StepContext';

// Mock Next.js dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/context/StepContext', () => ({
  useStep: jest.fn(),
}));

// ✅ Mock StepProgress component เพื่อหลีกเลี่ยงปัญหา useRouter
jest.mock('../components/Layouts/StepProgress', () => {
  return function MockStepProgress() {
    return <div data-testid="step-progress">Step Progress Mock</div>;
  };
});

global.fetch = jest.fn();

const mockValidationErrors = [
  { folderName: 'Folder A', errors: ['ไฟล์วิดีโอหลักหายไป', 'ไฟล์คำบรรยายหายไป'] },
  { folderName: 'Folder B', errors: ['มีไฟล์ที่ไม่ได้รับอนุญาต'] },
];

describe('UploadZip Component', () => {
  const mockSetCurrentStep = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useStep as jest.Mock).mockReturnValue({
      currentStep: 1,
      setCurrentStep: mockSetCurrentStep,
    });
  });

  it('ควรแสดงผลองค์ประกอบหลักและขั้นตอนอย่างถูกต้อง', () => {
    render(<UploadZip />);
    
    // ตรวจสอบ Mock Step Progress
    expect(screen.getByTestId('step-progress')).toBeInTheDocument();
    
    // ตรวจสอบโซน Drag and Drop
    expect(screen.getByText(/ลากและวางไฟล์ ZIP หรือคลิกเพื่อเลือกไฟล์/i)).toBeInTheDocument();
  });

  it('ควรจัดการการเลือกไฟล์ที่ไม่ใช่ ZIP อย่างถูกต้อง', async () => {
    render(<UploadZip />);
    
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    // ✅ ใช้ querySelector เพื่อหา input[type="file"]
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/ไฟล์ต้องเป็น .zip เท่านั้น/i)).toBeInTheDocument();
    });
  });

  it('ควรจัดการการอัปโหลดไฟล์ที่สำเร็จและนำทางไปยังขั้นตอนถัดไป', async () => {
    render(<UploadZip />);
    
    const zipFile = new File(['content'], 'project.zip', { type: 'application/zip' });
    // ✅ ใช้ querySelector เพื่อหา input[type="file"]
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Mock API Response
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ 
        message: 'Upload successful'
      }),
    });
    
    Object.defineProperty(input, 'files', {
      value: [zipFile],
      writable: false,
    });
    
    fireEvent.change(input);
    
    // รอให้ไฟล์ถูกเลือก
    await waitFor(() => {
      expect(screen.getByText('project.zip')).toBeInTheDocument();
    });
    
    const uploadButton = screen.getByRole('button', { name: /อัปโหลด ZIP/i });
    fireEvent.click(uploadButton);

    expect(screen.getByText(/กำลังอัปโหลด.../i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
      expect(mockSetCurrentStep).toHaveBeenCalledWith(2);
      expect(mockPush).toHaveBeenCalledWith('/list-file');
    }, { timeout: 3000 });
  });

  it('ควรแสดงข้อผิดพลาด Validation ที่ส่งคืนจาก API', async () => {
    render(<UploadZip />);
    
    const zipFile = new File(['content'], 'bad_project.zip', { type: 'application/zip' });
    // ✅ ใช้ querySelector เพื่อหา input[type="file"]
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Mock API Response สำหรับ Validation Error
    (fetch as jest.Mock).mockResolvedValue({
      status: 400,
      ok: false,
      json: async () => ({ 
        message: 'Validation failed', 
        validationErrors: mockValidationErrors
      }),
    });
    
    Object.defineProperty(input, 'files', {
      value: [zipFile],
      writable: false,
    });
    
    fireEvent.change(input);
    
    // รอให้ไฟล์ถูกเลือก
    await waitFor(() => {
      expect(screen.getByText('bad_project.zip')).toBeInTheDocument();
    });
    
    const uploadButton = screen.getByRole('button', { name: /อัปโหลด ZIP/i });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      // ตรวจสอบว่ามี popup validation errors
      expect(screen.getByText(/พบข้อผิดพลาด/i)).toBeInTheDocument();
      expect(screen.getByText(/Folder A/i)).toBeInTheDocument();
      expect(screen.getByText(/ไฟล์วิดีโอหลักหายไป/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});