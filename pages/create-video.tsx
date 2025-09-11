// pages/create-video.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useStep } from '@/context/StepContext';
import StepProgress from '@/components/Layouts/StepProgress';

interface VideoCreationStatus {
  _id: string;
  executionId: string | null;
  status: 'idle' | 'starting' | 'running' | 'succeeded' | 'error' | 'unknown';
  createdAt: string;
  updatedAt: string;
}

interface Clip {
  video?: string;
  finalVideo?: string;
  createdAt?: string;
}

const BASE_VIDEO_URL = 'http://192.168.70.166:8080/';

export default function CreateVideo() {
  const router = useRouter();
  const idParam = router.query.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<VideoCreationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [finalVideo, setFinalVideo] = useState<Clip | null>(null);

  const { currentStep, setCurrentStep } = useStep();
  
  const steps = ['อัปโหลดไฟล์', 'รายการไฟล์', 'สร้างวิดีโอ'];

  const refreshInterval = 60000;

  // ส่วนที่ต้องแก้ไขใน create-video.tsx
  function formatDateTime(date: Date): string {
  const datePart = date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  });
  const timePart = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  return `${datePart} ${timePart}`;
}

useEffect(() => {
  if (!id) return;
  
  // ตรวจสอบว่า currentStep น้อยกว่า 3 หรือไม่ ถ้าใช่ ให้ set เป็น 3
  // แต่ถ้า currentStep มากกว่าหรือเท่ากับ 3 แล้วก็ไม่ต้อง override
  if (currentStep < 3) {
    setCurrentStep(3);
  }
  
  console.log('เช็คสถานะวิดีโอสำหรับ id:', id);
  checkExistingStatus(id);
  const interval = setInterval(() => checkExistingStatus(id), refreshInterval);
  return () => clearInterval(interval); 
}, [id, currentStep, setCurrentStep]); // เพิ่ม currentStep ใน dependency array

