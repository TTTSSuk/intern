//pages\admin\dashboard.tsx

import { useEffect, useState } from "react";
import AdminLayout from "@/components/Layouts/AdminLayout";
import { AiOutlineUser, AiOutlineVideoCamera, AiOutlineUsergroupAdd } from "react-icons/ai";

interface Stats {
  totalUsers: number;
  onlineUsers: number;
  totalVideos: number;
  adminName?: string; // เพิ่มบรรทัดนี้
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    // ดึง AdminId จาก localStorage
    const loggedInAdmin = localStorage.getItem("loggedInAdmin");
    
    // เรียก API พร้อมส่ง adminId
    fetch(`/api/admin/stats?adminId=${loggedInAdmin}`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">ไม่สามารถโหลดข้อมูลได้</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Welcome Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-8 mb-6 text-white">
        <h2 className="text-3xl font-bold mb-2">
          ยินดีต้อนรับ {stats.adminName || "แอดมิน"} 👋
        </h2>
        <p className="text-blue-100">
          นี่คือภาพรวมของระบบ คุณสามารถจัดการผู้ใช้และตรวจสอบสถิติได้จากหน้านี้
        </p>
      </section>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">ผู้ใช้ทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-4">
              <AiOutlineUser size={32} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">ผู้ใช้งานออนไลน์</p>
              <p className="text-3xl font-bold text-gray-900">{stats.onlineUsers.toLocaleString()}</p>
            </div>
            <div className="bg-green-100 rounded-full p-4">
              <AiOutlineUsergroupAdd size={32} className="text-green-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            <span className="text-xs text-gray-500">ใช้งานอยู่ในขณะนี้</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">วิดีโอที่สร้างแล้ว</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalVideos.toLocaleString()}</p>
            </div>
            <div className="bg-purple-100 rounded-full p-4">
              <AiOutlineVideoCamera size={32} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}