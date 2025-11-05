'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'
import { 
  Sun, Moon, Languages, CreditCard, Users, LogOut, 
  Folder, Lightbulb, User, Home, Settings, HelpCircle,
  Plus, Search, Bell, ChevronDown, Crown, X, Palette
} from 'lucide-react'

interface NavigationBarProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  activeMenu?: string
  children?: React.ReactNode
}

export default function NavigationBar({ title, icon: Icon, activeMenu, children }: NavigationBarProps) {
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showVIP, setShowVIP] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const vipRef = useRef<HTMLDivElement>(null)
  const { theme, language, setTheme, setLanguage, userInfo } = useUserStore()
  const { logout } = useAuthStore()

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (vipRef.current && !vipRef.current.contains(event.target as Node)) {
        setShowVIP(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 确保主题状态正确应用
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const handleToggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  const handleToggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh')
  }

  const getLanguageText = () => {
    return language === 'zh' ? '中文' : 'English'
  }

  const handleLogout = () => {
    setShowUserMenu(false)
    logout()
    useUserStore.getState().clearUserInfo()
    router.push('/')
  }

  // 侧边菜单项
  const menuItems = [
    { id: '首页', icon: Home, label: '首页', path: '/user' },
    { id: '项目', icon: Folder, label: '项目', path: '/user/projects' },
    { id: '灵感', icon: Lightbulb, label: '灵感', path: '/user/inspiration' },
    { id: '账单', icon: CreditCard, label: '账单', path: '/user/billing' },
    { id: '邀请', icon: Users, label: '邀请', path: '/user/invitation' }
  ]

  const handleMenuClick = (path: string) => {
    router.push(path)
  }

  return (
    <>
      {/* 顶部导航栏 - coze风格 */}
      <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo和标题 */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                WeiYuanAI
              </span>
            </div>
            
            {/* 右侧功能区 */}
            <div className="flex items-center space-x-3">
              {/* 搜索框 */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索..."
                  className="pl-10 pr-4 py-2 w-64 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>



              {/* VIP按钮 */}
              <button
                onClick={() => router.push('/user/vip')}
                className="flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Crown className="w-4 h-4" />
                <span>VIP</span>
              </button>

              {/* 通知按钮 */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
                >
                  <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-white">通知</h3>
                    </div>
                    <div className="p-4">
                      <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
                        暂无新通知
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 国际化切换 */}
              <button 
                onClick={handleToggleLanguage}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="切换语言"
              >
                <Languages className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              {/* 主题切换 */}
              <button 
                onClick={handleToggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="切换主题"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              {/* 用户菜单 */}
              {userInfo && (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-3 py-2 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <img 
                        src={userInfo.avatar} 
                        alt={userInfo.username}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="text-left hidden md:block">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {userInfo.username}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {userInfo.points} 点
                        </div>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {/* 用户菜单卡片 */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                      {/* 只保留退出登录 */}
                      <div className="p-2">
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>退出登录</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区域 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* 左侧悬浮菜单 - 移动端显示 */}
          <div className="w-64 flex-shrink-0 hidden lg:block">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sticky top-24">
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.path)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                      activeMenu === item.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
              
              {/* 快速操作 */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
                <button className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
                  <Plus className="w-5 h-5" />
                  <span>新建项目</span>
                </button>
                <button 
                  onClick={() => router.push('/ad-creation')}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Palette className="w-5 h-5" />
                  <span>广告创作</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* 右侧内容区域 */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}