// หรือถ้าต้องการให้ auto-detect จาก URL
useEffect(() => {
  if (!id) return;
  
  // Set step เป็น 3 เมื่ออยู่หน้า create-video
  setCurrentStep(3);
  
  console.log('เช็คสถานะวิดีโอสำหรับ id:', id);
  checkExistingStatus(id);
  const interval = setInterval(() => checkExistingStatus(id), refreshInterval);
  return () => clearInterval(interval); 
}, [id, setCurrentStep]);

  async function checkExistingStatus(fileId: string) {
    try {
      const res = await fetch(`/api/status-wf?id=${fileId}&t=${Date.now()}`);
      console.log('API status response:', res);
      if (!res.ok) {
        if (res.status === 404) {
          setStatus({ _id: fileId, executionId: null, status: 'idle', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
          return;
        }
        throw new Error(`API Error: ${res.status}`);
      }

      const data = await res.json();
      console.log('API data:', data);
      setStatus({
        _id: fileId,
        executionId: data.executionId || null,
        status: data.status || 'unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (Array.isArray(data.clips)) {
  const newClips: Clip[] = [];
  let newFinalVideo: Clip | null = null;

  data.clips.forEach((c: Clip) => {
    if (c.finalVideo) {
      setFinalVideo({ ...c });
    } else if (c.video) {
      newClips.push({ ...c });
    }
  });

  setClips(prev => {
    const existingVideos = new Set(prev.map(c => c.video));
    const filtered = newClips.filter(c => c.video && !existingVideos.has(c.video));
    return [...prev, ...filtered];
  });
}

      // if (Array.isArray(data.clips)) {
      //   const newClips: Clip[] = [];
      //   data.clips.forEach((c: Clip) => {
      //     if (c.finalVideo) {
      //       setFinalVideo({ ...c });
      //     } else if (c.video) {
      //       newClips.push({ ...c });
      //     }
      //   });

      //   setClips(prev => {
      //     const existingVideos = new Set(prev.map(c => c.video));
      //     const filtered = newClips.filter(c => c.video && !existingVideos.has(c.video));
      //     return [...prev, ...filtered];
      //   });
      // }
    } catch (err) {
      console.error(err);
      setStatus({ _id: fileId, executionId: null, status: 'error', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  async function startVideoCreation() {
    if (!id) {
      router.push('/list-file');
      return;
    }

    setLoading(true);
    setError(null);
    setStatus({ _id: id, executionId: null, status: 'starting', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

    try {
      const res = await fetch('/api/start-wf', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ _id: id }) 
      });
      const result = await res.json();

      if (res.ok && result.executionId) {
        setStatus({ _id: id, executionId: result.executionId, status: 'running', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      } else {
        setError(result.error || 'Failed to start workflow');
        setStatus(prev => prev ? { ...prev, status: 'error', updatedAt: new Date().toISOString() } : null);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to start workflow');
      setStatus(prev => prev ? { ...prev, status: 'error', updatedAt: new Date().toISOString() } : null);
    } finally {
      setLoading(false);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idle':
        return <div className="w-3 h-3 rounded-full bg-gray-400"></div>;
      case 'starting':
      case 'running':
        return <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>;
      case 'succeeded':
        return <div className="w-3 h-3 rounded-full bg-green-500"></div>;
      case 'error':
        return <div className="w-3 h-3 rounded-full bg-red-500"></div>;
      default:
        return <div className="w-3 h-3 rounded-full bg-gray-300"></div>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'running':
      case 'starting':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <StepProgress
  steps={['อัปโหลดไฟล์', 'รายการไฟล์', 'สร้างวิดีโอ']}
  currentStep={3}
  canGoNext={true}
  // onNext={() => console.log('Next step')}
  onPreview={() => router.push('/list-file')}
  onMyVideos={() => router.push('/my-videos')}
/>

    {!status && !error && <p>กำลังโหลดสถานะ...</p>}
    {error && <p className="text-red-600">เกิดข้อผิดพลาด: {error}</p>}

    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
             สร้างวิดีโอ
          </h1>
          {/* <p className="text-gray-600 text-lg">
            แปลงไฟล์ของคุณเป็นวิดีโอที่น่าสนใจ
          </p> */}
        </div>

        {/* File ID Card */}
        {id && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">📄</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">ไฟล์ที่เลือก</h3>
                <p className="text-gray-600 font-mono text-sm bg-gray-100 px-3 py-1 rounded-md inline-block">
                  {id}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Card */}
        {status && (
          <div className={`rounded-xl shadow-lg p-6 mb-6 border-2 ${getStatusColor(status.status)}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center space-x-3">
                {getStatusIcon(status.status)}
                <span>สถานะการทำงาน</span>
              </h3>
              {status.status === 'running' && (
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/70 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">สถานะปัจจุบัน</p>
                <p className="font-bold text-lg capitalize">{status.status}</p>
              </div>
              
              {status.executionId && (
                <div className="bg-white/70 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Execution ID</p>
                  <p className="font-mono text-sm truncate">{status.executionId}</p>
                </div>
              )}
              
              <div className="bg-white/70 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">อัพเดทล่าสุด</p>
                <p className="text-sm">{status?.updatedAt ? formatDateTime(new Date(status.updatedAt)): '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl">⚠️</span>
              </div>
              <div>
                <h3 className="font-bold text-red-800 mb-1">เกิดข้อผิดพลาด</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Generated Clips */}
        {clips.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
            <div className="flex items-center space-x-3 mb-6">  
              <h3 className="text-xl font-bold text-gray-800">คลิปที่สร้างแล้ว ({clips.length})</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {clips.map((clip, index) => (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                  {clip.video && (
                    <video 
                      className="w-full h-40 object-cover" 
                      controls 
                      src={`${BASE_VIDEO_URL}${clip.video}`}
                      poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE2MCIgY3k9IjkwIiByPSIzMCIgZmlsbD0iIzZCNzI4MCIvPgo8cGF0aCBkPSJNMTUwIDc1TDE3NSA5MEwxNTAgMTA1VjEwNVY3NVoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo="
                    />
                  )}
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Clips {index + 1}</span>
                      <span className="text-xs text-gray-400">
                        {clip.createdAt ? formatDateTime(new Date(clip.createdAt)) : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final Video */}
        {finalVideo && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 mb-6 border-2 border-green-200">
            <div className="flex items-center space-x-3 mb-6">
              {/* <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl">🎯</span>
              </div> */}
              <h3 className="text-2xl font-bold text-green-800">วิดีโอสำเร็จรูป</h3>
            </div>
            
            <div className="bg-white rounded-lg overflow-hidden shadow-md">
              <video 
                className="w-full max-h-96 object-contain" 
                controls 
                src={`${BASE_VIDEO_URL}${finalVideo.finalVideo}`}
              />
              <div className="p-4 bg-gray-50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                  <div>
                    <p className="font-semibold text-gray-800">วิดีโอพร้อมใช้งาน</p>
                    <p className="text-sm text-gray-600">
                      สร้างเมื่อ: {finalVideo.createdAt ? formatDateTime(new Date(finalVideo.createdAt)) : '-'}
                    </p>
                  </div>
                  <a 
                    href={`${BASE_VIDEO_URL}${finalVideo.finalVideo}`} 
                    download="final_video.mp4" 
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {/* <span>📥</span> */}
                    <span className="font-semibold">ดาวน์โหลดวิดีโอ</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="text-center">
          <button
            disabled={loading || 
              status?.status === 'running' || 
              status?.status === 'succeeded'}
            className={`inline-flex items-center space-x-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
              status?.status === 'running' || 
              status?.status === 'succeeded'
                ? 'bg-gray-400 text-gray-500 cursor-not-allowed shadow-none transform-none'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
            }`}
            onClick={startVideoCreation}
          >
            {loading ? (
              <>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>กำลังเริ่มต้น...</span>
              </>
            ) : status?.status === 'running' ? (
              <>
                {/* <span>⏳</span> */}
                <span>กำลังสร้างวิดีโอ...</span>
              </>
            ) : status?.status === 'succeeded' ? (
              <>
                {/* <span>✅</span> */}
                <span>เสร็จสิ้นแล้ว</span>
              </>
            ) : (
              <>
                {/* <span>🚀</span> */}
                <span>เริ่มสร้างวิดีโอ</span>
              </>
            )}
          </button>
          {/* Next / Back Buttons */}
{(status?.status === 'succeeded' || status?.status === 'error') && (
  <div className="text-center mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
    
    {/* Back button สำหรับ error */}
    {status.status === 'error' && (
      <button
        onClick={() => {
          setCurrentStep(2); // กลับไปขั้นตอน "รายการไฟล์" หรือขั้นก่อนหน้า
          router.push('/list-file');
        }}
        className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 bg-gray-200 text-gray-800 hover:bg-gray-300"
      >
        <span>Preview</span>
      </button>
    )}

    {/* Next button สำหรับ succeeded / error */}
    <button
      onClick={() => {
        setCurrentStep(4); // ไปขั้นตอน "วิดีโอของฉัน"
        router.push('/my-videos');
      }}
      className={`inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300
        ${status.status === 'succeeded' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}
      `}
    >
      <span>Next</span>
    </button>
  </div>
)}

          {(status?.status === 'running' || status?.status === 'starting') && (
            <p className="mt-3 text-sm text-gray-600">
              กระบวนการนี้อาจใช้เวลาสักครู่ หน้าจอจะอัพเดทอัตโนมัติทุก 10 วินาที
            </p>
          )}
        </div>

        {/* Progress Steps */}
        {status && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">ขั้นตอนการสร้างวิดีโอ</h3>
            <div className="flex items-center justify-between">
              <div className={`flex flex-col items-center space-y-2 ${status.status !== 'idle' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status.status !== 'idle' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'}`}>
                  {status.status !== 'idle' ? '✓' : '1'}
                </div>
                <span className="text-sm font-medium">เริ่มต้น</span>
              </div>
              
              <div className={`flex-1 h-1 mx-4 ${status.status === 'running' || status.status === 'succeeded' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              
              <div className={`flex flex-col items-center space-y-2 ${status.status === 'running' || status.status === 'succeeded' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status.status === 'running' ? 'bg-blue-500 text-white animate-pulse' : status.status === 'succeeded' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'}`}>
                  {status.status === 'succeeded' ? '✓' : status.status === 'running' ? '⟳' : '2'}
                </div>
                <span className="text-sm font-medium">กำลังประมวลผล</span>
              </div>
              
              <div className={`flex-1 h-1 mx-4 ${status.status === 'succeeded' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              
              <div className={`flex flex-col items-center space-y-2 ${status.status === 'succeeded' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status.status === 'succeeded' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'}`}>
                  {status.status === 'succeeded' ? '✓' : '3'}
                </div>
                <span className="text-sm font-medium">เสร็จสิ้น</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}