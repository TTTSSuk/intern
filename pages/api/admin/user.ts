// pages/api/admin/user.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = await clientPromise;
  const db = client.db("login-form-app");
  const usersCollection = db.collection("users");
  const videosCollection = db.collection("listfile"); 

  if (req.method === "GET") {
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ success: false, message: "userId ไม่ถูกต้อง" });
    }

    try {
      const user = await usersCollection.findOne(
        { userId },
        { projection: { password: 0 } }
      );

      if (!user) {
        return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });
      }

       // ดึงไฟล์ที่ผู้ใช้อัปโหลดมา
      const uploadedFiles = await videosCollection
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();

        // แปลง ObjectId เป็น string และเพิ่ม fields ที่ต้องการ
      const filesFormatted = uploadedFiles.map(file => ({
        _id: file._id.toString(),
        originalName: file.originalName,
        status: file.status,
        createdAt: file.createdAt,
      }));

      return res.status(200).json({
        success: true,
        user: {
          ...user,
          uploadedFiles: filesFormatted,
        },
      });
    } catch (error) {
      console.error("Fetch user error:", error);
      return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาด" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} ไม่ได้รับอนุญาต`);
  }
}
