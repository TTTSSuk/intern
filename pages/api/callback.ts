// pages/api/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import path from "path";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return (res as any).status(405).json({ status: 'Method not allowed' });
  }

  interface UserDoc {
    _id: ObjectId;
    userId: string;
    tokens: number;
    tokenHistory: TokenEntry[];
  }

  interface TokenEntry {
    date: Date;
    change: number;
    reason: string;
    type: string;
    executionId?: string;
    video?: string;
  }

  interface Clip {
    video?: string;
    finalVideo?: string;
    createdAt: Date;
    tokenDeducted?: boolean;
  }
  
  interface FileDoc {
    _id: ObjectId;
    executionId: string;
    userId: string;
    clips: Clip[];
    status?: string;
    expectedTokens?: number;
  }

  const { executionId, video, resultVideo, status, error } = req.body;
  
  if (!executionId) {
    return (res as any).status(400).json({ status: 'error', message: 'Missing executionId' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('login-form-app');
    const listFileCollection = db.collection<FileDoc>('listfile');
    const userTokensCollection = db.collection<UserDoc>('user_tokens');

    // 🔥 กรณี: มี video clip สำเร็จ (หัก token เฉพาะเมื่อสำเร็จ)
    if (video) {
      // ค้นหา document ก่อนเพื่อเช็ค userId
      const fileDoc = await listFileCollection.findOne({ executionId });
      
      if (!fileDoc) {
        return (res as any).status(404).json({ status: 'error', message: 'File document not found' });
      }

      // เพิ่ม clip ใหม่เข้าไป
      await listFileCollection.updateOne(
        { executionId },
        {
          $push: { clips: { video, createdAt: new Date(), tokenDeducted: true } },
          $set: { status: 'running' }
        }
      );

      // ✅ หัก Token เฉพาะเมื่อสร้างคลิปสำเร็จ
      await userTokensCollection.updateOne(
        { userId: fileDoc.userId },
        {
          $inc: { tokens: -1 },
          $push: {
            tokenHistory: {
              date: new Date(),
              change: -1,
              reason: `สร้างคลิปวิดีโอสำเร็จ: ${path.basename(video)}`,
              type: 'video_creation',
              executionId: executionId,
              video: video
            }
          }
        }
      );
      
      console.log(`✅ Deducted 1 token from user ${fileDoc.userId} for video clip: ${video}`);
    }

    // 🔥 กรณี: มี final video สำเร็จ (ไม่หัก Token เพิ่ม - เป็น bonus)
    if (resultVideo) {
      const fileDoc = await listFileCollection.findOne({ executionId });
      
      if (!fileDoc) {
        return (res as any).status(404).json({ status: 'error', message: 'File document not found' });
      }

      await listFileCollection.updateOne(
        { executionId },
        {
          $push: { clips: { finalVideo: resultVideo, createdAt: new Date() } },
          $set: { status: 'completed' }
        }
      );

      // 📝 บันทึก history ว่าได้ final video แล้ว (ไม่หัก token)
      await userTokensCollection.updateOne(
        { userId: fileDoc.userId },
        {
          $push: {
            tokenHistory: {
              date: new Date(),
              change: 0,
              reason: `ได้รับวิดีโอรวมเรียบร้อย`,
              type: 'final_video_completed',
              executionId: executionId
            }
          }
        }
      );

      console.log(`✅ Final video completed for execution ${executionId} - No additional token charged`);
    }

    // 🔥 กรณี: เกิด Error (ไม่หัก token หรือคืน token ถ้าหักไปแล้ว)
    if (status === 'error' || error) {
      const fileDoc = await listFileCollection.findOne({ executionId });
      
      if (!fileDoc) {
        return (res as any).status(404).json({ status: 'error', message: 'File document not found' });
      }

      // 🔍 วิเคราะห์ประเภทของ error
      const expectedClips = fileDoc.expectedTokens || 0;
      const successfulClips = fileDoc.clips ? fileDoc.clips.filter(clip => clip.video && clip.tokenDeducted === true) : [];
      const hasAllClips = successfulClips.length === expectedClips;
      const hasFinalVideo = fileDoc.clips ? fileDoc.clips.some(clip => clip.finalVideo) : false;

      let errorType = '';
      let shouldRefund = false;

      if (successfulClips.length === 0) {
        // กรณี: ทุกคลิปล้มเหลว
        errorType = 'complete_failure';
        shouldRefund = false; // ไม่มีการหักเลย
      } else if (!hasAllClips) {
        // กรณี: บางคลิปสำเร็จ บางคลิปล้มเหลว  
        errorType = 'partial_success';
        shouldRefund = false; // หักเฉพาะที่สำเร็จ
      } else if (hasAllClips && !hasFinalVideo) {
        // กรณี: ทุกคลิปสำเร็จ แต่ final video error
        errorType = 'final_video_error';
        shouldRefund = false; // ไม่คืน token เพราะได้คลิปครบแล้ว
      }

      await listFileCollection.updateOne(
        { executionId },
        {
          $set: { 
            status: 'error',
            error: error || 'Unknown error occurred',
            errorType: errorType,
            updatedAt: new Date()
          }
        }
      );

      // 🔄 จัดการการคืน token ตาม error type
      if (shouldRefund && successfulClips.length > 0) {
        const tokensToRefund = successfulClips.length;
        
        await userTokensCollection.updateOne(
          { userId: fileDoc.userId },
          {
            $inc: { tokens: tokensToRefund },
            $push: {
              tokenHistory: {
                date: new Date(),
                change: tokensToRefund,
                reason: `คืน Token เนื่องจากการรวมวิดีโอล้มเหลว (${tokensToRefund} Token)`,
                type: 'refund_final_video_error',
                executionId: executionId
              }
            }
          }
        );

        // อัปเดตให้ clips ไม่ถือว่า token ถูกหักแล้ว
        await listFileCollection.updateOne(
          { executionId },
          { $set: { "clips.$[elem].tokenDeducted": false } },
          { arrayFilters: [{ "elem.video": { $exists: true } }] }
        );

        console.log(`🔄 Refunded ${tokensToRefund} tokens to user ${fileDoc.userId} due to final video failure.`);
      } else {
        // เพิ่ม history แจ้งว่าไม่มีการคืน token
        let reasonText = '';
        if (errorType === 'complete_failure') {
          reasonText = 'งานล้มเหลวตั้งแต่เริ่มต้น ไม่มีการหัก Token';
        } else if (errorType === 'partial_success') {
          reasonText = `งานสำเร็จบางส่วน (${successfulClips.length}/${expectedClips} คลิป) หัก Token เฉพาะที่สำเร็จ`;
        } else if (errorType === 'final_video_error') {
          reasonText = `คลิปย่อยสำเร็จครบ (${successfulClips.length}/${expectedClips}) แต่การรวมวิดีโอล้มเหลว - หัก Token ตามคลิปที่ได้`;
        }

        if (reasonText) {
          await userTokensCollection.updateOne(
            { userId: fileDoc.userId },
            {
              $push: {
                tokenHistory: {
                  date: new Date(),
                  change: 0,
                  reason: reasonText,
                  type: 'partial_completion_note',
                  executionId: executionId
                }
              }
            }
          );
        }
      }

      console.log(`❌ Job ${executionId} failed with ${errorType}: ${error}`);
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