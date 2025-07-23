// \pages\api\start-wf.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

type Data = {
  _id?: string;
  executionId?: string;
  error?: string;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { _id } = req.body;

  if (!_id) {
    return res.status(400).json({ error: '_id is required' });
  }

  try {
    console.log('🚀 Starting workflow for file:', _id);

    // เรียก n8n webhook เพื่อเริ่ม workflow
    const response = await fetch('http://localhost:5678/webhook/start-wf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ _id }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📥 Response from n8n:', result);

    const executionId = result.executionId;
    if (!executionId) {
      throw new Error('No executionId received from n8n');
    }

    // บันทึก executionId และ _id ลง MongoDB โดยตรงเลย
    await saveToDatabase(_id, executionId);

    res.status(200).json({
      message: 'Workflow started and saved successfully!',
      executionId,
      _id,
    });

  } catch (err) {
    console.error('❌ Failed to start workflow:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to start workflow',
    });
  }
}

// ฟังก์ชันบันทึกข้อมูลลง MongoDB
async function saveToDatabase(_id: string, executionId: string) {
  try {
    const client = await clientPromise;
    const db = client.db('login-form-app'); // แก้ชื่อ DB ให้ตรงกับของคุณ
    const collection = db.collection('listfile'); // แก้ชื่อ collection ให้ตรงกับของคุณ

// ในฟังก์ชัน saveToDatabase แก้ filter เป็นแบบนี้
    await collection.updateOne(
  { _id: new ObjectId(_id) },   // แปลง _id string เป็น ObjectId
  { $set: { executionId, updatedAt: new Date() } },
  { upsert: true }
);

    console.log('💾 Saved to database successfully');
  } catch (error) {
    console.error('❌ Error saving to database:', error);
    // ไม่ throw error ต่อ เพราะ workflow เริ่มไปแล้ว
  }
}
