// pages/api/status-unified.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { updateExecutionHistory } from './start-wf';

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
    const tokenHistoryCollection = db.collection('token_history');

    let doc: any = null;

    // 🔍 ค้นหา document
    if (executionId) {
      doc = await collection.findOne({ 
        'executionIdHistory.executionId': executionId as string 
      });
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

    const jobType = doc.jobType || 'normal'; // 'normal' หรือ 'subvideos'
    const execId = doc.executionIdHistory?.executionId;

    console.log(`📋 Job Type: ${jobType}, Status: ${doc.status}, ExecId: ${execId}`);

    // ✅ ถ้างานยังอยู่ใน queue
    if (doc.status === 'queued' && !execId) {
      return (res as any).status(200).json({
        status: 'queued',
        jobType,
        queuePosition: doc.queuePosition,
        clips: doc.clips || [],
        selectedClipUrls: doc.selectedClipUrls || [],
        originalName: doc.originalName,
        tokensReserved: doc.tokensReserved,
        createdAt: doc.createdAt,
        folders: doc.folders
      });
    }

    // ✅ ถ้างานเสร็จแล้วและมี executionIdHistory
    if (['completed', 'succeeded', 'error'].includes(doc.status) && doc.executionIdHistory) {
      return (res as any).status(200).json({
        status: doc.status,
        jobType,
        finished: true,
        executionId: execId,
        clips: doc.clips || [],
        selectedClipUrls: doc.selectedClipUrls || [],
        folders: doc.folders || [],
        originalName: doc.originalName,
        tokensReserved: doc.tokensReserved,
        createdAt: doc.createdAt,
        executionIdHistory: doc.executionIdHistory
      });
    }

    // ✅ ถ้ายังไม่มี executionId ให้ return สถานะปัจจุบัน
    if (!execId) {
      return (res as any).status(200).json({
        status: doc.status || 'queued',
        jobType,
        finished: false,
        queuePosition: doc.queuePosition,
        clips: doc.clips || [],
        selectedClipUrls: doc.selectedClipUrls || [],
        originalName: doc.originalName,
        tokensReserved: doc.tokensReserved,
        createdAt: doc.createdAt,
        folders: doc.folders
      });
    }

    // 🌐 เรียก N8N API เพื่อตรวจสอบสถานะ
    const n8nUrl = `${apiBase}/executions/${execId}`;
    const n8nRes = await fetch(n8nUrl, {
      headers: { 'X-N8N-API-KEY': apiKey },
    });

    if (n8nRes.status === 404) {
      console.warn(`⚠️ Execution ${execId} not found on N8N`);
      const startTime = doc?.startTime || new Date();
      
      // 🔥 คืน token ถ้าเป็น jobType normal
      if (jobType === 'normal') {
        await cleanupTokenReservation(doc.userId, doc._id, tokenHistoryCollection);
      }
      
      await updateExecutionHistory(doc._id.toString(), execId, startTime, 'error', 'Execution not found on N8N.');
      
      return (res as any).status(200).json({
        status: 'error',
        jobType,
        finished: true,
        executionId: execId
      });
    }

    if (!n8nRes.ok) {
      throw new Error(`N8N API error: ${n8nRes.status}`);
    }

    const data = await n8nRes.json();
    const n8nStatus = data.status;
    const finished = data.finished;
    const clipsFromN8N = data.data?.resultData?.clips;
    const foldersFromN8N = data.data?.resultData?.folders;

    console.log(`📊 N8N Status: ${n8nStatus}, Finished: ${finished}`);

    // 🔥 อัปเดต DB ถ้างานเสร็จ
    if (finished || ['error', 'succeeded', 'failed'].includes(n8nStatus)) {
      let finalStatus: string;
      let errorMessage: string | undefined;

      if (n8nStatus === 'succeeded' || n8nStatus === 'success') {
        finalStatus = 'completed';
        
        // 🔥 ลบ token reservation เฉพาะ jobType normal
        if (jobType === 'normal') {
          await cleanupTokenReservation(doc.userId, doc._id, tokenHistoryCollection);
        }
      } else if (['error', 'failed'].includes(n8nStatus)) {
        finalStatus = 'error';
        errorMessage = getErrorMessage(data);
        
        // 🔥 คืน token เฉพาะ jobType normal
        if (jobType === 'normal') {
          await cleanupTokenReservation(doc.userId, doc._id, tokenHistoryCollection);
        }
      } else if (finished && n8nStatus === 'running') {
        finalStatus = 'completed';
        
        if (jobType === 'normal') {
          await cleanupTokenReservation(doc.userId, doc._id, tokenHistoryCollection);
        }
      } else {
        finalStatus = n8nStatus;
        errorMessage = n8nStatus === 'error' ? getErrorMessage(data) : undefined;
      }

      const startTime = doc?.startTime || new Date();

      await updateExecutionHistory(
        doc._id.toString(),
        execId,
        startTime,
        finalStatus,
        errorMessage,
        clipsFromN8N,
        foldersFromN8N
      );

      await collection.updateOne(
        { _id: doc._id },
        { $unset: { error: '' } }
      );

      console.log(`✅ Updated to final status: ${finalStatus}`);
    }

    let responseStatus = n8nStatus;
    if (finished && (n8nStatus === 'succeeded' || n8nStatus === 'success')) {
      responseStatus = 'completed';
    } else if (finished && ['error', 'failed'].includes(n8nStatus)) {
      responseStatus = 'error';
    }

    return (res as any).status(200).json({
      status: responseStatus,
      jobType,
      executionId: execId,
      finished,
      clips: clipsFromN8N || doc.clips || [],
      selectedClipUrls: doc.selectedClipUrls || [],
      folders: foldersFromN8N || doc.folders || [],
      originalName: doc.originalName,
      tokensReserved: doc.tokensReserved,
      createdAt: doc.createdAt
    });

  } catch (error) {
    console.error('❌ Error in status-unified:', error);
    return (res as any).status(500).json({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// 🔥 ฟังก์ชันสำหรับลบ token reservation
async function cleanupTokenReservation(userId: string, zipId: ObjectId, tokenHistoryCollection: any) {
  try {
    const result = await tokenHistoryCollection.deleteOne({
      userId,
      zipId,
      type: 'token_reserved'
    });
    
    if (result.deletedCount > 0) {
      console.log(`✅ Cleaned up token reservation for user ${userId}`);
    }
  } catch (error) {
    console.error(`❌ Error cleaning up token reservation:`, error);
  }
}

function getErrorMessage(data: any): string | undefined {
  try {
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
    if (['error', 'stopped', 'failed'].includes(data.status)) {
      return `Workflow ended with status: ${data.status}`;
    }
  } catch (err) {
    console.error('Failed to parse error message', err);
  }
  return 'Unknown workflow error';
}