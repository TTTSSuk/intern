//pages\api\admin-login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    (res as any).setHeader("Allow", ["POST"]);
    return (res as any).status(405).json({ message: `Method ${req.method} ไม่ได้รับอนุญาต` });
  }

  try {
    const { adminId, password } = req.body;

    if (!adminId || !password) {
      return (res as any).status(400).json({ message: "กรุณาใส่ adminId และ password" });
    }

    console.log("🔐 Login attempt for AdminId:", adminId); // Debug log

    const client = await clientPromise;
    const db = client.db("login-form-app");
    const adminsCollection = db.collection("admins");

    // ค้นหา admin ตาม AdminId
    const admin = await adminsCollection.findOne({ AdminId: adminId });

    console.log("📄 Admin found:", admin ? "Yes" : "No"); // Debug log

    if (!admin || admin.password !== password) {
      console.log("❌ Invalid credentials"); // Debug log
      return (res as any).status(401).json({ message: "Admin ID หรือ Password ไม่ถูกต้อง" });
    }

    console.log("✅ Login successful for:", admin.name || admin.AdminId); // Debug log

    // ✅ ส่งกลับ AdminId และชื่อแอดมินด้วย
    return (res as any).status(200).json({ 
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      adminId: admin.AdminId, // ✅ ส่ง AdminId กลับไป
      name: admin.name || "แอดมิน" // ✅ ส่งชื่อกลับไปด้วย
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return (res as any).status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
}

// import type { NextApiRequest, NextApiResponse } from "next";
// import clientPromise from "@/lib/mongodb";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== "POST") {
//     (res as any).setHeader("Allow", ["POST"]);
//     return (res as any).status(405).json({ message: `Method ${req.method} ไม่ได้รับอนุญาต` });
//   }

//   try {
//     const { adminId, password } = req.body;

//     if (!adminId || !password) {
//       return (res as any).status(400).json({ message: "กรุณาใส่ adminId และ password" });
//     }

//     const client = await clientPromise;
//     const db = client.db("login-form-app");
//     const adminsCollection = db.collection("admins");

//     // ค้นหา admin ตาม AdminId
//     const admin = await adminsCollection.findOne({ AdminId: adminId });

//     if (!admin || admin.password !== password) {
//       return (res as any).status(401).json({ message: "Admin ID หรือ Password ไม่ถูกต้อง" });
//     }

//     // ส่งกลับชื่อแอดมินด้วย
//     return (res as any).status(200).json({ message: "เข้าสู่ระบบสำเร็จ"});
//   } catch (error) {
//     console.error(error);
//     return (res as any).status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
//   }
// }
