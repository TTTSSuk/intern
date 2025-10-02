// //pages/api/status-wf.ts - Fixed Version
//pages/api/status-wf.ts - With Token Cleanup
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { updateExecutionHistory } from './start-wf';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, executionId } = req.query;

  console.log(`🔍 Status check request - ID: ${id}, ExecutionId: ${executionId}`);

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

    let execId: string | undefined;
    let documentId: string | null = null;
    let doc: any = null;

    if (executionId) {
      execId = executionId as string;
      doc = await collection.findOne({ executionId: execId });
      if (doc) documentId = doc._id.toString();
    } else if (id) {
      if (!ObjectId.isValid(id as string)) {
        return (res as any).status(400).json({ error: 'Invalid file ID format' });
      }
      doc = await collection.findOne({ _id: new ObjectId(id as string) });
      if (doc) documentId = doc._id.toString();
      execId = doc?.executionId;
    } else {
      return (res as any).status(400).json({ error: 'File ID or execution ID is required' });
    }
    
    if (!doc) {
      console.log(`❌ Document not found for ID: ${id || executionId}`);
      return (res as any).status(404).json({ error: 'File not found' });
    }

    console.log(`📄 Found document: ${documentId}, Status: ${doc.status}, ExecId: ${execId}`);
    
    if (!execId || ['queued', 'processing'].includes(doc.status)) {
      console.log(`⏳ Job is in queue/processing state - Status: ${doc.status}`);
      return (res as any).status(200).json({ 
        status: doc.status || 'queued',
        finished: false, 
        message: `Job is ${doc.status || 'queued'}`,
        queuePosition: doc.queuePosition,
        clips: doc.clips || []
      });
    }

    if (['completed', 'succeeded', 'error'].includes(doc.status) && doc.executionIdHistory) {
      return (res as any).status(200).json({
        status: doc.status,
        finished: true,
        executionId: execId,
        documentId,
        clips: doc.clips || [],
        folders: doc.folders || []
      });
    }

    const n8nUrl = `${apiBase}/executions/${execId}`;
    console.log(`🌐 Calling N8N API: ${n8nUrl}`);
    
    const n8nRes = await fetch(n8nUrl, {
      headers: {
        'X-N8N-API-KEY': apiKey,
      },
    });

    if (n8nRes.status === 404) {
      console.warn(`⚠️ Execution ${execId} not found on N8N, updating status to error`);
      const startTime = doc?.startTime || new Date();
      
      // 🔥 คืน token ที่จองไว้กลับให้ user
      await cleanupTokenReservation(doc.userId, doc._id, tokenHistoryCollection);
      
      await updateExecutionHistory(documentId!, execId, startTime, 'error', 'Execution not found on N8N.');
      return (res as any).status(200).json({ 
        status: 'error', 
        finished: true, 
        executionId: execId,
        documentId
      });
    }

    if (!n8nRes.ok) {
      throw new Error(`N8N API error: ${n8nRes.status} ${n8nRes.statusText}`);
    }

    const data = await n8nRes.json();
    const n8nStatus = data.status;
    const finished = data.finished;
    
    const clipsFromN8N = data.data?.resultData?.clips;
    const foldersFromN8N = data.data?.resultData?.folders;
    
    console.log(`📊 N8N Response for ${documentId}:`, {
      executionId: execId,
      n8nStatus: n8nStatus,
      finished: finished,
      hasClips: !!clipsFromN8N,
      hasFolders: !!foldersFromN8N,
      clipsCount: Array.isArray(clipsFromN8N) ? clipsFromN8N.length : 0
    });

    const shouldUpdate = documentId && execId && (finished || ['error', 'succeeded', 'failed'].includes(n8nStatus));
    
    console.log(`🤔 Should update DB?`, {
      documentId: !!documentId,
      execId: !!execId,
      finished: finished,
      n8nStatus: n8nStatus,
      shouldUpdate: shouldUpdate
    });

    if (shouldUpdate) {
      let finalStatus: string;
      let errorMessage: string | undefined;

      if (n8nStatus === 'succeeded' || n8nStatus === 'success') {
        finalStatus = 'completed';
        errorMessage = undefined;
        // 🔥 ลบ token reservation ที่เหลือ (ถ้ามี)
        await cleanupTokenReservation(doc.userId, doc._id, tokenHistoryCollection);
      } else if (['error', 'failed'].includes(n8nStatus)) {
        finalStatus = 'error';
        errorMessage = getErrorMessage(data);
        // 🔥 คืน token ที่จองไว้กลับให้ user
        await cleanupTokenReservation(doc.userId, doc._id, tokenHistoryCollection);
      } else if (finished && n8nStatus === 'running') {
        finalStatus = 'completed';
        errorMessage = undefined;
        await cleanupTokenReservation(doc.userId, doc._id, tokenHistoryCollection);
      } else {
        finalStatus = n8nStatus;
        errorMessage = n8nStatus === 'error' ? getErrorMessage(data) : undefined;
      }

      const startTime = doc?.startTime || new Date();

      console.log(`💾 Updating DB with final status: ${finalStatus}`);
      console.log(`📝 Error message: ${errorMessage || 'None'}`);
      
      try {
        await updateExecutionHistory(
          documentId!, 
          execId, 
          startTime, 
          finalStatus,
          errorMessage, 
          clipsFromN8N, 
          foldersFromN8N
        );

        await collection.updateOne(
            { _id: new ObjectId(documentId!) },
            { $unset: { error: '' } } 
        );
        console.log(`✅ Successfully unset main 'error' field for ${documentId}`);
        
        console.log(`✅ Successfully updated DB for ${documentId}`);
      } catch (updateError) {
        console.error(`❌ Failed to update DB:`, updateError);
      }
    } else {
      console.log(`⭐️ Skipping DB update - conditions not met`);
    }

    let responseStatus = n8nStatus;
    if (finished && (n8nStatus === 'succeeded' || n8nStatus === 'success')) {
      responseStatus = 'completed';
    } else if (finished && ['error', 'failed'].includes(n8nStatus)) {
      responseStatus = 'error';
    }

    return (res as any).status(200).json({ 
      status: responseStatus,
      executionId: execId, 
      finished, 
      ...(documentId && { documentId }),
      clips: clipsFromN8N || doc.clips || [],
      folders: foldersFromN8N || doc.folders || []
    });
    
  } catch (error) {
    console.error('❌ Internal server error:', error);
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
      console.log(`✅ Cleaned up token reservation for user ${userId}, zipId ${zipId}`);
    } else {
      console.log(`ℹ️ No token reservation found to clean up for user ${userId}, zipId ${zipId}`);
    }
  } catch (error) {
    console.error(`❌ Error cleaning up token reservation:`, error);
  }
}

