// pages/api/users/update.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, Fields, Files } from 'formidable';
import fs from 'fs';
import path from 'path';
import clientPromise from '@/lib/mongodb'; // เพิ่ม import เชื่อม DB

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return (res as any).status(405).json({ message: 'Method not allowed' });
  }

  const uploadDir = path.join(process.cwd(), '/public/uploads');

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = new IncomingForm({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024,
  });

  form.parse(req, async (err: any, fields: Fields, files: Files) => {
    if (err) {
      console.error('Form parse error:', err);
      return (res as any).status(500).json({ message: 'Error parsing the form' });
    }

    const name = fields.name?.toString() || '';
    const userId = fields.userId?.toString() || '';

    let avatarUrl = '';
    const avatarRaw = files.avatar;

    if (avatarRaw) {
      const avatarFile = Array.isArray(avatarRaw) ? avatarRaw[0] : avatarRaw;
      avatarUrl = `/uploads/${avatarFile.newFilename}`;
    }

    try {
      const client = await clientPromise;
      const db = client.db('login-form-app');
      const usersCollection = db.collection('users');

      const updateData: any = { name };
      if (avatarUrl) updateData.avatarUrl = avatarUrl;

      const result = await usersCollection.updateOne(
        { userId },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return (res as any).status(404).json({ message: 'ไม่พบผู้ใช้' });
      }

      return (res as any).status(200).json({
        message: 'โปรไฟล์ถูกอัปเดตแล้ว',
        avatarUrl,
      });
    } catch (error) {
      console.error(error);
      return (res as any).status(500).json({ message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
    }
  });
}
