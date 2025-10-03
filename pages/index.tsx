"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Home() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden h-full flex items-center">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-16 py-8 w-full">
          <div className="text-center">
            {/* Logo/Brand */}
            <div
              className={`mb-0 transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"}`}
            >
              <img
                src="/images/logo.png"
                alt="MediaFlux Logo"
                className="h-16 sm:h-20 md:h-40 w-auto mx-auto object-contain"
              />
            </div>

            {/* Heading */}
            <h1
              className={`-mt-2 text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold text-gray-900 mb-3 transition-all duration-1000 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"}`}
            >
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                ระบบสร้างวิดีโออัตโนมัติ
              </span>
            </h1>

{/* Subheading */}
            <p
              className={`text-base sm:text-lg md:text-xl text-gray-600 mb-6 max-w-3xl mx-auto transition-all duration-1000 delay-400 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"}`}
            >
              แพลตฟอร์มที่ช่วยให้คุณจัดการไฟล์มีเดีย อัปโหลดเนื้อหา และสร้างวิดีโอได้อย่างง่ายดาย
            </p>

            {/* CTA Buttons */}
            <div
              className={`flex flex-col sm:flex-row gap-3 justify-center items-center transition-all duration-1000 delay-600 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"}`}
            >
              <button
                onClick={() => router.push("/login")}
                className="group relative px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-base shadow-lg hover:shadow-xl hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
              >
                <span className="relative z-10">เข้าสู่ระบบ</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>

          {/* Features Section */}
          <div
  className={`mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 px-8 transition-all duration-1000 delay-800 ${
    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
  }`}
>
            {/* Feature 1 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-indigo-100">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">อัปโหลดไฟล์ง่าย</h3>
              <p className="text-sm text-gray-600">อัปโหลดไฟล์มีเดียของคุณได้อย่างรวดเร็ว รองรับหลายรูปแบบไฟล์</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-purple-100">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">สร้างวิดีโออัตโนมัติ</h3>
              <p className="text-sm text-gray-600">สร้างวิดีโอจากไฟล์ของคุณด้วยระบบอัตโนมัติ</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-pink-100">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">จัดการไฟล์ง่าย</h3>
              <p className="text-sm text-gray-600">จัดการและเข้าถึงไฟล์ของคุณได้ทุกที่ทุกเวลา พร้อมระบบค้นหาที่ทรงพลัง</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
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
