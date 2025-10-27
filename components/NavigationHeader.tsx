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
    setShowUserMenu(!showUserMenu)
  }

  const handleLogout = () => {
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
                className="flex items-center space-x-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full px-3 py-2 cursor-pointer hover:shadow-md transition-all duration-200 group"
                onClick={handleUserMenuToggle}
              >
                {/* 用户头像 */}
                <div className="relative">
                  <img 
                    src={userInfo?.avatar || '/default-avatar.png'} 
                    alt={userInfo?.username || '用户'}
                    className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-600 group-hover:border-blue-500 dark:group-hover:border-blue-400 transition-colors"
                    onError={(e) => {
                      e.currentTarget.src = '/default-avatar.png'
                    }}
                  />
                  {/* 在线状态指示器 */}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                </div>
                
                {/* 用户名和点数 */}
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900 dark:text-white leading-none">
                    {userInfo?.username || '用户'}
                  </span>
                  <div className="flex items-center space-x-1 mt-1">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{userInfo?.points || 100}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">点</span>
                  </div>
                </div>
                
                {/* 下拉箭头 */}
                <svg 
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* 用户菜单卡片 */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-3 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 animate-in fade-in-0 zoom-in-95">
                  {/* 用户信息头部 */}
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={userInfo?.avatar || '/default-avatar.png'} 
                        alt={userInfo?.username || '用户'}
                        className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-600"
                        onError={(e) => {
                          e.currentTarget.src = '/default-avatar.png'
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {userInfo?.username || '用户'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {userInfo?.email || 'test@example.com'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 菜单项 */}
                  <div className="p-2 space-y-1">
                    <button 
                      onClick={() => {
                        setShowUserMenu(false)
                        router.push('/user/billing')
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all duration-200 group"
                    >
                      <CreditCard className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                      <span>账单管理</span>
                    </button>
                    <button 
                      onClick={() => {
                        setShowUserMenu(false)
                        router.push('/user/invitation')
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 rounded-lg transition-all duration-200 group"
                    >
                      <Users className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
                      <span>邀请好友</span>
                    </button>
                    <div className="my-1 border-t border-gray-100 dark:border-gray-700"></div>
                    <button 
                      onClick={() => {
                        setShowUserMenu(false)
                        setShowSettingsModal(true)
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition-all duration-200 group"
                    >
                      <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                      <span>API密钥设置</span>
                    </button>
                    <div className="my-1 border-t border-gray-100 dark:border-gray-700"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-3 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 group"
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