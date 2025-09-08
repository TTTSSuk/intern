import { useState } from 'react';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent | null = null) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!userId.trim()) {
      setError('กรุณากรอก User ID');
      setIsLoading(false);
      return;
    }
    if (!password.trim()) {
      setError('กรุณากรอกรหัสผ่าน');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setError('');
        localStorage.setItem('loggedInUser', data.userId);
        localStorage.setItem('userName', data.name || '');
        router.push('/dashboard');
      } else {
        setError(data.message || 'User ID หรือ Password ไม่ถูกต้อง');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) handleLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">ยินดีต้อนรับ</h1>
            <p className="text-blue-100">กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</p>
          </div>

          <form className="p-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label htmlFor="userId" className="text-sm font-medium text-gray-700">
                User ID
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <input
                  id="userId"
                  type="text"
                  placeholder="กรอก User ID ของคุณ"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="กรอกรหัสผ่านของคุณ"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}




// import { useState } from 'react';
// import { useRouter } from 'next/router';

// export default function Login() {
//   const router = useRouter();
//   const [userId, setUserId] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();

//     try {
//       const res = await fetch('/api/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ userId, password }),
//       });

//       const data = await res.json(); // ✅ ดึง response ทั้งหมดก่อน

//       if (res.ok) {
//         setError('');
//         // ✅ เก็บ userId และชื่อจริง
//         localStorage.setItem('loggedInUser', data.userId);
//         localStorage.setItem('userName', data.name || '');

//         window.location.href = '/dashboard';
//         // router.push('/dashboard');
//       } else {
//         setError(data.message || 'User ID หรือ Password ไม่ถูกต้อง');
//       }
//     } catch (error) {
//       setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
//       console.error(error);
//     }
//   };

//   return (
//     <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }}>
//       <form onSubmit={handleLogin} style={{ backgroundColor: 'white', padding: 32, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxWidth: 400, width: '100%' }}>
//         <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' }}>User Login</h2>
//         <input
//           type="text"
//           placeholder="User ID"
//           style={{ width: '100%', padding: 12, borderRadius: 4, border: '1px solid #ccc', marginBottom: 16 }}
//           value={userId}
//           onChange={(e) => setUserId(e.target.value)}
//           required
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           style={{ width: '100%', padding: 12, borderRadius: 4, border: '1px solid #ccc', marginBottom: 24 }}
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//         />
//         {error && <p style={{ color: 'red', marginBottom: 16 }}>{error}</p>}
//         <button type="submit" style={{ width: '100%', padding: 12, backgroundColor: '#3b82f6', color: 'white', borderRadius: 4, cursor: 'pointer' }}>
//           Login
//         </button>
//       </form>
//     </div>
//   );
// }
