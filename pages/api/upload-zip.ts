// pages/api/upload-zip.ts
import type { NextApiRequest, NextApiResponse } from 'next'; 
import formidable from 'formidable';
import fs from 'fs';
import AdmZip from 'adm-zip';
import clientPromise from '@/lib/mongodb';
import { readFolderRecursive, Folder } from '@/lib/readFolderRecursive';
import { ObjectId } from 'mongodb';


export const config = {
  api: {
    bodyParser: false,
  },
};

// Interface สำหรับโครงสร้างโฟลเดอร์
// interface FileItem {
//   name: string;
//   path: string;
// }

// interface Folder {
//   name: string;
//   path: string;
//   files?: string[];
//   subfolders?: Folder[];
// }

interface ValidationError {
  folderName: string;
  errors: string[];
}

// ฟังก์ชันตรวจสอบโครงสร้างโฟลเดอร์
// ฟังก์ชันตรวจสอบโครงสร้างโฟลเดอร์
function validateFolderStructure(folders?: Folder[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!folders || folders.length === 0) {
    return errors;
  }

  // ตรวจสอบ subfolders ทั้งหมด
  folders.forEach(folder => {
    if (folder.subfolders && folder.subfolders.length > 0) {
      folder.subfolders.forEach(subfolder => {
        const folderErrors: string[] = [];
        
        // ตรวจสอบว่ามีไฟล์หรือไม่
        if (!subfolder.files || subfolder.files.length === 0) {
          folderErrors.push('ไม่มีไฟล์ในโฟลเดอร์');
        } else {
          const files = subfolder.files.map(f => f.toLowerCase());
          
          // ตรวจสอบว่ามี prompt.txt
          const hasPrompt = files.includes('prompt.txt');
          if (!hasPrompt) {
            folderErrors.push('ไม่พบไฟล์ prompt.txt');
          }
          
          // ตรวจสอบว่ามี voice.txt
          const hasVoice = files.includes('voice.txt');
          if (!hasVoice) {
            folderErrors.push('ไม่พบไฟล์ voice.txt');
          }
          
          // ตรวจสอบว่ามีไฟล์รูปภาพ
          const imageExtensions = ['.png', '.jpg', '.jpeg'];
          const hasImage = files.some(file => 
            imageExtensions.some(ext => file.endsWith(ext))
          );
          if (!hasImage) {
            folderErrors.push('ไม่พบไฟล์รูปภาพ (.png, .jpg, .jpeg)');
          }
        }
        
        if (folderErrors.length > 0) {
          errors.push({
            folderName: subfolder.name || 'Unknown Folder', // ✅ แก้ตรงนี้
            errors: folderErrors
          });
        }
      });
    }
  });
  return errors;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return (res as any).status(405).json({ message: 'Method not allowed' });
  }

  const form = formidable({ uploadDir: './uploads', keepExtensions: true });

  if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads', { recursive: true });
  }

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('❌ Form parse error:', err);
      return (res as any).status(500).json({ message: 'Form parsing error' });
    }

    try {
      const userId = Array.isArray(fields.userId) ? fields.userId[0] : fields.userId || 'anonymous';

      const zipFiles = files.zipfile;
      if (!zipFiles || (Array.isArray(zipFiles) && zipFiles.length === 0)) {
        return (res as any).status(400).json({ message: 'No file uploaded' });
      }
      const zipFile = Array.isArray(zipFiles) ? zipFiles[0] : zipFiles;

      // แตกไฟล์ ZIP
      const zip = new AdmZip(zipFile.filepath);
      const extractPath = `./uploads/extracted/${Date.now()}`;
      fs.mkdirSync(extractPath, { recursive: true });
      zip.extractAllTo(extractPath, true);

      // อ่านโครงสร้างโฟลเดอร์และไฟล์
      const folderStructure = readFolderRecursive(extractPath);

      // ตรวจสอบโครงสร้างโฟลเดอร์
      // ส่งเป็น array เพราะ validateFolderStructure รับ Folder[]
      const validationErrors = validateFolderStructure([folderStructure]);
      
      // ถ้ามี error ให้ลบไฟล์ที่แตกออกและส่ง error กลับไป
      if (validationErrors.length > 0) {
        // ลบไฟล์ที่แตกออกมา
        fs.rmSync(extractPath, { recursive: true, force: true });
        
        return (res as any).status(400).json({ 
          message: 'โครงสร้างไฟล์ไม่ถูกต้อง',
          validationErrors
        });
      }

      // เชื่อมต่อ MongoDB
      const client = await clientPromise;
      const db = client.db();
      const videosCollection = db.collection('listfile');

      // สร้าง document ใหม่เก็บข้อมูลไฟล์ พร้อมโครงสร้างโฟลเดอร์
      const videoDoc = {
        userId,
        originalName: zipFile.originalFilename || 'unknown.zip',
        extractPath,
        status: 'done',
        createdAt: new Date(),
        folders: folderStructure,
      };
      await videosCollection.insertOne(videoDoc);

      // ลบไฟล์ zip ต้นฉบับ (optional)
      // fs.unlinkSync(zipFile.filepath);

      return (res as any).status(200).json({ 
        message: 'แตกไฟล์ ZIP สำเร็จ', 
        path: extractPath 
      });
    } catch (error) {
      console.error('❌ Extract error:', error);
      return (res as any).status(500).json({ message: 'Error extracting ZIP' });
    }
  });
}