function getErrorMessage(data: any): string | undefined {
  console.log(`🔍 Extracting error message from:`, data);
  
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
    console.error('Failed to parse error message from N8N response', err);
  }
  return 'Unknown workflow error';
}



// import type { NextApiRequest, NextApiResponse } from 'next';
// import clientPromise from '@/lib/mongodb';
// import { ObjectId } from 'mongodb';
// import { updateExecutionHistory } from './start-wf';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   const { id, executionId } = req.query;

//   console.log(`🔍 Status check request - ID: ${id}, ExecutionId: ${executionId}`);

//   const apiKey = process.env.N8N_API_KEY;
//   const apiBase = process.env.N8N_API_BASE_URL;

//   if (!apiKey || !apiBase) {
//     return (res as any).status(500).json({ error: 'N8N API key or base URL is not configured' });
//   }

//   try {
//     const client = await clientPromise;
//     const db = client.db('login-form-app');
//     const collection = db.collection('listfile');

//     let execId: string | undefined;
//     let documentId: string | null = null;
//     let doc: any = null;

//     if (executionId) {
//       execId = executionId as string;
//       doc = await collection.findOne({ executionId: execId });
//       if (doc) documentId = doc._id.toString();
//     } else if (id) {
//       if (!ObjectId.isValid(id as string)) {
//         return (res as any).status(400).json({ error: 'Invalid file ID format' });
//       }
//       doc = await collection.findOne({ _id: new ObjectId(id as string) });
//       if (doc) documentId = doc._id.toString();
//       execId = doc?.executionId;
//     } else {
//       return (res as any).status(400).json({ error: 'File ID or execution ID is required' });
//     }
    
