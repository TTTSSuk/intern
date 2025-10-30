import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, executionId } = req.query;

  const apiKey = process.env.N8N_API_KEY;
  const apiBase = process.env.N8N_API_BASE_URL;

  if (!apiKey || !apiBase) {
    return (res as any).status(500).json({ error: 'N8N API key or base URL is not configured' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('login-form-app');
    const collection = db.collection('listfile');

    let doc: any = null;

    if (executionId) {
      // ค้นหาจาก executionIdHistory.executionId แทน
      doc = await collection.findOne({ 'executionIdHistory.executionId': executionId as string });
    } else if (id) {
      if (!ObjectId.isValid(id as string)) {
        return (res as any).status(400).json({ error: 'Invalid ID format' });
      }
      doc = await collection.findOne({ _id: new ObjectId(id as string) });
    } else {
      return (res as any).status(400).json({ error: 'ID or execution ID is required' });
    }

    if (!doc) {
      return (res as any).status(404).json({ error: 'Job not found' });
    }

    // ถ้างานเสร็จแล้ว return ทันที
    if (doc.status === 'completed' || doc.status === 'error') {
      return (res as any).status(200).json({
        status: doc.status,
        finished: true,
        clips: doc.clips || [],
        selectedClipUrls: doc.selectedClipUrls || [],
        executionIdHistory: doc.executionIdHistory || null
      });
    }

    // เช็คสถานะจาก n8n
    const execId = doc.executionIdHistory?.executionId;
    if (!execId) {
      return (res as any).status(200).json({
        status: doc.status || 'starting',
        finished: false,
        executionIdHistory: doc.executionIdHistory || null
      });
    }

    const n8nUrl = `${apiBase}/executions/${execId}`;
    const n8nRes = await fetch(n8nUrl, {
      headers: {
        'X-N8N-API-KEY': apiKey,
      },
    });

    if (!n8nRes.ok) {
      throw new Error(`N8N API error: ${n8nRes.status}`);
    }

    const data = await n8nRes.json();
    const n8nStatus = data.status;
    const finished = data.finished;

    // อัปเดต status ถ้างานเสร็จ
    if (finished) {
      const finalStatus = n8nStatus === 'success' ? 'completed' : 'error';
      const endTime = new Date();
      
      await collection.updateOne(
        { _id: doc._id },
        {
          $set: {
            status: finalStatus,
            'executionIdHistory.endTime': endTime,
            'executionIdHistory.workflowStatus': finalStatus,
            updatedAt: endTime
          },
          $unset: {
            executionId: "",
            startTime: ""
          }
        }
      );

      // ดึงข้อมูลใหม่หลังอัปเดต
      const updatedDoc = await collection.findOne({ _id: doc._id });

      return (res as any).status(200).json({
        status: finalStatus,
        finished: true,
        clips: updatedDoc?.clips || [],
        selectedClipUrls: updatedDoc?.selectedClipUrls || [],
        executionIdHistory: updatedDoc?.executionIdHistory || null
      });
    }

    return (res as any).status(200).json({
      status: 'processing',
      finished: false,
      clips: doc.clips || [],
      selectedClipUrls: doc.selectedClipUrls || [],
      executionIdHistory: doc.executionIdHistory || null
    });

  } catch (error) {
    console.error('❌ Error checking status:', error);
    return (res as any).status(500).json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}