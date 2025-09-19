import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return (res as any).status(405).json({ message: 'Method not allowed' });
  }

  const { fileId } = req.body;

  if (!fileId) {
    return (res as any).status(400).json({ message: 'Missing fileId' });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('listfile'); // หรือชื่อ collection จริง

    const result = await collection.updateOne(
      { _id: new ObjectId(fileId) },
      { $set: { status: 'deleted' } }
    );

    if (result.modifiedCount === 1) {
      return (res as any).status(200).json({ message: 'ลบไฟล์เรียบร้อย (อัปเดตสถานะ)' });
    } else {
      return (res as any).status(404).json({ message: 'ไม่พบไฟล์' });
    }
  } catch (error) {
    console.error(error);
    return (res as any).status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
}
