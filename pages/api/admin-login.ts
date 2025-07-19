import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: `Method ${req.method} ไม่ได้รับอนุญาต` });
  }

  try {
    const { adminId, password } = req.body;

    if (!adminId || !password) {
      return res.status(400).json({ message: "กรุณาใส่ adminId และ password" });
    }

    const client = await clientPromise;
    const db = client.db("login-form-app");
    const adminsCollection = db.collection("admins");

    // ค้นหา admin ตาม AdminId
    const admin = await adminsCollection.findOne({ AdminId: adminId });

    if (!admin || admin.password !== password) {
      return res.status(401).json({ message: "Admin ID หรือ Password ไม่ถูกต้อง" });
    }

    // ส่งกลับชื่อแอดมินด้วย
    return res.status(200).json({ message: "เข้าสู่ระบบสำเร็จ"});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
}
