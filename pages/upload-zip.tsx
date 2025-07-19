import { useState, useRef } from 'react';
import { useRouter } from 'next/router';

export default function UploadZip() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
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
    const file = e.dataTransfer.files?.[0];
    if (file && isZipFile(file)) {
      setSelectedFile(file);
      setMessage('');
    } else {
      setMessage('ไฟล์ต้องเป็น .zip เท่านั้น');
    }
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

  return (
    <div style={{ maxWidth: 600, margin: '60px auto', padding: 24, fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* ปุ่มกลับไปก่อนหน้า มุมซ้ายบน */}

      <h1 style={{ marginBottom: 24, textAlign: 'center' }}>อัปโหลด ZIP เพื่อสร้างวิดีโอ</h1>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: '2px dashed #3b82f6',
          padding: 40,
          textAlign: 'center',
          borderRadius: 12,
          cursor: 'pointer',
          background: '#f0f9ff',
        }}
      >
        {selectedFile ? (
          <p><strong>ไฟล์ที่เลือก:</strong> {selectedFile.name}</p>
        ) : (
          <p>ลากและวางไฟล์ ZIP ที่นี่ หรือคลิกเพื่อเลือกไฟล์</p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          onChange={handleFileChange}
          hidden
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={uploading}
        style={{
          marginTop: 24,
          width: '100%',
          padding: '14px',
          fontSize: 16,
          fontWeight: 600,
          backgroundColor: uploading ? '#93c5fd' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: uploading ? 'not-allowed' : 'pointer',
        }}
      >
        {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลด ZIP'}
      </button>

      {message && (
        <p style={{ marginTop: 16, color: message.startsWith('✅') ? 'green' : 'red', textAlign: 'center' }}>
          {message}
        </p>
      )}
    </div>
  );
}
