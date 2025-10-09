import { useState } from 'react';
import { 
  Book, 
  LogIn, 
  Home, 
  Upload, 
  FileText, 
  Video, 
  Coins, 
  User,
  AlertCircle,
  Search,
  ArrowLeft,
  X,
  Info
} from 'lucide-react';

export default function HelpManual() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showStructurePopup, setShowStructurePopup] = useState(false);

  // const [showWarning, setShowWarning] = useState(false);
  // const [showTips, setShowTips] = useState(false);
  const [popupView, setPopupView] = useState('tips');

  const BASE_VIDEO_URL = "http://192.168.70.166:8080";

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const sections = [
    {
      id: '1',
      title: '1. การเข้าสู่ระบบ',
      icon: <LogIn className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 p-4 rounded">
            {/* <p className="text-sm text-blue-800">
              <strong>ขั้นตอนการเข้าสู่ระบบ</strong>
            </p> */}
          <div className="pl-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">1</div>
              <div>
                <p className="font-medium text-gray-800">เปิดเว็บไซต์และพบหน้า Login</p>
                <div className="flex justify-center">
    <div className="bg-gray-100 p-2 rounded overflow-hidden">
      <img
        src={`${BASE_VIDEO_URL}/manual-help/login.png`}
        alt="หน้า Dashboard แสดงภาพรวมทั้งหมด"
        className="max-w-md h-auto rounded"
      />
    </div>
  </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">2</div>
              <div>
                <p className="font-medium text-gray-800">กรอก <span className="text-indigo-600">User ID</span> และ <span className="text-indigo-600">รหัสผ่าน</span> ที่ได้รับจากผู้ดูแลระบบ</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">3</div>
              <div>
                <p className="font-medium text-gray-800">คลิกปุ่ม "เข้าสู่ระบบ"</p>
              </div>
            </div>
            </div>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <p className="text-sm font-semibold text-yellow-800 mb-2">📌 หมายเหตุ:</p>
            <ul className="text-sm text-yellow-800 space-y-1 ml-4 list-disc">
              <li>หากลืมรหัสผ่าน ให้ติดต่อผู้ดูแลระบบ</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: '2',
      title: '2. หน้าหลัก (Dashboard)',
      icon: <Home className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
  <div className="flex justify-center">
    <div className="bg-gray-100 p-2 rounded overflow-hidden">
      <img
        src={`${BASE_VIDEO_URL}/manual-help/dashboard.png`}
        alt="หน้า Dashboard แสดงภาพรวมทั้งหมด"
        className="max-w-md h-auto rounded"
      />
    </div>
  </div> 
  <div className="border-l-4 border-blue-500 p-4 rounded">
          <div className="pl-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">1</div>
              <div>
                <p className="font-medium text-gray-800">เมื่อต้องการ เริ่มสร้างวิดีโอ/อัปโหลดไฟล์ คลิกที่ <span 
                  onClick={() => scrollToSection('3')} 
                  className="cursor-pointer underline text-indigo-700 hover:text-indigo-900 font-bold">เริ่มสร้างวิดีโอ</span>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">2</div>
              <div>
                <p className="font-medium text-gray-800">เมื่อต้องการดูไฟล์ที่เคยอัปโหลด คลิกที่ <span 
                  onClick={() => scrollToSection('4')} 
                  className="cursor-pointer underline text-indigo-700 hover:text-indigo-900 font-bold"
                >
                  รายการไฟล์</span>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">3</div>
              <div>
                <p className="font-medium text-gray-800">เมื่อต้องการ ดูประวัติการใช้งาน Token <span 
                  onClick={() => scrollToSection('7')} 
                  className="cursor-pointer underline text-indigo-700 hover:text-indigo-900 font-bold"
                >
                  Token : 0
                </span></p>
              </div>
            </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: '3',
      title: '3. การอัปโหลดไฟล์ ZIP',
      icon: <Upload className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="flex justify-center">
    <div className="bg-gray-100 p-2 rounded overflow-hidden">
      <img
        src={`${BASE_VIDEO_URL}/manual-help/upload.png`}
        alt="หน้า Dashboard แสดงภาพรวมทั้งหมด"
        className="max-w-md h-auto rounded"
      />
    </div>
  </div>         
              <div className="relative inline-block group">
  {/* หัวข้อหลัก */}
  <div className="flex items-center gap-2 text-red-600">
    <AlertCircle className="w-5 h-5" />
    <span className="text-sm font-semibold">ข้อควรระวัง</span>
  </div>

  {/* Tooltip - แสดงเมื่อ hover */}
  <div className="absolute left-0 top-full mt-2 w-96 bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
    <p className="font-semibold text-red-800 text-sm">
      ต้องอัปโหลดเป็นไฟล์ ZIP ที่มีโครงสร้างถูกต้องเท่านั้น
    </p>
    <ul className="text-xs text-red-700 mt-2 space-y-1 list-disc ml-4">
      <li>
        ระบบจะประมวลผลวิดีโอได้ <strong>เฉพาะเมื่อไฟล์เป็น .zip</strong>
      </li>
      <li>
        มีโฟลเดอร์ย่อยพร้อม <strong>prompt.txt, voice.txt และรูปภาพ</strong> ครบถ้วน
      </li>
    </ul>
  </div>
</div>

          <div className="border-l-4 border-blue-500 p-4 rounded">
          <div className="pl-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">1</div>
              <div>
                <p className="font-medium text-gray-800">คลิกที่พื้นที่อัปโหลด หรือลากไฟล์มาวาง</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">2</div>
              <div>
                <p className="font-medium text-gray-800"><span className="cursor-pointer underline text-indigo-700 hover:text-indigo-900 font-bold"
                onClick={() => setShowStructurePopup(true)} >ตรวจสอบชื่อไฟล์</span>
              และขนาด
                </p>
               <div className="flex justify-center">
  </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">3</div>
              <div>
                <p className="font-medium text-gray-800">คลิก "อัปโหลด ZIP"</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">4</div>
              <div>
                <p className="font-medium text-gray-800">รอจนกว่าการอัปโหลดเสร็จสิ้น</p>
              </div>
            </div>
          </div>
        </div>
        </div>
      )
    },
    {
      id: '4',
      title: '4. รายการไฟล์',
      icon: <FileText className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="flex justify-center">
    <div className="bg-gray-100 p-2 rounded overflow-hidden">
      <img
        src={`${BASE_VIDEO_URL}/manual-help/listfile.png`}
        alt="listfile img "
        className="max-w-md h-auto rounded"
      />
    </div>
  </div>

          <div className="space-y-3">
            <div className="border-l-4 border-blue-500 p-4 rounded">
          <div className="pl-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">1</div>
              <div>
                <p className="font-medium text-gray-800">ให้ "คลิกเลือกไฟล์ ZIP" ที่อัปโหลดเสร็จสมบูรณ์แล้ว</p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <input type="radio" className="mt-1" readOnly checked />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-gray-800">example.zip</h5>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-green-500 text-white text-xs rounded">ถัดไป</button>
                      <button className="px-3 py-1 bg-red-500 text-white text-xs rounded">ลบ</button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">วันที่อัปโหลด: 15 Jan 2025, 10:30</p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">2</div>
              <div>
                <p className="font-medium text-gray-800">ตรวจสอบชื่อไฟล์
                </p>
               <div className="flex justify-center">
  </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">3</div>
              <div>
                <p className="font-medium text-gray-800">กดปุ่ม "ถัดไป"</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">4</div>
              <div>
                <p className="font-medium text-gray-800">เข้าสู่ขั้นตอนที่  <span 
                  onClick={() => scrollToSection('5')} 
                  className="cursor-pointer underline text-indigo-700 hover:text-indigo-900 font-bold"
                >
                  การสร้างวิดีโอ
                </span></p>
              </div>
            </div>
          </div>
        </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <p className="text-sm font-semibold text-yellow-800 mb-2">📌 หมายเหตุ:</p>
              <ul className="text-sm text-yellow-800 space-y-1 ml-4 list-disc">
                <li>สามารถเลือกได้เฉพาะไฟล์ที่ยังไม่ได้สร้างวิดีโอ</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: '5',
      title: '5. การสร้างวิดีโอ',
      icon: <Video className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="flex justify-center">
    <div className="bg-gray-100 p-2 rounded overflow-hidden">
      <img
        src={`${BASE_VIDEO_URL}/manual-help/createvdo.png`}
        alt="หน้า Dashboard แสดงภาพรวมทั้งหมด"
        className="max-w-md h-auto rounded"
      />
    </div>
  </div>

        <div className="border-l-4 border-blue-500 p-4 rounded">
          <div className="pl-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">1</div>
              <div>
                <p className="font-medium text-gray-800">คลิก "เริ่มสร้างวิดีโอ" เพื่อรับคิว</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">2</div>
              <div>
                <p className="font-medium text-gray-800">ระบบจะใช้เวลาประมวลผล 45-55 นาที/โฟลเดอร์
                </p>
               <div className="flex justify-center">
  </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">3</div>
              <div>
                <p className="font-medium text-gray-800">สามารถเช็ครายละเอียดสถานะ</p>
              </div>
            </div>
          </div>
        </div>

          <div className="space-y-3">
            <div className="flex items-center gap-6">
  {/* คำเตือน - แสดงเมื่อ hover */}
  <div className="relative inline-block group">
    <div className="flex items-center gap-2 text-red-600">
      <AlertCircle className="w-5 h-5" />
      <span className="text-sm font-semibold">ข้อควรระวัง</span>
    </div>

    {/* Tooltip */}
    <div className="absolute left-0 top-full mt-2 w-80 bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
      <ul className="text-xs text-red-800 space-y-1 list-disc ml-4">
        <li>เมื่อเริ่มสร้างแล้ว ไม่สามารถยกเลิกได้จนกว่าจะเสร็จสิ้น</li>
        <li>Token จะถูกล็อคไว้เมื่อเริ่มงาน</li>
        <li>Token จะถูกหักจริงเมื่อได้รับวิดีโอ</li>
      </ul>
    </div>
  </div>

  {/* เคล็ดลับ - แสดงเมื่อ hover */}
  <div className="relative inline-block group">
    <div className="flex items-center gap-2 text-blue-600">
      <Info className="w-5 h-5" />
      <span className="text-sm font-semibold">เคล็ดลับ</span>
    </div>

    {/* Tooltip */}
    <div className="absolute left-0 top-full mt-2 w-80 bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
      <ul className="text-xs text-blue-800 space-y-1 list-disc ml-4">
        <li>หน้าจอจะอัปเดทอัตโนมัติทุก 10 วินาที</li>
        <li>สามารถยกเลิกได้เฉพาะเมื่อสถานะเป็น "อยู่ในคิว"</li>
        <li>Token จะคืนกลับเมื่อยกเลิกคิว</li>
        <li>ไม่สามารถยกเลิกได้เฉพาะเมื่อสถานะเป็น "กำลังสร้างวิดีโอ"</li>
      </ul>
    </div>
  </div>
          </div>
            <h4 className="font-semibold text-gray-800">สถานะการทำงาน</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-sm">พร้อมเริ่มงาน - ยังไม่เริ่มสร้าง</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded">
                <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>
                <span className="text-sm">อยู่ในคิว - รองาน</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-blue-50 rounded">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-sm">กำลังสร้างวิดีโอ - ประมวลผลอยู่</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-green-50 rounded">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm">เสร็จสิ้น - พร้อมดาวน์โหลด</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-red-50 rounded">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm">เกิดข้อผิดพลาด - ติดต่อผู้ดูแล</span>
              </div>
            </div>
          </div> 
          
        </div>
      )
    },
    {
      id: '6',
      title: '6. วิดีโอของฉัน',
      icon: <Video className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-center">
    <div className="bg-gray-100 p-2 rounded overflow-hidden">
      <img
        src={`${BASE_VIDEO_URL}/manual-help/myvdo.png`}
        alt="หน้า Dashboard แสดงภาพรวมทั้งหมด"
        className="max-w-md h-auto rounded"
      />
    </div>
  </div>

            <h4 className="font-semibold text-gray-800">ประวัติการสร้างวิดีโอ</h4>
            <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
              <li>สามารถดูประวัติการสร้างวิดีโอ และรายละเอียดต่างๆได้</li>
              <li>ข้อมูลงาน (Execution ID, สถานะ, เวลา)</li>
              <li>คลิปที่สร้าง (Generated Clips)</li>
              <li>วิดีโอสำเร็จรูป (Final Video)</li>
            </ul>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <p className="text-sm font-semibold text-yellow-800 mb-2">📌 หมายเหตุ:</p>
            <ul className="text-sm text-yellow-800 space-y-1 ml-4 list-disc">
              <li>
                วิดีโออยู่ในสถานะ "เกิดข้อผิดพลาด" (Error) ท่านสามารถไปที่{' '}
                <span 
                  onClick={() => scrollToSection('4')} 
                  className="cursor-pointer underline text-indigo-700 hover:text-indigo-900 font-bold"
                >
                  รายการไฟล์
                </span> หรือ <span 
                  onClick={() => scrollToSection('3')} 
                  className="cursor-pointer underline text-indigo-700 hover:text-indigo-900 font-bold"
                >
                  อัปโหลดไฟล์
                </span> เพื่อเริ่มสร้างวิดีโอใหม่
              </li>
            </ul>
          </div> 
        </div>
      )
    },
    {
      id: '7',
      title: '7. ประวัติการใช้ Token',
      icon: <Coins className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="flex justify-center">
    <div className="bg-gray-100 p-2 rounded overflow-hidden">
      <img
        src={`${BASE_VIDEO_URL}/manual-help/histoken.png`}
        alt="หน้า Dashboard แสดงภาพรวมทั้งหมด"
        className="max-w-md h-auto rounded"
      />
    </div>
  </div>

          <div className="border-l-4 border-blue-500 p-4 rounded">
          <div className="pl-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">1</div>
              <div>
                <p className="font-medium text-gray-800">สามารถดูรายละเอียดของการ เพิ่ม/ลด Token</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">2</div>
              <div>
                <p className="font-medium text-gray-800">สามารถดูได้ว่าตอนนี้ Token โดนล็อคไว้เท่าไหร่</p>
                <div className="bg-gray-100 p-2 rounded overflow-hidden inline-block">
  <img
    src={`${BASE_VIDEO_URL}/manual-help/lock.png`}
    alt="img"
    className="max-w-md h-auto rounded"
  />
</div>
              </div>
            </div>
          </div>
        </div>
        </div>
      )
    },
    {
      id: '8',
      title: '8. การจัดการโปรไฟล์',
      icon: <User className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">

            <div>
    <h3 className="text-lg font-semibold text-blue-700 mb-2">การแก้ไขโปรไฟล์</h3>
              <div className="border-l-4 border-blue-500 p-4 rounded">
                <div className="bg-gray-100 p-2 rounded overflow-hidden inline-block">
  <img
    src={`${BASE_VIDEO_URL}/manual-help/editname.png`}
    alt="img"
    className="max-w-md h-auto rounded"
  />
</div>
          <div className="pl-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">1</div>
              <div>
                <p className="font-medium text-gray-800">กรอกชื่อผู้ใช้เพื่อเปลี่ยนทำการเปลี่ยนชื่อ</p>
              </div>
              
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">2</div>
              <div>
                <p className="font-medium text-gray-800">ไม่สามารถเปลี่ยน User ID ได้</p>
              </div>
            </div>
          </div>
        </div>
        </div>

        <div>
    <h3 className="text-lg font-semibold text-blue-700 mb-2">การเปลี่ยนรหัสผ่าน</h3> 
        <div className="border-l-4 border-blue-500 p-4 rounded">
          <div className="bg-gray-100 p-2 rounded overflow-hidden inline-block">
  <img
    src={`${BASE_VIDEO_URL}/manual-help/password.png`}
    alt="img"
    className="max-w-md h-auto rounded"
  />
</div>
          <div className="pl-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">1</div>
              <div>
                <p className="font-medium text-gray-800">กรอกรหัสผ่านเก่า</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">2</div>
              <div>
                <p className="font-medium text-gray-800">กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)</p>
               <div className="flex justify-center">
  </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">3</div>
              <div>
                <p className="font-medium text-gray-800">ยืนยันรหัสผ่านใหม่</p>
              </div>
            </div>
          </div>
        </div>  
        </div>

            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
              <p className="text-sm font-semibold text-red-800 mb-1">ออกจากระบบ</p>
              <p className="text-sm text-red-700">คลิกเมนูผู้ใช้ → "ออกจากระบบ" เพื่อออกจากระบบทันที</p>
            </div>
          </div>
        </div>
      )
    },
   {
      id: 'troubleshoot',
      title: 'การแก้ปัญหาเบื้องต้น',
      icon: <AlertCircle className="w-5 h-5" />,
      content: (
        <div className="grid md:grid-cols-2 gap-4">
          {/* <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <h5 className="font-semibold text-red-800 mb-2">❌ ไม่สามารถเข้าสู่ระบบได้</h5>
            <ul className="text-sm text-red-700 space-y-1 ml-4 list-disc">
              <li>ตรวจสอบ User ID และรหัสผ่านว่าถูกต้อง</li>
              <li>ตรวจสอบ Caps Lock ไม่ได้เปิดค้าง</li>
              <li>ลองรีเฟรชหน้าเว็บ</li>
              <li>ติดต่อผู้ดูแลระบบ</li>
            </ul>
          </div> */}
          {/* <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <h5 className="font-semibold text-yellow-800 mb-2">⚠️ อัปโหลดไฟล์ล้มเหลว</h5>
            <ul className="text-sm text-yellow-700 space-y-1 ml-4 list-disc">
              <li>ตรวจสอบขนาดไฟล์ ไม่ควรใหญ่เกินไป</li>
              <li>ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</li>
              <li>ตรวจสอบโครงสร้างไฟล์ ZIP</li>
              <li>ลองอัปโหลดใหม่อีกครั้ง</li>
            </ul>
          </div> */}
          {/* <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
            <h5 className="font-semibold text-orange-800 mb-2">🔧 โครงสร้างไฟล์ไม่ถูกต้อง</h5>
            <ul className="text-sm text-orange-700 space-y-1 ml-4 list-disc">
              <li>อ่านข้อความแจ้งเตือนให้ละเอียด</li>
              <li>ตรวจสอบแต่ละโฟลเดอร์ว่ามีไฟล์ครบหรือไม่</li>
              <li>ตรวจสอบชื่อไฟล์ว่าถูกต้องหรือไม่</li>
              <li>แก้ไขและบีบอัดไฟล์ใหม่</li>
            </ul>
          </div> */}
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
            <h5 className="font-semibold text-purple-800 mb-2">💰 Token ไม่เพียงพอ</h5>
            <ul className="text-sm text-purple-700 space-y-1 ml-4 list-disc">
              <li>ตรวจสอบ Token คงเหลือ</li>
              <li>ตรวจสอบ Token ที่ถูกจอง (ถ้ามี)</li>
              <li>ติดต่อผู้ดูแลระบบเพื่อเติม Token</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const filteredSections = sections.filter(section => 
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.id.includes(searchTerm.toLowerCase())
  );

  return (
     <div className="min-h-screen">
      {/* Enhanced Header with 3D Effect */}
      <div className="bg-white border-b border-gray-200 py-6 px-4">
  <div className="max-w-7xl mx-auto">
    <div className="flex items-center gap-4">
      <button 
        onClick={() => window.history.back()}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-gray-600" />
      </button>
      {/* <div className="flex items-center gap-3">
        <Book className="w-8 h-8 text-gray-700" /> */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">คู่มือการใช้งานระบบ MediaFlux</h1>
          <p className="text-gray-500 text-sm mt-0.5">แนะนำการใช้งานระบบสร้างวิดีโอ</p>
        {/* </div> */}
      </div>
    </div>
  </div>
</div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-8">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Book className="w-5 h-5 text-indigo-600" />
                  สารบัญ
                </h3>
                <nav className="space-y-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 text-gray-600 hover:bg-gray-100"
                    >
                      <div className="flex-shrink-0 text-gray-400">{section.icon}</div>
                      <span className="truncate">{section.title}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {filteredSections.length === 0 ? (
                <div className="p-12 text-center">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">ไม่พบหัวข้อที่ค้นหา</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredSections.map((section) => (
                    <div key={section.id} id={`section-${section.id}`} className="p-6">
                      <div className="flex items-center gap-3 border-b border-indigo-100 pb-4 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                          {section.icon}
                        </div>
                        <h2 className="font-bold text-gray-800 text-2xl">{section.title}</h2>
                      </div>
                      <div className="mt-4">{section.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl shadow-lg border border-amber-200 p-6">
              <h3 className="font-bold text-amber-900 text-lg mb-4 flex items-center gap-2">
                💡 เคล็ดลับการใช้งาน
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-2">✅ ควรทำ</h4>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                    <li>ตรวจสอบโครงสร้างไฟล์ก่อนอัปโหลด</li>
                    <li>ตรวจสอบ Token ก่อนเริ่มงาน</li>
                    <li>ใช้รูปความละเอียดสูง</li>
                    <li>เก็บไฟล์ต้นฉบับไว้</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2">❌ ไม่ควรทำ</h4>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                    <li>อัปโหลดเนื้อหาที่มีลิขสิทธิ์</li>
                    <li>ปิดหน้าจอขณะอัปโหลด</li>
                    <li>สร้างหลายงานพร้อมกัน</li>
                    <li>แชร์บัญชีผู้ใช้</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">ต้องการความช่วยเหลือเพิ่มเติม?</h3>
                  <p className="text-sm text-gray-600">หากมีข้อสงสัยหรือพบปัญหา กรุณาติดต่อผู้ดูแลระบบ</p>
                </div>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium"
                >
                  กลับหน้าหลัก
                </button>
              </div>
            </div>

            <div className="mt-4 text-center text-sm text-gray-500">
              <p>เวอร์ชัน 1.0 | อัปเดทล่าสุด: {new Date().toLocaleDateString('en-US')}</p>
            </div>
          </div>
        </div>
      </div>

      {showStructurePopup && (
  <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/30 p-4">
    <div className="bg-white border-2 border-purple-200 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] shadow-2xl flex flex-col">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Info className="w-6 h-6 text-white" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPopupView('tips')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                popupView === 'tips'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              คำแนะนำ
            </button>
            <button
              onClick={() => setPopupView('structure')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                popupView === 'structure'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              โครงสร้างไฟล์
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowStructurePopup(false)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-purple-400">
        {popupView === 'tips' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
            {/* โฟลเดอร์ */}
            <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-lg">
              <h3 className="font-bold text-amber-900 text-sm mb-2 flex items-center gap-1.5">
                <span>📁</span>
                ชื่อโฟลเดอร์
              </h3>
              <ul className="text-xs text-amber-800 space-y-0.5 ml-5 list-disc">
                <li>เรียงลำดับตามวิดีโอ</li>
                <li>แนะนำ scene-001, scene-002</li>
                <li>ใช้ตัวเลขเพื่อเรียงง่าย</li>
              </ul>
            </div>

            {/* รูปภาพ */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-lg">
              <h3 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-1.5">
                <span>🖼️</span>
                รูปภาพ
              </h3>
              <ul className="text-xs text-blue-800 space-y-0.5 ml-5 list-disc">
                <li>รองรับ JPG, PNG, JPEG</li>
                <li>ตั้งชื่อได้ตามต้องการ</li>
                <li>แนะนำความละเอียด 1920x1080</li>
                <li>ขนาดไฟล์ไม่เกิน 5MB</li>
              </ul>
            </div>

            {/* prompt.txt */}
            <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-lg">
              <h3 className="font-bold text-green-900 text-sm mb-2 flex items-center gap-1.5">
                <span>📝</span>
                prompt.txt
              </h3>
              <ul className="text-xs text-green-800 space-y-0.5 ml-5 list-disc">
                <li>ชื่อต้องเป็น prompt.txt</li>
                <li>เขียนเป็นภาษาไทย</li>
                <li>บรรยายลักษณะวิดีโอ</li>
                <li>ยิ่งละเอียดยิ่งดี</li>
              </ul>
            </div>

            {/* voice.txt */}
            <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded-lg">
              <h3 className="font-bold text-purple-900 text-sm mb-2 flex items-center gap-1.5">
                <span>🎙️</span>
                voice.txt
              </h3>
              <ul className="text-xs text-purple-800 space-y-0.5 ml-5 list-disc">
                <li>เขียนเป็นภาษาไทย</li>
                <li>ความยาว 7-8 วินาที (50-70 คำ)</li>
                <li>เนื้อหาบรรยายวิดีโอ</li>
              </ul>
            </div>
          </div>
        ) : (
          <pre className="bg-gray-900 text-green-400 p-4 text-sm font-mono leading-relaxed rounded-lg m-4">
{`folderName.zip
│
├── scene-001/
│   ├── image.jpg         ← รูปภาพใดก็ได้
│   ├── prompt.txt        ← คำบรรยายลักษณะวิดีโอ
│   └── voice.txt         ← เนื้อหาการบรรยาย
│
├── scene-002/
│   ├── photo.png         ← รูปภาพใดก็ได้
│   ├── prompt.txt        ← คำบรรยายลักษณะวิดีโอ
│   └── voice.txt         ← เนื้อหาการบรรยาย
│
├── scene-003/
    ├── picture.jpeg      ← รูปภาพใดก็ได้
    ├── prompt.txt        ← คำบรรยายลักษณะวิดีโอ
    └── voice.txt         ← เนื้อหาการบรรยาย`}
          </pre>
        )}
      </div>
    </div>
  </div>
)}
    </div>
  );
}