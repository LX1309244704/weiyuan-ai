'use client'

import { useEffect, useRef, useState } from 'react'
 // 动态导入 fabric 于客户端（避免 SSR 环境下 undefined）
import CanvasToolbar from '../../components/CanvasToolbar'
import SelectionPanel from '../../components/SelectionPanel'
import ImageSelectionPanel from '../../components/ImageSelectionPanel'
import ChatPanel from '../../components/ChatPanel'
import ShapePropertiesPanel from '../../components/ShapePropertiesPanel'
import BrushPropertiesPanel from '../../components/BrushPropertiesPanel'
import TextPropertiesPanel from '../../components/TextPropertiesPanel'
import { useUserStore } from '@/stores/userStore'
import { ModelService } from '@/services/ai-models'

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
  const chatPanelRef = useRef<{ handleReceiveScreenshot: (imageData: string, prompt: string) => void } | null>(null)
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
        console.error('Failed to initialize fabric:', err)
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

      console.log('框选矩形更新:', {
        startX, startY,
        currentX, currentY,
        width, height,
        newLeft, newTop, newWidth, newHeight
      })

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
    
    console.log('截图调试信息:', {
      rectProperties: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        scaleX: rect.scaleX,
        scaleY: rect.scaleY
      },
      originalZoom: originalZoom,
      originalVpt: originalVpt,
      canvasSize: {
        width: fabricCanvas.getWidth(),
        height: fabricCanvas.getHeight()
      }
    })

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

      console.log('截图参数 - 重置缩放后的坐标:', {
        left, top, width, height,
        originalLeft: rect.left,
        originalTop: rect.top,
        originalWidth: rect.width,
        originalHeight: rect.height
      })

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
    console.log('CanvasPage: 接收到截图，准备传递给ChatPanel', { 
      imageDataLength: imageData?.length,
      prompt: prompt,
      chatPanelRefExists: !!chatPanelRef.current
    })
    chatPanelRef.current?.handleReceiveScreenshot(imageData, prompt)
  }

  // 检查ChatPanel组件是否正常加载
  useEffect(() => {
    console.log('CanvasPage: ChatPanel组件初始化检查', {
      chatPanelRef: chatPanelRef.current,
      componentMounted: true
    })
  }, [])

  // 监听画布对象选中事件（图片选中）- 优化版本，避免多个面板同时显示
  useEffect(() => {
    if (!fabricCanvas) return

    let currentSelectedImage: any = null

    const handleSelectionCreated = (options: any) => {
      const selectedObject = options.target
      if (selectedObject) {
        console.log('对象被选中 - 详细信息:', {
          type: selectedObject.type,
          isImage: selectedObject.type === 'image',
          isImageObject: selectedObject._element?.tagName === 'IMG',
          src: selectedObject._element?.src,
          _originalElement: selectedObject._originalElement?.tagName,
          objectKeys: Object.keys(selectedObject).filter(key => !key.startsWith('_')),
          object: selectedObject
        })
        
        // 更准确的图片对象检测
        const isImageObject = 
          selectedObject.type === 'image' || 
          (selectedObject._element && selectedObject._element.tagName === 'IMG') ||
          (selectedObject.src && typeof selectedObject.src === 'string') ||
          (selectedObject._originalElement && selectedObject._originalElement.tagName === 'IMG') ||
          (selectedObject.toDataURL && typeof selectedObject.toDataURL === 'function')
        
        if (isImageObject) {
          console.log('✅ 检测到图片对象，显示操作按钮')
          // 清除之前的选中状态
          if (currentSelectedImage && currentSelectedImage !== selectedObject) {
            fabricCanvas.discardActiveObject()
          }
          currentSelectedImage = selectedObject
          setSelectedImage(selectedObject)
        } else {
          console.log('❌ 不是图片对象，清除选中状态')
          // 如果是其他对象，清除图片选中状态
          currentSelectedImage = null
          setSelectedImage(null)
        }
      }
    }

    const handleSelectionCleared = () => {
      console.log('选中被清除')
      currentSelectedImage = null
      setSelectedImage(null)
    }

    const handleMouseDown = (options: any) => {
      // 点击画布空白区域时清除选中
      if (!options.target) {
        console.log('点击画布空白区域，清除图片选中')
        currentSelectedImage = null
        setSelectedImage(null)
      } else {
        console.log('点击对象:', {
          type: options.target.type,
          isImage: options.target.type === 'image'
        })
      }
    }

    // 添加对象添加事件监听，确保新上传的图片也能被检测到
    const handleObjectAdded = (options: any) => {
      const addedObject = options.target
      if (addedObject && (addedObject.type === 'image' || 
          (addedObject._element && addedObject._element.tagName === 'IMG'))) {
        console.log('图片对象被添加到画布:', addedObject)
      }
    }

    // 添加鼠标点击事件，确保点击图片时能正确选中
    const handleMouseUp = (options: any) => {
      if (options.target) {
        console.log('鼠标抬起，选中对象:', {
          type: options.target.type,
          isImage: options.target.type === 'image'
        })
        
        // 如果是图片对象，确保选中状态正确
        if (options.target.type === 'image') {
          // 如果已经选中了其他图片，先清除选中
          if (currentSelectedImage && currentSelectedImage !== options.target) {
            fabricCanvas.discardActiveObject()
          }
          currentSelectedImage = options.target
          setSelectedImage(options.target)
        }
      }
    }

    fabricCanvas.on('selection:created', handleSelectionCreated)
    fabricCanvas.on('selection:cleared', handleSelectionCleared)
    fabricCanvas.on('mouse:down', handleMouseDown)
    fabricCanvas.on('mouse:up', handleMouseUp)
    fabricCanvas.on('object:added', handleObjectAdded)

    return () => {
      fabricCanvas.off('selection:created', handleSelectionCreated)
      fabricCanvas.off('selection:cleared', handleSelectionCleared)
      fabricCanvas.off('mouse:down', handleMouseDown)
      fabricCanvas.off('mouse:up', handleMouseUp)
      fabricCanvas.off('object:added', handleObjectAdded)
    }
  }, [fabricCanvas])

  // AI 生成占位逻辑（与 ChatPanel 的模拟一致）
  const handleGenerateImage = async (prompt: string, model: string, position: { x: number; y: number }) => {
    // 这里可对接真实后端/模型；先由 ChatPanel 自身模拟
    console.log('请求生成图片:', { prompt, model, position })
    
    // 模拟生成图片并添加到画布
    if (fabricCanvas && fabricNSRef.current) {
      try {
        const F = fabricNSRef.current
        
        // 创建模拟的AI生成图片（使用SVG作为占位符）
        const svgData = `
          <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="#f3f4f6"/>
            <text x="100" y="100" font-family="Arial" font-size="14" fill="#666" text-anchor="middle">AI生成图片</text>
            <text x="100" y="120" font-family="Arial" font-size="12" fill="#999" text-anchor="middle">${prompt.substring(0, 20)}...</text>
          </svg>
        `
        
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml' })
        const svgUrl = URL.createObjectURL(svgBlob)
        
        // 使用HTML Image元素加载图片
        const img = new Image()
        img.onload = () => {
          const fabricImg = new F.Image(img, {
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
          const maxSize = 200
          const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
          fabricImg.scale(scale)
          
          // 添加到画布
          fabricCanvas.add(fabricImg)
          fabricCanvas.setActiveObject(fabricImg)
          fabricCanvas.renderAll()
          
          // 清理URL
          URL.revokeObjectURL(svgUrl)
          
          console.log('AI生成图片已添加到画布，位置:', position)
        }
        
        img.onerror = (error) => {
          console.error('图片加载失败:', error)
          // 如果SVG加载失败，创建一个矩形作为占位符
          const placeholderRect = new F.Rect({
            left: position.x,
            top: position.y,
            width: 200,
            height: 200,
            fill: '#f3f4f6',
            stroke: '#3b82f6',
            strokeWidth: 2,
            selectable: true,
            hasControls: true
          })
          
          // 添加文字标签
          const text = new F.Text(prompt.substring(0, 20) + '...', {
            left: position.x + 10,
            top: position.y + 90,
            fontSize: 14,
            fill: '#666',
            selectable: false
          })
          
          fabricCanvas.add(placeholderRect)
          fabricCanvas.add(text)
          fabricCanvas.renderAll()
        }
        
        img.src = svgUrl
        
      } catch (error) {
        console.error('生成图片失败:', error)
      }
    }
  }
  const handleGenerateVideo = async (prompt: string) => {
    console.log('请求生成视频:', prompt)
  }

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
      // 将图片对象转换为DataURL
      const imageData = imageObject.toDataURL({
        format: 'png',
        quality: 0.8
      })
      
      // 发送到聊天面板
      console.log('图片已添加到聊天:', imageData)
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
      console.error('添加到聊天失败:', error)
    }
  }

  // 处理基于图片生成内容 - 直接调用生图接口并加载到画布
  const handleGenerateFromImage = async (imageObject: any, prompt: string, model: string, aspectRatio: string) => {
    let loadingImage: any = null
    
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
      
      console.log('开始生成图片:', { prompt, model, selectedPosition, newImagePosition })
      
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
      console.log('图片生成任务创建成功，任务ID:', taskId)
      
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
      console.error('生成图片失败:', error)
      
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
        console.log('已移除生成中的预加载图片')
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
          const maxSize = 400
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
    const ratioMap: Record<string, string> = {
      '1:1': '1024x1024',
      '16:9': '1024x576',
      '9:16': '576x1024',
      '4:3': '1024x768',
      '3:4': '768x1024'
    }
    
    return ratioMap[aspectRatio] || '1024x1024'
  }
  
  // 将图片对象转换为Base64格式
  const convertImageToBase64 = async (imageObject: any): Promise<string | null> => {
    return new Promise((resolve) => {
      try {
        // 使用Fabric.js的toDataURL方法将图片转换为Base64
        const dataURL = imageObject.toDataURL({
          format: 'png',
          quality: 0.8
        })
        
        // 提取Base64数据部分（去掉data:image/png;base64,前缀）
        const base64Data = dataURL.split(',')[1]
        resolve(base64Data)
      } catch (error) {
        console.error('图片转换Base64失败:', error)
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
          
          console.log('加载中占位图片已添加到画布，位置:', position)
          resolve(fabricImg)
          
        } catch (error) {
          console.error('添加加载中占位图片失败:', error)
          reject(error)
        }
      }
      
      img.onerror = (error) => {
        console.error('加载中占位图片加载失败:', error)
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
      
      // 创建实际图片元素
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
          const maxSize = 400
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
      }
      
      img.onerror = (error) => {
        console.error('实际图片加载失败:', error)
        reject(new Error('实际图片加载失败'))
      }
      
      img.src = actualImageUrl
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
    
    console.log('手动层级管理 - 操作:', operation, '活动对象:', activeObject)
    
    const objects = fabricCanvas.getObjects()
    const currentIndex = objects.indexOf(activeObject)
    
    if (currentIndex === -1) {
      console.log('手动层级管理 - 对象不在画布中')
      return
    }
    
    console.log('手动层级管理 - 当前索引:', currentIndex, '对象总数:', objects.length)
    
    // 移除当前对象
    fabricCanvas.remove(activeObject)
    
    // 使用更兼容的方法重新添加对象到指定位置
    switch (operation) {
      case 'bringToFront':
        // 置顶：直接添加到画布（默认添加到顶部）
        fabricCanvas.add(activeObject)
        console.log('手动层级管理 - 置顶完成')
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
        console.log('手动层级管理 - 置底完成')
        break
      case 'bringForward':
        // 上移一层：与后一个对象交换位置
        if (currentIndex < objects.length - 1) {
          const nextObject = objects[currentIndex + 1]
          fabricCanvas.remove(nextObject)
          fabricCanvas.add(activeObject)
          fabricCanvas.add(nextObject)
          console.log('手动层级管理 - 上移一层完成')
        } else {
          console.log('手动层级管理 - 已经在最顶层，无法上移')
        }
        break
      case 'sendBackward':
        // 下移一层：与前一个对象交换位置
        if (currentIndex > 0) {
          const prevObject = objects[currentIndex - 1]
          fabricCanvas.remove(prevObject)
          fabricCanvas.add(activeObject)
          fabricCanvas.add(prevObject)
          console.log('手动层级管理 - 下移一层完成')
        } else {
          console.log('手动层级管理 - 已经在最底层，无法下移')
        }
        break
    }
    
    // 重新选中对象
    fabricCanvas.setActiveObject(activeObject)
    // 重新渲染画布
    fabricCanvas.renderAll()
    console.log('手动层级管理 - 操作完成')
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
        console.error('置顶操作失败:', error)
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
        console.error('置底操作失败:', error)
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
        console.error('上移一层操作失败:', error)
        manualLayerManagement('bringForward')
      }
    }
  }

  const handleSendBackward = () => {
    if (!fabricCanvas) return
    const activeObject = fabricCanvas.getActiveObject()
    if (activeObject) {
      try {
        if (fabricCanvas.sendBackwards) {
          fabricCanvas.sendBackwards(activeObject)
        } else {
          manualLayerManagement('sendBackward')
        }
        fabricCanvas.renderAll()
        handleCloseContextMenu()
      } catch (error) {
        console.error('下移一层操作失败:', error)
        manualLayerManagement('sendBackward')
      }
    }
  }

  return (
    <div className="w-full h-screen bg-gray-50 dark:bg-gray-900 relative" onClick={handleCloseContextMenu}>
      {/* 画布区域 - 铺满整个屏幕 */}
      <div className="absolute inset-0" onContextMenu={handleContextMenu}>
        <div className="bg-white dark:bg-gray-800 w-full h-full">
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* 顶部工具栏 - 悬浮在画板上方 */}
      <div className="absolute top-0 left-0 right-0 z-20">
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

      {/* 右键菜单 */}
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