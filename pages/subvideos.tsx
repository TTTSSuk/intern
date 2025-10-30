// เพิ่มไฟล์ใหม่ pages/subvideos.tsx

import { useEffect, useState } from "react";
import { useRouter } from 'next/router';

// Interface สำหรับข้อมูลวิดีโอ (ตรงกับ API history-videos)
interface Clip {
  video?: string;
  finalVideo?: string;
  createdAt: { $date: string } | string;
  tokenDeducted?: boolean;
}

interface HistoryVideo {
  _id: { $oid: string };
  userId: string;
  originalName: string;
  extractPath?: string;
  status: string;
  createdAt: { $date: string } | string;
  clips?: Clip[];
  executionIdHistory?: any;
  folders?: any;
}

export default function SelectClips() {
  const router = useRouter();
  const [userClips, setUserClips] = useState<string[]>([]);
  const [selectedClips, setSelectedClips] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);

  // ดึง userId จาก localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem("loggedInUser");
    if (!storedUserId) {
      router.push('/login');
    } else {
      setUserId(storedUserId);
    }
  }, [router]);

  // Fetch video clips จาก listfile collection
  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setMessage("");
    
    fetch(`/api/list-files?userId=${encodeURIComponent(userId)}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch files");
        return res.json();
      })
      .then((data: { files: HistoryVideo[] }) => {
        console.log("Data from API:", data);
        
        const clipsSet = new Set<string>();
        const filesArray = data.files || [];
        
        if (Array.isArray(filesArray)) {
          filesArray.forEach(historyVideo => {
            if (historyVideo.clips && Array.isArray(historyVideo.clips)) {
              historyVideo.clips.forEach(clip => {
                if (clip.video) {
                  clipsSet.add(clip.video);
                }
              });
            }
          });
        }
        
        console.log("Extracted clips:", Array.from(clipsSet));
        setUserClips(Array.from(clipsSet));
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching clips:", err);
        setMessage("Error loading clips: " + err.message);
        setLoading(false);
      });
  }, [userId]);

  const handleSelectClip = (clipUrl: string) => {
    setSelectedClips(prevSelected => {
      if (prevSelected.includes(clipUrl)) {
        return prevSelected.filter(url => url !== clipUrl);
      } else {
        return [...prevSelected, clipUrl];
      }
    });
  };

  // 🔥 แก้ไข: เปิด modal แทนการส่งทันที
  const handleOpenModal = () => {
    if (selectedClips.length === 0) {
      setMessage("กรุณาเลือกคลิปอย่างน้อย 1 คลิป");
      return;
    }
    setShowModal(true);
    setMessage(""); // ล้างข้อความเตือน
  };

  // 🔥 ฟังก์ชันส่งข้อมูลจริงเมื่อกดยืนยันใน modal
  const handleConfirmSend = async () => {
    if (!originalName.trim()) {
      setMessage("กรุณากรอกชื่อวิดีโอ");
      return;
    }

    setSending(true);
    setMessage("กำลังส่งข้อมูล...");
    setShowModal(false); // ปิด modal

    try {
      const response = await fetch('/api/start-subvideos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          selectedClipUrls: selectedClips,
          originalName: originalName.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API failed with status: ${response.status}`);
      }

      const result = await response.json();
      console.log("API response:", result);
      
      setMessage(`ส่งคลิป ${selectedClips.length} คลิปสำเร็จ! กำลังประมวลผล...`);
      setSelectedClips([]);
      setOriginalName("");

      setTimeout(() => {
        router.push(`/subvideos-status?id=${result._id}`);
      }, 2000);

    } catch (error) {
      console.error("Error sending clips:", error);
      setMessage(`เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  const BASE_VIDEO_URL = process.env.NEXT_PUBLIC_BASE_VIDEO_URL || "";

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">เลือก Video Clips เพื่อส่งไปยัง Workflow</h1>

      {loading && <p>กำลังโหลดคลิป...</p>}
      {message && <p className={`mb-4 ${message.startsWith("ส่งคลิป") ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}

      {!loading && userClips.length === 0 && (
        <p>ไม่พบ Video Clips สำหรับผู้ใช้นี้</p>
      )}

      {!loading && userClips.length > 0 && (
        <>
          {/* สถิติและปุ่มควบคุม */}
          <div className="mb-6 flex items-center justify-between bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-700">
                เลือกแล้ว: <span className="font-bold text-blue-600">{selectedClips.length}</span> / {userClips.length} คลิป
              </p>
              {selectedClips.length > 0 && (
                <button
                  onClick={() => setSelectedClips([])}
                  className="text-sm text-red-600 hover:text-red-800 underline"
                >
                  ยกเลิกทั้งหมด
                </button>
              )}
            </div>
            <button
              onClick={() => setSelectedClips([...userClips])}
              className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              เลือกทั้งหมด
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {userClips.map((clipUrl) => {
              const isSelected = selectedClips.includes(clipUrl);
              const selectionOrder = isSelected ? selectedClips.indexOf(clipUrl) + 1 : null;
              
              return (
              <div
                key={clipUrl}
                className={`border-2 rounded-lg overflow-hidden cursor-pointer relative transition-all duration-200 ${
                  isSelected 
                    ? 'border-blue-500 ring-4 ring-blue-200 shadow-lg' 
                    : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
                }`}
                onClick={() => handleSelectClip(clipUrl)}
              >
                <video
                  src={clipUrl.startsWith('http') ? clipUrl : `${BASE_VIDEO_URL}/${clipUrl}`}
                  controls={false}
                  className="w-full h-40 object-cover"
                  preload="metadata"
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-blue-600 bg-opacity-40 flex items-center justify-center">
                    <div className="bg-white rounded-full p-2 shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2 truncate">
                  {clipUrl.split('/').pop()}
                </div>
                {isSelected && selectionOrder && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white font-bold text-sm w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                    {selectionOrder}
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected 
                      ? 'bg-blue-600 border-blue-600' 
                      : 'bg-white border-gray-400'
                  }`}>
                    {isSelected && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            )})}
          </div>

          {/* 🔥 ปุ่มส่ง - เปลี่ยนเป็นเปิด modal */}
          <div className="flex items-center justify-center">
            <button
              onClick={handleOpenModal}
              disabled={sending || selectedClips.length === 0}
              className="px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>กำลังส่ง...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>ส่ง {selectedClips.length} คลิป</span>
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* 🔥 Modal สำหรับกรอกชื่อวิดีโอ */}
      {showModal && (
        <div className="fixed inset-0 z-[50] bg-black/10 backdrop-blur-[1px] animate-in fade-in duration-300 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 relative animate-fadeIn">
            {/* ปุ่มปิด */}
            <button
              onClick={() => {
                setShowModal(false);
                setOriginalName("");
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* หัวข้อ */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">กรอกชื่อวิดีโอ</h2>
              <p className="text-sm text-gray-600">
                คุณกำลังส่ง <span className="font-semibold text-blue-600">{selectedClips.length}</span> คลิป
              </p>
            </div>

            {/* Input */}
            <div className="mb-6">
              <label htmlFor="modalVideoName" className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อวิดีโอ <span className="text-red-500">*</span>
              </label>
              <input
  type="text"
  id="modalVideoName"
  value={originalName}
  onChange={(e) => setOriginalName(e.target.value)}
  placeholder="เช่น My Compilation Video"
  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-transparent focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400 text-gray-800 transition-all"
  maxLength={100}
  autoFocus
  onKeyPress={(e) => {
    if (e.key === 'Enter' && originalName.trim()) {
      handleConfirmSend();
    }
  }}
/>
              <p className="text-xs text-gray-500 mt-1">
                {originalName.length}/100 ตัวอักษร
              </p>
            </div>

            {/* ปุ่มด้านล่าง */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setOriginalName("");
                }}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmSend}
                disabled={!originalName.trim()}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold shadow-md hover:shadow-lg"
              >
                ยืนยันและส่ง
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}