import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = await clientPromise;
  const db = client.db("login-form-app");
  const usersCollection = db.collection("users");

  if (req.method === "POST") {
    const { userId, password, name, role = "user" } = req.body;

    if (!userId || !password || !name) {
      return res.status(400).json({ message: "กรุณาใส่ userId, password และ name" });
    }

    const existingUser = await usersCollection.findOne({ userId });
    if (existingUser) {
      return res.status(409).json({ message: "userId นี้ถูกใช้แล้ว" });
    }

    await usersCollection.insertOne({ userId, password, name, role });
    return res.status(201).json({ message: "สร้างผู้ใช้สำเร็จ" });
  }

  // กรณี method อื่น
  res.setHeader("Allow", ["POST"]);
  return res.status(405).end(`Method ${req.method} ไม่ได้รับอนุญาต`);
}
