'use client'

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Send, Image, Video, Download, X, MessageSquare, ChevronLeft, Settings, Monitor, Film, Type } from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  imageData?: string
}

interface ChatPanelProps {
  onCaptureArea: () => Promise<string | null>
  onReceiveScreenshot?: (imageData: string, prompt: string) => void
}

const ChatPanel = forwardRef<{ handleReceiveScreenshot: (imageData: string, prompt: string) => void }, ChatPanelProps>(
  ({ onCaptureArea, onReceiveScreenshot }, ref) => {
  const [isOpen, setIsOpen] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [uploadedImagePreviews, setUploadedImagePreviews] = useState<string[]>([])
  const [showModelSettings, setShowModelSettings] = useState(false)
  const [showAspectRatio, setShowAspectRatio] = useState(false)
  const [showImageCount, setShowImageCount] = useState(false)
  const [selectedModel, setSelectedModel] = useState('Nanobanbana')
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('16:9')
  const [imageCount, setImageCount] = useState(1)
  const [activeModelTab, setActiveModelTab] = useState('图像')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modelSettingsRef = useRef<HTMLDivElement>(null)
  const aspectRatioRef = useRef<HTMLDivElement>(null)
  const imageCountRef = useRef<HTMLDivElement>(null)

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 在客户端加载聊天记录 - 确保聊天内容正确初始化
  useEffect(() => {
    console.log('ChatPanel: 开始初始化聊天内容 - 组件已挂载')
    
    if (typeof window === 'undefined') {
      console.log('ChatPanel: 不在客户端环境，跳过初始化')
      return
    }
    
    try {
      console.log('ChatPanel: 检查localStorage中的聊天记录')
      const savedChat = window.localStorage.getItem('chatHistory')
      console.log('ChatPanel: localStorage中chatHistory的值:', savedChat)
      
      if (savedChat) {
        console.log('ChatPanel: 找到已保存的聊天记录，开始解析')
        const parsedMessages = JSON.parse(savedChat)
        console.log('ChatPanel: 解析后的消息数组:', parsedMessages)
        console.log('ChatPanel: 消息数量:', parsedMessages.length)
        
        // 确保消息格式正确
        const formattedMessages = parsedMessages.map((msg: any) => ({
          id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: msg.type || 'ai',
          content: msg.content || '欢迎使用AI创作助手',
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          imageData: msg.imageData || undefined
        }))
        
        console.log('ChatPanel: 格式化后的消息:', formattedMessages)
        setMessages(formattedMessages)
        console.log('ChatPanel: 聊天记录初始化完成，消息数量:', formattedMessages.length)
      } else {
        console.log('ChatPanel: 没有找到聊天记录，设置默认欢迎消息')
        // 设置默认欢迎消息
        const welcomeMessage: Message = {
          id: 'welcome-message-' + Date.now(),
          type: 'ai',
          content: '欢迎使用AI创作助手！我是您的AI助手，可以帮助您进行创意设计和内容生成。',
          timestamp: new Date()
        }
        console.log('ChatPanel: 创建的欢迎消息:', welcomeMessage)
        setMessages([welcomeMessage])
        
        // 保存默认消息到localStorage
        const chatHistory = [{
          id: welcomeMessage.id,
          type: welcomeMessage.type,
          content: welcomeMessage.content,
          timestamp: welcomeMessage.timestamp.toISOString(),
          imageData: welcomeMessage.imageData
        }]
        console.log('ChatPanel: 准备保存到localStorage的数据:', chatHistory)
        window.localStorage.setItem('chatHistory', JSON.stringify(chatHistory))
        console.log('ChatPanel: 默认欢迎消息已保存到localStorage')
      }
    } catch (error) {
      console.error('ChatPanel: 初始化聊天内容时出错:', error)
      // 出错时设置默认消息
      const errorMessage: Message = {
        id: 'error-message-' + Date.now(),
        type: 'ai',
        content: '欢迎使用AI创作助手！',
        timestamp: new Date()
      }
      console.log('ChatPanel: 出错时设置的默认消息:', errorMessage)
      setMessages([errorMessage])
    }
  }, [])

  // 双重保障：检查消息是否为空，如果是空则设置欢迎消息
  useEffect(() => {
    if (messages.length === 0 && typeof window !== 'undefined') {
      console.log('ChatPanel: 双重保障 - 检测到消息为空，设置欢迎消息')
      const welcomeMessage: Message = {
        id: 'welcome-message-' + Date.now(),
        type: 'ai',
        content: '欢迎使用AI创作助手！我是您的AI助手，可以帮助您进行创意设计和内容生成。',
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
      
      // 保存到localStorage
      const chatHistory = [{
        id: welcomeMessage.id,
        type: welcomeMessage.type,
        content: welcomeMessage.content,
        timestamp: welcomeMessage.timestamp.toISOString(),
        imageData: welcomeMessage.imageData
      }]
      window.localStorage.setItem('chatHistory', JSON.stringify(chatHistory))
      console.log('ChatPanel: 双重保障 - 欢迎消息已设置并保存')
    }
  }, [messages.length])

  // 强制初始化：在组件挂载后立即设置欢迎消息
  useEffect(() => {
    console.log('ChatPanel: 强制初始化 - 组件已挂载')
    
    if (typeof window === 'undefined') {
      console.log('ChatPanel: 强制初始化 - 不在客户端环境，跳过')
      return
    }
    
    // 延迟执行以确保组件完全渲染
    const timer = setTimeout(() => {
      console.log('ChatPanel: 强制初始化 - 开始设置欢迎消息')
      
      // 检查localStorage中是否有聊天记录
      const savedChat = window.localStorage.getItem('chatHistory')
      console.log('ChatPanel: 强制初始化 - localStorage中chatHistory:', savedChat ? '有记录' : '无记录')
      
      if (!savedChat) {
        console.log('ChatPanel: 强制初始化 - 设置默认欢迎消息')
        const welcomeMessage: Message = {
          id: 'welcome-message-' + Date.now(),
          type: 'ai',
          content: '欢迎使用AI创作助手！我是您的AI助手，可以帮助您进行创意设计和内容生成。',
          timestamp: new Date()
        }
        
        // 直接设置消息状态
        setMessages([welcomeMessage])
        
        // 保存到localStorage
        const chatHistory = [{
          id: welcomeMessage.id,
          type: welcomeMessage.type,
          content: welcomeMessage.content,
          timestamp: welcomeMessage.timestamp.toISOString(),
          imageData: welcomeMessage.imageData
        }]
        window.localStorage.setItem('chatHistory', JSON.stringify(chatHistory))
        console.log('ChatPanel: 强制初始化 - 欢迎消息已设置')
      } else {
        console.log('ChatPanel: 强制初始化 - 已有聊天记录，无需设置')
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  // 监听localStorage变化和自定义事件，重新加载聊天记录
  useEffect(() => {
    if (typeof window === 'undefined') return

    const reloadChatHistory = () => {
      try {
        const savedChat = window.localStorage.getItem('chatHistory')
        if (savedChat) {
          const parsedMessages = JSON.parse(savedChat)
          setMessages(parsedMessages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp || Date.now())
          })))
          console.log('检测到聊天记录变化，重新加载聊天记录')
        } else {
          setMessages([])
        }
      } catch (error) {
        console.warn('重新加载聊天记录失败:', error)
      }
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'chatHistory') {
        reloadChatHistory()
      }
    }

    const handleCustomEvent = () => {
      reloadChatHistory()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('chatHistoryUpdated', handleCustomEvent)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('chatHistoryUpdated', handleCustomEvent)
    }
  }, [])

  // 点击外部关闭弹出卡片
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelSettingsRef.current && !modelSettingsRef.current.contains(event.target as Node)) {
        setShowModelSettings(false)
      }
      if (aspectRatioRef.current && !aspectRatioRef.current.contains(event.target as Node)) {
        setShowAspectRatio(false)
      }
      if (imageCountRef.current && !imageCountRef.current.contains(event.target as Node)) {
        setShowImageCount(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSendMessage = async () => {
    if (!inputText.trim() && !screenshotPreview && uploadedImagePreviews.length === 0) return

    let imageData: string | undefined
    
    // 优先使用截图预览，其次使用上传图片预览
    if (screenshotPreview) {
      imageData = screenshotPreview
      setScreenshotPreview(null)
    } else if (uploadedImagePreviews.length > 0) {
      // 如果有多张图片，只发送第一张（或可以根据需求调整）
      imageData = uploadedImagePreviews[0]
      setUploadedImagePreviews([])
    }

    // 构建包含设置信息的消息内容
    const settingsInfo = `[模型: ${selectedModel}, 比例: ${selectedAspectRatio}, 张数: ${imageCount}]`
    const imageCountText = uploadedImagePreviews.length > 1 ? `${uploadedImagePreviews.length}张图片` : '一张图片'
    const messageContent = inputText ? `${inputText} ${settingsInfo}` : `我上传了${imageCountText} ${settingsInfo}`

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'user',
      content: messageContent,
      timestamp: new Date(),
      imageData,
    }

    // 更新消息状态
    setMessages(prev => {
      const newMessages = [...prev, userMessage]
      
      // 同时保存到localStorage
      const chatHistory = newMessages.map(msg => ({
        id: msg.id,
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp instanceof Date && !isNaN(msg.timestamp.getTime()) 
          ? msg.timestamp.toISOString() 
          : new Date().toISOString(),
        imageData: msg.imageData
      }))
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('chatHistory', JSON.stringify(chatHistory))
      }
      
      return newMessages
    })
    
    setInputText('')
    setIsGenerating(true)

    // 模拟AI响应
    setTimeout(() => {
      const aiMessage: Message = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'ai',
        content: imageData 
          ? `已收到您${screenshotPreview ? '截图' : '上传'}的图片。使用${selectedModel}模型，${selectedAspectRatio}比例，生成${imageCount}张图片。` 
          : `根据您的描述，使用${selectedModel}模型，${selectedAspectRatio}比例，生成${imageCount}张图片。`,
        timestamp: new Date(),
      }

      // 更新消息状态（包含AI响应）
      setMessages(prev => {
        const newMessages = [...prev, aiMessage]
        
        // 同时保存到localStorage
        const chatHistory = newMessages.map(msg => ({
          id: msg.id,
          type: msg.type,
          content: msg.content,
          timestamp: msg.timestamp instanceof Date && !isNaN(msg.timestamp.getTime()) 
            ? msg.timestamp.toISOString() 
            : new Date().toISOString(),
          imageData: msg.imageData
        }))
        
        console.log('保存AI响应后的聊天记录:', chatHistory)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('chatHistory', JSON.stringify(chatHistory))
        }
        
        return newMessages
      })
      
      setIsGenerating(false)
    }, 2000)
  }



  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const validFiles = Array.from(files).filter(file => {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        alert(`文件 ${file.name} 不是图片文件，已跳过`)
        return false
      }

      // 检查文件大小（限制为5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert(`图片 ${file.name} 大小超过5MB，已跳过`)
        return false
      }

      return true
    })

    if (validFiles.length === 0) return

    // 读取所有有效文件
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        // 将上传的图片添加到预览列表
        setUploadedImagePreviews(prev => [...prev, imageData])
      }
      reader.readAsDataURL(file)
    })
    
    // 重置文件输入，允许重复上传同一文件
    event.target.value = ''
  }

  // 接收截图并显示在输入区域左侧
  const handleReceiveScreenshot = (imageData: string, prompt: string) => {
    console.log('接收到截图，显示在输入区域左侧:', { imageData: imageData.substring(0, 50) + '...', prompt })
    // 将截图添加到上传图片预览列表
    setUploadedImagePreviews(prev => [...prev, imageData])
    // 自动填充提示词到输入框
    setInputText(prompt)
  }

  // 重置聊天记录
  const resetChat = () => {
    setMessages([])
    setInputText('')
    setScreenshotPreview(null)
    setUploadedImagePreviews([])
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('chatHistory')
    }
    console.log('AI创作助手内容已重置')
  }

  // 使用useImperativeHandle暴露方法给父组件
  useImperativeHandle(ref, () => ({
    handleReceiveScreenshot,
    resetChat
  }), [handleReceiveScreenshot, resetChat])

  // 使用useEffect监听onReceiveScreenshot的变化
  useEffect(() => {
    if (onReceiveScreenshot) {
      // 这里可以设置外部调用的接口
      // 例如，可以将handleReceiveScreenshot暴露给父组件
    }
  }, [onReceiveScreenshot])

  const handleGenerateImage = async (prompt: string) => {
    setIsGenerating(true)
    
    // 模拟图片生成
    setTimeout(() => {
      const aiMessage: Message = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'ai',
        content: `已根据提示词"${prompt}"生成图片`,
        timestamp: new Date(),
        imageData: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjNmMyIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFJIEltYWdlIEdlbmVyYXRlZDwvdGV4dD4KPC9zdmc+',
      }

      // 添加新消息而不是覆盖
      setMessages(prev => [...prev, aiMessage])
      setIsGenerating(false)
    }, 3000)
  }

  const handleGenerateVideo = async (prompt: string) => {
    setIsGenerating(true)
    
    // 模拟视频生成
    setTimeout(() => {
      const aiMessage: Message = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'ai',
        content: `已根据提示词"${prompt}"生成视频`,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, aiMessage])
      setIsGenerating(false)
    }, 5000)
  }

  const handleDownload = (imageData: string, filename: string) => {
    const link = document.createElement('a')
    link.download = filename
    link.href = imageData
    link.click()
  }

  // 如果面板被关闭，显示展开按钮
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute right-4 top-16 bg-primary-600 text-white p-3 rounded-lg shadow-lg hover:bg-primary-700 transition-colors z-30"
        title="展开AI创作助手"
      >
        <MessageSquare className="h-5 w-5" />
      </button>
    )
  }

  // 如果面板被收缩，显示收缩状态
  if (isCollapsed) {
    return (
      <div className="absolute right-4 top-16 bg-white rounded-lg shadow-lg z-30">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-primary-600" />
            <span className="text-sm font-medium text-gray-900">AI助手</span>
          </div>
          <button
            onClick={toggleCollapse}
            className="p-1 hover:bg-gray-100 rounded ml-2"
            title="展开面板"
          >
            <ChevronLeft className="h-4 w-4 text-gray-500 transform rotate-180" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute right-4 top-16 bottom-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col z-30 border border-gray-200 dark:border-gray-600" data-chat-panel="true">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI创作助手</h3>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={toggleCollapse}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="收缩面板"
          >
            <ChevronLeft className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            data-message="true"
            data-message-type={message.type}
          >
            <div className={`max-w-xs rounded-lg p-3 ${
              message.type === 'user' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
            }`}>
              <p className="text-sm" data-message-content="true">{message.content}</p>
              
              {message.imageData && (
                <div className="mt-2">
                  <img 
                    src={message.imageData} 
                    alt="截图" 
                    className="rounded border border-gray-200 dark:border-gray-600 max-w-full"
                  />

                </div>
              )}

              {message.type === 'ai' && message.imageData && (
                <div className="mt-2" data-ai-generated="true">
                  <img 
                    src={message.imageData} 
                    alt="AI生成图片" 
                    className="rounded border border-gray-200 dark:border-gray-600 max-w-full"
                  />
                  <button
                    onClick={() => handleDownload(message.imageData!, 'ai-generated.png')}
                    className="flex items-center space-x-1 text-xs mt-2 text-blue-600"
                  >
                    <Download className="h-3 w-3" />
                    <span>下载图片</span>
                  </button>
                </div>
              )}

              <div className={`text-xs mt-1 ${
                message.type === 'user' ? 'text-primary-200' : 'text-gray-500'
              }`} data-message-time="true">
                {message.timestamp instanceof Date && !isNaN(message.timestamp.getTime()) 
                  ? message.timestamp.toLocaleTimeString('zh-CN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })
                  : new Date().toLocaleTimeString('zh-CN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })
                }
              </div>
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-600 space-y-2">

        {/* 图片预览区域 - 移到上传按钮上方 */}
        {(screenshotPreview || uploadedImagePreviews.length > 0) && (
          <div className="flex items-center space-x-2 mb-2">
            {/* 截图预览 */}
            {screenshotPreview && (
              <div className="relative">
                <img 
                  src={screenshotPreview} 
                  alt="截图预览" 
                  className="w-12 h-12 rounded border border-gray-200 dark:border-gray-600 object-cover"
                />
                <button
                  onClick={() => setScreenshotPreview(null)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  title="删除截图"
                >
                  ×
                </button>
              </div>
            )}
            {/* 上传图片预览 - 支持多张图片 */}
            {uploadedImagePreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img 
                  src={preview} 
                  alt={`上传图片预览 ${index + 1}`} 
                  className="w-12 h-12 rounded border border-gray-200 dark:border-gray-600 object-cover"
                />
                <button
                  onClick={() => setUploadedImagePreviews(prev => prev.filter((_, i) => i !== index))}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  title="删除上传图片"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center space-x-2">
          {/* 上传图片按钮 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center space-x-1"
            title="上传图片"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>

          {/* 模型、比例、张数按钮 */}
          <div className="flex items-center space-x-1">
            <div className="relative" ref={modelSettingsRef}>
              <button
                onClick={() => setShowModelSettings(!showModelSettings)}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="选择模型"
              >
                <Settings className="h-3 w-3" />
                <span>模型</span>
              </button>
              
              {/* 模型选择卡片 - Tab切换方式 */}
              {showModelSettings && (
                <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                  <div className="p-2">
                    {/* Tab切换栏 */}
                    <div className="flex border-b border-gray-200 dark:border-gray-600 mb-2">
                      {['图像', '视频', '文本'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveModelTab(tab)}
                          className={`flex-1 text-xs py-1 px-2 ${
                            activeModelTab === tab
                              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    
                    {/* Tab内容 */}
                    <div className="max-h-32 overflow-y-auto">
                      {activeModelTab === '图像' && (
                        <div className="space-y-1">
                          <button
                            onClick={() => setSelectedModel('Nanobanbana')}
                            className={`w-full text-left px-2 py-1 text-xs rounded ${
                              selectedModel === 'Nanobanbana' 
                                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' 
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            Nanobanbana
                          </button>
                          <button
                            onClick={() => setSelectedModel('gpt image')}
                            className={`w-full text-left px-2 py-1 text-xs rounded ${
                              selectedModel === 'gpt image' 
                                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' 
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            gpt image
                          </button>
                        </div>
                      )}
                      
                      {activeModelTab === '视频' && (
                        <div className="space-y-1">
                          <button
                            onClick={() => setSelectedModel('veo3')}
                            className={`w-full text-left px-2 py-1 text-xs rounded ${
                              selectedModel === 'veo3' 
                                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' 
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            veo3
                          </button>
                          <button
                            onClick={() => setSelectedModel('sora2')}
                            className={`w-full text-left px-2 py-1 text-xs rounded ${
                              selectedModel === 'sora2' 
                                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' 
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            sora2
                          </button>
                        </div>
                      )}
                      
                      {activeModelTab === '文本' && (
                        <div className="space-y-1">
                          <button
                            onClick={() => setSelectedModel('gpt5')}
                            className={`w-full text-left px-2 py-1 text-xs rounded ${
                              selectedModel === 'gpt5' 
                                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' 
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            gpt5
                          </button>
                          <button
                            onClick={() => setSelectedModel('deepseek')}
                            className={`w-full text-left px-2 py-1 text-xs rounded ${
                              selectedModel === 'deepseek' 
                                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' 
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            deepseek
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={aspectRatioRef}>
              <button
                onClick={() => setShowAspectRatio(!showAspectRatio)}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="选择图片比例"
              >
                <Monitor className="h-3 w-3" />
                <span>比例</span>
              </button>
              
              {/* 图片比例选择卡片 */}
              {showAspectRatio && (
                <div className="absolute bottom-full left-0 mb-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                  <div className="p-2">
                    <div className="space-y-1">
                      {['16:9', '9:16', '4:3', '3:4', '2:1', '1:2', '1:1'].map((ratio) => (
                        <button
                          key={ratio}
                          onClick={() => setSelectedAspectRatio(ratio)}
                          className={`w-full text-left px-2 py-1 text-xs rounded ${
                            selectedAspectRatio === ratio 
                              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={imageCountRef}>
              <button
                onClick={() => setShowImageCount(!showImageCount)}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="设置生成张数"
              >
                <Type className="h-3 w-3" />
                <span>张数</span>
              </button>
              
              {/* 生成张数设置卡片 */}
              {showImageCount && (
                <div className="absolute bottom-full left-0 mb-2 w-24 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                  <div className="p-3">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      张数: {imageCount}
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={imageCount}
                      onChange={(e) => setImageCount(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>1</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />

        <div className="flex space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="输入提示词或描述..."
            className="flex-1 input-field text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isGenerating}
            className="btn-primary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
})

export default ChatPanel