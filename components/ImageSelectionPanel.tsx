'use client'

import React, { useState, useEffect } from 'react'
import { ModelService } from '@/services/ai-models'

interface ImageSelectionPanelProps {
  selectedImage: any
  canvas: any
  onAddToChat: (imageObject: any) => void
  onGenerateFromImage: (imageObject: any, prompt: string, model: string, aspectRatio: string) => void
  onClearSelection: () => void
}

const ImageSelectionPanel: React.FC<ImageSelectionPanelProps> = ({
  selectedImage,
  canvas,
  onAddToChat,
  onGenerateFromImage,
  onClearSelection
}) => {
  const [addButtonPosition, setAddButtonPosition] = useState({ left: 0, top: 0 })
  const [panelPosition, setPanelPosition] = useState({ left: 0, top: 0 })
  const [showAddButton, setShowAddButton] = useState(true)
  const [showTooltip, setShowTooltip] = useState(false)
  const [canvasScale, setCanvasScale] = useState(1)
  const [isMultipleSelection, setIsMultipleSelection] = useState(false)
  const [selectedModelType, setSelectedModelType] = useState<'image'>('image')
  const [selectedImageModel, setSelectedImageModel] = useState('nano-banana')
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('16:9')
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [showAspectDropdown, setShowAspectDropdown] = useState(false)
  const [showRatioDropdown, setShowRatioDropdown] = useState(false)

  const [customPrompt, setCustomPrompt] = useState('')
  const [textareaHeight, setTextareaHeight] = useState('32px')

  // 监听输入内容变化，自动调整textarea高度
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const lineCount = customPrompt.split('\n').length
    const baseHeight = 32
    const lineHeight = 20
    const maxHeight = 80
    
    let newHeight = baseHeight + (lineCount - 1) * lineHeight
    newHeight = Math.min(Math.max(newHeight, baseHeight), maxHeight)
    
    setTextareaHeight(`${newHeight}px`)
  }, [customPrompt])

  // 监听ESC键取消选择
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedImage) {
        event.preventDefault()
        event.stopPropagation()
        onClearSelection()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [selectedImage, onClearSelection])

  // 检测是否为多选状态 - 修复版本
  useEffect(() => {
    if (!canvas || !selectedImage) return
    
    const checkMultipleSelection = () => {
      try {
        const activeObjects = canvas.getActiveObjects()
        const isMultiple = activeObjects && activeObjects.length > 1
        
        // 如果是多选，立即隐藏按钮并设置多选状态
        if (isMultiple) {
          setIsMultipleSelection(true)
          setShowAddButton(false)
        } else {
          setIsMultipleSelection(false)
          setShowAddButton(true)
        }
      } catch (error) {
      }
    }
    
    // 初始检测
    checkMultipleSelection()
    
    // 监听选中变化 - 直接调用，不使用防抖
    const handleSelectionCreated = () => {
      checkMultipleSelection()
    }
    
    const handleSelectionCleared = () => {
      checkMultipleSelection()
    }
    
    const handleSelectionUpdated = () => {
      checkMultipleSelection()
    }
    
    // 监听对象移动和缩放
    const handleObjectMoving = () => {
      checkMultipleSelection()
    }
    
    const handleObjectScaling = () => {
      checkMultipleSelection()
    }
    
    canvas.on('selection:created', handleSelectionCreated)
    canvas.on('selection:cleared', handleSelectionCleared)
    canvas.on('selection:updated', handleSelectionUpdated)
    canvas.on('object:moving', handleObjectMoving)
    canvas.on('object:scaling', handleObjectScaling)
    
    return () => {
      canvas.off('selection:created', handleSelectionCreated)
      canvas.off('selection:cleared', handleSelectionCleared)
      canvas.off('selection:updated', handleSelectionUpdated)
      canvas.off('object:moving', handleObjectMoving)
      canvas.off('object:scaling', handleObjectScaling)
    }
  }, [canvas, selectedImage])

  // 监听画板缩放和图片移动变化，实时更新按钮位置 - 最终简化版本
  useEffect(() => {
    if (typeof window === 'undefined' || !selectedImage || !canvas) return
    
    let updateTimeout: NodeJS.Timeout
    
    const updateButtonPosition = () => {
      try {
        // 检测多选状态 - 如果多选，立即隐藏按钮并返回
        const activeObjects = canvas.getActiveObjects()
        const isMultiple = activeObjects && activeObjects.length > 1
        
        if (isMultiple) {
          setShowAddButton(false)
          return
        }
        
        // 更新画板缩放
        const scaleElement = document.querySelector('[data-canvas-scale]')
        const scale = scaleElement ? parseFloat(scaleElement.getAttribute('data-canvas-scale') || '1') : 1
        
        if (Math.abs(scale - canvasScale) > 0.01) {
          setCanvasScale(scale)
        }
        
        // 计算按钮位置
        const position = getImagePosition()
        const baseButtonSize = 24
        const buttonSize = baseButtonSize * scale
        const offset = 4 * scale
        
        const buttonLeft = position.x + position.width - buttonSize - offset
        const buttonTop = position.y + position.height - buttonSize - offset
        
        const maxLeft = window.innerWidth - buttonSize - 10
        const maxTop = window.innerHeight - buttonSize - 10
        const finalLeft = Math.max(10, Math.min(buttonLeft, maxLeft))
        const finalTop = Math.max(10, Math.min(buttonTop, maxTop))
        
        // 只有当位置变化较大时才更新状态
        const positionChanged = 
          Math.abs(finalLeft - addButtonPosition.left) > 10 || 
          Math.abs(finalTop - addButtonPosition.top) > 10
        
        if (positionChanged) {
          setAddButtonPosition({ left: finalLeft, top: finalTop })
        }
      } catch (error) {
      }
    }
    
    // 使用防抖的事件监听器
    const debouncedUpdate = () => {
      clearTimeout(updateTimeout)
      updateTimeout = setTimeout(updateButtonPosition, 300) // 更长的防抖时间
    }
    
    // 监听画板缩放变化
    const handleCanvasScaleChange = () => {
      debouncedUpdate()
    }
    
    window.addEventListener('canvasScaleChange', handleCanvasScaleChange)
    
    // 监听图片移动和缩放事件
    const handleObjectMoving = () => {
      debouncedUpdate()
    }
    
    const handleObjectScaling = () => {
      debouncedUpdate()
    }
    
    // 添加事件监听器
    canvas.on('object:moving', handleObjectMoving)
    canvas.on('object:scaling', handleObjectScaling)
    canvas.on('object:rotating', handleObjectMoving)
    
    // 初始更新
    updateButtonPosition()
    
    return () => {
      window.removeEventListener('canvasScaleChange', handleCanvasScaleChange)
      canvas.off('object:moving', handleObjectMoving)
      canvas.off('object:scaling', handleObjectScaling)
      canvas.off('object:rotating', handleObjectMoving)
      clearTimeout(updateTimeout)
    }
  }, [selectedImage, canvas, canvasScale, addButtonPosition])

  // 获取图片在画布上的位置和尺寸
  const getImagePosition = () => {
    if (!selectedImage || !canvas) return { x: 0, y: 0, width: 0, height: 0 }
    
    const zoom = canvas.getZoom()
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0]
    
    const left = (selectedImage.left || 0) * zoom + vpt[4]
    const top = (selectedImage.top || 0) * zoom + vpt[5]
    const width = (selectedImage.width || 0) * selectedImage.scaleX * zoom
    const height = (selectedImage.height || 0) * selectedImage.scaleY * zoom
    
    return {
      x: left,
      y: top,
      width,
      height
    }
  }

  // 面板位置计算（基于按钮位置）
  useEffect(() => {
    if (!selectedImage || !canvas) return
    
    const panelWidth = 250 * canvasScale
    const panelHeight = 80 * canvasScale
    const buttonSize = 24 * canvasScale
    
    let panelLeft = addButtonPosition.left + buttonSize - panelWidth
    let panelTop = addButtonPosition.top + buttonSize + 10
    
    const screenCenterX = window.innerWidth / 2
    const isButtonOnRightSide = addButtonPosition.left > screenCenterX
    
    if (isButtonOnRightSide) {
      panelLeft = addButtonPosition.left + buttonSize - panelWidth
      if (panelLeft < 10) {
        panelLeft = addButtonPosition.left
      }
    } else {
      panelLeft = addButtonPosition.left
      if (panelLeft + panelWidth > window.innerWidth - 10) {
        panelLeft = addButtonPosition.left + buttonSize - panelWidth
      }
    }
    
    // 检查面板是否超出屏幕底部
    if (panelTop + panelHeight > window.innerHeight - 10) {
      panelTop = addButtonPosition.top - panelHeight - 10
    }
    
    // 确保面板不会超出屏幕顶部
    if (panelTop < 10) {
      panelTop = addButtonPosition.top + buttonSize + 10
    }
    
    setPanelPosition({ left: panelLeft, top: panelTop })
  }, [addButtonPosition, canvasScale])



  if (!selectedImage || !canvas || isMultipleSelection) return null
  
  // 检测是否为视频对象 - 如果是视频，不显示任何面板
  const isVideoObject = 
    selectedImage.type === 'image' && 
    selectedImage._element && 
    selectedImage._element.tagName === 'VIDEO'
  
    // 检测是否为火柴人关节 - 如果是火柴人关节，不显示任何面板
    const isStickFigureJoint = selectedImage.isStickFigureJoint
    
    if (isVideoObject || isStickFigureJoint) return null
  
  // 在渲染时重新计算position
  const currentPosition = getImagePosition()
  
  if (currentPosition.x + currentPosition.width < 0 || currentPosition.x > window.innerWidth ||
      currentPosition.y + currentPosition.height < 0 || currentPosition.y > window.innerHeight) {
    return null
  }

  // 处理添加到聊天功能
  const handleAddToChat = async () => {
    if (!selectedImage) return
    
    try {
      onAddToChat(selectedImage)
      
      const notification = document.createElement('div')
      notification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
          图片已添加到聊天
        </div>
      `
      document.body.appendChild(notification)
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 2000)
    } catch (error) {
    } finally {
      // 不隐藏按钮，让用户可以继续操作
      // setShowAddButton(false)
      onClearSelection()
    }
  }

  return (
    <>
      {/* "+"按钮 - 添加到聊天（与框选效果完全一致） */}
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
              className="text-white rounded flex items-center justify-center font-semibold transition-colors"
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

      {/* 主面板 - 扩展功能（与框选效果完全一致） */}
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

          {/* 2. 模型选择 */}
          <div className="relative">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setShowAspectDropdown(!showAspectDropdown)}
                className="flex items-center space-x-1 p-1 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <span>
                  {ModelService.getModelInfo(selectedImageModel)?.name || selectedImageModel}
                </span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {showAspectDropdown && (
              <div className="absolute bottom-full left-0 mb-1 w-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                <div className="p-1">
                  <button
                    onClick={() => {
                      setSelectedImageModel('seedream-4')
                      setShowAspectDropdown(false)
                    }}
                    className={`w-full text-left px-2 py-1 text-xs rounded ${
                      selectedImageModel === 'seedream-4' 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Seedream-4
                  </button>
                  <button
                    onClick={() => {
                      setSelectedImageModel('nano-banana')
                      setShowAspectDropdown(false)
                    }}
                    className={`w-full text-left px-2 py-1 text-xs rounded ${
                      selectedImageModel === 'nano-banana' 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Nano-Banana
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. 比例选择 - 仅对图片模型显示 */}
          {selectedModelType === 'image' && (
            <div className="relative">
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setShowRatioDropdown(!showRatioDropdown)}
                  className="flex items-center space-x-1 p-1 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <span>{selectedAspectRatio}</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {showRatioDropdown && (
                <div className="absolute bottom-full left-0 mb-1 w-16 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                  <div className="p-1">
                    {(selectedModelType === 'image' ? ['1:1', '16:9', '9:16', '4:3', '3:4'] : ['16:9', '9:16']).map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => {
                          setSelectedAspectRatio(ratio)
                          setShowRatioDropdown(false)
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
                  </div>
                </div>
              )}
            </div>
          )}



          {/* 4. 输入框 */}
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => {
              const key = e.key.toLowerCase()
              if ((e.ctrlKey || e.metaKey) && ['a', 'x', 'v', 'z', 'y'].includes(key)) {
                return
              }
              if (['delete', 'backspace', 'enter', 'escape', 'tab'].includes(key)) {
                return
              }
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault()
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
              onClick={() => {
                if (!selectedImage) return
                
                const prompt = customPrompt.trim() 
                  ? customPrompt
                  : `基于此图片生成${selectedModelType === 'image' ? '图片' : '视频'}`
                const model = selectedModelType === 'image' ? selectedImageModel : selectedImageModel
                const aspectRatio = selectedAspectRatio
                
                // 生成任务会在canvas/page.tsx的handleGenerateFromImage函数中记录到聊天记录
                // 这里不再重复记录，避免参数重复显示
                
                if (selectedModelType === 'image') {
                  onGenerateFromImage(selectedImage, prompt, model, aspectRatio)
                } else {
                  // 视频生成：调用画布页面的视频生成功能
                  if (typeof window !== 'undefined' && (window as any).fabricCanvas) {
                    // 计算视频生成位置（在选中图片右侧）
                    const videoPosition = {
                      x: (selectedImage.left || 0) + (selectedImage.width || 0) * (selectedImage.scaleX || 1) + 20,
                      y: selectedImage.top || 0
                    }
                    
                    // 获取图片数据作为输入
                    const imageData = selectedImage._element?.src || selectedImage.src
                    
                    // 调用画布页面的视频生成函数
                    if (typeof window !== 'undefined' && (window as any).handleGenerateVideo) {
                      console.log('调用视频生成函数:', { prompt, model, videoPosition, imageData, aspectRatio })
                      try {
                        (window as any).handleGenerateVideo(prompt, model, videoPosition, imageData, aspectRatio, 10)
                      } catch (error) {
                        console.error('视频生成函数调用失败:', error)
                        // 显示错误提示
                        const errorNotification = document.createElement('div')
                        errorNotification.innerHTML = `
                          <div style="position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
                            视频生成失败: ${error.message}
                          </div>
                        `
                        document.body.appendChild(errorNotification)
                        
                        setTimeout(() => {
                          if (document.body.contains(errorNotification)) {
                            document.body.removeChild(errorNotification)
                          }
                        }, 3000)
                      }
                    } else {
                      console.error('handleGenerateVideo函数未找到')
                      // 显示错误提示
                      const errorNotification = document.createElement('div')
                      errorNotification.innerHTML = `
                        <div style="position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
                          视频生成功能未初始化，请刷新页面重试
                        </div>
                      `
                      document.body.appendChild(errorNotification)
                      
                      setTimeout(() => {
                        if (document.body.contains(errorNotification)) {
                          document.body.removeChild(errorNotification)
                        }
                      }, 3000)
                    }
                  }
                }
                
                setCustomPrompt('')
                onClearSelection()
              }}
              className="text-white px-1.5 py-0.5 rounded text-xs font-medium transition-colors whitespace-nowrap"
            >
              生成{selectedModelType === 'image' ? '图片' : '视频'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ImageSelectionPanel