import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  username: string
  createdAt: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, username: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        console.log('开始登录流程:', email)
        set({ isLoading: true })
        
        // 模拟登录API调用
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 简单的验证逻辑
        if (email && password.length >= 6) {
          const user: User = {
            id: Math.random().toString(36).substr(2, 9),
            email,
            username: email.split('@')[0],
            createdAt: new Date().toISOString()
          }
          
          console.log('设置认证状态为true')
          set({ 
            user,
            isAuthenticated: true,
            isLoading: false
          })
          
          // 强制保存到存储
          if (typeof window !== 'undefined') {
            const storageData = JSON.stringify({ 
              state: { user, isAuthenticated: true },
              version: 0
            })
            localStorage.setItem('auth-storage', storageData)
          }
          
          // 确保状态已更新
          setTimeout(() => {
            console.log('登录完成，当前认证状态:', get().isAuthenticated)
          }, 100)
        } else {
          set({ isLoading: false })
          throw new Error('登录失败，请检查邮箱和密码')
        }
      },

      register: async (email: string, password: string, username: string) => {
        set({ isLoading: true })
        
        // 模拟注册API调用
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 简单的验证逻辑
        if (email && password.length >= 6 && username) {
          const user: User = {
            id: Math.random().toString(36).substr(2, 9),
            email,
            username,
            createdAt: new Date().toISOString()
          }
          
          set({ 
            user,
            isAuthenticated: true,
            isLoading: false
          })
          
          // 强制保存到存储
          if (typeof window !== 'undefined') {
            const storageData = JSON.stringify({ 
              state: { user, isAuthenticated: true },
              version: 0
            })
            localStorage.setItem('auth-storage', storageData)
          }
        } else {
          set({ isLoading: false })
          throw new Error('注册失败，请检查输入信息')
        }
      },

      logout: () => {
        console.log('执行退出登录，清除认证状态')
        set({
          user: null,
          isAuthenticated: false
        })
        // 强制清除持久化存储
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage')
          sessionStorage.removeItem('auth-storage')
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
      onRehydrateStorage: () => (state) => {
        console.log('认证状态已从存储中恢复:', state)
      },
      skipHydration: false
    }
  )
)