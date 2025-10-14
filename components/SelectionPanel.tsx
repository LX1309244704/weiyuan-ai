'use client'

import { useState, useEffect } from 'react'

interface SelectionData {
  rect: any
  mousePosition: { x: number; y: number }
  screenPosition: { x: number; y: number }
}

interface SelectionPanelProps {
  selectedArea: SelectionData | null
  onGenerateImage: (prompt: string, model: string, position: { x: number; y: number }) => void
  onGenerateVideo: (prompt: string, model: string) => void
  onCaptureArea: () => Promise<string | null>
  onReceiveScreenshot?: (imageData: string, prompt: string) => void
  onClearSelection?: () => void
}

export default function SelectionPanel({ selectedArea, onGenerateImage, onCaptureArea, onReceiveScreenshot, onClearSelection }: SelectionPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [panelPosition, setPanelPosition] = useState({ left: 0, top: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [addButtonPosition, setAddButtonPosition] = useState({ left: 0, top: 0 })
  const [showAddButton, setShowAddButton] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [selectedModelType, setSelectedModelType] = useState<'image' | 'video'>('image')
  const [selectedImageModel, setSelectedImageModel] = useState('stable-diffusion')
  const [selectedVideoModel, setSelectedVideoModel] = useState('veo3')
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('16:9')
  const [selectedVideoSeconds, setSelectedVideoSeconds] = useState('5')
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [showAspectDropdown, setShowAspectDropdown] = useState(false)
  const [showSecondsDropdown, setShowSecondsDropdown] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [textareaHeight, setTextareaHeight] = useState('32px')
  const [canvasScale, setCanvasScale] = useState(1)

  // 监听输入内容变化，自动调整textarea高度
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // 计算文本行数
    const lineCount = customPrompt.split('\n').length
    const baseHeight = 32 // 基础高度
    const lineHeight = 20 // 每行高度
    const maxHeight = 80 // 最大高度
    
    // 计算新高度
    let newHeight = baseHeight + (lineCount - 1) * lineHeight
    newHeight = Math.min(Math.max(newHeight, baseHeight), maxHeight)
    
    setTextareaHeight(`${newHeight}px`)
  }, [customPrompt])

  // 监听画板缩放变化
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleCanvasScaleChange = () => {
      // 从全局状态或DOM中获取当前画板缩放比例
      const scaleElement = document.querySelector('[data-canvas-scale]')
      const scale = scaleElement ? parseFloat(scaleElement.getAttribute('data-canvas-scale') || '1') : 1
      setCanvasScale(scale)
      console.log('画板缩放比例变化:', scale)
    }

    // 监听自定义事件或轮询检查缩放变化
    window.addEventListener('canvasScaleChange', handleCanvasScaleChange)
    
    // 初始检查
    handleCanvasScaleChange()
    
    // 设置轮询检查缩放变化（每500ms检查一次）
    const intervalId = setInterval(handleCanvasScaleChange, 500)
    
    return () => {
      window.removeEventListener('canvasScaleChange', handleCanvasScaleChange)
      clearInterval(intervalId)
    }
  }, [])

  console.log('SelectionPanel 渲染，selectedArea:', selectedArea, 'canvasScale:', canvasScale)

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    if (!selectedArea) {
      setIsVisible(false)
      setShowAddButton(false)
      return
    }

    const { screenPosition, rect } = selectedArea
    
    console.log('SelectionPanel: 鼠标屏幕位置:', screenPosition)
    
    // 计算主面板位置（吸附在"添加到聊天"按钮下方，智能边界对齐）
    const calculatePanelPosition = () => {
      const panelWidth = 250
      const panelHeight = 80
      
      // 先计算"+"按钮的位置
      const addButtonPos = calculateAddButtonPosition()
      const buttonSize = 24 * canvasScale
      
      // 默认位置：面板放在"+"按钮的下方，右侧边缘对齐
      let panelLeft = addButtonPos.left + buttonSize - panelWidth
      let panelTop = addButtonPos.top + buttonSize + 10
      
      // 智能边界检查：根据按钮在屏幕中的位置决定对齐方式
      const screenCenterX = window.innerWidth / 2
      const isButtonOnRightSide = addButtonPos.left > screenCenterX
      
      if (isButtonOnRightSide) {
        // 按钮在屏幕右侧：右侧边缘对齐
        panelLeft = addButtonPos.left + buttonSize - panelWidth
        
        // 如果超出左侧边界，改为左侧对齐
        if (panelLeft < 10) {
          panelLeft = addButtonPos.left
        }
      } else {
        // 按钮在屏幕左侧：左侧对齐
        panelLeft = addButtonPos.left
        
        // 如果超出右侧边界，改为右侧边缘对齐
        if (panelLeft + panelWidth > window.innerWidth - 10) {
          panelLeft = addButtonPos.left + buttonSize - panelWidth
        }
      }
      
      // 垂直边界检查
      if (panelTop + panelHeight > window.innerHeight - 10) {
        // 如果超出底部边界，放在按钮上方
        panelTop = addButtonPos.top - panelHeight - 10
      }
      
      // 最终边界约束
      const finalLeft = Math.max(10, Math.min(panelLeft, window.innerWidth - panelWidth - 10))
      const finalTop = Math.max(10, Math.min(panelTop, window.innerHeight - panelHeight - 10))
      
      console.log('SelectionPanel: 智能定位面板:', {
        addButtonPos,
        isButtonOnRightSide,
        screenCenterX,
        panelLeft, panelTop,
        finalLeft, finalTop
      })
      
      return { left: finalLeft, top: finalTop }
    }
    
    // 计算"+"按钮位置（以鼠标最后坐标为基础，考虑画板缩放）
    const calculateAddButtonPosition = () => {
      if (!selectedArea) return { left: 0, top: 0 }
      
      // 直接使用鼠标的最后屏幕坐标
      const mouseScreenX = selectedArea.screenPosition.x
      const mouseScreenY = selectedArea.screenPosition.y
      
      // "+"按钮放在鼠标最后坐标的内部右下角，考虑缩放比例
      const baseButtonSize = 24
      const buttonSize = baseButtonSize * canvasScale
      const offset = 4 * canvasScale  // 内部偏移，更靠近鼠标位置
      
      // 按钮放在鼠标坐标的内部右下角
      const buttonLeft = mouseScreenX - buttonSize - offset  // 内部右侧
      const buttonTop = mouseScreenY - buttonSize - offset   // 内部底部
      
      // 边界检查：确保按钮不会超出屏幕
      const maxLeft = window.innerWidth - buttonSize - 10
      const maxTop = window.innerHeight - buttonSize - 10
      const finalLeft = Math.max(10, Math.min(buttonLeft, maxLeft))
      const finalTop = Math.max(10, Math.min(buttonTop, maxTop))
      
      console.log('"+按钮位置计算（基于鼠标坐标和缩放）:', {
        mouseScreenX, mouseScreenY,
        canvasScale,
        buttonSize,
        buttonLeft, buttonTop,
        finalLeft, finalTop
      })
      
      return { left: finalLeft, top: finalTop }

    }
    
    const panelPos = calculatePanelPosition()
    const addButtonPos = calculateAddButtonPosition()
    
    setPanelPosition(panelPos)
    setAddButtonPosition(addButtonPos)
    setIsVisible(true)
    setShowAddButton(true)
    
    // 添加鼠标移动监听器，实现自动移动功能
    const handleMouseMove = (event: MouseEvent) => {
      if (!selectedArea) return
      
      const { clientX, clientY } = event
      const { rect } = selectedArea
      
      // 更新鼠标位置
      const updatedSelectedArea = {
        ...selectedArea,
        screenPosition: { x: clientX, y: clientY }
      }
      
      // 重新计算位置
      const newPanelPos = calculatePanelPosition()
      const newAddButtonPos = calculateAddButtonPosition()
      
      setPanelPosition(newPanelPos)
      setAddButtonPosition(newAddButtonPos)
    }
    
    // 添加鼠标移动事件监听
    document.addEventListener('mousemove', handleMouseMove)
    
    // 清理函数
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [selectedArea])

  // 如果不显示面板，直接返回null
  if (!isVisible) {
    return null
  }

  // 处理添加到聊天功能
  const handleAddToChat = async () => {
    if (!selectedArea) return
    
    setIsGenerating(true)
    
    try {
      // 先截图
      const imageData = await onCaptureArea()
      if (imageData && onReceiveScreenshot) {
        const { left, top } = selectedArea.rect
        // 发送截图到聊天面板，但不触发生成图片
        onReceiveScreenshot(imageData, `框选区域截图，位置: (${left.toFixed(0)}, ${top.toFixed(0)})`)
        
        // 显示添加成功提示
        const notification = document.createElement('div')
        notification.innerHTML = `
          <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
            截图已添加到聊天
          </div>
        `
        document.body.appendChild(notification)
        
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification)
          }
        }, 2000)
      }
    } catch (error) {
      console.error('添加到聊天失败:', error)
    } finally {
      setIsGenerating(false)
      // 操作完成后隐藏按钮和清除框选
      setShowAddButton(false)
      onClearSelection?.()
    }
  }

  return (
    <>
      {/* 主面板 - 扩展功能（从右到左布局，跟随缩放） */}
      <div 
        className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
        style={{ 
          left: `${panelPosition.left}px`, 
          top: `${panelPosition.top}px`,
          width: 'auto',
          padding: `${4 * canvasScale}px`,
          minWidth: `${250 * canvasScale}px`,
          transform: `scale(${1.25 * canvasScale})`,
          transformOrigin: 'top left'
        }}
      >
        <div className="flex items-center justify-end space-x-2">
          {/* 1. 图标左右切换 - 模型类型切换 */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setSelectedModelType('image')}
              className={`p-1 rounded-lg transition-colors ${
                selectedModelType === 'image' 
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-700 dark:text-gray-300' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="图片生成"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedModelType('video')}
              className={`p-1 rounded-lg transition-colors ${
                selectedModelType === 'video' 
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-700 dark:text-gray-300' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="视频生成"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {/* 2. 模型选择 */}
          <div className="relative">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setShowAspectDropdown(!showAspectDropdown)}
                className="flex items-center space-x-1 p-1 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <span>
                  {selectedModelType === 'image' 
                    ? selectedImageModel === 'stable-diffusion' ? 'SD' : 'GPT'
                    : selectedVideoModel === 'veo3' ? 'Veo3' : 'Sora2'
                  }
                </span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {showAspectDropdown && (
              <div className="absolute bottom-full left-0 mb-1 w-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                <div className="p-1">
                  {selectedModelType === 'image' ? (
                    <>
                      <button
                        onClick={() => {
                          setSelectedImageModel('stable-diffusion')
                          setShowAspectDropdown(false)
                        }}
                        className={`w-full text-left px-2 py-1 text-xs rounded ${
                          selectedImageModel === 'stable-diffusion' 
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        SD
                      </button>
                      <button
                        onClick={() => {
                          setSelectedImageModel('gpt-image')
                          setShowAspectDropdown(false)
                        }}
                        className={`w-full text-left px-2 py-1 text-xs rounded ${
                          selectedImageModel === 'gpt-image' 
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        GPT
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setSelectedVideoModel('veo3')
                          setShowAspectDropdown(false)
                        }}
                        className={`w-full text-left px-2 py-1 text-xs rounded ${
                          selectedVideoModel === 'veo3' 
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        Veo3
                      </button>
                      <button
                        onClick={() => {
                          setSelectedVideoModel('sora2')
                          setShowAspectDropdown(false)
                        }}
                        className={`w-full text-left px-2 py-1 text-xs rounded ${
                          selectedVideoModel === 'sora2' 
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        Sora2
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. 比例/秒数选择 */}
          <div className="relative">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setShowSecondsDropdown(!showSecondsDropdown)}
                className="flex items-center space-x-1 p-1 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <span>
                  {selectedModelType === 'image' 
                    ? selectedAspectRatio
                    : `${selectedVideoSeconds}s`
                  }
                </span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {showSecondsDropdown && (
              <div className="absolute bottom-full left-0 mb-1 w-16 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                <div className="p-1">
                  {selectedModelType === 'image' ? (
                    <>
                      {['16:9', '9:16', '4:3', '3:4', '1:1'].map((ratio) => (
                        <button
                          key={ratio}
                          onClick={() => {
                            setSelectedAspectRatio(ratio)
                            setShowSecondsDropdown(false)
                          }}
                          className={`w-full text-left px-2 py-1 text-xs rounded ${
                            selectedAspectRatio === ratio 
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      {['3', '5', '10', '15', '30'].map((seconds) => (
                        <button
                          key={seconds}
                          onClick={() => {
                            setSelectedVideoSeconds(seconds)
                            setShowSecondsDropdown(false)
                          }}
                          className={`w-full text-left px-2 py-1 text-xs rounded ${
                            selectedVideoSeconds === seconds 
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {seconds}s
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. 输入框 */}
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => {
              // 阻止快捷键事件冒泡和默认行为，避免影响全局快捷键
              e.stopPropagation()
              e.nativeEvent?.stopImmediatePropagation?.()
              
              // 如果是控制键组合，阻止默认行为
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault()
              }
              
              // 特殊处理：允许基本的文本编辑快捷键
              const key = e.key.toLowerCase()
              if ((e.ctrlKey || e.metaKey) && ['a', 'x', 'v', 'z', 'y'].includes(key)) {
                // 允许文本编辑快捷键：全选、剪切、粘贴、撤销、重做
                return
              }
              
              // 阻止其他所有快捷键的默认行为
              if (['delete', 'backspace', 'enter', 'escape', 'tab'].includes(key)) {
                // 这些键在输入框中应该有正常行为，不阻止
                return
              }
            }}
            placeholder="输入提示词..."
            className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 resize-none"
            style={{ minWidth: '120px', height: textareaHeight, minHeight: '32px', maxHeight: '80px' }}
            rows={1}
          />

          {/* 5. 生成按钮 */}
          <div className="flex items-center bg-blue-500 hover:bg-blue-600 rounded-lg p-1 transition-colors shadow-md">
            <button
              onClick={async () => {
                if (!selectedArea) return
                
                setIsGenerating(true)
                // 先截图
                const imageData = await onCaptureArea()
                if (imageData) {
                  // 发送截图到AI创作助手，如果有已有截图就替换
                  if (onReceiveScreenshot) {
                    const { left, top } = selectedArea.rect
                    const modelInfo = selectedModelType === 'image' 
                      ? `图片模型: ${selectedImageModel}, 比例: ${selectedAspectRatio}`
                      : `视频模型: ${selectedVideoModel}, 时长: ${selectedVideoSeconds}秒`
                    
                    // 使用自定义提示词或默认提示词
                    const finalPrompt = customPrompt.trim() 
                      ? customPrompt
                      : `基于选择区域生成${selectedModelType === 'image' ? '图片' : '视频'}，位置: (${left.toFixed(0)}, ${top.toFixed(0)}), ${modelInfo}`
                    
                    onReceiveScreenshot(imageData, finalPrompt)
                  }
                  // 然后生成内容
                  const { left, top } = selectedArea.rect
                  const prompt = customPrompt.trim() 
                    ? customPrompt
                    : `基于选择区域生成${selectedModelType === 'image' ? '图片' : '视频'}，位置: (${left.toFixed(0)}, ${top.toFixed(0)})`
                  const model = selectedModelType === 'image' ? selectedImageModel : selectedVideoModel
                  
                  if (selectedModelType === 'image') {
                    // 获取框选最后坐标作为图片起始位置
                    const { left, top, width, height } = selectedArea.rect
                    const endX = left + width
                    const endY = top + height
                    
                    onGenerateImage(prompt, model, { x: endX, y: endY })
                  } else {
                    // 这里需要调用视频生成函数
                    console.log('视频生成:', prompt, model)
                  }
                }
                setIsGenerating(false)
                // 操作完成后隐藏面板和清除框选
                setIsVisible(false)
                setShowAddButton(false)
                onClearSelection?.()
                // 清空输入框
                setCustomPrompt('')
              }}
              disabled={isGenerating}
              className="text-white px-1.5 py-0.5 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isGenerating ? '生成中...' : `生成${selectedModelType === 'image' ? '图片' : '视频'}`}
            </button>
          </div>
        </div>
      </div>

      {/* "+"按钮 - 添加到聊天 */}
      {showAddButton && (
        <div 
          className="fixed z-50"
          style={{ 
            left: `${addButtonPosition.left}px`, 
            top: `${addButtonPosition.top}px`
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div 
            className="flex items-center bg-green-500 hover:bg-green-600 rounded-lg transition-colors shadow-lg"
            style={{ 
              padding: `${4 * canvasScale}px`,
              transform: `scale(${canvasScale})`,
              transformOrigin: 'center'
            }}
          >
            <button
              onClick={handleAddToChat}
              disabled={isGenerating}
              className="text-white rounded flex items-center justify-center font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                width: `${24 * canvasScale}px`,
                height: `${24 * canvasScale}px`,
                fontSize: `${14 * canvasScale}px`
              }}
              title="添加到聊天"
            >
              +
            </button>
          </div>
          
          {/* 提示信息 */}
          {showTooltip && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-gray-800 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap">
              添加到聊天
            </div>
          )}
        </div>
      )}
    </>
  )
}