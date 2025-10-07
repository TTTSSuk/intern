// // pages/api/users/token-history.ts
// pages/api/users/token-history.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return (res as any).status(400).json({ message: 'userId is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('login-form-app');
    
    const tokenDoc = await db.collection('user_tokens').findOne({ userId });
    const tokens = tokenDoc?.tokens ?? 0;

    console.log(`🔍 Calculating reserved tokens for user: ${userId}`);

    // ✅ คำนวณ reserved tokens จาก token_history
    // หา type ที่เป็นการจอง (token_reserved) และปล่อย (token_released)
    const reservedHistory = await db.collection('token_history').find({
      userId,
      type: { $in: ['token_reserved', 'token_released'] }
    }).toArray();

    // คำนวณยอดรวม reserved tokens
    // token_reserved: change = -2 (จอง 2 tokens)
    // token_released: change = +1 (ปล่อย 1 token)
    // ผลรวม = -2 + 1 = -1 หมายถึง reserved 1 token
    const reservedSum = reservedHistory.reduce((sum, entry) => {
      return sum + (entry.change || 0);
    }, 0);

    // Reserved tokens = ค่าสัมบูรณ์ของผลรวมที่เป็นลบ
    const reservedTokens = Math.abs(Math.min(0, reservedSum));

    console.log(`📊 Reserved history entries: ${reservedHistory.length}`);
    console.log(`   Sum of changes: ${reservedSum}`);
    console.log(`   Final reserved tokens: ${reservedTokens}`);

    // Debug: แสดงรายการจอง/ปล่อย
    reservedHistory.forEach(entry => {
      const icon = entry.type === 'token_reserved' ? '🔒' : '🔓';
      console.log(`  ${icon} ${entry.type}: ${entry.change} | ${entry.fileName || 'N/A'}`);
    });

    // กรองรายการจอง/ปล่อย token ออกจากตารางที่แสดงใน UI
    const tokenHistory = await db.collection('token_history')
      .find({ 
        userId,
        type: { 
          $nin: ['reserve', 'release', 'token_reserved', 'token_released'] 
        }
      })
      .sort({ date: -1 })
      .toArray();

    return (res as any).status(200).json({
      tokens,
      reservedTokens,
      tokenHistory: tokenHistory.map(h => ({
        date: h.date,
        change: h.change,
        reason: h.reason,
        type: h.type,
        executionId: h.executionId,
        folderName: h.folderName, 
        fileName: h.fileName,
        video: h.video,
      })),
    });
  } catch (error) {
    console.error('❌ Error in token-history API:', error);
    return (res as any).status(500).json({ message: 'Internal server error' });
  }
}


// import type { NextApiRequest, NextApiResponse } from 'next';
// import clientPromise from '@/lib/mongodb';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   const { userId } = req.query;

//   if (!userId || typeof userId !== 'string') {
//     return (res as any).status(400).json({ message: 'userId is required' });
//   }

//   try {
//     const client = await clientPromise;
//     const db = client.db('login-form-app');
    
//     const tokenDoc = await db.collection('user_tokens').findOne({ userId });
//     const tokens = tokenDoc?.tokens ?? 0;

//     // ใช้เฉพาะ listfile เท่านั้น (ข้อมูลจริงของงานที่กำลังทำ)
//     const runningJobs = await db.collection('listfile').find({
//       userId,
//       status: { $in: ['queued', 'running', 'processing'] },
//       tokensReserved: { $exists: true, $gt: 0 }
//     }).toArray();

//     const reservedTokens = runningJobs.reduce((sum, job) => {
//       console.log(`📌 Job: ${job.originalName} - Reserved: ${job.tokensReserved}`);
//       return sum + (job.tokensReserved || 0);
//     }, 0);

//     console.log(`✅ Total reserved: ${reservedTokens} tokens`);

//     // กรองรายการจอง/ปล่อย token ออกจากตาราง
//     const tokenHistory = await db.collection('token_history')
//       .find({ 
//         userId,
//         type: { 
//           $nin: ['reserve', 'release', 'token_reserved', 'token_released'] 
//         }
//       })
//       .sort({ date: -1 })
//       .toArray();

//     return (res as any).status(200).json({
//       tokens,
//       reservedTokens,
//       tokenHistory: tokenHistory.map(h => ({
//         date: h.date,
//         change: h.change,
//         reason: h.reason,
//         type: h.type,
//         executionId: h.executionId,
//         folderName: h.folderName, 
//         fileName: h.fileName,
//         video: h.video,
//       })),
//     });
//   } catch (error) {
//     console.error(error);
//     return (res as any).status(500).json({ message: 'Internal server error' });
//   }
// }