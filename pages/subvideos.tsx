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
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

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
      setMessage("กรุณาเลือกวิดีโออย่างน้อย 2 วิดีโอ");
      return;
    }
    setShowModal(true);
    setMessage(""); // ล้างข้อความเตือน
  };

  // 🔥 ฟังก์ชันเมื่อกด "ยืนยันและส่ง" ใน modal แรก -> เปิด modal ยืนยัน
  const handleProceedToConfirm = () => {
    if (!originalName.trim()) {
      setMessage("กรุณากรอกชื่อวิดีโอ");
      return;
    }
    setShowModal(false);
    setShowConfirmModal(true);
  };

  // 🔥 ฟังก์ชันส่งข้อมูลจริงเมื่อกดยืนยันครั้งสุดท้าย
  const handleConfirmSend = async () => {

    setSending(true);
    setMessage("กำลังส่งข้อมูล...");
    setShowConfirmModal(false); // ปิด modal ยืนยัน

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
      
      setMessage(`ส่งวิดีโอ ${selectedClips.length} วิดีโอสำเร็จ! กำลังประมวลผล...`);
      setSelectedClips([]);
      setOriginalName("");

      setTimeout(() => {
        router.push(`/create-video?id=${result._id}`);
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
    // <div className="min-h-screen bg-white">
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            เลือก Video
          </h1>
          <p className="text-gray-600">เลือกวิดีโอที่ต้องการรวมเป็นวิดีโอเดียว</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">กำลังโหลดวิดีโอ...</p>
          </div>
        )}

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${
            message.includes("สำเร็จ") || message.includes("ส่งวิดีโอ")
              ? 'bg-green-50 border-green-500 text-green-700'
              : message.includes("ผิดพลาด") || message.includes("กรุณา")
              ? 'bg-red-50 border-red-500 text-red-700'
              : 'bg-blue-50 border-blue-500 text-blue-700'
          }`}>
            <p className="font-medium">{message}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && userClips.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-purple-100 rounded-full mb-6">
              <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">ยังไม่มีวิดีโอ</h3>
            <p className="text-gray-600 mb-6">อัพโหลดวิดีโอเพื่อสร้างวิดีโอก่อนนะ</p>
            <button
              onClick={() => router.push('/upload')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              ไปหน้าอัพโหลด
            </button>
          </div>
        )}

        {/* Main Content */}
        {!loading && userClips.length > 0 && (
          <>
            {/* Stats & Controls Bar */}
            <div className="mb-6 bg-white rounded-xl shadow-md p-6 border border-purple-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <p className="text-sm text-gray-700">
                      วิดีโอทั้งหมด: <span className="font-bold text-purple-600">{userClips.length}</span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <p className="text-sm text-gray-700">
                      เลือกแล้ว: <span className="font-bold text-green-600">{selectedClips.length}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {selectedClips.length > 0 && (
                    <button
                      onClick={() => setSelectedClips([])}
                      className="px-4 py-2 text-sm border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-all font-medium"
                    >
                      ยกเลิกทั้งหมด
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedClips([...userClips])}
                    className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                  >
                    เลือกทั้งหมด
                  </button>
                  
                  {/* ปุ่มส่งคลิป */}
                  <button
                    onClick={handleOpenModal}
                    disabled={sending || selectedClips.length === 0}
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    {sending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>กำลังส่ง...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        <span>ส่ง {selectedClips.length} วิดีโอ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
              {userClips.map((clipUrl) => {
                const isSelected = selectedClips.includes(clipUrl);
                const selectionOrder = isSelected ? selectedClips.indexOf(clipUrl) + 1 : null;
                
                return (
                  <div
                    key={clipUrl}
                    className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                      isSelected 
                        ? 'ring-4 ring-purple-400 shadow-2xl scale-105' 
                        : 'ring-2 ring-gray-200 hover:ring-purple-300 hover:shadow-xl'
                    }`}
                    onClick={() => handleSelectClip(clipUrl)}
                  >
                    {/* Video Thumbnail */}
                    <div className="relative aspect-video bg-black">
                      <video
                        src={clipUrl.startsWith('http') ? clipUrl : `${BASE_VIDEO_URL}/${clipUrl}`}
                        controls={false}
                        className="w-full h-full object-cover"
                        preload="metadata"
                      />
                      
                      {/* Overlay when selected */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/40 to-pink-600/40 flex items-center justify-center">
                          <div className="bg-white rounded-full p-3 shadow-2xl">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* File Name */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-2">
                      <p className="text-white text-xs truncate font-medium">
                        {clipUrl.split('/').pop()}
                      </p>
                    </div>

                    {/* Selection Order Badge */}
                    {isSelected && selectionOrder && (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm w-8 h-8 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white">
                        {selectionOrder}
                      </div>
                    )}

                    {/* Checkbox */}
                    <div className="absolute top-2 right-2">
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-md ${
                        isSelected 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-white' 
                          : 'bg-white/80 border-gray-300 group-hover:border-purple-400'
                      }`}>
                        {isSelected && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* 🔥 Modal สำหรับกรอกชื่อวิดีโอ */}
        {showModal && (
          <div className="fixed inset-0 z-[50] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in zoom-in duration-300">
              {/* ปุ่มปิด */}
              <button
                onClick={() => {
                  setShowModal(false);
                  setOriginalName("");
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              {/* หัวข้อ */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">กรอกชื่อวิดีโอ</h2>
                <p className="text-sm text-gray-600">
                  คุณกำลังส่ง <span className="font-semibold text-purple-600">{selectedClips.length}</span> วิดีโอ
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
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-400 transition-all"
                  maxLength={100}
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && originalName.trim()) {
                      handleProceedToConfirm();
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">
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
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleProceedToConfirm}
                  disabled={!originalName.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all font-semibold shadow-lg"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🔥 Confirmation Modal - ขั้นตอนที่ 2 */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in zoom-in duration-300">
              {/* Warning Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>

              {/* หัวข้อ */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">ยืนยันการสร้างวิดีโอ</h2>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg mb-4">
                  <p className="text-sm text-amber-800 font-medium mb-2">
                    ⚠️ หลังจากกดยืนยันแล้ว จะไม่สามารถยกเลิกได้
                  </p>
                  <p className="text-xs text-amber-700">
                    ระบบจะเริ่มประมวลผลทันที
                  </p>
                </div>
                
                {/* ข้อมูลสรุป */}
                <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">ชื่อวิดีโอ:</span>
                    <span className="text-sm font-semibold text-gray-800">{originalName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">จำนวนวิดีโอ:</span>
                    <span className="text-sm font-semibold text-purple-600">{selectedClips.length} วิดีโอ</span>
                  </div>
                </div>
              </div>

              {/* ปุ่มด้านล่าง */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setShowModal(true); // กลับไปแก้ไขชื่อ
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  ย้อนกลับ
                </button>
                <button
                  onClick={handleConfirmSend}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg hover:shadow-xl"
                >
                  ยืนยันและสร้าง
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// import { useEffect, useState } from "react";
// import { useRouter } from 'next/router';

// // Interface สำหรับข้อมูลวิดีโอ (ตรงกับ API history-videos)
// interface Clip {
//   video?: string;
//   finalVideo?: string;
//   createdAt: { $date: string } | string;
//   tokenDeducted?: boolean;
// }

// interface HistoryVideo {
//   _id: { $oid: string };
//   userId: string;
//   originalName: string;
//   extractPath?: string;
//   status: string;
//   createdAt: { $date: string } | string;
//   clips?: Clip[];
//   executionIdHistory?: any;
//   folders?: any;
// }

// export default function SelectClips() {
//   const router = useRouter();
//   const [userClips, setUserClips] = useState<string[]>([]);
//   const [selectedClips, setSelectedClips] = useState<string[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [sending, setSending] = useState<boolean>(false);
//   const [message, setMessage] = useState<string>("");
//   const [userId, setUserId] = useState<string | null>(null);
//   const [originalName, setOriginalName] = useState<string>("");
//   const [showModal, setShowModal] = useState<boolean>(false);

//   // ดึง userId จาก localStorage
//   useEffect(() => {
//     const storedUserId = localStorage.getItem("loggedInUser");
//     if (!storedUserId) {
//       router.push('/login');
//     } else {
//       setUserId(storedUserId);
//     }
//   }, [router]);

//   // Fetch video clips จาก listfile collection
//   useEffect(() => {
//     if (!userId) return;

//     setLoading(true);
//     setMessage("");
    
//     fetch(`/api/list-files?userId=${encodeURIComponent(userId)}`)
//       .then(res => {
//         if (!res.ok) throw new Error("Failed to fetch files");
//         return res.json();
//       })
//       .then((data: { files: HistoryVideo[] }) => {
//         console.log("Data from API:", data);
        
//         const clipsSet = new Set<string>();
//         const filesArray = data.files || [];
        
//         if (Array.isArray(filesArray)) {
//           filesArray.forEach(historyVideo => {
//             if (historyVideo.clips && Array.isArray(historyVideo.clips)) {
//               historyVideo.clips.forEach(clip => {
//                 if (clip.video) {
//                   clipsSet.add(clip.video);
//                 }
//               });
//             }
//           });
//         }
        
//         console.log("Extracted clips:", Array.from(clipsSet));
//         setUserClips(Array.from(clipsSet));
//         setLoading(false);
//       })
//       .catch(err => {
//         console.error("Error fetching clips:", err);
//         setMessage("Error loading clips: " + err.message);
//         setLoading(false);
//       });
//   }, [userId]);

//   const handleSelectClip = (clipUrl: string) => {
//     setSelectedClips(prevSelected => {
//       if (prevSelected.includes(clipUrl)) {
//         return prevSelected.filter(url => url !== clipUrl);
//       } else {
//         return [...prevSelected, clipUrl];
//       }
//     });
//   };

//   // 🔥 แก้ไข: เปิด modal แทนการส่งทันที
//   const handleOpenModal = () => {
//     if (selectedClips.length === 0) {
//       setMessage("กรุณาเลือกคลิปอย่างน้อย 1 คลิป");
//       return;
//     }
//     setShowModal(true);
//     setMessage(""); // ล้างข้อความเตือน
//   };

//   // 🔥 ฟังก์ชันส่งข้อมูลจริงเมื่อกดยืนยันใน modal
//   const handleConfirmSend = async () => {
//     if (!originalName.trim()) {
//       setMessage("กรุณากรอกชื่อวิดีโอ");
//       return;
//     }

//     setSending(true);
//     setMessage("กำลังส่งข้อมูล...");
//     setShowModal(false); // ปิด modal

//     try {
//       const response = await fetch('/api/start-subvideos', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           userId: userId,
//           selectedClipUrls: selectedClips,
//           originalName: originalName.trim(),
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || `API failed with status: ${response.status}`);
//       }

//       const result = await response.json();
//       console.log("API response:", result);
      
//       setMessage(`ส่งคลิป ${selectedClips.length} คลิปสำเร็จ! กำลังประมวลผล...`);
//       setSelectedClips([]);
//       setOriginalName("");

//       setTimeout(() => {
//   router.push(`/create-video?id=${result._id}`); // 🔥 ใช้หน้าเดียวกัน
// }, 2000);

//       // setTimeout(() => {
//       //   router.push(`/subvideos-status?id=${result._id}`);
//       // }, 2000);

//     } catch (error) {
//       console.error("Error sending clips:", error);
//       setMessage(`เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     } finally {
//       setSending(false);
//     }
//   };

//   const BASE_VIDEO_URL = process.env.NEXT_PUBLIC_BASE_VIDEO_URL || "";

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <h1 className="text-2xl font-bold mb-6">เลือก Video Clips เพื่อส่งไปยัง Workflow</h1>

//       {loading && <p>กำลังโหลดคลิป...</p>}
//       {message && <p className={`mb-4 ${message.startsWith("ส่งคลิป") ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}

//       {!loading && userClips.length === 0 && (
//         <p>ไม่พบ Video Clips สำหรับผู้ใช้นี้</p>
//       )}

//       {!loading && userClips.length > 0 && (
//         <>
//           {/* สถิติและปุ่มควบคุม */}
//           <div className="mb-6 flex items-center justify-between bg-blue-50 p-4 rounded-lg">
//             <div className="flex items-center space-x-4">
//               <p className="text-sm text-gray-700">
//                 เลือกแล้ว: <span className="font-bold text-blue-600">{selectedClips.length}</span> / {userClips.length} คลิป
//               </p>
//               {selectedClips.length > 0 && (
//                 <button
//                   onClick={() => setSelectedClips([])}
//                   className="text-sm text-red-600 hover:text-red-800 underline"
//                 >
//                   ยกเลิกทั้งหมด
//                 </button>
//               )}
//             </div>
//             <button
//               onClick={() => setSelectedClips([...userClips])}
//               className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//             >
//               เลือกทั้งหมด
//             </button>
//           </div>

//           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
//             {userClips.map((clipUrl) => {
//               const isSelected = selectedClips.includes(clipUrl);
//               const selectionOrder = isSelected ? selectedClips.indexOf(clipUrl) + 1 : null;
              
//               return (
//               <div
//                 key={clipUrl}
//                 className={`border-2 rounded-lg overflow-hidden cursor-pointer relative transition-all duration-200 ${
//                   isSelected 
//                     ? 'border-blue-500 ring-4 ring-blue-200 shadow-lg' 
//                     : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
//                 }`}
//                 onClick={() => handleSelectClip(clipUrl)}
//               >
//                 <video
//                   src={clipUrl.startsWith('http') ? clipUrl : `${BASE_VIDEO_URL}/${clipUrl}`}
//                   controls={false}
//                   className="w-full h-40 object-cover"
//                   preload="metadata"
//                 />
//                 {isSelected && (
//                   <div className="absolute inset-0 bg-blue-600 bg-opacity-40 flex items-center justify-center">
//                     <div className="bg-white rounded-full p-2 shadow-lg">
//                       <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
//                       </svg>
//                     </div>
//                   </div>
//                 )}
//                 <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2 truncate">
//                   {clipUrl.split('/').pop()}
//                 </div>
//                 {isSelected && selectionOrder && (
//                   <div className="absolute top-2 left-2 bg-blue-600 text-white font-bold text-sm w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
//                     {selectionOrder}
//                   </div>
//                 )}
//                 <div className="absolute top-2 right-2">
//                   <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
//                     isSelected 
//                       ? 'bg-blue-600 border-blue-600' 
//                       : 'bg-white border-gray-400'
//                   }`}>
//                     {isSelected && (
//                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
//                       </svg>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             )})}
//           </div>

//           {/* 🔥 ปุ่มส่ง - เปลี่ยนเป็นเปิด modal */}
//           <div className="flex items-center justify-center">
//             <button
//               onClick={handleOpenModal}
//               disabled={sending || selectedClips.length === 0}
//               className="px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
//             >
//               {sending ? (
//                 <>
//                   <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                   <span>กำลังส่ง...</span>
//                 </>
//               ) : (
//                 <>
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
//                   </svg>
//                   <span>ส่ง {selectedClips.length} คลิป</span>
//                 </>
//               )}
//             </button>
//           </div>
//         </>
//       )}

//       {/* 🔥 Modal สำหรับกรอกชื่อวิดีโอ */}
//       {showModal && (
//         <div className="fixed inset-0 z-[50] bg-black/10 backdrop-blur-[1px] animate-in fade-in duration-300 flex items-center justify-center p-4">
//           <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 relative animate-fadeIn">
//             {/* ปุ่มปิด */}
//             <button
//               onClick={() => {
//                 setShowModal(false);
//                 setOriginalName("");
//               }}
//               className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
//             >
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//               </svg>
//             </button>

//             {/* หัวข้อ */}
//             <div className="mb-6">
//               <h2 className="text-2xl font-bold text-gray-800 mb-2">กรอกชื่อวิดีโอ</h2>
//               <p className="text-sm text-gray-600">
//                 คุณกำลังส่ง <span className="font-semibold text-blue-600">{selectedClips.length}</span> คลิป
//               </p>
//             </div>

//             {/* Input */}
//             <div className="mb-6">
//               <label htmlFor="modalVideoName" className="block text-sm font-medium text-gray-700 mb-2">
//                 ชื่อวิดีโอ <span className="text-red-500">*</span>
//               </label>
//               <input
//   type="text"
//   id="modalVideoName"
//   value={originalName}
//   onChange={(e) => setOriginalName(e.target.value)}
//   placeholder="เช่น My Compilation Video"
//   className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-transparent focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-400 text-gray-800 transition-all"
//   maxLength={100}
//   autoFocus
//   onKeyPress={(e) => {
//     if (e.key === 'Enter' && originalName.trim()) {
//       handleConfirmSend();
//     }
//   }}
// />
//               <p className="text-xs text-gray-500 mt-1">
//                 {originalName.length}/100 ตัวอักษร
//               </p>
//             </div>

//             {/* ปุ่มด้านล่าง */}
//             <div className="flex space-x-3">
//               <button
//                 onClick={() => {
//                   setShowModal(false);
//                   setOriginalName("");
//                 }}
//                 className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
//               >
//                 ยกเลิก
//               </button>
//               <button
//                 onClick={handleConfirmSend}
//                 disabled={!originalName.trim()}
//                 className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold shadow-md hover:shadow-lg"
//               >
//                 ยืนยันและส่ง
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <style jsx>{`
//         @keyframes fadeIn {
//           from {
//             opacity: 0;
//             transform: scale(0.95);
//           }
//           to {
//             opacity: 1;
//             transform: scale(1);
//           }
//         }
//         .animate-fadeIn {
//           animation: fadeIn 0.2s ease-out;
//         }
//       `}</style>
//     </div>
//   );
// }