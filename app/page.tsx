'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore, initializeUserInfo } from '@/stores/userStore'
import { Languages } from 'lucide-react'

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
      {/* 导航栏 - coze风格 */}
      <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo区域 */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                WeiYuanAI
              </span>
            </div>
            
            {/* 导航按钮区域 */}
            <div className="flex items-center space-x-4">
              {/* 国际化切换 */}
              <button 
                onClick={handleToggleLanguage}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="切换语言"
              >
                <Languages className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              {/* 主题切换按钮 */}
              <button 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                开始使用
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区域 */}
      <main className="max-w-7xl mx-auto px-6">
        {/* 英雄区域 - coze风格 */}
        <div className="text-center py-20 space-y-8">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-4">
            🚀 新一代AI创作平台
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
            让创意
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"> 无限延伸</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            基于先进AI技术，为您提供直观、高效的创意生成体验，从概念到成品一站式完成
          </p>

          {/* CTA按钮组 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <button
              onClick={handleStartCreation}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              立即开始创作
            </button>
            <button className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              查看演示
            </button>
          </div>
        </div>

        {/* 特性展示 - 网格布局 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-20">
          {[
            {
              icon: "🎨",
              title: "智能创作",
              description: "AI辅助的创意生成，让想法快速可视化",
              gradient: "from-blue-500 to-cyan-500"
            },
            {
              icon: "⚡",
              title: "极速响应",
              description: "毫秒级生成速度，实时预览创作效果",
              gradient: "from-purple-500 to-pink-500"
            },
            {
              icon: "🤝",
              title: "协作共享",
              description: "团队实时协作，作品一键分享",
              gradient: "from-green-500 to-teal-500"
            }
          ].map((feature, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center text-2xl text-white mb-6`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* 核心价值主张 */}
        <div className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">为什么选择我们？</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              我们致力于帮助每一位用户实现创意梦想，让技术服务于创造力
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              {[
                {
                  icon: "🚀",
                  title: "创造性自信建设",
                  description: "渐进式学习路径，从零基础到专业创作者",
                  features: ["个性化难度调节", "实时反馈指导", "成就激励系统"]
                },
                {
                  icon: "🌟",
                  title: "创造性身份培养",
                  description: "建立独特的创作风格，记录成长历程",
                  features: ["个人作品集", "风格分析", "创作历程"]
                },
                {
                  icon: "👥",
                  title: "创造性社群归属",
                  description: "加入创作者社区，获得支持与认可",
                  features: ["专业社区", "作品互评", "创作挑战"]
                },
                {
                  icon: "🎨",
                  title: "创造性表达自由",
                  description: "多模态创作工具，无技术障碍表达",
                  features: ["多种创作形式", "AI辅助工具", "跨平台支持"]
                }
              ].map((value, index) => (
                <div key={index} className="flex space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl flex items-center justify-center text-xl">
                    {value.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{value.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-3">{value.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {value.features.map((feature, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-12">
              <div className="text-center">
                <div className="text-6xl mb-6">✨</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">开启创作之旅</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  加入10万+创作者的行列，体验AI带来的创作革命
                </p>
                <button
                  onClick={handleStartCreation}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200"
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
            {[
              { number: "10万+", label: "活跃创作者", icon: "👥" },
              { number: "500万+", label: "创作作品", icon: "🎨" },
              { number: "95%", label: "用户满意度", icon: "⭐" },
              { number: "24/7", label: "技术支持", icon: "🛠️" }
            ].map((stat, index) => (
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
            准备好开始创作了吗？
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            加入我们，体验AI带来的创作革命，让每一个想法都能成为现实
          </p>
          <button
            onClick={handleStartCreation}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-12 py-4 rounded-lg font-medium text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            免费开始使用
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