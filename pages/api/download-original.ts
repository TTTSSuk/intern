// pages/api/download-original.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return (res as any).status(405).json({ message: 'Method not allowed' });
  }

  const { fileId } = req.query;

  if (!fileId || typeof fileId !== 'string') {
    return (res as any).status(400).json({ message: 'File ID is required' });
  }

  try {
    // เชื่อมต่อ MongoDB
    const client = await clientPromise;
    const db = client.db();
    const videosCollection = db.collection('listfile');

    // ค้นหาไฟล์จาก ID
    const file = await videosCollection.findOne({ 
      _id: new ObjectId(fileId),
      status: { $ne: 'deleted' }
    });

    if (!file) {
      return (res as any).status(404).json({ message: 'File not found' });
    }

    let zipFilePath: string | null = null;

    // ลำดับการค้นหาไฟล์
    if (file.originalFilePath) {
      // 1. ลองใช้ path ที่เก็บไว้ใน database
      if (path.isAbsolute(file.originalFilePath)) {
        // ถ้าเป็น absolute path ให้ลองเช็คว่ามีไฟล์อยู่หรือไม่
        if (fs.existsSync(file.originalFilePath)) {
          zipFilePath = file.originalFilePath;
        }
      } else {
        // ถ้าเป็น relative path
        const absolutePath = path.join(process.cwd(), file.originalFilePath);
        if (fs.existsSync(absolutePath)) {
          zipFilePath = absolutePath;
        }
      }
    }

    // 2. ถ้ายังหาไม่เจอ ลองหาใน uploads folder
    if (!zipFilePath) {
      const uploadsPath = path.join(process.cwd(), 'uploads', file.originalName);
      if (fs.existsSync(uploadsPath)) {
        zipFilePath = uploadsPath;
      }
    }

    // 3. ถ้ายังหาไม่เจอ ลองหาทุกไฟล์ใน uploads folder ที่ชื่อตรงกัน
    if (!zipFilePath) {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        // หาไฟล์ที่มีชื่อต้นฉบับตรงกัน (เช่น acw16otsfdmo9aefyomsuc3x0.zip)
        const matchedFile = files.find(f => 
          f.endsWith('.zip') && 
          fs.statSync(path.join(uploadsDir, f)).isFile()
        );
        
        if (matchedFile) {
          // เรียงตาม modified time แล้วเอาไฟล์ล่าสุด
          const zipFiles = files
            .filter(f => f.endsWith('.zip'))
            .map(f => ({
              name: f,
              path: path.join(uploadsDir, f),
              time: fs.statSync(path.join(uploadsDir, f)).mtime
            }))
            .sort((a, b) => b.time.getTime() - a.time.getTime());
          
          if (zipFiles.length > 0) {
            zipFilePath = zipFiles[0].path;
          }
        }
      }
    }

    // ถ้าหาไม่เจอเลย
    if (!zipFilePath || !fs.existsSync(zipFilePath)) {
      console.error(`❌ File not found. Tried paths:
        - ${file.originalFilePath}
        - ${path.join(process.cwd(), 'uploads', file.originalName)}
      `);
      return (res as any).status(404).json({ 
        message: 'ไม่พบไฟล์ต้นฉบับบนเซิร์ฟเวอร์',
        details: 'ไฟล์อาจถูกลบหรือย้ายไปแล้ว'
      });
    }

    // อ่านไฟล์
    const fileBuffer = fs.readFileSync(zipFilePath);
    
    // ตั้งค่า headers สำหรับการดาวน์โหลด
    (res as any).setHeader('Content-Type', 'application/zip');
    (res as any).setHeader(
      'Content-Disposition', 
      `attachment; filename="${encodeURIComponent(file.originalName)}"`
    );
    (res as any).setHeader('Content-Length', fileBuffer.length);

    // ส่งไฟล์กลับไป
    return (res as any).status(200).send(fileBuffer);

  } catch (error) {
    console.error('❌ Error downloading file:', error);
    return (res as any).status(500).json({ message: 'เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์' });
  }
}