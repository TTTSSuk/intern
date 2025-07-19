import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const userId = req.query.userId;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ message: 'Missing or invalid userId' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('login-form-app');
    const user = await db.collection('users').findOne({ userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      user: {
        userId: user.userId,
        name: user.name,
        tokens: user.tokens || 0,  // ดึง tokens จาก DB
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
