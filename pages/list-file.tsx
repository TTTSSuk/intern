//pages\list-file.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useStep } from '@/context/StepContext';
import StepProgress from '@/components/Layouts/StepProgress';

interface Folder {
  name: string;
  files: string[];
  subfolders?: Folder[];
}

  interface ExtractedFile {
  _id: string;
  userId: string;
  originalName: string;
  extractPath: string;
  status: 'pending' | 'processing' | 'done' | 'error' | 'completed' | 'running';
  createdAt: string;
  folders?: Folder[];
  videoCreated?: boolean;
  originalFilePath?: string;
  jobType?: string;
}

interface ValidationError {
  folderName: string;
  errors: string[];
}

const sortFiles = (files: ExtractedFile[]): ExtractedFile[] => {
  const statusOrder: { [key: string]: number } = {
    'error': 3,
    'completed': 2, // วิดีโอสำเร็จรูป
    'done': 1,      // สร้างวิดีโอเสร็จแล้ว
  };

  return files.sort((a, b) => {
    const statusA = a.status.toLowerCase();
    const statusB = b.status.toLowerCase();
    
    const orderA = statusOrder[statusA] || 99; // กำหนดค่า default ถ้าสถานะไม่อยู่ใน list
    const orderB = statusOrder[statusB] || 99;

    // 1. จัดเรียงตามสถานะ (done=1, completed=2, error=3)
    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // 2. ถ้าสถานะเหมือนกัน ให้เรียงตามวันที่สร้างล่าสุด (Descending by createdAt)
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    
    return dateB - dateA;
  });
};

