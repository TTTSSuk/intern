import type { NextApiRequest, NextApiResponse } from "next"
import clientPromise from "@/lib/mongodb"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise
    const db = client.db("login-form-app")

    // ลองดึงข้อมูล users ทั้งหมด
    const users = await db.collection("users").find().toArray()

    return (res as any).status(200).json({ success: true, users })
  } catch (error) {
    console.error("MongoDB connection error:", error)
    return (res as any).status(500).json({ success: false, error: "Cannot connect to MongoDB" })
  }
}
