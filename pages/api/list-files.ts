// pages/api/list-files.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import path from 'path';
import { readFolderRecursive, Folder } from '@/lib/readFolderRecursive';

interface VideoFile {
  _id: string;
  userId: string;
  originalName: string;
  extractPath: string;
  status: 'pending' | 'processing' | 'done' | 'error' | 'deleted';
  createdAt: string;
  folders?: Folder[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : 'anonymous';

    const client = await clientPromise;
    const db = client.db();
    const videosCollection = db.collection('listfile');

    // ดึงข้อมูลจาก MongoDB โดยกรองไฟล์ที่สถานะไม่ใช่ 'deleted'
    const rawFiles = await videosCollection
      .find({ userId, status: { $ne: 'deleted' } })
      .sort({ createdAt: -1 })
      .toArray();

    // แปลงข้อมูลดิบให้ตรงกับ interface VideoFile
    const files: VideoFile[] = rawFiles.map(doc => ({
      _id: doc._id.toString(),
      userId: doc.userId,
      originalName: doc.originalName,
      extractPath: doc.extractPath,
      status: doc.status,
      createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : doc.createdAt.toISOString(),
    }));

    // อ่านโครงสร้างโฟลเดอร์และไฟล์จาก disk สำหรับแต่ละ record
    const filesWithFolders = files.map((file) => {
      const fullExtractPath = path.resolve(process.cwd(), file.extractPath);
      let folders: Folder = { files: [], subfolders: [] };

      try {
        folders = readFolderRecursive(fullExtractPath);
      } catch (err) {
        console.error(`Error reading folder for file ${file._id}:`, err);
      }

      return {
        ...file,
        folders: [{ name: path.basename(fullExtractPath), ...folders }],
      };
    });

    return res.status(200).json({ files: filesWithFolders });
  } catch (error) {
    console.error('❌ Error fetching files:', error);
    return res.status(500).json({ message: 'Failed to fetch files' });
  }
}
