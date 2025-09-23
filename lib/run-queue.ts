// lib/run-queue.ts
import 'dotenv/config';
import { processQueue } from './workers/queue-worker';
import cron from 'node-cron';

// เพิ่ม error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // ไม่ exit ทันที ให้โอกาสระบบทำงานต่อ
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
  // ไม่ exit ทันที ให้โอกาสระบบทำงานต่อ
  setTimeout(() => process.exit(1), 1000);
});

console.log('🚀 Queue worker starting...');
console.log(`📅 Started at: ${new Date().toISOString()}`);

// ตรวจสอบ environment variables
console.log('📋 Environment check:');
console.log(`   N8N_API_KEY: ${process.env.N8N_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   N8N_API_BASE_URL: ${process.env.N8N_API_BASE_URL || '❌ Missing'}`);
console.log(`   N8N_WORKFLOW_ID: ${process.env.N8N_WORKFLOW_ID || '❌ Missing'}`);
console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'}`);

// ตัวแปรสำหรับติดตาม error
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;
let isProcessing = false;

// ฟังก์ชันสำหรับ process queue ที่มี error handling
async function safeProcessQueue() {
  if (isProcessing) {
    console.log('⏳ Queue is already being processed, skipping...');
    return;
  }

  isProcessing = true;
  const startTime = Date.now();
  
  try {
    console.log(`⏰ Processing queue at: ${new Date().toISOString()}`);
    await processQueue();
    
    // รีเซ็ต error counter เมื่อสำเร็จ
    consecutiveErrors = 0;
    
    const duration = Date.now() - startTime;
    console.log(`✅ Queue processed successfully in ${duration}ms`);
    
  } catch (error) {
    consecutiveErrors++;
    const duration = Date.now() - startTime;
    
    console.error(`❌ Error in queue processing (attempt ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}) after ${duration}ms:`, error);
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n') // แสดงแค่ 5 บรรทัดแรกของ stack
      });
    }
    
    // ถ้า error ติดต่อกันเกินกำหนด ให้หยุดชั่วคราว
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      console.error(`🛑 Too many consecutive errors (${consecutiveErrors}). Pausing for 5 minutes...`);
      setTimeout(() => {
        console.log('🔄 Resuming queue processing after error pause...');
        consecutiveErrors = 0; // รีเซ็ต counter
      }, 5 * 60 * 1000); // หยุด 5 นาที
    }
  } finally {
    isProcessing = false;
  }
}

// ทดสอบ processQueue ก่อน
async function testQueue() {
  try {
    console.log('🧪 Testing queue processing...');
    await safeProcessQueue();
    console.log('✅ Queue test completed');
    return true;
  } catch (error) {
    console.error('❌ Queue test failed:', error);
    return false;
  }
}

// รัน test ก่อน แล้วค่อยเริ่ม cron
testQueue().then((success) => {
  if (!success) {
    console.error('❌ Initial test failed, but continuing anyway...');
  }
  
  console.log('📅 Starting cron job...');
  
  // รันทุก 15 วินาที (ลดจาก 10 วินาที เพื่อลด load)
  const task = cron.schedule('*/15 * * * * *', async () => {
    // ข้าม execution ถ้ามี error ติดต่อกันมาก
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      console.log('⏭️ Skipping execution due to consecutive errors');
      return;
    }
    
    await safeProcessQueue();
  });

  console.log('✅ Queue worker started successfully!');
  console.log('📝 Running every 15 seconds...');
  console.log('📊 Error threshold: 5 consecutive errors before pause');
  
  // Health check ทุก 5 นาที
  const healthCheck = cron.schedule('0 */5 * * * *', () => {
    console.log(`💓 Health check: ${new Date().toISOString()}`);
    console.log(`   - Consecutive errors: ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}`);
    console.log(`   - Currently processing: ${isProcessing ? 'Yes' : 'No'}`);
    console.log(`   - Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  });
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('🛑 Shutting down gracefully...');
    console.log('⏹️ Stopping cron jobs...');
    task.stop();
    healthCheck.stop();
    
    // ให้เวลา process ที่กำลังรันให้เสร็จ
    if (isProcessing) {
      console.log('⏳ Waiting for current process to complete...');
      setTimeout(() => {
        console.log('👋 Queue worker stopped');
        process.exit(0);
      }, 5000); // รอ 5 วินาที
    } else {
      console.log('👋 Queue worker stopped');
      process.exit(0);
    }
  });

  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down...');
    task.stop();
    healthCheck.stop();
    process.exit(0);
  });
  
}).catch((error) => {
  console.error('❌ Failed to start queue worker:', error);
  process.exit(1);
});