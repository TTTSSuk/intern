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
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              <div className="flex-shrink-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={`${user.name} avatar`}
                    className="w-32 h-32 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center text-4xl font-bold text-gray-600">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <h1 className="text-3xl font-semibold text-gray-900">{user.name}</h1>
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
                  <strong>เวลาล่าสุด: </strong>{user.lastActive ? formatDateTime(new Date(user.lastActive)) : "ไม่มีข้อมูล"}
                  {/* <strong>เวลาล่าสุด: </strong> {user.lastActive ?? "ไม่มีข้อมูล"} */}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Tab 1: Token & History */}
        {activeTab === 1 && (
  <section className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
    {/* ฝั่งซ้าย: Token ปัจจุบัน + เพิ่ม Token */}
    <div className="flex flex-col">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Token & ประวัติการใช้ Token</h2>

      {/* Token ปัจจุบันเด่น ๆ */}
      <div className="mb-6 p-6 bg-indigo-600 rounded-lg shadow-md text-white flex items-center space-x-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8c-1.104 0-2 .896-2 2s.896 2 2 2 2-.896 2-2-.896-2-2-2zM12 2v2m0 16v2m8-10h2M2 12H4m15.364 6.364l1.414 1.414M4.222 4.222l1.414 1.414m12.728 0l-1.414 1.414M6.636 17.364l-1.414 1.414"
          />
        </svg>
        <div>
          <p className="text-lg font-semibold">Token ปัจจุบัน</p>
          <p className="text-4xl font-extrabold">{user.tokens ?? 0}</p>
        </div>
      </div>

      {/* เพิ่ม Token */}
      <label htmlFor="tokensToAdd" className="block mb-2 font-medium text-gray-700">
        เพิ่ม Token:
      </label>
      <input
        id="tokensToAdd"
        type="number"
        min={0}
        value={tokensToAdd}
        onChange={(e) => setTokensToAdd(Math.max(0, Number(e.target.value)))}
        className="w-32 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
      />

      <button
        onClick={async (e) => {
          e.preventDefault();

          if (tokensToAdd <= 0) {
            alert("กรุณากรอกจำนวน Token ที่ต้องการเพิ่มมากกว่า 0");
            return;
          }

          // เรียกฟังก์ชัน handleSave เพื่ออัปเดต Token
          await handleSave({
            tokens: (user.tokens ?? 0) + tokensToAdd,
          });

          alert(`เพิ่ม Token สำเร็จ: +${tokensToAdd}`);

          setTokensToAdd(0);
          // รีเฟรชข้อมูล user ใหม่
          router.replace(router.asPath);
        }}
        className="mt-4 px-8 py-3 rounded-full text-white text-lg font-semibold transition shadow-lg bg-green-600 hover:bg-green-700"
      >
        เพิ่ม Token
      </button>
    </div>

       
{/* ฝั่งขวา: ประวัติ Token */}
<div className="max-h-72 overflow-y-auto">
  <h3 className="font-semibold mb-4 text-gray-800 text-lg border-b border-gray-300 pb-2">ประวัติ Token</h3>
  {user.tokenHistory && user.tokenHistory.length > 0 ? (
    <ul className="space-y-3 text-gray-700 text-sm">
      {user.tokenHistory
        .filter(t => t.change !== 0) // กรองเอาเฉพาะที่ change ไม่เท่ากับ 0
        .map((t, i) => {
          // แปลงวันที่เป็นเวลาไทยและ พ.ศ.
          const dateObj = dayjs(t.date).tz('Asia/Bangkok');
          const day = String(dateObj.date()).padStart(2, '0');
          const month = String(dateObj.month() + 1).padStart(2, '0'); // เดือน 0-11
          const year = dateObj.year() + 543; // แปลงเป็น พ.ศ.
          const hours = String(dateObj.hour()).padStart(2, '0');
          const minutes = String(dateObj.minute()).padStart(2, '0');

          const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;

          return (
            <li
              key={i}
              className={`p-3 rounded-md ${
                t.change > 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              } shadow-sm`}
            >
              <div className="flex justify-between">
                <span className="font-medium">{formattedDate}</span>
                <span>{t.change > 0 ? '+' : ''}{t.change}</span>
              </div>
              <p className="mt-1 text-xs italic">{t.reason}</p>
            </li>
          );
        })}
    </ul>
  ) : (
    <p className="text-gray-400 italic">ไม่มีประวัติ token</p>
  )}
</div>
      </section>
        )}

       {/* Tab 2: Ban */}
        {activeTab === 2 && (
  <section className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

    {/* ฝั่งซ้าย */}
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">การระงับบัญชีผู้ใช้</h2>

      <div className="mb-6">
        <span
          className={`inline-block px-4 py-2 rounded-full font-semibold ${
            isSuspended ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
        >
          {isSuspended ? "บัญชีถูกระงับ" : "บัญชีปกติ"}
        </span>
      </div>

      <div className="flex space-x-4 mb-4">
        {/* ปุ่มระงับบัญชี */}
        <button
          type="button"
          onClick={() => setSuspendChecked(true)}
          className={`px-4 py-2 rounded font-medium transition ${
            suspendChecked ? "bg-red-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-red-500 hover:text-white"
          }`}
        >
          ระงับบัญชีผู้ใช้
        </button>

        {/* ปุ่มยกเลิกระงับ - แสดงเฉพาะเมื่อบัญชีถูกระงับ */}
        {isSuspended && (
          <button
            type="button"
            onClick={async () => {
              const confirmCancel = confirm("คุณแน่ใจที่จะยกเลิกการระงับบัญชีผู้ใช้นี้หรือไม่?");
              if (!confirmCancel) return;

              // Clear reason ใน client
              setSuspensionReason("");
              setSuspendChecked(false);

              // อัปเดตสถานะจริงทันทีที่ backend
              await handleSave({
                isSuspended: false,
                suspensionReason: "",
              });

              alert("สถานะ: ปลดระงับแล้ว");
            }}
            className={`px-4 py-2 rounded font-medium transition ${
              !suspendChecked ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-green-500 hover:text-white"
            }`}
          >
            ยกเลิกการระงับบัญชี
          </button>
        )}
      </div>
    </div>

    {/* ฝั่งขวา */}
    <div>
      {suspendChecked && (
        <>
          <div>
            <label htmlFor="suspensionReason" className="block text-sm font-semibold mb-1 text-gray-700">
              เหตุผลการระงับบัญชี <span className="text-red-500">*</span>
            </label>
            <textarea
              id="suspensionReason"
              placeholder="กรุณาระบุเหตุผลการระงับบัญชี"
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
              rows={5}
              required
            />
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

              alert("สถานะ: ระงับแล้ว");
            }}
            className="px-8 py-3 rounded-full text-white text-lg font-semibold transition shadow-lg bg-blue-600 hover:bg-blue-700 mt-4"
          >
            บันทึก
          </button>
        </>
      )}
    </div>
  </section>
)}

    {/* Tab 3: Uploaded Files */}
{activeTab === 3 && (
  <section className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg p-8 max-w-6xl mx-auto">
    <div className="flex items-center justify-between mb-8">
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
  </section>
)}

      </div>
    </AdminLayout>
  );
}
