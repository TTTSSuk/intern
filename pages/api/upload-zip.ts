// D\pages\api\upload-zip.ts
import type { NextApiRequest, NextApiResponse } from 'next'; 
import formidable from 'formidable';
import fs from 'fs';
import AdmZip from 'adm-zip';
import clientPromise from '@/lib/mongodb';
import { readFolderRecursive } from '@/lib/readFolderRecursive'; // import เพิ่ม
import { ObjectId } from 'mongodb';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return (res as any).status(405).json({ message: 'Method not allowed' });
  }

  const form = formidable({ uploadDir: './uploads', keepExtensions: true });

  if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads', { recursive: true });
  }

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('❌ Form parse error:', err);
      return (res as any).status(500).json({ message: 'Form parsing error' });
    }

    try {
      const userId = Array.isArray(fields.userId) ? fields.userId[0] : fields.userId || 'anonymous';

      const zipFiles = files.zipfile;
      if (!zipFiles || (Array.isArray(zipFiles) && zipFiles.length === 0)) {
        return (res as any).status(400).json({ message: 'No file uploaded' });
      }
      const zipFile = Array.isArray(zipFiles) ? zipFiles[0] : zipFiles;

      // แตกไฟล์ ZIP
      const zip = new AdmZip(zipFile.filepath);
      const extractPath = `./uploads/extracted/${Date.now()}`;
      fs.mkdirSync(extractPath, { recursive: true });
      zip.extractAllTo(extractPath, true);
      // fs.unlinkSync(zipFile.filepath);

      // อ่านโครงสร้างโฟลเดอร์และไฟล์
      const folderStructure = readFolderRecursive(extractPath);

      // เชื่อมต่อ MongoDB
      const client = await clientPromise;
      const db = client.db();
      const videosCollection = db.collection('listfile');

      // สร้าง document ใหม่เก็บข้อมูลไฟล์ พร้อมโครงสร้างโฟลเดอร์
      const videoDoc = {
        userId,
        originalName: zipFile.originalFilename || 'unknown.zip',
        extractPath,
        status: 'done',  // เปลี่ยนเป็น done
        createdAt: new Date(),
        folders: folderStructure,
      };
      await videosCollection.insertOne(videoDoc);

      return (res as any).status(200).json({ message: 'แตกไฟล์ ZIP สำเร็จ', path: extractPath });
    } catch (error) {
      console.error('❌ Extract error:', error);
      return (res as any).status(500).json({ message: 'Error extracting ZIP' });
    }
  });
}