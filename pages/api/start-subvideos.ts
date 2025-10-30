import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return (res as any).status(405).json({ error: 'Method not allowed' });
  }

  // 🔥 เพิ่ม originalName ในการรับข้อมูล
  const { userId, selectedClipUrls, originalName } = req.body;

  if (!userId || !selectedClipUrls || !Array.isArray(selectedClipUrls)) {
    return (res as any).status(400).json({ error: 'userId and selectedClipUrls (array) are required' });
  }

  if (selectedClipUrls.length === 0) {
    return (res as any).status(400).json({ error: 'selectedClipUrls cannot be empty' });
  }

  // 🔥 เพิ่มการตรวจสอบ originalName
  if (!originalName || !originalName.trim()) {
    return (res as any).status(400).json({ error: 'originalName is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('login-form-app');
    const collection = db.collection('listfile');

    // สร้าง folder path
    const timestamp = Date.now();
    const folderName = `subvideos_${timestamp}`;
    const extractPath = `./uploads/extracted/${folderName}`;
    
    // สร้าง folder จริงๆ
    const fullPath = path.resolve(process.cwd(), extractPath);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ Created folder: ${fullPath}`);
    }

    // แปลง selectedClipUrls เป็น full container path
    const containerClipUrls = selectedClipUrls.map((clipUrl: string) => {
      if (clipUrl.startsWith('/extracted/')) {
        return clipUrl;
      }
      return `/extracted/${clipUrl}`;
    });

    // 🔥 สร้าง document พร้อม originalName
    const newDoc = {
      userId,
      jobType: 'subvideos',
      originalName: originalName.trim(), // 🔥 เพิ่มบรรทัดนี้
      selectedClipUrls, // เก็บ path เดิม
      folderName,
      extractPath,
      status: 'starting',
      createdAt: new Date(),
      updatedAt: new Date(),
      clips: []
    };

    const insertResult = await collection.insertOne(newDoc);
    const _id = insertResult.insertedId.toString();

    console.log(`✅ Created document with originalName: ${originalName.trim()}`);

    // แปลง path สำหรับ container
    const containerExtractPath = extractPath.replace(/^\.\/uploads\/extracted/, '/extracted');

    // เรียก n8n webhook
    const response = await fetch('http://localhost:5678/webhook/ffmpeg', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        _id,
        extractPath: containerExtractPath,
        selectedClipUrls: containerClipUrls,
        originalName: originalName.trim() // 🔥 ส่งไปยัง n8n ด้วย (ถ้าต้องการใช้)
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('🔥 Response from n8n ffmpeg:', result);

    const executionId = result.executionId || result.executionID;
    if (!executionId) {
      throw new Error('No executionId received from n8n');
    }

    const startTime = new Date();

    // อัปเดต status และสร้าง executionIdHistory (ไม่เก็บ executionId และ startTime ที่ root)
    await collection.updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: {
          status: 'processing',
          updatedAt: startTime,
          executionIdHistory: {
            executionId,
            startTime,
            workflowStatus: 'running'
          }
        }
      }
    );

    return (res as any).status(200).json({
      message: 'Subvideos workflow started successfully!',
      executionId,
      _id,
      folderName,
      extractPath,
      originalName: originalName.trim() // 🔥 ส่งกลับไปด้วย
    });

  } catch (err) {
    console.error('❌ Failed to start subvideos workflow:', err);
    return (res as any).status(500).json({
      error: err instanceof Error ? err.message : 'Failed to start workflow',
    });
  }
}