//pages\api\users\profile.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

interface UserResponse {
  user: {
    userId: string;
    name: string;
    tokens: number;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return (res as any).status(405).json({ message: 'Method not allowed' });
  }

  const userId = req.query.userId;
  if (!userId || typeof userId !== 'string') {
    return (res as any).status(400).json({ message: 'Missing or invalid userId' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('login-form-app');

    const user = await db.collection('users').findOne({ userId });
     if (!user) {
      return (res as any).status(404).json({ message: 'User not found' });
    }

// ดึงข้อมูล tokens จาก collection user_tokens
    const userTokens = await db.collection('user_tokens').findOne({ userId });
   
    // สร้าง object สำหรับส่งกลับ
    const userData = {
      userId: user.userId,
      name: user.name,
      tokens: userTokens?.tokens || 0, // ใช้ tokens จาก user_tokens หรือ 0 ถ้าไม่พบ
    };

    return (res as any).status(200).json({ user: userData});
  } catch (error) {
    console.error(error);
    return (res as any).status(500).json({ message: 'Internal server error' });
  }
}
