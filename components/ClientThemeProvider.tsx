'use client'

import { useUserStore } from '@/stores/userStore'
import { useEffect } from 'react'

export default function ClientThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useUserStore()

  // 在组件挂载时应用存储的主题
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // 确保初始主题正确应用
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [theme])

  return <>{children}</>
}