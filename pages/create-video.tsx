// pages/create-video.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useStep } from '@/context/StepContext';
import StepProgress from '@/components/Layouts/StepProgress';
import EnhancedFileCard from '@/components/EnhancedFileCard';

interface VideoCreationStatus {
  _id: string;
  executionId: string | null;
  status: 'idle' | 'starting' | 'queued' | 'running' | 'succeeded' | 'error' | 'unknown' | 'completed' | 'processing';
  createdAt: string;
  updatedAt: string;
  queuePosition?: number;
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
  const [isVideoStarted, setIsVideoStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<VideoCreationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [finalVideo, setFinalVideo] = useState<Clip | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [tokenPopup, setTokenPopup] = useState<{
    visible: boolean;
    tokensUsed?: number;
    remainingTokens?: number;
  }>({ visible: false, tokensUsed: 0, remainingTokens: 0 });
  const [errorPopup, setErrorPopup] = useState<{  // ⬅️ เพิ่มตรงนี้
  visible: boolean;
  executionId?: string | null;
  error?: string;
}>({ visible: false, executionId: null, error: '' });

  const [confirmStartPopup, setConfirmStartPopup] = useState(false);
  const [confirmCancelPopup, setConfirmCancelPopup] = useState(false);
  
  const [cancelSuccessPopup, setCancelSuccessPopup] = useState<{
  visible: boolean;
  tokensReturned: number;
}>({ visible: false, tokensReturned: 0 });
  const { currentStep, setCurrentStep } = useStep();
  const steps = ['อัปโหลดไฟล์', 'รายการไฟล์', 'สร้างวิดีโอ'];
  const refreshInterval = 10000;

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

    if (currentStep < 3) {
      setCurrentStep(3);
    }
    
    console.log('เช็คสถานะวิดีโอสำหรับ id:', id);
    checkExistingStatus(id);
    const interval = setInterval(() => {
    if (id) { // เพิ่มการตรวจสอบอีกครั้งเพื่อความปลอดภัย
      checkExistingStatus(id);
    }
  }, refreshInterval);
    return () => clearInterval(interval); 
  }, [id, currentStep, setCurrentStep, refreshInterval]); 

  async function checkExistingStatus(fileId: string) {
    try {
      const res = await fetch(`/api/status-wf?id=${fileId}&t=${Date.now()}`);
      console.log('API status response:', res);
      if (!res.ok) {
        if (res.status === 404) {
          setStatus({ 
            _id: fileId, 
            executionId: null, 
            status: 'idle', 
            createdAt: new Date().toISOString(), 
            updatedAt: new Date().toISOString() 
          });
          return;
        }
        throw new Error(`API Error: ${res.status}`);
      }

      const data = await res.json();
      console.log('API data:', data);
      
      // ตรวจสอบว่างานเสร็จสิ้น
const newStatus = data.status || 'unknown';
const isCompleted = newStatus === 'succeeded' || newStatus === 'completed';
const wasNotCompleted = status?.status !== 'succeeded' && status?.status !== 'completed';

// แสดง popup เฉพาะเมื่องานเพิ่งเสร็จ (ไม่ใช่เสร็จอยู่แล้ว)
if (isCompleted && wasNotCompleted) {
  console.log('🎉 แสดง Success Popup');
  setTokenPopup({ 
    visible: true,
    tokensUsed: 0,  // ไม่ต้องใช้แล้ว
    remainingTokens: 0  // ไม่ต้องใช้แล้ว
  });
}

      // หลังจากเช็ค token popup แล้ว เพิ่มส่วนนี้:
const isError = newStatus === 'error';
const wasNotError = status?.status !== 'error';

// 🔥 แสดง error popup เมื่อเกิด error ใหม่
if (isError && wasNotError) {
  console.log('❌ แสดง Error Popup:', { executionId: data.executionId });
  setErrorPopup({
    visible: true,
    executionId: data.executionId || null,
    error: data.errorMessage || 'เกิดข้อผิดพลาดในการสร้างวิดีโอ'
  });
}
      
      setStatus({
        _id: fileId,
        executionId: data.executionId || null,
        status: newStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        queuePosition: data.queuePosition
      });

      if (Array.isArray(data.clips)) {
        const newClips: Clip[] = [];
        let newFinalVideo: Clip | null = null;
        data.clips.forEach((c: Clip) => {
          if (c.finalVideo) {
            newFinalVideo = { ...c };
          } else if (c.video) {
            newClips.push({ ...c });
          }
        });

        setClips(prev => {
          const existingVideos = new Set(prev.map(c => c.video));
          const filtered = newClips.filter(c => c.video && !existingVideos.has(c.video));
          return [...prev, ...filtered];
        });
        setFinalVideo(newFinalVideo);
      }
    } catch (err) {
      console.error(err);
      setStatus({ 
        _id: fileId, 
        executionId: null, 
        status: 'error', 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      });
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

// แก้ไขฟังก์ชัน
async function cancelQueue() {
  if (!id) return;
  
  // เปลี่ยนจาก confirm() เป็น custom popup
  setConfirmCancelPopup(true);
}

// ฟังก์ชันจริงที่ยกเลิกคิว
async function confirmCancelQueue() {
  if (!id) return; // เพิ่ม guard clause ที่นี่ด้วย
  
  setConfirmCancelPopup(false);
  setCancelling(true);
  
  try {
    const res = await fetch('/api/cancel-queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: id })
    });

    const result = await res.json();

    if (res.ok) {
      setCancelSuccessPopup({
        visible: true,
        tokensReturned: result.tokensReturned
      });
      await checkExistingStatus(id); // ตรงนี้ id จะไม่เป็น undefined แน่นอน
    } else {
      setErrorPopup({
        visible: true,
        executionId: null,
        error: result.message || 'ไม่สามารถยกเลิกคิวได้'
      });
    }
  } catch (error) {
    console.error('Error cancelling queue:', error);
    setErrorPopup({
      visible: true,
      executionId: null,
      error: 'เกิดข้อผิดพลาดในการยกเลิกคิว'
    });
  } finally {
    setCancelling(false);
  }
}

  // เพิ่มฟังก์ชันยืนยันการเริ่มต้น
async function handleStartVideo() {
  setConfirmStartPopup(true);
}

// ฟังก์ชันจริงที่เริ่มสร้างวิดีโอ
async function confirmStartVideo() {
  setConfirmStartPopup(false);
  setIsVideoStarted(true);
  startVideoCreation();
}

  async function startVideoCreation() {
    if (!id) {
      router.push('/list-file');
      return;
    }

    setLoading(true);
    setError(null);
    setStatus({ 
      _id: id, 
      executionId: null, 
      status: 'starting', 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString() 
    });

    const userId = localStorage.getItem('loggedInUser'); 
    if (!userId) {
      setError("User ID not found.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/queue-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ fileId: id, userId: userId }) 
      });

      if (res.status === 402) {
        const result = await res.json();
        setError(result.message || 'จำนวน Token ไม่พอ');
        setLoading(false);
        return; 
      }

      const result = await res.json();

      if (res.ok) {
        setStatus({ 
          _id: id, 
          executionId: result.jobId, 
          status: result.status || 'queued', 
          createdAt: new Date().toISOString(), 
          updatedAt: new Date().toISOString(),
          queuePosition: result.queuePosition
        });
      } else {
        setError(result.error || 'Failed to queue job');
        setStatus(prev => prev ? { 
          ...prev, 
          status: 'error', 
          updatedAt: new Date().toISOString() 
        } : null);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to queue job');
      setStatus(prev => prev ? { 
        ...prev, 
        status: 'error', 
        updatedAt: new Date().toISOString() 
      } : null);
    } finally {
      setLoading(false);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idle':
        return <div className="w-3 h-3 rounded-full bg-gray-400"></div>;
      case 'queued':
        return <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>;
      case 'starting':
      case 'running':
      case 'processing':
        return <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>;
      case 'succeeded':
      case 'completed':
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
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'queued':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'running':
      case 'starting':
      case 'processing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'idle':
        return 'พร้อมเริ่มงาน';
      case 'queued':
        return 'อยู่ในคิว';
      case 'starting':
        return 'กำลังเริ่มต้น';
      case 'running':
      case 'processing':
        return 'กำลังสร้างวิดีโอ';
      case 'succeeded':
      case 'completed':
        return 'เสร็จสิ้น';
      case 'error':
        return 'เกิดข้อผิดพลาด';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen">
  <div className="container mx-auto px-4 py-6">
    <StepProgress
      steps={['อัปโหลดไฟล์', 'รายการไฟล์', 'สร้างวิดีโอ']}
      currentStep={3}
      canGoNext={false}
      onNext={() => {}}
      onPreview={() => router.push('/list-file')}
      onMyVideos={() => router.push('/my-videos')}
    />
    
    {!status && !error && <p>กำลังโหลดสถานะ...</p>}
    
    {/* Header */}
    <div className="text-center my-6">
      <p className="text-2xl text-gray-800 font-bold">สร้างวิดีโอ</p>
    </div>


    <div className="container mx-auto px-4 max-w-6xl">
          {/* File ID Card */}
          {id && <EnhancedFileCard fileId={id} />}

          {/* Status + Queue Card */}
{status && (
  status.status === 'queued' || 
  status.status === 'starting' || 
  status.status === 'running' || 
  status.status === 'processing' ||
  status.status === 'succeeded' ||
  status.status === 'completed'
) &&( 
  <div className={`rounded-xl shadow-lg p-6 mb-6 border-2 ${getStatusColor(status.status)}`}>
    {/* Header */}
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-bold flex items-center space-x-3">
        {getStatusIcon(status.status)}
        <span>สถานะการทำงาน</span>
      </h3>
      <div className="flex items-center space-x-3">
        {/* ปุ่มยกเลิกคิว - แสดงเฉพาะเมื่อ status เป็น queued */}
        {status.status === 'queued' && (
          <button
            onClick={cancelQueue}
            disabled={cancelling}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {cancelling ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>กำลังยกเลิก...</span>
              </>
            ) : (
              <>
                <span>✕</span>
                <span>ยกเลิกคิว</span>
              </>
            )}
          </button>
        )}
        
        {(status.status === 'running' || status.status === 'queued') && (
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        )}
      </div>
    </div>

    {/* Main Info Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div className="bg-white/70 rounded-lg p-4">
        <p className="text-sm text-gray-500 mb-1">สถานะปัจจุบัน</p>
        <p className="font-bold text-lg">{getStatusText(status.status)}</p>
      </div>

      {status.queuePosition && (
        <div className="bg-white/70 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">ลำดับในคิว</p>
          <p className="font-bold text-lg">#{status.queuePosition}</p>
        </div>
      )}

      {status.executionId && status.status !== 'queued' && (
        <div className="bg-white/70 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Execution ID</p>
          <p className="font-mono text-sm truncate">{status.executionId}</p>
        </div>
      )}

      <div className="bg-white/70 rounded-lg p-4">
        <p className="text-sm text-gray-500 mb-1">อัพเดทล่าสุด</p>
        <p className="text-sm">{status?.updatedAt ? formatDateTime(new Date(status.updatedAt)) : ''}</p>
      </div>
    </div>
    
    {/* CHECK TOKEN ERROR POPUP */}
{error && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4">
    <div className="bg-white border-2 border-red-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-2xl">⚠️</span>
        </div>
        <div>
          <h3 className="font-semibold text-red-800 text-lg">Token ไม่เพียงพอ</h3>
          <p className="text-red-600 text-sm mt-1">
            {error.includes('Insufficient tokens') 
              ? 'คุณมีโทเคนไม่พอสำหรับสร้างวิดีโอนี้ กรุณาเติมโทเคน หรือลดความยาววิดีโอ' 
              : error}
          </p>
        </div>
      </div>
      
      {/* Close Button */}
      <div className="flex justify-end mt-6">
        <button
          onClick={() => setError(null)}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm font-medium"
        >
          ตกลง
        </button>
      </div>
    </div>
  </div>
)}

    {/* Queue Info Inline */}
    {status.status === 'queued' && status.queuePosition && (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xl">⏳</span>
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-yellow-800 mb-1">งานของคุณอยู่ในคิว</h4>
          <p className="text-yellow-700 text-sm">
            ลำดับที่ {status.queuePosition} - ระบบจะเริ่มดำเนินการโดยอัตโนมัติเมื่อถึงลำดับ
          </p>
        </div>
        <div className="text-sm text-yellow-600">
          คุณสามารถยกเลิกคิวนี้ได้ →
        </div>
      </div>
    )}
  </div>
)}

          {/* Confirm Cancel Popup */}
{confirmCancelPopup && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 p-4">
    <div className="bg-white border-2 border-yellow-200 rounded-2xl p-6 max-w-md w-full shadow-2xl">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-2xl">⚠️</span>
        </div>
        <div>
          <h3 className="font-semibold text-yellow-800 text-lg">ยืนยันการยกเลิก</h3>
          <p className="text-yellow-700 text-sm mt-1">
            คุณแน่ใจหรือไม่ที่จะยกเลิกคิวนี้? 
          </p>
        </div>
      </div>
      <div className="flex justify-end space-x-3 mt-6">
        <button
          onClick={() => setConfirmCancelPopup(false)}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200 text-sm font-medium"
        >
          ยกเลิก
        </button>
        <button
          onClick={confirmCancelQueue}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm font-medium"
        >
          ยืนยัน
        </button>
      </div>
    </div>
  </div>
)}

          {/* Confirm Start Video Popup */}
{confirmStartPopup && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 p-4">
    <div className="bg-white border-2 border-blue-200 rounded-2xl p-6 max-w-md w-full shadow-2xl">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-2xl">ℹ️</span>
        </div>
        <div>
          <h3 className="font-semibold text-blue-800 text-lg">ยืนยันการสร้างวิดีโอ</h3>
          <p className="text-blue-700 text-sm mt-1">
            เมื่อเริ่มสร้างวิดีโอแล้ว คุณจะไม่สามารถยกเลิกได้จนกว่าจะเสร็จสิ้น คุณต้องการดำเนินการต่อหรือไม่?
          </p>
        </div>
      </div>
      <div className="flex justify-end space-x-3 mt-6">
        <button
          onClick={() => setConfirmStartPopup(false)}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200 text-sm font-medium"
        >
          ยกเลิก
        </button>
        <button
          onClick={confirmStartVideo}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm font-medium"
        >
          ยืนยัน
        </button>
      </div>
    </div>
  </div>
)}

          {/* Error Alert */}
          {errorPopup.visible && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 p-4">
    <div className="bg-white border-2 border-red-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-2xl">⚠️</span>
        </div>
        <div>
          <h3 className="font-semibold text-red-800 text-lg">เกิดข้อผิดพลาด!</h3>
          <p className="text-red-600 text-sm mt-1">
            {errorPopup.error || 'ไม่สามารถสร้างวิดีโอได้'}  {/* 🔥 แก้ตรงนี้ */}
          </p>
        </div>
      </div>    
      {/* Close Button */}
      <div className="flex justify-end mt-6">
        <button
          onClick={() => setErrorPopup({ visible: false, executionId: null, error: '' })}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm font-medium"
        >
          ปิด
        </button>
      </div>
    </div>
  </div>
)}

          {/* Token Usage Popup - แสดงแค่ว่างานสำเร็จ */}
{tokenPopup.visible && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 p-4">
    <div className="bg-white border-2 border-green-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-2xl">✓</span>
        </div>
        <div>
          <h3 className="font-semibold text-green-800 text-lg">สร้างวิดีโอสำเร็จ!</h3>
          <p className="text-green-600 text-sm mt-1">
            วิดีโอของคุณถูกสร้างเรียบร้อยแล้ว
          </p>
        </div>
      </div>
      
      {/* Close Button */}
      <div className="flex justify-end mt-6">
        <button
          onClick={() => setTokenPopup({ visible: false, tokensUsed: 0, remainingTokens: 0 })}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm font-medium"
        >
          ปิด
        </button>
      </div>
    </div>
  </div>
)}
          
          {/* Cancel Success Popup */}
{cancelSuccessPopup.visible && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 p-4">
    <div className="bg-white border-2 border-green-200 rounded-2xl p-6 max-w-md w-full shadow-2xl">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-2xl">✓</span>
        </div>
        <div>
          <h3 className="font-semibold text-green-800 text-lg">ยกเลิกคิวสำเร็จ!</h3>
          <p className="text-green-600 text-sm mt-1">
            คืน {cancelSuccessPopup.tokensReturned} token ให้คุณแล้ว
          </p>
        </div>
      </div>
      <div className="flex justify-end mt-6">
        <button
          onClick={() => setCancelSuccessPopup({ visible: false, tokensReturned: 0 })}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm font-medium"
        >
          ปิด
        </button>
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
                        <span className="text-xs text-gray-500">คลิป {index + 1}</span>
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
                status?.status === 'succeeded' || 
                status?.status === 'completed' ||
                status?.status === 'starting' ||
                status?.status === 'queued' ||
                status?.status === 'processing'}
              className={`inline-flex items-center space-x-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                status?.status === 'running' || 
                status?.status === 'succeeded' ||
                status?.status === 'completed' ||
                status?.status === 'starting' ||
                status?.status === 'queued' ||
                status?.status === 'processing'
                  ? 'bg-gray-400 text-gray-500 cursor-not-allowed shadow-none transform-none'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
              }`}
              // onClick={startVideoCreation}
  //              onClick={() => {
  //   setIsVideoStarted(true); // 🔥 เพิ่มตรงนี้
  //   startVideoCreation();    // เรียก API เริ่มสร้างวิดีโอ
  // }}
            onClick={handleStartVideo}
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>กำลังเริ่มต้น...</span>
                </>
              ) : status?.status === 'queued' ? (
                <>
                  <span>อยู่ในคิว...</span>
                </>
              ) : status?.status === 'running' || status?.status === 'starting' || status?.status === 'processing' ? (
                <>
                  <span>กำลังสร้างวิดีโอ...</span>
                </>
              ) : status?.status === 'succeeded' || status?.status === 'completed' ? (
                <>
                  <span>เสร็จสิ้นแล้ว</span>
                </>
              ) : (
                <>
                  <span>เริ่มสร้างวิดีโอ</span>
                </>
              )}
            </button>
            
            {(status?.status === 'running' || status?.status === 'starting' || status?.status === 'processing') && (
              <p className="mt-3 text-sm text-gray-600">
                กระบวนการนี้อาจใช้เวลาสักครู่ หน้าจอจะอัพเดทอัตโนมัติทุก 10 วินาที
              </p>
            )}

            {status?.status === 'queued' && (
              <p className="mt-3 text-sm text-gray-600">
                งานของคุณอยู่ในคิว ระบบจะเริ่มดำเนินการโดยอัตโนมัติเมื่อถึงลำดับ
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
