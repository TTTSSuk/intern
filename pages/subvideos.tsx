// เพิ่มไฟล์ใหม่ pages/subvideos.tsx

import { useEffect, useState } from "react";
import { useRouter } from 'next/router';
// สมมติว่ามี Layout Component ที่ใช้ร่วมกัน
// import Layout from "@/components/Layouts/Layout"; 

// Interface สำหรับข้อมูลวิดีโอ (ตรงกับ API history-videos)
interface Clip {
  video?: string; // URL ของ video clip
  finalVideo?: string; // URL ของ final video
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
  clips?: Clip[]; // array ของ clips (optional เพราะบางรายการอาจไม่มี)
  executionIdHistory?: any;
  folders?: any;
}

// URL ของ n8n workflow ใหม่ (ต้องสร้างใน n8n ก่อน)
const N8N_WORKFLOW_URL = process.env.NEXT_PUBLIC_N8N_WORKFLOW_URL || ""; 

export default function SelectClips() {
  const router = useRouter();
  const [userClips, setUserClips] = useState<string[]>([]); // เก็บ URL ของ clips.video
  const [selectedClips, setSelectedClips] = useState<string[]>([]); // เก็บ URL ที่เลือก (เรียงตามลำดับการคลิก)
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);

  // ดึง userId จาก localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem("loggedInUser");
    if (!storedUserId) {
      router.push('/login'); // ถ้ายังไม่ login ให้ไปหน้า login
    } else {
      setUserId(storedUserId);
    }
  }, [router]);

  // Fetch video clips จาก listfile collection
  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setMessage("");
    
    // ใช้ API list-files ที่มีอยู่แล้ว (เหมือนกับหน้า list-file.tsx)
    fetch(`/api/list-files?userId=${encodeURIComponent(userId)}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch files");
        return res.json();
      })
      .then((data: { files: HistoryVideo[] }) => {
        console.log("Data from API:", data); // Debug: ดูข้อมูลที่ได้รับ
        
        // ดึงเฉพาะ URL ของ clips.video ที่มีค่า และไม่ซ้ำกัน
        const clipsSet = new Set<string>();
        
        // API list-files return { files: [...] } ไม่ใช่ array โดยตรง
        const filesArray = data.files || [];
        
        // ตรวจสอบว่า filesArray เป็น array และมีข้อมูล
        if (Array.isArray(filesArray)) {
          filesArray.forEach(historyVideo => {
            // ตรวจสอบว่า clips มีค่าและเป็น array
            if (historyVideo.clips && Array.isArray(historyVideo.clips)) {
              historyVideo.clips.forEach(clip => {
                // เพิ่มเฉพาะ clip.video (ไม่เอา finalVideo)
                if (clip.video) {
                  clipsSet.add(clip.video);
                }
              });
            }
          });
        }
        
        console.log("Extracted clips:", Array.from(clipsSet)); // Debug: ดู clips ที่ดึงได้
        setUserClips(Array.from(clipsSet));
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching clips:", err);
        setMessage("Error loading clips: " + err.message);
        setLoading(false);
      });
  }, [userId]);

  // ฟังก์ชันเลือก/ยกเลิกการเลือกคลิป (เรียงตามลำดับการคลิก)
  const handleSelectClip = (clipUrl: string) => {
    setSelectedClips(prevSelected => {
      if (prevSelected.includes(clipUrl)) {
        // ถ้าเลือกอยู่แล้ว ให้ยกเลิก
        return prevSelected.filter(url => url !== clipUrl);
      } else {
        // ถ้ายังไม่เลือก ให้เพิ่มท้ายสุด
        return [...prevSelected, clipUrl];
      }
    });
  };

  // ฟังก์ชันส่งคลิปที่เลือกไปยัง n8n
 const handleSendToN8n = async () => {
  if (selectedClips.length === 0) {
    setMessage("กรุณาเลือกคลิปอย่างน้อย 1 คลิป");
    return;
  }

  setSending(true);
  setMessage("กำลังส่งข้อมูล...");

  try {
    const response = await fetch('/api/start-subvideos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        selectedClipUrls: selectedClips,
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

    // 🔥 (แนะนำ) redirect ไปหน้าดูสถานะ
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

//   const handleSendToN8n = async () => {
//     if (selectedClips.length === 0) {
//       setMessage("กรุณาเลือกคลิปอย่างน้อย 1 คลิป");
//       return;
//     }
//     if (!N8N_WORKFLOW_URL) {
//     setMessage("ยังไม่ได้กำหนด URL ของ n8n workflow");
//     return;
// }

//     setSending(true);
//     setMessage("กำลังส่งข้อมูล...");

//     try {
//       const response = await fetch(N8N_WORKFLOW_URL, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           userId: userId, // ส่ง userId ไปด้วย (เผื่อ n8n ต้องการ)
//           selectedClipUrls: selectedClips, // ส่ง array ที่เรียงตามลำดับการเลือก
//         }),
//       });

//       if (!response.ok) {
//         throw new Error(`n8n workflow failed with status: ${response.status}`);
//       }

//       const result = await response.json(); // อ่าน response จาก n8n (ถ้ามี)
//       setMessage(`ส่งคลิป ${selectedClips.length} คลิปสำเร็จ!`);
//       setSelectedClips([]); // ล้างรายการที่เลือก
//       console.log("n8n response:", result);

//     } catch (error) {
//       console.error("Error sending clips to n8n:", error);
//       setMessage(`เกิดข้อผิดพลาดในการส่งข้อมูล: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     } finally {
//       setSending(false);
//     }
//   };

  const BASE_VIDEO_URL = process.env.NEXT_PUBLIC_BASE_VIDEO_URL || ""; // ดึง Base URL มาใช้

  return (
    // <Layout user={...} setUser={...}> // ถ้าต้องการใช้ Layout ร่วม
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
                    // ใช้ BASE_VIDEO_URL ถ้า URL ที่เก็บไว้เป็น relative path
                    src={clipUrl.startsWith('http') ? clipUrl : `${BASE_VIDEO_URL}/${clipUrl}`}
                    controls={false} // ไม่แสดง controls เริ่มต้น
                    className="w-full h-40 object-cover"
                    preload="metadata" // โหลดแค่ metadata เพื่อแสดง frame แรก
                  />
                  {/* Overlay สำหรับแสดงสถานะการเลือก */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-600 bg-opacity-40 flex items-center justify-center">
                      <div className="bg-white rounded-full p-2 shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                   {/* แสดงชื่อไฟล์ (ส่วนท้ายของ URL) */}
                   <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2 truncate">
                    {clipUrl.split('/').pop()}
                   </div>
                   {/* แสดงลำดับการเลือกที่มุมบนซ้าย */}
                   {isSelected && selectionOrder && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white font-bold text-sm w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                      {selectionOrder}
                    </div>
                   )}
                   {/* Checkbox indicator มุมบนขวา */}
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

            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handleSendToN8n}
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
                    <span>ส่ง {selectedClips.length} คลิปไปยัง n8n</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    // </Layout>
  );
}