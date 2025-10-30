import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const BASE_VIDEO_URL = process.env.NEXT_PUBLIC_BASE_VIDEO_URL || "";

export default function SubvideosStatus() {
  const router = useRouter();
  const { id } = router.query;
  
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // 🔥 เพิ่ม error state

  useEffect(() => {
    if (!id) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/status-subvideos?id=${id}`);
        
        if (!res.ok) {
          throw new Error(`API Error: ${res.status}`);
        }
        
        const data = await res.json();
        setStatus(data);
        setLoading(false);

        // ถ้ายังไม่เสร็จ poll ทุก 5 วินาที
        if (!data.finished) {
          setTimeout(checkStatus, 5000);
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    checkStatus();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">กำลังตรวจสอบสถานะ...</p>
        </div>
      </div>
    );
  }

  // 🔥 เพิ่ม error handling
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push('/subvideos')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            กลับไปเลือกคลิปใหม่
          </button>
        </div>
      </div>
    );
  }

  // 🔥 เพิ่ม null check
  if (!status) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>ไม่พบข้อมูล</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">สถานะการรวมวิดีโอ</h1>

      {/* แสดงสถานะ */}
      <div className={`p-4 rounded-lg mb-6 ${
        status.status === 'completed' ? 'bg-green-50 border-green-200' :
        status.status === 'error' ? 'bg-red-50 border-red-200' :
        'bg-blue-50 border-blue-200'
      } border-2`}>
        <p className="font-bold">
          สถานะ: {
            status.status === 'completed' ? '✅ เสร็จสิ้น' :
            status.status === 'error' ? '❌ เกิดข้อผิดพลาด' :
            '⏳ กำลังประมวลผล...'
          }
        </p>
      </div>

      {/* แสดงคลิปที่เลือก */}
      {status.selectedClipUrls && status.selectedClipUrls.length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold mb-3">คลิปที่เลือก ({status.selectedClipUrls.length} คลิป):</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {status.selectedClipUrls.map((url: string, idx: number) => (
              <div key={idx} className="border rounded-lg overflow-hidden">
                <video 
                  src={`${BASE_VIDEO_URL}/${url}`}
                  className="w-full h-32 object-cover"
                  controls
                />
                <p className="text-xs p-2 truncate">{url.split('/').pop()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* แสดงวิดีโอรวม */}
      {status.finished && status.clips && status.clips.length > 0 && (
        <div>
          <h2 className="font-bold mb-3">วิดีโอรวม:</h2>
          {status.clips.map((clip: any, idx: number) => (
            clip.finalVideo && (
              <div key={idx} className="border rounded-lg overflow-hidden mb-4">
                <video 
                  src={`${BASE_VIDEO_URL}/${clip.finalVideo}`}
                  className="w-full"
                  controls
                />
                <div className="p-4 flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    สร้างเมื่อ: {new Date(clip.createdAt).toLocaleString('th-TH')}
                  </p>
                  <a 
                    href={`${BASE_VIDEO_URL}/${clip.finalVideo}`}
                    download
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    ดาวน์โหลด
                  </a>
                </div>
              </div>
            )
          ))}
        </div>
      )}

      <button
        onClick={() => router.push('/subvideos')}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        กลับไปเลือกคลิปใหม่
      </button>
    </div>
  );
}
