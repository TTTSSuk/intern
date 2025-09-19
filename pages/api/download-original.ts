import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { fileId } = req.query;

  if (!fileId) {
    return (res as any).status(400).json({ message: 'File ID is required.' });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const videosCollection = db.collection('listfile');

    const fileData = await videosCollection.findOne({ _id: new ObjectId(fileId as string) });

    if (!fileData) {
      return (res as any).status(404).json({ message: 'File not found.' });
    }

    const originalName = fileData.originalName;
    const extractPathFromDB = fileData.extractPath;

    // เราจะใช้ path.join เพื่อสร้างเส้นทางที่ถูกต้อง
    // โดยเริ่มจาก root ของโปรเจกต์ (process.cwd()) แล้วตามด้วย extractPath ที่ดึงมาจากฐานข้อมูล
    // และต่อท้ายด้วยชื่อไฟล์ต้นฉบับ
    const originalFilePath = path.join(process.cwd(), extractPathFromDB, originalName);
    
    // ตรวจสอบว่าไฟล์มีอยู่จริง
    if (!fs.existsSync(originalFilePath)) {
      console.error(`❌ File not found at path: ${originalFilePath}`);
      return (res as any).status(404).json({ message: 'File not found on server.' });
    }

    // Set headers for file download
    (res as any).setHeader('Content-Type', 'application/zip');
    (res as any).setHeader('Content-Disposition', `attachment; filename="${originalName}"`);

    // Stream the file to the response
    const fileStream = fs.createReadStream(originalFilePath);
    fileStream.pipe(res as any);
  } catch (error) {
    console.error('❌ Error downloading file:', error);
    (res as any).status(500).json({ message: 'Failed to download file.' });
  }
}