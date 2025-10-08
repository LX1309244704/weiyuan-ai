'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/canvas')
  }, [router])

  return (
    <div style={{padding: 24}}>跳转中...</div>
  )
}