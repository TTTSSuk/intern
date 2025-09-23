//pages\api\status-wf.ts
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
    const db = client.db('working2');
    const collection = db.collection('listfile');

    let execId: string;
    let documentId: string | null = null;
    let doc: any = null;

    // หา document ตาม executionId หรือ id
    if (executionId) {
      execId = executionId as string;
      doc = await collection.findOne({ executionId: execId });
      if (doc) documentId = doc._id.toString();
    } else if (id) {
      if (!ObjectId.isValid(id as string)) return (res as any).status(400).json({ error: 'Invalid file ID format' });

      doc = await collection.findOne({ _id: new ObjectId(id as string) });
      if (!doc) return (res as any).status(404).json({ error: 'File not found', executionId: null, status: 'idle' });

      if (!doc.executionId) return (res as any).status(200).json({ executionId: null, status: 'idle', finished: false, documentId: id });

      execId = doc.executionId;
      documentId = id as string;
    } else {
      return (res as any).status(400).json({ error: 'Missing id or executionId' });
    }

    // เรียก N8N API
    const response = await fetch(`${apiBase}/executions/${execId}`, {
      headers: { 'X-N8N-API-KEY': apiKey, 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 404) return (res as any).status(200).json({ executionId: execId, status: 'idle', finished: true, documentId });
      return (res as any).status(response.status).json({ error: `N8N API error: ${errorText}` });
    }

    const data = await response.json();
    const rawStatus: string = (data.status ?? '').toLowerCase() || 'unknown';
    let finished: boolean = data.finished ?? false;
    if (['error', 'failed'].includes(rawStatus)) finished = true;

    let status: 'idle' | 'starting' | 'running' | 'succeeded' | 'error' | 'unknown' = 'unknown';
    if (finished) {
      status = rawStatus === 'success' || rawStatus === 'succeeded' ? 'succeeded' : 'error';
    } else {
      status = ['running','pending','inprogress'].includes(rawStatus) ? 'running' :
               ['idle','waiting'].includes(rawStatus) ? 'idle' : 'running';
    }

    // 🔹 ดึง clips จาก MongoDB เสมอ
let clips: { video?: string; finalVideo?: string; createdAt?: Date }[] = doc?.clips ?? [];
console.log(`[status-wf] fileId: ${documentId}, execId: ${execId}, status: ${status}, finished: ${finished}`);


    // 🔹 update history ถ้า workflow finished
    if (documentId && finished) {
      const finalStatus = status === 'succeeded' ? 'completed' : 'error';
      const errorMessage = status === 'error' ? getErrorMessage(data) : undefined;
      const startTime = doc?.startTime || new Date();
      await updateExecutionHistory(documentId, execId, startTime, finalStatus, errorMessage);
    }

    return (res as any).status(200).json({ status, executionId: execId, finished, ...(documentId && { documentId }), clips });

  } catch (error) {
    console.error('Internal server error:', error);
    return (res as any).status(500).json({ error: 'Internal Server Error' });
  }
}

function getErrorMessage(data: any): string | undefined {
  try {
    if (data.data?.resultData?.error?.message) return data.data.resultData.error.message;
    if (data.data?.resultData?.lastNodeExecuted && data.data?.resultData?.error) {
      const lastNode = data.data.resultData.lastNodeExecuted;
      return `Error in node '${lastNode}': ${data.data.resultData.error.message || 'Unknown error'}`;
    }
    if (data.stoppedAt && data.data?.resultData?.error) return data.data.resultData.error.message || 'Workflow stopped with error';
    if (['error','failed'].includes(data.status)) return 'Workflow execution failed';
    return undefined;
  } catch (err) {
    console.warn('Failed to extract error message:', err);
    return 'Unknown error occurred';
  }
}
