// pages/api/queue-job.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return (res as any).status(405).json({ error: 'Method not allowed' });
  }

  const { fileId } = req.body;

  if (!fileId) {
    return (res as any).status(400).json({ error: 'fileId is required' });
  }

  if (!ObjectId.isValid(fileId)) {
    return (res as any).status(400).json({ error: 'Invalid fileId format' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('login-form-app');
    const collection = db.collection('listfile');

    // ตรวจสอบว่าไฟล์มีอยู่จริงหรือไม่
    const existingFile = await collection.findOne({ _id: new ObjectId(fileId) });
    if (!existingFile) {
      return (res as any).status(404).json({ error: 'File not found' });
    }

    console.log(`📋 Queue request for ${fileId}, current status: ${existingFile.status}`);

    // ตรวจสอบว่างานกำลังทำงานอยู่หรือไม่ (เฉพาะสถานะที่ยังไม่เสร็จ)
    if (['queued', 'running', 'processing'].includes(existingFile.status)) {
      console.log(`⏳ Job ${fileId} is already active with status: ${existingFile.status}`);
      return (res as any).status(200).json({ 
        jobId: fileId, 
        message: `Job already in ${existingFile.status} status`,
        status: existingFile.status,
        queuePosition: existingFile.queuePosition
      });
    }

    // ถ้างานเสร็จแล้ว (completed, succeeded, error) ให้เริ่มงานใหม่ได้
    if (['completed', 'succeeded', 'error'].includes(existingFile.status)) {
      console.log(`🔄 Restarting job ${fileId} from ${existingFile.status} status`);
    }

    // หา queue position ล่าสุด
    const lastQueueItem = await collection.findOne(
      { status: 'queued' },
      { sort: { queuePosition: -1 } }
    );
    
    const nextPosition = (lastQueueItem?.queuePosition || 0) + 1;

    // อัปเดตสถานะเป็น queued พร้อม queue position และล้างข้อมูลเก่า
    const now = new Date();
    const updateResult = await collection.updateOne(
      { _id: new ObjectId(fileId) },
      { 
        $set: { 
          status: 'queued',
          queuePosition: nextPosition,
          updatedAt: now
        },
        $unset: {
          executionId: "",
          startTime: "",
          error: "",
          clips: "",
          executionIdHistory: ""
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      console.warn(`⚠️ Job ${fileId} was not modified - update may have failed`);
    }

    console.log(`✅ Job ${fileId} added to queue at position ${nextPosition}`);

    (res as any).status(200).json({ 
      jobId: fileId,
      queuePosition: nextPosition,
      status: 'queued',
      message: 'Job added to queue successfully'
    });
  } catch (error) {
    console.error('❌ Failed to queue job:', error);
    return (res as any).status(500).json({ error: 'Failed to queue job' });
  }
}
// import type { NextApiRequest, NextApiResponse } from 'next';
// import clientPromise from '@/lib/mongodb';
// import { ObjectId } from 'mongodb';

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   if (req.method !== 'POST') {
//     return (res as any).status(405).json({ error: 'Method not allowed' });
//   }

//   const { fileId } = req.body; // เปลี่ยนจาก _id เป็น fileId ให้ตรงกับที่ส่งมาจาก frontend

//   if (!fileId) {
//     return (res as any).status(400).json({ error: 'fileId is required' });
//   }

//   if (!ObjectId.isValid(fileId)) {
//     return (res as any).status(400).json({ error: 'Invalid fileId format' });
//   }

//   try {
//     const client = await clientPromise;
//     const db = client.db('login-form-app');
//     const collection = db.collection('listfile');

//     // ตรวจสอบว่าไฟล์มีอยู่จริงหรือไม่
//     const existingFile = await collection.findOne({ _id: new ObjectId(fileId) });
//     if (!existingFile) {
//       return (res as any).status(404).json({ error: 'File not found' });
//     }

//     // ตรวจสอบว่างานอยู่ใน queue แล้วหรือยัง
//     if (['queued', 'running', 'processing', 'completed', 'succeeded'].includes(existingFile.status)) {
//       return (res as any).status(200).json({ 
//         jobId: fileId, 
//         message: `Job already in ${existingFile.status} status`,
//         status: existingFile.status
//       });
//     }

//     // หา queue position ล่าสุด
//     const lastQueueItem = await collection.findOne(
//       { status: 'queued' },
//       { sort: { queuePosition: -1 } }
//     );
    
//     const nextPosition = (lastQueueItem?.queuePosition || 0) + 1;

//     // อัปเดตสถานะเป็น queued พร้อม queue position
//     const now = new Date();
//     await collection.updateOne(
//       { _id: new ObjectId(fileId) },
//       { 
//         $set: { 
//           status: 'queued',
//           queuePosition: nextPosition,
//           updatedAt: now
//         },
//         $unset: {
//           executionId: "",
//           startTime: "",
//           error: ""
//         }
//       }
//     );

//     console.log(`✅ Job ${fileId} added to queue at position ${nextPosition}`);

//     (res as any).status(200).json({ 
//       jobId: fileId,
//       queuePosition: nextPosition,
//       status: 'queued',
//       message: 'Job added to queue successfully'
//     });
//   } catch (error) {
//     console.error('Failed to queue job:', error);
//     return (res as any).status(500).json({ error: 'Failed to queue job' });
//   }
// }