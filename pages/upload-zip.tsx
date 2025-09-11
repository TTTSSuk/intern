// pages/upload-zip.tsx
import StepProgress from '../components/Layouts/StepProgress';
import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useStep } from '@/context/StepContext';


export default function UploadZip() {
  const { currentStep, setCurrentStep } = useStep();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const steps = ['อัปโหลดไฟล์', 'รายการไฟล์', 'สร้างวิดีโอ'];

  const isZipFile = (file: File) => file.name.toLowerCase().endsWith('.zip');

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setMessage('');
      return;
    }
    if (!isZipFile(file)) {
      setMessage('ไฟล์ต้องเป็น .zip เท่านั้น');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setMessage('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0] || null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files?.[0] || null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleUpload = async () => {
    if (!selectedFile) return setMessage('กรุณาเลือกไฟล์ ZIP ก่อน');

    setUploading(true);
    const formData = new FormData();
    formData.append('zipfile', selectedFile);

    const userId = localStorage.getItem('loggedInUser');
    if (userId) formData.append('userId', userId);

    try {
      const res = await fetch('/api/upload-zip', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'อัปโหลดล้มเหลว');

      setMessage(`✅ สำเร็จ: ${data.message}`);
      setSelectedFile(null);
      setCurrentStep(2); // ไปขั้นตอนถัดไป
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
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
  {/* Step Progress */}
  <StepProgress
  steps={steps}
  currentStep={currentStep}
  canGoNext={false}
  showHomeButton={true} // ให้โชว์ Home
/>

  {/* Home / Back Buttons
  <div className="mt-4 flex justify-start px-4">
  <button
    onClick={() => router.push('/dashboard')}
    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
  >
    Home
  </button>
</div> */}

    <div className="min-h-screen">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
        {/* <div className="relative z-10 container mx-auto px-4 py-8"> */}
        {/* <div className="min-h-screen"> */}
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">อัปโหลด ZIP ไฟล์</h1>
            <p className="text-lg text-gray-600">อัปโหลดไฟล์ ZIP ของคุณเพื่อเริ่มสร้างวิดีโอ</p>
          {/* </div> */}

          {/* Upload Area */}
          {/* <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
              isDragOver ? 'border-blue-500 bg-blue-50 scale-105'
                : selectedFile ? 'border-green-400 bg-green-50'
                : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
            }`}
          > */}
          <div
  onClick={() => fileInputRef.current?.click()}
  onDrop={handleDrop}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  className={`relative border-3 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 max-w-md mx-auto ${
    isDragOver ? 'border-blue-500 bg-blue-50 scale-105'
      : selectedFile ? 'border-green-400 bg-green-50'
      : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
  }`}
>

            <input ref={fileInputRef} type="file" accept=".zip" onChange={handleFileChange} className="hidden" />

            {selectedFile ? (
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <span className="text-2xl text-green-600">✓</span>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🗜️</div>
                    <div className="text-left">
                      <p className="font-medium text-gray-800">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setMessage(''); }} className="p-2 hover:bg-red-100 rounded-full">
                    <span className="text-red-500 text-xl">×</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xl font-semibold text-gray-800 mb-2">
                  {isDragOver ? 'วางไฟล์ที่นี่' : 'ลากและวางไฟล์ ZIP หรือคลิกเพื่อเลือกไฟล์'}
                </p>
              </div>
            )}
          </div>

          {/* Upload Button */}
          {/* Upload Button */}
<div className="flex justify-center mt-6">
  <button
    onClick={handleUpload}
    disabled={uploading || !selectedFile}
    className={`w-full max-w-md py-3 px-6 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg ${
      uploading || !selectedFile
        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white hover:shadow-xl transform hover:-translate-y-1'
    }`}
  >
    {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลด ZIP'}
  </button>
</div>
          {/* <button
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            className={`w-full mt-8 py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg ${
              uploading || !selectedFile
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white hover:shadow-xl transform hover:-translate-y-1'
            }`}
          >
            {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลด ZIP'}
          </button> */}

          {/* Message */}
          {message && (
            <div className={`mt-6 p-4 rounded-xl text-center font-medium ${
              message.startsWith('✅') ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
