//components\Layouts\AdminLayout.tsx

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AiOutlineUser } from "react-icons/ai";
import {
  AiOutlineHome,
  AiOutlineUserAdd,
  AiOutlineUsergroupAdd,
  AiOutlineLogout,
  AiOutlineArrowLeft,
} from "react-icons/ai";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [adminId, setAdminId] = useState("");
  const [stats, setStats] = useState<{ adminName?: string }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const loggedInAdmin = localStorage.getItem("loggedInAdmin");
      if (!loggedInAdmin) {
        console.warn("Admin not logged in!");
        router.push("/admin/login");
        return;
      }

      setAdminId(loggedInAdmin);
      console.log("🔍 Fetching admin info for:", loggedInAdmin); // Debug log

      try {
        const res = await fetch(`/api/admin/stats?adminId=${loggedInAdmin}`);
        if (!res.ok) {
          throw new Error("Failed to fetch stats");
        }
        const data = await res.json();
        console.log("📊 Stats received:", data); // Debug log
        console.log("👤 Admin name from DB:", data.adminName); // Debug log
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("loggedInAdmin");
    router.push("/admin/login");
  };

  const getPageTitle = () => {
    if (router.pathname === "/admin/manage-users") return "Manage Users";
    if (router.pathname === "/admin/add-user") return "Add Users";
    if (router.pathname === "/admin/user/[userId]") return "Manage Users";
  };

  const showBackButton = router.pathname !== "/admin/dashboard";

  const isActive = (path: string) => {
    if (path === "/admin/manage-users") {
      return (
        router.pathname === "/admin/manage-users" || 
        router.pathname === "/admin/user/[userId]"
      );
    }
    return router.pathname === path;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar fixed */}
      <aside className="w-64 bg-white shadow-md p-6 flex flex-col fixed top-0 left-0 h-screen overflow-auto">
        <img
          src="/images/logo.png"
          alt="MediaFlux Logo"
          className="h-8 sm:h-10 md:h-30 w-auto object-contain mx-auto"
        />
        <nav className="flex flex-col space-y-3 flex-1">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className={`flex items-center space-x-3 px-4 py-3 rounded-md font-semibold transition-colors
              ${isActive("/admin/dashboard")
                ? "bg-blue-600 text-white"
                : "hover:bg-blue-100 text-blue-700"
              }`}
          >
            <AiOutlineHome size={20} />
            <span>Home</span>
          </button>
          <button
            onClick={() => router.push("/admin/add-user")}
            className={`flex items-center space-x-3 px-4 py-3 rounded-md font-semibold transition-colors
              ${isActive("/admin/add-user")
                ? "bg-blue-600 text-white"
                : "hover:bg-blue-100 text-blue-700"
              }`}
          >
            <AiOutlineUserAdd size={20} />
            <span>Add Users</span>
          </button>
          <button
            onClick={() => router.push("/admin/manage-users")}
            className={`flex items-center space-x-3 px-4 py-3 rounded-md font-semibold transition-colors
              ${isActive("/admin/manage-users")
                ? "bg-blue-600 text-white"
                : "hover:bg-blue-100 text-blue-700"
              }`}
          >
            <AiOutlineUsergroupAdd size={20} />
            <span>Manage Users</span>
          </button>

          {/* ชื่อแอดมิน */}
          <div className="flex items-center space-x-3 mt-6 mb-4 text-gray-700 font-medium">
            <AiOutlineUser size={20} />
            <span>
              {isLoading ? (
                "Loading..."
              ) : stats.adminName ? (
                stats.adminName
              ) : (
                adminId || "Admin"
              )}
            </span>
          </div>
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 mt-auto rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors font-semibold"
        >
          <AiOutlineLogout size={20} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-gray-50 ml-64">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={() => router.back()}
                aria-label="Back"
              >
                <AiOutlineArrowLeft size={24} />
              </button>
            )}
            <h2 className="text-3xl font-semibold text-gray-900">
              {getPageTitle()}
            </h2>
          </div>
        </div>

        {/* Page Content */}
        {children}
      </main>
    </div>
  );
}

// import { ReactNode, useEffect, useState } from "react";
// import { useRouter } from "next/router";
// import { AiOutlineUser } from "react-icons/ai";
// import {
//   AiOutlineHome,
//   AiOutlineUserAdd,
//   AiOutlineUsergroupAdd,
//   // AiOutlineSetting,
//   AiOutlineLogout,
//   AiOutlineArrowLeft,
// } from "react-icons/ai";

// interface AdminLayoutProps {
//   children: ReactNode;
// }

// export default function AdminLayout({ children }: AdminLayoutProps) {
//   const router = useRouter();
//   const [adminId, setAdminId] = useState("");

