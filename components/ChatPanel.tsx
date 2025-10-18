'use client'

import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react'
import { Send, Image as ImageIcon, Video, Download, X, MessageSquare, ChevronLeft, Settings, Monitor, Film, Type, Trash2 } from 'lucide-react'
import { ModelService, type ImageModel, type VideoModel, type TextModel } from '@/services/ai-models'
import { chatDB } from '@/utils/chatDB'

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
  const inputRef = useRef<HTMLInputElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [uploadedImagePreviews, setUploadedImagePreviews] = useState<string[]>([])
  const [showModelSettings, setShowModelSettings] = useState(false)
  const [showAspectRatio, setShowAspectRatio] = useState(false)
  const [showImageCount, setShowImageCount] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ImageModel | VideoModel | TextModel>('seedream-4')
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('16:9')
  const [imageCount, setImageCount] = useState(1)
  const [selectedModelType, setSelectedModelType] = useState<'image' | 'video' | 'text'>('image')
  const [panelWidth, setPanelWidth] = useState(320) // 默认宽度320px
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartXRef = useRef(0)
  const resizeStartWidthRef = useRef(0)
  const currentWidthRef = useRef(320) // 使用ref存储当前宽度，避免频繁状态更新

  // 使用useCallback确保函数引用稳定，优化性能
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return
    
    const deltaX = e.clientX - resizeStartXRef.current
    const newWidth = Math.max(280, Math.min(600, resizeStartWidthRef.current - deltaX))
    
    // 直接更新ref，不触发重渲染
    currentWidthRef.current = newWidth
    
    // 直接设置DOM元素的宽度，避免React重渲染
    const panelElement = document.querySelector('[data-chat-panel="true"]') as HTMLElement
    if (panelElement) {
      panelElement.style.width = `${newWidth}px`
    }
  }, [isResizing])

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
    // 拖拽结束时才更新状态，触发一次重渲染
    setPanelWidth(currentWidthRef.current)
    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)
  }, [handleResizeMove])

  // 开始拖拽调整宽度
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    resizeStartXRef.current = e.clientX
    resizeStartWidthRef.current = panelWidth
    currentWidthRef.current = panelWidth
    
    // 添加全局鼠标事件监听器，使用passive: true优化性能
    document.addEventListener('mousemove', handleResizeMove, { passive: true })
    document.addEventListener('mouseup', handleResizeEnd, { once: true })
  }

  // 清理事件监听器
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
    }
  }, [handleResizeMove, handleResizeEnd])
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

  // 在客户端加载聊天记录 - 只加载不强制清空
  useEffect(() => {
    console.log('ChatPanel: 开始初始化聊天内容')
    
    if (typeof window === 'undefined') {
      console.log('ChatPanel: 不在客户端环境，跳过初始化')
      return
    }
    
    // 检查indexedDB支持
    if (!window.indexedDB) {
      console.error('ChatPanel: 浏览器不支持indexedDB')
      return
    }
    
    // 使用标志位防止重复加载
    let isMounted = true
    
    const loadChatHistory = async () => {
      try {
        console.log('ChatPanel: 开始加载聊天记录')
        
        // 从indexedDB加载聊天记录
        const dbMessages = await chatDB.getMessages('default')
        console.log('ChatPanel: 从数据库获取到的消息:', dbMessages)
        
        if (isMounted) {
          const formattedMessages = dbMessages.map(msg => ({
            id: msg.id,
            type: msg.type,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            imageData: msg.imageData
          }))
          
          setMessages(formattedMessages)
          console.log(`ChatPanel: 聊天记录加载完成，消息数量: ${formattedMessages.length}`)
        }
        
      } catch (error) {
        console.error('ChatPanel: 加载聊天记录时出错:', error)
        // 出错时设置消息为空数组
        if (isMounted) {
          setMessages([])
        }
      }
    }

    loadChatHistory()
    
    return () => {
      isMounted = false
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
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${performance.now()}`,
      type: 'user',
      content: messageContent,
      timestamp: new Date(),
      imageData,
    }

    // 直接更新消息状态，不嵌套数据库操作
    setMessages(prev => [...prev, userMessage])
    
    // 异步保存到数据库
    if (typeof window !== 'undefined') {
      chatDB.addMessage({
        type: userMessage.type,
        content: userMessage.content,
        timestamp: userMessage.timestamp,
        imageData: userMessage.imageData
      }, 'default').then(() => {
        console.log('用户消息已保存到indexedDB')
      }).catch(error => {
        console.error('保存消息到indexedDB失败:', error)
      })
    }
    
    setInputText('')
    // 清空contentEditable div的内容
    const contentEditableDiv = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (contentEditableDiv) {
      contentEditableDiv.textContent = ''
    }
    setIsGenerating(true)

    try {
      // 调用实际的AI模型API
      const request = {
        model: selectedModel,
        prompt: inputText,
        key: getApiKeyForModel(selectedModel), // 从环境变量获取API密钥
        images: imageData ? [imageData] : undefined,
        size: selectedAspectRatio === '16:9' ? '1024x576' : 
              selectedAspectRatio === '9:16' ? '576x1024' : 
              selectedAspectRatio === '4:3' ? '1024x768' : 
              selectedAspectRatio === '3:4' ? '768x1024' : '1024x1024'
      }

      console.log('发送AI请求:', { model: selectedModel, prompt: inputText })

      // 调用ModelService创建任务
      const taskId = await ModelService.createTask(request as any)
      
      console.log('AI任务创建成功，任务ID:', taskId)

      // 直接开始轮询任务状态，不显示中间状态消息
      await pollTaskStatus(taskId, request)

    } catch (error) {
      console.error('AI请求失败:', error)
      
      const errorMessage: Message = {
        id: `ai-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'ai',
        content: `请求失败: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
    }
  }

  // 根据模型获取API密钥
  const getApiKeyForModel = (model: string): string => {
    switch (model) {
      case 'nano-banana':
        return process.env.NEXT_PUBLIC_NANO_BANANA_API_KEY || ''
      case 'seedream-4':
        return process.env.NEXT_PUBLIC_SEEDREAM4_API_KEY || ''
      case 'veo3':
        return process.env.NEXT_PUBLIC_VEO3_API_KEY || ''
      case 'sora2':
        return process.env.NEXT_PUBLIC_SORA2_API_KEY || ''
      default:
        return ''
    }
  }

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string, request: any) => {
    let attempts = 0
    const maxAttempts = 30 // 最多尝试30次
    const pollInterval = 3000 // 3秒轮询一次
    let lastStatus = '' // 记录上一次的状态

    const poll = async () => {
      if (attempts >= maxAttempts) {
        // 只在超时时添加消息
        if (lastStatus !== 'timeout') {
          const timeoutMessage: Message = {
            id: `ai-timeout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${performance.now()}`,
            type: 'ai',
            content: '任务处理超时，请稍后重试',
            timestamp: new Date(),
          }
          setMessages(prev => [...prev, timeoutMessage])
          
          // 异步保存到数据库
          if (typeof window !== 'undefined') {
            chatDB.addMessage({
              type: timeoutMessage.type,
              content: timeoutMessage.content,
              timestamp: timeoutMessage.timestamp,
              imageData: timeoutMessage.imageData
            }, 'default').then(() => {
              console.log('AI超时消息已保存到indexedDB')
            }).catch(error => {
              console.error('保存AI超时消息到indexedDB失败:', error)
            })
          }
          
          lastStatus = 'timeout'
        }
        return
      }

      try {
        const status = await ModelService.getTaskStatus({
          ...request,
          taskId
        })

        // 只在状态发生变化时添加消息
        if (status.status === '2' && lastStatus !== 'success') { // 成功
          const successMessage: Message = {
            id: `ai-success-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${performance.now()}`,
            type: 'ai',
            content: '内容生成完成！',
            timestamp: new Date(),
            imageData: (status as any).imageUrl || (status as any).videoUrl
          }
          setMessages(prev => [...prev, successMessage])
          
          // 异步保存到数据库
          if (typeof window !== 'undefined') {
            chatDB.addMessage({
              type: successMessage.type,
              content: successMessage.content,
              timestamp: successMessage.timestamp,
              imageData: successMessage.imageData
            }, 'default').then(() => {
              console.log('AI成功消息已保存到indexedDB')
            }).catch(error => {
              console.error('保存AI消息到indexedDB失败:', error)
            })
          }
          
          lastStatus = 'success'
        } else if (status.status === '3' && lastStatus !== 'failure') { // 失败
          const failureMessage: Message = {
            id: `ai-failure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${performance.now()}`,
            type: 'ai',
            content: `生成失败: ${status.error || '未知错误'}`,
            timestamp: new Date(),
          }
          setMessages(prev => [...prev, failureMessage])
          
          // 异步保存到数据库
          if (typeof window !== 'undefined') {
            chatDB.addMessage({
              type: failureMessage.type,
              content: failureMessage.content,
              timestamp: failureMessage.timestamp,
              imageData: failureMessage.imageData
            }, 'default').then(() => {
              console.log('AI错误消息已保存到indexedDB')
            }).catch(error => {
              console.error('保存AI错误消息到indexedDB失败:', error)
            })
          }
          
          lastStatus = 'failure'
        } else if (status.status === '1') { // 处理中，继续轮询
          attempts++
          setTimeout(poll, pollInterval)
        } else { // 其他状态，继续轮询
          attempts++
          setTimeout(poll, pollInterval)
        }
      } catch (error) {
        console.error('轮询任务状态失败:', error)
        attempts++
        setTimeout(poll, pollInterval)
      }
    }

    await poll()
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

  // 接收截图并显示在输入区域左侧 - 如果有已有截图就替换
  const handleReceiveScreenshot = (imageData: string, prompt: string) => {
    console.log('接收到截图，替换输入区域左侧的截图:', { imageData: imageData.substring(0, 50) + '...', prompt })
    // 替换上传图片预览列表中的截图（如果有截图就替换，没有就添加）
    setUploadedImagePreviews(prev => {
      // 如果已经有截图，替换第一个截图；如果没有，添加新截图
      if (prev.length > 0) {
        return [imageData, ...prev.slice(1)]
      } else {
        return [imageData]
      }
    })
    // 自动填充提示词到输入框
    setInputText(prompt)
  }

  // 重置聊天记录
  const resetChat = async () => {
    setMessages([])
    setInputText('')
    setScreenshotPreview(null)
    setUploadedImagePreviews([])
    if (typeof window !== 'undefined') {
      try {
        // 清空indexedDB中的聊天记录
        await chatDB.clearAll()
        console.log('AI创作助手内容已重置（indexedDB）')
        // 不触发事件，避免重复加载
      } catch (error) {
        console.error('重置聊天记录失败:', error)
        // 如果indexedDB操作失败，也尝试清除localStorage
        window.localStorage.removeItem('chatHistory')
        console.log('AI创作助手内容已重置（localStorage）')
        // 不触发事件，避免重复加载
      }
    }
  }

  // 记录生图任务到聊天记录
  const logGenerateImageTask = (prompt: string, model: string, aspectRatio: string, imageData?: string) => {
    const settingsInfo = `[模型: ${model}, 比例: ${aspectRatio}]`
    const messageContent = prompt ? `${prompt} ${settingsInfo}` : `生成图片 ${settingsInfo}`

    // 确保图片数据格式正确（添加data:image/png;base64,前缀）
    let formattedImageData = imageData
    if (imageData && !imageData.startsWith('data:')) {
      formattedImageData = `data:image/png;base64,${imageData}`
    }

    const userMessage: Message = {
      id: `generate-image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'user',
      content: messageContent,
      timestamp: new Date(),
      imageData: formattedImageData,
    }

    // 直接更新消息状态，不嵌套数据库操作
    setMessages(prev => [...prev, userMessage])
    
    // 异步保存到数据库
    if (typeof window !== 'undefined') {
      chatDB.addMessage({
        type: userMessage.type,
        content: userMessage.content,
        timestamp: userMessage.timestamp,
        imageData: userMessage.imageData
      }, 'default').then(() => {
        console.log('生图任务已记录到聊天记录')
      }).catch(error => {
        console.error('保存生图任务到聊天记录失败:', error)
      })
    }
  }

  // 记录生图结果到聊天记录
  const logGenerateImageResult = (imageUrl: string, prompt: string) => {
    const aiMessage: Message = {
      id: `ai-result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'ai',
      content: `已根据提示词"${prompt}"生成图片`,
      timestamp: new Date(),
      imageData: imageUrl,
    }

    // 直接更新消息状态，不嵌套数据库操作
    setMessages(prev => [...prev, aiMessage])
    
    // 异步保存到数据库
    if (typeof window !== 'undefined') {
      chatDB.addMessage({
        type: aiMessage.type,
        content: aiMessage.content,
        timestamp: aiMessage.timestamp,
        imageData: aiMessage.imageData
      }, 'default').then(() => {
        console.log('生图结果已记录到聊天记录')
      }).catch(error => {
        console.error('保存生图结果到聊天记录失败:', error)
      })
    }
  }

  // 使用useImperativeHandle暴露方法给父组件
  useImperativeHandle(ref, () => ({
    handleReceiveScreenshot,
    resetChat,
    logGenerateImageTask,
    logGenerateImageResult
  }), [handleReceiveScreenshot, resetChat, logGenerateImageTask, logGenerateImageResult])

  // 使用useEffect监听onReceiveScreenshot的变化
  useEffect(() => {
    if (onReceiveScreenshot) {
      // 这里可以设置外部调用的接口
      // 例如，可以将handleReceiveScreenshot暴露给父组件
    }
  }, [onReceiveScreenshot])

  // 监听模型类型变化，自动设置默认模型
  useEffect(() => {
    const supportedModels = ModelService.getModelsByType(selectedModelType);
    if (supportedModels.length > 0 && !supportedModels.includes(selectedModel as any)) {
      setSelectedModel(supportedModels[0] as ImageModel | VideoModel | TextModel);
    }
  }, [selectedModelType, selectedModel])

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

  // 将图片添加到画板 - 切换到箭头工具模式
  const handleAddToCanvas = (imageData: string) => {
    // 检查全局画布对象是否存在
    if (typeof window !== 'undefined' && (window as any).fabricCanvas) {
      
      // 触发自定义事件，通知画板切换到箭头工具并传递图片数据
      const event = new CustomEvent('canvas:switchToArrowTool', {
        detail: { imageData }
      })
      window.dispatchEvent(event)
      
      console.log('已发送切换到箭头工具事件，准备添加图片到画板')
      
      // 显示提示信息
      const notification = document.createElement('div')
      notification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #3b82f6; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
          已切换到选择工具，请在画板上点击放置图片
        </div>
      `
      document.body.appendChild(notification)
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 3000)
      
    } else {
      alert('画板未初始化，请先打开画板')
    }
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
    <div 
      className={`absolute right-4 top-16 bottom-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col z-30 border border-gray-200 dark:border-gray-600 transition-all duration-200 ${
        isResizing ? 'cursor-col-resize select-none' : ''
      }`}
      style={{ width: `${panelWidth}px` }}
      data-chat-panel="true"
    >
      {/* 拖拽手柄 - 放在左侧外部 */}
      <div
        className="absolute -left-2 top-0 bottom-0 w-4 cursor-col-resize z-40"
        onMouseDown={handleResizeStart}
        title="拖拽调整宽度"
      >
        <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-1 h-16 bg-gray-300 dark:bg-gray-600 rounded-full hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors"></div>
      </div>
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI创作助手</h3>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={resetChat}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-500 dark:text-red-400"
            title="清理聊天记录"
          >
            <Trash2 className="h-4 w-4" />
          </button>
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
                <div className="mt-2" data-ai-generated={message.type === 'ai' ? 'true' : 'false'}>
                  <img 
                    src={message.imageData} 
                    alt={message.type === 'ai' ? 'AI生成图片' : '截图'} 
                    className="rounded border border-gray-200 dark:border-gray-600 max-w-full"
                  />
                  {message.type === 'ai' && (
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => handleDownload(message.imageData!, 'ai-generated.png')}
                        className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <Download className="h-3 w-3" />
                        <span>下载图片</span>
                      </button>
                      <button
                        onClick={() => handleAddToCanvas(message.imageData!)}
                        className="flex items-center space-x-1 text-xs text-green-600 hover:text-green-800"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span>添加到画板</span>
                      </button>
                    </div>
                  )}
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
          {/* 模型、比例、张数按钮 - 自适应布局 */}
          <div className="flex flex-wrap items-center gap-1">
            {/* 上传图片按钮 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center space-x-1.5"
              title="上传图片"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
            {/* 模型类型切换 - 图标左右切换方式 */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1.5">
              <button
                onClick={() => setSelectedModelType('image')}
                className={`p-1.5 rounded-lg transition-colors ${
                  selectedModelType === 'image' 
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-700 dark:text-gray-300' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="图片生成"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => setSelectedModelType('video')}
                className={`p-1.5 rounded-lg transition-colors ${
                  selectedModelType === 'video' 
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-700 dark:text-gray-300' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="视频生成"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => setSelectedModelType('text')}
                className={`p-1.5 rounded-lg transition-colors ${
                  selectedModelType === 'text' 
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-700 dark:text-gray-300' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="文本生成"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </div>

            {/* 模型选择 - 下拉菜单方式 */}
            <div className="relative" ref={modelSettingsRef}>
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1.5">
                <button
                  onClick={() => setShowModelSettings(!showModelSettings)}
                  className="flex items-center space-x-1.5 p-1.5 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <span className="whitespace-nowrap">
                    {ModelService.getModelInfo(selectedModel)?.name || selectedModel}
                  </span>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {showModelSettings && (
                <div className="absolute bottom-full left-0 mb-1.5 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                  <div className="p-1.5">
                    {ModelService.getModelsByType(selectedModelType).map((model) => {
                      const modelInfo = ModelService.getModelInfo(model);
                      return (
                        <button
                          key={model}
                          onClick={() => {
                            setSelectedModel(model as ImageModel | VideoModel | TextModel)
                            setShowModelSettings(false)
                          }}
                          className={`w-full text-left px-2 py-1 text-xs rounded truncate ${
                            selectedModel === model 
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          title={modelInfo?.description}
                        >
                          {modelInfo?.name || model}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 比例选择 - 下拉菜单方式 */}
            <div className="relative" ref={aspectRatioRef}>
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1.5">
                <button
                  onClick={() => setShowAspectRatio(!showAspectRatio)}
                  className="flex items-center space-x-1.5 p-1.5 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <span className="whitespace-nowrap">{selectedAspectRatio}</span>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {showAspectRatio && (
                <div className="absolute bottom-full left-0 mb-1.5 w-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                  <div className="p-1.5">
                    {['16:9', '9:16', '4:3', '3:4', '1:1'].map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => {
                          setSelectedAspectRatio(ratio)
                          setShowAspectRatio(false)
                        }}
                        className={`w-full text-left px-2.5 py-1.5 text-sm rounded truncate ${
                          selectedAspectRatio === ratio 
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 张数选择 - 下拉菜单方式 */}
            <div className="relative" ref={imageCountRef}>
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1.5">
                <button
                  onClick={() => setShowImageCount(!showImageCount)}
                  className="flex items-center space-x-1.5 p-1.5 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <span className="whitespace-nowrap">{imageCount}张</span>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {showImageCount && (
                <div className="absolute bottom-full left-0 mb-1.5 w-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                  <div className="p-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
                      <button
                        key={count}
                        onClick={() => {
                          setImageCount(count)
                          setShowImageCount(false)
                        }}
                        className={`w-full text-left px-2.5 py-1.5 text-sm rounded truncate ${
                          imageCount === count 
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {count}张
                      </button>
                    ))}
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
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder="输入提示词或描述..."
            className="flex-1 input-field text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 min-h-[38px] resize-none"
            rows={1}
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