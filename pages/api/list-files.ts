//pages/api/list-files.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import path from 'path';
import { readFolderRecursive, Folder } from '@/lib/readFolderRecursive';

interface VideoFile {
  _id: string;
  userId: string;
  originalName: string;
  extractPath: string;
  status: 'pending' | 'processing' | 'done' | 'error' | 'deleted';
  createdAt: string;
  folders?: Folder[];
  videoCreated?: boolean;
  originalFilePath?: string;
}

// Filter out .mp4 files from folder structure
function filterVideoFiles(folders: Folder[]): Folder[] {
  return folders.map(folder => {
    const newFolder = { ...folder };
    if (newFolder.files) {
      newFolder.files = newFolder.files.filter(file => !file.endsWith('.mp4'));
    }
    if (newFolder.subfolders) {
      newFolder.subfolders = filterVideoFiles(newFolder.subfolders);
    }
    return newFolder;
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return (res as any).status(405).json({ message: 'Method not allowed' });
  }

  // Validate userId is provided
  if (!req.query.userId) {
    return (res as any).status(400).json({ message: 'User ID is required' });
  }

  try {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : 'anonymous';
    const client = await clientPromise;
    const db = client.db();
    const videosCollection = db.collection('listfile');

    // Fetch files from database
    const rawFiles = await videosCollection
      .find(
        { userId, status: { $ne: 'deleted' } },
        {
          projection: {
            _id: 1,
            userId: 1,
            originalName: 1,
            extractPath: 1,
            status: 1,
            createdAt: 1,
            folders: 1,
            clips: 1
          }
        }
      )
      .sort({ createdAt: -1 })
      .toArray();

    // Process each file and add computed fields
    const filesWithProcessedData = rawFiles.map(doc => {
      const videoCreated = !!doc.clips;
      const originalFilePath = `/uploads/${doc.originalName}`;

      const fullExtractPath = path.resolve(process.cwd(), doc.extractPath);
      let foldersToDisplay: Folder[] = [];

      // Use existing folder data from DB if available, otherwise read from disk
      if (doc.folders) {
        const folderStructure = { name: path.basename(doc.extractPath), ...doc.folders };
        foldersToDisplay = [folderStructure as Folder];
      } else {
        try {
          const folderStructure = readFolderRecursive(fullExtractPath);
          foldersToDisplay = [{ name: path.basename(fullExtractPath), ...folderStructure }];
        } catch (err) {
          console.error(`❌ Error reading folder for file ${doc._id}:`, err);
        }
      }
      
      // Filter out .mp4 files from the folder structure
      if (foldersToDisplay.length > 0) {
        foldersToDisplay = filterVideoFiles(foldersToDisplay);
      }

      return {
        _id: doc._id.toString(),
        userId: doc.userId,
        originalName: doc.originalName,
        extractPath: doc.extractPath,
        status: doc.status,
        createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : doc.createdAt.toISOString(),
        videoCreated,
        originalFilePath,
        folders: foldersToDisplay,
      };
    });

    return (res as any).status(200).json({ files: filesWithProcessedData });
  } catch (error) {
    console.error('❌ Error fetching files:', error);
    return (res as any).status(500).json({ message: 'Failed to fetch files' });
  }
}








// import type { NextApiRequest, NextApiResponse } from 'next';
// import clientPromise from '@/lib/mongodb';
// import path from 'path';
// import { readFolderRecursive, Folder } from '@/lib/readFolderRecursive';

// interface VideoFile {
//   _id: string;
//   userId: string;
//   originalName: string;
//   extractPath: string;
//   status: 'pending' | 'processing' | 'done' | 'error' | 'deleted';
//   createdAt: string;
//   folders?: Folder[];
//   videoCreated?: boolean; // เพิ่ม field นี้เพื่อระบุสถานะการสร้างวิดีโอ
//   originalFilePath?: string; // เพิ่ม field นี้สำหรับไฟล์ตั้งต้น
//   // finalVideoUrl?: string;    // เพิ่ม field นี้สำหรับวิดีโอที่สร้างแล้ว
// }

// //... imports และ interface เดิม

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'GET') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }

//   try {
//     const userId = typeof req.query.userId === 'string' ? req.query.userId : 'anonymous';

//     const client = await clientPromise;
//     const db = client.db();
//     const videosCollection = db.collection('listfile');

//     // ดึงไฟล์ทั้งหมดของ user ที่สถานะไม่ใช่ 'deleted' และจัดเรียงตามเวลาที่สร้างล่าสุด
//     const rawFiles = await videosCollection
//       .find({ userId, status: { $ne: 'deleted' } })
//       .sort({ createdAt: -1 })
//       .toArray();

