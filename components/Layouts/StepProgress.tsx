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
  showHomeButton = false,
}: StepProgressProps) {
  const router = useRouter();

  return (
    <div className="mb-6 relative w-full">
      {/* Connection Lines */}
      <div className="absolute top-4 left-0 right-0 flex items-center px-5">
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
                className={`w-8 h-8 flex items-center justify-center rounded-full border-2 font-semibold text-sm ${
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
                className={`text-center mt-1.5 text-xs max-w-20 ${
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
        <div className="absolute left-0 top-full mt-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-3 py-1.5 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            Home
          </button>
        </div>
      )}

      {/* ปุ่ม Preview / Next */}
      <div className="flex justify-between mt-3">
        {onPreview ? (
          <button
            onClick={onPreview}
            className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Preview
          </button>
        ) : (
          <div></div>
        )}

        {canGoNext && onNext && (
          <button
            onClick={onNext}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Next
          </button>
        )}

        {onMyVideos && (
          <button
            onClick={onMyVideos}
            className="px-3 py-1.5 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium"
          >
            วิดีโอของฉัน
          </button>
        )}
      </div>
    </div>
  );
}