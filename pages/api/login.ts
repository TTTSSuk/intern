// \pages\api\login.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    (res as any).setHeader('Allow', ['POST']);
    return (res as any).status(405).json({ message: `Method ${req.method} not allowed` });
  }

  const { userId, password } = req.body;

  if (!userId || !password) {
    return (res as any).status(400).json({ message: 'กรุณาระบุ userId และ password' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('login-form-app');

    // ค้นหา user ในฐานข้อมูล
    const user = await db.collection('users').findOne({ userId });

    if (!user) {
      return (res as any).status(401).json({ message: 'User ไม่ถูกต้อง' });
    }

    // ✅ ตรวจสอบว่าบัญชีถูกระงับ
    if (user.isSuspended) {
      return (res as any).status(403).json({ message: 'บัญชีนี้ถูกระงับการใช้งาน' });
    }

    // ✅ ตรวจสอบว่าบัญชีถูกปิดการใช้งาน
    if (user.isActive === false) {
  return (res as any).status(403).json({ message: 'บัญชีนี้ถูกปิดการใช้งาน' });
}

    // เปรียบเทียบรหัสผ่าน (ยังเป็น plain text)
    if (user.password !== password) {
      return (res as any).status(401).json({ message: 'Password ไม่ถูกต้อง' });
    }

    // อัปเดต lastActive เป็นเวลาปัจจุบัน
    await db.collection('users').updateOne(
      { userId },
      { $set: { lastActive: new Date() } }
    );

    // ส่ง userId + name กลับ
    return (res as any).status(200).json({
      success: true,
      userId: user.userId,
      name: user.name || '',
    });
  } catch (error) {
    console.error(error);
    return (res as any).status(500).json({ message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
  }
}
