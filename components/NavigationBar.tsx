'use client'

import { useState, useRef, useEffect } from 'react'
import { Sun, Moon, Languages, CreditCard, Users, LogOut, Palette, Folder, Lightbulb, Database, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/userStore'
import { useAuthStore } from '@/stores/authStore'

interface NavigationBarProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  activeMenu?: string
}

export default function NavigationBar({ title, icon: Icon, activeMenu }: NavigationBarProps) {
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
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

  const handleHelpCenter = () => {
    // 这里可以添加帮助中心跳转逻辑
  }

  // 侧边菜单项
  const menuItems = [
    { id: '项目', icon: Folder, label: '项目', path: '/user/projects' },
    { id: '灵感', icon: Lightbulb, label: '灵感', path: '/user/inspiration' },
    { id: '资产', icon: Database, label: '资产', path: '/user/assets' },
    { id: '我的', icon: User, label: '我的', path: '/user/profile' }
  ]

  const handleMenuClick = (path: string) => {
    router.push(path)
  }

  return (
    <>
      {/* 顶部导航栏 */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">{title}</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleHelpCenter}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                帮助中心
              </button>
              
              {/* 主题切换按钮 */}
              <button
                onClick={handleToggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={`切换到${theme === 'light' ? '暗色' : '亮色'}主题`}
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </button>

              {/* 语言切换按钮 */}
              <button
                onClick={handleToggleLanguage}
                className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                {getLanguageText()}
              </button>

              {/* 用户信息胶囊 */}
              {userInfo && (
                <div className="relative" ref={userMenuRef}>
                  <div 
                    className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    onClick={handleUserMenuToggle}
                  >
                    {/* 消耗点数 */}
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{userInfo.points}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">点</span>
                    </div>
                    
                    {/* 分隔线 */}
                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                    
                    {/* 用户头像 */}
                    <div className="flex items-center">
                      <img 
                        src={userInfo.avatar} 
                        alt={userInfo.username}
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
                        <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                          <Users className="h-4 w-4" />
                          <span>我的邀请</span>
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
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 左侧悬浮菜单 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          <div className="w-20 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2 sticky top-24">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.path)}
                  className={`w-full flex flex-col items-center p-3 rounded-lg mb-2 transition-colors ${
                    activeMenu === item.id
                      ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs mt-1">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}