'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { 
  Palette, Wand2, Image as ImageIcon, Download, ZoomIn, ZoomOut, RotateCcw,
  ArrowLeft, Sun, Moon, Languages, LogOut, ChevronDown, Upload,
  Brush, Eraser, Type, Square, Circle, Settings as SettingsIcon, Save, Trash2
} from 'lucide-react'

// 导入JSON数据
import adCreationData from '@/data/ad-creation.json'

type CreationMode = 'generate' | 'edit' | 'mask'
type DrawingTool = 'select' | 'brush' | 'eraser' | 'text' | 'rectangle' | 'circle'
type MaskType = 'rectangle' | 'circle' | 'gradient' | 'blur' | 'color'

interface DrawingState {
  isDrawing: boolean
  lastX: number
  lastY: number
  tool: DrawingTool
  brushSize: number
  brushColor: string
  text: string
}

interface MaskState {
  isActive: boolean
  type: MaskType
  color: string
  opacity: number
  radius: number
  brushSize: number
  points: { x: number; y: number }[]
  startX: number
  startY: number
  endX: number
  endY: number
}

interface ImagePosition {
  x: number
  y: number
  width: number
  height: number
  originalWidth: number
  originalHeight: number
  isSelected: boolean
}

export default function AdCreationPage() {
  const router = useRouter()
  const { isAuthenticated, logout } = useAuthStore()
  const { userInfo, theme, setTheme, language, setLanguage, clearUserInfo } = useUserStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [creationMode, setCreationMode] = useState<CreationMode>('generate')
  const [zoomLevel, setZoomLevel] = useState(100)
  const [prompt, setPrompt] = useState('')
  const [referenceImages, setReferenceImages] = useState<File[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [canvasContext, setCanvasContext] = useState<CanvasRenderingContext2D | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    tool: 'brush',
    brushSize: 5,
    brushColor: '#000000',
    text: ''
  })
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [showDrawingTools, setShowDrawingTools] = useState(false)
  const [savedAds, setSavedAds] = useState<Array<{
    id: string
    title: string
    timestamp: string
    imageData: string
  }>>([])
  const [imagePositions, setImagePositions] = useState<ImagePosition[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [isMovingImage, setIsMovingImage] = useState(false)
  const [cachedImages, setCachedImages] = useState<HTMLImageElement[]>([])
  const [maskState, setMaskState] = useState<MaskState>({
    isActive: false,
    type: 'rectangle',
    color: '#000000',
    opacity: 0.5,
    radius: 10,
    brushSize: 20,
    points: [],
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0
  })
  const [masks, setMasks] = useState<MaskState[]>([])
  const [showMaskTools, setShowMaskTools] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // 初始化画板和响应式尺寸
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (ctx) {
          setCanvasContext(ctx)
          
          // 获取画板容器尺寸
          const container = canvas.parentElement?.parentElement // 获取最外层的容器
          if (container) {
            const containerRect = container.getBoundingClientRect()
            
            // 设置Canvas尺寸为容器尺寸的95%，留出一些边距
            const canvasWidth = Math.max(containerRect.width * 0.95, 600)
            const canvasHeight = Math.max(containerRect.height * 0.95, 400)
            
            // 保持宽高比，以宽度为基准
            const aspectRatio = 1200 / 800 // 原始宽高比
            const heightBasedOnWidth = canvasWidth / aspectRatio
            
            // 如果计算出的高度超过了容器高度，则以高度为基准
            if (heightBasedOnWidth > canvasHeight) {
              canvas.width = canvasHeight * aspectRatio
              canvas.height = canvasHeight
            } else {
              canvas.width = canvasWidth
              canvas.height = heightBasedOnWidth
            }
            
            // 设置画板背景
            ctx.fillStyle = theme === 'dark' ? '#1f2937' : '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            // 添加初始文本
            ctx.fillStyle = theme === 'dark' ? '#9ca3af' : '#6b7280'
            ctx.font = '16px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('上传图片开始创作', canvas.width / 2, canvas.height / 2)
          }
        }
      }
    }

    updateCanvasSize()
    
    // 监听窗口大小变化
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [canvasRef, theme])

  // 处理拖拽上传
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter(file => 
        file.type.startsWith('image/')
      )
      
      if (imageFiles.length > 0) {
        const newImages = imageFiles.slice(0, 2 - referenceImages.length)
        setReferenceImages(prev => [...prev, ...newImages])
      }
    }
  }

  // 检查鼠标是否在图片区域内
  const isPointInImage = (x: number, y: number, imagePos: ImagePosition): boolean => {
    return x >= imagePos.x && 
           x <= imagePos.x + imagePos.width && 
           y >= imagePos.y && 
           y <= imagePos.y + imagePos.height
  }

  // 获取缩放后的鼠标坐标
  const getScaledMouseCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    const scale = zoomLevel / 100
    
    // 直接使用Canvas的实际尺寸计算坐标
    const x = (e.clientX - rect.left) / scale
    const y = (e.clientY - rect.top) / scale
    
    return { 
      x: Math.max(0, Math.min(x, canvas.width)), 
      y: Math.max(0, Math.min(y, canvas.height))
    }
  }

  // 画板鼠标事件处理
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasContext) return
    
    const { x, y } = getScaledMouseCoordinates(e)
    
    if (creationMode === 'edit') {
      // 编辑模式：根据当前工具执行不同操作
      if (drawingState.tool === 'select') {
        // 选择工具：检查是否点击了图片
        let imageClicked = false
        let clickedIndex = -1
        
        // 先找到被点击的图片
        imagePositions.forEach((pos, index) => {
          if (isPointInImage(x, y, pos)) {
            imageClicked = true
            clickedIndex = index
          }
        })
        
        if (imageClicked && clickedIndex !== -1) {
          // 选中图片
          setSelectedImageIndex(clickedIndex)
          setIsMovingImage(true)
          
          // 记录初始点击位置相对于图片左上角的偏移量
          setDrawingState(prev => ({
            ...prev,
            lastX: x - imagePositions[clickedIndex].x, // 点击位置相对于图片左上角的X偏移
            lastY: y - imagePositions[clickedIndex].y  // 点击位置相对于图片左上角的Y偏移
          }))
        } else {
          // 如果没有点击图片，取消选中
          setSelectedImageIndex(null)
          setIsMovingImage(false)
        }
      } else {
        // 画笔或文字工具：开始绘图
        setDrawingState(prev => ({
          ...prev,
          isDrawing: true,
          lastX: x,
          lastY: y
        }))

        if (drawingState.tool === 'brush') {
          // 直接绘制第一个点
          canvasContext.beginPath()
          canvasContext.arc(x, y, drawingState.brushSize / 2, 0, Math.PI * 2)
          canvasContext.fillStyle = drawingState.brushColor
          canvasContext.fill()
        }
      }
    } else if (creationMode === 'mask') {
      // 遮罩模式：开始画笔绘制
      setMaskState(prev => ({
        ...prev,
        isActive: true,
        startX: x,
        startY: y,
        endX: x,
        endY: y,
        points: [{ x, y }] // 记录第一个点
      }))
    }
  }

  // 使用useRef来优化性能，避免频繁重绘
  const lastDrawTimeRef = useRef(0)
  const animationFrameRef = useRef<number>()
  
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getScaledMouseCoordinates(e)
    
    if (isMovingImage && selectedImageIndex !== null && canvasContext && canvasRef.current) {
      const canvas = canvasRef.current
      
      // 计算新的图片位置（基于初始点击位置的偏移量）
      const newX = Math.max(0, Math.min(x - drawingState.lastX, canvas.width - imagePositions[selectedImageIndex].width))
      const newY = Math.max(0, Math.min(y - drawingState.lastY, canvas.height - imagePositions[selectedImageIndex].height))
      
      // 清除画板并重绘所有内容
      canvasContext.fillStyle = theme === 'dark' ? '#1f2937' : '#ffffff'
      canvasContext.fillRect(0, 0, canvas.width, canvas.height)
      
      // 使用缓存的图片进行绘制，包括移动的图片
      imagePositions.forEach((position, index) => {
        const cachedImg = cachedImages[index]
        if (cachedImg) {
          // 如果是正在移动的图片，使用新位置
          const drawX = index === selectedImageIndex ? newX : position.x
          const drawY = index === selectedImageIndex ? newY : position.y
          
          canvasContext.drawImage(cachedImg, drawX, drawY, position.width, position.height)
          
          // 如果图片被选中，绘制选择框
          if (index === selectedImageIndex) {
            canvasContext.strokeStyle = '#3b82f6'
            canvasContext.lineWidth = 2
            canvasContext.setLineDash([5, 5])
            canvasContext.strokeRect(
              drawX - 2,
              drawY - 2,
              position.width + 4,
              position.height + 4
            )
            canvasContext.setLineDash([])
          }
        }
      })
      
      // 绘制遮罩
      drawMasks()
    } else if (drawingState.isDrawing && canvasContext) {
      // 性能优化：使用requestAnimationFrame和节流
      const now = Date.now()
      if (now - lastDrawTimeRef.current < 16) { // 大约60fps
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        
        animationFrameRef.current = requestAnimationFrame(() => {
          if (drawingState.tool === 'brush') {
            // 使用真实的Canvas坐标，不应用缩放变换
            canvasContext.beginPath()
            canvasContext.moveTo(drawingState.lastX, drawingState.lastY)
            canvasContext.lineTo(x, y)
            canvasContext.lineWidth = drawingState.brushSize
            canvasContext.strokeStyle = drawingState.brushColor
            canvasContext.lineCap = 'round'
            canvasContext.stroke()
          }
          
          setDrawingState(prev => ({
            ...prev,
            lastX: x,
            lastY: y
          }))
          
          lastDrawTimeRef.current = now
        })
      } else {
        // 直接绘制
        if (drawingState.tool === 'brush') {
          canvasContext.beginPath()
          canvasContext.moveTo(drawingState.lastX, drawingState.lastY)
          canvasContext.lineTo(x, y)
          canvasContext.lineWidth = drawingState.brushSize
          canvasContext.strokeStyle = drawingState.brushColor
          canvasContext.lineCap = 'round'
          canvasContext.stroke()
        }
        
        setDrawingState(prev => ({
          ...prev,
          lastX: x,
          lastY: y
        }))
        
        lastDrawTimeRef.current = now
      }
    } else if (maskState.isActive && creationMode === 'mask') {
      // 遮罩模式：画笔绘制 - 添加新点
      setMaskState(prev => ({
        ...prev,
        endX: x,
        endY: y,
        points: [...prev.points, { x, y }]
      }))
      
      // 实时重绘遮罩预览
      redrawCanvas()
    }
  }

  const handleCanvasMouseUp = (e?: React.MouseEvent<HTMLCanvasElement>) => {
    if (isMovingImage && selectedImageIndex !== null && canvasContext) {
      // 图片移动结束，获取当前鼠标位置
      let finalX = 0, finalY = 0
      
      if (e) {
        // 如果有鼠标事件，使用真实坐标
        const { x, y } = getScaledMouseCoordinates(e)
        finalX = x
        finalY = y
      } else {
        // 如果没有鼠标事件（比如鼠标离开），使用最后记录的坐标
        finalX = drawingState.lastX + imagePositions[selectedImageIndex].x
        finalY = drawingState.lastY + imagePositions[selectedImageIndex].y
      }
      
      const canvas = canvasRef.current
      if (canvas) {
        // 计算最终位置
        const newX = Math.max(0, Math.min(finalX - drawingState.lastX, canvas.width - imagePositions[selectedImageIndex].width))
        const newY = Math.max(0, Math.min(finalY - drawingState.lastY, canvas.height - imagePositions[selectedImageIndex].height))
        
        // 更新图片位置状态
        const updatedPositions = imagePositions.map((pos, index) => 
          index === selectedImageIndex ? { ...pos, x: newX, y: newY } : pos
        )
        setImagePositions(updatedPositions)
      }
    } else if (maskState.isActive && creationMode === 'mask') {
      // 遮罩模式：完成画笔绘制
      if (maskState.points.length > 1) {
        // 只有当有绘制路径时才保存
        setMasks(prev => [...prev, { ...maskState }])
      }
      
      // 重置遮罩状态
      setMaskState(prev => ({
        ...prev,
        isActive: false,
        points: [],
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0
      }))
    }
    
    setDrawingState(prev => ({ ...prev, isDrawing: false }))
    setIsMovingImage(false)
  }

  // 当参考图片变化时，重新计算图片位置并预加载图片
  useEffect(() => {
    if (referenceImages.length > 0) {
      const newPositions: ImagePosition[] = []
      const newCachedImages: HTMLImageElement[] = []
      
      // 预加载所有图片
      const loadPromises = referenceImages.map((image, index) => {
        return new Promise<void>((resolve) => {
          const img = new window.Image()
          img.onload = () => {
            const canvas = canvasRef.current
            if (!canvas) {
              resolve()
              return
            }
            
            let width, height, x, y
            
            if (referenceImages.length === 1) {
              // 单张图片：居中显示，保持宽高比，最大填充画板
              const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.9
              width = img.width * scale
              height = img.height * scale
              x = (canvas.width - width) / 2
              y = (canvas.height - height) / 2
            } else {
              // 多张图片：网格布局，保持居中
              const maxWidth = canvas.width / 2 - 20
              const maxHeight = canvas.height / 2 - 20
              width = img.width
              height = img.height
              
              // 保持宽高比缩放
              if (width > maxWidth) {
                height = (height * maxWidth) / width
                width = maxWidth
              }
              if (height > maxHeight) {
                width = (width * maxHeight) / height
                height = maxHeight
              }
              
              // 计算居中位置 - 2x2网格布局
              const cols = 2
              const rows = Math.ceil(referenceImages.length / cols)
              const cellWidth = canvas.width / cols
              const cellHeight = canvas.height / rows
              
              const col = index % cols
              const row = Math.floor(index / cols)
              x = col * cellWidth + (cellWidth - width) / 2
              y = row * cellHeight + (cellHeight - height) / 2
            }
            
            newPositions[index] = {
              x,
              y,
              width,
              height,
              originalWidth: img.width,
              originalHeight: img.height,
              isSelected: false
            }
            newCachedImages[index] = img
            resolve()
          }
          img.src = URL.createObjectURL(image)
        })
      })
      
      // 所有图片加载完成后更新状态
      Promise.all(loadPromises).then(() => {
        setImagePositions(newPositions)
        setCachedImages(newCachedImages)
      })
    } else {
      setImagePositions([])
      setSelectedImageIndex(null)
      setCachedImages([])
    }
  }, [referenceImages])

  // 绘制遮罩
  const drawMasks = () => {
    if (!canvasContext) return
    
    // 绘制已保存的遮罩
    masks.forEach((mask) => {
      canvasContext.globalAlpha = mask.opacity
      
      // 使用画笔绘制模式 - 绘制路径点
      if (mask.points && mask.points.length > 1) {
        canvasContext.beginPath()
        canvasContext.moveTo(mask.points[0].x, mask.points[0].y)
        
        // 连接所有点形成路径
        for (let i = 1; i < mask.points.length; i++) {
          canvasContext.lineTo(mask.points[i].x, mask.points[i].y)
        }
        
        canvasContext.strokeStyle = mask.color
        canvasContext.lineWidth = mask.brushSize || 20
        canvasContext.lineCap = 'round'
        canvasContext.lineJoin = 'round'
        canvasContext.stroke()
      } else {
        // 向后兼容：原有的矩形/圆形遮罩
        switch (mask.type) {
          case 'rectangle':
            canvasContext.fillStyle = mask.color
            canvasContext.fillRect(mask.startX, mask.startY, mask.endX - mask.startX, mask.endY - mask.startY)
            break
          case 'circle':
            const centerX = (mask.startX + mask.endX) / 2
            const centerY = (mask.startY + mask.endY) / 2
            const radius = Math.sqrt(Math.pow(mask.endX - mask.startX, 2) + Math.pow(mask.endY - mask.startY, 2)) / 2
            
            canvasContext.beginPath()
            canvasContext.arc(centerX, centerY, radius, 0, 2 * Math.PI)
            canvasContext.fillStyle = mask.color
            canvasContext.fill()
            break
          case 'blur':
            canvasContext.fillStyle = 'rgba(0, 0, 0, 0.3)'
            canvasContext.fillRect(mask.startX, mask.startY, mask.endX - mask.startX, mask.endY - mask.startY)
            break
          case 'color':
            canvasContext.fillStyle = mask.color
            canvasContext.fillRect(mask.startX, mask.startY, mask.endX - mask.startX, mask.endY - mask.startY)
            break
        }
      }
      
      canvasContext.globalAlpha = 1
    })
    
    // 绘制当前正在创建的遮罩（预览）
    if (maskState.isActive && maskState.points && maskState.points.length > 1) {
      canvasContext.globalAlpha = maskState.opacity * 0.7 // 预览透明度降低
      
      canvasContext.beginPath()
      canvasContext.moveTo(maskState.points[0].x, maskState.points[0].y)
      
      // 连接所有点形成路径
      for (let i = 1; i < maskState.points.length; i++) {
        canvasContext.lineTo(maskState.points[i].x, maskState.points[i].y)
      }
      
      canvasContext.strokeStyle = maskState.color
      canvasContext.lineWidth = maskState.brushSize || 20
      canvasContext.lineCap = 'round'
      canvasContext.lineJoin = 'round'
      canvasContext.stroke()
      
      canvasContext.globalAlpha = 1
    }
  }

  // 重绘画板逻辑 - 只在必要的时候重绘
  const redrawCanvas = (positions = imagePositions, selectedIndex = selectedImageIndex) => {
    if (!canvasContext || !canvasRef.current) return
    
    const canvas = canvasRef.current
    // 清除画板
    canvasContext.fillStyle = theme === 'dark' ? '#1f2937' : '#ffffff'
    canvasContext.fillRect(0, 0, canvas.width, canvas.height)
    
    if (referenceImages.length > 0 && positions.length > 0 && cachedImages.length > 0) {
      // 使用缓存的图片进行绘制
      positions.forEach((position, index) => {
        const cachedImg = cachedImages[index]
        if (cachedImg) {
          canvasContext.drawImage(cachedImg, position.x, position.y, position.width, position.height)
          
          // 如果图片被选中，绘制选择框
          if (index === selectedIndex) {
            canvasContext.strokeStyle = '#3b82f6'
            canvasContext.lineWidth = 2
            canvasContext.setLineDash([5, 5])
            canvasContext.strokeRect(
              position.x - 2,
              position.y - 2,
              position.width + 4,
              position.height + 4
            )
            canvasContext.setLineDash([])
          }
        }
      })
      
      // 绘制遮罩
      drawMasks()
    } else {
      // 如果没有图片，显示提示文本
      canvasContext.fillStyle = theme === 'dark' ? '#9ca3af' : '#6b7280'
      canvasContext.font = '16px Arial'
      canvasContext.textAlign = 'center'
      canvasContext.fillText('上传图片开始创作', canvas.width / 2, canvas.height / 2)
    }
  }

  // 重绘效果依赖项
  useEffect(() => {
    if (canvasContext) {
      redrawCanvas()
    }
  }, [canvasContext, theme, referenceImages, imagePositions, selectedImageIndex])

  if (!isAuthenticated || !userInfo) {
    return null
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('请输入提示词')
      return
    }

    setIsGenerating(true)
    // 模拟生成过程
    setTimeout(() => {
      setIsGenerating(false)
      // 这里应该集成实际的AI生成逻辑
      alert('广告生成成功！')
    }, 2000)
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 10))
  }

  const handleReset = () => {
    setZoomLevel(100)
    setPrompt('')
    setReferenceImages([])
    setPreviewImage(null)
    if (canvasContext && canvasRef.current) {
      const canvas = canvasRef.current
      canvasContext.fillStyle = theme === 'dark' ? '#1f2937' : '#ffffff'
      canvasContext.fillRect(0, 0, canvas.width, canvas.height)
      canvasContext.fillStyle = theme === 'dark' ? '#9ca3af' : '#6b7280'
      canvasContext.font = '16px Arial'
      canvasContext.textAlign = 'center'
      canvasContext.fillText('上传图片开始创作', canvas.width / 2, canvas.height / 2)
    }
  }

  // 清屏功能 - 根据当前模式清除相应内容
  const handleClearCanvas = () => {
    if (canvasContext && canvasRef.current) {
      const canvas = canvasRef.current
      
      if (creationMode === 'edit') {
        // 编辑模式：清除所有绘制内容但保留图片
        canvasContext.clearRect(0, 0, canvas.width, canvas.height)
        
        // 重置背景
        canvasContext.fillStyle = theme === 'dark' ? '#1f2937' : '#ffffff'
        canvasContext.fillRect(0, 0, canvas.width, canvas.height)
        
        // 重新绘制图片（如果有）
        if (referenceImages.length > 0 && imagePositions.length > 0 && cachedImages.length > 0) {
          imagePositions.forEach((position, index) => {
            const cachedImg = cachedImages[index]
            if (cachedImg) {
              canvasContext.drawImage(cachedImg, position.x, position.y, position.width, position.height)
              
              // 如果图片被选中，重新绘制选择框
              if (index === selectedImageIndex) {
                canvasContext.strokeStyle = '#3b82f6'
                canvasContext.lineWidth = 2
                canvasContext.setLineDash([5, 5])
                canvasContext.strokeRect(
                  position.x - 2,
                  position.y - 2,
                  position.width + 4,
                  position.height + 4
                )
                canvasContext.setLineDash([])
              }
            }
          })
        } else {
          // 如果没有图片，显示提示文本
          canvasContext.fillStyle = theme === 'dark' ? '#9ca3af' : '#6b7280'
          canvasContext.font = '16px Arial'
          canvasContext.textAlign = 'center'
          canvasContext.fillText('上传图片开始创作', canvas.width / 2, canvas.height / 2)
        }
        
        // 清除所有遮罩
        setMasks([])
        
      } else if (creationMode === 'mask') {
        // 遮罩模式：立即清除画板上的遮罩，然后异步更新状态
        // 先清除整个画布并重绘背景和图片（不绘制遮罩）
        canvasContext.clearRect(0, 0, canvas.width, canvas.height)
        
        // 重置背景
        canvasContext.fillStyle = theme === 'dark' ? '#1f2937' : '#ffffff'
        canvasContext.fillRect(0, 0, canvas.width, canvas.height)
        
        // 重新绘制图片（如果有）
        if (referenceImages.length > 0 && imagePositions.length > 0 && cachedImages.length > 0) {
          imagePositions.forEach((position, index) => {
            const cachedImg = cachedImages[index]
            if (cachedImg) {
              canvasContext.drawImage(cachedImg, position.x, position.y, position.width, position.height)
              
              // 如果图片被选中，重新绘制选择框
              if (index === selectedImageIndex) {
                canvasContext.strokeStyle = '#3b82f6'
                canvasContext.lineWidth = 2
                canvasContext.setLineDash([5, 5])
                canvasContext.strokeRect(
                  position.x - 2,
                  position.y - 2,
                  position.width + 4,
                  position.height + 4
                )
                canvasContext.setLineDash([])
              }
            }
          })
        } else {
          // 如果没有图片，显示提示文本
          canvasContext.fillStyle = theme === 'dark' ? '#9ca3af' : '#6b7280'
          canvasContext.font = '16px Arial'
          canvasContext.textAlign = 'center'
          canvasContext.fillText('上传图片开始创作', canvas.width / 2, canvas.height / 2)
        }
        
        // 然后清除所有遮罩状态
        setMasks([])
        
        // 重置当前遮罩状态
        setMaskState(prev => ({
          ...prev,
          isActive: false,
          points: [],
          startX: 0,
          startY: 0,
          endX: 0,
          endY: 0
        }))
      } else {
        // 生成模式：清除所有内容
        canvasContext.clearRect(0, 0, canvas.width, canvas.height)
        
        // 重置背景
        canvasContext.fillStyle = theme === 'dark' ? '#1f2937' : '#ffffff'
        canvasContext.fillRect(0, 0, canvas.width, canvas.height)
        
        // 如果没有图片，显示提示文本
        canvasContext.fillStyle = theme === 'dark' ? '#9ca3af' : '#6b7280'
        canvasContext.font = '16px Arial'
        canvasContext.textAlign = 'center'
        canvasContext.fillText('上传图片开始创作', canvas.width / 2, canvas.height / 2)
        
        // 清除所有遮罩
        setMasks([])
      }
    }
  }

  const handleDownload = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const link = document.createElement('a')
      link.download = `广告创作_${new Date().getTime()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
  }

  const handleSave = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const imageData = canvas.toDataURL('image/png')
      
      const newAd = {
        id: Date.now().toString(),
        title: prompt || '未命名广告',
        timestamp: new Date().toLocaleString(),
        imageData: imageData
      }
      
      setSavedAds(prev => [newAd, ...prev.slice(0, 9)]) // 最多保存10个
      alert('广告已保存到历史记录！')
    }
  }

  const handlePreview = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      setPreviewImage(canvas.toDataURL('image/png'))
    }
  }

  const handleLoadAd = (ad: typeof savedAds[0]) => {
    if (canvasContext && canvasRef.current) {
      const canvas = canvasRef.current
      const img = new window.Image()
      img.onload = () => {
        canvasContext.clearRect(0, 0, canvas.width, canvas.height)
        canvasContext.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      img.src = ad.imageData
      setPrompt(ad.title)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const newImages = Array.from(files).slice(0, 2 - referenceImages.length)
      setReferenceImages(prev => [...prev, ...newImages])
    }
  }

  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleToggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const handleToggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh')
  }

  const handleLogout = () => {
    logout()
    clearUserInfo()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航栏 */}
      <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* 左侧：返回按钮和标题 */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/user')}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>返回</span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">W</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  广告创作
                </span>
              </div>
            </div>
            
            {/* 右侧功能区 */}
            <div className="flex items-center space-x-3">
              {/* 国际化切换 */}
              <button 
                onClick={handleToggleLanguage}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="切换语言"
              >
                <Languages className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              {/* 主题切换 */}
              <button 
                onClick={handleToggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="切换主题"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              {/* 用户菜单 */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-3 py-2 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <img 
                      src={userInfo.avatar} 
                      alt={userInfo.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {userInfo.username}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* 用户菜单卡片 */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-2">
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>退出登录</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区域 */}
      <div className="h-[calc(100vh-80px)]">
        <div className="flex h-full">
          {/* 左侧面板 - 提示词编辑器 */}
          <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* 创作模式选择 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">创作模式</h3>
                <div className="grid grid-cols-3 gap-2">
                  {adCreationData.creationModes.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setCreationMode(mode.id as CreationMode)}
                      className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                        creationMode === mode.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className={`text-2xl mb-1 ${
                        creationMode === mode.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {mode.icon}
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {mode.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 参考图片上传 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">参考图片</h3>
                <div className="space-y-3">
                  {referenceImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt="参考图片"
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeReferenceImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  
                  {referenceImages.length < 2 && (
                    <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        点击上传图片 ({referenceImages.length}/2)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        multiple
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* 提示词输入 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  提示词描述
                </h3>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="详细描述您想要生成的广告内容..."
                  className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              {/* 高级设置 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">高级设置</h3>
                <div className="space-y-3">
                  {adCreationData.advancedSettings.map((setting) => (
                    <div key={setting.id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{setting.label}</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{setting.value}</span>
                      </div>
                      <input
                        type="range"
                        min={setting.min}
                        max={setting.max}
                        defaultValue={setting.value}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 生成按钮 */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>生成中...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>生成广告</span>
                  </>
                )}
              </button>
            </div>
          </div>

            {/* 中间画布区域 */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* 画布工具栏 */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* 缩放控制 */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleZoomOut}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        disabled={zoomLevel <= 10}
                      >
                        <ZoomOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[50px] text-center">
                        {zoomLevel}%
                      </span>
                      <button
                        onClick={handleZoomIn}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        disabled={zoomLevel >= 200}
                      >
                        <ZoomIn className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={handleReset}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <RotateCcw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>

                    {/* 清屏按钮 - 对所有模式可见 */}
                    <div className="flex items-center space-x-2 border-l border-gray-200 dark:border-gray-600 pl-4">
                      <button
                        onClick={handleClearCanvas}
                        className="flex items-center space-x-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-800/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                        title={creationMode === 'edit' ? '清屏（清除所有绘制内容）' : creationMode === 'mask' ? '清屏（清除所有遮罩）' : '清屏（清除所有内容）'}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm font-medium">清屏</span>
                      </button>
                    </div>

                    {/* 编辑模式工具 - 仅在编辑模式下显示 */}
                    {creationMode === 'edit' && (
                      <div className="flex items-center space-x-2 border-l border-gray-200 dark:border-gray-600 pl-4">
                        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                          {/* 选择工具 */}
                          <button
                            onClick={() => setDrawingState(prev => ({ ...prev, tool: 'select' }))}
                            className={`p-2 rounded-md transition-colors ${
                              drawingState.tool === 'select' 
                                ? 'bg-white dark:bg-gray-600 shadow-sm' 
                                : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            title="选择工具（移动图片）"
                          >
                            <Square className={`w-4 h-4 ${
                              drawingState.tool === 'select' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                            }`} />
                          </button>
                          
                          {/* 自由画笔 */}
                          <button
                            onClick={() => setDrawingState(prev => ({ ...prev, tool: 'brush' }))}
                            className={`p-2 rounded-md transition-colors ${
                              drawingState.tool === 'brush' 
                                ? 'bg-white dark:bg-gray-600 shadow-sm' 
                                : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            title="自由画笔"
                          >
                            <Brush className={`w-4 h-4 ${
                              drawingState.tool === 'brush' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                            }`} />
                          </button>
                          
                          {/* 文字工具 */}
                          <button
                            onClick={() => setDrawingState(prev => ({ ...prev, tool: 'text' }))}
                            className={`p-2 rounded-md transition-colors ${
                              drawingState.tool === 'text' 
                                ? 'bg-white dark:bg-gray-600 shadow-sm' 
                                : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            title="文字工具"
                          >
                            <Type className={`w-4 h-4 ${
                              drawingState.tool === 'text' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                            }`} />
                          </button>
                        </div>
                        
                        {/* 画笔设置 */}
                        {drawingState.tool === 'brush' && (
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={drawingState.brushColor}
                              onChange={(e) => setDrawingState(prev => ({ ...prev, brushColor: e.target.value }))}
                              className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                            />
                            <input
                              type="range"
                              min="1"
                              max="20"
                              value={drawingState.brushSize}
                              onChange={(e) => setDrawingState(prev => ({ ...prev, brushSize: parseInt(e.target.value) }))}
                              className="w-20"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400">{drawingState.brushSize}px</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 遮罩模式工具 - 仅在遮罩模式下显示 */}
                    {creationMode === 'mask' && (
                      <div className="flex items-center space-x-2 border-l border-gray-200 dark:border-gray-600 pl-4">
                        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
                          {/* 遮罩画笔大小设置 */}
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">遮罩大小</span>
                            <input
                              type="range"
                              min="5"
                              max="100"
                              value={maskState.brushSize}
                              onChange={(e) => setMaskState(prev => ({ ...prev, brushSize: parseInt(e.target.value) }))}
                              className="w-24"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[35px]">{maskState.brushSize}px</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handleDownload}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all duration-200"
                  >
                    <Download className="w-4 h-4" />
                    <span>下载广告</span>
                  </button>
                </div>
              </div>

              {/* 画布区域 */}
              <div className="flex-1 bg-gray-100 dark:bg-gray-900 overflow-hidden p-0 m-0">
                <div className="w-full h-full flex items-center justify-center p-0 m-0">
                  <div className="relative w-full h-full flex items-center justify-center p-0 m-0">
                    <div 
                      className="absolute inset-0 flex items-center justify-center p-0 m-0"
                      style={{ 
                        transform: `scale(${zoomLevel / 100})`,
                        transformOrigin: 'center center'
                      }}
                    >
                      <canvas
                        ref={canvasRef}
                        width={1200}
                        height={800}
                        className="max-w-full max-h-full bg-white dark:bg-gray-800 shadow-lg rounded-lg"
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={() => handleCanvasMouseUp()}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* 右侧面板 - 历史记录 */}
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* 当前变体 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">当前变体</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded flex items-center justify-center text-gray-400">
                    暂无生成内容
                  </div>
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    生成广告后，这里将显示当前变体
                  </div>
                </div>
              </div>

              {/* 历史记录 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">历史记录</h3>
                <div className="space-y-3">
                  {adCreationData.history.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded flex items-center justify-center">
                        <span className="text-2xl">{item.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {item.time}
                        </div>
                      </div>
                      <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-500 rounded transition-colors">
                        <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}