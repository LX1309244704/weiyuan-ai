'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
 // 动态导入 fabric 于客户端（避免 SSR 环境下 undefined）
import CanvasToolbar from '../../components/CanvasToolbar'
import SelectionPanel from '../../components/SelectionPanel'
import ImageSelectionPanel from '../../components/ImageSelectionPanel'
import ChatPanel from '../../components/ChatPanel'
import ShapePropertiesPanel from '../../components/ShapePropertiesPanel'
import BrushPropertiesPanel from '../../components/BrushPropertiesPanel'
import { loadImageWithCors } from '../../utils/corsProxy'
import TextPropertiesPanel from '../../components/TextPropertiesPanel'
import { useUserStore } from '@/stores/userStore'
import { ModelService } from '@/services/ai-models'
import { ApiKeyCache } from '@/utils/apiKeyCache'

// 导入JSON数据
import canvasData from '@/data/canvas.json'

type SelectionData = {
  rect: any
  mousePosition: { x: number; y: number }
  screenPosition: { x: number; y: number }
}

export default function CanvasPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [fabricCanvas, setFabricCanvas] = useState<any | null>(null)
  const [selectedArea, setSelectedArea] = useState<SelectionData | null>(null)
  const [selectedImage, setSelectedImage] = useState<any>(null)
  const chatPanelRef = useRef<{ 
    handleReceiveScreenshot: (imageData: string, prompt: string) => void
    logGenerateImageTask: (prompt: string, model: string, aspectRatio: string, imageData?: string) => void
    logGenerateImageResult: (imageUrl: string, prompt: string) => void
    logGenerateVideoTask: (prompt: string, model: string, duration: string, aspectRatio: string, imageData?: string) => void
    logGenerateVideoResult: (videoUrl: string, prompt: string) => void
    setSelectedModel: (model: string) => void
  } | null>(null)
  const fabricNSRef = useRef<any>(null)
  const { theme } = useUserStore()
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 })
  const [brushSize, setBrushSize] = useState(3)
  const [brushColor, setBrushColor] = useState('#000000')

  // 初始化 Fabric 画布
  useEffect(() => {
    let disposed = false
    let handleResize: ((this: Window, ev: UIEvent) => any) | null = null
    let canvasInstance: any = null

    ;(async () => {
      try {
        const mod: any = await import('fabric')
        const f = mod?.fabric || mod
        // 将命名空间挂到 window，便于其它组件（已移除静态导入）直接使用 window.fabric
        if (typeof window !== 'undefined') {
          ;(window as any).fabric = f
        }
        fabricNSRef.current = f
        if (!canvasRef.current || disposed) return

        const c = new f.Canvas(canvasRef.current, {
          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
          selection: true,
          preserveObjectStacking: true
        })

        // 禁用默认的鼠标滚轮缩放功能
        c.on('mouse:wheel', (opt: any) => {
          const delta = opt.e.deltaY
          
          // 只在按住Ctrl键时启用缩放功能
          if (opt.e.ctrlKey) {
            // 阻止默认行为
            opt.e.preventDefault()
            opt.e.stopPropagation()
            
            let zoom = c.getZoom()
            zoom *= 0.999 ** delta
            if (zoom > 20) zoom = 20
            if (zoom < 0.01) zoom = 0.01
            
            c.zoomToPoint(new f.Point(opt.e.offsetX, opt.e.offsetY), zoom)
          }
          // 如果不按住Ctrl键，允许正常的页面滚动
        })

        // 画板铺满整个屏幕
        c.setWidth(window.innerWidth)
        c.setHeight(window.innerHeight)

        c.isDrawingMode = true
        c.freeDrawingBrush = new f.PencilBrush(c)
        c.freeDrawingBrush.width = 3
        c.freeDrawingBrush.color = '#000000'

        // 为每个添加的对象自动生成唯一ID
        c.on('object:added', (e: any) => {
          const obj = e.target
          if (obj && !obj.id) {
            obj.id = `obj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }
        })

        setFabricCanvas(c)
        canvasInstance = c
        
        // 将canvas对象挂载到window，便于其他组件访问
        if (typeof window !== 'undefined') {
          ;(window as any).fabricCanvas = c
        }

        handleResize = () => {
          c.setWidth(window.innerWidth)
          c.setHeight(window.innerHeight)
          c.renderAll()
        }
        window.addEventListener('resize', handleResize)
      } catch (err) {
        // Failed to initialize fabric
      }
    })()

    return () => {
      disposed = true
      if (handleResize) {
        window.removeEventListener('resize', handleResize)
      }
      if (canvasInstance) {
        try {
          canvasInstance.dispose()
        } catch {}
      }
    }
  }, [])

  // 监听主题变化，更新画布背景色
  useEffect(() => {
    if (!fabricCanvas) return
    
    const backgroundColor = theme === 'dark' ? '#1f2937' : '#ffffff'
    // 使用更兼容的方式设置背景色
    fabricCanvas.backgroundColor = backgroundColor
    fabricCanvas.renderAll()
  }, [theme, fabricCanvas])

  // 区域选择（矩形拖拽）与截图捕获
  useEffect(() => {
    if (!fabricCanvas) return

    let isSelecting = false
    let startX = 0
    let startY = 0
    let selectionRect: any | null = null

    const onMouseDown = (opt: any) => {
      const evt = opt.e as MouseEvent
      // 仅在按住 Shift 时进行矩形选择，避免与其他工具冲突
      if (!evt.shiftKey) return

      isSelecting = true
      const pointer = fabricCanvas.getPointer(evt)
      
      // 使用原始虚拟坐标（不进行缩放转换）
      startX = pointer.x
      startY = pointer.y

      const F = fabricNSRef.current
      selectionRect = new F.Rect({
        left: startX,
        top: startY,
        width: 0,
        height: 0,
        fill: 'rgba(59,130,246,0.08)',
        stroke: '#3b82f6',
        strokeWidth: 1,
        selectable: false,
        evented: false
      })
      fabricCanvas.add(selectionRect)
    }

    const onMouseMove = (opt: any) => {
      if (!isSelecting || !selectionRect) return
      const evt = opt.e as MouseEvent
      const pointer = fabricCanvas.getPointer(evt)
      
      // 使用原始虚拟坐标（不进行缩放转换）
      const currentX = pointer.x
      const currentY = pointer.y
      
      const width = currentX - startX
      const height = currentY - startY

      // 确保框选矩形的坐标计算正确
      const newLeft = width < 0 ? currentX : startX
      const newTop = height < 0 ? currentY : startY
      const newWidth = Math.abs(width)
      const newHeight = Math.abs(height)



      selectionRect.set({
        width: newWidth,
        height: newHeight,
        left: newLeft,
        top: newTop
      })
      fabricCanvas.renderAll()
    }

    const onMouseUp = (opt: any) => {
      if (!isSelecting || !selectionRect) return
      const evt = opt.e as MouseEvent
      isSelecting = false

      // 记录屏幕坐标用于 SelectionPanel 定位
      const screenPosition = { x: evt.clientX, y: evt.clientY }
      const mousePosition = { x: selectionRect.left || 0, y: selectionRect.top || 0 }

      setSelectedArea({
        rect: selectionRect,
        mousePosition,
        screenPosition
      })

      // 保留矩形用于参考；若不需要可在此处移除
      // fabricCanvas.remove(selectionRect); selectionRect = null
    }

    fabricCanvas.on('mouse:down', onMouseDown)
    fabricCanvas.on('mouse:move', onMouseMove)
    fabricCanvas.on('mouse:up', onMouseUp)

    return () => {
      fabricCanvas.off('mouse:down', onMouseDown)
      fabricCanvas.off('mouse:move', onMouseMove)
      fabricCanvas.off('mouse:up', onMouseUp)
    }
  }, [fabricCanvas])

  // 从所选区域截图到 base64（高质量）
  const handleCaptureArea = async (): Promise<string | null> => {
    if (!fabricCanvas || !selectedArea) return null
    const rect = selectedArea.rect

    // 获取当前缩放状态
    const originalZoom = fabricCanvas.getZoom()
    const originalVpt = [...(fabricCanvas.viewportTransform || [1, 0, 0, 1, 0, 0])]
    


    // 关键修复：临时重置缩放为1:1进行截图
    try {
      // 保存当前状态
      fabricCanvas.viewportTransform = [1, 0, 0, 1, 0, 0]
      fabricCanvas.setZoom(1)
      fabricCanvas.renderAll()

      // 使用框选矩形的原始坐标（现在缩放为1:1，坐标就是实际坐标）
      const left = rect.left ?? 0
      const top = rect.top ?? 0
      const width = rect.width ?? 0
      const height = rect.height ?? 0



      if (width <= 2 || height <= 2) return null

      // 使用 toDataURLWithMultiplier 提升质量
      const dataUrl = fabricCanvas.toDataURL({
        format: 'png',
        quality: 1.0,
        left,
        top,
        width,
        height,
        multiplier: 2
      } as any)

      return dataUrl
    } finally {
      // 恢复原始缩放状态
      fabricCanvas.viewportTransform = originalVpt
      fabricCanvas.setZoom(originalZoom)
      fabricCanvas.renderAll()
    }
  }

  // 供 SelectionPanel 将截图传给 ChatPanel 的桥接
  const handleReceiveScreenshot = (imageData: string, prompt: string) => {
    chatPanelRef.current?.handleReceiveScreenshot(imageData, prompt)
  }

  // 检查ChatPanel组件是否正常加载，并将ref暴露给全局window对象
  useEffect(() => {
    // 将ChatPanel的ref暴露给全局window对象，便于SelectionPanel调用
    if (chatPanelRef.current) {
      (window as any).chatPanelRef = chatPanelRef.current
    }
    
    // 直接定义全局视频生成函数
    (window as any).handleGenerateVideo = async (prompt: string, model: string, position: { x: number; y: number }, screenshotData?: string, aspectRatio?: string, duration?: string) => {
      console.log('handleGenerateVideo被调用:', { prompt, model, position, aspectRatio, duration, screenshotData: screenshotData ? '有截图数据' : '无截图数据' })
      
      if (!fabricCanvas) {
        throw new Error('画布未初始化')
      }
      
      // URL转Base64辅助函数
      const urlToBase64 = async (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          
          img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            canvas.width = img.width
            canvas.height = img.height
            
            if (ctx) {
              ctx.drawImage(img, 0, 0)
              const dataURL = canvas.toDataURL('image/png')
              resolve(dataURL)
            } else {
              reject(new Error('无法获取Canvas上下文'))
            }
          }
          
          img.onerror = () => {
            reject(new Error('图片加载失败'))
          }
          
          img.src = url
        })
      }
      
      // 定义内部函数，避免依赖问题
      const getApiKeyForModel = (model: string): string => {
        return ApiKeyCache.getApiKey()
      }
      
      const addLoadingVideoPlaceholder = async (position: { x: number; y: number }): Promise<any> => {
        return new Promise((resolve, reject) => {
          if (!fabricCanvas) {
            reject(new Error('画布未初始化'))
            return
          }
          
          // 创建一个视频加载占位符SVG
          const svgContent = `
            <svg width="200" height="150" viewBox="0 0 100 75" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="75" fill="#1f2937" rx="8" ry="8"/>
              <circle cx="50" cy="37.5" r="15" fill="#3b82f6" opacity="0.8">
                <animate attributeName="r" values="15;20;15" dur="1.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.8;0.4;0.8" dur="1.5s" repeatCount="indefinite"/>
              </circle>
              <polygon points="45,35 45,40 50,37.5" fill="white"/>
              <text x="50" y="65" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="8">视频生成中...</text>
            </svg>
          `
          
          // 将SVG转换为DataURL
          const svgDataURL = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgContent)))
          
          // 创建图片元素
          const img = new Image()
          img.crossOrigin = 'anonymous'
          
          img.onload = () => {
            try {
              // 创建Fabric图片对象
              const fabricImg = new (window as any).fabric.Image(img, {
                left: position.x,
                top: position.y,
                selectable: false, // 加载中视频不可选中
                hasControls: false,
                lockMovementX: true,
                lockMovementY: true,
                lockRotation: true,
                lockScalingX: true,
                lockScalingY: true,
                opacity: 0.9
              })
              
              // 设置合适的尺寸
              const width = 200
              const height = 150
              const scaleX = width / img.width
              const scaleY = height / img.height
              fabricImg.scaleX = scaleX
              fabricImg.scaleY = scaleY
              
              // 添加到画布
              fabricCanvas.add(fabricImg)
              fabricCanvas.renderAll()
              
              resolve(fabricImg)
              
            } catch (error) {
              reject(error)
            }
          }
          
          img.onerror = (error) => {
            reject(new Error('视频加载中占位图片加载失败'))
          }
          
          img.src = svgDataURL
        })
      }
      
      const replaceLoadingWithActualVideo = async (loadingVideo: any, actualVideoUrl: string): Promise<any> => {
        return new Promise((resolve, reject) => {
          if (!fabricCanvas || !loadingVideo) {
            reject(new Error('画布或加载中视频未初始化'))
            return
          }
          
          // 获取加载中视频的位置和尺寸
          const position = {
            x: loadingVideo.left || 0,
            y: loadingVideo.top || 0
          }
          const width = (loadingVideo.width || 200) * (loadingVideo.scaleX || 1)
          const height = (loadingVideo.height || 150) * (loadingVideo.scaleY || 1)
          
          // 移除加载中视频
          fabricCanvas.remove(loadingVideo)
          
          // 创建视频元素
          const videoElement = document.createElement('video')
          videoElement.src = actualVideoUrl
          videoElement.crossOrigin = 'anonymous'
          videoElement.controls = true
          videoElement.style.width = '200px'
          videoElement.style.height = '150px'
          videoElement.style.borderRadius = '8px'
          
          // 创建Fabric视频对象
          const fabricVideo = new (window as any).fabric.Image(videoElement, {
            left: position.x,
            top: position.y,
            selectable: true,
            hasControls: true,
            cornerStyle: 'circle',
            transparentCorners: false,
            cornerColor: '#3b82f6',
            cornerSize: 12,
            rotatingPointOffset: 40
          })
          
          // 设置合适的尺寸
          fabricVideo.scaleX = width / 200
          fabricVideo.scaleY = height / 150
          
          // 添加到画布
          fabricCanvas.add(fabricVideo)
          fabricCanvas.setActiveObject(fabricVideo)
          fabricCanvas.renderAll()
          
          // 开始播放视频
          videoElement.play().catch(() => {
            // 自动播放可能被阻止，这是正常的
          })
          
          resolve(fabricVideo)
        })
      }
      
      try {
        if (!fabricCanvas) return
        
        // 显示生成中提示
        const notification = document.createElement('div')
        notification.innerHTML = `
          <div style="position: fixed; top: 20px; right: 20px; background: #3b82f6; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
            正在生成视频...
          </div>
        `
        document.body.appendChild(notification)
        
        // 准备请求参数
        const request: any = {
          model: model as any,
          prompt: prompt,
          key: getApiKeyForModel(model), // 后端期望的参数名是key，不是apiKey
          duration: duration || (model === 'sora2' ? '10s' : '8s'), // 使用传入的时长或默认值
          aspectRatio: aspectRatio || '16:9' // 使用传入的比例或默认16:9
        }
        
        // 如果有截图数据，添加到请求参数中作为参考图片
        if (screenshotData) {
          // 检查图片数据格式，如果是URL需要转换为Base64
          if (screenshotData.startsWith('http')) {
            try {
              // 将URL转换为Base64
              const base64Data = await urlToBase64(screenshotData)
              request.images = [base64Data]
            } catch (error) {
              console.warn('URL转Base64失败，使用原始数据:', error)
              request.images = [screenshotData]
            }
          } else {
            request.images = [screenshotData]
          }
        }
        
        // 先创建任务，确保没有错误后再添加占位视频
        const response = await fetch('/api/generate-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '视频生成任务创建失败');
        }
        
        const createResult = await response.json();
        const taskId = createResult.taskId;
        
        // 记录视频生成任务到聊天记录
        if (typeof window !== 'undefined' && (window as any).chatPanelRef) {
          const chatPanel = (window as any).chatPanelRef
          if (chatPanel.logGenerateVideoTask) {
            chatPanel.logGenerateVideoTask(prompt, model, request.duration, request.aspectRatio, screenshotData)
          }
        }
        
        // 只有在任务创建成功后才添加加载中的占位视频
        const loadingVideo = await addLoadingVideoPlaceholder(position)
        
        // 轮询任务状态（最多轮询120次，每次间隔5秒，总共10分钟）
        let pollResult = null
        let pollCount = 0
        const maxPollCount = 120
        
        while (pollCount < maxPollCount) {
          // 查询任务状态
          const statusResponse = await fetch(`/api/generate-video?taskId=${taskId}&model=${model}&key=${request.key}`);
          
          if (!statusResponse.ok) {
            const errorData = await statusResponse.json();
            throw new Error(errorData.error || '查询视频状态失败');
          }
          
          const statusResult = await statusResponse.json();
          pollResult = statusResult.data;
          
          // 检查任务状态 - 确保状态为成功且视频链接存在
          if (pollResult.status === '2' && pollResult.videoUrl && pollResult.videoUrl.trim() !== '') {
            // 生成成功，停止轮询
            break
          } else if (pollResult.status === '3') {
            // 生成失败，停止轮询
            break
          }
          
          pollCount++
          
          // 如果已经达到最大轮询次数，强制停止轮询
          if (pollCount >= maxPollCount) {
            break
          }
          
          // 等待5秒后继续轮询
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
        
        // 移除生成中提示
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
        
        // 检查是否为视频生成结果 - 确保状态为成功且视频链接存在
        if (pollResult && pollResult.status === '2' && pollResult.videoUrl && pollResult.videoUrl.trim() !== '') {
          // 生成成功，替换加载中的占位视频为实际视频
          await replaceLoadingWithActualVideo(loadingVideo, pollResult.videoUrl)
          
          // 显示成功提示
          const successNotification = document.createElement('div')
          successNotification.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
              视频生成成功！
            </div>
          `
          document.body.appendChild(successNotification)
          
          setTimeout(() => {
            if (document.body.contains(successNotification)) {
              document.body.removeChild(successNotification)
            }
          }, 2000)
          
        } else {
          // 生成失败或超时，移除加载中的占位视频
          if (loadingVideo && fabricCanvas) {
            fabricCanvas.remove(loadingVideo)
            fabricCanvas.renderAll()
          }
          
          // 显示失败提示
          const errorMessage = pollResult && pollResult.error 
            ? pollResult.error 
            : pollCount >= maxPollCount 
              ? '视频生成超时，请稍后重试' 
              : '视频生成失败'
              
          const errorNotification = document.createElement('div')
          errorNotification.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
              视频生成失败: ${errorMessage}
            </div>
          `
          document.body.appendChild(errorNotification)
          
          setTimeout(() => {
            if (document.body.contains(errorNotification)) {
              document.body.removeChild(errorNotification)
            }
          }, 3000)
        }
        
      } catch (error: any) {
        // 移除所有可能的生成中提示
        const notifications = document.querySelectorAll('div[style*="正在生成视频"], div[style*="background: #3b82f6"]')
        notifications.forEach(notification => {
          if (notification && notification.parentNode) {
            notification.parentNode.removeChild(notification)
          }
        })
        
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
    }
    
    return () => {
      // 清理时移除全局函数
      delete (window as any).chatPanelRef
      delete (window as any).handleGenerateVideo
    }
  }, [fabricCanvas]) // 依赖fabricCanvas

  // 监听画布对象选中事件（图片选中）- 修复版本
  useEffect(() => {
    if (!fabricCanvas) return

    let currentSelectedImage: any = null

    const handleSelectionCreated = (options: any) => {
      const selectedObject = options.target
      if (selectedObject) {
        // 检测是否为多选
        const activeObjects = fabricCanvas.getActiveObjects()
        const isMultipleSelection = activeObjects && activeObjects.length > 1
        
        // 如果是多选，清除图片选中状态
        if (isMultipleSelection) {
          currentSelectedImage = null
          setSelectedImage(null)
          return
        }
        
        // 更准确的图片对象检测
        const isImageObject = 
          selectedObject.type === 'image' || 
          (selectedObject._element && selectedObject._element.tagName === 'IMG') ||
          (selectedObject.src && typeof selectedObject.src === 'string') ||
          (selectedObject._originalElement && selectedObject._originalElement.tagName === 'IMG') ||
          (selectedObject.toDataURL && typeof selectedObject.toDataURL === 'function')
        
        if (isImageObject) {
          currentSelectedImage = selectedObject
          setSelectedImage(selectedObject)
        } else {
          currentSelectedImage = null
          setSelectedImage(null)
        }
      }
    }

    const handleSelectionCleared = () => {
      currentSelectedImage = null
      setSelectedImage(null)
    }

    const handleSelectionUpdated = (options: any) => {
      // 检测多选状态变化
      const activeObjects = fabricCanvas.getActiveObjects()
      const isMultipleSelection = activeObjects && activeObjects.length > 1
      
      if (isMultipleSelection) {
        currentSelectedImage = null
        setSelectedImage(null)
      } else {
        // 如果是单选，检查是否是图片对象
        const selectedObject = fabricCanvas.getActiveObject()
        if (selectedObject) {
          const isImageObject = 
            selectedObject.type === 'image' || 
            (selectedObject._element && selectedObject._element.tagName === 'IMG') ||
            (selectedObject.src && typeof selectedObject.src === 'string') ||
            (selectedObject._originalElement && selectedObject._originalElement.tagName === 'IMG') ||
            (selectedObject.toDataURL && typeof selectedObject.toDataURL === 'function')
          
          if (isImageObject) {
            currentSelectedImage = selectedObject
            setSelectedImage(selectedObject)
          }
        }
      }
    }

    const handleMouseDown = (options: any) => {
      // 点击画布空白区域时清除选中
      if (!options.target) {
        currentSelectedImage = null
        setSelectedImage(null)
      }
    }

    // 添加对象添加事件监听，确保新上传的图片也能被检测到
    const handleObjectAdded = (options: any) => {
      const addedObject = options.target
      // 图片对象被添加到画布
    }

    // 添加鼠标点击事件，确保点击图片时能正确选中
    const handleMouseUp = (options: any) => {
      if (options.target) {
        // 如果是图片对象，确保选中状态正确
        if (options.target.type === 'image') {
          // 延迟一小段时间确保选中状态已经更新
          setTimeout(() => {
            const activeObjects = fabricCanvas.getActiveObjects()
            const isMultipleSelection = activeObjects && activeObjects.length > 1
            
            if (!isMultipleSelection) {
              currentSelectedImage = options.target
              setSelectedImage(options.target)
            }
          }, 50)
        }
      }
    }

    fabricCanvas.on('selection:created', handleSelectionCreated)
    fabricCanvas.on('selection:cleared', handleSelectionCleared)
    fabricCanvas.on('selection:updated', handleSelectionUpdated)
    fabricCanvas.on('mouse:down', handleMouseDown)
    fabricCanvas.on('mouse:up', handleMouseUp)
    fabricCanvas.on('object:added', handleObjectAdded)

    return () => {
      fabricCanvas.off('selection:created', handleSelectionCreated)
      fabricCanvas.off('selection:cleared', handleSelectionCleared)
      fabricCanvas.off('selection:updated', handleSelectionUpdated)
      fabricCanvas.off('mouse:down', handleMouseDown)
      fabricCanvas.off('mouse:up', handleMouseUp)
      fabricCanvas.off('object:added', handleObjectAdded)
    }
  }, [fabricCanvas])

  // 监听切换到箭头工具的自定义事件
  useEffect(() => {
    const handleSwitchToArrowTool = (event: CustomEvent) => {
      // 切换到箭头（选择）工具 - 通过设置画布状态
      if (fabricCanvas) {
        fabricCanvas.isDrawingMode = false
        fabricCanvas.selection = true
        
        // 更新CanvasToolbar的UI状态 - 通过设置全局状态
        if (typeof window !== 'undefined') {
          // 设置全局标志，表示需要切换到箭头工具
          (window as any).forceSwitchToArrowTool = true
          
          // 触发一个自定义事件来通知CanvasToolbar更新状态
          const toolbarEvent = new CustomEvent('canvas:updateToolbarState', {
            detail: { activeTool: 'arrow' }
          })
          window.dispatchEvent(toolbarEvent)
        }
      }
      
      // 如果有图片数据，保存到全局变量供点击画布时使用
      if (event.detail.imageData) {
        if (!(window as any).pendingCanvasImage) {
          (window as any).pendingCanvasImage = []
        }
        (window as any).pendingCanvasImage.push(event.detail.imageData)
        
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
      }
      
      // 如果有视频数据，保存到全局变量供点击画布时使用
      if (event.detail.videoData) {
        if (!(window as any).pendingCanvasVideo) {
          (window as any).pendingCanvasVideo = []
        }
        (window as any).pendingCanvasVideo.push(event.detail.videoData)
        
        // 显示提示信息
        const notification = document.createElement('div')
        notification.innerHTML = `
          <div style="position: fixed; top: 20px; right: 20px; background: #3b82f6; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
            已切换到选择工具，请在画板上点击放置视频
          </div>
        `
        document.body.appendChild(notification)
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification)
          }
        }, 3000)
      }
    }

    // 添加事件监听器
    window.addEventListener('canvas:switchToArrowTool', handleSwitchToArrowTool as EventListener)

    return () => {
      window.removeEventListener('canvas:switchToArrowTool', handleSwitchToArrowTool as EventListener)
    }
  }, [fabricCanvas])

  // 处理画布点击事件，添加待处理的图片
  useEffect(() => {
    if (!fabricCanvas) return

    const handleCanvasClick = (options: any) => {
      // 检查是否有待处理的图片
      if ((window as any).pendingCanvasImage && (window as any).pendingCanvasImage.length > 0) {
        const imageData = (window as any).pendingCanvasImage.shift()
        
        if (imageData) {
          // 在点击位置添加图片
          const pointer = fabricCanvas.getPointer(options.e)
          
          // 使用CORS代理安全加载图片
          loadImageWithCors(imageData)
            .then((img) => {
              try {
                const fabric = (window as any).fabric
                if (!fabric) {
                  throw new Error('Fabric.js未正确加载')
                }
                
                // 创建Fabric图片对象
                const fabricImg = new fabric.Image(img, {
                  left: pointer.x,
                  top: pointer.y,
                  selectable: true,
                  hasControls: true,
                  cornerStyle: 'circle',
                  transparentCorners: false,
                  cornerColor: '#3b82f6',
                  cornerSize: 12,
                  rotatingPointOffset: 40
                })
                
                // 设置合适的缩放比例
                const maxSize = canvasData.maxImageSize
                const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
                fabricImg.scale(scale)
                
                // 添加到画布
                fabricCanvas.add(fabricImg)
                fabricCanvas.setActiveObject(fabricImg)
                fabricCanvas.renderAll()
                
              } catch (error) {
                // 添加图片到画板失败
                console.error('添加图片到画板失败:', error)
              }
            })
            .catch((error) => {
              // 图片加载失败
              console.error('图片加载失败:', error)
            })
        }
        
        // 如果没有更多待处理图片，清除全局变量
        if ((window as any).pendingCanvasImage.length === 0) {
          delete (window as any).pendingCanvasImage
        }
      }
      
      // 检查是否有待处理的视频
      if ((window as any).pendingCanvasVideo && (window as any).pendingCanvasVideo.length > 0) {
        const videoData = (window as any).pendingCanvasVideo.shift()
        
        if (videoData) {
          // 在点击位置添加视频
          const pointer = fabricCanvas.getPointer(options.e)
          
          try {
            const fabric = (window as any).fabric
            if (!fabric) {
              throw new Error('Fabric.js未正确加载')
            }
            
            // 参考标准模式创建视频元素
            const videoElement = document.createElement('video')
            const sourceElement = document.createElement('source')
            
            // FabricImage requires the width and height attributes to be set
            videoElement.width = 480
            videoElement.height = 360
            videoElement.id = 'generated-video-' + Date.now()
            videoElement.muted = true
            videoElement.loop = true
            videoElement.playsInline = true
            videoElement.crossOrigin = 'anonymous'
            
            // 设置视频源
            sourceElement.src = videoData
            videoElement.appendChild(sourceElement)
            
            // 视频播放结束自动重新播放
            videoElement.onended = () => {
              videoElement.play()
            }
            
            // 添加到DOM并隐藏，避免在页面中显示
            videoElement.style.position = 'fixed'
            videoElement.style.left = '-9999px'
            videoElement.style.top = '-9999px'
            videoElement.style.opacity = '0'
            videoElement.style.pointerEvents = 'none'
            document.body.appendChild(videoElement)
            
            // 等待视频加载完成后获取实际尺寸
            const createFabricVideo = () => {
              try {
                // 获取视频实际尺寸
                const videoWidth = videoElement.videoWidth || 640
                const videoHeight = videoElement.videoHeight || 360
                
                // 设置合适的显示尺寸，避免过大或过小
                const displayWidth = Math.min(videoWidth, 800) // 最大宽度限制
                const displayHeight = (videoHeight / videoWidth) * displayWidth
                
                // 确保视频元素本身有正确的尺寸设置
                videoElement.width = videoWidth
                videoElement.height = videoHeight
                videoElement.style.width = displayWidth + 'px'
                videoElement.style.height = displayHeight + 'px'
                
                // 创建Fabric Image对象，使用合适的显示尺寸
                const fabricVideo = new fabric.Image(videoElement, {
                  left: pointer.x,
                  top: pointer.y,
                  width: displayWidth,
                  height: displayHeight,
                  scaleX: 1,
                  scaleY: 1,
                  selectable: true,
                  hasControls: true,
                  cornerStyle: 'circle',
                  transparentCorners: false,
                  cornerColor: '#3b82f6',
                  cornerSize: 12,
                  rotatingPointOffset: 40,
                  objectCaching: false,
                  originX: 'center',
                  originY: 'center',
                  // 确保视频完整显示，不裁剪
                  cropX: 0,
                  cropY: 0,
                  // 设置正确的缩放模式
                  imageSmoothing: true
                })
              
              // 设置自定义属性
              fabricVideo.set('videoUrl', videoData)
              fabricVideo.set('videoElement', videoElement)
              
              // 添加双击事件：播放/暂停视频
              fabricVideo.on('mousedblclick', () => {
                if (videoElement.paused) {
                  videoElement.play().then(() => {
                  }).catch((error) => {
                    // 显示播放提示
                    const playHint = document.createElement('div')
                    playHint.innerHTML = `
                      <div style="position: fixed; top: 60px; right: 20px; background: #f59e0b; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 12px;">
                        双击播放失败，请点击视频控件播放
                      </div>
                    `
                    document.body.appendChild(playHint)
                    setTimeout(() => {
                      if (document.body.contains(playHint)) {
                        document.body.removeChild(playHint)
                      }
                    }, 3000)
                  })
                } else {
                  videoElement.pause()
                }
              })
              
              // 添加右键菜单事件：在新窗口打开视频
              fabricVideo.on('mouseup', (options) => {
                if (options.button === 3) { // 右键
                  window.open(videoData, '_blank')
                }
              })
              
              // 当对象被移除时清理视频元素
              fabricVideo.on('removed', () => {
                videoElement.pause()
                if (document.body.contains(videoElement)) {
                  document.body.removeChild(videoElement)
                }
              })
              
              // 添加到画布
              fabricCanvas.add(fabricVideo)
              fabricCanvas.setActiveObject(fabricVideo)
              
              // 立即尝试播放视频
              const playVideo = () => {
                videoElement.play().then(() => {
                }).catch((error) => {
                  // 显示播放提示
                  const playHint = document.createElement('div')
                  playHint.innerHTML = `
                    <div style="position: fixed; top: 60px; right: 20px; background: #f59e0b; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 12px;">
                      视频已加载，双击播放或点击视频控件播放
                    </div>
                  `
                  document.body.appendChild(playHint)
                  setTimeout(() => {
                    if (document.body.contains(playHint)) {
                      document.body.removeChild(playHint)
                    }
                  }, 3000)
                })
              }
              
              // 等待视频加载完成后播放
              if (videoElement.readyState >= 2) {
                playVideo()
              } else {
                videoElement.addEventListener('loadeddata', playVideo)
                videoElement.addEventListener('canplay', playVideo)
              }
              
              // 设置动画循环渲染 - 确保视频能够实时更新
              const renderLoop = () => {
                if (fabricCanvas) {
                  fabricCanvas.renderAll()
                  fabric.util.requestAnimFrame(renderLoop)
                }
              }
              
              // 启动渲染循环
              if (fabricCanvas) {
                fabric.util.requestAnimFrame(renderLoop)
              }
              
            } catch (error) {
                
                // 如果视频添加失败，创建视频占位符
                const fabricVideoPlaceholder = new fabric.Group([
                  new fabric.Rect({
                    width: 200,
                    height: 150,
                    fill: '#1f2937',
                    rx: 8,
                    ry: 8
                  }),
                  new fabric.Text('视频', {
                    fontSize: 16,
                    fill: 'white',
                    originX: 'center',
                    originY: 'center'
                  })
                ], {
                  left: pointer.x,
                  top: pointer.y,
                  selectable: true,
                  hasControls: true,
                  cornerStyle: 'circle',
                  transparentCorners: false,
                  cornerColor: '#3b82f6',
                  cornerSize: 12,
                  rotatingPointOffset: 40
                })
                
                // 设置双击事件在新窗口打开视频
                fabricVideoPlaceholder.on('mousedblclick', () => {
                  window.open(videoData, '_blank')
                })
                
                fabricCanvas.add(fabricVideoPlaceholder)
                fabricCanvas.setActiveObject(fabricVideoPlaceholder)
                fabricCanvas.renderAll()
              }
            }
            
            // 如果视频已经加载了元数据，立即创建Fabric对象
            if (videoElement.readyState >= 1) {
              createFabricVideo()
            } else {
              // 等待视频加载元数据后再创建Fabric对象
              videoElement.addEventListener('loadedmetadata', createFabricVideo)
            }
            
            // 视频加载错误处理
            videoElement.addEventListener('error', (error) => {
              // 清理DOM元素
              if (document.body.contains(videoElement)) {
                document.body.removeChild(videoElement)
              }
              
              // 创建错误提示占位符
              const fabricError = new fabric.Group([
                new fabric.Rect({
                  width: 200,
                  height: 150,
                  fill: '#ef4444',
                  rx: 8,
                  ry: 8
                }),
                new fabric.Text('视频加载失败', {
                  fontSize: 14,
                  fill: 'white',
                  originX: 'center',
                  originY: 'center'
                })
              ], {
                left: pointer.x,
                top: pointer.y,
                selectable: true,
                hasControls: true
              })
              
              fabricCanvas.add(fabricError)
              fabricCanvas.setActiveObject(fabricError)
              fabricCanvas.renderAll()
            })
            
            // 添加超时处理，防止视频加载卡住
            const loadTimeout = setTimeout(() => {
              if (videoElement.readyState < 2) { // 如果视频还没加载到可以播放的状态
                videoElement.dispatchEvent(new Event('error'))
              }
            }, 10000) // 10秒超时
            
            // 加载完成后清除超时
            videoElement.addEventListener('loadeddata', () => {
              clearTimeout(loadTimeout)
            })
            
            videoElement.addEventListener('error', () => {
              clearTimeout(loadTimeout)
            })
            
          } catch (error) {
          }
        }
        
        // 如果没有更多待处理视频，清除全局变量
        if ((window as any).pendingCanvasVideo.length === 0) {
          delete (window as any).pendingCanvasVideo
        }
      }
    }

    fabricCanvas.on('mouse:down', handleCanvasClick)

    return () => {
      fabricCanvas.off('mouse:down', handleCanvasClick)
    }
  }, [fabricCanvas])

  // AI 生成占位逻辑（与 ChatPanel 的模拟一致）
  const handleGenerateImage = async (prompt: string, model: string, position: { x: number; y: number }, screenshotData?: string, aspectRatio?: string) => {
    
    // 定义内部函数，避免依赖问题
    const getApiKeyForModel = (model: string): string => {
      return ApiKeyCache.getApiKey()
    }
    
    try {
      if (!fabricCanvas) return
      
      // 显示生成中提示
      const notification = document.createElement('div')
      notification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #3b82f6; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
          正在生成图片...
        </div>
      `
      document.body.appendChild(notification)
      
      // 先准备请求参数，确保参数正确后再添加占位图片
      const request: any = {
        model: model as any,
        prompt: prompt,
        key: getApiKeyForModel(model),
        size: getSizeByAspectRatio(aspectRatio || '1:1'), // 根据比例计算正确尺寸
        aspectRatio: aspectRatio || '1:1' // 使用传入的比例或默认比例
      }
      
      // 如果有截图数据，添加到请求参数中作为参考图片
      if (screenshotData) {
        request.images = [screenshotData] // 正确的方式：通过images数组传递
      }
      
      // SelectionPanel已经调用了logGenerateImageTask，这里不再重复调用
      // 避免聊天记录中出现重复消息
      
      // 先创建任务，确保没有错误后再添加占位图片
      const taskId = await ModelService.createTask(request)
      
      // 只有在任务创建成功后才添加加载中的占位图片
      const loadingImage = await addLoadingPlaceholder(position)
      
      // 轮询任务状态
      const result = await ModelService.getTaskStatus({
        ...request,
        taskId
      })
      
      // 移除生成中提示
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
      
      // 检查是否为图片生成结果
      if (result.status === '2' && 'imageUrl' in result && result.imageUrl) {
        try {
          // 生成成功，替换加载中的占位图片为实际图片
          await replaceLoadingWithActualImage(loadingImage, result.imageUrl)
          
          // 记录生图结果到聊天记录
          if (chatPanelRef.current && (chatPanelRef.current as any).logGenerateImageResult) {
            (chatPanelRef.current as any).logGenerateImageResult(result.imageUrl, prompt)
          }
          
          // 显示成功提示
          const successNotification = document.createElement('div')
          successNotification.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
              图片生成成功！
            </div>
          `
          document.body.appendChild(successNotification)
          
          setTimeout(() => {
            if (document.body.contains(successNotification)) {
              document.body.removeChild(successNotification)
            }
          }, 2000)
          
        } catch (imageError) {
          // 图片加载失败，移除加载中的占位图片
          if (loadingImage && fabricCanvas) {
            fabricCanvas.remove(loadingImage)
            fabricCanvas.renderAll()
          }
          
          // 显示图片加载失败提示
          const errorNotification = document.createElement('div')
          errorNotification.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: #f59e0b; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
              图片生成成功但加载失败: ${imageError instanceof Error ? imageError.message : '未知错误'}
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
        // 生成失败，移除加载中的占位图片
        if (loadingImage && fabricCanvas) {
          fabricCanvas.remove(loadingImage)
          fabricCanvas.renderAll()
        }
        
        // 显示失败提示
        const errorNotification = document.createElement('div')
        errorNotification.innerHTML = `
          <div style="position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
            图片生成失败: ${result.error || '未知错误'}
          </div>
        `
        document.body.appendChild(errorNotification)
        
        setTimeout(() => {
          if (document.body.contains(errorNotification)) {
            document.body.removeChild(errorNotification)
          }
        }, 3000)
      }
      
    } catch (error) {
      
      // 移除所有可能的生成中提示
      const notifications = document.querySelectorAll('div[style*="正在生成图片"], div[style*="background: #3b82f6"]')
      notifications.forEach(notification => {
        if (notification && notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      })
      
      // 显示错误提示
      const errorNotification = document.createElement('div')
      errorNotification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
          生成失败: ${error instanceof Error ? error.message : '未知错误'}
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
  const handleGenerateVideo = useCallback(async (prompt: string, model: string, position: { x: number; y: number }, screenshotData?: string, aspectRatio?: string, duration?: string) => {
    
    // 定义内部函数，避免依赖问题
    const getApiKeyForModel = (model: string): string => {
      return ApiKeyCache.getApiKey()
    }
    
    // URL转Base64辅助函数
    const urlToBase64 = async (url: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.width = img.width
          canvas.height = img.height
          
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            const dataURL = canvas.toDataURL('image/png')
            resolve(dataURL)
          } else {
            reject(new Error('无法获取Canvas上下文'))
          }
        }
        
        img.onerror = () => {
          reject(new Error('图片加载失败'))
        }
        
        img.src = url
      })
    }
    
    const addLoadingVideoPlaceholder = async (position: { x: number; y: number }): Promise<any> => {
      return new Promise((resolve, reject) => {
        if (!fabricCanvas) {
          reject(new Error('画布未初始化'))
          return
        }
        
        // 创建一个视频加载占位符SVG
        const svgContent = `
          <svg width="200" height="150" viewBox="0 0 100 75" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="75" fill="#1f2937" rx="8" ry="8"/>
            <circle cx="50" cy="37.5" r="15" fill="#3b82f6" opacity="0.8">
              <animate attributeName="r" values="15;20;15" dur="1.5s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.8;0.4;0.8" dur="1.5s" repeatCount="indefinite"/>
            </circle>
            <polygon points="45,35 45,40 50,37.5" fill="white"/>
            <text x="50" y="65" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="8">视频生成中...</text>
          </svg>
        `
        
        // 将SVG转换为DataURL
        const svgDataURL = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgContent)))
        
        // 创建图片元素
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        img.onload = () => {
          try {
            // 创建Fabric图片对象
            const fabricImg = new (window as any).fabric.Image(img, {
              left: position.x,
              top: position.y,
              selectable: false, // 加载中视频不可选中
              hasControls: false,
              lockMovementX: true,
              lockMovementY: true,
              lockRotation: true,
              lockScalingX: true,
              lockScalingY: true,
              opacity: 0.9
            })
            
            // 设置合适的尺寸
            const width = 200
            const height = 150
            const scaleX = width / img.width
            const scaleY = height / img.height
            fabricImg.scaleX = scaleX
            fabricImg.scaleY = scaleY
            
            // 添加到画布
            fabricCanvas.add(fabricImg)
            fabricCanvas.renderAll()
            
            resolve(fabricImg)
            
          } catch (error) {
            reject(error)
          }
        }
        
        img.onerror = (error) => {
          reject(new Error('视频加载中占位图片加载失败'))
        }
        
        img.src = svgDataURL
      })
    }
    
    const replaceLoadingWithActualVideo = async (loadingVideo: any, actualVideoUrl: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        if (!fabricCanvas || !loadingVideo) {
          reject(new Error('画布或加载中视频未初始化'))
          return
        }
        
        // 获取加载中视频的位置和尺寸
        const position = {
          x: loadingVideo.left || 0,
          y: loadingVideo.top || 0
        }
        const width = (loadingVideo.width || 200) * (loadingVideo.scaleX || 1)
        const height = (loadingVideo.height || 150) * (loadingVideo.scaleY || 1)
        
        // 移除加载中视频
        fabricCanvas.remove(loadingVideo)
        
        try {
          const fabric = (window as any).fabric
          if (!fabric) {
            throw new Error('Fabric.js未正确加载')
          }
          
          // 创建视频元素
          const videoElement = document.createElement('video')
          const sourceElement = document.createElement('source')
          
          // 设置视频属性
          videoElement.width = 480
          videoElement.height = 360
          videoElement.id = 'generated-video-' + Date.now()
          videoElement.muted = true
          videoElement.loop = true
          videoElement.playsInline = true
          videoElement.crossOrigin = 'anonymous'
          videoElement.controls = true
          
          // 设置视频源
          sourceElement.src = actualVideoUrl
          videoElement.appendChild(sourceElement)
          
          // 视频播放结束自动重新播放
          videoElement.onended = () => {
            videoElement.play()
          }
          
          // 添加到DOM并隐藏，避免在页面中显示
          videoElement.style.position = 'fixed'
          videoElement.style.left = '-9999px'
          videoElement.style.top = '-9999px'
          videoElement.style.opacity = '0'
          videoElement.style.pointerEvents = 'none'
          document.body.appendChild(videoElement)
          
          // 等待视频加载完成后获取实际尺寸
          const createFabricVideo = () => {
            try {
              // 获取视频实际尺寸
              const videoWidth = videoElement.videoWidth || 640
              const videoHeight = videoElement.videoHeight || 360
              
              // 设置合适的显示尺寸，避免过大或过小
              const displayWidth = Math.min(videoWidth, 800) // 最大宽度限制
              const displayHeight = (videoHeight / videoWidth) * displayWidth
              
              // 确保视频元素本身有正确的尺寸设置
              videoElement.width = videoWidth
              videoElement.height = videoHeight
              videoElement.style.width = displayWidth + 'px'
              videoElement.style.height = displayHeight + 'px'
              
              // 创建Fabric Image对象，使用合适的显示尺寸
              const fabricVideo = new fabric.Image(videoElement, {
                left: position.x,
                top: position.y,
                width: displayWidth,
                height: displayHeight,
                scaleX: 1,
                scaleY: 1,
                selectable: true,
                hasControls: true,
                cornerStyle: 'circle',
                transparentCorners: false,
                cornerColor: '#3b82f6',
                cornerSize: 12,
                rotatingPointOffset: 40,
                objectCaching: false,
                originX: 'center',
                originY: 'center',
                // 确保视频完整显示，不裁剪
                cropX: 0,
                cropY: 0,
                // 设置正确的缩放模式
                imageSmoothing: true
              })
              
              // 设置自定义属性
              fabricVideo.set('videoUrl', actualVideoUrl)
              fabricVideo.set('videoElement', videoElement)
              
              // 添加双击事件：播放/暂停视频
              fabricVideo.on('mousedblclick', () => {
                if (videoElement.paused) {
                  videoElement.play().then(() => {
                  }).catch((error) => {
                    // 显示播放提示
                    const playHint = document.createElement('div')
                    playHint.innerHTML = `
                      <div style="position: fixed; top: 60px; right: 20px; background: #f59e0b; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 12px;">
                        双击播放失败，请点击视频控件播放
                      </div>
                    `
                    document.body.appendChild(playHint)
                    setTimeout(() => {
                      if (document.body.contains(playHint)) {
                        document.body.removeChild(playHint)
                      }
                    }, 2000)
                  })
                } else {
                  videoElement.pause()
                }
              })
              
              // 添加到画布
              fabricCanvas.add(fabricVideo)
              fabricCanvas.setActiveObject(fabricVideo)
              fabricCanvas.renderAll()
              
              // 开始播放视频
              videoElement.play().catch(() => {
                // 自动播放可能被阻止，这是正常的
              })
              
              resolve(fabricVideo)
            } catch (error) {
              reject(error)
            }
          }
          
          // 监听视频加载完成事件
          if (videoElement.readyState >= 3) {
            // 视频已经加载完成
            createFabricVideo()
          } else {
            videoElement.addEventListener('loadeddata', createFabricVideo, { once: true })
            videoElement.addEventListener('error', () => {
              reject(new Error('视频加载失败'))
            })
          }
          
          // 设置超时，避免视频加载时间过长
          setTimeout(() => {
            if (videoElement.readyState < 3) {
              // 如果视频还未加载完成，强制创建（使用默认尺寸）
              createFabricVideo()
            }
          }, 5000)
          
        } catch (error) {
          reject(error)
        }
      })
    }
    
    try {
      if (!fabricCanvas) return
      
      // 显示生成中提示
      const notification = document.createElement('div')
      notification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #3b82f6; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
          正在生成视频...
        </div>
      `
      document.body.appendChild(notification)
      
      // 准备请求参数
      const request: any = {
        model: model as any,
        prompt: prompt,
        apiKey: getApiKeyForModel(model),
        duration: duration || (model === 'sora2' ? '10s' : '8s'), // 使用传入的时长或默认值
        aspectRatio: aspectRatio || '16:9' // 使用传入的比例或默认16:9
      }
      
      // 如果有截图数据，添加到请求参数中作为参考图片
      if (screenshotData) {
        // 检查图片数据格式，如果是URL需要转换为Base64
        if (screenshotData.startsWith('http')) {
          try {
            // 将URL转换为Base64
            const base64Data = await urlToBase64(screenshotData)
            request.images = [base64Data]
          } catch (error) {
            console.warn('URL转Base64失败，使用原始数据:', error)
            request.images = [screenshotData]
          }
        } else {
          request.images = [screenshotData]
        }
      }
      

      
      // 先创建任务，确保没有错误后再添加占位视频
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '视频生成任务创建失败');
      }
      
      const createResult = await response.json();
      const taskId = createResult.taskId;
      
      // 记录视频生成任务到聊天记录
      if (typeof window !== 'undefined' && (window as any).chatPanelRef) {
        const chatPanel = (window as any).chatPanelRef
        if (chatPanel.logGenerateVideoTask) {
          chatPanel.logGenerateVideoTask(prompt, model, request.duration, request.aspectRatio, screenshotData)
        }
      }
      
      // 只有在任务创建成功后才添加加载中的占位视频
      const loadingVideo = await addLoadingVideoPlaceholder(position)
      
      // 轮询任务状态（最多轮询120次，每次间隔5秒，总共10分钟）
      let pollResult = null
      let pollCount = 0
      const maxPollCount = 120
      
      while (pollCount < maxPollCount) {
        // 查询任务状态
        const statusResponse = await fetch(`/api/generate-video?taskId=${taskId}&model=${model}&key=${request.key}`);
        
        if (!statusResponse.ok) {
          const errorData = await statusResponse.json();
          throw new Error(errorData.error || '查询视频状态失败');
        }
        
        const statusResult = await statusResponse.json();
        pollResult = statusResult.data;
        
        // 检查任务状态 - 确保状态为成功且视频链接存在
        if (pollResult.status === '2' && pollResult.videoUrl && pollResult.videoUrl.trim() !== '') {
          // 生成成功，停止轮询
          break
        } else if (pollResult.status === '3') {
          // 生成失败，停止轮询
          break
        }
        
        pollCount++
        
        // 如果已经达到最大轮询次数，强制停止轮询
        if (pollCount >= maxPollCount) {
          break
        }
        
        // 等待5秒后继续轮询
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
      
      // 移除生成中提示
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
      
      // 检查是否为视频生成结果 - 确保状态为成功且视频链接存在
      if (pollResult && pollResult.status === '2' && pollResult.videoUrl && pollResult.videoUrl.trim() !== '') {
        // 生成成功，替换加载中的占位视频为实际视频
        await replaceLoadingWithActualVideo(loadingVideo, pollResult.videoUrl)
        
        // 记录视频生成结果到聊天记录
        if (typeof window !== 'undefined' && (window as any).chatPanelRef) {
          const chatPanel = (window as any).chatPanelRef
          if (chatPanel.logGenerateVideoResult) {
            chatPanel.logGenerateVideoResult(pollResult.videoUrl, prompt)
          }
        }
        
        // 显示成功提示
        const successNotification = document.createElement('div')
        successNotification.innerHTML = `
          <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
            视频生成成功！
          </div>
        `
        document.body.appendChild(successNotification)
        
        setTimeout(() => {
          if (document.body.contains(successNotification)) {
            document.body.removeChild(successNotification)
          }
        }, 2000)
        
      } else {
        // 生成失败或超时，移除加载中的占位视频
        if (loadingVideo && fabricCanvas) {
          fabricCanvas.remove(loadingVideo)
          fabricCanvas.renderAll()
        }
        
        // 显示失败提示
        const errorMessage = pollResult && pollResult.error 
          ? pollResult.error 
          : pollCount >= maxPollCount 
            ? '视频生成超时，请稍后重试' 
            : '视频生成失败'
            
        const errorNotification = document.createElement('div')
        errorNotification.innerHTML = `
          <div style="position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
            视频生成失败: ${errorMessage}
          </div>
        `
        document.body.appendChild(errorNotification)
        
        setTimeout(() => {
          if (document.body.contains(errorNotification)) {
            document.body.removeChild(errorNotification)
          }
        }, 3000)
      }
      
    } catch (error) {
      
      // 移除所有可能的生成中提示
      const notifications = document.querySelectorAll('div[style*="正在生成视频"], div[style*="background: #3b82f6"]')
      notifications.forEach(notification => {
        if (notification && notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      })
      
      // 显示错误提示
      const errorNotification = document.createElement('div')
      errorNotification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
          视频生成失败: ${error instanceof Error ? error.message : '未知错误'}
        </div>
      `
      document.body.appendChild(errorNotification)
      
      setTimeout(() => {
        if (document.body.contains(errorNotification)) {
          document.body.removeChild(errorNotification)
        }
      }, 3000)
    }
  }, [fabricCanvas])

  // 清除框选状态
  const handleClearSelection = () => {
    setSelectedArea(null)
    // 如果有框选矩形在画布上，也移除它
    if (fabricCanvas && selectedArea?.rect) {
      fabricCanvas.remove(selectedArea.rect)
    }
  }

  // 处理图片添加到聊天
  const handleAddImageToChat = async (imageObject: any) => {
    try {
      // 优先使用图片的URL，如果没有URL则转换为DataURL
      let imageData = imageObject._element?.src || imageObject.src || imageObject.imageUrl
      
      // 如果没有URL，则转换为DataURL
      if (!imageData || imageData.startsWith('data:')) {
        imageData = imageObject.toDataURL({
          format: 'png',
          quality: 1.0
        })
      }
      
      // 发送到聊天面板
      chatPanelRef.current?.handleReceiveScreenshot(imageData, '上传的图片')
      
      // 显示添加成功提示
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
      
      // 清除选中状态
      setSelectedImage(null)
      
    } catch (error) {
      // 添加到聊天失败
    }
  }

  // 处理基于图片生成内容 - 直接调用生图接口并加载到画布
  const handleGenerateFromImage = async (imageObject: any, prompt: string, model: string, aspectRatio: string) => {
    let loadingImage: any = null
    
    // 定义内部函数，避免依赖问题
    const getApiKeyForModel = (model: string): string => {
      return ApiKeyCache.getApiKey()
    }
    
    try {
      if (!fabricCanvas || !selectedImage) return
      
      // 显示生成中提示
      const notification = document.createElement('div')
      notification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #3b82f6; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
          正在生成图片...
        </div>
      `
      document.body.appendChild(notification)
      
      // 获取选中图片的位置信息
      const selectedPosition = {
        left: selectedImage.left || 0,
        top: selectedImage.top || 0,
        width: (selectedImage.width || 0) * (selectedImage.scaleX || 1),
        height: (selectedImage.height || 0) * (selectedImage.scaleY || 1)
      }
      
      // 计算新图片的位置（放在选中图片的右侧）
      const newImagePosition = {
        x: selectedPosition.left + selectedPosition.width + 20, // 右侧20px间距
        y: selectedPosition.top
      }
      

      
      // 先添加加载中的占位图片
      loadingImage = await addLoadingPlaceholder(newImagePosition)
      
      // 将选中的图片转换为Base64格式
      const selectedImageData = await convertImageToBase64(selectedImage)
      
      // 调用ModelService创建图片生成任务，传入选中的图片
      const request = {
        model: model as any,
        prompt: prompt,
        key: getApiKeyForModel(model),
        size: getSizeByAspectRatio(aspectRatio), // 使用用户选择的比例
        aspectRatio: aspectRatio, // 使用用户选择的比例
        images: selectedImageData ? [selectedImageData] : undefined // 传入选中的图片
      }
      
      // 记录生图任务到聊天记录
      if (chatPanelRef.current && (chatPanelRef.current as any).logGenerateImageTask) {
        (chatPanelRef.current as any).logGenerateImageTask(prompt, model, aspectRatio, selectedImageData)
      }
      
      const taskId = await ModelService.createTask(request)
      
      // 轮询任务状态
      const result = await ModelService.getTaskStatus({
        ...request,
        taskId
      })
      
      // 移除生成中提示
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
      
      // 检查是否为图片生成结果
      if (result.status === '2' && 'imageUrl' in result && result.imageUrl) {
        try {
          // 生成成功，替换加载中的占位图片为实际图片
          await replaceLoadingWithActualImage(loadingImage, result.imageUrl)
          
          // 记录生图结果到聊天记录
          if (chatPanelRef.current && (chatPanelRef.current as any).logGenerateImageResult) {
            (chatPanelRef.current as any).logGenerateImageResult(result.imageUrl, prompt)
          }
          
          // 显示成功提示
          const successNotification = document.createElement('div')
          successNotification.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
              图片生成成功！
            </div>
          `
          document.body.appendChild(successNotification)
          
          setTimeout(() => {
            if (document.body.contains(successNotification)) {
              document.body.removeChild(successNotification)
            }
          }, 2000)
          
        } catch (imageError) {
          // 图片加载失败，移除加载中的占位图片
          if (loadingImage && fabricCanvas) {
            fabricCanvas.remove(loadingImage)
            fabricCanvas.renderAll()
          }
          
          // 显示图片加载失败提示
          const errorNotification = document.createElement('div')
          errorNotification.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: #f59e0b; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
              图片生成成功但加载失败: ${imageError instanceof Error ? imageError.message : '未知错误'}
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
        // 生成失败，移除加载中的占位图片
        if (loadingImage && fabricCanvas) {
          fabricCanvas.remove(loadingImage)
          fabricCanvas.renderAll()
        }
        
        // 显示失败提示
        const errorNotification = document.createElement('div')
        errorNotification.innerHTML = `
          <div style="position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
            图片生成失败: ${result.error || '未知错误'}
          </div>
        `
        document.body.appendChild(errorNotification)
        
        setTimeout(() => {
          if (document.body.contains(errorNotification)) {
            document.body.removeChild(errorNotification)
          }
        }, 3000)
      }
      
      // 清除选中状态
      setSelectedImage(null)
      
    } catch (error) {
      
      // 移除所有可能的生成中提示
      const notifications = document.querySelectorAll('div[style*="正在生成图片"], div[style*="background: #3b82f6"]')
      notifications.forEach(notification => {
        if (notification && notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      })
      
      // 移除加载中的占位图片
      if (loadingImage && fabricCanvas) {
        fabricCanvas.remove(loadingImage)
        fabricCanvas.renderAll()
      }
      
      // 显示错误提示
      const errorNotification = document.createElement('div')
      errorNotification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
          生成失败: ${error instanceof Error ? error.message : '未知错误'}
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
  
  // 将生成的图片添加到画布
  const addGeneratedImageToCanvas = async (imageUrl: string, position: { x: number; y: number }) => {
    return new Promise((resolve, reject) => {
      if (!fabricCanvas) {
        reject(new Error('画布未初始化'))
        return
      }
      
      // 创建图片元素
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        try {
          // 创建Fabric图片对象
          const fabricImg = new (window as any).fabric.Image(img, {
            left: position.x,
            top: position.y,
            selectable: true,
            hasControls: true,
            cornerStyle: 'circle',
            transparentCorners: false,
            cornerColor: '#3b82f6',
            cornerSize: 12,
            rotatingPointOffset: 40
          })
          
          // 设置合适的缩放比例
          const maxSize = canvasData.maxImageSize
          const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
          fabricImg.scale(scale)
          
          // 添加到画布
          fabricCanvas.add(fabricImg)
          fabricCanvas.setActiveObject(fabricImg)
          fabricCanvas.renderAll()
          
          console.log('生成的图片已添加到画布，位置:', position)
          resolve(fabricImg)
          
        } catch (error) {
          console.error('添加图片到画布失败:', error)
          reject(error)
        }
      }
      
      img.onerror = (error) => {
        console.error('图片加载失败:', error)
        reject(new Error('图片加载失败'))
      }
      
      img.src = imageUrl
    })
  }
  
  // 根据模型获取API密钥
  const getApiKeyForModel = (model: string): string => {
    switch (model) {
      case 'nano-banana':
        return process.env.NEXT_PUBLIC_NANO_BANANA_API_KEY || ''
      case 'seedream-4':
        return process.env.NEXT_PUBLIC_SEEDREAM_API_KEY || ''
      default:
        return ''
    }
  }
  
  // 根据宽高比获取对应的尺寸
  const getSizeByAspectRatio = (aspectRatio: string): string => {
    return canvasData.aspectRatios[aspectRatio] || canvasData.defaultSize
  }
  
  // 将图片对象转换为Base64格式
  const convertImageToBase64 = async (imageObject: any): Promise<string | null> => {
    return new Promise((resolve) => {
      try {
        // 使用Fabric.js的toDataURL方法将图片转换为Base64
        const dataURL = imageObject.toDataURL({
          format: 'png',
          quality: 1.0
        })
        
        // 提取Base64数据部分（去掉data:image/png;base64,前缀）
        const base64Data = dataURL.split(',')[1]
        resolve(base64Data)
      } catch (error) {
        resolve(null)
      }
    })
  }
  
  // 添加加载中的占位图片
  const addLoadingPlaceholder = async (position: { x: number; y: number }): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!fabricCanvas) {
        reject(new Error('画布未初始化'))
        return
      }
      
      // 创建一个简单的SVG加载动画
      const svgContent = `
        <svg width="200" height="200" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" stroke="#3b82f6" stroke-width="8" fill="none" opacity="0.3"/>
          <circle cx="50" cy="50" r="40" stroke="#3b82f6" stroke-width="8" fill="none" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="1s" repeatCount="indefinite"/>
            <animate attributeName="stroke-dasharray" values="0,251.2;125.6,125.6;251.2,0" dur="1s" repeatCount="indefinite"/>
            <animate attributeName="stroke-dashoffset" values="0;0;125.6" dur="1s" repeatCount="indefinite"/>
          </circle>
          <text x="50" y="55" text-anchor="middle" fill="#3b82f6" font-family="Arial" font-size="12">生成中...</text>
        </svg>
      `
      
      // 将SVG转换为DataURL
      const svgDataURL = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgContent)))
      
      // 创建图片元素
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        try {
          // 创建Fabric图片对象
          const fabricImg = new (window as any).fabric.Image(img, {
            left: position.x,
            top: position.y,
            selectable: false, // 加载中图片不可选中
            hasControls: false,
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
            opacity: 0.8
          })
          
          // 设置合适的尺寸
          const size = 150
          const scale = size / Math.max(img.width, img.height)
          fabricImg.scale(scale)
          
          // 添加到画布
          fabricCanvas.add(fabricImg)
          fabricCanvas.renderAll()
          
          resolve(fabricImg)
          
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = (error) => {
        reject(new Error('加载中占位图片加载失败'))
      }
      
      img.src = svgDataURL
    })
  }
  
  // 替换加载中占位图片为实际生成的图片
  const replaceLoadingWithActualImage = async (loadingImage: any, actualImageUrl: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!fabricCanvas || !loadingImage) {
        reject(new Error('画布或加载中图片未初始化'))
        return
      }
      
      // 获取加载中图片的位置和尺寸
      const position = {
        x: loadingImage.left || 0,
        y: loadingImage.top || 0
      }
      
      // 移除加载中图片
      fabricCanvas.remove(loadingImage)
      
      // 使用CORS代理安全加载图片
      loadImageWithCors(actualImageUrl)
        .then((img) => {
          try {
            // 创建Fabric图片对象
            const fabricImg = new (window as any).fabric.Image(img, {
              left: position.x,
              top: position.y,
              selectable: true,
              hasControls: true,
              cornerStyle: 'circle',
              transparentCorners: false,
              cornerColor: '#3b82f6',
              cornerSize: 12,
              rotatingPointOffset: 40
            })
            
            // 设置合适的缩放比例
            const maxSize = canvasData.maxImageSize
            const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
            fabricImg.scale(scale)
            
            // 添加到画布
            fabricCanvas.add(fabricImg)
            fabricCanvas.setActiveObject(fabricImg)
            fabricCanvas.renderAll()
            
            console.log('实际图片已替换加载中占位图片，位置:', position)
            resolve(fabricImg)
            
          } catch (error) {
            console.error('替换为实际图片失败:', error)
            reject(error)
          }
        })
        .catch((error) => {
          console.error('实际图片加载失败:', error)
          reject(new Error('实际图片加载失败'))
        })
    })
  }

  // 右键菜单处理
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!fabricCanvas) return
    
    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject) {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY
      })
    }
  }

  // 关闭右键菜单
  const handleCloseContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0 })
  }

  // 层级操作函数
  // 手动层级管理备用方案
  const manualLayerManagement = (operation: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward') => {
    if (!fabricCanvas) return
    const activeObject = fabricCanvas.getActiveObject()
    if (!activeObject) return
    
    const objects = fabricCanvas.getObjects()
    const currentIndex = objects.indexOf(activeObject)
    
    if (currentIndex === -1) {
      return
    }
    
    // 移除当前对象
    fabricCanvas.remove(activeObject)
    
    // 使用更兼容的方法重新添加对象到指定位置
    switch (operation) {
      case 'bringToFront':
        // 置顶：直接添加到画布（默认添加到顶部）
        fabricCanvas.add(activeObject)
        break
      case 'sendToBack':
        // 置底：先移除所有对象，然后按顺序重新添加
        const allObjects = fabricCanvas.getObjects()
        fabricCanvas.clear()
        // 先添加当前对象（置底）
        fabricCanvas.add(activeObject)
        // 然后添加其他对象
        allObjects.forEach(obj => {
          if (obj !== activeObject) {
            fabricCanvas.add(obj)
          }
        })
        break
      case 'bringForward':
        // 上移一层：与后一个对象交换位置
        if (currentIndex < objects.length - 1) {
          const nextObject = objects[currentIndex + 1]
          fabricCanvas.remove(nextObject)
          fabricCanvas.add(activeObject)
          fabricCanvas.add(nextObject)
        } else {
          // 已经在最顶层，无法上移
        }
        break
      case 'sendBackward':
        // 下移一层：与前一个对象交换位置
        if (currentIndex > 0) {
          const prevObject = objects[currentIndex - 1]
          fabricCanvas.remove(prevObject)
          fabricCanvas.add(activeObject)
          fabricCanvas.add(prevObject)
        } else {
          // 已经在最底层，无法下移
        }
        break
    }
    
    // 重新选中对象
    fabricCanvas.setActiveObject(activeObject)
    // 重新渲染画布
    fabricCanvas.renderAll()
  }

  const handleBringToFront = () => {
    if (!fabricCanvas) return
    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject) {
      try {
        // 优先使用Fabric.js原生方法
        if (fabricCanvas.bringToFront) {
          fabricCanvas.bringToFront(activeObject)
        } else {
          manualLayerManagement('bringToFront')
        }
        fabricCanvas.renderAll()
        handleCloseContextMenu()
      } catch (error) {
        manualLayerManagement('bringToFront')
      }
    }
  }

  const handleSendToBack = () => {
    if (!fabricCanvas) return
    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject) {
      try {
        if (fabricCanvas.sendToBack) {
          fabricCanvas.sendToBack(activeObject)
        } else {
          manualLayerManagement('sendToBack')
        }
        fabricCanvas.renderAll()
        handleCloseContextMenu()
      } catch (error) {
        manualLayerManagement('sendToBack')
      }
    }
  }

  const handleBringForward = () => {
    if (!fabricCanvas) return
    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject) {
      try {
        if (fabricCanvas.bringForward) {
          fabricCanvas.bringForward(activeObject)
        } else {
          manualLayerManagement('bringForward')
        }
        fabricCanvas.renderAll()
        handleCloseContextMenu()
      } catch (error) {
        manualLayerManagement('bringForward')
      }
    }
  }

  const handleSendBackward = () => {
    if (!fabricCanvas) return
    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject) {
      try {
        // 检查当前对象是否已经在最底层（不能移到白板背景之下）
        const objects = fabricCanvas.getObjects()
        const currentIndex = objects.indexOf(activeObject)
        
        // 如果已经在最底层（索引为0），则不允许再下移
        if (currentIndex <= 0) {
          // 显示提示信息
          const notification = document.createElement('div')
          notification.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: #f59e0b; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
              已在最底层，无法继续下移
            </div>
          `
          document.body.appendChild(notification)
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification)
            }
          }, 2000)
          return
        }
        
        if (fabricCanvas.sendBackwards) {
          fabricCanvas.sendBackwards(activeObject)
        } else {
          manualLayerManagement('sendBackward')
        }
        fabricCanvas.renderAll()
        handleCloseContextMenu()
      } catch (error) {
        manualLayerManagement('sendBackward')
      }
    }
  }

  return (
    <div className="w-full h-screen bg-gray-50 dark:bg-gray-900 relative" onClick={handleCloseContextMenu}>
      {/* 画布区域 - 铺满整个屏幕，始终处于最底层 */}
      <div className="absolute inset-0 z-0" onContextMenu={handleContextMenu}>
        <div className="bg-white dark:bg-gray-800 w-full h-full">
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* 顶部工具栏 - 悬浮在画板上方 */}
      <div className="absolute top-0 left-0 right-0 z-30">
        <CanvasToolbar
          canvas={fabricCanvas}
          onCaptureArea={handleCaptureArea}
          selectedArea={selectedArea ? selectedArea.rect : null}
        />
      </div>

      {/* 区域选择悬浮面板（生图快捷） */}
      <SelectionPanel
        selectedArea={selectedArea}
        onGenerateImage={handleGenerateImage}
        onGenerateVideo={handleGenerateVideo}
        onCaptureArea={handleCaptureArea}
        onReceiveScreenshot={handleReceiveScreenshot}
        onClearSelection={handleClearSelection}
      />

      {/* 形状属性编辑面板 */}
      <ShapePropertiesPanel canvas={fabricCanvas} />

      {/* 画笔属性编辑面板 */}
      <BrushPropertiesPanel 
        canvas={fabricCanvas}
        brushSize={brushSize}
        brushColor={brushColor}
        onBrushSizeChange={setBrushSize}
        onBrushColorChange={setBrushColor}
      />

      {/* 文字属性编辑面板 */}
      <TextPropertiesPanel canvas={fabricCanvas} />

      {/* 悬浮 AI 创作助手 */}
      <ChatPanel
        ref={chatPanelRef as any}
        onCaptureArea={handleCaptureArea}
        onReceiveScreenshot={handleReceiveScreenshot}
      />

      {/* 图片选中面板 */}
      <ImageSelectionPanel
        selectedImage={selectedImage}
        canvas={fabricCanvas}
        onAddToChat={handleAddImageToChat}
        onGenerateFromImage={handleGenerateFromImage}
        onClearSelection={() => setSelectedImage(null)}
      />

      {/* 右键菜单 - 最高层级 */}
      {contextMenu.visible && (
        <div 
          className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="p-2">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">层级操作</div>
            <div className="space-y-1">
              <button
                onClick={handleBringToFront}
                className="w-full text-left px-3 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                置顶
              </button>
              <button
                onClick={handleSendToBack}
                className="w-full text-left px-3 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                置底
              </button>
              <button
                onClick={handleBringForward}
                className="w-full text-left px-3 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                上移一层
              </button>
              <button
                onClick={handleSendBackward}
                className="w-full text-left px-3 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                下移一层
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}