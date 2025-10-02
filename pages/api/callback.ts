// // pages/api/callback.ts
// pages/api/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return (res as any).status(405).json({ status: 'Method not allowed' });
  }

  interface UserDoc {
    _id: ObjectId;
    userId: string;
    tokens: number;
  }

  interface TokenHistoryDoc {
    userId: string;
    date: Date;
    change: number;
    reason: string;
    type: string;
    executionId?: string;
    zipId?: ObjectId;  
    folderName?:string;
    fileName?: string;
  }

  interface Clip {
    video?: string;
    finalVideo?: string;
    folderName?:string;
    createdAt: Date;
    tokenDeducted?: boolean;
  }
  
  interface FileDoc {
    _id: ObjectId;
    executionId: string;
    userId: string;
    originalName: string;
    clips: Clip[];
    status?: string;
    tokensReserved?: number; // 🔥 เพิ่ม field นี้
  }

  const { executionId, video, resultVideo, folderName } = req.body;
  
  if (!executionId || (!video && !resultVideo)) {
    return (res as any).status(400).json({ status: 'error', message: 'Missing required fields' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('login-form-app');
    const listFileCollection = db.collection<FileDoc>('listfile');
    const userTokensCollection = db.collection<UserDoc>('user_tokens');
    const tokenHistoryCollection = db.collection<TokenHistoryDoc>('token_history');
    
    if (video) {
        await listFileCollection.updateOne(
          { executionId },
          {
            $push: { clips: { 
              video,
              folderName, 
              createdAt: new Date(), 
              tokenDeducted: true  
            }},
            $set: { status: 'running' }
          },
          { upsert: true }
        );

        const fileDoc = await listFileCollection.findOne({ executionId });
        if (fileDoc) {
            // 🔥 หัก token จริง
            await userTokensCollection.updateOne( 
                { userId: fileDoc.userId },
                { $inc: { tokens: -1 } }
            );

            // 🔥 บันทึกการหัก token จริง
            await tokenHistoryCollection.insertOne({
                userId: fileDoc.userId,
                date: new Date(),
                change: -1,
                reason: 'สร้างคลิปวิดีโอสำเร็จ',
                type: 'video_creation',
                executionId,
                zipId: fileDoc._id,
                folderName,
                fileName: fileDoc.originalName
            });

            // 🔥 ลด token reservation ลง 1
            const reservation = await tokenHistoryCollection.findOne({
                userId: fileDoc.userId,
                zipId: fileDoc._id,
                type: 'token_reserved'
            });

            if (reservation && Math.abs(reservation.change) > 1) {
                // ถ้ายังมี token ที่จองไว้เหลืออยู่ ให้ลดลง 1
                await tokenHistoryCollection.updateOne(
                    {
                        userId: fileDoc.userId,
                        zipId: fileDoc._id,
                        type: 'token_reserved'
                    },
                    {
                        $inc: { change: 1 } // เพิ่ม 1 เพราะ change เป็นลบ (-3 + 1 = -2)
                    }
                );
            } else if (reservation) {
                // ถ้าเป็น token สุดท้าย ให้ลบ reservation ออก
                await tokenHistoryCollection.deleteOne({
                    userId: fileDoc.userId,
                    zipId: fileDoc._id,
                    type: 'token_reserved'
                });
            }

            console.log(`✅ Deducted 1 token from user ${fileDoc.userId} for video clip.`);
        }
    }

    if (resultVideo) {
      await listFileCollection.updateOne(
        { executionId },
        {
          $push: { clips: { finalVideo: resultVideo, createdAt: new Date() } },
          $set: { status: 'completed' }
        },
        { upsert: true }
      );
      
      const fileDoc = await listFileCollection.findOne({ executionId });
      if (fileDoc) {
        await tokenHistoryCollection.insertOne({
          userId: fileDoc.userId,
          date: new Date(),
          change: 0,
          reason: 'ได้รับวิดีโอรวมเรียบร้อย',
          type: 'final_video_completed',
          executionId,
          zipId: fileDoc._id,
          folderName,
          fileName: fileDoc.originalName,
        });

        console.log(`✅ Recorded final video completion for user ${fileDoc.userId}.`);
      }
    }
    
    return (res as any).status(200).json({ status: 'success' });

  } catch (error) {
    console.error('❌ Error in callback:', error);
    return (res as any).status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
}


// import type { NextApiRequest, NextApiResponse } from 'next';
// import clientPromise from '@/lib/mongodb';
// import { ObjectId } from 'mongodb'; // ✅ แก้ไข: เพิ่มการ import ObjectId

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') {
//     return (res as any).status(405).json({ status: 'Method not allowed' });
//   }

//   // ✅ แก้ไข: เพิ่ม interface สำหรับ user document
//   interface UserDoc {
//     _id: ObjectId;
//     userId: string;
//     tokens: number;
//     // tokenHistory: TokenEntry[];
//   }

//   interface TokenHistoryDoc {
//     userId: string;
//     date: Date;
//     change: number;
//     reason: string;
//     type: string;
//     executionId?: string;
//     zipId?: ObjectId;  
//     folderName?:string;     // ✅ เพิ่ม field zipId
//     fileName?: string;    // ✅ เพิ่ม field fileName (originalName)
//     // video?: string;
//   }

//   // ✅ แก้ไข: เพิ่ม interface สำหรับ token history
//   // interface TokenEntry {
//   //   date: Date;
//   //   change: number;
//   //   reason: string;
//   //   type: string;
//   //   executionId?: string; // Add executionId as optional
//   //   video?: string;
//   // }

//   // ✅ แก้ไข: อัปเดต interface ให้ตรงกับโครงสร้างข้อมูลใน DB
  
//   interface Clip {
//     video?: string;
//     finalVideo?: string;
//     folderName?:string;
//     createdAt: Date;
//     tokenDeducted?: boolean; // ⚠️ เพิ่ม field นี้
//   }
  
//   // ✅ แก้ไข: เพิ่ม userId และกำหนด clips เป็น array ใน interface
//   interface FileDoc {
//     _id: ObjectId;
//     executionId: string;
//     userId: string;
//     originalName: string;  // ✅ เพิ่ม originalName
//     clips: Clip[];
//     status?: string;
//   }

//   const { executionId, video, resultVideo, folderName } = req.body;
  
//   if (!executionId || (!video && !resultVideo)) {
//     return (res as any).status(400).json({ status: 'error', message: 'Missing required fields' });
//   }

// //   if (!folderName) {
// //   return (res as any).status(400).json({ status: 'error', message: 'Missing folderName' });
// // }

//   try {
//     const client = await clientPromise;
//     const db = client.db('login-form-app');
//     const listFileCollection = db.collection<FileDoc>('listfile');
//     // const usersCollection = db.collection<UserDoc>('users'); // ✅ แก้ไข: กำหนด type ให้ถูกต้อง
//     const userTokensCollection = db.collection<UserDoc>('user_tokens');
//     const tokenHistoryCollection = db.collection<TokenHistoryDoc>('token_history'); // ✅ Collection ใหม่
    
//     if (video) {
//         // อัปเดต listfile: เพิ่มคลิปใหม่เข้าไปใน array 'clips'
//         await listFileCollection.updateOne(
//           { executionId },
//           {
//             $push: { clips: { 
//               video,
//               folderName, 
//               createdAt: new Date(), 
//               tokenDeducted: true  } },
//             $set: { status: 'running' }
//           },
//           { upsert: true }
//         );

//         // ✅ ส่วนที่ต้องเพิ่ม: การหัก Token และบันทึกประวัติ
//         const fileDoc = await listFileCollection.findOne({ executionId });
//         if (fileDoc) {
//             await userTokensCollection.updateOne( 
//                 { userId: fileDoc.userId },
//                 { $inc: { tokens: -1 } }
//             );
//             //     { userId: fileDoc.userId },
//             //     {
//             //         $inc: { tokens: -1 }, // หัก Token ลง 1
//             //         $push: {
//             //             tokenHistory: {
//             //                 date: new Date(),
//             //                 change: -1,
//             //                 reason: 'สร้างคลิปวิดีโอสำเร็จ',
//             //                 type: 'video_creation',
//             //                 executionId, // Add executionId
//             //                 video, // Add video path
//             //             }
//             //         }
//             //     }
//             // );
//             // ✅ สร้าง document ใหม่ใน token_history collection
//             await tokenHistoryCollection.insertOne({
//                 userId: fileDoc.userId,
//                 date: new Date(),
//                 change: -1,
//                 reason: 'สร้างคลิปวิดีโอสำเร็จ',
//                 type: 'video_creation',
//                 executionId,
//                 zipId: fileDoc._id,
//                 folderName,
//                 fileName: fileDoc.originalName
//                 // video,
//             });
//             console.log(`✅ Deducted 1 token from user ${fileDoc.userId} for video clip.`);
//         }
//     }

//     if (resultVideo) {
//       await listFileCollection.updateOne(
//         { executionId },
//         {
//           $push: { clips: { finalVideo: resultVideo, createdAt: new Date() } },
//           $set: { status: 'completed' }
//         },
//         { upsert: true }
//       );
      
//       // บันทึกการได้รับวิดีโอรวม
//       const fileDoc = await listFileCollection.findOne({ executionId });
//       if (fileDoc) {
//         // ✅ สร้าง document ใหม่ใน token_history collection
//         await tokenHistoryCollection.insertOne({
//           userId: fileDoc.userId,
//           date: new Date(),
//           change: 0,
//           reason: 'ได้รับวิดีโอรวมเรียบร้อย',
//           type: 'final_video_completed',
//           executionId,
//           zipId: fileDoc._id,
//           folderName,
//           fileName: fileDoc.originalName,
//         });

//         console.log(`✅ Recorded final video completion for user ${fileDoc.userId}.`);
//       }
//     }
    
//     return (res as any).status(200).json({ status: 'success' });

//   } catch (error) {
//     console.error('❌ Error in callback:', error);
//     return (res as any).status(500).json({ status: 'error', message: 'Internal Server Error' });
//   }
// }

