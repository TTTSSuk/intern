import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

interface UserProfile {
  userId: string
  name: string
  tokens: number
}

export default function Dashboard() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userId = localStorage.getItem('loggedInUser')
    if (userId) {
      fetch(`/api/users/profile?userId=${userId}`)
        .then(res => res.json())
        .then(data => setUser(data.user))
        .catch(() => setUser(null))
    }
  }, [])

  if (!user) return <p>กำลังโหลดข้อมูลผู้ใช้...</p>

  return (
    <main
      style={{
        maxWidth: 600,
        margin: '40px auto',
        padding: 24,
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
      }}
    >
      <h1>สวัสดี, {user.name}!</h1>
      <p>ยินดีต้อนรับเข้าสู่ระบบครับ</p>

      <button
        onClick={() => router.push('/create-video')}
        style={{
          marginTop: 40,
          padding: '16px 32px',
          fontSize: 18,
          borderRadius: 8,
          backgroundColor: '#1976d2',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 8px rgba(25, 118, 210, 0.6)',
          transition: 'background-color 0.3s',
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#155a9c')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1976d2')}
      >
        Get Start Video
      </button>
    </main>
  )
}
