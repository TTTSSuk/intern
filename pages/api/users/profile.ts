// pages/api/users/profile.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

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

    // ส่งกลับข้อมูลที่ UI ต้องใช้
    const userData = {
      userId: user.userId,
      name: user.name,
      tokens: userTokens?.tokens || 0,
      reservedTokens: userTokens?.reservedTokens || 0, // เพิ่มบรรทัดนี้
      isActive: !!user.isActive,
      isSuspended: !!user.isSuspended,
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
      lastActive: user.lastActive ? new Date(user.lastActive).toISOString() : null,
    };

    return (res as any).status(200).json({ user: userData });
  } catch (error) {
    console.error(error);
    return (res as any).status(500).json({ message: 'Internal server error' });
  }
}