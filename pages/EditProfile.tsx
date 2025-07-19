import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AiOutlineArrowLeft } from "react-icons/ai";

interface UserProfile {
  userId: string;
  name: string;
  avatarUrl?: string;
}

export default function EditProfile() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile>({
    userId: '',
    name: '',
    avatarUrl: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // โหลดข้อมูลจาก localStorage เมื่อหน้าโหลด
  useEffect(() => {
    const userId = localStorage.getItem('loggedInUser') || '';
    const name = localStorage.getItem('userName') || '';
    const avatarUrl = localStorage.getItem('avatarUrl') || '';
    setProfile({ userId, name, avatarUrl });
  }, []);

  // สร้าง URL สำหรับ preview รูปที่เลือก
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    const router = useRouter();

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  // เมื่อเลือกไฟล์รูป
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // เมื่อเปลี่ยนชื่อ
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, name: e.target.value });
  };

  // ส่งข้อมูลไป API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('userId', profile.userId);
    formData.append('name', profile.name);
    if (selectedFile) {
      formData.append('avatar', selectedFile);
    }

    try {
      const res = await fetch('/api/users/update', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('userName', profile.name);
        if (data.avatarUrl) {
          localStorage.setItem('avatarUrl', data.avatarUrl);
        }
        alert('บันทึกข้อมูลเรียบร้อยแล้ว');
        router.push('/dashboard');
      } else {
        alert(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error(error);
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-md shadow-md">
      <div className="flex items-center space-x-4 mb-6">
  <button
    onClick={() => router.back()}
    aria-label="ย้อนกลับ"
    className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800"
  >
    <AiOutlineArrowLeft size={20} />
  </button>

  <h2 className="text-2xl font-semibold">แก้ไขโปรไฟล์</h2>
</div>
      <form onSubmit={handleSubmit}>
        <label className="block mb-4">
          User ID:
          <input
            type="text"
            value={profile.userId}
            readOnly
            className="w-full mt-1 p-2 bg-gray-100 rounded border border-gray-300"
          />
        </label>

        <label className="block mb-4">
          ชื่อ:
          <input
            type="text"
            value={profile.name}
            onChange={handleNameChange}
            required
            className="w-full mt-1 p-2 border border-gray-300 rounded"
          />
        </label>

        {/* <label className="block mb-4">
          รูปโปรไฟล์:
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block mt-1"
          />
        </label> */}

        {/* {(previewUrl || profile.avatarUrl) && (
          <div className="mb-6">
            <img
              src={previewUrl || profile.avatarUrl}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-full mx-auto"
            />
          </div>
        )} */}

       <div className="flex space-x-4">
  <button
    type="button"
    onClick={() => router.back()}
    className="flex-[1] bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded transition"
  >
    ยกเลิก
  </button>
  <button
    type="submit"
    disabled={!profile.name.trim()}
    className={`flex-[1] font-semibold py-2 rounded transition
      ${profile.name.trim()
        ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
        : "bg-indigo-300 text-white cursor-not-allowed"
      }
    `}
  >
    บันทึก
  </button>
</div>

      </form>
    </div>
  );
}
