// // \components\Layouts\Layout.tsx
// Layout.tsx
import { useRouter } from "next/router";
import { useState, useRef, useEffect } from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";
import StepProgress from "@/components/Layouts/StepProgress";

interface UserProfile {
  userId: string;
  name: string;
  tokens: number;
  avatarUrl?: string;
}

interface LayoutProps {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  children: React.ReactNode;
  steps?: string[]; // สำหรับหน้า multi-step
  currentStep?: number;
  onNext?: () => void;
  onPreview?: () => void;
  onMyVideos?: () => void;
  showHomeButton?: boolean;
}

export default function Layout({
  user,
  setUser,
  children,
  steps,
  currentStep,
  onNext,
  onPreview,
  onMyVideos,
  showHomeButton = false,
}: LayoutProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ป้องกัน hydration error
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEditProfile = () => {
    setDropdownOpen(false);
    router.push("/EditProfile");
  };

  const handleChangePassword = () => {
    setDropdownOpen(false);
    router.push("/change-password");
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    setUser(null);
    router.push("/login");
  };

  const backgroundColor = "bg-gray-50"; // สีพื้นหลังโทนเดียว

  return (
    <div className={`${backgroundColor} min-h-screen flex flex-col`}>
      {/* Header */}
      <header className="fixed top-0 w-full bg-gray-50 shadow-md z-50 h-16">
  <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-full">
    {/* Logo */}
    <div onClick={() => router.push("/dashboard")} className="cursor-pointer select-none flex items-center">
<img
  src="/images/logo.png"
  alt="MediaFlux Logo"
  className="h-35 sm:h-14 md:h-30 w-auto object-contain"
/>
    </div>

    {/* Navbar */}
    <nav className="hidden md:flex space-x-8 text-gray-700 font-medium h-full items-center">
         {<button
              onClick={() => router.push("/list-file")}
              className="hover:text-indigo-600 transition"
            >
              รายการไฟล์
            </button>}{/* <button
              onClick={() => router.push("/upload-zip")}
              className="hover:text-indigo-600 transition"
            >
              อัปไฟล์
            </button>
            <button
              onClick={() => router.push("/list-file")}
              className="hover:text-indigo-600 transition"
            >
              รายการไฟล์
            </button> */}
            <button
              onClick={() => router.push("/my-videos")}
              className="hover:text-indigo-600 transition"
            >
              วิดีโอของฉัน
            </button>
            {/* <button
              onClick={() => router.push("/create-video")}
              className="hover:text-indigo-600 transition">
              สร้างวิดิโอ
            </button> */}
    </nav>

          {/* ขวา: Token + Avatar + Dropdown */}
          <div className="flex items-center space-x-4" ref={dropdownRef}>
            <button
              onClick={() => router.push("/TokenHistory")}
              className="text-gray-700 font-semibold hover:text-indigo-600 transition"
              title="ดูประวัติการใช้ Token"
            >
              Token: <span className="text-indigo-600">{user?.tokens ?? 0}</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="User Avatar"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-600 font-bold">
                    {user?.name ? user.name[0].toUpperCase() : "U"}
                  </div>
                )}
                <span className="text-gray-700 font-medium select-none">
                  {user?.name ?? "User"}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className={`w-4 h-4 text-gray-700 transition-transform ${
                    dropdownOpen ? "rotate-180" : "rotate-0"
                  }`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
<div className="absolute right-0 mt-2 min-w-[180px] max-w-[240px] bg-white rounded-md shadow-2xl ring-1 ring-gray-200 py-1 z-50 transition-shadow duration-300 ease-out">
    <button
      onClick={handleEditProfile}
      className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-indigo-100"
    >
      แก้ไขโปรไฟล์
    </button>
    <button
      onClick={handleChangePassword}
      className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-indigo-100"
    >
      เปลี่ยนรหัสผ่าน
    </button>
    <button
      onClick={() => {
        setDropdownOpen(false);
        router.push("/TokenHistory");
      }}
      className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-indigo-100"
    >
      ดูประวัติ Token
    </button>
    <hr className="my-1 border-gray-200" />
    <button
      onClick={handleLogout}
      className="block w-full px-4 py-2 text-left text-red-600 font-semibold hover:bg-red-100"
    >
      ออกจากระบบ
    </button>
  </div>
)}

            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pt-16">
        {/* Progress Bar - Sticky (เฉพาะ progress bar) */}
        {steps && currentStep && (
          <div className="sticky top-16 bg-gray-50 z-40 border-b border-gray-200 py-2">
            <div className="max-w-7xl mx-auto px-6">
              {/* Progress Bar เท่านั้น */}
              <div className="relative w-full">
                {/* Connection Lines */}
                <div className="absolute top-5 left-0 right-0 flex items-center px-5">
                  {steps.slice(0, -1).map((_, index) => (
                    <div
                      key={index}
                      className={`flex-1 h-1 ${index < currentStep - 1 ? 'bg-green-500' : 'bg-gray-300'}`}
                    ></div>
                  ))}
                </div>

                {/* Steps */}
                <div className="flex justify-between items-start relative z-10">
                  {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isActive = stepNumber === currentStep;
                    const isCompleted = stepNumber < currentStep;
                    return (
                      <div key={step} className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 flex items-center justify-center rounded-full border-2 font-semibold ${
                            isCompleted
                              ? 'bg-green-500 border-green-500 text-white'
                              : isActive
                              ? 'bg-blue-500 border-blue-500 text-white'
                              : 'bg-white border-gray-300 text-gray-500'
                          }`}
                        >
                          {isCompleted ? '✓' : stepNumber}
                        </div>
                        <p
                          className={`text-center mt-2 text-sm max-w-20 ${
                            isActive ? 'font-bold text-blue-500' : 'text-gray-500'
                          }`}
                        >
                          {step}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* StepProgress Buttons - ไม่ sticky */}
        {steps && currentStep && (
          <div className="max-w-7xl mx-auto px-6 py-4 w-full">
            <div className="flex justify-between items-center">
              {/* ด้านซ้าย - Home และ Preview */}
              <div className="flex items-center space-x-3">
                {showHomeButton && (
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Home
                  </button>
                )}
                
                {onPreview && (
                  <button
                    onClick={onPreview}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Preview
                  </button>
                )}
              </div>

              {/* ด้านขวา - My Videos และ Next */}
              <div className="flex items-center space-x-3">
                {onMyVideos && (
                  <button
                    onClick={onMyVideos}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium"
                  >
                    วิดีโอของฉัน
                  </button>
                )}

                {onNext && (
                  <button
                    onClick={onNext}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* เนื้อหาของหน้า - สามารถเลื่อนได้ */}
        <div className="flex-1 max-w-7xl mx-auto px-6 pb-8 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}


// import { useRouter } from "next/router";
// import { useState, useRef, useEffect } from "react";
// import { AiOutlineArrowLeft } from "react-icons/ai";

// interface UserProfile {
//   userId: string;
//   name: string;
//   tokens: number;
//   avatarUrl?: string; // ใส่ URL รูป user ได้
// }

// interface LayoutProps {
//   user: UserProfile | null;
//   setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
//   children: React.ReactNode;
// }

// export default function Layout({ user, setUser, children }: LayoutProps) {
//   const router = useRouter();
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [isClient, setIsClient] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   // ใช้เพื่อป้องกัน hydration error
//   useEffect(() => {
//     setIsClient(true);
//   }, []);

//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setDropdownOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleEditProfile = () => {
//     setDropdownOpen(false);
//     router.push("/EditProfile");
//   };

//   const handleChangePassword = () => {
//     setDropdownOpen(false);
//     router.push("/change-password");
//   };

//   const handleLogout = () => {
//   // ลบข้อมูลผู้ใช้จาก localStorage หรือ cookie
//   localStorage.removeItem("loggedInUser");
//   // รีเซ็ตสถานะผู้ใช้ใน state ถ้ามี
//   setUser(null);
//   // เปลี่ยนหน้าไปที่ /login
//   router.push("/login");
// };

  
//   const pageTitles: Record<string, string> = {
//     // "/upload-zip": "อัปโหลดไฟล์",
//     "/list-file": "รายการไฟล์",
//     "/my-videos": "วิดีโอของฉัน",
//     "/TokenHistory": "ประวัติ Token",
//     // "/ceate-video": "สร้างวิดีโอ"
//     // เพิ่มตามที่ต้องการ
//   };

//   // ใช้ isClient เพื่อป้องกัน hydration error
//   const currentPath = isClient ? router.pathname : "";
//   const pageTitle = pageTitles[currentPath] ?? "";
//   const isDashboard = currentPath === "/dashboard";

//   return (
//     <>
//       {/* Header */}
//       <header className="fixed top-0 w-full bg-white shadow-md z-50">
//         <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
//           {/* ซ้าย: โลโก้ */}
//           <div
//             onClick={() => router.push("/dashboard")}
//             className="text-indigo-600 font-extrabold text-2xl cursor-pointer select-none"
//           >
//             MyLogo
//           </div>

//           {/* เมนูกลาง (ซ่อนบนมือถือ) */}
//           <nav className="hidden md:flex space-x-8 text-gray-700 font-medium">
//             {<button
//               onClick={() => router.push("/list-file")}
//               className="hover:text-indigo-600 transition"
//             >
//               รายการไฟล์
//             </button>}{/* <button
//               onClick={() => router.push("/upload-zip")}
//               className="hover:text-indigo-600 transition"
//             >
//               อัปไฟล์
//             </button>
//             <button
//               onClick={() => router.push("/list-file")}
//               className="hover:text-indigo-600 transition"
//             >
//               รายการไฟล์
//             </button> */}
//             <button
//               onClick={() => router.push("/my-videos")}
//               className="hover:text-indigo-600 transition"
//             >
//               วิดีโอของฉัน
//             </button>
//             {/* <button
//               onClick={() => router.push("/create-video")}
//               className="hover:text-indigo-600 transition">
//               สร้างวิดิโอ
//             </button> */}
//           </nav>

//           {/* ขวา: Token + รูป user + dropdown */}
//           <div className="flex items-center space-x-4" ref={dropdownRef}>
//             <button
//               onClick={() => router.push("/TokenHistory")}
//               className="text-gray-700 font-semibold hover:text-indigo-600 transition"
//               title="ดูประวัติการใช้ Token"
//             >
//               Token: <span className="text-indigo-600">{user?.tokens ?? 0}</span>
//             </button>

//             <div className="relative">
//               <button
//                 onClick={() => setDropdownOpen(!dropdownOpen)}
//                 className="flex items-center space-x-2 focus:outline-none"
//                 aria-haspopup="true"
//                 aria-expanded={dropdownOpen}
//               >
//                 {/* รูป user */}
//                 {user?.avatarUrl ? (
//                   <img
//                     src={user.avatarUrl}
//                     alt="User Avatar"
//                     className="w-8 h-8 rounded-full object-cover"
//                   />
//                 ) : (
//                   <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-600 font-bold">
//                     {user?.name ? user.name[0].toUpperCase() : "U"}
//                   </div>
//                 )}

//                 {/* ชื่อ และลูกศร dropdown */}
//                 <span className="text-gray-700 font-medium select-none">
//                   {user?.name ?? "User"}
//                 </span>
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                   className={`w-4 h-4 text-gray-700 transition-transform ${
//                     dropdownOpen ? "rotate-180" : "rotate-0"
//                   }`}
//                 >
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                 </svg>
//               </button>

//               {/* Dropdown Menu */}
//               {dropdownOpen && (
//                 <div
//                   className="absolute right-0 mt-2 min-w-[180px] max-w-[240px] bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50"
//                   role="menu"
//                 >
//                   <button
//                     onClick={handleEditProfile}
//                     className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-indigo-100"
//                     role="menuitem"
//                   >
//                     แก้ไขโปรไฟล์
//                   </button>
//                   <button
//                     onClick={handleChangePassword}
//                     className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-indigo-100"
//                     role="menuitem"
//                   >
//                     เปลี่ยนรหัสผ่าน
//                   </button>
//                   <button
//                     onClick={() => {
//                       setDropdownOpen(false);
//                       router.push("/TokenHistory");
//                     }}
//                     className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-indigo-100"
//                     role="menuitem"
//                   >
//                     ดูประวัติ Token
//                   </button>
//                   <hr className="my-1 border-gray-200" />
//                   <button
//                     onClick={handleLogout}
//                     className="block w-full px-4 py-2 text-left text-red-600 font-semibold hover:bg-red-100"
//                     role="menuitem"
//                   >
//                     ออกจากระบบ
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Page Title Section - ย้ายออกมาจาก dropdown */}
//       {/* {isClient && !isDashboard && pageTitle && (
//         <div className="fixed top-16 left-0 w-full bg-white shadow-sm z-40 flex items-center px-6 py-4 space-x-4">
//           <button
//             onClick={() => router.back()}
//             aria-label="ย้อนกลับ"
//             className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800"
//           >
//             <AiOutlineArrowLeft size={20} />
//           </button>
//           <h2 className="text-xl font-semibold text-gray-900">{pageTitle}</h2>
//         </div>
//       )} */}

//       {/* เนื้อหา - ปรับ padding ตามว่ามี page title หรือไม่ */}
//       <main className={`px-6 ${isClient && !isDashboard && pageTitle ? "pt-32" : "pt-20"}`}>
//         {children}
//       </main>
//     </>
//   );
// }