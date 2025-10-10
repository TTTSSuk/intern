// Mock useRouter ก่อนใช้งาน
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreateVideo from '../pages/create-video'; // ปรับ path ตามโครงสร้างจริง
import { useRouter } from 'next/router';
import { useStep } from '@/context/StepContext';

// Mock context
jest.mock('@/context/StepContext', () => ({
  useStep: jest.fn(),
}));

// Mock Components
jest.mock('@/components/Layouts/StepProgress', () => ({
  __esModule: true,
  default: ({ currentStep }: { currentStep: number }) => <div data-testid="step-progress">Step: {currentStep}</div>,
}));

jest.mock('@/components/EnhancedFileCard', () => ({
  __esModule: true,
  default: ({ fileId }: { fileId: string }) => <div data-testid="file-card">File ID: {fileId}</div>,
}));



// Mock router
const mockPush = jest.fn();
const mockQuery = { id: 'file-xyz' };
(useRouter as jest.Mock).mockReturnValue({
  query: mockQuery,
  push: mockPush,
});

// Mocking useStep
const mockSetCurrentStep = jest.fn();
(useStep as jest.Mock).mockReturnValue({
  currentStep: 3,
  setCurrentStep: mockSetCurrentStep,
});

// Mocking fetch API
const mockFetch = jest.spyOn(global, 'fetch') as jest.Mock;

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