//     if (!doc) {
//       console.log(`❌ Document not found for ID: ${id || executionId}`);
//       return (res as any).status(404).json({ error: 'File not found' });
//     }

//     console.log(`📄 Found document: ${documentId}, Status: ${doc.status}, ExecId: ${execId}`);
    
//     // ถ้างานอยู่ใน queue หรือยังไม่มี executionId
//     if (!execId || ['queued', 'processing'].includes(doc.status)) {
//       console.log(`⏳ Job is in queue/processing state - Status: ${doc.status}`);
//       return (res as any).status(200).json({ 
//         status: doc.status || 'queued',
//         finished: false, 
//         message: `Job is ${doc.status || 'queued'}`,
//         queuePosition: doc.queuePosition,
//         clips: doc.clips || []
//       });
//     }

//     // ✅ แก้ไข: ให้ตรวจสอบจาก N8N เสมอ เพื่ออัปเดต executionIdHistory
//     // เฉพาะงานที่เสร็จสมบูรณ์แล้วและมี executionIdHistory อยู่แล้ว 
//     // ถึงจะคืนค่าทันที
//     if (['completed', 'succeeded', 'error'].includes(doc.status) && doc.executionIdHistory) {
//       return (res as any).status(200).json({
//         status: doc.status,
//         finished: true,
//         executionId: execId,
//         documentId,
//         clips: doc.clips || [],
//         folders: doc.folders || []
//       });
//     }

//     // เรียก N8N API เพื่อตรวจสอบสถานะ
//     const n8nUrl = `${apiBase}/executions/${execId}`;
//     console.log(`🌐 Calling N8N API: ${n8nUrl}`);
    
//     const n8nRes = await fetch(n8nUrl, {
//       headers: {
//         'X-N8N-API-KEY': apiKey,
//       },
//     });

//     if (n8nRes.status === 404) {
//       console.warn(`⚠️ Execution ${execId} not found on N8N, updating status to error`);
//       const startTime = doc?.startTime || new Date();
//       await updateExecutionHistory(documentId!, execId, startTime, 'error', 'Execution not found on N8N.');
//       return (res as any).status(200).json({ 
//         status: 'error', 
//         finished: true, 
//         // error: 'Execution not found on N8N',
//         executionId: execId,
//         documentId
//       });
//     }

//     if (!n8nRes.ok) {
//       throw new Error(`N8N API error: ${n8nRes.status} ${n8nRes.statusText}`);
//     }

//     const data = await n8nRes.json();
//     const n8nStatus = data.status;  // ✅ เปลี่ยนชื่อตัวแปรเพื่อความชัดเจน
//     const finished = data.finished;
    
//     // Extract clips from N8N response
//     const clipsFromN8N = data.data?.resultData?.clips;
//     const foldersFromN8N = data.data?.resultData?.folders;
    
//     console.log(`📊 N8N Response for ${documentId}:`, {
//       executionId: execId,
//       n8nStatus: n8nStatus,
//       finished: finished,
//       hasClips: !!clipsFromN8N,
//       hasFolders: !!foldersFromN8N,
//       clipsCount: Array.isArray(clipsFromN8N) ? clipsFromN8N.length : 0
//     });

//     // 🔥 แก้ไขเงื่อนไข: อัปเดตเมื่อ finished = true หรือ status เป็น error/succeeded/failed
//     const shouldUpdate = documentId && execId && (finished || ['error', 'succeeded', 'failed'].includes(n8nStatus));
    
//     console.log(`🤔 Should update DB?`, {
//       documentId: !!documentId,
//       execId: !!execId,
//       finished: finished,
//       n8nStatus: n8nStatus,
//       shouldUpdate: shouldUpdate
//     });

//     if (shouldUpdate) {
//       // ✅ แก้ไข: ใช้ logic ที่ถูกต้องในการแปลง status
//       let finalStatus: string;
//       let errorMessage: string | undefined;

