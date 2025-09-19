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

    // หาผู้ใช้
    const user = await db.collection('users').findOne({ userId });
    if (!user) {
      return (res as any).status(404).json({ message: 'User not found' });
    }

    // สมมติ tokenHistory เก็บใน collection แยก หรือใน user document
    // ตัวอย่าง: user.tokenHistory เป็น array ของประวัติการใช้ token
    const tokenHistory = user.tokenHistory || [];

    // ส่ง tokens (ยอดคงเหลือ) และประวัติ token
    return (res as any).status(200).json({
      tokens: user.tokens || 0,
      tokenHistory,
    });
  } catch (error) {
    console.error(error);
    return (res as any).status(500).json({ message: 'Internal server error' });
  }
}
