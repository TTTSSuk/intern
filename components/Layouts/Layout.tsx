// \components\Layouts\Layout.tsx
import { useRouter } from "next/router";
import { useState, useRef, useEffect } from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";

interface UserProfile {
  userId: string;
  name: string;
  tokens: number;
  avatarUrl?: string; // ใส่ URL รูป user ได้
}

interface LayoutProps {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  children: React.ReactNode;
}

export default function Layout({ user, setUser, children }: LayoutProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ใช้เพื่อป้องกัน hydration error
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
  // ลบข้อมูลผู้ใช้จาก localStorage หรือ cookie
  localStorage.removeItem("loggedInUser");
  // รีเซ็ตสถานะผู้ใช้ใน state ถ้ามี
  setUser(null);
  // เปลี่ยนหน้าไปที่ /login
  router.push("/login");
};

  
  const pageTitles: Record<string, string> = {
    // "/upload-zip": "อัปโหลดไฟล์",
    "/list-file": "รายการไฟล์",
    "/my-videos": "วิดีโอของฉัน",
    "/TokenHistory": "ประวัติ Token",
    // "/ceate-video": "สร้างวิดีโอ"
    // เพิ่มตามที่ต้องการ
  };

  // ใช้ isClient เพื่อป้องกัน hydration error
  const currentPath = isClient ? router.pathname : "";
  const pageTitle = pageTitles[currentPath] ?? "";
  const isDashboard = currentPath === "/dashboard";

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 w-full bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          {/* ซ้าย: โลโก้ */}
          <div
            onClick={() => router.push("/dashboard")}
            className="text-indigo-600 font-extrabold text-2xl cursor-pointer select-none"
          >
            MyLogo
          </div>

          {/* เมนูกลาง (ซ่อนบนมือถือ) */}
          <nav className="hidden md:flex space-x-8 text-gray-700 font-medium">
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

          {/* ขวา: Token + รูป user + dropdown */}
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
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              >
                {/* รูป user */}
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

                {/* ชื่อ และลูกศร dropdown */}
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

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 min-w-[180px] max-w-[240px] bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50"
                  role="menu"
                >
                  <button
                    onClick={handleEditProfile}
                    className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-indigo-100"
                    role="menuitem"
                  >
                    แก้ไขโปรไฟล์
                  </button>
                  <button
                    onClick={handleChangePassword}
                    className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-indigo-100"
                    role="menuitem"
                  >
                    เปลี่ยนรหัสผ่าน
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push("/TokenHistory");
                    }}
                    className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-indigo-100"
                    role="menuitem"
                  >
                    ดูประวัติ Token
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left text-red-600 font-semibold hover:bg-red-100"
                    role="menuitem"
                  >
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Page Title Section - ย้ายออกมาจาก dropdown */}
      {/* {isClient && !isDashboard && pageTitle && (
        <div className="fixed top-16 left-0 w-full bg-white shadow-sm z-40 flex items-center px-6 py-4 space-x-4">
          <button
            onClick={() => router.back()}
            aria-label="ย้อนกลับ"
            className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800"
          >
            <AiOutlineArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">{pageTitle}</h2>
        </div>
      )} */}

      {/* เนื้อหา - ปรับ padding ตามว่ามี page title หรือไม่ */}
      <main className={`px-6 ${isClient && !isDashboard && pageTitle ? "pt-32" : "pt-20"}`}>
        {children}
      </main>
    </>
  );
}