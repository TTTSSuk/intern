// videos.tsx
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function VideoPage() {
  const router = useRouter()
  const { videoUrl } = router.query

  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (typeof videoUrl === 'string') {
      setUrl(videoUrl)
    }
  }, [videoUrl])

  if (!url) {
    return <p>กำลังโหลดวิดีโอ...</p>
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">แสดงวิดีโอ</h1>
      <video controls width="100%" src={url} />
    </div>
  )
}
