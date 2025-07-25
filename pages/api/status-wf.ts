// pages/api/status-wf.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { updateExecutionHistory } from './start-wf';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, executionId } = req.query;

  const apiKey = process.env.N8N_API_KEY;
  const apiBase = process.env.N8N_API_BASE_URL;

  if (!apiKey || !apiBase) {
    return res.status(500).json({ error: 'N8N API key or base URL is not configured' });
  }

  try {
    let execId: string;
    let documentId: string | null = null;

    if (executionId) {
      execId = executionId as string;
      
      // หา document ID จาก executionId
      const client = await clientPromise;
      const db = client.db('login-form-app');
      const collection = db.collection('listfile');
      const doc = await collection.findOne({ executionId: execId });
      if (doc) {
        documentId = doc._id.toString();
      }
    } else if (id) {
      const client = await clientPromise;
      const db = client.db('login-form-app');
      const collection = db.collection('listfile');

      const doc = await collection.findOne({ _id: new ObjectId(id as string) });
      if (!doc) return res.status(404).json({ error: 'File not found' });
      if (!doc.executionId) return res.status(404).json({ error: 'No executionId found for this file' });

      execId = doc.executionId;
      documentId = id as string;
    } else {
      return res.status(400).json({ error: 'Missing id or executionId' });
    }

    console.log('Calling N8N API:', `${apiBase}/executions/${execId}`);

    const response = await fetch(`${apiBase}/executions/${execId}`, {
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('N8N API error:', response.status, errorText);
      return res.status(response.status).json({ error: `N8N API error: ${errorText}` });
    }

    const data = await response.json();
    console.log('N8N execution data:', data);

    const rawStatus: string = (data.status ?? '').toLowerCase() || 'unknown';
    let finished: boolean = data.finished ?? false;

    // ถ้าเจอสถานะ error ให้ถือว่า finished = true เพื่อหยุด polling
    if (rawStatus === 'error' || rawStatus === 'failed') {
      finished = true;
    }

    let status: 'idle' | 'starting' | 'running' | 'succeeded' | 'error' | 'unknown' = 'unknown';

    if (finished) {
      if (rawStatus === 'success' || rawStatus === 'succeeded') status = 'succeeded';
      else if (rawStatus === 'error' || rawStatus === 'failed') status = 'error';
      else status = 'error'; // fallback
    } else {
      if (rawStatus === 'running' || rawStatus === 'pending' || rawStatus === 'inprogress') status = 'running';
      else if (rawStatus === 'idle' || rawStatus === 'waiting') status = 'idle';
      else status = 'running';
    }

    // 🔄 อัปเดตสถานะตามระบบใหม่
    if (documentId && finished) {
      // 🎯 เมื่อเสร็จสิ้น: อัพเดท history ด้วยข้อมูลครบถ้วน
      console.log(`🏁 Workflow finished with status: ${status}`);
      
      const finalStatus = status === 'succeeded' ? 'completed' : 'error';
      const errorMessage = status === 'error' ? getErrorMessage(data) : undefined;
      
      // อัพเดท history ผ่านฟังก์ชันใหม่
      await updateExecutionHistory(documentId, execId, finalStatus, errorMessage);
    } else {
      // 📝 ระหว่างรันหรือไม่มี documentId: ใช้วิธีเดิม
      const client = await clientPromise;
      const db = client.db('login-form-app');
      const collection = db.collection('listfile');

      const updateFields: any = {
        workflowStatus: status,
        updatedAt: new Date(),
      };

      await collection.updateOne(
        { executionId: execId },
        { $set: updateFields }
      );
    }

    return res.status(200).json({ 
      status, 
      executionId: execId, 
      finished,
      ...(documentId && { documentId })
    });
  } catch (error) {
    console.error('Internal server error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// 🔍 ฟังก์ชันสำหรับดึงข้อความ error จาก n8n response
function getErrorMessage(data: any): string | undefined {
  try {
    // ลองหาข้อความ error ในโครงสร้างข้อมูลต่างๆ
    if (data.data?.resultData?.error?.message) {
      return data.data.resultData.error.message;
    }
    
    if (data.data?.resultData?.lastNodeExecuted && data.data?.resultData?.error) {
      const lastNode = data.data.resultData.lastNodeExecuted;
      return `Error in node '${lastNode}': ${data.data.resultData.error.message || 'Unknown error'}`;
    }
    
    if (data.stoppedAt && data.data?.resultData?.error) {
      return data.data.resultData.error.message || 'Workflow stopped with error';
    }
    
    // ถ้าไม่เจอข้อความ error ที่ชัดเจน
    if (data.status === 'error' || data.status === 'failed') {
      return 'Workflow execution failed';
    }
    
    return undefined;
  } catch (err) {
    console.warn('Failed to extract error message:', err);
    return 'Unknown error occurred';
  }
}