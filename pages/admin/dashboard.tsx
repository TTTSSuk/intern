//pages\admin\dashboard.tsx

import { useEffect, useState } from "react";
import AdminLayout from "@/components/Layouts/AdminLayout";
import { AiOutlineUser, AiOutlineVideoCamera, AiOutlineUsergroupAdd } from "react-icons/ai";

interface Stats {
  totalUsers: number;
  onlineUsers: number;
  totalVideos: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  if (!stats) return <p>กำลังโหลดข้อมูล...</p>;

  return (
    <AdminLayout>
      <section className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">ยินดีต้อนรับ, แอดมิน 👋</h2>
        <p className="text-gray-600">
          นี่คือภาพรวมของระบบ คุณสามารถจัดการผู้ใช้และตรวจสอบสถิติได้จากหน้านี้
        </p>
      </section>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 flex items-center space-x-4 hover:shadow-lg transition-shadow">
          <AiOutlineUser size={36} className="text-blue-500" />
          <div>
            <p className="text-2xl font-semibold">{stats.totalUsers}</p>
            <p className="text-gray-500">ผู้ใช้ทั้งหมด</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 flex items-center space-x-4 hover:shadow-lg transition-shadow">
          <AiOutlineUsergroupAdd size={36} className="text-green-500" />
          <div>
            <p className="text-2xl font-semibold">{stats.onlineUsers}</p>
            <p className="text-gray-500">ผู้ใช้งานออนไลน์</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 flex items-center space-x-4 hover:shadow-lg transition-shadow">
          <AiOutlineVideoCamera size={36} className="text-purple-500" />
          <div>
            <p className="text-2xl font-semibold">{stats.totalVideos}</p>
            <p className="text-gray-500">วิดีโอที่สร้างแล้ว</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


// import { useEffect, useState } from "react";
// import { useRouter } from "next/router";
// import AdminLayout from "@/components/Layouts/AdminLayout";

// export default function AdminDashboard() {
//   const [adminId, setAdminId] = useState("");
//   const router = useRouter();

//   useEffect(() => {
//     const loggedInAdmin = localStorage.getItem("loggedInAdmin");
//     if (!loggedInAdmin) {
//       router.push("/admin/login");
//     } else {
//       setAdminId(loggedInAdmin);
//     }
//   }, [router]);

//   return (
//     <AdminLayout>
//       <section className="bg-white p-6 rounded shadow">
//         <h2 className="text-2xl font-semibold mb-4">ยินดีต้อนรับ, แอดมิน 👋</h2>
//         <p className="text-gray-700">
//           ใช้เมนูด้านซ้ายเพื่อจัดการระบบผู้ใช้ เช่น เพิ่มผู้ใช้ ดูข้อมูล ตั้งค่าระบบ เป็นต้น
//         </p>
//       </section>
//     </AdminLayout>
//   );
// }
