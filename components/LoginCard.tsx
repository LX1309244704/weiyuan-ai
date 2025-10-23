'use client'

import { useState } from 'react'
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'

interface LoginCardProps {
  onClose: () => void
}

export default function LoginCard({ onClose }: LoginCardProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  })
  
  const checkIfApiKeyExists = () => {
    try {
      const savedConfig = localStorage.getItem('apiConfig');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        if (config.apiKey) {
          setHasApiKey(true);
          return true;
        }
      }
    } catch (error) {
      console.error('解析API配置失败:', error);
    }
    return false;
  }
  
  const { login, register, isLoading } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (isLogin) {
        await login(formData.email, formData.password)
      } else {
        await register(formData.email, formData.password, formData.username)
      }
      
      // 初始化用户信息
      const { user } = useAuthStore.getState()
      if (user) {
        // 直接设置用户信息，避免循环依赖
        const userStore = useUserStore.getState()
        userStore.setUserInfo({
          id: user.id,
          email: user.email,
          username: user.username,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
          points: 0, // 初始设为0，稍后从API获取真实点数
          createdAt: user.createdAt || new Date().toISOString()
        })
        
        // 尝试从API获取真实点数
        try {
          if (checkIfApiKeyExists()) {
            const { ApiService } = await import('../services/apiService')
            await ApiService.initializeUserPoints().catch(err => {
              console.error('获取真实点数失败:', err)
            })
          }
        } catch (error) {
          console.error('获取真实点数失败:', error);
        }
      }
      
      // 等待状态完全更新后再跳转
      setTimeout(() => {
        // 使用replace而不是push，避免浏览器历史记录问题
        window.location.replace('/user')
      }, 300)
    } catch (error) {
      // 登录失败时保持登录卡片打开
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-up">
        {/* 头部 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isLogin ? '登录账户' : '注册账户'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="请输入用户名"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邮箱地址
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="请输入邮箱地址"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field pl-10 pr-10"
                placeholder="请输入密码"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : null}
            <span>{isLogin ? '登录' : '注册'}</span>
          </button>
        </form>

        {/* 底部切换 */}
        <div className="p-6 border-t border-gray-200 text-center">
          <p className="text-gray-600">
            {isLogin ? '还没有账户？' : '已有账户？'}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary-600 hover:text-primary-700 font-medium ml-1"
            >
              {isLogin ? '立即注册' : '立即登录'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}