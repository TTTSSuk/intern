// pages/api/update-last-active.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return (res as any).status(405).json({ success: false, message: "Method not allowed" });
  }

  const { userId } = req.body;

  if (!userId) {
    return (res as any).status(400).json({ success: false, message: "userId is required" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("login-form-app");
    const usersCollection = db.collection("users");

    // อัปเดต lastActive เป็นเวลาปัจจุบัน
    const result = await usersCollection.updateOne(
      { userId },
      { $set: { lastActive: new Date() } }
    );

    if (result.matchedCount === 0) {
      return (res as any).status(404).json({ success: false, message: "User not found" });
    }

    return (res as any).status(200).json({ 
      success: true, 
      message: "lastActive updated successfully" 
    });
  } catch (error) {
    console.error("Error updating lastActive:", error);
    return (res as any).status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
}