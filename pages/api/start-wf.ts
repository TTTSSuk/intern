// pages/api/start-wf.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

type Data = {
  _id?: string;
  executionId?: string;
  error?: string;
  message?: string;
};

interface ExecutionRecord {
  executionId: string;
  status: string;
  startTime: Date;
  // endTime?: Date;
  updatedAt: Date;
  // duration?: number;
  error?: string;
}

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

    const startTime = new Date();

    // บันทึก executionId, status, startTime ลง MongoDB (แบบเดิม)
    await saveToDatabase(_id, executionId, 'started', startTime);

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

// ฟังก์ชันบันทึกข้อมูลลง MongoDB (ไม่อัพเดท updatedAt ที่ระดับบน)
async function saveToDatabase(
  _id: string,
  executionId: string,
  status?: string,
  startTime?: Date,
) {
  try {
    const client = await clientPromise;
    const db = client.db('login-form-app');
    const collection = db.collection('listfile');

    const updateDoc: any = {};

    if (status === 'started') {
      updateDoc.executionId = executionId;
      updateDoc.startTime = startTime ?? new Date();
    }

    await collection.updateOne(
      { _id: new ObjectId(_id) },
      { 
        $set: updateDoc,
        $unset: {
          executionHistory: ""
        }
      },
      { upsert: true }
    );

    console.log('💾 Saved to database successfully');
  } catch (error) {
    console.error('❌ Error saving to database:', error);
  }
}

// ฟังก์ชันสำหรับอัพเดท history เมื่อเสร็จสิ้น (เรียกใช้จาก status-wf.ts)
export async function updateExecutionHistory(
  _id: string,
  executionId: string,
  startTime: Date,
  workflowStatus: string,
  error?: string
) {
  try {
    const client = await clientPromise;
    const db = client.db('login-form-app');
    const collection = db.collection('listfile');

    const now = new Date();

    // เตรียมข้อมูล object ที่จะเก็บใน executionIdHistory
    const newHistory = {
      executionId,
      startTime,
      endTime: now, // เวลาที่ workflow เสร็จสิ้น
      workflowStatus,
      // updatedAt: now,  <-- เอาออกตามที่ขอ
      ...(error && { error }),
    };

    await collection.updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: {
          executionIdHistory: newHistory,
        },
        $unset: {
          executionId: "",
          startTime: "",
          workflowStatus: "",
          error: "",
          updatedAt: "",
          executionHistory: ""
        }
      }
    );

    console.log('✅ executionIdHistory updated and all unwanted fields removed successfully');
  } catch (err) {
    console.error('❌ Error updating executionIdHistory:', err);
  }
}
