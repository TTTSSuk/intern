//lib/workers/queue-worker.ts
import clientPromise from '@/lib/mongodb';
import { ObjectId, WithId } from 'mongodb';

interface ListFile {
  _id: ObjectId;
  extractPath: string;
  status: string;
  queuePosition?: number;
  createdAt?: Date;
  updatedAt?: Date;
  startTime?: Date;
  executionId?: string;
  clips?: { video?: string; finalVideo?: string; createdAt?: Date }[];
  jobType?: string; // 🔥 เพิ่ม jobType
  selectedClipUrls?: string[]; // 🔥 สำหรับ merge video
}

export async function processQueue() {
  console.log('🔄 Processing queue...');
  
  try {
    const client = await clientPromise;
    const db = client.db('login-form-app');
    const collection = db.collection<ListFile>('listfile');

    // ตรวจสอบว่ามีงานที่กำลัง running อยู่หรือไม่
    const runningJobs = await collection.countDocuments({ 
      status: { $in: ['running', 'processing'] } 
    });
    
    if (runningJobs > 0) {
      console.log(`⏳ ${runningJobs} job(s) currently running, waiting...`);
      return;
    }

    // ตรวจสอบว่ามีงานในคิวไหม
    const queueCount = await collection.countDocuments({ status: 'queued' });
    console.log(`📊 Jobs in queue: ${queueCount}`);

    if (queueCount === 0) {
      console.log('📭 No jobs in queue');
      return;
    }

    // ดึงงานจากคิว (เรียงตาม queuePosition)
    const job: WithId<ListFile> | null = await collection.findOneAndUpdate(
      { status: 'queued' },
      { 
        $set: { 
          status: 'processing', 
          startTime: new Date(),
          updatedAt: new Date()
        } 
      },
      { 
        sort: { queuePosition: 1 }, 
        returnDocument: 'after' 
      }
    );

    if (!job) {
      console.log('📭 No jobs found to process');
      return;
    }

    const { _id, extractPath, jobType, selectedClipUrls } = job;
    
    // 🔥 แสดงประเภทของงาน
    const jobTypeLabel = jobType === 'subvideos' ? '🎬 Merge Video' : '🤖 AI Generate';
    console.log(`${jobTypeLabel} - Processing job ${_id}`);
    console.log(`📂 Extract path: ${extractPath}`);

    // ตรวจสอบว่า extractPath มีอยู่จริง
    if (!extractPath) {
      console.error(`❌ No extractPath found for job ${_id}`);
      await collection.updateOne(
        { _id: new ObjectId(_id) },
        { 
          $set: { 
            status: 'error', 
            error: 'No extractPath found',
            updatedAt: new Date()
          } 
        }
      );
      return;
    }

    // แปลง path ให้เป็น path ใน container
    const containerExtractPath = extractPath.replace(/^\.\/uploads\/extracted/, '/extracted');
    console.log(`📂 Container path: ${containerExtractPath}`);

    // 🔥 เลือก webhook ตามประเภทงาน
    let webhookUrl: string;
    let payload: any;

    if (jobType === 'subvideos') {
      // Merge Video - ใช้ webhook ffmpeg
      webhookUrl = 'http://localhost:5678/webhook/ffmpeg';
      
      // แปลง selectedClipUrls เป็น container path
      const containerClipUrls = (selectedClipUrls || []).map((clipUrl: string) => {
        if (clipUrl.startsWith('/extracted/')) {
          return clipUrl;
        }
        return `/extracted/${clipUrl}`;
      });

      payload = {
        _id: _id.toString(),
        extractPath: containerExtractPath,
        selectedClipUrls: containerClipUrls
      };

      console.log(`🎬 Merge Video: ${selectedClipUrls?.length || 0} clips`);
    } else {
      // AI Generate - ใช้ webhook start-wf
      webhookUrl = 'http://localhost:5678/webhook/start-wf';
      payload = {
        _id: _id.toString(),
        extractPath: containerExtractPath
      };

      console.log(`🤖 AI Generate video`);
    }

    console.log(`🌐 Calling webhook: ${webhookUrl}`);

    // เรียก n8n webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log(`📡 N8N Response Status: ${response.status}`);
    console.log(`📡 N8N Response Body: ${responseText}`);

    if (!response.ok) {
      console.error(`❌ Failed to start workflow for job ${_id}: ${responseText}`);
      await collection.updateOne(
        { _id: new ObjectId(_id) },
        { 
          $set: { 
            status: 'error', 
            error: `Failed to start n8n workflow: ${response.status} ${responseText}`,
            updatedAt: new Date()
          },
          $unset: {
            queuePosition: "",
            startTime: ""
          }
        }
      );
      return;
    }

    let n8nResponse;
    try {
      n8nResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse N8N response:', parseError);
      await collection.updateOne(
        { _id: new ObjectId(_id) },
        { 
          $set: { 
            status: 'error', 
            error: 'Invalid response from N8N - not valid JSON',
            updatedAt: new Date()
          },
          $unset: {
            queuePosition: "",
            startTime: ""
          }
        }
      );
      return;
    }

    // ดึง executionId จาก response
    const executionId = n8nResponse.executionId || n8nResponse.executionID;

    if (!executionId) {
      console.error('❌ No executionId received from N8N');
      console.error('N8N Response:', n8nResponse);
      await collection.updateOne(
        { _id: new ObjectId(_id) },
        { 
          $set: { 
            status: 'error', 
            error: 'No executionId received from N8N',
            updatedAt: new Date()
          },
          $unset: {
            queuePosition: "",
            startTime: ""
          }
        }
      );
      return;
    }

    // 🔥 อัปเดต executionIdHistory แทน executionId ที่ root level
    const startTime = new Date();
    await collection.updateOne(
      { _id: new ObjectId(_id) },
      { 
        $set: { 
          status: 'running',
          updatedAt: startTime,
          executionIdHistory: {
            executionId,
            startTime,
            workflowStatus: 'running'
          }
        },
        $unset: {
          queuePosition: "",
          executionId: "", // ลบ executionId ที่ root ถ้ามี
          startTime: "" // ลบ startTime ที่ root ถ้ามี
        }
      }
    );

    console.log(`🚀 ${jobTypeLabel} - Job ${_id} started with executionId: ${executionId}`);
    console.log(`💾 Updated job status to running in database`);

  } catch (error) {
    console.error('❌ Error processing queue:', error);
    
    // ถ้ามี error ให้ลองอัพเดทงานที่กำลัง processing กลับเป็น queued
    try {
      const client = await clientPromise;
      const db = client.db('login-form-app');
      const collection = db.collection<ListFile>('listfile');
      
      const result = await collection.updateMany(
        { 
          status: 'processing',
          startTime: { $gte: new Date(Date.now() - 60000) } // เฉพาะงานที่เริ่มใน 1 นาทีที่แล้ว
        },
        { 
          $set: { 
            status: 'queued',
            updatedAt: new Date()
          },
          $unset: {
            startTime: "",
            executionId: ""
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`🔄 Reset ${result.modifiedCount} processing jobs back to queued status`);
      }
    } catch (resetError) {
      console.error('❌ Failed to reset processing jobs:', resetError);
    }
  }
}



// import clientPromise from '@/lib/mongodb';
// import { ObjectId, WithId } from 'mongodb';

// interface ListFile {
//   _id: ObjectId;
//   extractPath: string;
//   status: string;
//   queuePosition?: number;
//   createdAt?: Date;
//   updatedAt?: Date;
//   startTime?: Date;
//   executionId?: string;
//   clips?: { video?: string; finalVideo?: string; createdAt?: Date }[];
// }

// export async function processQueue() {
//   console.log('🔄 Processing queue...');
  
//   try {
//     const client = await clientPromise;
//     const db = client.db('login-form-app');
//     const collection = db.collection<ListFile>('listfile');

//     // ตรวจสอบว่ามีงานที่กำลัง running อยู่หรือไม่
//     const runningJobs = await collection.countDocuments({ 
//       status: { $in: ['running', 'processing'] } 
//     });
    
//     if (runningJobs > 0) {
//       console.log(`⏳ ${runningJobs} job(s) currently running, waiting...`);
//       return;
//     }

//     // ตรวจสอบว่ามีงานในคิวไหม
//     const queueCount = await collection.countDocuments({ status: 'queued' });
//     console.log(`📊 Jobs in queue: ${queueCount}`);

//     if (queueCount === 0) {
//       console.log('📭 No jobs in queue');
//       return;
//     }

//     // ดึงงานจากคิว (เรียงตาม queuePosition)
//     const job: WithId<ListFile> | null = await collection.findOneAndUpdate(
//       { status: 'queued' },
//       { 
//         $set: { 
//           status: 'processing', 
//           startTime: new Date(),
//           updatedAt: new Date()
//         } 
//       },
//       { 
//         sort: { queuePosition: 1 }, 
//         returnDocument: 'after' 
//       }
//     );

//     if (!job) {
//       console.log('📭 No jobs found to process');
//       return;
//     }

//     const { _id, extractPath } = job;
//     console.log(`🎯 Processing job ${_id} with extractPath: ${extractPath}`);

//     // ตรวจสอบว่า extractPath มีอยู่จริง
//     if (!extractPath) {
//       console.error(`❌ No extractPath found for job ${_id}`);
//       await collection.updateOne(
//         { _id: new ObjectId(_id) },
//         { 
//           $set: { 
//             status: 'error', 
//             error: 'No extractPath found',
//             updatedAt: new Date()
//           } 
//         }
//       );
//       return;
//     }

//     // แปลง path ให้เป็น path ใน container
//     const containerExtractPath = extractPath.replace(/^\.\/uploads\/extracted/, '/extracted');
//     console.log(`📂 Container path: ${containerExtractPath}`);

//     // เรียก n8n webhook
//     const webhookUrl = 'http://localhost:5678/webhook/start-wf';
//     console.log(`🌐 Calling N8N webhook: ${webhookUrl}`);

//     const response = await fetch(webhookUrl, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         _id: _id.toString(),
//         extractPath: containerExtractPath,
//       }),
//     });

//     const responseText = await response.text();
//     console.log(`📡 N8N Response Status: ${response.status}`);
//     console.log(`📡 N8N Response Body: ${responseText}`);

//     if (!response.ok) {
//       console.error(`❌ Failed to start workflow for job ${_id}: ${responseText}`);
//       await collection.updateOne(
//         { _id: new ObjectId(_id) },
//         { 
//           $set: { 
//             status: 'error', 
//             error: `Failed to start n8n workflow: ${response.status} ${responseText}`,
//             updatedAt: new Date()
//           },
//           $unset: {
//             queuePosition: "",
//             startTime: ""
//           }
//         }
//       );
//       return;
//     }

//     let n8nResponse;
//     try {
//       n8nResponse = JSON.parse(responseText);
//     } catch (parseError) {
//       console.error('❌ Failed to parse N8N response:', parseError);
//       await collection.updateOne(
//         { _id: new ObjectId(_id) },
//         { 
//           $set: { 
//             status: 'error', 
//             error: 'Invalid response from N8N - not valid JSON',
//             updatedAt: new Date()
//           },
//           $unset: {
//             queuePosition: "",
//             startTime: ""
//           }
//         }
//       );
//       return;
//     }

//     // ดึง executionId จาก response
//     const executionId = n8nResponse.executionId || n8nResponse.executionID;

//     if (!executionId) {
//       console.error('❌ No executionId received from N8N');
//       console.error('N8N Response:', n8nResponse);
//       await collection.updateOne(
//         { _id: new ObjectId(_id) },
//         { 
//           $set: { 
//             status: 'error', 
//             error: 'No executionId received from N8N',
//             updatedAt: new Date()
//           },
//           $unset: {
//             queuePosition: "",
//             startTime: ""
//           }
//         }
//       );
//       return;
//     }

//     // อัปเดต executionId และสถานะเป็น running
//     await collection.updateOne(
//       { _id: new ObjectId(_id) },
//       { 
//         $set: { 
//           status: 'running',
//           executionId, 
//           startTime: new Date(),
//           updatedAt: new Date()
//         },
//         $unset: {
//           queuePosition: ""
//         }
//       }
//     );

//     console.log(`🚀 Job ${_id} started on N8N with executionId: ${executionId}`);
//     console.log(`💾 Updated job status to running in database`);

//   } catch (error) {
//     console.error('❌ Error processing queue:', error);
    
//     // ถ้ามี error ให้ลองอัพเดทงานที่กำลัง processing กลับเป็น queued
//     try {
//       const client = await clientPromise;
//       const db = client.db('login-form-app');
//       const collection = db.collection<ListFile>('listfile');
      
//       const result = await collection.updateMany(
//         { 
//           status: 'processing',
//           startTime: { $gte: new Date(Date.now() - 60000) } // เฉพาะงานที่เริ่มใน 1 นาทีที่แล้ว
//         },
//         { 
//           $set: { 
//             status: 'queued',
//             updatedAt: new Date()
//           },
//           $unset: {
//             startTime: "",
//             executionId: ""
//           }
//         }
//       );
      
//       if (result.modifiedCount > 0) {
//         console.log(`🔄 Reset ${result.modifiedCount} processing jobs back to queued status`);
//       }
//     } catch (resetError) {
//       console.error('❌ Failed to reset processing jobs:', resetError);
//     }
//   }
// }