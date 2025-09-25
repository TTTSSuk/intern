// /pages/api/update-token.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

// กำหนด type ของ user_tokens document
interface UserToken {
  userId: string;
  tokens: number;
  tokenHistory: {
    date: Date;
    change: number;
    reason: string;
  }[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return (res as any).status(405).json({ message: 'Method Not Allowed' });
  }

  const { userId, tokens, reason } = req.body;

  if (!userId || typeof tokens !== 'number') {
    return (res as any).status(400).json({ message: 'userId and tokens are required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('login-form-app');
    const userTokensCollection = db.collection<UserToken>('user_tokens'); // ✅ ระบุ type ที่นี่

    const tokenHistoryItem: UserToken['tokenHistory'][0] = {
      date: new Date(),
      change: tokens,
      reason: reason || (tokens > 0 ? 'เพิ่ม token' : 'ปรับ token'),
    };

    const result = await userTokensCollection.updateOne(
      { userId },
      {
        $inc: { tokens: tokens },
        $push: { tokenHistory: tokenHistoryItem }, // ✅ ไม่มี error แล้ว
      },
      { upsert: true }
    );

    return (res as any).status(200).json({ success: true, message: 'Token updated successfully' });
  } catch (error) {
    console.error(error);
    return (res as any).status(500).json({ message: 'Internal server error' });
  }
}