export default function ListFile() {
  const router = useRouter();
  const [files, setFiles] = useState<ExtractedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const steps = ['อัปโหลดไฟล์', 'รายการไฟล์', 'สร้างวิดีโอ'];
  const { currentStep, setCurrentStep } = useStep();
  
  function formatDateTime(date: Date): string {
    const datePart = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
    const timePart = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `${datePart} ${timePart}`;
  }

  // ฟังก์ชันจัดการเมื่อกด Next
  const handleNext = () => {
    if (!selectedFileId) {
      alert('กรุณาเลือกไฟล์ก่อน');
      return;
    }

    const selectedFile = files.find(f => f._id === selectedFileId);
    if (!selectedFile) {
      alert('ไม่พบไฟล์ที่เลือก');
      return;
    }

    setCurrentStep(3);
    router.push(`/create-video?id=${selectedFileId}`);
  };
  
  useEffect(() => {
    const storedUserId = localStorage.getItem('loggedInUser');
    if (!storedUserId) {
      setError('ไม่พบผู้ใช้งาน');
      setLoading(false);
      return;
    }

    const userId: string = storedUserId;
    setCurrentStep(2);

    async function fetchFiles() {
      try {
        const res = await fetch(`/api/list-files?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) throw new Error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        const data = await res.json();
        
        // ✅ กรองออกไฟล์ที่กำลัง processing หรือ pending
        const filteredFiles = data.files.filter((file: ExtractedFile) => {
          const status = file.status.toLowerCase();
          return status !== 'running' && status !== 'processing' && status !== 'pending'  && file.jobType !== 'subvideos';
        });
        
        // ⭐ เพิ่มการจัดเรียงไฟล์ก่อน setFiles
        const sortedFiles = sortFiles(filteredFiles);

        setFiles(sortedFiles);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchFiles();
  }, [setCurrentStep]);

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleDelete = async (fileId: string) => {
    const confirmDelete = confirm('คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์นี้?');
    if (!confirmDelete) return;

    try {
      const res = await fetch('/api/delete-extracted-file', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      });

      if (!res.ok) throw new Error('ลบไม่สำเร็จ');

      setFiles((prev) => prev.filter((f) => f._id !== fileId));
    } catch (err) {
      alert(`เกิดข้อผิดพลาด: ${(err as Error).message}`);
    }
  };

  function FolderView({ folder, path }: { folder: Folder; path: string }) {
    const isOpen = openFolders.has(path);

    return (
      <div className="ml-4 mt-2">
        <div
          className="cursor-pointer select-none flex items-center space-x-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors p-2 rounded-md hover:bg-blue-50"
          onClick={() => toggleFolder(path)}
        >
          <div className={`w-4 h-4 flex items-center justify-center text-xs transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
            ▶
          </div>
          <span>{folder.name}</span>
        </div>

        {isOpen && (
          <div className="ml-6 mt-1 border-l-2 border-slate-200 pl-3">
            {folder.files && folder.files.length > 0 && (
              <div className="space-y-1">
                {folder.files.map((f) => (
                  <div key={f} className="flex items-center space-x-2 text-sm text-slate-600 py-1">
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            )}
            {folder.subfolders?.map((sub) => (
              <FolderView key={sub.name} folder={sub} path={`${path}/${sub.name}`} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-lg text-slate-600 font-medium">กำลังโหลดข้อมูลไฟล์ที่แตก...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl text-red-600">⚠</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800">เกิดข้อผิดพลาด</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <span>ไม่มีไฟล์</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800">ไม่มีไฟล์</h2>
            <p className="text-slate-600">ยังไม่มีไฟล์ที่แตกจาก ZIP</p>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen"> 
    <div className="container mx-auto px-4 py-6">
      <StepProgress 
        steps={steps} 
        currentStep={currentStep}
        // canGoNext={selectedFileId !== null}
        onPreview={() => router.push('/upload-zip')}
        // onNext={handleNext}
      />
      
      {/* Header */}
      <div className="text-center my-6">
        <p className="text-2xl text-gray-800 font-bold">รายการไฟล์</p>
      </div>

      <div className="max-w-6xl mx-auto">
          {/* Files Grid */}
           <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file._id}
                className={`bg-white rounded-lg shadow hover:shadow-md transition-all duration-300 overflow-hidden border-2 ${
                  selectedFileId === file._id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-transparent'
                }`}
              >
                <div className="p-4">
          {/* <div className="space-y-6">
            {files.map((file) => (
              <div
                key={file._id}
                className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 ${
                  selectedFileId === file._id ? 'border-blue-500 ring-4 ring-blue-100' : 'border-transparent'
                }`}
              >
                <div className="p-6"> */}
                  {/* File Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Radio Button */}
                      {!file.videoCreated && (
                        <div className="pt-1">
                          <input
                            type="radio"
                            name="selectedFile"
                            checked={selectedFileId === file._id}
                            onChange={() => setSelectedFileId(file._id)}
                            className="w-5 h-5 text-blue-600 border-2 border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                      )}

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-slate-800 truncate">{file.originalName}</h3>
                          {file.videoCreated && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              สร้างวิดีโอแล้ว
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
                          <div className="flex items-center space-x-1">
                            <span>{formatDateTime(new Date(file.createdAt))}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-2 items-start">
                      {!file.videoCreated && selectedFileId === file._id && (
                        <button
                          onClick={handleNext}
                          className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-xl transition-colors shadow-md hover:shadow-lg"
                        >
                          <span className="text-lg">ถัดไป</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(file._id)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl transition-colors shadow-md hover:shadow-lg"
                      >
                        <span className="text-lg">ลบ</span>
                      </button>
                    </div>
                  </div>

                    {/* File Structure */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-700 mb-3 flex items-center justify-between space-x-2">
                      <span>โครงสร้างไฟล์</span>
                      <a 
                        href={`/api/download-original?fileId=${file._id}`} 
                        download={file.originalName}
                        className="p-1 rounded-full text-blue-500 hover:bg-blue-100 transition-colors"
                        title="ดาวน์โหลดไฟล์ต้นฉบับ"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                      </a>
                    </h4>
                    {file.folders && file.folders.length > 0 ? (
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {file.folders.map((folder) => (
                          <FolderView key={folder.name} folder={folder} path={folder.name || ''} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400">
                        <p className="text-sm">ไม่มีไฟล์ในโฟลเดอร์</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}