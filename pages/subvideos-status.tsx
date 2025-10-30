import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const BASE_VIDEO_URL = process.env.NEXT_PUBLIC_BASE_VIDEO_URL || "";

export default function SubvideosStatus() {
  const router = useRouter();
  const { id } = router.query;
  
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-blue-700">กำลังตรวจสอบสถานะ...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800">เกิดข้อผิดพลาด</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <button
                onClick={() => router.push('/subvideos')}
                className="mt-3 text-sm text-red-700 hover:text-red-900 underline"
              >
                ← กลับไปเลือกคลิปใหม่
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <p className="text-sm text-slate-500">ไม่พบข้อมูล</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-3">
      {/* Top: Status Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              status.status === 'completed' ? 'bg-green-100' :
              status.status === 'error' ? 'bg-red-100' :
              'bg-blue-100'
            }`}>
              {status.status === 'completed' ? (
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : status.status === 'error' ? (
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">
                {status.status === 'completed' ? 'รวมวิดีโอสำเร็จ' :
                 status.status === 'error' ? 'เกิดข้อผิดพลาด' :
                 'กำลังประมวลผล...'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {status.selectedClipUrls?.length || 0} คลิปที่เลือก
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/subvideos')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            กลับ
          </button>
        </div>
      </div>

      {/* Bottom: Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-3">
        {/* Left: Selected Clips */}
        {status.selectedClipUrls && status.selectedClipUrls.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <h2 className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
              คลิปที่เลือก ({status.selectedClipUrls.length})
            </h2>
            <div className="grid grid-cols-3 gap-2 max-h-[450px] overflow-y-auto pr-1">
              {status.selectedClipUrls.map((url: string, idx: number) => (
                <div key={idx} className="group relative aspect-video bg-slate-200 rounded overflow-hidden">
                  <video 
                    src={`${BASE_VIDEO_URL}/${url}`}
                    className="w-full h-full object-cover"
                    preload="metadata"
                  />
                  <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                    #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right: Final Video Result */}
        {status.finished && status.clips && status.clips.length > 0 ? (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
            <h2 className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              วิดีโอรวม
            </h2>
            {status.clips.map((clip: any, idx: number) => (
              clip.finalVideo && (
                <div key={idx} className="bg-white rounded-lg overflow-hidden shadow-sm">
                  <video 
                    src={`${BASE_VIDEO_URL}/${clip.finalVideo}`}
                    className="w-full"
                    controls
                    style={{ maxHeight: '350px' }}
                  />
                  <div className="p-2.5 flex items-center justify-between bg-slate-50/80">
                    <span className="text-[11px] text-slate-600">
                      {new Date(clip.createdAt).toLocaleString('en-US', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </span>
                    <a 
                      href={`${BASE_VIDEO_URL}/${clip.finalVideo}`}
                      download
                      className="flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white text-[11px] font-medium rounded hover:bg-green-700 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      ดาวน์โหลด
                    </a>
                  </div>
                </div>
              )
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-center">
            <div className="text-center py-12">
              <div className="w-10 h-10 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-600">กำลังรวมวิดีโอ...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}