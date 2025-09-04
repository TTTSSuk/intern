import { useState, useRef } from 'react';
import { useRouter } from 'next/router';

export default function UploadZip() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const isZipFile = (file: File) => file.name.toLowerCase().endsWith('.zip');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!isZipFile(file)) {
        setMessage('ไฟล์ต้องเป็น .zip เท่านั้น');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setMessage('');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && isZipFile(file)) {
      setSelectedFile(file);
      setMessage('');
    } else {
      setMessage('ไฟล์ต้องเป็น .zip เท่านั้น');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return setMessage('กรุณาเลือกไฟล์ ZIP ก่อน');
    if (!isZipFile(selectedFile)) return setMessage('ไฟล์ต้องเป็น .zip เท่านั้น');

    setUploading(true);
    const formData = new FormData();
    formData.append('zipfile', selectedFile);

    const userId = localStorage.getItem('loggedInUser');
    if (userId) {
      formData.append('userId', userId);
    }

    try {
      const res = await fetch('/api/upload-zip', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'อัปโหลดล้มเหลว');
      setMessage(`✅ สำเร็จ: ${data.message}`);
      setSelectedFile(null);
      router.push('/list-file');
    } catch (err) {
      setMessage(`❌ ผิดพลาด: ${(err as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeFile = () => {
    setSelectedFile(null);
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            {/* <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
              <span className="text-3xl text-white">📁</span>
            </div> */}
            <h1 className="text-4xl font-bold text-gray-800 mb-4">อัปโหลด ZIP ไฟล์</h1>
            <p className="text-lg text-gray-600">อัปโหลดไฟล์ ZIP ของคุณเพื่อเริ่มสร้างวิดีโอ</p>
          </div>

          {/* Upload Area */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50 scale-105'
                  : selectedFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <span className="text-2xl text-green-600">✓</span>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-gray-800 mb-2">ไฟล์ที่เลือก</p>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">🗜️</div>
                          <div className="text-left">
                            <p className="font-medium text-gray-800">{selectedFile.name}</p>
                            <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile();
                          }}
                          className="p-2 hover:bg-red-100 rounded-full transition-colors"
                        >
                          <span className="text-red-500 text-xl">×</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <span className="text-2xl text-blue-600">⬆</span>
                  </div> */}
                  <div>
                    <p className="text-xl font-semibold text-gray-800 mb-2">
                      {isDragOver ? 'วางไฟล์ที่นี่' : 'ลากและวางไฟล์ ZIP'}
                    </p>
                    <p className="text-gray-500 mb-4">หรือคลิกเพื่อเลือกไฟล์</p>
                    <div className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-xl font-medium shadow-md hover:bg-blue-600 transition-colors">
                      {/* <span className="mr-2">📁</span> */}
                      เลือกไฟล์ ZIP
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div className="mt-8">
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg ${
                  uploading || !selectedFile
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white hover:shadow-xl transform hover:-translate-y-1'
                }`}
              >
                {uploading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>กำลังอัปโหลด...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    {/* <span>🚀</span> */}
                    <span>อัปโหลด ZIP</span>
                  </div>
                )}
              </button>
            </div>

            {/* Message */}
            {message && (
              <div className={`mt-6 p-4 rounded-xl text-center font-medium ${
                message.startsWith('✅')
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl text-blue-600">📦</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">ไฟล์ ZIP</h3>
                <p className="text-sm text-gray-600">รองรับเฉพาะไฟล์ .zip เท่านั้น</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl text-green-600">⚡</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">รวดเร็ว</h3>
                <p className="text-sm text-gray-600">อัปโหลดและประมวลผลอย่างรวดเร็ว</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl text-purple-600">🎬</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">สร้างวิดีโอ</h3>
                <p className="text-sm text-gray-600">แปลงไฟล์เป็นวิดีโอโดยอัตโนมัติ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}