describe('CreateVideo', () => {
  const fileId = 'file-xyz';

  beforeEach(() => {
    jest.useFakeTimers(); // ใช้ fake timer เพื่อควบคุม setInterval
    localStorageMock.clear();
    mockPush.mockClear();
    mockFetch.mockClear();
    mockSetCurrentStep.mockClear();

    // กำหนดค่าเริ่มต้นใน localStorage
    localStorage.setItem('loggedInUser', 'user123');

    // กำหนดค่า Mock สำหรับ checkExistingStatus (สถานะเริ่มต้น: idle)
    mockFetch.mockImplementation((url: any) => {
  const urlStr = typeof url === 'string' ? url : url.toString();
  if (urlStr.includes('/api/status-wf')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            _id: fileId, 
            status: 'idle',
            clips: []
          }),
        } as Response);
      }
      // สำหรับ API อื่นๆ ให้ mock ล้มเหลวหรือกำหนดค่าเฉพาะ
      return Promise.reject(new Error('Unexpected fetch call'));
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('ควรเรนเดอร์ StepProgress และ EnhancedFileCard ด้วย id ที่ถูกต้อง', async () => {
    render(<CreateVideo />);

    await waitFor(() => {
      expect(screen.getByTestId('step-progress')).toHaveTextContent('Step: 3');
      expect(screen.getByTestId('file-card')).toHaveTextContent(`File ID: ${fileId}`);
    });
  });

  it('ควรแสดงปุ่ม "เริ่มสร้างวิดีโอ" เมื่อสถานะเป็น idle', async () => {
    render(<CreateVideo />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /เริ่มสร้างวิดีโอ/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /เริ่มสร้างวิดีโอ/i })).toBeEnabled();
    });
  });

  it('ควรแสดง Confirm Start Popup เมื่อคลิกปุ่มเริ่มสร้างวิดีโอ', async () => {
    render(<CreateVideo />);
    
    // รอโหลดสถานะเริ่มต้น
    await waitFor(() => {
        expect(screen.getByRole('button', { name: /เริ่มสร้างวิดีโอ/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /เริ่มสร้างวิดีโอ/i }));

    // ตรวจสอบ popup
    expect(screen.getByText(/ยืนยันการสร้างวิดีโอ/i)).toBeInTheDocument();
  });

  it('ควรรีเฟรชสถานะทุก 10 วินาที', async () => {
    // Mock checkExistingStatus ให้ตอบกลับด้วยสถานะ idle สองครั้ง
    mockFetch.mockImplementation((url: any) => {
  const urlStr = typeof url === 'string' ? url : url.toString();
  if (urlStr.includes('/api/status-wf')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ 
                    _id: fileId, 
                    status: 'idle',
                    clips: []
                }),
            } as Response);
        }
        return Promise.reject(new Error('Unexpected fetch call'));
    });

    render(<CreateVideo />);

    // การเรียกครั้งแรกจาก useEffect
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    
    // เลื่อนเวลาไป 10 วินาที
    jest.advanceTimersByTime(10000); 

    // การเรียกครั้งที่สองจาก setInterval
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    
    // เลื่อนเวลาไปอีก 10 วินาที
    jest.advanceTimersByTime(10000); 

    // การเรียกครั้งที่สามจาก setInterval
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3));
  });

  it('ควรเริ่มสร้างวิดีโอเมื่อยืนยันใน Confirm Start Popup', async () => {
    // Mock checkExistingStatus ให้ตอบกลับด้วยสถานะ idle ก่อน และ queued หลังจากการเรียก API
    mockFetch.mockImplementation((url: any) => {
  const urlStr = typeof url === 'string' ? url : url.toString();
  if (urlStr.includes('/api/status-wf')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ 
                    _id: fileId, 
                    status: 'idle',
                    clips: []
                }),
            } as Response);
        }
        if (url.includes('/api/queue-job')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ 
                    jobId: 'exec-123', 
                    status: 'queued', 
                    queuePosition: 5 
                }),
            } as Response);
        }
        return Promise.reject(new Error('Unexpected fetch call'));
    });
    
    render(<CreateVideo />);
    
    // 1. รอสถานะเริ่มต้น (idle)
    await waitFor(() => {
        expect(screen.getByRole('button', { name: /เริ่มสร้างวิดีโอ/i })).toBeEnabled();
    });

    // 2. คลิกปุ่มเพื่อแสดง Confirm Popup
    fireEvent.click(screen.getByRole('button', { name: /เริ่มสร้างวิดีโอ/i }));
    
    // 3. คลิกปุ่มยืนยันใน Popup
    const confirmButton = screen.getByRole('button', { name: /ยืนยัน/i });
    fireEvent.click(confirmButton);

    // 4. ตรวจสอบการเรียก API
    await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/queue-job',
          expect.objectContaining({
            method: 'POST',
          })
        );
    });
    
    // 5. ตรวจสอบการแสดงผลสถานะ "อยู่ในคิว"
    // เนื่องจากเราไม่ได้ mock การเรียกสถานะที่เกิดขึ้นหลังจาก queue-job สำเร็จ
    // เราจะใช้การเรียก status-wf ใน beforeEach ที่ถูก override ด้วย mockFetch.mockImplementation
    // เพื่อให้การทดสอบสมบูรณ์ ต้อง re-mock checkExistingStatus เพื่อให้ตอบกลับด้วยสถานะ 'queued'
    // ... (ในสถานการณ์จริง อาจต้องจัดการ mock ให้ซับซ้อนขึ้น)

    // สำหรับการทดสอบนี้ เราจะตรวจสอบการเรียก API และการหายไปของ Popup
    expect(screen.queryByText(/ยืนยันการสร้างวิดีโอ/i)).not.toBeInTheDocument();
  });

  it('ควรแสดง Error Popup เมื่อ API ตอบกลับ 402 (Token ไม่พอ)', async () => {
    // 1. Mock API queue-job ให้ตอบกลับ 402
    mockFetch.mockImplementation((url: any) => {
  const urlStr = typeof url === 'string' ? url : url.toString();
  if (urlStr.includes('/api/status-wf')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ 
                    _id: fileId, 
                    status: 'idle',
                    clips: []
                }),
            } as Response);
        }
        if (url.includes('/api/queue-job')) {
            return Promise.resolve({
                ok: false,
                status: 402,
                json: () => Promise.resolve({ 
                    message: 'คุณมี Token ไม่พอ' 
                }),
            } as Response);
        }
        return Promise.reject(new Error('Unexpected fetch call'));
    });

    render(<CreateVideo />);

    // 1. รอสถานะเริ่มต้น (idle)
    await waitFor(() => {
        expect(screen.getByRole('button', { name: /เริ่มสร้างวิดีโอ/i })).toBeEnabled();
    });

    // 2. คลิกปุ่มเพื่อแสดง Confirm Popup
    fireEvent.click(screen.getByRole('button', { name: /เริ่มสร้างวิดีโอ/i }));
    
    // 3. คลิกปุ่มยืนยัน
    fireEvent.click(screen.getByRole('button', { name: /ยืนยัน/i }));

    // 4. ตรวจสอบ Token Error Popup
    await waitFor(() => {
        expect(screen.getByText(/Token ไม่เพียงพอ/i)).toBeInTheDocument();
        expect(screen.getByText(/คุณมี Token ไม่พอ/i)).toBeInTheDocument();
    });

    // 5. ปิด Popup
    fireEvent.click(screen.getByRole('button', { name: /ตกลง/i }));
    expect(screen.queryByText(/คุณมี Token ไม่พอ/i)).not.toBeInTheDocument();
  });

  // เพิ่มการทดสอบการยกเลิกคิว
  it('ควรแสดง Confirm Cancel Popup เมื่อคลิกปุ่มยกเลิกคิว และดำเนินการยกเลิกเมื่อยืนยัน', async () => {
    // Mock สถานะเป็น 'queued'
    mockFetch.mockImplementation((url: any) => {
  const urlStr = typeof url === 'string' ? url : url.toString();
  if (urlStr.includes('/api/status-wf')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ 
                    _id: fileId, 
                    status: 'queued',
                    queuePosition: 2,
                    clips: []
                }),
            } as Response);
        }
        if (url.includes('/api/cancel-queue')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ tokensReturned: 50 }),
            } as Response);
        }
        return Promise.reject(new Error('Unexpected fetch call'));
    });

    render(<CreateVideo />);

    // 1. รอให้สถานะเป็น 'queued' และแสดงปุ่มยกเลิกคิว
    let cancelButton;
    await waitFor(() => {
        cancelButton = screen.getByRole('button', { name: /ยกเลิกคิว/i });
        expect(cancelButton).toBeInTheDocument();
    });

    // 2. คลิกปุ่มยกเลิกคิว
    fireEvent.click(cancelButton!);

    // 3. ตรวจสอบ Confirm Cancel Popup
    expect(screen.getByText(/ยืนยันการยกเลิก/i)).toBeInTheDocument();

    // 4. คลิกปุ่มยืนยัน
    fireEvent.click(screen.getByRole('button', { name: /ยืนยัน/i }));

    // 5. ตรวจสอบการเรียก API ยกเลิกคิว
    await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
            '/api/cancel-queue',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ fileId })
            })
        );
    });

    // 6. ตรวจสอบ Cancel Success Popup
    await waitFor(() => {
        expect(screen.getByText(/ยกเลิกคิวสำเร็จ!/i)).toBeInTheDocument();
        expect(screen.getByText(/คืน 50 token ให้คุณแล้ว/i)).toBeInTheDocument();
    });
  });

});