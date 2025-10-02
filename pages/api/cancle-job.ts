// pages/api/cancel-job.ts
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
    const listFileCollection = db.collection('listfile');
    const tokenHistoryCollection = db.collection('token_history');

    // หาไฟล์ที่ต้องการยกเลิก
    const file = await listFileCollection.findOne({ _id: new ObjectId(fileId) });
    
    if (!file) {
      return (res as any).status(404).json({ error: 'File not found' });
    }

    // ตรวจสอบว่าสามารถยกเลิกได้หรือไม่ (เฉพาะงานที่ queued เท่านั้น)
    if (file.status !== 'queued') {
      return (res as any).status(400).json({ 
        error: 'Cannot cancel job',
        message: `งานนี้อยู่ในสถานะ '${file.status}' ไม่สามารถยกเลิกได้`
      });
    }

    // 🔥 ลบ token reservation
    const deleteResult = await tokenHistoryCollection.deleteOne({
      userId: file.userId,
      zipId: file._id,
      type: 'token_reserved'
    });

    if (deleteResult.deletedCount > 0) {
      console.log(`✅ Released reserved tokens for user ${file.userId}`);
    }

    // อัปเดตสถานะเป็น cancelled
    await listFileCollection.updateOne(
      { _id: new ObjectId(fileId) },
      { 
        $set: { 
          status: 'cancelled',
          updatedAt: new Date()
        },
        $unset: {
          queuePosition: '',
          tokensReserved: ''
        }
      }
    );

    // อัปเดต queue position ของงานอื่นๆ ที่อยู่ถัดมา
    if (file.queuePosition) {
      await listFileCollection.updateMany(
        { 
          status: 'queued',
          queuePosition: { $gt: file.queuePosition }
        },
        {
          $inc: { queuePosition: -1 }
        }
      );
    }

    console.log(`✅ Job ${fileId} cancelled successfully`);
    
    return (res as any).status(200).json({ 
      message: 'งานถูกยกเลิกเรียบร้อย',
      fileId
    });

  } catch (error) {
    console.error('❌ Error cancelling job:', error);
    return (res as any).status(500).json({ error: 'Internal Server Error' });
  }
}