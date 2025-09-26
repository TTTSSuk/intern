//pages\dashboard.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { User, FileText, Coins, Play } from 'lucide-react'

interface UserProfile {
  userId: string
  name: string
  tokens: number
  isActive: boolean
  isSuspended: boolean
  createdAt: string
  lastActive: string
}

interface UserFile {
  _id: string
  status: 'pending' | 'processing' | 'completed' | 'error'
}

export default function Dashboard() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [userFiles, setUserFiles] = useState<UserFile[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const userId = localStorage.getItem('loggedInUser')
    if (userId) {
      // Fetch user profile
      fetch(`/api/users/profile?userId=${userId}`)
        .then(res => res.json())
        .then(data => setUser(data.user))
        .catch(() => {
          // mock data on error
          setUser({
            userId,
            name: 'ผู้ใช้ทดสอบ',
            tokens: 15,
            isActive: true,
            isSuspended: false,
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
          })
        })

      // Fetch user files
      fetch(`/api/list-files?userId=${userId}`)
        .then(res => res.json())
        .then(data => setUserFiles(data.files || []))
        .catch(() => setUserFiles([]))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  const goToUpload = () => router.push('/upload-zip')
  const goToFiles = () => router.push('/list-files')
  const goToComplete = () => router.push('/my-videos')
  const goToTokens = () => router.push('/TokenHistory')

  const countFiles = (files: UserFile[]) => files.length
  const countVideos = (files: UserFile[]) =>
    files.filter(f => f.status === 'completed').length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลผู้ใช้...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <p className="text-gray-600 mb-4">ไม่พบข้อมูลผู้ใช้</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            เข้าสู่ระบบ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">สวัสดี, {user.name}!</h1>
              <p className="text-gray-600">ยินดีต้อนรับเข้าสู่ระบบ</p>
            </div>
          </div>
          <button
            onClick={goToUpload}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:from-blue-700 hover:to-blue-800"
          >
            <Play className="w-5 h-5" />
            <span>เริ่มสร้างวิดีโอ</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tokens */}
        <div
          onClick={goToTokens}
          className="cursor-pointer bg-gradient-to-r from-green-400 to-green-500 rounded-lg p-6 text-white hover:shadow-lg transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Tokens คงเหลือ</p>
              <p className="text-2xl font-bold">{user.tokens}</p>
            </div>
            <Coins className="w-8 h-8 text-green-200" />
          </div>
        </div>

        {/* Files Uploaded */}
        <div
          onClick={goToFiles}
          className="cursor-pointer bg-gradient-to-r from-purple-400 to-purple-500 rounded-lg p-6 text-white hover:shadow-lg transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">ไฟล์ที่อัปโหลด</p>
              <p className="text-2xl font-bold">{countFiles(userFiles)}</p>
            </div>
            <FileText className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        {/* Videos Completed */}
        <div
          onClick={goToComplete}
          className="cursor-pointer bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg p-6 text-white hover:shadow-lg transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">วิดีโอสำเร็จ</p>
              <p className="text-2xl font-bold">{countVideos(userFiles)}</p>
            </div>
            <FileText className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-white rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">ข้อมูลบัญชีผู้ใช้</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p>User ID: {user.userId}</p>
          <p>สถานะบัญชี: {user.isActive && !user.isSuspended ? 'ถูกระงับ' : 'ใช้งานได้'}</p>
          <p>สร้างบัญชีเมื่อ: {formatDate(user.createdAt)}</p>
          <p>เข้าใช้งานครั้งล่าสุด: {formatDate(user.lastActive)}</p>
        </div>
      </div>
    </div>
  )
}

// import { useEffect, useState } from 'react'
// import { useRouter } from 'next/router'

// interface UserProfile {
//   userId: string
//   name: string
//   tokens: number
// }

// export default function Dashboard() {
//   const [user, setUser] = useState<UserProfile | null>(null)
//   const router = useRouter()

//   useEffect(() => {
//     const userId = localStorage.getItem('loggedInUser')
//     if (userId) {
//       fetch(`/api/users/profile?userId=${userId}`)
//         .then(res => res.json())
//         .then(data => setUser(data.user))
//         .catch(() => setUser(null))
//     }
//   }, [])

//   if (!user) return <p>กำลังโหลดข้อมูลผู้ใช้...</p>

//   const startVideoWorkflow = () => {
//     // ไปหน้า Upload ขั้นตอน 1
//     router.push({
//       pathname: '/upload-zip',
//       query: { step: '1' } // ส่งค่า step=1 ไปหน้า upload
//     })
//   }

//   return (
//     <main
//       style={{
//         maxWidth: 600,
//         margin: '40px auto',
//         padding: 24,
//         fontFamily: 'Arial, sans-serif',
//         textAlign: 'center',
//       }}
//     >
//       <h1>สวัสดี, {user.name}!</h1>
//       <p>ยินดีต้อนรับเข้าสู่ระบบครับ</p>

//       <button
//         onClick={startVideoWorkflow}
//         style={{
//           marginTop: 40,
//           padding: '16px 32px',
//           fontSize: 18,
//           borderRadius: 8,
//           backgroundColor: '#1976d2',
//           color: '#fff',
//           border: 'none',
//           cursor: 'pointer',
//           boxShadow: '0 4px 8px rgba(25, 118, 210, 0.6)',
//           transition: 'background-color 0.3s',
//         }}
//         onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#155a9c')}
//         onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1976d2')}
//       >
//         เริ่มสร้างวิดีโอ
//       </button>
//     </main>
//   )
// }




// import { useEffect, useState } from 'react'
// import { useRouter } from 'next/router'

// interface UserProfile {
//   userId: string
//   name: string
//   tokens: number
// }

// export default function Dashboard() {
//   const [user, setUser] = useState<UserProfile | null>(null)
//   const router = useRouter()

//   useEffect(() => {
//     const userId = localStorage.getItem('loggedInUser')
//     if (userId) {
//       fetch(`/api/users/profile?userId=${userId}`)
//         .then(res => res.json())
//         .then(data => setUser(data.user))
//         .catch(() => setUser(null))
//     }
//   }, [])

//   if (!user) return <p>กำลังโหลดข้อมูลผู้ใช้...</p>

//   return (
//     <main
//       style={{
//         maxWidth: 600,
//         margin: '40px auto',
//         padding: 24,
//         fontFamily: 'Arial, sans-serif',
//         textAlign: 'center',
//       }}
//     >
//       <h1>สวัสดี, {user.name}!</h1>
//       <p>ยินดีต้อนรับเข้าสู่ระบบครับ</p>

//       <button
//         onClick={() => router.push('/create-video')}
//         style={{
//           marginTop: 40,
//           padding: '16px 32px',
//           fontSize: 18,
//           borderRadius: 8,
//           backgroundColor: '#1976d2',
//           color: '#fff',
//           border: 'none',
//           cursor: 'pointer',
//           boxShadow: '0 4px 8px rgba(25, 118, 210, 0.6)',
//           transition: 'background-color 0.3s',
//         }}
//         onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#155a9c')}
//         onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1976d2')}
//       >
//         เริ่มสรา้งวิดีโอ
//       </button>
//     </main>
//   )
// }
