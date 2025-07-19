import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password }),
      });

      const data = await res.json(); // ✅ ดึง response ทั้งหมดก่อน

      if (res.ok) {
        setError('');
        // ✅ เก็บ userId และชื่อจริง
        localStorage.setItem('loggedInUser', data.userId);
        localStorage.setItem('userName', data.name || '');

        window.location.href = '/dashboard';
        // router.push('/dashboard');
      } else {
        setError(data.message || 'User ID หรือ Password ไม่ถูกต้อง');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      console.error(error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }}>
      <form onSubmit={handleLogin} style={{ backgroundColor: 'white', padding: 32, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxWidth: 400, width: '100%' }}>
        <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' }}>User Login</h2>
        <input
          type="text"
          placeholder="User ID"
          style={{ width: '100%', padding: 12, borderRadius: 4, border: '1px solid #ccc', marginBottom: 16 }}
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          style={{ width: '100%', padding: 12, borderRadius: 4, border: '1px solid #ccc', marginBottom: 24 }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p style={{ color: 'red', marginBottom: 16 }}>{error}</p>}
        <button type="submit" style={{ width: '100%', padding: 12, backgroundColor: '#3b82f6', color: 'white', borderRadius: 4, cursor: 'pointer' }}>
          Login
        </button>
      </form>
    </div>
  );
}