//     // แปลงข้อมูลดิบและเพิ่ม field `videoCreated`
//     const filesWithProcessedStatus = rawFiles.map(doc => {
//       // ตรวจสอบจาก field `clips` หรือ `executionIdHistory` ที่มีอยู่แล้ว
//       const videoCreated = !!doc.clips || (doc.executionIdHistory && doc.executionIdHistory.workflowStatus === 'completed');

//       // สร้าง URL สำหรับดาวน์โหลดไฟล์ ZIP ต้นฉบับ
//       const originalFilePath = `/uploads/${doc.originalName}`;

//       const fullExtractPath = path.resolve(process.cwd(), doc.extractPath);
//       let folders: Folder = { files: [], subfolders: [] };
//       try {
//         folders = readFolderRecursive(fullExtractPath);
//       } catch (err) {
//         console.error(`❌ Error reading folder for file ${doc._id}:`, err);
//       }

//       return {
//         _id: doc._id.toString(),
//         userId: doc.userId,
//         originalName: doc.originalName,
//         extractPath: doc.extractPath,
//         status: doc.status,
//         createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : doc.createdAt.toISOString(),
//         videoCreated, // ใช้ boolean เพื่อบอกสถานะ
//         originalFilePath, // เพิ่ม path ของไฟล์ตั้งต้น
//         // finalVideoUrl, // เพิ่ม URL ของวิดีโอ
//         folders: [{ name: path.basename(fullExtractPath), ...folders }],
//       };
//     });

//     return res.status(200).json({ files: filesWithProcessedStatus });
//   } catch (error) {
//     console.error('❌ Error fetching files:', error);
//     return res.status(500).json({ message: 'Failed to fetch files' });
//   }
// }






















// // pages/api/list-files.ts
// import type { NextApiRequest, NextApiResponse } from 'next';
// import clientPromise from '@/lib/mongodb';
// import path from 'path';
// import { readFolderRecursive, Folder } from '@/lib/readFolderRecursive';

// interface VideoFile {
//   _id: string;
//   userId: string;
//   originalName: string;
//   extractPath: string;
//   status: 'pending' | 'processing' | 'done' | 'error' | 'deleted';
//   createdAt: string;
//   folders?: Folder[];
//   // executionIdHistory?: {
//   //   workflowStatus: string;
//   //   createdAt: string;
//   // }[];
// }

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'GET') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }

//   try {
//     const userId = typeof req.query.userId === 'string' ? req.query.userId : 'anonymous';

//     const client = await clientPromise;
//     const db = client.db();
//     const videosCollection = db.collection('listfile');

//   //   ดึงข้อมูลจาก MongoDB โดยกรองไฟล์ที่สถานะไม่ใช่ 'deleted'
//     const rawFiles = await videosCollection
//       .find({
//             userId,
//             status: { $ne: 'deleted' },
//             executionId: { $exists: false }, // ยังไม่ได้รัน
//             $or: [
//                   { executionIdHistory: { $exists: false } },
//                   { 'executionIdHistory.workflowStatus': { $nin: ['completed', 'error'] } }
//                 ]
//             })
//   .sort({ createdAt: -1 })
//   .toArray();

//   //     const rawFiles = await videosCollection
//   // .find({
//   //   userId,
//   //   status: { $ne: 'deleted' }, // เอาไฟล์ที่ถูกลบออก
//   // })
//   // .sort({ createdAt: -1 })
//   // .toArray();

//     // แปลงข้อมูลดิบให้ตรงกับ interface VideoFile
//     const files: VideoFile[] = rawFiles.map(doc => ({
//       _id: doc._id.toString(),
//       userId: doc.userId,
//       originalName: doc.originalName,
//       extractPath: doc.extractPath,
//       status: doc.status,
//       createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : doc.createdAt.toISOString(),
//     }));
// //     const files: VideoFile[] = rawFiles.map(doc => ({
// //   _id: doc._id.toString(),
// //   userId: doc.userId,
// //   originalName: doc.originalName,
// //   extractPath: doc.extractPath,
// //   status: doc.status,
// //   createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : doc.createdAt.toISOString(),
// //   clips: doc.clips || [],
// //   executionIdHistory: doc.executionIdHistory || [],
// // }));

//     // อ่านโครงสร้างโฟลเดอร์และไฟล์จาก disk สำหรับแต่ละ record
//     const filesWithFolders = files.map((file) => {
//       const fullExtractPath = path.resolve(process.cwd(), file.extractPath);
//       let folders: Folder = { files: [], subfolders: [] };

//       try {
//         folders = readFolderRecursive(fullExtractPath);
//       } catch (err) {
//         console.error(`Error reading folder for file ${file._id}:`, err);
//       }

//       return {
//         ...file,
//         folders: [{ name: path.basename(fullExtractPath), ...folders }],
//       };
//     });

//     return res.status(200).json({ files: filesWithFolders });
//   } catch (error) {
//     console.error('❌ Error fetching files:', error);
//     return res.status(500).json({ message: 'Failed to fetch files' });
//   }
// }
