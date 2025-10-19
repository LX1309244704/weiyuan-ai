'use client'

import { useState, useEffect } from 'react'
import { X, Save, Settings } from 'lucide-react'

interface UserSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ApiConfig {
  apiKey: string
  apiBaseUrl: string
}

export default function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    apiKey: '',
    apiBaseUrl: 'https://api.jmyps.com/v1'
  })

  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  // 从.env.local加载配置
  useEffect(() => {
    if (isOpen) {
      loadConfigFromEnv()
    }
  }, [isOpen])

  const loadConfigFromEnv = async () => {
    try {
      // 从API端点加载.env.local内容
      const response = await fetch('/api/load-env')
      if (response.ok) {
        const data = await response.json()
        const config: ApiConfig = {
          apiKey: data.apiKey || '',
          apiBaseUrl: data.apiBaseUrl || 'https://api.jmyps.com/v1'
        }
        setApiConfig(config)
      }
    } catch (error) {
      console.error('加载配置失败:', error)
      // 使用默认配置
      const config: ApiConfig = {
        apiKey: '',
        apiBaseUrl: 'https://api.jmyps.com/v1'
      }
      setApiConfig(config)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    setMessage('')

    try {
      // 构建.env.local文件内容
      const envContent = `# AI模型API配置
# 请妥善保管您的API密钥

# API密钥
NEXT_PUBLIC_API_KEY=${apiConfig.apiKey}

# API基础地址
NEXT_PUBLIC_API_BASE_URL=${apiConfig.apiBaseUrl}

# 调试模式
# NEXT_PUBLIC_DEBUG_MODE=false`

      // 保存到.env.local文件
      const response = await fetch('/api/save-env', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: envContent })
      })

      if (response.ok) {
        setMessage('配置保存成功！应用需要重启才能生效。')
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || '保存失败')
      }
    } catch (error) {
      setMessage(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (key: keyof ApiConfig, value: string) => {
    setApiConfig(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              API密钥设置
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4">
          {/* API基础地址 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API基础地址
            </label>
            <input
              type="text"
              value={apiConfig.apiBaseUrl}
              onChange={(e) => handleInputChange('apiBaseUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="https://api.jmyps.com/v1"
            />
          </div>

          {/* API密钥 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API密钥
            </label>
            <input
              type="password"
              value={apiConfig.apiKey}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="输入您的API密钥"
            />
          </div>

          {message && (
            <div className={`p-3 rounded-md text-sm ${
              message.includes('成功') 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? '保存中...' : '保存'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}