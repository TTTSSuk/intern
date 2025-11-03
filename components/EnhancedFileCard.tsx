"use client"

import { useEffect, useState } from "react"
import { Copy, Check } from "lucide-react"

// Type definitions
interface FileDetails {
  fileName: string
  totalClips: number
  createdClips: number
  tokensReserved: number
  status: string
  createdAt: string | null
  jobType?: 'normal' | 'subvideos'; // 🔥 เพิ่ม jobType
  executionId?: string
  queuePosition?: number; 
}

interface EnhancedFileCardProps {
  fileId: string
  onDataLoaded?: (data: any) => void
}

// Enhanced File Card Component
export default function EnhancedFileCard({ fileId, onDataLoaded }: EnhancedFileCardProps) {
  const [fileDetails, setFileDetails] = useState<FileDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)

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

  // 🔥 เพิ่ม Helper functions สำหรับ Status (เหมือนใน create-video.tsx)
  const getStatusText = (status: string) => {
    switch (status) {
      case 'idle': return 'พร้อมเริ่มงาน';
      case 'queued': return 'อยู่ในคิว';
      case 'starting': return 'กำลังเริ่มต้น';
      case 'running': return 'กำลังสร้างวิดีโอ';
      case 'processing': return 'กำลังประมวลผล';
      case 'succeeded': return 'เสร็จสิ้น';
      case 'completed': return 'เสร็จสิ้น';
      case 'error': return 'เกิดข้อผิดพลาด';
      default: return status;
    }
  };

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'succeeded':
      case 'completed':
        return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300';
      case 'error':
        return 'bg-gradient-to-br from-red-50 to-pink-50 border-red-300';
      case 'queued':
        return 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300';
      case 'running':
      case 'starting':
      case 'processing':
        return 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300';
      default:
        return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300';
    }
  };

  // useEffect(() => {
  //   async function fetchFileDetails() {
  //     try {
  //       // 🔥 เปลี่ยน API endpoint เป็น status-unified
  //       const res = await fetch(`/api/status-unified?id=${fileId}&t=${Date.now()}`)

  //       if (!res.ok) {
  //         console.error("Failed to fetch file details:", res.status)
  //         setError(true)
  //         setLoading(false)
  //         return
  //       }

  //       const data = await res.json()
  //       console.log("API Response:", data)

  //       // Calculate required clips from folders.subfolders
  //       let requiredClips = 0
  //       if (data.folders?.subfolders && Array.isArray(data.folders.subfolders)) {
  //         requiredClips = data.folders.subfolders.length
  //       }

  //       // นับเฉพาะ video clips (ไม่รวม finalVideo)
  //       let createdClips = 0
        
  //       if (data.clips && Array.isArray(data.clips)) {
  //         createdClips = data.clips.filter((clip: any) => clip.video && !clip.finalVideo).length
  //       }

  //       const details = {
  //         fileName: data.originalName || "ไม่พบชื่อไฟล์",
  //         totalClips: requiredClips,
  //         createdClips: createdClips,
  //         tokensReserved: data.tokensReserved || 0,
  //         status: data.status || "unknown",
  //         createdAt: data.createdAt || null,
  //         jobType: data.jobType || 'normal', // 🔥 เก็บ jobType
  //         executionId: data.executionIdHistory?.executionId || data.executionId || null,  // ⭐ เพิ่มบรรทัดนี้
  //          queuePosition: data.queuePosition || null // 🔥 เพิ่มบรรทัดนี้
  //       }

  //       console.log("Processed file details:", details)
        
  //       setFileDetails(details)

  //       if (onDataLoaded) {
  //         onDataLoaded(data)
  //       }

  //       setLoading(false)
  //     } catch (error) {
  //       console.error("Error fetching file details:", error)
  //       setError(true)
  //       setLoading(false)
  //     }
  //   }

  //   if (fileId) {
  //     fetchFileDetails()
  //   }
  // }, [fileId, onDataLoaded])

  useEffect(() => {
    async function fetchFileDetails() {
      try {
        // 🔥 เปลี่ยน API endpoint เป็น status-unified
        const res = await fetch(`/api/status-unified?id=${fileId}&t=${Date.now()}`)

        if (!res.ok) {
          console.error("Failed to fetch file details:", res.status)
          setError(true)
          setLoading(false)
          return
        }

        const data = await res.json()
        console.log("API Response:", data)

        // Calculate required clips from folders.subfolders
        let requiredClips = 0
        if (data.folders?.subfolders && Array.isArray(data.folders.subfolders)) {
          requiredClips = data.folders.subfolders.length
        }

        // นับเฉพาะ video clips (ไม่รวม finalVideo)
        let createdClips = 0
        
        if (data.clips && Array.isArray(data.clips)) {
          createdClips = data.clips.filter((clip: any) => clip.video && !clip.finalVideo).length
        }

        const details = {
          fileName: data.originalName || "ไม่พบชื่อไฟล์",
          totalClips: requiredClips,
          createdClips: createdClips,
          tokensReserved: data.tokensReserved || 0,
          status: data.status || "unknown",
          createdAt: data.createdAt || null,
          jobType: data.jobType || 'normal', // 🔥 เก็บ jobType
          executionId: data.executionIdHistory?.executionId || data.executionId || null,  // ⭐ เพิ่มบรรทัดนี้
           queuePosition: data.queuePosition || null // 🔥 เพิ่มบรรทัดนี้
        }

        console.log("Processed file details:", details)
        
        setFileDetails(details)

        if (onDataLoaded) {
          onDataLoaded(data)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching file details:", error)
        setError(true)
        setLoading(false)
      }
    }

    if (fileId) {
      fetchFileDetails()
      
      // 🔥 เพิ่มการ polling ทุก 10 วินาที (เหมือนในหน้า create-video)
      const interval = setInterval(() => {
        fetchFileDetails()
      }, 10000)
      
      return () => clearInterval(interval)
    }
  }, [fileId, onDataLoaded])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fileId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
        {/* ... (ส่วน Loading เหมือนเดิม) ... */}
      </div>
    )
  }

  if (error || !fileDetails) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl shadow-lg p-6 mb-6">
        {/* ... (ส่วน Error เหมือนเดิม) ... */}
      </div>
    )
  }

  // Calculate progress
  const totalCreatedClips = fileDetails?.createdClips || 0
  const totalClipsRequired = fileDetails?.totalClips || 0
  const progressPercent = totalClipsRequired > 0
    ? (totalCreatedClips / totalClipsRequired) * 100
    : 0
  const isComplete = totalCreatedClips >= totalClipsRequired
  const isSubvideosJob = fileDetails.jobType === 'subvideos'; // 🔥 เช็คประเภทงาน

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 mb-6 border-2 border-gray-200 hover:border-blue-300">
      <div className="flex items-start gap-4">
        {/* Left: File Icon & Info */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold text-gray-800 truncate mb-2" title={fileDetails.fileName}>
              {fileDetails.fileName}
            </h3>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center gap-2 mb-1">
              <div className="bg-gray-100 rounded-lg px-3 py-1.5 flex items-center gap-2 min-w-0">
                <p className="text-xs text-gray-500 font-mono truncate flex-1" title={fileId}>
                  ID: {fileId}
                </p>
                <button
                  onClick={copyToClipboard}
                  className={`p-1 rounded transition-all duration-200 flex-shrink-0 ${
                    copied 
                      ? 'text-green-600' 
                      : 'text-blue-600 hover:text-gray-700'
                  }`}
                  title="Copy ID"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">สร้างเมื่อ:</span>
              <span className="text-sm font-medium text-gray-700">
                {fileDetails.createdAt
                  ? formatDateTime(new Date(fileDetails.createdAt))
                  : "ไม่ระบุวันที่"}
              </span>
            </div>
          </div>
        </div>

        {/* 🔥 Right: Stats Grid (ปรับปรุงใหม่) */}
        <div className="flex-shrink-0">
          
          {/* 🔥 ใช้เงื่อนไข isSubvideosJob */}
          {isSubvideosJob ? (
  // ⭐ เปลี่ยนเป็น flex column เพื่อเพิ่ม Execution ID
  <div className="grid grid-cols-2 gap-3">
    {/* Status Card */}
    <div 
      className={`rounded-lg p-3 border-2 transition-all duration-300 ${getStatusColorClass(fileDetails.status)}`}
      style={{ minWidth: '200px' }}
    >
      <p className="text-sm text-gray-500 mb-1">สถานะปัจจุบัน</p>
      <div className="flex items-center gap-2">
        <p className="font-bold text-lg">
          {getStatusText(fileDetails.status)}
        </p>
      </div>
    </div>
    
    {/* 🔥 Queue Position Card - แสดงเฉพาะเมื่อ status = queued */}
    {fileDetails.status === 'queued' && fileDetails.queuePosition && (
      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-lg p-3">
        <p className="text-sm text-gray-500 mb-1">ลำดับในคิว</p>
        <p className="text-2xl font-bold text-yellow-700">
          #{fileDetails.queuePosition}
        </p>
      </div>
    )}

    {/* ⭐ Execution ID Card - แสดงถ้ามี executionId */}
    {fileDetails.executionId && (
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-300 rounded-lg p-3">
        <p className="text-xs font-semibold text-gray-600 mb-1.5">Execution ID</p>
        <p className="text-sm font-mono text-indigo-700 break-all">
          {fileDetails.executionId}
        </p>
      </div>
    )}
  </div>

          ) : (
            
            // 🔥 ถ้าเป็นงานปกติ (AI): แสดงผลแบบเดิม
            <div className="grid grid-cols-2 gap-3">
              {/* Clips Progress Card */}
              <div className={`rounded-lg p-3 border-2 transition-all duration-300 ${
                isComplete 
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' 
                  : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300'
              }`}>
                <p className="text-xs font-semibold text-gray-600 mb-1.5">Clips Progress</p>

                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-xl font-semibold text-gray-600">{totalCreatedClips}</p>
                  <span className="text-sm text-gray-500">/</span>
                  <p className="text-base font-semibold text-gray-600">{totalClipsRequired}</p>
                </div>

                <div className="w-full h-2 bg-white rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isComplete 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Tokens Reserved Card */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-600 mb-1.5">Token Reserved</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-semibold text-gray-800">
                    {fileDetails.tokensReserved > 0 ? fileDetails.tokensReserved : "-"}
                  </p>
                </div>
                {fileDetails.tokensReserved > 0 && (
                  <p className="text-xs text-purple-600 font-medium mt-1.5">จองไว้แล้ว</p>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}