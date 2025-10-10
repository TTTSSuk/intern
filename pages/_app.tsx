// pages/_app.tsx
import type { AppProps } from 'next/app'
import Layout from '../components/Layouts/Layout'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import '../styles/globals.css'
import { StepProvider } from '@/context/StepContext'

interface UserProfile {
  userId: string
  name: string
  tokens: number
  reservedTokens?: number
}

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // ✅ โหลด user ทุกครั้งที่เปลี่ยนหน้า
  useEffect(() => {
    const loadUser = async () => {
      const userId = localStorage.getItem('loggedInUser')
      
      console.log('🔄 _app.tsx: Loading user...', { userId, pathname: router.pathname })
      
      if (userId) {
        try {
          const res = await fetch(`/api/users/profile?userId=${userId}`)
          const data = await res.json()
          
          if (data.user) {
            console.log('✅ _app.tsx: User loaded', data.user)
            setUser({
              userId: data.user.userId,
              name: data.user.name,
              tokens: data.user.tokens,
              reservedTokens: data.user.reservedTokens || 0
            })
          } else {
            console.warn('⚠️ _app.tsx: No user data returned')
            setUser(null)
          }
        } catch (error) {
          console.error('❌ _app.tsx: Error loading user', error)
          setUser(null)
        }
      } else {
        console.log('ℹ️ _app.tsx: No userId in localStorage')
        setUser(null)
      }
      
      setLoading(false)
    }

    loadUser()
  }, [router.pathname]) // ✅ รีโหลดทุกครั้งที่เปลี่ยนหน้า

  // ✅ รับ Event จาก login
  useEffect(() => {
    const handleUserLoggedIn = async (e: any) => {
      const { userId, name } = e.detail
      console.log('📢 _app.tsx: Received userLoggedIn event', { userId, name })
      
      try {
        const res = await fetch(`/api/users/profile?userId=${userId}`)
        const data = await res.json()
        
        if (data.user) {
          console.log('✅ _app.tsx: User updated from event', data.user)
          setUser({
            userId: data.user.userId,
            name: data.user.name,
            tokens: data.user.tokens,
            reservedTokens: data.user.reservedTokens || 0
          })
        }
      } catch (error) {
        console.error('❌ _app.tsx: Error loading user from event', error)
      }
    }

    window.addEventListener('userLoggedIn', handleUserLoggedIn)
    console.log('✅ _app.tsx: Event listener added')
    
    return () => {
      window.removeEventListener('userLoggedIn', handleUserLoggedIn)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลผู้ใช้...</p>
        </div>
      </div>
    )
  }

  if (
    router.pathname === '/' ||
    router.pathname === '/login' ||
    router.pathname.startsWith('/admin')
  ) {
    return (
      <StepProvider>
        <Component {...pageProps} />
      </StepProvider>
    )
  }

  return (
    <StepProvider>
      <Layout user={user} setUser={setUser}>
        <Component {...pageProps} />
      </Layout>
    </StepProvider>
  )
}


// 10/10/68
// pages/_app.tsx
// import type { AppProps } from 'next/app'
// import Layout from '../components/Layouts/Layout'
// import { useState, useEffect } from 'react'
// import { useRouter } from 'next/router'
// import '../styles/globals.css'
// import { StepProvider } from '@/context/StepContext'

// interface UserProfile {
//   userId: string
//   name: string
//   tokens: number
//   reservedTokens?: number // เพิ่มบรรทัดนี้
// }

// export default function MyApp({ Component, pageProps }: AppProps) {
//   const router = useRouter()
//   const [user, setUser] = useState<UserProfile | null>(null)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     const userId = localStorage.getItem('loggedInUser')
//     if (userId) {
//       fetch(`/api/users/profile?userId=${userId}`)
//         .then(res => res.json())
//         .then(data => {
//           setUser({
//             userId: data.user.userId,
//             name: data.user.name,
//             tokens: data.user.tokens,
//             reservedTokens: data.user.reservedTokens || 0 // เพิ่มบรรทัดนี้
//           })
//           setLoading(false)
//         })
//         .catch(() => {
//           setUser(null)
//           setLoading(false)
//         })
//     } else {
//       setUser(null)
//       setLoading(false)
//     }
//   }, [])

//   if (loading) {
//     return <div className="flex items-center justify-center h-screen">กำลังโหลดข้อมูลผู้ใช้...</div>
//   }

//   if (
//     router.pathname === '/' ||
//     router.pathname === '/login' ||
//     router.pathname.startsWith('/admin')
//   ) {
//     return (
//       <StepProvider>
//         <Component {...pageProps} />
//       </StepProvider>
//     )
//   }

//   return (
//     <StepProvider>
//       <Layout user={user} setUser={setUser}>
//         <Component {...pageProps} />
//       </Layout>
//     </StepProvider>
//   )
// }