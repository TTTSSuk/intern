// pages/api/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return (res as any).status(405).json({ status: 'Method not allowed' });
  }

  interface Clip {
    video?: string; // relative path
    finalVideo?: string;  // เพิ่มตรงนี้
    createdAt: Date;
    // isFinal?: boolean;    // ถ้าเป็น final video จะ true
  }

  interface FileDoc {
    executionId: string;
    clips: Clip[];
    status?: string;
  }

  const { executionId, video, resultVideo } = req.body;

  console.log(`[callback] executionId: ${executionId}, video: ${video}, resultVideo: ${resultVideo}`);
  
  if (!executionId || (!video && !resultVideo)) {
    return (res as any).status(400).json({ status: 'error', message: 'Missing required fields' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('login-form-app');
    const collection = db.collection<FileDoc>('listfile');

    if (video) {
    // update หรือ insert document
    await collection.updateOne(
      { executionId },
      {
        $push: { clips: { video, createdAt: new Date() } },
        $set: { status: 'running' }
      },
      { upsert: true }
    );
  }

if (resultVideo) {
  await collection.updateOne(
    { executionId },
    {
      $push: { clips: { finalVideo: resultVideo, createdAt: new Date() } },
      $set: { status: 'completed' }
    },
    { upsert: true }
  );
}

    return (res as any).status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('❌ MongoDB Error:', err);
    
    return (res as any).status(500).json({ status: 'error', message: 'Failed to update DB' });
  }
}
