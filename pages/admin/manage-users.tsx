import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/Layouts/AdminLayout";
import { AiOutlineReload } from "react-icons/ai";

import {
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
  AiOutlineStop,
  AiOutlineCheck,
  AiOutlineUserSwitch,
  AiOutlineUser,
} from "react-icons/ai";

interface User {
  userId: string;
  name: string;
  isActive?: boolean;
  isSuspended?: boolean;
  lastActive?: string;
}

export default function ManageUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // เพิ่ม state สำหรับค้นหา

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const isUserOnline = (lastActive?: string) => {
    if (!lastActive) return false;
    const last = new Date(lastActive);
    const now = new Date();
    const diffMinutes = (now.getTime() - last.getTime()) / 60000;
    return diffMinutes <= 5;
  };

  function formatDateTime(date: Date): string {
  const datePart = date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  });
  const timePart = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return `${datePart} ${timePart}`;
}

  useEffect(() => {
    fetchUsers();
  }, []);

  // กรอง users ตามชื่อ
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
          <input
            type="text"
            placeholder="ค้นหาชื่อผู้ใช้..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={fetchUsers}
            disabled={loading}
            className={`inline-flex items-center px-4 py-2 rounded transition ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            <AiOutlineReload className="mr-2" size={20} />
              รีเฟรช
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-gray-500">กำลังโหลดข้อมูลผู้ใช้...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-center text-gray-500">
            ไม่พบข้อมูลผู้ใช้ที่ตรงกับการค้นหา
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 text-sm table-fixed">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-3 text-left w-1/4">ชื่อ</th>
                  <th className="p-3 text-left w-1/4">User ID</th>
                  <th className="p-3 text-center w-1/6">สถานะใช้งาน</th>
                  <th className="p-3 text-center w-1/6">สถานะระงับ</th>
                  <th className="p-3 text-center w-1/6">สถานะออนไลน์</th>
                  <th className="p-3 text-center w-1/6">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.userId}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="p-3">{user.name}</td>
                    <td className="p-3">{user.userId}</td>

                    <td className="p-3 text-center font-medium">
                      <div className="inline-flex items-center justify-center space-x-1">
                        {user.isActive ? (
                          <>
                            <AiOutlineCheckCircle
                              className="text-green-600"
                              size={20}
                            />
                            <span>เปิดใช้งาน</span>
                          </>
                        ) : (
                          <>
                            <AiOutlineCloseCircle
                              className="text-red-600"
                              size={20}
                            />
                            <span>ปิดใช้งาน</span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="p-3 text-center font-medium">
                      <div className="inline-flex items-center justify-center space-x-1">
                        {user.isSuspended ? (
                          <>
                            <AiOutlineStop
                              className="text-red-600"
                              size={20}
                            />
                            <span>ระงับบัญชี</span>
                          </>
                        ) : (
                          <>
                            <AiOutlineCheck
                              className="text-green-600"
                              size={20}
                            />
                            <span>ปกติ</span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="p-3 text-center font-medium">
                      <div className="inline-flex items-center justify-center space-x-1">
                        {isUserOnline(user.lastActive) ? (
                          <>
                            <AiOutlineUserSwitch
                              className="text-green-600"
                              size={20}
                            />
                            <span>ออนไลน์</span>
                          </>
                        ) : (
                          <>
                            <AiOutlineUser
                              className="text-gray-400"
                              size={20}
                            />
                            <span>ออฟไลน์</span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <button
                        className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                        onClick={() => router.push(`/admin/user/${user.userId}`)}
                      >
                        จัดการ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
