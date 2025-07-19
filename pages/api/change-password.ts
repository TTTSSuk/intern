// pages/api/change-password.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  const { currentPassword, newPassword } = req.body;

  // ตัวอย่างดึง userId จาก header หรือ body หรือ session (ตอนนี้สมมติว่า userId ส่งมาด้วย body)
  const userId = req.body.userId || '';

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ message: 'กรุณาส่ง userId, รหัสผ่านปัจจุบัน และรหัสผ่านใหม่ให้ครบ' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('login-form-app');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ userId });

    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }

    if (user.password !== currentPassword) {
      return res.status(401).json({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    }

    // อัปเดตรหัสผ่านใหม่
    await usersCollection.updateOne(
      { userId },
      { $set: { password: newPassword } }
    );

    return res.status(200).json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
  }
}
