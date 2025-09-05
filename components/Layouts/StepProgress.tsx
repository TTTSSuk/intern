// StepProgress.tsx
import { useRouter } from 'next/router';

interface StepProgressProps {
  steps: string[];
  currentStep: number; // เริ่มจาก 1
  canGoNext?: boolean;
  onNext?: () => void;
  onPreview?: () => void;
  onMyVideos?: () => void;   // เพิ่ม prop
  showHomeButton?: boolean; // เพิ่ม prop
}

export default function StepProgress({
  steps,
  currentStep,
  canGoNext = false,
  onNext,
  onPreview,
  onMyVideos,
  showHomeButton = false, // default false
}: StepProgressProps) {
  const router = useRouter();

  return (
    <div className="mb-8 relative w-full">
      {/* Connection Lines */}
      <div className="absolute top-5 left-0 right-0 flex items-center px-5">
        {steps.slice(0, -1).map((_, index) => (
          <div
            key={index}
            className={`flex-1 h-1 ${index < currentStep - 1 ? 'bg-green-500' : 'bg-gray-300'}`}
          ></div>
        ))}
      </div>

      {/* Steps */}
      <div className="flex justify-between items-start relative z-10">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          return (
            <div key={step} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full border-2 font-semibold ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : isActive
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-300 text-gray-500'
                }`}
              >
                {isCompleted ? '✓' : stepNumber}
              </div>
              <p
                className={`text-center mt-2 text-sm max-w-20 ${
                  isActive ? 'font-bold text-blue-500' : 'text-gray-500'
                }`}
              >
                {step}
              </p>
            </div>
          );
        })}
      </div>

      {/* ปุ่ม Home สำหรับหน้าเฉพาะ */}
      {showHomeButton && (
        <div className="absolute left-0 top-full mt-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Home
          </button>
        </div>
      )}

      {/* ปุ่ม Preview / Next */}
      <div className="flex justify-between mt-4">
        {onPreview ? (
          <button
            onClick={onPreview}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center space-x-2"
          >
            {/* <span>👁️</span> */}
            <span>Preview</span>
          </button>
        ) : (
          <div></div>
        )}

        {canGoNext && onNext && (
          <button
            onClick={onNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 font-medium"
          >
            <span>Next</span>
            {/* <span>→</span> */}
          </button>
        )}

         {/* My Videos Button */}
    {onMyVideos && (
      <button
        onClick={onMyVideos}
        className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center space-x-2 font-medium"
      >
        <span>วิดีโอของฉัน</span>
      </button>
    )}
      </div>
    </div>
  );
}