//       if (n8nStatus === 'succeeded' || n8nStatus === 'success') {
//         finalStatus = 'completed';  // ✅ succeeded -> completed
//         errorMessage = undefined;
//       } else if (['error', 'failed'].includes(n8nStatus)) {
//         finalStatus = 'error';      // ✅ error/failed -> error
//         errorMessage = getErrorMessage(data);
//       } else if (finished && n8nStatus === 'running') {
//         // กรณีที่ N8N บอกว่า finished แต่ status ยัง running
//         finalStatus = 'completed';
//         errorMessage = undefined;
//       } else {
//         // กรณีอื่นๆ ที่ไม่แน่ใจ
//         finalStatus = n8nStatus;
//         errorMessage = n8nStatus === 'error' ? getErrorMessage(data) : undefined;
//       }

//       const startTime = doc?.startTime || new Date();

//       console.log(`💾 Updating DB with final status: ${finalStatus}`);
//       console.log(`📄 Error message: ${errorMessage || 'None'}`);
      
//       try {
//         await updateExecutionHistory(
//           documentId!, 
//           execId, 
//           startTime, 
//           finalStatus,  // ✅ ใช้ finalStatus ที่แปลงแล้ว
//           errorMessage, 
//           clipsFromN8N, 
//           foldersFromN8N
//         );

//           // 🔥 เพิ่มโค้ดส่วนนี้เพื่อลบ Field "error" หลักออก
//         // โดยจะทำหลังจากบันทึก error message (ถ้ามี) ลงใน executionIdHistory แล้ว
//         await collection.updateOne(
//             { _id: new ObjectId(documentId!) },
//             { $unset: { error: '' } } 
//         );
//         console.log(`✅ Successfully unset main 'error' field for ${documentId}`);
        
//         console.log(`✅ Successfully updated DB for ${documentId}`);
//       } catch (updateError) {
//         console.error(`❌ Failed to update DB:`, updateError);
//       }
//     } else {
//       console.log(`⭐️ Skipping DB update - conditions not met`);
//     }

//     // ✅ แก้ไข: ส่ง status ที่ถูกต้องกลับไปยัง client
//     let responseStatus = n8nStatus;
//     if (finished && (n8nStatus === 'succeeded' || n8nStatus === 'success')) {
//       responseStatus = 'completed';  // ✅ แปลง succeeded เป็น completed สำหรับ response
//     } else if (finished && ['error', 'failed'].includes(n8nStatus)) {
//       responseStatus = 'error';      // ✅ แปลง failed เป็น error สำหรับ response
//     }

//     return (res as any).status(200).json({ 
//       status: responseStatus,  // ✅ ใช้ responseStatus ที่แปลงแล้ว
//       executionId: execId, 
//       finished, 
//       ...(documentId && { documentId }),
//       clips: clipsFromN8N || doc.clips || [],
//       folders: foldersFromN8N || doc.folders || []
//     });
    
//   } catch (error) {
//     console.error('❌ Internal server error:', error);
//     return (res as any).status(500).json({ 
//       error: 'Internal Server Error',
//       details: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// }

// function getErrorMessage(data: any): string | undefined {
//   console.log(`🔍 Extracting error message from:`, data);
  
//   try {
//     if (data.data?.resultData?.error?.message) {
//       return data.data.resultData.error.message;
//     }
//     if (data.data?.resultData?.lastNodeExecuted && data.data?.resultData?.error) {
//       const lastNode = data.data.resultData.lastNodeExecuted;
//       return `Error in node '${lastNode}': ${data.data.resultData.error.message || 'Unknown error'}`;
//     }
//     if (data.stoppedAt && data.data?.resultData?.error) {
//       return data.data.resultData.error.message || 'Workflow stopped with error';
//     }
//     if (['error', 'stopped', 'failed'].includes(data.status)) {
//       return `Workflow ended with status: ${data.status}`;
//     }
//   } catch (err) {
//     console.error('Failed to parse error message from N8N response', err);
//   }
//   return 'Unknown workflow error';
// }