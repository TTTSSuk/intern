import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';

interface StepContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  resetStep: () => void;
}

const StepContext = createContext<StepContextType | undefined>(undefined);

export const StepProvider = ({ children }: { children: ReactNode }) => {
  const [currentStep, setCurrentStepState] = useState(1);
  const router = useRouter();

  // โหลด step จาก localStorage ตอน mount
  useEffect(() => {
    const savedStep = localStorage.getItem('currentStep');
    if (savedStep) {
      const step = parseInt(savedStep, 10);
      if (step >= 1 && step <= 3) { // สมมติว่ามี 4 step
        setCurrentStepState(step);
      }
    }
  }, []);

  // อัปเดต localStorage ทุกครั้งที่ currentStep เปลี่ยน
  const setCurrentStep = (step: number) => {
    setCurrentStepState(step);
    localStorage.setItem('currentStep', step.toString());
  };

  // รีเซ็ต step และล้าง localStorage
  const resetStep = () => {
    setCurrentStepState(1);
    localStorage.removeItem('currentStep');
  };

  // ✅ reset step อัตโนมัติถ้าไปหน้า my-videos (งานเสร็จ)
  // หรือออกจาก workflow (เช่น ไม่ใช่ /upload หรือ /create-video)
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (url.startsWith('/my-videos')) {
        resetStep();
      } else if (!url.startsWith('/upload') && !url.startsWith('/create-video')) {
        resetStep();
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  return (
    <StepContext.Provider value={{ currentStep, setCurrentStep, resetStep }}>
      {children}
    </StepContext.Provider>
  );
};

export const useStep = () => {
  const context = useContext(StepContext);
  if (!context) throw new Error('useStep must be used within StepProvider');
  return context;
};
