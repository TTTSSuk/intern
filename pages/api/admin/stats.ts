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

    // ผู้ใช้ online (active ภายใน 5 นาทีล่าสุด) - เปลี่ยนจาก 15 เป็น 5
    const now = new Date();
    const onlineUsers = users.filter(u => {
      if (!u.lastActive) return false;
      const last = new Date(u.lastActive);
      const diffMinutes = (now.getTime() - last.getTime()) / 1000 / 60;
      return diffMinutes <= 5; // เปลี่ยนเป็น 5 นาทีให้ตรงกับ Frontend
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

    // Log เพื่อ debug
    console.log('Online users calculation:', {
      totalUsers,
      onlineUsers,
      usersWithLastActive: users.filter(u => u.lastActive).length
    });

    // ดึงรายชื่อผู้ใช้ที่ออนไลน์ตอนนี้ (ภายใน 5 นาที)
    const onlineUsersList = users
      .filter(u => {
        if (!u.lastActive) return false;
        const last = new Date(u.lastActive);
        const diffMinutes = (now.getTime() - last.getTime()) / 1000 / 60;
        return diffMinutes <= 5;
      })
      .map(u => ({
        id: u.userId || u._id.toString(),
        name: u.name,
        email: u.email,
        lastActive: u.lastActive
      }))
      .slice(0, 10); // แสดงแค่ 10 คนแรก

    // ดึงรายชื่อผู้ใช้ที่ใช้งานภายใน 24 ชั่วโมง
    const recentUsers = users
      .filter(u => {
        if (!u.lastActive) return false;
        const last = new Date(u.lastActive);
        const diffHours = (now.getTime() - last.getTime()) / 1000 / 60 / 60;
        return diffHours <= 24;
      })
      .sort((a, b) => {
        const dateA = new Date(a.lastActive).getTime();
        const dateB = new Date(b.lastActive).getTime();
        return dateB - dateA; // เรียงจากล่าสุดไปเก่าสุด
      })
      .map(u => ({
        id: u.userId || u._id.toString(),
        name: u.name,
        email: u.email,
        lastActive: u.lastActive
      }))
      .slice(0, 15); // แสดงแค่ 15 คนแรก

    (res as any).status(200).json({
      totalUsers,
      onlineUsers,
      suspendedUsers,
      totalVideos,
      activeUsers,
      adminName,
      onlineUsersList, // เพิ่มรายชื่อผู้ใช้ที่ออนไลน์
      recentUsers, // เพิ่มรายชื่อผู้ใช้ที่ใช้งานภายใน 24 ชั่วโมง
    });
  } catch (error) {
    console.error(error);
    (res as any).status(500).json({ message: "Error fetching stats" });
  }
}