//   useEffect(() => {
//     const loggedInAdmin = localStorage.getItem("loggedInAdmin");

//     if (!loggedInAdmin) {
//       router.push("/admin/login");
//     } else {
//       setAdminId(loggedInAdmin);
//     }
//   }, [router]);

//   const handleLogout = () => {
//     localStorage.removeItem("loggedInAdmin");
//     router.push("/admin/login");
//   };

//   const getPageTitle = () => {
//     // if (router.pathname === "/admin/dashboard") return "Admin Dashboard";
//     if (router.pathname === "/admin/manage-users") return "Manage Users";
//     if (router.pathname === "/admin/add-user") return "Add Users";
//     // if (router.pathname === "/admin/settings") return "Settings";
//     if (router.pathname === "/admin/user/[userId]") return "Manage Users";
//     // return "Admin Dashboard";
//   };

//   const showBackButton = router.pathname !== "/admin/dashboard";

//   const isActive = (path: string) => {
//   if (path === "/admin/manage-users") {
//     return (
//       router.pathname === "/admin/manage-users" || 
//       router.pathname === "/admin/user/[userId]"
//     );
//   }
//   return router.pathname === path;
// };

//   return (
//     <div className="flex min-h-screen bg-gray-50">
//       {/* Sidebar fixed */}
//       <aside
//         className="w-64 bg-white shadow-md p-6 flex flex-col fixed top-0 left-0 h-screen overflow-auto"
//       >
//         <img
//             src="/images/logo.png"
//             alt="MediaFlux Logo"
//             className="h-8 sm:h-10 md:h-30 w-auto object-contain mx-auto"
//           />
//         <nav className="flex flex-col space-y-3 flex-1">
//           <button
//             onClick={() => router.push("/admin/dashboard")}
//             className={`flex items-center space-x-3 px-4 py-3 rounded-md font-semibold transition-colors
//               ${isActive("/admin/dashboard")
//                 ? "bg-blue-600 text-white"
//                 : "hover:bg-blue-100 text-blue-700"
//               }`}
//           >
//             <AiOutlineHome size={20} />
//             <span>Home</span>
//           </button>
//           <button
//             onClick={() => router.push("/admin/add-user")}
//             className={`flex items-center space-x-3 px-4 py-3 rounded-md font-semibold transition-colors
//               ${isActive("/admin/add-user")
//                 ? "bg-blue-600 text-white"
//                 : "hover:bg-blue-100 text-blue-700"
//               }`}
//           >
//             <AiOutlineUserAdd size={20} />
//             <span>Add Users</span>
//           </button>
//           <button
//             onClick={() => router.push("/admin/manage-users")}
//             className={`flex items-center space-x-3 px-4 py-3 rounded-md font-semibold transition-colors
//               ${isActive("/admin/manage-users")
//                 ? "bg-blue-600 text-white"
//                 : "hover:bg-blue-100 text-blue-700"
//               }`}
//           >
//             <AiOutlineUsergroupAdd size={20} />
//             <span>Manage Users</span>
//           </button>
//           {/* <button
//             onClick={() => alert("กำลังพัฒนา")}
//             className={`flex items-center space-x-3 px-4 py-3 rounded-md font-semibold transition-colors
//               ${isActive("/admin/settings")
//                 ? "bg-blue-600 text-white"
//                 : "hover:bg-blue-100 text-blue-700"
//               }`}
//           >
//             <AiOutlineSetting size={20} />
//             <span>Settings</span>
//           </button> */}
//           {/* ชื่อแอดมิน */}
//           <div className="flex items-center space-x-3 mt-6 mb-4 text-gray-700 font-medium">
//             <AiOutlineUser size={20} />
//             <span>{adminId}</span>
//           </div>
//         </nav>
//         <button
//           onClick={handleLogout}
//           className="flex items-center space-x-3 px-4 py-3 mt-auto rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors font-semibold"
//         >
//           <AiOutlineLogout size={20} />
//           <span>Logout</span>
//         </button>
//       </aside>

//       {/* Main Content */}
//       <main className="flex-1 p-8 bg-gray-50 ml-64">
//         <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
//           <div className="flex items-center space-x-4">
//             {showBackButton && (
//               <button
//                 onClick={() => router.back()}
//                 aria-label="Back"
//               >
//                 <AiOutlineArrowLeft size={24} />
//               </button>
//             )}
//             <h2 className="text-3xl font-semibold text-gray-900">
//               {getPageTitle()}
//             </h2>
//           </div>
//           {/* ชื่อแอดมินตัดออกจากตรงนี้นะครับ เพราะแสดงใน sidebar แล้ว */}
//         </div>

//         {/* Page Content */}
//         {children}
//       </main>
//     </div>
//   );
// }
