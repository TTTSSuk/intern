// \pages\list-file.tsx

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface Folder {
  name: string;
  files: string[];
  subfolders?: Folder[];
}

interface ExtractedFile {
  _id: string;
  userId: string;
  originalName: string;
  extractPath: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  createdAt: string;
  folders?: Folder[];
}

export default function ListFile() {
  const router = useRouter();
  const [files, setFiles] = useState<ExtractedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('loggedInUser');
    if (!storedUserId) {
      setError('ไม่พบผู้ใช้งาน');
      setLoading(false);
      return;
    }

    const userId: string = storedUserId;

    async function fetchFiles() {
      try {
        const res = await fetch(`/api/list-files?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) throw new Error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        const data = await res.json();
        setFiles(data.files);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchFiles();
  }, []);

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleDelete = async (fileId: string) => {
    const confirmDelete = confirm('คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์นี้?');
    if (!confirmDelete) return;

    try {
      const res = await fetch('/api/delete-extracted-file', {
        method: 'PATCH', // ใช้ PATCH
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      });

      if (!res.ok) throw new Error('ลบไม่สำเร็จ');

      // อัปเดต UI
      setFiles((prev) => prev.filter((f) => f._id !== fileId));
    } catch (err) {
      alert(`เกิดข้อผิดพลาด: ${(err as Error).message}`);
    }
  };

  function FolderView({ folder, path }: { folder: Folder; path: string }) {
    const isOpen = openFolders.has(path);

    return (
      <div className="ml-5 mt-2">
        <div
          className="cursor-pointer font-semibold select-none flex items-center space-x-2 text-gray-700 hover:text-indigo-600"
          onClick={() => toggleFolder(path)}
        >
          <span className="text-lg">{isOpen ? '▼' : '▶'}</span>
          <span>โฟลเดอร์: {folder.name}</span>
        </div>

        {isOpen && (
          <div className="ml-6 mt-2">
            {folder.files && folder.files.length > 0 && 
            (
              <ul className="list-disc list-inside text-gray-600">
                {folder.files.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
            {folder.subfolders?.map((sub) => (
              <FolderView key={sub.name} folder={sub} path={`${path}/${sub.name}`} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (loading)
    return <p className="p-6 text-center text-lg text-gray-500">กำลังโหลดข้อมูลไฟล์ที่แตก...</p>;
  if (error)
    return (
      <p className="p-6 text-center text-lg text-red-600 font-semibold">
        เกิดข้อผิดพลาด: {error}
      </p>
    );
  if (files.length === 0)
    return (
      <p className="p-6 text-center text-lg text-gray-500 font-medium">
        ยังไม่มีไฟล์ที่แตกจาก ZIP
      </p>
    );

  return (
    <div className="max-w-5xl mx-auto my-10 p-6 font-sans">
      <table className="w-full border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        <thead className="bg-indigo-600 text-white">
          <tr>
            <th className="p-3"></th>
            <th className="p-3 text-left">ชื่อไฟล์ ZIP</th>
            <th className="p-3 text-left">สถานะ</th>
            <th className="p-3 text-left">แตกไฟล์เมื่อ</th>
            <th className="p-3 text-left max-w-xl">โครงสร้างไฟล์</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {files.map((file, idx) => (
            <tr
              key={file._id}
              className={`${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-indigo-50`}
            >
              <td className="p-3 text-center align-top">
                <input
                  type="radio"
                  name="selectedFile"
                  checked={selectedFileId === file._id}
                  onChange={() => setSelectedFileId(file._id)}
                  className="cursor-pointer"
                />
              </td>
              <td className="p-3 align-top text-gray-700 font-medium">{file.originalName}</td>
              <td className="p-3 align-top capitalize text-gray-600 font-semibold">{file.status}</td>
              <td className="p-3 align-top text-gray-600">{new Date(file.createdAt).toLocaleString()}</td>
              <td className="p-3 align-top max-w-xl text-gray-700">
                {file.folders && file.folders.length > 0 ? (
                  file.folders.map((folder) => (
                    <FolderView key={folder.name} folder={folder} path={folder.name || ''} />
                  ))
                ) : (
                  <p className="italic text-gray-400">ไม่มีไฟล์ในโฟลเดอร์</p>
                )}
              </td>
              <td className="p-3 text-center align-top">
                <button
                  onClick={() => handleDelete(file._id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-semibold transition"
                >
                  ลบ
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ปุ่ม Next */}
      <div className="mt-8 flex justify-end">
        {selectedFileId && (
  <button
    onClick={() => router.push(`/create-video?id=${selectedFileId}`)}
    className="px-5 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white font-semibold transition"
  >
    Next 
  </button>
        )}
      </div>
    </div>
  );
}
