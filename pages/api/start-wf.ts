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
  updatedAt: Date;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return (res as any).status(405).json({ error: 'Method not allowed' });
  }

  const { _id } = req.body;

  if (!_id) {
    return (res as any).status(400).json({ error: '_id is required' });
  }

  if (!ObjectId.isValid(_id)) {
    return (res as any).status(400).json({ error: 'Invalid _id format' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('login-form-app');
    const collection = db.collection('listfile');

    const doc = await collection.findOne({ _id: new ObjectId(_id) });
    if (!doc) {
      return (res as any).status(404).json({ error: 'File not found' });
    }
    const extractPath = doc.extractPath;

    const containerExtractPath = extractPath.replace(/^\.\/uploads\/extracted/, '/extracted');

    const response = await fetch('http://localhost:5678/webhook/start-wf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ _id, extractPath: containerExtractPath }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('🔥 Response from n8n:', result);

    const executionId = result.executionId || result.executionID;
    if (!executionId) {
      throw new Error('No executionId received from n8n');
    }

    const startTime = new Date();

    await saveToDatabase(_id, executionId, 'started', startTime);

    (res as any).status(200).json({
      message: 'Workflow started and saved successfully!',
      executionId,
      _id,
    });
  } catch (err) {
    console.error('❌ Failed to start workflow:', err);
    return (res as any).status(500).json({
      error: err instanceof Error ? err.message : 'Failed to start workflow',
    });
  }
}

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
      updateDoc.status = "processing";
      updateDoc.clips = []; // ✅ ให้มี array ว่างไว้เลย
      updateDoc.executionIdHistory = {
        executionId,
        startTime: startTime ?? new Date(),
        workflowStatus: "running"
      };
    }

    // 🔥 เพิ่มการลบ field เก่าทั้งหมดที่อาจเหลือจาก error ก่อนหน้า
    await collection.updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: updateDoc,
        $unset: {
          executionHistory: "",
          error: "",           // ลบ error message เก่า
          folders: ""          // ลบ folders เก่าเพื่อให้อัพเดตใหม่
        }
      },
      { upsert: true }
    );

    console.log('💾 Saved to database successfully');
  } catch (error) {
    console.error('❌ Error saving to database:', error);
  }
}

export async function updateExecutionHistory(
  _id: string,
  executionId: string,
  startTime: Date,
  workflowStatus: string,
  error?: string,
  clips?: any,
  folders?: any
) {
  try {
    const client = await clientPromise;
    const db = client.db('login-form-app');
    const collection = db.collection('listfile');

    const now = new Date();

    const newHistory = {
      executionId,
      startTime,
      endTime: now,
      workflowStatus,
      ...(error && { error }),
    };

    const updateSet: any = {
      executionIdHistory: newHistory,
      updatedAt: now,
      status: workflowStatus,
      ...(clips && { clips }),
      ...(folders && { folders }),
      ...(error && { error: error }),
    };

    await collection.updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: updateSet,
        $unset: {
          executionId: "",
          startTime: "",
          executionHistory: ""
        }
      }
    );
    
    console.log('✅ executionIdHistory updated successfully');
  } catch (err) {
    console.error('❌ Error updating executionIdHistory:', err);
  }
}


// import type { NextApiRequest, NextApiResponse } from 'next';
// import clientPromise from '@/lib/mongodb';
// import { ObjectId } from 'mongodb';

// type Data = {
//   _id?: string;
//   executionId?: string;
//   error?: string;
//   message?: string;
// };

