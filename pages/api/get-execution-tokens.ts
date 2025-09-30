// pages/api/get-execution-tokens.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return (res as any).status(405).json({ error: 'Method not allowed' });
  }

  const { executionId, userId } = req.query;

  if (!executionId || !userId) {
    return (res as any).status(400).json({ error: 'executionId and userId are required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('login-form-app');
    const tokenHistoryCollection = db.collection('token_history');
    const userTokensCollection = db.collection('user_tokens');

    // ดึงข้อมูล token ที่ถูกหักจาก executionId นี้
    const tokenRecords = await tokenHistoryCollection
      .find({ 
        executionId: executionId as string,
        type: 'video_creation',
        change: { $lt: 0 } // เฉพาะการหัก token
      })
      .toArray();

    const totalTokensUsed = tokenRecords.reduce(
      (sum, record) => sum + Math.abs(record.change), 
      0
    );

    // ดึง token คงเหลือของ user
    const user = await userTokensCollection.findOne({ userId: userId as string });
    const remainingTokens = user?.tokens || 0;

    return (res as any).status(200).json({
      success: true,
      tokensUsed: totalTokensUsed,
      tokensRemaining: remainingTokens,
      clipCount: tokenRecords.length
    });

  } catch (error) {
    console.error('❌ Error fetching execution tokens:', error);
    return (res as any).status(500).json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}