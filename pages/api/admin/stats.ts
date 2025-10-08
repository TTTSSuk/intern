// pages/api/admin/stats.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // ดึง AdminId จาก query parameter
    const adminId = req.query.adminId as string;
    console.log("🔑 Received adminId from query:", adminId); // Debug log

    const client = await clientPromise;
    const db = client.db("login-form-app");

    // ดึงผู้ใช้ทั้งหมด
    const users = await db.collection("users").find({}).toArray();
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const suspendedUsers = users.filter(u => u.isSuspended).length;

    // ผู้ใช้ online (active ภายใน 5 นาทีล่าสุด)
    const now = new Date();
    const onlineUsers = users.filter(u => {
      if (!u.lastActive) return false;
      const last = new Date(u.lastActive);
      const diffMinutes = (now.getTime() - last.getTime()) / 1000 / 60;
      return diffMinutes <= 5;
    }).length;

    // วิดีโอ
    const files = await db.collection("listfile").find({}).toArray();
    const totalVideos = files.reduce((acc, file) => acc + (file.clips?.length || 0), 0);

    // ดึงชื่อ admin ถ้ามี adminId
    let adminName = "แอดมิน";
    if (adminId) {
      console.log("🔍 Searching for admin with AdminId:", adminId); // Debug log
      
      // ค้นหาด้วย AdminId ที่ตรงทุกตัวอักษร
      const admin = await db.collection("admins").findOne({ AdminId: adminId });
      console.log("📄 Admin document found:", admin); // Debug log
      
      if (admin && admin.name) {
        adminName = admin.name;
        console.log("✅ Admin name set to:", adminName); // Debug log
      } else {
        console.log("❌ Admin not found or no name field"); // Debug log
        
        // ลองหาแบบ case-insensitive
        const adminInsensitive = await db.collection("admins").findOne({ 
          AdminId: { $regex: new RegExp(`^${adminId}$`, 'i') } 
        });
        console.log("🔄 Trying case-insensitive search:", adminInsensitive); // Debug log
        
        if (adminInsensitive && adminInsensitive.name) {
          adminName = adminInsensitive.name;
          console.log("✅ Admin name found (case-insensitive):", adminName); // Debug log
        }
      }
    }

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
        lastActive: u.lastActive
      }))
      .slice(0, 10);

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
        return dateB - dateA;
      })
      .map(u => ({
        id: u.userId || u._id.toString(),
        name: u.name,
        lastActive: u.lastActive
      }))
      .slice(0, 15);

    console.log("🎯 Final adminName being sent:", adminName); // Debug log

    (res as any).status(200).json({
      totalUsers,
      onlineUsers,
      suspendedUsers,
      totalVideos,
      activeUsers,
      adminId,
      adminName,
      onlineUsersList,
      recentUsers,
    });
  } catch (error) {
    console.error("❌ Error in stats API:", error);
    (res as any).status(500).json({ message: "Error fetching stats" });
  }
}