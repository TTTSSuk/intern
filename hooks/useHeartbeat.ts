// hooks/useHeartbeat.ts
import { useEffect } from 'react';

/**
 * Hook สำหรับอัปเดต lastActive ของ user ทุก ๆ 2 นาที
 * เพื่อให้ระบบรู้ว่า user ยังใช้งานอยู่
 */
export function useHeartbeat() {
  useEffect(() => {
    const userId = localStorage.getItem('loggedInUser');
    
    if (!userId) return;

    // ฟังก์ชันอัปเดต lastActive
    const updateLastActive = async () => {
      try {
        await fetch('/api/update-last-active', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });
      } catch (error) {
        console.error('Failed to update lastActive:', error);
      }
    };

    // อัปเดตทันทีเมื่อโหลดหน้า
    updateLastActive();

    // ตั้ง interval อัปเดตทุก 2 นาที (120000 ms)
    const interval = setInterval(updateLastActive, 120000);

    // อัปเดตเมื่อมี activity (คลิก, เลื่อนหน้า)
    const handleActivity = () => {
      updateLastActive();
    };

    // เพิ่ม event listeners
    window.addEventListener('click', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, []);
}