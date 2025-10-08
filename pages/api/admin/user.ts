// pages/api/admin/user.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = await clientPromise;
  const db = client.db("login-form-app");
  const usersCollection = db.collection("users");
  const videosCollection = db.collection("listfile");
  const userTokensCollection = db.collection("user_tokens");
  const tokenHistoryCollection = db.collection("token_history");

  if (req.method === "GET") {
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      return (res as any).status(400).json({ success: false, message: "userId ไม่ถูกต้อง" });
    }

    try {
      const user = await usersCollection.findOne(
        { userId },
        { projection: { password: 0 } }
      );

      if (!user) {
        return (res as any).status(404).json({ success: false, message: "ไม่พบผู้ใช้" });
      }

      // ดึง token จาก collection user_tokens
      const tokenData = await userTokensCollection.findOne({ userId });
      const tokens = tokenData?.tokens ?? 0;

      // ดึงประวัติ token จาก token_history collection
      const tokenHistory = await tokenHistoryCollection
        .find({ userId })
        .sort({ date: -1 })
        .limit(100)
        .toArray();

      // ✅ คำนวณ totalTokensUsed (token ที่ใช้ไป - ค่าติดลบ)
      const totalTokensUsed = tokenHistory
        .filter(h => h.change < 0)
        .reduce((sum, h) => sum + Math.abs(h.change), 0);

      // ✅ คำนวณ totalTokensPurchased (token ที่เติม - ค่าบวก)
      const totalTokensPurchased = tokenHistory
        .filter(h => h.change > 0)
        .reduce((sum, h) => sum + h.change, 0);

      // ดึงไฟล์ที่ผู้ใช้อัปโหลดมา
      const uploadedFiles = await videosCollection
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();

        // ✅ นับทั้ง clips ที่มี video หรือ finalVideo (เช็คว่ามีค่าหรือไม่)
const totalVideos = uploadedFiles.reduce((count, file) => {
  const clipsWithVideo = file.clips?.filter((clip: any) => 
    clip.video || clip.finalVideo  // เช็คว่ามีค่า (ไม่ว่าจะเป็น string อะไรก็ตาม)
  ) || [];
  return count + clipsWithVideo.length;
}, 0);

      // แปลง ObjectId เป็น string และเพิ่ม fields ที่ต้องการ
      const filesFormatted = uploadedFiles.map(file => ({
        _id: file._id.toString(),
        originalName: file.originalName,
        status: file.status,
        createdAt: file.createdAt,
        folders: file.folders,
        clips: file.clips,
        executionIdHistory: file.executionIdHistory,
      }));

      return (res as any).status(200).json({
        success: true,
        user: {
          ...user,
          tokens,
          tokenBalance: tokens, // ✅ เพิ่มบรรทัดนี้
          totalVideos, // ✅ เพิ่มบรรทัดนี้
          totalTokensUsed, // ✅ เพิ่มบรรทัดนี้
          totalTokensPurchased, // ✅ เพิ่มบรรทัดนี้
          tokenHistory: tokenHistory.map(h => ({
            date: h.date,
            change: h.change,
            reason: h.reason,
            type: h.type,
            executionId: h.executionId,
            video: h.video,
          })),
          uploadedFiles: filesFormatted,
        },
      });
    } catch (error) {
      console.error("Fetch user error:", error);
      return (res as any).status(500).json({ success: false, message: "เกิดข้อผิดพลาด" });
    }
  } else {
    (res as any).setHeader("Allow", ["GET"]);
    return (res as any).status(405).end(`Method ${req.method} ไม่ได้รับอนุญาต`);
  }
}


// import type { NextApiRequest, NextApiResponse } from "next";
// import clientPromise from "@/lib/mongodb";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   const client = await clientPromise;
//   const db = client.db("login-form-app");
//   const usersCollection = db.collection("users");
//   const videosCollection = db.collection("listfile");
//   const userTokensCollection = db.collection("user_tokens");
//   const tokenHistoryCollection = db.collection("token_history"); // ✅ เพิ่ม

//   if (req.method === "GET") {
//     const { userId } = req.query;

//     if (!userId || typeof userId !== "string") {
//       return (res as any).status(400).json({ success: false, message: "userId ไม่ถูกต้อง" });
//     }

//     try {
//       const user = await usersCollection.findOne(
//         { userId },
//         { projection: { password: 0 } }
//       );

//       if (!user) {
//         return (res as any).status(404).json({ success: false, message: "ไม่พบผู้ใช้" });
//       }

//        // ดึง token และ history จาก collection user_tokens
//     const tokenData = await userTokensCollection.findOne({ userId });
//     const tokens = tokenData?.tokens ?? 0;
//     // const tokenHistory = tokenData?.tokenHistory ?? [];

//       // ✅ ดึงประวัติ token จาก token_history collection
//       const tokenHistory = await tokenHistoryCollection
//         .find({ userId })
//         .sort({ date: -1 })
//         .limit(100)
//         .toArray();

//        // ดึงไฟล์ที่ผู้ใช้อัปโหลดมา
//       const uploadedFiles = await videosCollection
//         .find({ userId })
//         .sort({ createdAt: -1 })
//         .toArray();

//         // แปลง ObjectId เป็น string และเพิ่ม fields ที่ต้องการ
//       const filesFormatted = uploadedFiles.map(file => ({
//         _id: file._id.toString(),
//         originalName: file.originalName,
//         status: file.status,
//         createdAt: file.createdAt,
//          folders: file.folders,
//         clips: file.clips,
//         executionIdHistory: file.executionIdHistory,
//       }));

//       return (res as any).status(200).json({
//         success: true,
//         user: {
//           ...user,
//           tokens,
//           tokenHistory: tokenHistory.map(h => ({
//             date: h.date,
//             change: h.change,
//             reason: h.reason,
//             type: h.type,
//             executionId: h.executionId,
//             video: h.video,
//           })),
//           uploadedFiles: filesFormatted,
//         },
//       });
//     } catch (error) {
//       console.error("Fetch user error:", error);
//       return (res as any).status(500).json({ success: false, message: "เกิดข้อผิดพลาด" });
//     }
//   } else {
//     (res as any).setHeader("Allow", ["GET"]);
//     return (res as any).status(405).end(`Method ${req.method} ไม่ได้รับอนุญาต`);
//   }
// }
