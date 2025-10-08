import type React from "react"
import StepProgress from "../components/Layouts/StepProgress"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useStep } from "@/context/StepContext"
import { UploadCloud, Info, FileQuestion } from "lucide-react"

interface ValidationError {
  folderName: string;
  errors: string[];
}

export default function UploadZip() {
  const { currentStep, setCurrentStep } = useStep()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)

  // สำหรับ popup
  const [showPopup, setShowPopup] = useState(false)
  const [popupView, setPopupView] = useState<'tips' | 'structure'>('tips')

  // สำหรับ validation errors
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const steps = ["อัปโหลดไฟล์", "รายการไฟล์", "สร้างวิดีโอ"]

  const isZipFile = (file: File) => file.name.toLowerCase().endsWith(".zip")

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setSelectedFile(null)
      setMessage("")
      return
    }
    if (!isZipFile(file)) {
      setMessage("ไฟล์ต้องเป็น .zip เท่านั้น")
      setSelectedFile(null)
      return
    }
    setSelectedFile(file)
    setMessage("")
    setValidationErrors([]) // Clear previous errors
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0] || null)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files?.[0] || null)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleUpload = async () => {
    if (!selectedFile) return setMessage("กรุณาเลือกไฟล์ ZIP ก่อน")

    setUploading(true)
    setValidationErrors([]) // Clear previous errors
    
    const formData = new FormData()
    formData.append("zipfile", selectedFile)

    const userId = localStorage.getItem("loggedInUser")
    if (userId) formData.append("userId", userId)

    try {
      const res = await fetch("/api/upload-zip", { method: "POST", body: formData })
      const data = await res.json()
      
      // ถ้า status 400 แสดงว่ามี validation errors
      if (res.status === 400 && data.validationErrors) {
        setValidationErrors(data.validationErrors)
        setMessage(`❌ ${data.message}`)
        return
      }
      
      if (!res.ok) throw new Error(data.message || "อัปโหลดล้มเหลว")

      setMessage(`✅ สำเร็จ: ${data.message}`)
      setSelectedFile(null)
      setCurrentStep(2)
      router.push("/list-file")
    } catch (err) {
      setMessage(`❌ ผิดพลาด: ${(err as Error).message}`)
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const openPopup = (view: 'tips' | 'structure') => {
    setPopupView(view)
    setShowPopup(true)
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <StepProgress steps={steps} currentStep={currentStep} canGoNext={false} showHomeButton={true} />

        {/* Header */}
        <div className="text-center my-6">
          <p className="text-2xl text-gray-800 font-bold">อัปโหลดไฟล์ ZIP เพื่อสร้างวิดีโอ</p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Left Side - Compact Info */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 p-4">
              
              {/* Header Card */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📦</span>
                  <div>
                    <p className="font-bold text-lg">โครงสร้างไฟล์</p>
                    <p className="text-sm text-blue-100">ไฟล์ ZIP ต้องมีโฟลเดอร์ย่อยตามเงื่อนไข</p>
                  </div>
                </div>
              </div>

              {/* Requirements Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Main Folder */}
                <div className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">1️⃣</span>
                    <h3 className="font-bold text-gray-900 text-base">โฟลเดอร์หลัก</h3>
                  </div>
                  <code className="text-sm bg-gray-100 px-3 py-1.5 rounded text-blue-600 block">folderName.zip</code>
                </div>

                {/* Sub Folder */}
                <div className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">2️⃣</span>
                    <h3 className="font-bold text-gray-900 text-base">โฟลเดอร์ย่อย</h3>
                  </div>
                  <p className="text-sm text-red-500 font-medium">*เรียงตามลำดับวิดีโอ</p>
                </div>
              </div>

              {/* Required Files */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <p className="text-base font-bold text-blue-900">ไฟล์ที่ต้องมีในแต่ละโฟลเดอร์:</p>
                  {/* Tips Button - Moved to top right */}
                  <button
                    onClick={() => openPopup('tips')}
                    className="flex items-center gap-2 bg-amber-500 text-white rounded-lg px-3 py-2 hover:bg-amber-600 transition-all shadow-md hover:shadow-lg flex-shrink-0"
                  >
                    <Info className="w-4 h-4" />
                    {/* <span className="font-semibold text-sm">คำแนะนำ</span> */}
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-base text-gray-700">
                    <span className="text-2xl">🖼️</span>
                    <span><strong>รูปภาพ:</strong> .jpg, .png, .jpeg</span>
                  </div>
                  <div className="flex items-center gap-3 text-base text-gray-700">
                    <span className="text-2xl">📄</span>
                    <span><strong>prompt.txt</strong> <span className="text-red-500 font-semibold">*บังคับ</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-base text-gray-700">
                    <span className="text-2xl">🎙️</span>
                    <span><strong>voice.txt</strong> <span className="text-red-500 font-semibold">*บังคับ</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Upload Area */}
            <div className="space-y-4 flex flex-col">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative p-10 border-3 border-dashed rounded-2xl text-center cursor-pointer transition-all duration-300 bg-white shadow-xl flex-1 flex items-center justify-center min-h-[400px] ${
                  isDragOver
                    ? "border-blue-600 bg-blue-50 scale-[1.02]"
                    : selectedFile
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                }`}
              >
                <input ref={fileInputRef} type="file" accept=".zip" onChange={handleFileChange} className="hidden" />

                {selectedFile ? (
                  <div className="space-y-4 w-full">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                      <span className="text-2xl text-blue-600">✓</span>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <UploadCloud className="w-7 h-7 text-blue-600" />
                        <div className="text-left">
                          <p className="font-semibold text-gray-900 text-sm">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedFile(null)
                          setMessage("")
                          setValidationErrors([])
                        }}
                        className="p-2 hover:bg-red-100 rounded-full transition-colors"
                      >
                        <span className="text-red-500 text-lg">×</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <UploadCloud className="w-14 h-14 mx-auto text-gray-400" />
                    <p className="text-lg font-bold text-gray-900">
                      {isDragOver ? "วางไฟล์ที่นี่" : "ลากและวางไฟล์ ZIP หรือคลิกเพื่อเลือกไฟล์"}
                    </p>
                    <p className="text-sm text-gray-500">รองรับเฉพาะไฟล์ .zip เท่านั้น</p>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className={`w-full py-4 px-6 rounded-xl font-bold text-base transition-all duration-300 shadow-lg ${
                  uploading || !selectedFile
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white hover:shadow-xl transform hover:-translate-y-0.5"
                }`}
              >
                {uploading ? "กำลังอัปโหลด..." : "อัปโหลด ZIP"}
              </button>

              {/* Message */}
              {message && (
                <div
                  className={`p-4 rounded-xl text-center font-medium text-sm ${
                    message.startsWith("✅")
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-red-100 text-red-800 border border-red-200"
                  }`}
                >
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tips/Structure Popup */}
      {showPopup && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 p-4"
          style={{ overflow: 'hidden' }}
        >
          <div className="bg-white border-2 border-purple-200 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] shadow-2xl flex flex-col">
            {/* Header with Tabs */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  {popupView === 'tips' ? <Info className="w-6 h-6 text-white" /> : <FileQuestion className="w-6 h-6 text-white" />}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPopupView('tips')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                      popupView === 'tips'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    คำแนะนำ
                  </button>
                  <button
                    onClick={() => setPopupView('structure')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                      popupView === 'structure'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    โครงสร้างไฟล์
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="text-gray-500 text-xl">×</span>
              </button>
            </div>

            {/* Content */}
            <div 
              className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-purple-400"
            >
              {popupView === 'tips' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4"> 
                {/* โฟลเดอร์ */}
  <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-lg">
    <h3 className="font-bold text-amber-900 text-sm mb-2 flex items-center gap-1.5">
      <span>📁</span>
      ชื่อโฟลเดอร์
    </h3>
    <ul className="text-xs text-amber-800 space-y-0.5 ml-5 list-disc">
       <li>เรียงลำดับตามวิดีโอ</li>
       <li>แนะนำ scene-001, scene-002</li>
       <li>ใช้ตัวเลขเพื่อเรียงง่าย</li>
    </ul>
  </div>
  
  {/* รูปภาพ */}
  <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-lg">
    <h3 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-1.5">
      <span>🖼️</span>
      รูปภาพ
    </h3>
    <ul className="text-xs text-blue-800 space-y-0.5 ml-5 list-disc">
      <li>รองรับ JPG, PNG, JPEG</li>
      <li>ตั้งชื่อได้ตามต้องการ</li>
      <li>แนะนำความละเอียด 1920x1080</li>
      <li>ขนาดไฟล์ไม่เกิน 5MB</li>
    </ul>
  </div>

  {/* prompt.txt */}
  <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-lg">
    <h3 className="font-bold text-green-900 text-sm mb-2 flex items-center gap-1.5">
      <span>📝</span>
      prompt.txt
    </h3>
    <ul className="text-xs text-green-800 space-y-0.5 ml-5 list-disc">
      <li>ชื่อต้องเป็น prompt.txt</li>
      <li>เขียนเป็นภาษาไทย</li>
      <li>บรรยายลักษณะวิดีโอ</li>
      <li>ยิ่งละเอียดยิ่งดี</li>
    </ul>
  </div>

  {/* voice.txt */}
  <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded-lg">
    <h3 className="font-bold text-purple-900 text-sm mb-2 flex items-center gap-1.5">
      <span>🎙️</span>
      voice.txt
    </h3>
    <ul className="text-xs text-purple-800 space-y-0.5 ml-5 list-disc">
      <li>เขียนเป็นภาษาไทย</li>
      <li>ความยาว 7-8 วินาที (50-70 คำ)</li>
      <li>เนื้อหาบรรยายวิดีโอ</li>
    </ul>
  </div>

 
</div>
              ) : (
                <pre className="bg-gray-900 text-green-400 p-4 text-sm font-mono leading-relaxed rounded-lg">
{`folderName.zip
│
├── scene-001/
│   ├── image.jpg         ← รูปภาพใดก็ได้
│   ├── prompt.txt        ← คำบรรยายลักษณะวิดีโอ
│   └── voice.txt         ← เนื้อหาการบรรยาย
│
├── scene-002/
│   ├── photo.png         ← รูปภาพใดก็ได้
│   ├── prompt.txt        ← คำบรรยายลักษณะวิดีโอ
│   └── voice.txt         ← เนื้อหาการบรรยาย
│
├── scene-003/
    ├── picture.jpeg      ← รูปภาพใดก็ได้
    ├── prompt.txt        ← คำบรรยายลักษณะวิดีโอ
    └── voice.txt         ← เนื้อหาการบรรยาย`}
                </pre>
              )}
            </div>

            {/* Close Button */}
            {/* <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowPopup(false)}
                className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200 font-medium"
              >
                ปิด
              </button>
            </div> */}
          </div>
        </div>
      )}

      {/* Validation Errors Popup */}
      {validationErrors.length > 0 && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 p-4">
          <div className="bg-white border-2 border-red-200 rounded-2xl p-6 max-w-lg w-full max-h-[70vh] shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-2xl">⚠️</span>
              </div>
              <div>
                <h3 className="font-semibold text-red-800 text-lg">เกิดข้อผิดพลาด</h3>
                <p className="text-red-600 text-sm mt-1">
                  กรุณาแก้ไขโฟลเดอร์ให้ถูกต้องก่อนอัปโหลดใหม่
                </p>
              </div>
            </div>
            
            {/* Correct Structure Info */}
            <div className="bg-blue-50 border-l-2 border-blue-400 p-3 rounded mb-4">
              <p className="text-xs font-semibold text-blue-800 mb-1">
                โครงสร้างที่ถูกต้องต่อ 1 โฟลเดอร์:
              </p>
              <ul className="text-xs text-blue-700 space-y-0.5 ml-3">
                <li>- ต้องมีไฟล์ <code className="bg-blue-100 px-1 rounded">prompt.txt</code></li>
                <li>- ต้องมีไฟล์ <code className="bg-blue-100 px-1 rounded">voice.txt</code></li>
                <li>- ต้องมีไฟล์รูปภาพ <code className="bg-blue-100 px-1 rounded">(.png, .jpg, .jpeg)</code></li>
              </ul>
            </div>
            
            {/* Validation Errors - with Tailwind scrollbar */}
            <div className="bg-red-50 rounded-lg p-2 overflow-y-auto max-h-40 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-red-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-red-400">
  <h3 className="font-semibold text-red-800 text-sm mb-1.5">พบข้อผิดพลาด:</h3>
  <div className="grid grid-cols-2 gap-1.5">
    {validationErrors.map((error, index) => (
      <div key={index} className="bg-white rounded p-1.5 border border-red-200">
        <p className="font-medium text-slate-800 text-sm mb-0.5 truncate" title={error.folderName}>
          📁 {error.folderName}
        </p>
        <ul className="text-xs text-red-600 ml-4 space-y-0">
          {error.errors.map((err, idx) => (
            <li key={idx} className="truncate" title={err}>• {err}</li>
          ))}
        </ul>
      </div>
    ))}
  </div>
</div>
            
            {/* Close Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setValidationErrors([])
                  setMessage("")
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm font-medium"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}