// pages/api/users/token-history.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return (res as any).status(400).json({ message: 'userId is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('login-form-app');
    
    const tokenDoc = await db.collection('user_tokens').findOne({ userId });
    const tokens = tokenDoc?.tokens ?? 0;

    // ใช้เฉพาะ listfile เท่านั้น (ข้อมูลจริงของงานที่กำลังทำ)
    const runningJobs = await db.collection('listfile').find({
      userId,
      status: { $in: ['queued', 'running', 'processing'] },
      tokensReserved: { $exists: true, $gt: 0 }
    }).toArray();

    const reservedTokens = runningJobs.reduce((sum, job) => {
      console.log(`📌 Job: ${job.originalName} - Reserved: ${job.tokensReserved}`);
      return sum + (job.tokensReserved || 0);
    }, 0);

    console.log(`✅ Total reserved: ${reservedTokens} tokens`);

    // กรองรายการจอง/ปล่อย token ออกจากตาราง
    const tokenHistory = await db.collection('token_history')
      .find({ 
        userId,
        type: { 
          $nin: ['reserve', 'release', 'token_reserved', 'token_released'] 
        }
      })
      .sort({ date: -1 })
      .toArray();

    return (res as any).status(200).json({
      tokens,
      reservedTokens,
      tokenHistory: tokenHistory.map(h => ({
        date: h.date,
        change: h.change,
        reason: h.reason,
        type: h.type,
        executionId: h.executionId,
        folderName: h.folderName, 
        fileName: h.fileName,
        video: h.video,
      })),
    });
  } catch (error) {
    console.error(error);
    return (res as any).status(500).json({ message: 'Internal server error' });
  }
}