"use client"
import { useState } from "react"
import { useRouter } from "next/router"
import { Lock, User, Eye, EyeOff } from "lucide-react"

export default function AdminLogin() {
  const router = useRouter()
  const [adminId, setAdminId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleAdminLogin = async (e: React.FormEvent | null = null) => {
    if (e) e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!adminId.trim()) {
      setError("กรุณากรอก Admin ID")
      setIsLoading(false)
      return
    }
    if (!password.trim()) {
      setError("กรุณากรอกรหัสผ่าน")
      setIsLoading(false)
      return
    }

    try {
      console.log("🔐 Attempting login with AdminId:", adminId); // Debug log

      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, password }),
      })

      const data = await res.json()
      console.log("📦 Login response:", data); // Debug log

      if (res.ok) {
        console.log("✅ Login successful!"); // Debug log
        console.log("💾 Saving AdminId to localStorage:", data.adminId); // Debug log
        
        localStorage.setItem("loggedInAdmin", data.adminId)
        
        // Verify it was saved
        const saved = localStorage.getItem("loggedInAdmin");
        console.log("🔍 Verify localStorage value:", saved); // Debug log
        
        if (saved === data.adminId) {
          console.log("✅ localStorage saved successfully"); // Debug log
        } else {
          console.error("❌ localStorage save failed!"); // Debug log
        }
        
        router.push("/admin/dashboard")
      } else {
        console.log("❌ Login failed:", data.message); // Debug log
        setError(data.message || "Admin ID หรือ Password ไม่ถูกต้อง")
      }
    } catch (err) {
      console.error("❌ Login error:", err)
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) handleAdminLogin()
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6 relative">
      {/* Decorative Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Admin Login Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-pink-500 p-6 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">เข้าสู่ระบบผู้ดูแล</h1>
            <p className="text-sm text-red-100">สำหรับผู้ดูแลระบบเท่านั้น</p>
          </div>

          {/* Form */}
          <form className="p-6 space-y-4" onSubmit={handleAdminLogin}>
            {/* Admin ID Input */}
            <div className="space-y-2">
              <label htmlFor="adminId" className="text-sm font-medium text-gray-700">
                Admin ID
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <input
                  id="adminId"
                  type="text"
                  placeholder="กรอก Admin ID"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50/50"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="กรอกรหัสผ่าน"
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50/50"
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

            {/* Error Message */}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-pink-500 text-white py-2.5 px-4 rounded-xl font-semibold text-base hover:shadow-xl focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
            >
              {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        </div>
      </div>

      {/* Background Animation Style */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -50px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(50px, 50px) scale(1.05);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}