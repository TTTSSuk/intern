import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/Layouts/AdminLayout";

export default function AdminDashboard() {
  const [adminId, setAdminId] = useState("");
  const router = useRouter();

  useEffect(() => {
    const loggedInAdmin = localStorage.getItem("loggedInAdmin");
    if (!loggedInAdmin) {
      router.push("/admin/login");
    } else {
      setAdminId(loggedInAdmin);
    }
  }, [router]);

  return (
    <AdminLayout>
      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">ยินดีต้อนรับ, แอดมิน 👋</h2>
        <p className="text-gray-700">
          ใช้เมนูด้านซ้ายเพื่อจัดการระบบผู้ใช้ เช่น เพิ่มผู้ใช้ ดูข้อมูล ตั้งค่าระบบ เป็นต้น
        </p>
      </section>
    </AdminLayout>
  );
}
