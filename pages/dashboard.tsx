//pages/dashboard.tsx
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { 
  User, 
  FileText, 
  Coins, 
  Play, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  CheckCircle,
  Clock
} from 'lucide-react'
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, EffectCards } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-cards";


const BASE_VIDEO_URL = "http://192.168.70.166:8080"
// const BASE_VIDEO_URL = 'http://192.168.39.21:8080/'

interface UserProfile {
  userId: string
  name: string
  tokens: number
  isActive: boolean
  isSuspended: boolean
  createdAt: string
  lastActive: string
}

interface VideoClip {
  video?: string
  finalVideo?: string
  folderName?: string
  createdAt: string
  tokenDeducted?: boolean
}

interface UserFile {
  _id: string
  originalName: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  clips?: VideoClip[]
  createdAt: string
}

export default function Dashboard() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [userFiles, setUserFiles] = useState<UserFile[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const videoSectionRef = useRef<HTMLDivElement>(null)  // เพิ่มบรรทัดนี้
  const router = useRouter()

  useEffect(() => {
    const userId = localStorage.getItem('loggedInUser')
    if (userId) {
      fetch(`/api/users/profile?userId=${userId}`)
        .then(res => res.json())
        .then(data => setUser(data.user))
        .catch(() => {
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

      fetch(`/api/list-files?userId=${userId}`)
        .then(res => res.json())
        .then(data => setUserFiles(data.files || []))
        .catch(() => setUserFiles([]))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    })
  }

  const goToUpload = () => router.push('/upload-zip')
  const goToFiles = () => router.push('/list-file')
  const goToComplete = () => router.push('/my-videos')
  const goToTokens = () => router.push('/TokenHistory')
  const scrollToVideos = () => {
  videoSectionRef.current?.scrollIntoView({ 
    behavior: 'smooth', 
    block: 'center'
  })
}

  const countFiles = (files: UserFile[]) => files.length
  const countVideos = (files: UserFile[]) =>
    files.filter(f => f.clips && f.clips.some(clip => clip.finalVideo)).length

  const finalVideos = userFiles
    .filter(file => file.clips && file.clips.length > 0)
    .flatMap(file => 
      (file.clips || [])
        .filter(clip => clip.finalVideo)
        .map(clip => ({
          fileId: file._id,
          fileName: file.originalName,
          folderName: clip.folderName || 'Unknown',
          videoUrl: `${BASE_VIDEO_URL}/${clip.finalVideo}`,
          createdAt: clip.createdAt || file.createdAt,
          status: file.status
        }))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const videosPerPage = 3
  const totalPages = Math.ceil(finalVideos.length / videosPerPage)
  const currentVideos = finalVideos.slice(
    currentPage * videosPerPage,
    (currentPage + 1) * videosPerPage
  )

  useEffect(() => {
    if (finalVideos.length > videosPerPage) {
      scrollIntervalRef.current = setInterval(() => {
        setCurrentPage(prev => (prev + 1) % totalPages)
      }, 5000)

      return () => {
        if (scrollIntervalRef.current) {
          clearInterval(scrollIntervalRef.current)
        }
      }
    }
  }, [finalVideos.length, totalPages, videosPerPage])

  const nextPage = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current)
    }
    setCurrentPage((prev) => (prev + 1) % totalPages)
  }

  const prevPage = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current)
    }
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลผู้ใช้...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <p className="text-gray-600 mb-4">ไม่พบข้อมูลผู้ใช้</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            เข้าสู่ระบบ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">สวัสดี, {user.name}!</h1>
                <p className="text-gray-600 text-sm mt-1">ยินดีต้อนรับเข้าสู่ระบบ</p>
              </div>
            </div>
            <button
              onClick={goToUpload}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
            >
              <Play className="w-5 h-5" />
              <span className="font-semibold">เริ่มสร้างวิดีโอ</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div
            onClick={goToTokens}
            className="cursor-pointer bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-xl p-3">
                <Coins className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Tokens คงเหลือ</h3>
            <p className="text-3xl font-bold text-blue-600">{user.tokens}</p>
            <p className="text-xs text-gray-500 mt-1">คลิกเพื่อดูประวัติ</p>
          </div>

          <div
            onClick={goToFiles}
            className="cursor-pointer bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 rounded-xl p-3">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">ไฟล์ที่อัปโหลด</h3>
            <p className="text-3xl font-bold text-purple-600">{countFiles(userFiles)}</p>
            <p className="text-xs text-gray-500 mt-1">ไฟล์ทั้งหมด</p>
          </div>

          <div
  onClick={scrollToVideos}  // เพิ่มบรรทัดนี้
  className="cursor-pointer bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all"
