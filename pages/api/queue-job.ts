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
    const userTokensCollection = db.collection('user_tokens');

    // 1. ตรวจสอบว่าไฟล์มีอยู่จริง
    const existingFile = await listFileCollection.findOne({ _id: new ObjectId(fileId) });
    if (!existingFile) {
      return (res as any).status(404).json({ error: 'File not found' });
    }

    // 2. นับจำนวนคลิปที่ต้องสร้างจากโครงสร้างโฟลเดอร์
    let requiredTokens = 0;
    const subfolders = existingFile.folders?.subfolders || [];
    if (subfolders.length > 0) {
      // ถ้ามี wrapper (subfolders[0] มี subfolders)
      if (subfolders[0]?.subfolders && Array.isArray(subfolders[0].subfolders)) {
        requiredTokens = subfolders[0].subfolders.length;
      } else {
        // ไม่มี wrapper นับจาก subfolders โดยตรง
        requiredTokens = subfolders.length;
      }
    }

    // หากไม่พบโฟลเดอร์ย่อยที่จำเป็น ก็สามารถส่ง error ได้
    if (requiredTokens === 0) {
      return (res as any).status(400).json({ error: 'No content found for processing. Please check the folder structure.' });
    }

    // 3. ตรวจสอบ Token ของผู้ใช้
    const user = await userTokensCollection.findOne({ userId: existingFile.userId });
    if (!user) {
        return (res as any).status(404).json({ error: 'User not found' });
    }

    if (user.tokens < requiredTokens) {
      return (res as any).status(402).json({ 
        error: 'Insufficient tokens', 
        message: `คุณมี Token ไม่พอสำหรับการสร้างวิดีโอ ต้องใช้ 
        ${requiredTokens} Token แต่คุณมีแค่ 
        ${user.tokens} Token` 
      });
    }

    // ตรวจสอบว่า job นี้ไม่ได้อยู่ในระบบแล้ว
    const existingJob = await listFileCollection.findOne({ 
      _id: new ObjectId(fileId),
      status: { $in: ['queued', 'running', 'starting'] }
    });

    if (existingJob) {
      return (res as any).status(409).json({ 
        error: 'Job already in progress',
        message: 'งานนี้อยู่ในระบบแล้ว'
      });
    }

    // 4. ถ้า Token พอ ก็ดำเนินการตามโค้ดเดิม
    // หา queue position ล่าสุด
    const lastQueueItem = await listFileCollection.findOne(
      { status: 'queued' },
      { sort: { queuePosition: -1 } }
    );
    
    const nextPosition = (lastQueueItem?.queuePosition || 0) + 1;

    // อัปเดตสถานะเป็น queued พร้อม queue position
    const now = new Date();
    await listFileCollection.updateOne(
      { _id: new ObjectId(fileId) },
      { 
        $set: { 
          status: 'queued',
          queuePosition: nextPosition,
          updatedAt: now
        },
        $unset: {
          startTime: '',
          error: '',
          executionIdHistory: ''
        }
      }
    );

    console.log(`✅ Job ${fileId} added to queue at position ${nextPosition}`);
    (res as any).status(200).json({ 
      jobId: fileId, 
      status: 'queued', 
      message: 'งานถูกส่งเข้าคิวเรียบร้อย',
      requiredTokens,
      nextPosition
    });

  } catch (error) {
    console.error('❌ Error in queue-job:', error);
    return (res as any).status(500).json({ error: 'Internal Server Error' });
  }
}