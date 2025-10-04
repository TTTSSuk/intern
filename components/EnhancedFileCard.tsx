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

  // แทนที่ส่วน useEffect ใน EnhancedFileCard.tsx

useEffect(() => {
  async function fetchFileDetails() {
    try {
      const res = await fetch(`/api/status-wf?id=${fileId}&t=${Date.now()}`)

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

      // 🔥 แก้ไข: นับทั้ง video clips และ finalVideo
      let createdClips = 0
      let hasFinalVideo = false
      
      if (data.clips && Array.isArray(data.clips)) {
        // นับทั้ง video clips และ finalVideo
          createdClips = data.clips.filter((clip: any) => clip.video || clip.finalVideo).length
        // นับจำนวน video clips (ไม่รวม finalVideo)
        // const videoClips = data.clips.filter((clip: any) => clip.video && !clip.finalVideo).length
        
        // console.log(`📊 Video clips: ${videoClips}, Final video: ${hasFinalVideo ? 1 : 0}, Total: ${createdClips}`)

        // // เช็คว่ามี finalVideo หรือไม่
        // hasFinalVideo = data.clips.some((clip: any) => clip.finalVideo)
        
        // // รวม video clips + finalVideo (ถ้ามี)
        // createdClips = videoClips + (hasFinalVideo ? 1 : 0)
      }

      const details = {
        fileName: data.originalName || "ไม่พบชื่อไฟล์",
        totalClips: requiredClips,
        createdClips: createdClips, // ตอนนี้จะนับ finalVideo ด้วยแล้ว
        tokensReserved: data.tokensReserved || 0,
        status: data.status || "unknown",
        createdAt: data.createdAt || null,
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
        <div className="animate-pulse flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-48 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="flex gap-6">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !fileDetails) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-white text-2xl">⚠️</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-800 mb-1">ไม่สามารถโหลดข้อมูลไฟล์</h3>
            <p className="text-sm text-red-600">กรุณาลองใหม่อีกครั้ง</p>
          </div>
        </div>
      </div>
    )
  }

  // Add 1 for final video
  // ดึงจาก fileDetails state
const normalClips = fileDetails?.createdClips || 0
const totalCreatedClips = fileDetails?.createdClips || 0
// สมมติว่า final video อยู่จริงหรือไม่
// ถ้า API ไม่มีข้อมูล finalVideo, ต้องดึงจาก clips ที่ส่งมาใน onDataLoaded
const hasFinalVideo = fileDetails?.status === 'complete' // หรือเงื่อนไขที่เช็ค final video จริง ๆ

const totalClipsWithFinal = (fileDetails?.totalClips || 0) + 1
const progressPercent = totalClipsWithFinal > 0
  ? (totalCreatedClips / totalClipsWithFinal) * 100
  : 0
const isComplete = totalCreatedClips >= totalClipsWithFinal

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

        {/* Right: Stats Grid */}
        <div className="grid grid-cols-2 gap-3 flex-shrink-0">
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
      <p className="text-base font-semibold text-gray-600">{totalClipsWithFinal}</p>
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

      </div>
    </div>
  )
}