// interface ExecutionRecord {
//   executionId: string;
//   status: string;
//   startTime: Date;
//   updatedAt: Date;
//   error?: string;
// }

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   if (req.method !== 'POST') {
//     return (res as any).status(405).json({ error: 'Method not allowed' });
//   }

//   const { _id } = req.body;

//   if (!_id) {
//     return (res as any).status(400).json({ error: '_id is required' });
//   }

//   if (!ObjectId.isValid(_id)) {
//     return (res as any).status(400).json({ error: 'Invalid _id format' });
//   }

//   try {
//     const client = await clientPromise;
//     const db = client.db('login-form-app');
//     const collection = db.collection('listfile');

//     const doc = await collection.findOne({ _id: new ObjectId(_id) });
//     if (!doc) {
//       return (res as any).status(404).json({ error: 'File not found' });
//     }
//     const extractPath = doc.extractPath;

//     const containerExtractPath = extractPath.replace(/^\.\/uploads\/extracted/, '/extracted');

//     const response = await fetch('http://localhost:5678/webhook/start-wf', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ _id, extractPath: containerExtractPath }),
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const result = await response.json();
//     console.log('📥 Response from n8n:', result);

//     const executionId = result.executionId || result.executionID;
//     if (!executionId) {
//       throw new Error('No executionId received from n8n');
//     }

//     const startTime = new Date();

//     await saveToDatabase(_id, executionId, 'started', startTime);

//     (res as any).status(200).json({
//       message: 'Workflow started and saved successfully!',
//       executionId,
//       _id,
//     });
//   } catch (err) {
//     console.error('❌ Failed to start workflow:', err);
//     return (res as any).status(500).json({
//       error: err instanceof Error ? err.message : 'Failed to start workflow',
//     });
//   }
// }

// async function saveToDatabase(
//   _id: string,
//   executionId: string,
//   status?: string,
//   startTime?: Date,
// ) {
//   try {
//     const client = await clientPromise;
//     const db = client.db('login-form-app');
//     const collection = db.collection('listfile');

//     const updateDoc: any = {};

//     // if (status === 'started') {
//     //   updateDoc.executionId = executionId;
//     //   updateDoc.startTime = startTime ?? new Date();
//     // }

//     if (status === 'started') {
//   updateDoc.executionId = executionId;
//   updateDoc.startTime = startTime ?? new Date();
//   updateDoc.status = "processing";
//   updateDoc.clips = []; // ✅ ให้มี array ว่างไว้เลย
//   updateDoc.executionIdHistory = {
//     executionId,
//     startTime: startTime ?? new Date(),
//     workflowStatus: "running"
//   };
// }

//     await collection.updateOne(
//       { _id: new ObjectId(_id) },
//       {
//         $set: updateDoc,
//         $unset: {
//           executionHistory: ""
//         }
//       },
//       { upsert: true }
//     );

//     console.log('💾 Saved to database successfully');
//   } catch (error) {
//     console.error('❌ Error saving to database:', error);
//   }
// }

// // ✅ แก้ไข: เพิ่มพารามิเตอร์ clips และ folders
// export async function updateExecutionHistory(
//   _id: string,
//   executionId: string,
//   startTime: Date,
//   workflowStatus: string,
//   error?: string,
//   clips?: any, // เพิ่มพารามิเตอร์
//   folders?: any // เพิ่มพารามิเตอร์
// ) {
//   try {
//     const client = await clientPromise;
//     const db = client.db('login-form-app');
//     const collection = db.collection('listfile');

//     const now = new Date();

//     const newHistory = {
//       executionId,
//       startTime,
//       endTime: now,
//       workflowStatus,
//       ...(error && { error }),
//     };

//      // ✅ เพิ่มการอัปเดต clips และ folders ในการอัปเดต MongoDB
//     const updateSet: any = {
//       executionIdHistory: newHistory,
//       updatedAt: now,
//       status: workflowStatus,
//       ...(clips && { clips }),
//       ...(folders && { folders }),
//       ...(error && { error: error  }), // ✅ เพิ่ม: กำหนด error ที่ root document ถ้ามี error
//     };

//     await collection.updateOne(
//       { _id: new ObjectId(_id) },
//       {
//         $set: updateSet,
//         $unset: {
//           executionId: "", // ✅ ล้าง executionId ชั่วคราว
//           startTime: "",   // ✅ ล้าง startTime ชั่วคราว
//           // workflowStatus: "", // ❌ ลบฟิลด์นี้ออก เพราะไม่มีอยู่จริง/ไม่จำเป็น
//           // error: "",       // ✅ คงไว้: เพื่อล้าง error ที่เคยค้างอยู่จากการรันก่อนหน้า (ถ้าการรันนี้สำเร็จ)
//           executionHistory: "" // ✅ ล้างฟิลด์เก่า
//         }
//       }
//     );
    
//     console.log('✅ executionIdHistory updated successfully');
//   } catch (err) {
//     console.error('❌ Error updating executionIdHistory:', err);
//   }
// }