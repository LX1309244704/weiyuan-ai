import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserInfo {
  id: string
  email: string
  username: string
  avatar: string
  points: number
  createdAt: string
  bio?: string
}

interface UserState {
  userInfo: UserInfo | null
  theme: 'light' | 'dark'
  language: 'zh' | 'en'
  setTheme: (theme: 'light' | 'dark') => void
  setLanguage: (language: 'zh' | 'en') => void
  updatePoints: (points: number) => void
  setUserInfo: (userInfo: UserInfo) => void
  clearUserInfo: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userInfo: null,
      theme: 'light',
      language: 'zh',
      
      setTheme: (theme) => {
        set({ theme })
        // 立即应用到document
        if (typeof document !== 'undefined') {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark')
            document.documentElement.setAttribute('data-theme', 'dark')
          } else {
            document.documentElement.classList.remove('dark')
            document.documentElement.setAttribute('data-theme', 'light')
          }
        }
      },
      
      setLanguage: (language) => {
        set({ language })
      },
      
      updatePoints: (points) => {
        const currentUserInfo = get().userInfo
        if (currentUserInfo) {
          set({
            userInfo: {
              ...currentUserInfo,
              points: Math.max(0, points)
            }
          })
        }
      },
      
      setUserInfo: (userInfo) => {
        set({ userInfo })
      },
      
      clearUserInfo: () => {
        set({ userInfo: null })
        // 强制清除持久化存储
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user-storage')
          sessionStorage.removeItem('user-storage')
        }
      }
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        userInfo: state.userInfo,
        theme: state.theme,
        language: state.language
      })
    }
  )
)

// 初始化用户信息（模拟数据）
export const initializeUserInfo = (user: any) => {
  const userStore = useUserStore.getState()
  if (!userStore.userInfo && user) {
    userStore.setUserInfo({
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
      points: 1000, // 初始点数
      createdAt: user.createdAt
    })
  }
}

// 初始化主题状态
export const initializeTheme = () => {
  const userStore = useUserStore.getState()
  // 确保主题在客户端正确应用
  if (typeof document !== 'undefined') {
    if (userStore.theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }
}

// 导出用户信息类型
export type { UserInfo }