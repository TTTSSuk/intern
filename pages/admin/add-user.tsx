//pages\admin\add-user.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/Layouts/AdminLayout";

export default function AddUserPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  const router = useRouter();

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const confirmAdd = window.confirm("คุณแน่ใจว่าจะเพิ่มผู้ใช้นี้ใช่ไหม?");
  if (!confirmAdd) {
    return;
  }

  try {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, password, name }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("เพิ่มผู้ใช้สำเร็จ บันทึกเรียบร้อยแล้ว!");
      setUserId("");
      setPassword("");
      setName("");
      setMessage(null);
    } else {
      alert(`❌ ล้มเหลว: ${data.message || "ไม่ทราบสาเหตุ"}`);
    }
  } catch (error) {
    alert("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ");
  }
};

  return (
    <AdminLayout>
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 text-center text-indigo-700">เพิ่มผู้ใช้</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block mb-1 font-medium text-gray-700">
              ชื่อผู้ใช้ (Name)
            </label>
            <input
              id="name"
              type="text"
              placeholder="ชื่อผู้ใช้"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label htmlFor="userId" className="block mb-1 font-medium text-gray-700">
              User ID
            </label>
            <input
              id="userId"
              type="text"
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 font-medium text-gray-700">
              รหัสผ่าน
            </label>
            <input
              id="password"
              type="password"
              placeholder="รหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-md font-semibold hover:bg-indigo-700 transition-shadow shadow-md"
          >
            เพิ่มผู้ใช้
          </button>
        </form>

        {message && (
          <p
            className={`mt-6 text-center text-sm font-medium ${
              message.success ? "text-green-600" : "text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </AdminLayout>
  );
}

