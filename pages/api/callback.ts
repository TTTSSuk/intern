// pages/api/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb'; // ✅ แก้ไข: เพิ่มการ import ObjectId

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return (res as any).status(405).json({ status: 'Method not allowed' });
  }

  // ✅ แก้ไข: เพิ่ม interface สำหรับ user document
  interface UserDoc {
    _id: ObjectId;
    userId: string;
    tokens: number;
    // tokenHistory: TokenEntry[];
  }

  interface TokenHistoryDoc {
    userId: string;
    date: Date;
    change: number;
    reason: string;
    type: string;
    executionId?: string;
    video?: string;
  }

  // ✅ แก้ไข: เพิ่ม interface สำหรับ token history
  // interface TokenEntry {
  //   date: Date;
  //   change: number;
  //   reason: string;
  //   type: string;
  //   executionId?: string; // Add executionId as optional
  //   video?: string;
  // }

  // ✅ แก้ไข: อัปเดต interface ให้ตรงกับโครงสร้างข้อมูลใน DB
  
  interface Clip {
    video?: string;
    finalVideo?: string;
    createdAt: Date;
    tokenDeducted?: boolean; // ⚠️ เพิ่ม field นี้
  }
  
  // ✅ แก้ไข: เพิ่ม userId และกำหนด clips เป็น array ใน interface
  interface FileDoc {
    _id: ObjectId;
    executionId: string;
    userId: string;
    clips: Clip[];
    status?: string;
  }

  const { executionId, video, resultVideo } = req.body;
  
  if (!executionId || (!video && !resultVideo)) {
    return (res as any).status(400).json({ status: 'error', message: 'Missing required fields' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('login-form-app');
    const listFileCollection = db.collection<FileDoc>('listfile');
    // const usersCollection = db.collection<UserDoc>('users'); // ✅ แก้ไข: กำหนด type ให้ถูกต้อง
    const userTokensCollection = db.collection<UserDoc>('user_tokens');
    const tokenHistoryCollection = db.collection<TokenHistoryDoc>('token_history'); // ✅ Collection ใหม่
    
    if (video) {
        // อัปเดต listfile: เพิ่มคลิปใหม่เข้าไปใน array 'clips'
        await listFileCollection.updateOne(
          { executionId },
          {
            $push: { clips: { video, createdAt: new Date(), tokenDeducted: true  } },
            $set: { status: 'running' }
          },
          { upsert: true }
        );

        // ✅ ส่วนที่ต้องเพิ่ม: การหัก Token และบันทึกประวัติ
        const fileDoc = await listFileCollection.findOne({ executionId });
        if (fileDoc) {
            await userTokensCollection.updateOne( 
                { userId: fileDoc.userId },
                { $inc: { tokens: -1 } }
            );
            //     { userId: fileDoc.userId },
            //     {
            //         $inc: { tokens: -1 }, // หัก Token ลง 1
            //         $push: {
            //             tokenHistory: {
            //                 date: new Date(),
            //                 change: -1,
            //                 reason: 'สร้างคลิปวิดีโอสำเร็จ',
            //                 type: 'video_creation',
            //                 executionId, // Add executionId
            //                 video, // Add video path
            //             }
            //         }
            //     }
            // );
            // ✅ สร้าง document ใหม่ใน token_history collection
            await tokenHistoryCollection.insertOne({
                userId: fileDoc.userId,
                date: new Date(),
                change: -1,
                reason: 'สร้างคลิปวิดีโอสำเร็จ',
                type: 'video_creation',
                executionId,
                video,
            });
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
      
      // บันทึกการได้รับวิดีโอรวม
      const fileDoc = await listFileCollection.findOne({ executionId });
      if (fileDoc) {
        // ✅ สร้าง document ใหม่ใน token_history collection
        await tokenHistoryCollection.insertOne({
          userId: fileDoc.userId,
          date: new Date(),
          change: 0,
          reason: 'ได้รับวิดีโอรวมเรียบร้อย',
          type: 'final_video_completed',
          executionId,
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
//     tokenHistory: TokenEntry[];
//   }

//   // ✅ แก้ไข: เพิ่ม interface สำหรับ token history
//   interface TokenEntry {
//     date: Date;
//     change: number;
//     reason: string;
//     type: string;
//   }

//   // ✅ แก้ไข: อัปเดต interface ให้ตรงกับโครงสร้างข้อมูลใน DB
//   interface Clip {
//     video?: string;
//     finalVideo?: string;
//     createdAt: Date;
//     tokenDeducted?: boolean; // ⚠️ เพิ่ม field นี้
//   }
  
//   // ✅ แก้ไข: เพิ่ม userId และกำหนด clips เป็น array ใน interface
//   interface FileDoc {
//     _id: ObjectId;
//     executionId: string;
//     userId: string;
//     clips: Clip[];
//     status?: string;
//   }

//   const { executionId, video, resultVideo } = req.body;
  
//   if (!executionId || (!video && !resultVideo)) {
//     return (res as any).status(400).json({ status: 'error', message: 'Missing required fields' });
//   }

//   try {
//     const client = await clientPromise;
//     const db = client.db('login-form-app');
//     const listFileCollection = db.collection<FileDoc>('listfile');
//     // const usersCollection = db.collection<UserDoc>('users'); // ✅ แก้ไข: กำหนด type ให้ถูกต้อง
//     const userTokensCollection = db.collection<UserDoc>('user_tokens');

//     if (video) {
//         // อัปเดต listfile: เพิ่มคลิปใหม่เข้าไปใน array 'clips'
//         await listFileCollection.updateOne(
//           { executionId },
//           {
//             $push: { clips: { video, createdAt: new Date(), tokenDeducted: true  } },
//             $set: { status: 'running' }
//           },
//           { upsert: true }
//         );

//         // ✅ ส่วนที่ต้องเพิ่ม: การหัก Token และบันทึกประวัติ
//         const fileDoc = await listFileCollection.findOne({ executionId });
//         if (fileDoc) {
//             await userTokensCollection.updateOne(
//                 { userId: fileDoc.userId },
//                 {
//                     $inc: { tokens: -1 }, // หัก Token ลง 1
//                     $push: {
//                         tokenHistory: {
//                             date: new Date(),
//                             change: -1,
//                             reason: 'สร้างคลิปวิดีโอสำเร็จ',
//                             type: 'video_creation'
//                         }
//                     }
//                 }
//             );
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
//     }
    
//     return (res as any).status(200).json({ status: 'success' });

//   } catch (error) {
//     console.error('❌ Error in callback:', error);
//     return (res as any).status(500).json({ status: 'error', message: 'Internal Server Error' });
//   }
// }