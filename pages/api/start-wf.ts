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

// ฟังก์ชันบันทึกข้อมูลลง MongoDB (แบบเดิม + เพิ่ม history)
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

    // ดึงเอกสารเดิม
    const doc = await collection.findOne({ _id: new ObjectId(_id) });

    let executionHistory: any[] = [];
    if (doc?.executionHistory && Array.isArray(doc.executionHistory)) {
      // 🔧 แปลงประวัติเก่าให้เป็น object หากเป็น string
      executionHistory = doc.executionHistory.map((item: any) => {
        if (typeof item === 'string') {
          return {
            executionId: item,
            status: 'unknown',
            startTime: new Date(0),
            updatedAt: new Date(0),
          };
        }
        return item;
      });
    }

    // 👇 เพิ่มรายละเอียดลงในประวัติ (แบบเดิม)
    const newExecution = {
      executionId,
      status: status ?? 'started',
      startTime: startTime ?? new Date(),
      updatedAt: new Date(),
    };

    executionHistory.push(newExecution);

    const updateDoc: any = {
      executionId,           // ตัวล่าสุด
      executionHistory,      // ประวัติทั้งหมด
      updatedAt: new Date(),
    };

    if (status) updateDoc.workflowStatus = status;
    if (startTime) updateDoc.startTime = startTime;

    await collection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateDoc },
      { upsert: true }
    );

    console.log('💾 Saved to database successfully');
  } catch (error) {
    console.error('❌ Error saving to database:', error);
  }
}

// 🆕 ฟังก์ชันสำหรับอัพเดท history เมื่อเสร็จสิ้น (เรียกใช้จาก status-wf.ts)
export async function updateExecutionHistory(
  _id: string,
  executionId: string,
  finalStatus: string,
  error?: string
) {
  try {
    const client = await clientPromise;
    const db = client.db('login-form-app');
    const collection = db.collection('listfile');

    // ดึงเอกสารปัจจุบัน
    const doc = await collection.findOne({ _id: new ObjectId(_id) });
    
    if (!doc) {
      console.warn('⚠️ Document not found');
      return;
    }

    // ตรวจสอบว่า executionId ตรงกันไหม
    if (doc.executionId !== executionId) {
      console.warn(`⚠️ ExecutionId mismatch: expected ${doc.executionId}, got ${executionId}`);
      return;
    }

    // const endTime = new Date();
    const startTime = new Date(doc.startTime);
    // const duration = endTime.getTime() - startTime.getTime();

    // อัพเดท executionHistory โดยหารายการล่าสุดและอัพเดท
    let executionHistory = doc.executionHistory || [];
    
    // หารายการที่ต้องอัพเดท (รายการล่าสุดที่มี executionId ตรงกัน)
    const updatedHistory = executionHistory.map((item: any, index: number) => {
      // อัพเดทรายการล่าสุดที่ตรงกับ executionId
      if (index === executionHistory.length - 1 && item.executionId === executionId) {
        return {
          ...item,
          status: finalStatus,
          // endTime,
          // duration,
          updatedAt: new Date(),
          ...(error && { error }),
        };
      }
      return item;
    });

    const updateDoc: any = {
      workflowStatus: finalStatus,
      // endTime,
      // duration,
      executionHistory: updatedHistory,
      updatedAt: new Date(),
      ...(error && { error }),
    };

    await collection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateDoc }
    );

    console.log('✅ Execution history updated successfully');
    console.log(`📊 Final status: ${finalStatus}`);
    // console.log(`⏱️ Duration: ${duration}ms`);
  } catch (error) {
    console.error('❌ Error updating execution history:', error);
  }
}