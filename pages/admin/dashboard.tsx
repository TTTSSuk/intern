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
  onlineUsersList?: Array<{
    id: string;
    name: string;
    email: string;
    lastActive: string;
  }>;
  recentUsers?: Array<{
    id: string;
    name: string;
    email: string;
    lastActive: string;
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-6">
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
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            <span className="text-xs text-gray-500">ใช้งานอยู่ในขณะนี้</span>
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
          <div className="text-xs text-gray-500">
            {stats.newUsersThisMonth || 0} วิดีโอใหม่เดือนนี้
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Online Users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">ผู้ใช้ที่ออนไลน์ตอนนี้</h3>
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              {stats.onlineUsers} คน
            </span>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stats.onlineUsers && stats.onlineUsers > 0 ? (
              stats.onlineUsersList && stats.onlineUsersList.length > 0 ? (
                stats.onlineUsersList.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-600 font-medium">
                      ออนไลน์
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">ไม่มีข้อมูลผู้ใช้</p>
              )
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AiOutlineUsergroupAdd size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500">ไม่มีผู้ใช้ออนไลน์ในขณะนี้</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Active Users (Last 24 hours) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">ผู้ใช้ที่ใช้งานภายใน 24 ชั่วโมง</h3>
            <span className="text-sm text-gray-600">
              {stats.recentUsers?.length || 0} คน
            </span>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stats.recentUsers && stats.recentUsers.length > 0 ? (
              stats.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(user.lastActive).toLocaleDateString('th-TH', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AiOutlineUser size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500">ไม่มีผู้ใช้ที่ใช้งานภายใน 24 ชั่วโมง</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}