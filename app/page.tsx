'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore, initializeUserInfo } from '@/stores/userStore'
import { Languages } from 'lucide-react'

// 导入JSON数据
import homeData from '@/data/home.json'

type AuthMode = 'login' | 'register'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, login, register, isLoading } = useAuthStore()
  const { userInfo, theme, setTheme, language, setLanguage } = useUserStore()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [authError, setAuthError] = useState('')

  // 如果已登录，直接跳转到用户首页
  useEffect(() => {
    if (isAuthenticated && userInfo) {
      router.replace('/user')
    }
  }, [isAuthenticated, userInfo, router])

  if (isAuthenticated && userInfo) {
    return <div className="flex items-center justify-center min-h-screen">跳转中...</div>
  }

  const handleStartCreation = () => {
    setAuthMode('login')
    setShowAuthModal(true)
    setAuthError('')
    setErrors({})
  }

  const handleSwitchMode = (mode: AuthMode) => {
    setAuthMode(mode)
    setAuthError('')
    setErrors({})
    setAuthForm({
      email: '',
      password: '',
      username: '',
      confirmPassword: ''
    })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!authForm.email) {
      newErrors.email = '请输入邮箱地址'
    } else if (!/\S+@\S+\.\S+/.test(authForm.email)) {
      newErrors.email = '请输入有效的邮箱地址'
    }
    
    if (!authForm.password) {
      newErrors.password = '请输入密码'
    } else if (authForm.password.length < 6) {
      newErrors.password = '密码至少需要6位字符'
    }
    
    if (authMode === 'register') {
      if (!authForm.username) {
        newErrors.username = '请输入用户名'
      } else if (authForm.username.length < 2) {
        newErrors.username = '用户名至少需要2位字符'
      }
      
      if (!authForm.confirmPassword) {
        newErrors.confirmPassword = '请确认密码'
      } else if (authForm.password !== authForm.confirmPassword) {
        newErrors.confirmPassword = '两次输入的密码不一致'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    
    if (!validateForm()) return
    
    try {
      if (authMode === 'login') {
        await login(authForm.email, authForm.password)
        // 初始化用户信息
        const authState = useAuthStore.getState()
        if (authState.user) {
          initializeUserInfo(authState.user)
        }
      } else {
        await register(authForm.email, authForm.password, authForm.username)
        // 初始化用户信息
        const authState = useAuthStore.getState()
        if (authState.user) {
          initializeUserInfo(authState.user)
        }
      }
      
      setShowAuthModal(false)
      router.push('/user')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : '认证失败，请重试')
    }
  }

  const handleToggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setAuthForm(prev => ({
      ...prev,
      [name]: value
    }))
    // 清除对应字段的错误信息
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    if (authError) {
      setAuthError('')
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* 导航栏 - 现代风格 */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo区域 */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">W</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                WeiYuanAI
              </span>
            </div>
            
            {/* 导航按钮区域 */}
            <div className="flex items-center space-x-6">
              {/* 国际化切换 */}
              <button 
                onClick={handleToggleLanguage}
                className="p-3 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-200 backdrop-blur-sm"
                title="切换语言"
              >
                <Languages className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              {/* 主题切换按钮 */}
              <button 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-3 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-200 backdrop-blur-sm"
                title="切换主题"
              >
                {theme === 'light' ? (
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </button>
              
              {/* 登录按钮 */}
              <button 
                onClick={() => {
                  setAuthMode('login')
                  setShowAuthModal(true)
                  setAuthError('')
                  setErrors({})
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                开始使用
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区域 */}
      <main className="max-w-7xl mx-auto px-6">
        {/* 英雄区域 - 现代风格 */}
        <div className="text-center py-24 space-y-12">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400 rounded-full text-base font-medium mb-6 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/50">
            🚀 新一代AI创作平台
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 dark:text-white leading-tight">
            {homeData.hero.title}
          </h1>
          
          <p className="text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed font-light">
            {homeData.hero.subtitle}
          </p>

          {/* CTA按钮组 */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-12">
            <button
              onClick={handleStartCreation}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-12 py-5 rounded-xl font-medium text-lg transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-110"
            >
              {homeData.hero.ctaButtons[0].text}
            </button>
            <button className="border-2 border-gray-300/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 px-12 py-5 rounded-xl font-medium text-lg hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all duration-300 backdrop-blur-sm">
              {homeData.hero.ctaButtons[1].text}
            </button>
          </div>
        </div>

        {/* 特性展示 - 现代网格布局 */}
        <div className="py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              强大功能，<span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">极致体验</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              专为创作者设计的AI工具，让创意实现变得简单而高效
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {homeData.features.map((feature, index) => (
              <div key={index} className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-200/50 dark:hover:border-blue-600/50 hover:scale-105">
                <div className={`w-20 h-20 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center text-3xl text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 核心价值主张 */}
        <div className="py-24">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              为什么<span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">选择我们</span>？
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              我们致力于帮助每一位用户实现创意梦想，让技术服务于创造力
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              {homeData.values.map((value, index) => (
                <div key={index} className="group flex space-x-6 p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-200/50 dark:hover:border-blue-600/50 transition-all duration-300">
                  <div className={`flex-shrink-0 w-16 h-16 bg-gradient-to-r ${value.gradient} rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {value.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{value.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 text-lg">{value.description}</p>
                    <div className="flex flex-wrap gap-3">
                      {value.features.map((feature, idx) => (
                        <span key={idx} className="px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 text-blue-600 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-200/50 dark:border-blue-800/50">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-gray-800/50 dark:to-gray-900/50 rounded-3xl p-12 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              <div className="text-center">
                <div className="text-8xl mb-8">✨</div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">开启创作之旅</h3>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                  加入10万+创作者的行列，体验AI带来的创作革命
                </p>
                <button
                  onClick={handleStartCreation}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-12 py-4 rounded-xl font-medium text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  立即体验
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 统计数据 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-12 mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {homeData.stats.map((stat, index) => (
              <div key={index} className="space-y-4">
                <div className="text-3xl">{stat.icon}</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stat.number}</div>
                <div className="text-gray-600 dark:text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 最终CTA */}
        <div className="text-center py-20">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            {homeData.finalCTA.title}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            {homeData.finalCTA.description}
          </p>
          <button
            onClick={handleStartCreation}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-12 py-4 rounded-lg font-medium text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {homeData.finalCTA.buttonText}
          </button>
        </div>
      </main>

      {/* 认证模态框 */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {authMode === 'login' ? '登录 WeiYuanAI' : '注册 WeiYuanAI'}
              </h2>
            </div>
            
            {authError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">{authError}</p>
              </div>
            )}
            
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  邮箱地址
                </label>
                <input
                  type="email"
                  name="email"
                  value={authForm.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-700 dark:text-white"
                  placeholder="请输入邮箱地址"
                />
                {errors.email && <p className="mt-1 text-red-500 text-xs">{errors.email}</p>}
              </div>
              
              {authMode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    用户名
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={authForm.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-700 dark:text-white"
                    placeholder="请输入用户名"
                  />
                  {errors.username && <p className="mt-1 text-red-500 text-xs">{errors.username}</p>}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  密码
                </label>
                <input
                  type="password"
                  name="password"
                  value={authForm.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-700 dark:text-white"
                  placeholder="请输入密码（至少6位）"
                />
                {errors.password && <p className="mt-1 text-red-500 text-xs">{errors.password}</p>}
              </div>
              
              {authMode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    确认密码
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={authForm.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-700 dark:text-white"
                    placeholder="请再次输入密码"
                  />
                  {errors.confirmPassword && <p className="mt-1 text-red-500 text-xs">{errors.confirmPassword}</p>}
                </div>
              )}
              
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? '处理中...' : (authMode === 'login' ? '登录' : '注册')}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
            
            <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleSwitchMode(authMode === 'login' ? 'register' : 'login')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium"
              >
                {authMode === 'login' ? '还没有账号？立即注册' : '已有账号？立即登录'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}