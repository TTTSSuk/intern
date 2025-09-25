//pages\admin\user\[userId].tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/Layouts/AdminLayout";

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
        .filter(t => t.change !== 0)  // กรองเอาเฉพาะที่ change ไม่เท่ากับ 0
        .map((t, i) => (
          <li
            key={i}
            className={`p-3 rounded-md ${
              t.change > 0 ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            } shadow-sm`}
          >
            <div className="flex justify-between">
              <span className="font-medium">{t.date}</span>
              <span>{t.change > 0 ? "+" : ""}{t.change}</span>
            </div>
            <p className="mt-1 text-xs italic">{t.reason}</p>
          </li>
        ))
      }
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

        {/* ปุ่มยกเลิกระงับ */}
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
  <section className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
    <h2 className="text-2xl font-semibold mb-6 text-gray-800">ไฟล์ / วิดิโอที่อัปโหลด</h2>
    {user.uploadedFiles && user.uploadedFiles.length > 0 ? (
      <>
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-indigo-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-indigo-700 uppercase tracking-wide">ชื่อไฟล์</th>
                <th className="px-4 py-3 font-semibold text-indigo-700 uppercase tracking-wide">วันที่อัปโหลด</th>
                <th className="px-4 py-3 font-semibold text-indigo-700 uppercase tracking-wide">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {user.uploadedFiles.map((file) => (
                <tr
                  key={file._id}
                  className="hover:bg-indigo-50 transition-colors duration-200 cursor-pointer"
                  onClick={() => alert(`เปิดดูไฟล์: ${file.originalName}`)} // เพิ่ม action ตัวอย่าง
                >
                  <td className="px-4 py-3 text-gray-900 font-medium">{file.originalName}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDateTime(new Date(file.createdAt))}</td>
                  <td className={`px-4 py-3 font-semibold ${
                    file.status.toLowerCase() === "complete"
                      ? "text-green-600"
                      : file.status.toLowerCase() === "pending"
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}>
                    {file.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* <button
          onClick={() => router.push(`/admin/user/${user.userId}/files`)}
          className="mt-6 w-full md:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-shadow shadow-md"
        >
          ดูไฟล์ทั้งหมดของผู้ใช้คนนี้
        </button> */}
      </>
    ) : (
      <p className="text-center text-gray-500 italic py-12">ยังไม่มีไฟล์ที่อัปโหลด</p>
    )}
  </section>
        )}

      </div>
    </AdminLayout>
  );
}
