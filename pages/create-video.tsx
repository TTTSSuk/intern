import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function CreateVideoPage() {
  const router = useRouter();
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    // แสดงข้อความทันทีเมื่อโหลดหน้า
    setShowMessage(true);
  }, []);

  return (
    <div className="p-6">
      {showMessage && <h2>Hello wait workflow</h2>}
      {/* ส่วนอื่น ๆ ของ UI */}
    </div>
  );
}
