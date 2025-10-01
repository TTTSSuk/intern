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
    
    // ✅ ดึงยอด tokens คงเหลือจาก user_tokens
    const tokenDoc = await db.collection('user_tokens').findOne({ userId });
    const tokens = tokenDoc?.tokens ?? 0;

    // ✅ ดึงประวัติ token จาก token_history collection
    const tokenHistory = await db.collection('token_history')
      .find({ userId })
      .sort({ date: -1 })
      .toArray();

    return (res as any).status(200).json({
      tokens,
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