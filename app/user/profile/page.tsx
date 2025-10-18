'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import NavigationBar from '@/components/NavigationBar'
import { 
  User, Key, Eye, EyeOff, Copy, CheckCircle, 
  Settings, Bell, Globe, Palette, Save, Edit,
  CreditCard, Users, LogOut, HelpCircle, Shield
} from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { userInfo, theme, language, setTheme, setLanguage } = useUserStore()
  
  const [activeTab, setActiveTab] = useState('profile')
  const [copied, setCopied] = useState('')
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  
  // API密钥配置状态
  const [apiKey, setApiKey] = useState('')
  
  // 用户设置状态
  const [userSettings, setUserSettings] = useState({
    notifications: true,
    emailUpdates: false,
    autoSave: true,
    language: 'zh',
    theme: 'light'
  })

  // 用户信息编辑状态
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [userProfile, setUserProfile] = useState({
    username: userInfo?.username || '',
    email: userInfo?.email || '',
    avatar: userInfo?.avatar || '',
    bio: userInfo?.bio || ''
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedApiKey = localStorage.getItem('user-api-key')
      if (savedApiKey) {
        setApiKey(savedApiKey)
      }
      
      const savedSettings = localStorage.getItem('user-settings')
      if (savedSettings) {
        setUserSettings(JSON.parse(savedSettings))
      }
    }
  }, [])

  if (!isAuthenticated) {
    return null
  }

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(''), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const toggleApiKeyVisibility = () => {
    setShowApiKeys(prev => ({
      ...prev,
      'general': !prev['general']
    }))
  }

  const handleApiKeyChange = (value: string) => {
    setApiKey(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-api-key', value)
    }
  }

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...userSettings, [key]: value }
    setUserSettings(newSettings)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-settings', JSON.stringify(newSettings))
    }
    
    if (key === 'theme') {
      setTheme(value as 'light' | 'dark')
    }
    if (key === 'language') {
      setLanguage(value as 'zh' | 'en')
    }
  }

  const handleProfileChange = (field: string, value: string) => {
    setUserProfile(prev => ({ ...prev, [field]: value }))
  }

  const saveProfile = () => {
    useUserStore.setState({ userInfo: { ...userInfo, ...userProfile } })
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-profile', JSON.stringify(userProfile))
    }
    setIsEditingProfile(false)
    setCopied('profile-saved')
    setTimeout(() => setCopied(''), 2000)
  }

  const cancelEdit = () => {
    setUserProfile({
      username: userInfo?.username || '',
      email: userInfo?.email || '',
      avatar: userInfo?.avatar || '',
      bio: userInfo?.bio || ''
    })
    setIsEditingProfile(false)
  }

  const saveAllSettings = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-api-key', apiKey)
      localStorage.setItem('user-settings', JSON.stringify(userSettings))
    }
    setTheme(userSettings.theme as 'light' | 'dark')
    setLanguage(userSettings.language as 'zh' | 'en')
    setCopied('save-success')
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <NavigationBar 
      title="个人设置" 
      icon={User}
      activeMenu="我的"
    >
      <div className="space-y-6">
        {/* 用户信息概览 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">个人信息</h2>
            {!isEditingProfile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
              >
                <Edit className="w-4 h-4" />
                <span>编辑资料</span>
              </button>
            )}
          </div>
          
          {isEditingProfile ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    用户名
                  </label>
                  <input
                    type="text"
                    value={userProfile.username}
                    onChange={(e) => handleProfileChange('username', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    邮箱
                  </label>
                  <input
                    type="email"
                    value={userProfile.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  头像URL
                </label>
                <input
                  type="url"
                  value={userProfile.avatar}
                  onChange={(e) => handleProfileChange('avatar', e.target.value)}
                  placeholder="输入头像图片链接"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  个人简介
                </label>
                <textarea
                  value={userProfile.bio}
                  onChange={(e) => handleProfileChange('bio', e.target.value)}
                  placeholder="介绍一下自己..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={cancelEdit}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={saveProfile}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
                >
                  {copied === 'profile-saved' ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  <span>{copied === 'profile-saved' ? '保存成功' : '保存'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-6">
              <img 
                src={userInfo?.avatar || '/default-avatar.png'} 
                alt={userInfo?.username}
                className="w-20 h-20 rounded-2xl"
                onError={(e) => {
                  e.currentTarget.src = '/default-avatar.png'
                }}
              />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {userInfo?.username}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-3">{userInfo?.email}</p>
                {userInfo?.bio && (
                  <p className="text-gray-500 dark:text-gray-400 text-base">{userInfo.bio}</p>
                )}
                <div className="flex items-center space-x-6 mt-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    注册时间: {new Date(userInfo?.createdAt || '').toLocaleDateString('zh-CN')}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    会员等级: 标准用户
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 选项卡导航 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-8">
              {[
                { id: 'profile', label: '个人资料', icon: User },
                { id: 'api-keys', label: 'API配置', icon: Key },
                { id: 'settings', label: '偏好设置', icon: Settings },
                { id: 'security', label: '安全', icon: Shield }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-6 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 inline mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* 选项卡内容 */}
          <div className="p-8">
            {/* API密钥配置 */}
            {activeTab === 'api-keys' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    AI模型API密钥配置
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    配置您使用的AI模型的API密钥，这些密钥将用于生成图片和视频内容。
                  </p>
                </div>

                {/* 通用API密钥配置 */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">通用API密钥</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        输入您的API密钥，该密钥将用于所有支持的AI模型
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full">
                      通用
                    </span>
                  </div>
                  
                  <div className="flex space-x-3">
                    <div className="flex-1 relative">
                      <input
                        type={showApiKeys['general'] ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => handleApiKeyChange(e.target.value)}
                        placeholder="输入通用API密钥"
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={toggleApiKeyVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {showApiKeys['general'] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <button
                      onClick={() => copyToClipboard(apiKey, 'general')}
                      className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
                    >
                      {copied === 'general' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copied === 'general' ? '已复制' : '复制'}</span>
                    </button>
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">使用说明</h5>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• 该密钥将用于所有支持的AI模型（图片生成和视频生成）</li>
                      <li>• 密钥会自动保存到本地存储</li>
                      <li>• 请确保密钥具有足够的权限访问所有AI服务</li>
                      <li>• 密钥格式应为有效的API密钥字符串</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 个人设置 */}
            {activeTab === 'settings' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    个人偏好设置
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    自定义您的使用体验和界面偏好。
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* 界面设置 */}
                  <div className="space-y-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                      <Palette className="w-5 h-5 mr-3" />
                      界面设置
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-gray-700 dark:text-gray-300">主题模式</label>
                        <select
                          value={userSettings.theme}
                          onChange={(e) => handleSettingChange('theme', e.target.value)}
                          className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="light">浅色模式</option>
                          <option value="dark">深色模式</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="text-gray-700 dark:text-gray-300">语言</label>
                        <select
                          value={userSettings.language}
                          onChange={(e) => handleSettingChange('language', e.target.value)}
                          className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="zh">中文</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 通知设置 */}
                  <div className="space-y-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                      <Bell className="w-5 h-5 mr-3" />
                      通知设置
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-gray-700 dark:text-gray-300">系统通知</label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">接收系统重要通知</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={userSettings.notifications}
                            onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-gray-700 dark:text-gray-300">邮件更新</label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">接收产品更新邮件</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={userSettings.emailUpdates}
                            onChange={(e) => handleSettingChange('emailUpdates', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-gray-700 dark:text-gray-300">自动保存</label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">自动保存工作进度</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={userSettings.autoSave}
                            onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 保存按钮 */}
                <div className="flex justify-end">
                  <button
                    onClick={saveAllSettings}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200"
                  >
                    {copied === 'save-success' ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    <span>{copied === 'save-success' ? '保存成功' : '保存设置'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 安全设置 */}
            {activeTab === 'security' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    安全设置
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    管理您的账户安全设置和隐私偏好。
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">账户安全</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-gray-700 dark:text-gray-300">双重验证</label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">增强账户安全性</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-gray-700 dark:text-gray-300">登录提醒</label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">新设备登录时发送提醒</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">隐私设置</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-gray-700 dark:text-gray-300">公开个人资料</label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">允许他人查看您的个人资料</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-gray-700 dark:text-gray-300">数据收集</label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">允许收集匿名使用数据</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </NavigationBar>
  )
}