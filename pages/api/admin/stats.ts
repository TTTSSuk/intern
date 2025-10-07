// pages/api/admin/stats.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // ดึง AdminId จาก query parameter
    const adminId = req.query.adminId as string;

    const client = await clientPromise;
    const db = client.db("login-form-app");

    // ดึงผู้ใช้ทั้งหมด
    const users = await db.collection("users").find({}).toArray();
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const suspendedUsers = users.filter(u => u.isSuspended).length;

    // ผู้ใช้ online (active ภายใน 15 นาทีล่าสุด)
    const now = new Date();
    const onlineUsers = users.filter(u => {
      if (!u.lastActive) return false;
      const last = new Date(u.lastActive);
      return (now.getTime() - last.getTime()) / 1000 / 60 <= 15; // 15 นาที
    }).length;

    // วิดีโอ
    const files = await db.collection("listfile").find({}).toArray();
    const totalVideos = files.reduce((acc, file) => acc + (file.clips?.length || 0), 0);

    // ดึงชื่อ admin ถ้ามี adminId
    let adminName = "แอดมิน";
    if (adminId) {
      const admin = await db.collection("admins").findOne({ AdminId: adminId });
      if (admin && admin.name) {
        adminName = admin.name;
      }
    }

    (res as any).status(200).json({
      totalUsers,
      onlineUsers,
      suspendedUsers,
      totalVideos,
      activeUsers,
      adminName,
    });
  } catch (error) {
    console.error(error);
    (res as any).status(500).json({ message: "Error fetching stats" });
  }
}