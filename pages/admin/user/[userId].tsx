//pages\admin\user\[userId].tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/Layouts/AdminLayout";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

dayjs.extend(utc);
dayjs.extend(timezone);

interface TokenHistoryItem {
  date: string;
  change: number;
  reason: string;
}

interface UploadedFile {
  _id: string;
  originalName: string;
  status: string;
  createdAt: string;
   folders?: {
    subfolders?: any[];
    length?: number;
  };

  clips?: {
    video?: string;
    finalVideo?: boolean;
  }[];
}

interface User {
  userId: string;
  name: string;
  avatarUrl?: string;
  isActive: boolean;
  isSuspended: boolean;
  suspensionReason: string;
  tokens: number;
  lastActive: string;
  tokenHistory: TokenHistoryItem[];
  uploadedFiles: UploadedFile[];
  tokenBalance?: number;
  totalVideos?: number;
  totalTokensUsed?: number;
}

export default function UserDetailPage() {
  const router = useRouter();
  const { userId } = router.query;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // State สำหรับแก้ไข
  const [isActive, setIsActive] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspendChecked, setSuspendChecked] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [tokensToAdd, setTokensToAdd] = useState(0);

  // State แท็บที่ active (0-3)
  const [activeTab, setActiveTab] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

// คำนวณไฟล์ที่จะโชว์ในหน้านี้
  const pagedFiles = user?.uploadedFiles?.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
) || [];

// จำนวนหน้าทั้งหมด
  const totalPages = Math.ceil((user?.uploadedFiles?.length || 0) / itemsPerPage);

  const isUserOnline = (lastActive?: string) => {
  if (!lastActive) return false;
  const last = new Date(lastActive);
  const now = new Date();
  const diffMinutes = (now.getTime() - last.getTime()) / 60000;
  return diffMinutes <= 5;
};

