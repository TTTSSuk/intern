// pages/api/videos/active-status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return (res as any).status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;

  if (!userId) {
    return (res as any).status(400).json({ error: 'userId is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('login-form-app');
    const collection = db.collection('listfile');

    // ดึงเฉพาะงานที่มีสถานะ queued หรือ running
    const activeVideos = await collection
      .find({
        userId: userId as string,
        status: { $in: ['queued', 'running'] }
      })
      .sort({ createdAt: -1 }) // เรียงตามวันที่สร้างล่าสุด
      .limit(10) // จำกัดไม่เกิน 10 รายการ
      .toArray();

    // แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการ
    const formattedVideos = activeVideos.map(video => ({
      videoId: video._id.toString(),
      status: video.status,
      title: video.originalName || 'Untitled Video',
      createdAt: video.createdAt,
      queuePosition: video.queuePosition
    }));

    console.log(`📊 Active videos for user ${userId}: ${formattedVideos.length} jobs`);

    return (res as any).status(200).json({
      success: true,
      videos: formattedVideos
    });

  } catch (error) {
    console.error('❌ Error fetching active videos:', error);
    return (res as any).status(500).json({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}