>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-xl p-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">วิดีโอสำเร็จ</h3>
            <p className="text-3xl font-bold text-green-600">{countVideos(userFiles)}</p>
            <p className="text-xs text-gray-500 mt-1">วิดีโอที่เสร็จแล้ว</p>
          </div>
        </div>

          {finalVideos.length > 0 && (
<div 
    ref={videoSectionRef} 
    className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-8 mb-6"
  >    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
        <div className="p-2 bg-blue-600 rounded-lg shadow-md">
          <Play className="w-6 h-6 text-white fill-white" />
        </div>
        วิดีโอล่าสุด
      </h2>
      <div className="flex items-center gap-2">
        {/* <span className="text-sm text-gray-500 font-medium">
          {finalVideos.length} วิดีโอ
        </span> */}
      </div>
    </div>

    {/* Swiper Carousel */}
    <div className="relative group">
      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={16}
        slidesPerView={3}
        slidesPerGroup={1}
        navigation={{
          prevEl: '.swiper-button-prev-custom',
          nextEl: '.swiper-button-next-custom',
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        breakpoints={{
          320: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
        className="pb-2"
      >
        {finalVideos.map((video, index) => (
          <SwiperSlide key={`${video.fileId}-${index}`}>
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 
                          shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              {/* Video Container - แค่วิดีโออย่างเดียว */}
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800" 
                   style={{ paddingTop: "56.25%" }}>
                <video
                  controls
                  className="absolute top-0 left-0 w-full h-full"
                  style={{ objectFit: "contain" }}
                  preload="metadata"
                  onError={(e) => {
                    console.error('Video error:', video.videoUrl);
                    console.log('Video path:', video.videoUrl);
                  }}
                >
                  <source src={video.videoUrl} type="video/mp4" />
                  ไม่สามารถโหลดวิดีโอได้
                </video>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Buttons */}
      <button
        className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 
                   bg-white hover:bg-gray-50 rounded-full p-3 shadow-lg border border-gray-200
                   opacity-0 group-hover:opacity-100 transition-all duration-300
                   hover:scale-110 active:scale-95"
        aria-label="Previous"
      >
        <ChevronLeft className="w-6 h-6 text-gray-700" />
      </button>

      <button
        className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 
                   bg-white hover:bg-gray-50 rounded-full p-3 shadow-lg border border-gray-200
                   opacity-0 group-hover:opacity-100 transition-all duration-300
                   hover:scale-110 active:scale-95"
        aria-label="Next"
      >
        <ChevronRight className="w-6 h-6 text-gray-700" />
      </button>
    </div>

    {/* Progress Indicator Dots */}
    <div className="flex justify-center gap-2 mt-6">
      {Array.from({ length: Math.min(finalVideos.length, 5) }).map((_, index) => (
        <div
          key={index}
          className="w-2 h-2 rounded-full bg-gray-300 hover:bg-blue-500 
                   transition-colors duration-300 cursor-pointer"
        />
      ))}
    </div>
  </div>
)}


        {finalVideos.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center mb-6">
            <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">ยังไม่มีวิดีโอที่สร้างเสร็จ</p>
            <button
              onClick={goToUpload}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              เริ่มสร้างวิดีโอแรก
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-600" />
            ข้อมูลบัญชีผู้ใช้
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-gray-600 font-medium min-w-[120px]">User ID:</span>
              <span className="text-gray-900">{user.userId}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-gray-600 font-medium min-w-[120px]">สถานะบัญชี:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                user.isActive && !user.isSuspended 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {user.isActive && !user.isSuspended ? 'ใช้งานได้' : 'ถูกระงับ'}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-gray-600 font-medium min-w-[120px]">สร้างบัญชีเมื่อ:</span>
              <span className="text-gray-900">{formatDate(user.createdAt)}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-gray-600 font-medium min-w-[120px]">เข้าใช้งานครั้งล่าสุด:</span>
              <span className="text-gray-900">{formatDate(user.lastActive)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}