// import type { NextApiRequest, NextApiResponse } from 'next'; 
// import formidable from 'formidable';
// import fs from 'fs';
// import AdmZip from 'adm-zip';
// import clientPromise from '@/lib/mongodb';
// import { readFolderRecursive } from '@/lib/readFolderRecursive'; // import เพิ่ม
// import { ObjectId } from 'mongodb';

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') {
//     return (res as any).status(405).json({ message: 'Method not allowed' });
//   }

//   const form = formidable({ uploadDir: './uploads', keepExtensions: true });

//   if (!fs.existsSync('./uploads')) {
//     fs.mkdirSync('./uploads', { recursive: true });
//   }

//   form.parse(req, async (err, fields, files) => {
//     if (err) {
//       console.error('❌ Form parse error:', err);
//       return (res as any).status(500).json({ message: 'Form parsing error' });
//     }

//     try {
//       const userId = Array.isArray(fields.userId) ? fields.userId[0] : fields.userId || 'anonymous';

//       const zipFiles = files.zipfile;
//       if (!zipFiles || (Array.isArray(zipFiles) && zipFiles.length === 0)) {
//         return (res as any).status(400).json({ message: 'No file uploaded' });
//       }
//       const zipFile = Array.isArray(zipFiles) ? zipFiles[0] : zipFiles;

//       // แตกไฟล์ ZIP
//       const zip = new AdmZip(zipFile.filepath);
//       const extractPath = `./uploads/extracted/${Date.now()}`;
//       fs.mkdirSync(extractPath, { recursive: true });
//       zip.extractAllTo(extractPath, true);
//       // fs.unlinkSync(zipFile.filepath);

//       // อ่านโครงสร้างโฟลเดอร์และไฟล์
//       const folderStructure = readFolderRecursive(extractPath);

//       // เชื่อมต่อ MongoDB
//       const client = await clientPromise;
//       const db = client.db();
//       const videosCollection = db.collection('listfile');

//       // สร้าง document ใหม่เก็บข้อมูลไฟล์ พร้อมโครงสร้างโฟลเดอร์
//       const videoDoc = {
//         userId,
//         originalName: zipFile.originalFilename || 'unknown.zip',
//         extractPath,
//         status: 'done',  // เปลี่ยนเป็น done
//         createdAt: new Date(),
//         folders: folderStructure,
//       };
//       await videosCollection.insertOne(videoDoc);

//       return (res as any).status(200).json({ message: 'แตกไฟล์ ZIP สำเร็จ', path: extractPath });
//     } catch (error) {
//       console.error('❌ Extract error:', error);
//       return (res as any).status(500).json({ message: 'Error extracting ZIP' });
//     }
//   });
// }