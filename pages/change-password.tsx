import { useState } from 'react';
import { AiOutlineArrowLeft } from "react-icons/ai";
import { useRouter } from "next/router";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState<boolean | null>(null);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage('รหัสผ่านใหม่กับยืนยันรหัสผ่านไม่ตรงกัน');
      setSuccess(false);
      return;
    }

    const userId = localStorage.getItem('loggedInUser') || '';

    if (!userId) {
      setMessage('กรุณาล็อกอินก่อนเปลี่ยนรหัสผ่าน');
      setSuccess(false);
      return;
    }

    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('เปลี่ยนรหัสผ่านสำเร็จ');
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage(data.message || 'เกิดข้อผิดพลาด');
        setSuccess(false);
      }
    } catch (error) {
      setMessage('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      setSuccess(false);
      console.error(error);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', padding: 20, backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 0 8px rgba(0,0,0,0.1)' }}>
      <div className="flex items-center space-x-4 mb-6">
  <button
    onClick={() => router.back()}
    aria-label="ย้อนกลับ"
    className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800"
  >
    <AiOutlineArrowLeft size={20} />
  </button>

  <h2 className="text-2xl font-semibold">เปลี่ยนรหัสผ่าน</h2>
</div>
      <form onSubmit={handleSubmit}>
        <label>
          รหัสผ่านปัจจุบัน:
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginTop: 6, marginBottom: 16, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </label>
        <label>
          รหัสผ่านใหม่:
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginTop: 6, marginBottom: 16, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </label>
        <label>
          ยืนยันรหัสผ่านใหม่:
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginTop: 6, marginBottom: 16, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </label>

        {message && (
          <p style={{ color: success ? 'green' : 'red', marginBottom: 16 }}>
            {message}
          </p>
        )}

        <button
          type="submit"
          style={{ width: '100%', padding: 12, backgroundColor: '#3b82f6', color: '#fff', borderRadius: 4, cursor: 'pointer' }}
        >
          เปลี่ยนรหัสผ่าน
        </button>
      </form>
    </div>
  );
}
