//pages\admin\dashboard.tsx

import { useEffect, useState } from "react";
import AdminLayout from "@/components/Layouts/AdminLayout";
import { 
  AiOutlineUser, 
  AiOutlineVideoCamera, 
  AiOutlineUsergroupAdd,
  AiOutlineEye,
  AiOutlineUserAdd,
  AiOutlineCloudUpload,
  AiOutlineFileText,
  AiOutlineBell
} from "react-icons/ai";
import { BiTrendingUp, BiTrendingDown } from "react-icons/bi";

interface Stats {
  totalUsers: number;
  onlineUsers: number;
  totalVideos: number;
  totalViews: number;
  newUsersThisMonth: number;
  growthRate: number;
  adminName?: string;
  recentUsers?: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
  }>;
  popularVideos?: Array<{
    id: string;
    title: string;
    views: number;
    creator: string;
  }>;
  recentActivities?: Array<{
    id: string;
    action: string;
    user: string;
    timestamp: string;
  }>;
  pendingApprovals?: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    const loggedInAdmin = localStorage.getItem("loggedInAdmin");
    
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              ยินดีต้อนรับ {stats.adminName || "แอดมิน"} 👋
            </h2>
            <p className="text-blue-100">
              นี่คือภาพรวมของระบบ คุณสามารถจัดการผู้ใช้และตรวจสอบสถิติได้จากหน้านี้
            </p>
          </div>
          {stats.pendingApprovals && stats.pendingApprovals > 0 && (
            <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <AiOutlineBell size={20} />
              <span className="font-semibold">{stats.pendingApprovals} รออนุมัติ</span>
            </div>
          )}
        </div>
      </section>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">ผู้ใช้ทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-4">
              <AiOutlineUser size={32} className="text-blue-600" />
            </div>
          </div>
          {stats.growthRate !== undefined && (
            <div className="flex items-center text-sm">
              {stats.growthRate >= 0 ? (
                <>
                  <BiTrendingUp className="text-green-500 mr-1" />
                  <span className="text-green-500 font-medium">+{stats.growthRate}%</span>
                </>
              ) : (
                <>
                  <BiTrendingDown className="text-red-500 mr-1" />
                  <span className="text-red-500 font-medium">{stats.growthRate}%</span>
                </>
              )}
              <span className="text-gray-500 ml-1">จากเดือนที่แล้ว</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">ผู้ใช้งานออนไลน์</p>
              <p className="text-3xl font-bold text-gray-900">{stats.onlineUsers.toLocaleString()}</p>
            </div>
            <div className="bg-green-100 rounded-full p-4">
              <AiOutlineUsergroupAdd size={32} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">วิดีโอทั้งหมด</p>
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