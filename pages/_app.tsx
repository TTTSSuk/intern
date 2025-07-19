// \pages\_app.tsx
import type { AppProps } from 'next/app'
import Layout from '../components/Layouts/Layout'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import '../styles/globals.css'

interface UserProfile {
  userId: string
  name: string
  tokens: number
}

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userId = localStorage.getItem('loggedInUser')
    if (userId) {
      fetch(`/api/users/profile?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          setUser(data.user)
          setLoading(false)
        })
        .catch(() => {
          setUser(null)
          setLoading(false)
        })
    } else {
      setUser(null)
      setLoading(false)
    }
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-screen">กำลังโหลดข้อมูลผู้ใช้...</div>
  }

  // ถ้า path เป็น /login หรือขึ้นต้นด้วย /admin ไม่ใช้ Layout
  if (
    router.pathname === '/login' ||
    router.pathname.startsWith('/admin')
  ) {
    return <Component {...pageProps} />
  }

  // หน้าอื่น ๆ ใช้ Layout
  return (
    <Layout user={user} setUser={setUser}>
      <Component {...pageProps} />
    </Layout>
  )
}
