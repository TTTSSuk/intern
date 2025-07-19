import { useState } from 'react';
import { useRouter } from 'next/router';

export default function AdminLogin() {
  const router = useRouter();
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, password }),
      });

      if (res.ok) {
        localStorage.setItem('loggedInAdmin', adminId);
        router.push('/admin/dashboard');
      } else {
        const data = await res.json();
        setError(data.message || 'Admin ID หรือ Password ไม่ถูกต้อง');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleAdminLogin}
        className="bg-white shadow-md rounded-lg p-8 w-full max-w-md"
        noValidate
      >
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Admin Login</h2>

        <label htmlFor="adminId" className="block mb-1 font-medium text-gray-700">
          Admin ID
        </label>
        <input
          id="adminId"
          type="text"
          placeholder="กรอก Admin ID"
          className="w-full p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          value={adminId}
          onChange={(e) => setAdminId(e.target.value)}
          required
          autoComplete="username"
        />

        <label htmlFor="password" className="block mb-1 font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          placeholder="กรอก Password"
          className="w-full p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        {error && <p className="mb-4 text-red-600 font-medium">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded text-white font-semibold transition 
            ${loading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
        >
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
    </div>
  );
}
