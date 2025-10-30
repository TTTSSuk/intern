import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return (res as any).status(405).json({ status: 'Method not allowed' });
  }

  const { executionId, finalVideo, status: workflowStatus } = req.body;
  
  if (!executionId) {
    return (res as any).status(400).json({ status: 'error', message: 'Missing executionId' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('login-form-app');
    const listFileCollection = db.collection('listfile');

    // 🔥 แก้ไข: ค้นหาจาก executionIdHistory.executionId แทน
    const doc = await listFileCollection.findOne({ 
      'executionIdHistory.executionId': executionId 
    });
    
    if (!doc) {
      console.error(`❌ Document with executionId ${executionId} not found`);
      return (res as any).status(404).json({ status: 'error', message: 'Document not found' });
    }

    const updateData: any = {};

    // ถ้ามี finalVideo = workflow สำเร็จ
    if (finalVideo) {
      updateData.$push = {
        clips: {
          finalVideo,
          createdAt: new Date()
        } as any
      };
      updateData.$set = {
        status: 'completed',
        'executionIdHistory.endTime': new Date(),
        'executionIdHistory.workflowStatus': 'completed',
        updatedAt: new Date()
      };

      console.log(`✅ Subvideos job ${executionId} completed successfully`);
    } 
    // ถ้าไม่มี finalVideo แต่มี workflowStatus = 'error' = workflow ล้มเหลว
    else if (workflowStatus === 'error') {
      updateData.$set = {
        status: 'error',
        'executionIdHistory.endTime': new Date(),
        'executionIdHistory.workflowStatus': 'error',
        updatedAt: new Date()
      };

      console.log(`❌ Subvideos job ${executionId} failed`);
    }

    // อัปเดต document (ใช้ _id ในการอัปเดต)
    await listFileCollection.updateOne(
      { _id: doc._id },
      updateData
    );

    return (res as any).status(200).json({ status: 'success' });

  } catch (error) {
    console.error('❌ Error in callback-ffmpeg:', error);
    return (res as any).status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
}