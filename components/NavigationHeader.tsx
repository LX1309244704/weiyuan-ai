    'use client'

import { useState, useRef, useEffect } from 'react'
import { Sun, Moon, Languages, CreditCard, Users, LogOut, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'
import UserSettingsModal from './UserSettingsModal'

interface NavigationHeaderProps {
  title: string
  icon: React.ComponentType<any>
  iconColor?: string
}

export default function NavigationHeader({ title, icon: Icon, iconColor = 'text-blue-600 dark:text-blue-400' }: NavigationHeaderProps) {
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const { theme, language, setTheme, setLanguage, userInfo } = useUserStore()
  const { logout } = useAuthStore()

  // 点击外部关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 确保主题状态正确应用
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // 如果没有用户信息，使用默认信息用于测试
  useEffect(() => {
    if (!userInfo) {
      const defaultUserInfo = {
        id: 'test-user-001',
        email: 'test@example.com',
        username: '测试用户',
        avatar: '/default-avatar.png',
        points: 100,
        createdAt: new Date().toISOString()
      }
      useUserStore.setState({ userInfo: defaultUserInfo })
    }
  }, [userInfo])

  // 切换主题
  const handleToggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  // 切换语言
  const handleToggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh')
  }

  // 获取语言显示文本
  const getLanguageText = () => {
    return language === 'zh' ? '中文' : 'English'
  }

  const handleUserMenuToggle = () => {
    console.log('用户信息胶囊被点击，当前状态:', showUserMenu)
    setShowUserMenu(!showUserMenu)
  }

  const handleLogout = () => {
    console.log('退出登录')
    setShowUserMenu(false)
    logout() // 清除认证状态
    useUserStore.getState().clearUserInfo() // 清除用户信息
    router.push('/')
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Icon className={`h-6 w-6 ${iconColor}`} />
            <span className="text-xl font-bold text-gray-900 dark:text-white">{title}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              帮助中心
            </button>
            
            {/* 主题切换按钮 */}
            <button
              onClick={handleToggleTheme}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title={`切换到${theme === 'light' ? '深色' : '浅色'}主题`}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            {/* 国际化按钮 */}
            <button
              onClick={handleToggleLanguage}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title={`切换到${language === 'zh' ? 'English' : '中文'}`}
            >
              <Languages className="h-5 w-5" />
            </button>

            {/* 用户信息胶囊 */}
            <div className="relative" ref={userMenuRef}>
              <div 
                className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                onClick={handleUserMenuToggle}
              >
                {/* 消耗点数 */}
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{userInfo?.points || 100}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">点</span>
                </div>
                  
                {/* 分隔线 */}
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                
                {/* 用户头像 */}
                <div className="flex items-center">
                  <img 
                    src={userInfo?.avatar || '/default-avatar.png'} 
                    alt={userInfo?.username || '用户'}
                    className="w-6 h-6 rounded-full"
                  />
                </div>
              </div>

              {/* 用户菜单卡片 */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-2">
                    <button 
                      onClick={() => router.push('/user/billing')}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>我的账单</span>
                    </button>
                    <button 
                      onClick={() => router.push('/user/invitation')}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <Users className="h-4 w-4" />
                      <span>我的邀请</span>
                    </button>
                    <div className="my-1 border-t border-gray-200 dark:border-gray-600"></div>
                    <button 
                      onClick={() => {
                        setShowUserMenu(false)
                        setShowSettingsModal(true)
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      <span>API密钥设置</span>
                    </button>
                    <div className="my-1 border-t border-gray-200 dark:border-gray-600"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-md transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>退出登录</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 用户设置模态框 */}
      <UserSettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </nav>
  )
}