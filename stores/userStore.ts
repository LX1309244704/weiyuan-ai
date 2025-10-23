import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserInfo {
  id: string
  email: string
  username: string
  avatar: string
  points: number
  createdAt: string
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
        console.log('updatePoints被调用，传入点数:', points);
        const currentUserInfo = get().userInfo;
        console.log('当前用户信息:', currentUserInfo);
        
        // 如果没有用户信息，创建默认用户信息
        if (!currentUserInfo) {
          console.log('没有用户信息，创建默认用户信息并设置点数');
          set({
            userInfo: {
              id: 'test-user-default',
              email: 'default@example.com',
              username: '默认用户',
              avatar: '/default-avatar.png',
              points: points,
              createdAt: new Date().toISOString()
            }
          });
          console.log('默认用户信息创建完成，点数:', points);
          return;
        }
        
        // 如果有用户信息，更新点数
        const updatedPoints = Math.max(0, points);
        console.log('更新后的点数:', updatedPoints);
        set({
          userInfo: {
            ...currentUserInfo,
            points: updatedPoints
          }
        });
        console.log('点数更新完成');
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

// 初始化用户信息
export const initializeUserInfo = async (user: any) => {
  const userStore = useUserStore.getState()
  if (!userStore.userInfo && user) {
    // 先设置基础用户信息，点数初始为0
    userStore.setUserInfo({
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
      points: 0, // 初始设为0，稍后从API获取
      createdAt: user.createdAt
    })
    
    // 检查是否配置了API密钥（仅从localStorage）
    let hasApiKey = false
    try {
      const savedConfig = localStorage.getItem('apiConfig')
      if (savedConfig) {
        const config = JSON.parse(savedConfig)
        hasApiKey = !!config.apiKey
      }
    } catch (error) {
      console.error('解析API配置失败:', error)
    }
    
    // 如果配置了API密钥，尝试获取真实点数
    if (hasApiKey) {
      try {
        // 动态导入以避免循环依赖
        const { ApiService } = await import('../services/apiService');
        await ApiService.initializeUserPoints();
      } catch (error) {
        console.error('初始化用户点数失败:', error);
      }
    }
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