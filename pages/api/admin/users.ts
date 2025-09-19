// /pages/api/admin/users.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = await clientPromise;
  const db = client.db("login-form-app");
  const usersCollection = db.collection("users");

  if (req.method === "GET") {
    try {
      const users = await usersCollection.find({}, { projection: { password: 0 } }).toArray();
      return (res as any).status(200).json({ success: true, users });
    } catch (error) {
      console.error(error);
      return (res as any).status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลผู้ใช้ได้" });
    }

  } else if (req.method === "POST") {
    const { userId, password, name } = req.body;

    if (!userId || !password || !name) {
      return (res as any).status(400).json({ success: false, message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    try {
      const existingUser = await usersCollection.findOne({ userId });
      if (existingUser) {
        return (res as any).status(409).json({ success: false, message: "User ID นี้มีอยู่แล้ว" });
      }

      await usersCollection.insertOne({
        userId,
        password,
        name,
        isActive: true,
        isSuspended: false,
        suspensionReason: "",
        tokens: 0,
        tokenHistory: [],
        createdAt: new Date(),
      });

      return (res as any).status(201).json({ success: true, message: "เพิ่มผู้ใช้สำเร็จ" });
    } catch (error) {
      console.error("เพิ่มผู้ใช้ล้มเหลว:", error);
      return (res as any).status(500).json({ success: false, message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
    }

  } else if (req.method === "PATCH") {
    const { userId, isActive, isSuspended, suspensionReason, tokens, reason } = req.body;

    if (!userId) {
      return (res as any).status(400).json({ success: false, message: "กรุณาระบุ userId" });
    }

    const updateFields: any = {};

    if (typeof isActive === "boolean") updateFields.isActive = isActive;
    if (typeof isSuspended === "boolean") updateFields.isSuspended = isSuspended;
    if (typeof suspensionReason === "string") updateFields.suspensionReason = suspensionReason;

    if (typeof tokens === "number") {
      const user = await usersCollection.findOne({ userId });
      if (!user) {
        return (res as any).status(404).json({ success: false, message: "ไม่พบผู้ใช้" });
      }

      const oldTokens = user.tokens || 0;
      const newTokens = tokens;
      const tokenChange = newTokens - oldTokens;

      if (tokenChange !== 0) {
        updateFields.tokens = newTokens;

        const tokenHistoryItem = {
          date: new Date().toISOString().split("T")[0],
          change: tokenChange,
          reason: reason || (tokenChange > 0 ? "เพิ่ม token โดยแอดมิน" : "ปรับ token"),
        };

        updateFields.tokenHistory = user.tokenHistory
          ? [...user.tokenHistory, tokenHistoryItem]
          : [tokenHistoryItem];
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return (res as any).status(400).json({ success: false, message: "ไม่มีข้อมูลที่จะอัปเดต" });
    }

    try {
      const result = await usersCollection.updateOne({ userId }, { $set: updateFields });

      if (result.modifiedCount === 1) {
        return (res as any).status(200).json({ success: true, message: "อัปเดตสถานะผู้ใช้สำเร็จ" });
      } else {
        return (res as any).status(404).json({ success: false, message: "ไม่พบผู้ใช้" });
      }
    } catch (error) {
      console.error(error);
      return (res as any).status(500).json({ success: false, message: "ไม่สามารถอัปเดตสถานะได้" });
    }

  } else {
    (res as any).setHeader("Allow", ["GET", "POST", "PATCH"]);
    return (res as any).status(405).end(`Method ${req.method} ไม่ได้รับอนุญาต`);
  }
}