function formatDateTime(date: Date): string {
  const datePart = date.toLocaleDateString('en-US', { 
   day: 'numeric',
   month: 'short',  
   year: 'numeric' 
  });
  const timePart = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second : '2-digit',
    hour12: false
  });
  return `${datePart} ${timePart}`;
}
  
  useEffect(() => {
    if (!userId) return;

    async function fetchUser() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/user?userId=${userId}`);
        const data = await res.json();
        
        if (data.success) {
          setUser(data.user);
          setIsActive(data.user.isActive);
          setIsSuspended(data.user.isSuspended);
          setSuspensionReason(data.user.suspensionReason || "");
          setSuspendChecked(data.user.isSuspended);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error(error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

// แก้ type ของ parameter
const handleSave = async (data?: { 
  isSuspended?: boolean; 
  suspensionReason?: string; 
  tokens?: number;   // เพิ่ม tokens เข้าไป
}) => {
  if (!user) return;

  const newIsSuspended = data?.isSuspended ?? isSuspended;
  const newSuspensionReason = data?.suspensionReason ?? suspensionReason;
  const newTokens = data?.tokens;

  const updateFields: any = {};
  updateFields.isSuspended = newIsSuspended;
  updateFields.suspensionReason = newSuspensionReason;
  if (typeof newTokens === "number") {
    updateFields.tokens = newTokens;
  }

  try {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.userId,
        ...updateFields,
        isActive,  // อาจจะเอาไว้ด้วยถ้าอยากอัปเดตพร้อมกัน
      }),
    });
    const resData = await res.json();
    if (resData.success) {
      alert("บันทึกสำเร็จ");
      if (newTokens !== undefined) setTokensToAdd(0);
      setIsSuspended(newIsSuspended);
      setSuspensionReason(newSuspensionReason);
      setSuspendChecked(newIsSuspended);
      router.replace(router.asPath);
    } else {
      alert("เกิดข้อผิดพลาด: " + resData.message);
    }
  } catch (error) {
    alert("เกิดข้อผิดพลาดในการบันทึก");
  }
};

  if (loading)
    return (
      <AdminLayout>
        <p className="p-8 text-center text-gray-500">กำลังโหลด...</p>
      </AdminLayout>
    );
  if (!user)
    return (
      <AdminLayout>
        <p className="p-8 text-center text-red-500">ไม่พบผู้ใช้</p>
      </AdminLayout>
    );

  const tabLabels = [
    "ข้อมูลทั่วไป",
    "Token & ประวัติ",
    "การระงับบัญชี",  
    "ไฟล์ / วิดิโอที่อัปโหลด",
  ];

  return (
    <AdminLayout>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-300">
          <nav className="flex space-x-6 text-sm font-medium text-gray-600" aria-label="Tabs">
            {tabLabels.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`py-3 border-b-2 -mb-px ${
                  activeTab === index
                    ? "border-indigo-600 text-indigo-600 font-semibold"
                    : "border-transparent hover:text-indigo-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>


        {/* Tab 0: ข้อมูลทั่วไป */}
        {activeTab === 0 && (
  <section className="bg-white rounded-lg shadow-md p-6">
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* ซ้ายสุด: Avatar */}
      <div className="md:col-span-2 flex justify-center md:justify-start">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={`${user.name} avatar`}
            className="w-24 h-24 rounded-full object-cover border border-gray-300"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-3xl font-bold text-gray-600">
            {user.name.charAt(0)}
          </div>
        )}
      </div>

      {/* ตรงกลาง: ข้อมูลเนื้อหา */}
      <div className="md:col-span-5 space-y-3">
        <h1 className="text-2xl font-semibold text-gray-900">{user.name}</h1>
        <div className="space-y-2 text-sm">
          <p>
            <strong>User ID: </strong>
            <span>{user.userId}</span>
          </p>
          <p>
            <strong>สถานะออนไลน์: </strong>
            <span className={isUserOnline(user.lastActive) ? "text-green-600" : "text-gray-500"}>
              {isUserOnline(user.lastActive) ? "ออนไลน์" : "ออฟไลน์"}
            </span>
          </p>
          <p>
            <strong>สถานะใช้งาน: </strong>
            <span className={isActive ? "text-green-600" : "text-red-600"}>
              {isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
            </span>
          </p>
          <p>
            <strong>สถานะระงับ: </strong>
            <span className={isSuspended ? "text-red-600" : "text-green-600"}>
              {isSuspended ? `ระงับ (${suspensionReason || "-"})` : "ปกติ"}
            </span>
          </p>
          <p>
            <strong>เวลาล่าสุด: </strong>
            {user.lastActive ? formatDateTime(new Date(user.lastActive)) : "ไม่มีข้อมูล"}
          </p>
        </div>
      </div>

      {/* ขวาสุด: สถิติ */}
      <div className="md:col-span-5">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">สถิติการใช้งาน</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-blue-600">{user.tokenBalance?.toLocaleString() || 0}</p>
            <p className="text-xs text-gray-600 mt-1">Token คงเหลือ</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-purple-600">{user.totalVideos || 0}</p>
            <p className="text-xs text-gray-600 mt-1">วิดีโอที่สร้าง</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-green-600">{user.totalTokensUsed?.toLocaleString() || 0}</p>
            <p className="text-xs text-gray-600 mt-1">Token ที่ใช้ไป</p>
          </div>
        </div>
      </div>
    </div>
  </section>
        )}

        {/* Tab 1: Token & History */}
{activeTab === 1 && (
  <section className="bg-white rounded-xl shadow-lg p-6 max-w-5xl mx-auto">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* ฝั่งซ้าย: การจัดการ Token */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">จัดการ Token</h2>

        {/* Token ปัจจุบัน */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-12 -mt-12"></div>
          
          <div className="relative">
            <p className="text-white text-xs font-medium mb-1 uppercase tracking-wide opacity-75">
              จำนวน Token ปัจจุบัน
            </p>
            <div className="flex items-baseline space-x-2">
              <p className="text-white text-5xl font-bold">{user.tokens ?? 0}</p>
              <span className="text-white text-lg font-medium opacity-75">Token</span>
            </div>
          </div>
        </div>

        {/* เพิ่ม Token */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <label htmlFor="tokensToAdd" className="block text-sm font-semibold text-gray-700 mb-2">
            เพิ่ม Token
          </label>
          <div className="flex gap-2">
            <input
              id="tokensToAdd"
              type="number"
              min={0}
              value={tokensToAdd}
              onChange={(e) => setTokensToAdd(Math.max(0, Number(e.target.value)))}
              placeholder="จำนวน"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              onClick={async (e) => {
                e.preventDefault();

                if (tokensToAdd <= 0) {
                  alert("กรุณากรอกจำนวน Token ที่ต้องการเพิ่มมากกว่า 0");
                  return;
                }

                await handleSave({
                  tokens: (user.tokens ?? 0) + tokensToAdd,
                });

                alert(`เพิ่ม Token เรียบร้อย: +${tokensToAdd}`);

                setTokensToAdd(0);
                router.replace(router.asPath);
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-6 py-2 rounded-lg shadow hover:shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              เพิ่ม
            </button>
          </div>
        </div>
      </div>

      {/* ฝั่งขวา: ประวัติ Token */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">ประวัติ Token</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {user.tokenHistory?.filter(t => t.change !== 0).length || 0} รายการ
          </span>
        </div>

        <div className="max-h-80 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
          {user.tokenHistory && user.tokenHistory.length > 0 ? (
            user.tokenHistory
              .filter(t => t.change !== 0)
              .map((t, i) => {
                const dateObj = dayjs(t.date).tz('Asia/Bangkok');
                const formattedDate = dateObj.format('D MMM YYYY HH:mm'); // เช่น 7 ต.ค. 2025 15:16

                return (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border-l-4 ${
                      t.change > 0 
                        ? 'bg-green-50 border-green-500' 
                        : 'bg-red-50 border-red-500'
                    } shadow-sm hover:shadow transition-shadow`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          t.change > 0 ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {t.change > 0 ? (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${
                            t.change > 0 ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {t.change > 0 ? '+' : ''}{t.change}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{formattedDate}</p>
                    </div>
                    <p className="text-xs text-gray-600 italic pl-8">{t.reason || 'ไม่มีเหตุผล'}</p>
                  </div>
                );
              })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">ไม่มีประวัติ</p>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Custom Scrollbar */}
    <style jsx>{`
      .custom-scrollbar::-webkit-scrollbar {
        width: 5px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
    `}</style>
  </section>
)}

        {/* Tab 2: Ban */}
{activeTab === 2 && (
  <section className="bg-white rounded-xl shadow-lg p-6 max-w-5xl mx-auto">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ฝั่งซ้าย */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">การระงับบัญชี</h2>

        {/* Status Badge */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">สถานะปัจจุบัน</p>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              isSuspended ? "bg-red-500 animate-pulse" : "bg-green-500"
            }`}></div>
            <span className={`text-lg font-bold ${
              isSuspended ? "text-red-700" : "text-green-700"
            }`}>
              {isSuspended ? "บัญชีถูกระงับ" : "บัญชีปกติ"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* ปุ่มระงับบัญชี */}
          <button
            type="button"
            onClick={() => setSuspendChecked(true)}
            disabled={isSuspended && suspendChecked}
            className={`w-full px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
              suspendChecked 
                ? "bg-red-600 text-white shadow-lg" 
                : "bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <span>ระงับบัญชี</span>
          </button>

          {/* ปุ่มยกเลิกระงับ */}
          {isSuspended && (
            <button
              type="button"
              onClick={async () => {
                const confirmCancel = confirm("คุณแน่ใจที่จะยกเลิกการระงับบัญชีนี้หรือไม่?");
                if (!confirmCancel) return;

                setSuspensionReason("");
                setSuspendChecked(false);

                await handleSave({
                  isSuspended: false,
                  suspensionReason: "",
                });

                alert("สถานะ: ปลดระงับเรียบร้อยแล้ว");
              }}
              className={`w-full px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
                !suspendChecked 
                  ? "bg-green-600 text-white shadow-lg" 
                  : "bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-600 hover:text-white hover:border-green-600"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>ยกเลิกระงับบัญชี</span>
            </button>
          )}
        </div>

        {/* Warning Message */}
        {suspendChecked && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-800">คำเตือน</p>
                <p className="text-xs text-yellow-700 mt-0.5">ผู้ใช้จะไม่สามารถเข้าบัญชีได้</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ฝั่งขวา */}
      <div>
        {suspendChecked ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <label htmlFor="suspensionReason" className="block text-sm font-bold mb-2 text-gray-800 flex items-center">
                <svg className="w-4 h-4 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                เหตุผลการระงับ
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                id="suspensionReason"
                placeholder="กรุณาระบุเหตุผลการระงับบัญชีอย่างละเอียด..."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                rows={6}
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                {suspensionReason.length}/500 ตัวอักษร
              </p>
            </div>

            <button
              onClick={async () => {
                if (!suspensionReason.trim()) {
                  alert("กรุณากรอกเหตุผลการระงับบัญชีด้วยครับ");
                  return;
                }

                await handleSave({
                  isSuspended: true,
                  suspensionReason: suspensionReason,
                });

                alert("สถานะ: ระงับบัญชีเรียบร้อยแล้ว");
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>ยืนยันการระงับ</span>
            </button>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <svg className="w-20 h-20 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-sm font-medium">เลือกการกระทำ</p>
              <p className="text-xs mt-1">เลือกระหว่างระงับหรือยกเลิกการระงับ</p>
            </div>
          </div>
        )}
      </div>
    </div>
  </section>
)}

        {/* Tab 3: Uploaded Files */}
{activeTab === 3 && (
  <section className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg p-8 max-w-6xl mx-auto">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="leading-tight">
          <h2 className="text-2xl font-bold text-gray-800">ไฟล์ที่อัปโหลด</h2>
          {user.uploadedFiles?.length > 0 && (
            <p className="text-sm text-gray-500">
              จัดการไฟล์วิดีโอทั้งหมด {user.uploadedFiles.length} ไฟล์
            </p>
          )}
        </div>
      </div>
    </div>

    {/* Pagination - ย้ายมาด้านบน */}
    {user.uploadedFiles?.length > 0 && totalPages > 1 && (
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4 px-4 sm:px-6">
        <p className="text-sm text-gray-600 font-medium flex items-center gap-2">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
          แสดง <span className="font-semibold text-blue-600">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, user.uploadedFiles.length)}</span> จาก <span className="text-gray-500">{user.uploadedFiles.length}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50 hover:bg-gray-300 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } transition-colors`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50 hover:bg-gray-300 transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    )}

    {user.uploadedFiles?.length > 0 ? (
      <div className="grid grid-cols-1 gap-4">
        {pagedFiles.map((file) => {
          const folderCount = file.folders?.subfolders?.length || file.folders?.length || 0;
          const clipCount = file.clips?.length || 0;
          const hasFinal = !!file.clips?.find((c) => c.finalVideo);
          const status = file.status.toLowerCase();

          const statusColor =
            status.includes("completed")
              ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
              : status.includes("done")
              ? "bg-gradient-to-r from-sky-500 to-blue-500 text-white"
              : status.includes("error") || status.includes("failed")
              ? "bg-gradient-to-r from-rose-500 to-red-500 text-white"
              : "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700";

          return (
            <div
              key={file._id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden group"
            >
              <div className="p-6 flex justify-between items-start gap-4">
                {/* Left: Icon + File Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate mb-1 group-hover:text-indigo-600 transition-colors">
                      {file.originalName}
                    </h3>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10m-10 4h10M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{dayjs(file.createdAt).format("MMM D, YYYY")}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" strokeWidth={2} stroke="currentColor" />
                          <path d="M12 6v6l4 2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
                        </svg>
                        <span>{dayjs(file.createdAt).format("HH:mm")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Status + Stats */}
                <div className="flex flex-col items-end gap-2 min-w-[120px]">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${statusColor}`}>
                    {file.status}
                  </span>

                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-lg">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      {folderCount} โฟลเดอร์
                    </span>

                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 rounded-lg">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                      </svg>
                      {clipCount} คลิป
                    </span>

                    {hasFinal && (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-lg">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Final
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <div className="text-center py-20 bg-white rounded-xl shadow-md">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">ยังไม่มีไฟล์ที่อัปโหลด</h3>
        <p className="text-sm text-gray-500">ผู้ใช้คนนี้ยังไม่ได้อัปโหลดไฟล์วิดีโอใด ๆ</p>
      </div>
    )}

    {/* Status Legend - คำอธิบายสถานะ (ย้ายมาล่างสุด) */}
    {user.uploadedFiles?.length > 0 && (
      <div className="mt-6 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <h3 className="text-xs font-semibold text-gray-600 uppercase mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          คำอธิบายสถานะ
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-sm">
              Done
            </span>
            <p className="text-gray-600 text-xs leading-relaxed">
              ไฟล์ที่อัปโหลดแล้ว<br/>แต่ยังไม่ได้ประมวลผล
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm">
              Completed
            </span>
            <p className="text-gray-600 text-xs leading-relaxed">
              ประมวลผลเสร็จสมบูรณ์<br/>วิดีโอพร้อมใช้งาน
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-sm">
              Error
            </span>
            <p className="text-gray-600 text-xs leading-relaxed">
              เกิดข้อผิดพลาด<br/>ระหว่างการประมวลผล
            </p>
          </div>
        </div>
      </div>
    )}
  </section>
)}
      </div>
    </AdminLayout>
  );
}
