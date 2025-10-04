// pages/api/cancel-queue.ts
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
    const userTokensCollection = db.collection('user_tokens');

    // 1. ดึงข้อมูลไฟล์
    const file = await listFileCollection.findOne({ _id: new ObjectId(fileId) });
    
    if (!file) {
      return (res as any).status(404).json({ error: 'File not found' });
    }

    // 2. ตรวจสอบว่าอยู่ในสถานะ queued หรือไม่
    if (file.status !== 'queued') {
      return (res as any).status(400).json({ 
        error: 'Cannot cancel', 
        message: `ไม่สามารถยกเลิกได้ เนื่องจากงานอยู่ในสถานะ: ${file.status}` 
      });
    }

    // 3. ลบ reservation record (ไม่แตะ user.tokens เลย)
const reservation = await tokenHistoryCollection.findOne({
  userId: file.userId,
  zipId: file._id,
  type: 'token_reserved'
});

let tokensReleased = 0;

if (reservation) {
  tokensReleased = Math.abs(reservation.change);
  
  // ลบ reservation record
  await tokenHistoryCollection.deleteOne({
    userId: file.userId,
    zipId: file._id,
    type: 'token_reserved'
  });

  // บันทึกประวัติการยกเลิก (ไม่มี change)
  await tokenHistoryCollection.insertOne({
    userId: file.userId,
    date: new Date(),
    change: 0,
    reason: 'ยกเลิกคิว - ปลดล็อก token ที่จองไว้',
    type: 'queue_cancelled',
    zipId: file._id,
    fileName: file.originalName
  });

  console.log(`✅ Released reservation of ${tokensReleased} tokens for user ${file.userId}`);
}

// 4. อัปเดตไฟล์
await listFileCollection.updateOne(
  { _id: new ObjectId(fileId) },
  { 
    $set: { 
      status: 'idle',
      updatedAt: new Date()
    },
    $unset: {
      queuePosition: '',
      tokensReserved: ''
    }
  }
);

    // 5. อัปเดต queuePosition ของงานที่เหลือในคิว
    const queuedJobs = await listFileCollection
      .find({ status: 'queued' })
      .sort({ queuePosition: 1 })
      .toArray();

    for (let i = 0; i < queuedJobs.length; i++) {
      await listFileCollection.updateOne(
        { _id: queuedJobs[i]._id },
        { $set: { queuePosition: i + 1 } }
      );
    }

    console.log(`✅ Cancelled queue for job ${fileId}`);
    
    return (res as any).status(200).json({ 
      success: true,
      message: 'ยกเลิกคิวสำเร็จและคืน token แล้ว',
      tokensReturned: reservation ? Math.abs(reservation.change) : 0
    });

  } catch (error) {
    console.error('❌ Error cancelling queue:', error);
    return (res as any).status(500).json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}