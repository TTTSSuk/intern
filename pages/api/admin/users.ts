import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

function getThailandDate(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000; // แปลงเป็น UTC
  const thailandTime = new Date(utc + 7 * 60 * 60 * 1000); // บวก 7 ชั่วโมง
  return thailandTime; // เป็น Date object
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = await clientPromise;
  const db = client.db("login-form-app");
  const usersCollection = db.collection("users");
  const userTokensCollection = db.collection("user_tokens");


  if (req.method === "GET") {
    try {
      // ดึงข้อมูลผู้ใช้และรวมข้อมูลโทเค็น
      const users = await usersCollection
        .aggregate([
          {
            $lookup: {
              from: "user_tokens",
              localField: "userId",
              foreignField: "userId",
              as: "tokenData",
            },
          },
          {
            $project: {
              password: 0,
              "tokenData._id": 0,
              "tokenData.userId": 0,
            },
          },
          {
            $unwind: {
              path: "$tokenData",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $set: {
              tokens: { $ifNull: ["$tokenData.tokens", 0] },
              tokenHistory: { $ifNull: ["$tokenData.tokenHistory", []] },
            },
          },
          {
            $project: {
              tokenData: 0,
            },
          },
        ])
        .toArray();
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

      // บันทึกข้อมูลผู้ใช้ลงในคอลเลกชัน users
      await usersCollection.insertOne({
        userId,
        password,
        name,
        isActive: true,
        isSuspended: false,
        suspensionReason: "",
        createdAt: new Date(),
      });

      // บันทึกข้อมูลโทเค็นเริ่มต้นลงในคอลเลกชัน user_tokens
      await userTokensCollection.insertOne({
        userId,
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

    const userUpdateFields: any = {};
    const tokenUpdateFields: any = {};

    // จัดการการอัปเดตที่เกี่ยวข้องกับผู้ใช้
    if (typeof isActive === "boolean") userUpdateFields.isActive = isActive;
    if (typeof isSuspended === "boolean") userUpdateFields.isSuspended = isSuspended;
    if (typeof suspensionReason === "string") userUpdateFields.suspensionReason = suspensionReason;

    // จัดการการอัปเดตที่เกี่ยวข้องกับโทเค็น
    if (typeof tokens === "number") {
      const tokenData = await userTokensCollection.findOne({ userId });
      if (!tokenData) {
        return (res as any).status(404).json({ success: false, message: "ไม่พบข้อมูลโทเค็นของผู้ใช้" });
      }

      const oldTokens = tokenData.tokens || 0;
      const newTokens = tokens;
      const tokenChange = newTokens - oldTokens;

      if (tokenChange !== 0) {
        tokenUpdateFields.tokens = newTokens;

        const tokenHistoryItem = {
          date: getThailandDate(),
          change: tokenChange,
          reason: reason || (tokenChange > 0 ? "เพิ่ม token โดยแอดมิน" : "ปรับ token"),
        };

        tokenUpdateFields.tokenHistory = tokenData.tokenHistory
          ? [...tokenData.tokenHistory, tokenHistoryItem]
          : [tokenHistoryItem];
      }
    }

    if (Object.keys(userUpdateFields).length === 0 && Object.keys(tokenUpdateFields).length === 0) {
      return (res as any).status(400).json({ success: false, message: "ไม่มีข้อมูลที่จะอัปเดต" });
    }

    try {
      let modified = false;

      // อัปเดตคอลเลกชัน users ถ้ามีการอัปเดตที่เกี่ยวข้องกับผู้ใช้
      if (Object.keys(userUpdateFields).length > 0) {
        const userResult = await usersCollection.updateOne({ userId }, { $set: userUpdateFields });
        if (userResult.modifiedCount === 1) modified = true;
      }

      // อัปเดตคอลเลกชัน user_tokens ถ้ามีการอัปเดตที่เกี่ยวข้องกับโทเค็น
      if (Object.keys(tokenUpdateFields).length > 0) {
        const tokenResult = await userTokensCollection.updateOne({ userId }, { $set: tokenUpdateFields });
        if (tokenResult.modifiedCount === 1) modified = true;
      }

      if (modified) {
        return (res as any).status(200).json({ success: true, message: "อัปเดตสถานะผู้ใช้สำเร็จ" });
      } else {
        return (res as any).status(404).json({ success: false, message: "ไม่พบผู้ใช้หรือข้อมูลโทเค็น" });
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