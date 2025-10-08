'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Pencil, 
  Shapes,
  Square, 
  Circle, 
  Triangle,
  Star,
  Heart,
  Diamond,
  Octagon,
  ArrowRight,
  Minus,
  Braces,
  Type, 
  Eraser, 
  Image as ImageIcon,
  Download,
  Upload,
  Save,
  RotateCcw,
  RotateCw,
  MousePointer2,
  Hand,
  ArrowUpRight,
  ArrowLeft,
  Sun,
  Moon,
  Languages,
  User,
  Layers,
  ArrowUp,
  ArrowDown,
  MoveUp,
  MoveDown
} from 'lucide-react'
import TextToolPanel from './TextToolPanel'
import { useUserStore } from '../stores/userStore'
import { useRouter } from 'next/navigation'
import SaveProjectModal from './SaveProjectModal'

interface CanvasToolbarProps {
  canvas: any
  onCaptureArea: () => Promise<string | null>
  selectedArea: any
}

type Tool = 'pencil' | 'shapes' | 'text' | 'eraser' | 'image' | 'hand' | 'arrow' | 'layers'
type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'star' | 'heart' | 'diamond' | 'octagon' | 'arrow' | 'line' | 'dashed-line' | 'left-brace' | 'right-brace'

export default function CanvasToolbar({ canvas, onCaptureArea, selectedArea }: CanvasToolbarProps) {
  const [activeTool, setActiveTool] = useState<Tool>('pencil')
  const [brushSize, setBrushSize] = useState(3)
  const [brushColor, setBrushColor] = useState('#000000')
  const [showShapePicker, setShowShapePicker] = useState(false)
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const shapePickerRef = useRef<HTMLDivElement>(null)
  const [history, setHistory] = useState<any[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [showTextToolPanel, setShowTextToolPanel] = useState(false)
  const [textToolPosition, setTextToolPosition] = useState({ left: 0, top: 0 })
  const textToolRef = useRef<HTMLDivElement>(null)
  const { theme, language, setTheme, setLanguage, userInfo } = useUserStore()
  const router = useRouter()
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showLayerPanel, setShowLayerPanel] = useState(false)
  const layerPanelRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭形状选择卡片和层级面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shapePickerRef.current && !shapePickerRef.current.contains(event.target as Node)) {
        setShowShapePicker(false)
      }
      if (textToolRef.current && !textToolRef.current.contains(event.target as Node)) {
        setShowTextToolPanel(false)
      }
      if (layerPanelRef.current && !layerPanelRef.current.contains(event.target as Node)) {
        setShowLayerPanel(false)
      }
    }

    if (showShapePicker || showTextToolPanel || showLayerPanel) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showShapePicker, showTextToolPanel, showLayerPanel])

  // 删除选中的对象
  const handleDeleteSelected = () => {
    if (!canvas) return
    
    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length > 0) {
      // 保存当前状态到历史记录
      saveCanvasState()
      
      // 删除所有选中的对象
      canvas.remove(...activeObjects)
      canvas.discardActiveObject()
      canvas.requestRenderAll()
    }
  }

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!canvas) return
      
      const activeObject = canvas.getActiveObject()
      
      // 如果当前选中的是文字对象且处于编辑模式，让Backspace键逐个删除字符
      if (activeObject && activeObject.isEditing && event.key === 'Backspace') {
        // 让Fabric.js处理文字编辑的Backspace逻辑
        return
      }
      
      // 处理Delete键删除选中的对象（Backspace在编辑模式下不删除对象）
      if (event.key === 'Delete') {
        event.preventDefault()
        handleDeleteSelected()
      }
      
      // 处理Backspace键（非编辑模式下删除选中的对象）
      if (event.key === 'Backspace' && (!activeObject || !activeObject.isEditing)) {
        event.preventDefault()
        handleDeleteSelected()
      }
      
      // 层级操作快捷键
      if (activeObject && event.ctrlKey) {
        switch (event.key) {
          case ']': // Ctrl + ] - 上移一层
            event.preventDefault()
            handleBringForward()
            break
          case '[': // Ctrl + [ - 下移一层
            event.preventDefault()
            handleSendBackward()
            break
          case '}': // Ctrl + Shift + ] - 置顶
            if (event.shiftKey) {
              event.preventDefault()
              handleBringToFront()
            }
            break
          case '{': // Ctrl + Shift + [ - 置底
            if (event.shiftKey) {
              event.preventDefault()
              handleSendToBack()
            }
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [canvas])

  // 保存画布状态到历史记录
  const saveCanvasState = () => {
    if (!canvas || !(window as any).fabric) return
    
    // 深拷贝画布对象以避免引用共享问题
    const currentState = canvas._objects.map(obj => {
      if (!obj) return null
      return (window as any).fabric?.util?.object?.clone(obj) || obj
    }).filter(obj => obj !== null)
    
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(currentState)
    
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  // 设置画板移动功能
  useEffect(() => {
    if (!canvas) return
    
    let isPanning = false
    let lastPosX = 0
    let lastPosY = 0
    
    const handleMouseDown = (opt: any) => {
      if (activeTool === 'hand') {
        const evt = opt.e
        isPanning = true
        canvas.defaultCursor = 'grabbing'
        canvas.hoverCursor = 'grabbing'
        lastPosX = evt.clientX
        lastPosY = evt.clientY
      }
    }
    
    const handleMouseMove = (opt: any) => {
      if (isPanning && activeTool === 'hand') {
        const evt = opt.e
        const deltaX = evt.clientX - lastPosX
        const deltaY = evt.clientY - lastPosY
        
        // 移动视口
        const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0]
        vpt[4] += deltaX
        vpt[5] += deltaY
        
        canvas.setViewportTransform(vpt)
        canvas.requestRenderAll()
        
        lastPosX = evt.clientX
        lastPosY = evt.clientY
      }
    }
    
    const handleMouseUp = () => {
      if (activeTool === 'hand') {
        isPanning = false
        canvas.defaultCursor = 'grab'
        canvas.hoverCursor = 'grab'
      }
    }
    
    canvas.on('mouse:down', handleMouseDown)
    canvas.on('mouse:move', handleMouseMove)
    canvas.on('mouse:up', handleMouseUp)
    
    return () => {
      canvas.off('mouse:down', handleMouseDown)
      canvas.off('mouse:move', handleMouseMove)
      canvas.off('mouse:up', handleMouseUp)
    }
  }, [canvas, activeTool])

  // 监听画板缩放事件
  useEffect(() => {
    if (!canvas) return
    
    const updateZoomLevel = () => {
      const vpt = canvas.viewportTransform
      if (vpt) {
        // 计算缩放比例（viewportTransform[0] 是X轴缩放因子）
        const scale = vpt[0] * 100
        setZoomLevel(Math.round(scale))
      }
    }
    
    // 初始更新
    updateZoomLevel()
    
    // 监听鼠标滚轮缩放事件
    canvas.on('mouse:wheel', updateZoomLevel)
    
    return () => {
      canvas.off('mouse:wheel', updateZoomLevel)
    }
  }, [canvas])

  // 当画布内容变化时保存状态
  useEffect(() => {
    if (!canvas) return
    
    // 初始化时保存空状态
    if (history.length === 0) {
      saveCanvasState()
    }
    
    const handleObjectAdded = () => {
      saveCanvasState()
    }
    
    const handleObjectRemoved = () => {
      saveCanvasState()
    }
    
    // 双击文字对象进入编辑模式
    const handleMouseDown = (options: any) => {
      if (options.target && options.target.type === 'textbox') {
        // 双击时进入编辑模式
        if (options.e.detail === 2) {
          options.target.enterEditing()
          canvas.requestRenderAll()
        }
      }
    }
    
    canvas.on('object:added', handleObjectAdded)
    canvas.on('object:removed', handleObjectRemoved)
    canvas.on('mouse:down', handleMouseDown)
    
    return () => {
      canvas.off('object:added', handleObjectAdded)
      canvas.off('object:removed', handleObjectRemoved)
      canvas.off('mouse:down', handleMouseDown)
    }
  }, [canvas, history, historyIndex])

  const tools = [
    { id: 'hand' as Tool, icon: Hand, label: '移动画板' },
    { id: 'pencil' as Tool, icon: Pencil, label: '画笔' },
    { id: 'arrow' as Tool, icon: ArrowUpRight, label: '箭头' },
    { id: 'shapes' as Tool, icon: Shapes, label: '形状' },
    { id: 'text' as Tool, icon: Type, label: '文字' },
    { id: 'eraser' as Tool, icon: Eraser, label: '橡皮擦' },
    { id: 'image' as Tool, icon: ImageIcon, label: '图片' },
    { id: 'layers' as Tool, icon: Layers, label: '层级管理' },
  ]

  const shapes = [
    { id: 'rectangle' as ShapeType, icon: Square, label: '矩形' },
    { id: 'circle' as ShapeType, icon: Circle, label: '圆形' },
    { id: 'triangle' as ShapeType, icon: Triangle, label: '三角形' },
    { id: 'star' as ShapeType, icon: Star, label: '星星' },
    { id: 'heart' as ShapeType, icon: Heart, label: '心形' },
    { id: 'diamond' as ShapeType, icon: Diamond, label: '菱形' },
    { id: 'octagon' as ShapeType, icon: Octagon, label: '八边形' },
    { id: 'arrow' as ShapeType, icon: ArrowRight, label: '箭头' },
    { id: 'line' as ShapeType, icon: Minus, label: '直线' },
    { id: 'dashed-line' as ShapeType, icon: Minus, label: '虚线' },
    { id: 'left-brace' as ShapeType, icon: Braces, label: '左大括号' },
    { id: 'right-brace' as ShapeType, icon: Braces, label: '右大括号' },
  ]

  const handleToolSelect = (tool: Tool) => {
    setActiveTool(tool)
    
    if (!canvas) {
      console.warn('Canvas is not available')
      return
    }

    console.log('Selected tool:', tool)
    
    switch (tool) {
      case 'pencil':
        canvas.isDrawingMode = true
        setIsDrawingMode(true)
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.width = brushSize
          canvas.freeDrawingBrush.color = brushColor
        }
        canvas.defaultCursor = 'crosshair'
        canvas.hoverCursor = 'crosshair'
        console.log('Pencil mode activated')
        break
      case 'shapes':
        // 禁用绘图模式以支持选择区域功能
        canvas.isDrawingMode = false
        setIsDrawingMode(false)
        canvas.defaultCursor = 'crosshair'
        canvas.hoverCursor = 'crosshair'
        setShowShapePicker(true)
        console.log('Shapes mode activated')
        break
      case 'eraser':
        canvas.isDrawingMode = true
        setIsDrawingMode(true)
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.width = brushSize
          canvas.freeDrawingBrush.color = '#ffffff'
        }
        canvas.defaultCursor = 'crosshair'
        canvas.hoverCursor = 'crosshair'
        console.log('Eraser mode activated')
        break
      case 'text':
        canvas.isDrawingMode = false
        setIsDrawingMode(false)
        // 计算文字工具面板位置
        const textToolButton = document.querySelector('[data-tool="text"]') as HTMLElement
        if (textToolButton) {
          const rect = textToolButton.getBoundingClientRect()
          setTextToolPosition({
            left: rect.left,
            top: rect.bottom + 10
          })
        }
        canvas.defaultCursor = 'text'
        canvas.hoverCursor = 'text'
        setShowTextToolPanel(true)
        console.log('Text mode activated')
        break
      case 'image':
        canvas.isDrawingMode = false
        setIsDrawingMode(false)
        // 直接调用新的图片上传函数
        handleImageUpload()
        canvas.defaultCursor = 'default'
        canvas.hoverCursor = 'default'
        console.log('Image upload triggered')
        break
      case 'hand':
        canvas.isDrawingMode = false
        setIsDrawingMode(false)
        // 启用画板移动功能
        canvas.selection = false
        canvas.defaultCursor = 'grab'
        canvas.hoverCursor = 'grab'
        console.log('Hand mode activated - canvas can be moved')
        break
      case 'arrow':
        canvas.isDrawingMode = false
        setIsDrawingMode(false)
        // 启用选择模式
        canvas.selection = true
        canvas.defaultCursor = 'crosshair'
        canvas.hoverCursor = 'pointer'
        console.log('Arrow mode activated - selection enabled')
        break
      case 'layers':
        canvas.isDrawingMode = false
        setIsDrawingMode(false)
        // 启用选择模式
        canvas.selection = true
        canvas.defaultCursor = 'default'
        canvas.hoverCursor = 'default'
        setShowLayerPanel(true)
        console.log('Layers mode activated')
        break
      default:
        canvas.isDrawingMode = false
        setIsDrawingMode(false)
        // 恢复正常的画布行为
        canvas.selection = true
        canvas.defaultCursor = 'default'
        canvas.hoverCursor = 'default'
        console.log('Default mode activated')
        break
    }
    
    // 强制重新渲染画布
    canvas.renderAll()
  }

  const handleAddShape = (shape: ShapeType) => {
    if (!canvas || !(window as any).fabric) {
      console.warn('Canvas or fabric is not available for adding shape')
      return
    }

    console.log('Adding shape:', shape)
    
    // 获取画布中心位置
    const centerX = canvas.width! / 2
    const centerY = canvas.height! / 2

    // 统一的形状配置
    const shapeConfig = {
      fill: 'transparent',
      stroke: brushColor,
      strokeWidth: brushSize,
    }

    let shapeObj

    switch (shape) {
      case 'rectangle':
        shapeObj = new (window as any).fabric.Rect({
          ...shapeConfig,
          width: 100,
          height: 100,
          left: centerX - 50,
          top: centerY - 50,
        })
        break
      case 'circle':
        shapeObj = new (window as any).fabric.Circle({
          ...shapeConfig,
          radius: 50,
          left: centerX,
          top: centerY,
        })
        break
      case 'triangle':
        shapeObj = new (window as any).fabric.Triangle({
          ...shapeConfig,
          width: 100,
          height: 100,
          left: centerX - 50,
          top: centerY - 50,
        })
        break
      case 'star':
        const starPoints = []
        const numPoints = 5
        const innerRadius = 30
        const outerRadius = 50
        
        for (let i = 0; i < numPoints * 2; i++) {
          const angle = (i * Math.PI) / numPoints
          const radius = i % 2 === 0 ? outerRadius : innerRadius
          starPoints.push({
            x: 50 + radius * Math.sin(angle),
            y: 50 + radius * Math.cos(angle)
          })
        }
        
        shapeObj = new (window as any).fabric.Polygon(starPoints, {
          ...shapeConfig,
          left: centerX,
          top: centerY,
        })
        break
      case 'heart':
        const heartPath = 'M 50 30 C 70 10, 90 30, 90 50 C 90 70, 70 90, 50 90 C 30 90, 10 70, 10 50 C 10 30, 30 10, 50 30 Z'
        shapeObj = new (window as any).fabric.Path(heartPath, {
          ...shapeConfig,
          left: centerX - 40,
          top: centerY - 40,
          scaleX: 0.8,
          scaleY: 0.8,
        })
        break
      case 'diamond':
        shapeObj = new (window as any).fabric.Polygon([
          { x: 50, y: 0 },
          { x: 100, y: 50 },
          { x: 50, y: 100 },
          { x: 0, y: 50 }
        ], {
          ...shapeConfig,
          left: centerX - 50,
          top: centerY - 50,
        })
        break
      case 'octagon':
        shapeObj = new (window as any).fabric.Polygon([
          { x: 30, y: 0 },
          { x: 70, y: 0 },
          { x: 100, y: 30 },
          { x: 100, y: 70 },
          { x: 70, y: 100 },
          { x: 30, y: 100 },
          { x: 0, y: 70 },
          { x: 0, y: 30 }
        ], {
          ...shapeConfig,
          left: centerX - 50,
          top: centerY - 50,
        })
        break
      case 'arrow':
        // 创建箭头形状
        shapeObj = new (window as any).fabric.Polyline([
          { x: 0, y: 25 },
          { x: 75, y: 25 },
          { x: 75, y: 0 },
          { x: 100, y: 25 },
          { x: 75, y: 50 },
          { x: 75, y: 25 }
        ], {
          ...shapeConfig,
          left: centerX - 50,
          top: centerY - 25,
          fill: brushColor,
          stroke: brushColor,
        })
        break
      case 'line':
        // 创建直线
        shapeObj = new (window as any).fabric.Line([0, 0, 100, 0], {
          ...shapeConfig,
          left: centerX - 50,
          top: centerY,
        })
        break
      case 'dashed-line':
        // 创建虚线
        shapeObj = new (window as any).fabric.Line([0, 0, 100, 0], {
          ...shapeConfig,
          left: centerX - 50,
          top: centerY,
          strokeDashArray: [5, 5], // 虚线样式
        })
        break
      case 'left-brace':
        // 创建左大括号 - 更清晰的路径
        shapeObj = new (window as any).fabric.Path('M 40 10 C 20 10 10 20 10 40 C 10 60 20 70 40 70', {
          ...shapeConfig,
          left: centerX - 25,
          top: centerY - 35,
          fill: 'transparent',
        })
        break
      case 'right-brace':
        // 创建右大括号 - 更清晰的路径
        shapeObj = new (window as any).fabric.Path('M 10 10 C 30 10 40 20 40 40 C 40 60 30 70 10 70', {
          ...shapeConfig,
          left: centerX - 25,
          top: centerY - 35,
          fill: 'transparent',
        })
        break
      default:
        return
    }

    canvas.add(shapeObj)
    canvas.setActiveObject(shapeObj)
    setShowShapePicker(false)
  }

  const handleBrushSizeChange = (size: number) => {
    setBrushSize(size)
    if (canvas?.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = size
    }
  }

  const handleColorChange = (color: string) => {
    setBrushColor(color)
    if (canvas?.freeDrawingBrush && activeTool === 'pencil') {
      canvas.freeDrawingBrush.color = color
    }
  }



  const handleAddText = () => {
    if (!canvas || !(window as any).fabric) return

    // 获取画布中心位置
    const centerX = canvas.width! / 2
    const centerY = canvas.height! / 2

    const text = new (window as any).fabric.Textbox('双击编辑文字', {
      left: centerX - 50, // 居中
      top: centerY - 10,
      fontFamily: 'Arial',
      fill: brushColor,
      fontSize: 20,
      editable: true,
      textAlign: 'left'
    })

    canvas.add(text)
    canvas.setActiveObject(text)
  }

  // 重新实现图片上传功能 - 简化版本
  const handleImageUpload = () => {
    if (!canvas) {
      alert('画布未初始化，请稍后重试')
      return
    }
    
    const fabric = (window as any).fabric
    if (!fabric) {
      alert('画布引擎未加载，请刷新页面')
      return
    }
    
    // 创建文件输入元素
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'image/*'
    fileInput.style.display = 'none'
    
    fileInput.onchange = (event) => {
      const target = event.target as HTMLInputElement
      const file = target.files?.[0]
      
      if (!file) return
      
      // 清理文件输入值
      target.value = ''
      
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件')
        return
      }
      
      // 使用FileReader读取图片
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        
        // 使用HTML Image元素加载图片
        const img = new Image()
        img.onload = () => {
          // 创建Fabric图片对象
          const fabricImg = new fabric.Image(img)
          
          // 设置缩放比例
          const canvasWidth = canvas.getWidth()
          const canvasHeight = canvas.getHeight()
          const maxWidth = canvasWidth * 0.8
          const maxHeight = canvasHeight * 0.8
          const scaleX = maxWidth / img.width
          const scaleY = maxHeight / img.height
          const scale = Math.min(scaleX, scaleY, 1)
          
          fabricImg.scale(scale)
          
          // 设置位置为画布中心
          const centerX = canvasWidth / 2
          const centerY = canvasHeight / 2
          const scaledWidth = img.width * scale
          const scaledHeight = img.height * scale
          
          fabricImg.set({
            left: centerX - scaledWidth / 2,
            top: centerY - scaledHeight / 2,
            selectable: true,
            hasControls: true
          })
          
          // 添加到画布
          canvas.add(fabricImg)
          canvas.setActiveObject(fabricImg)
          canvas.requestRenderAll()
          
          // 保存状态
          saveCanvasState()
        }
        
        img.onerror = () => {
          alert('图片加载失败，请重试')
        }
        
        img.src = imageUrl
      }
      
      reader.onerror = () => {
        alert('文件读取失败，请重试')
      }
      
      reader.readAsDataURL(file)
    }
    
    // 触发文件选择
    document.body.appendChild(fileInput)
    fileInput.click()
    
    // 清理
    setTimeout(() => {
      if (document.body.contains(fileInput)) {
        document.body.removeChild(fileInput)
      }
    }, 1000)
  }

  // 保存画板功能 - 打开保存弹窗
  const [projectData, setProjectData] = useState<any>(null)
  
  const handleSave = () => {
    // 检查当前是否是编辑模式
    const urlParams = new URLSearchParams(window.location.search)
    const editMode = urlParams.get('edit') === 'true'
    const projectId = urlParams.get('projectId')
    
    let data = null
    
    if (editMode && projectId) {
      // 获取现有的项目记录
      const existingProjects = JSON.parse(localStorage.getItem('userProjects') || '[]')
      const currentProject = existingProjects.find((p: any) => p.id === projectId)
      
      if (currentProject) {
        data = {
          name: currentProject.name,
          icon: currentProject.icon,
          description: currentProject.description || '',
          tags: currentProject.tags || []
        }
      }
    }
    
    setProjectData(data)
    setShowSaveModal(true)
  }

  // 处理保存项目
  const handleSaveProject = async (projectData: { name: string; icon: string; description?: string; tags?: string[] }) => {
    const projectName = projectData.name
    const projectIcon = projectData.icon
    const projectDescription = projectData.description || ''
    const projectTags = projectData.tags || []
    if (!canvas) return
    
    try {
      // 检查当前是否是编辑模式
      const urlParams = new URLSearchParams(window.location.search)
      const editMode = urlParams.get('edit') === 'true'
      const projectId = urlParams.get('projectId')
      
      // 生成画布预览图
      const previewDataURL = canvas.toDataURL({
        format: 'png',
        quality: 0.8
      })
      
      // 获取画布数据（序列化）
      const canvasData = JSON.stringify(canvas.toJSON())
      
      // 获取AI助手对话记录
      let aiConversation = []
      try {
        const chatHistory = localStorage.getItem('chatHistory')
        if (chatHistory) {
          aiConversation = JSON.parse(chatHistory)
        }
      } catch (error) {
        // 静默处理错误
      }
      
      // 获取AI生成的内容
      const generatedImages = []
      const aiGeneratedElements = document.querySelectorAll('[data-ai-generated]')
      aiGeneratedElements.forEach((element, index) => {
        const img = element.querySelector('img')
        if (img && img.src) {
          generatedImages.push({
            id: index,
            src: img.src,
            alt: img.alt || 'AI生成图片',
            timestamp: new Date().toISOString()
          })
        }
      })
      
      // 获取当前AI助手设置
      const aiSettings = {
        brushSize: brushSize,
        brushColor: brushColor,
        activeTool: activeTool
      }
      
      // 获取现有的项目记录
      const existingProjects = JSON.parse(localStorage.getItem('userProjects') || '[]')
      
      let updatedProjects = []
      let projectRecord = {}
      
      const now = new Date()
      
      if (editMode && projectId) {
        // 编辑模式：覆盖原项目
        const projectIndex = existingProjects.findIndex((p: any) => p.id === projectId)
        if (projectIndex !== -1) {
          const originalProject = existingProjects[projectIndex]
          
          projectRecord = {
            ...originalProject,
            name: projectName,
            icon: projectIcon,
            description: projectDescription || originalProject.description || '',
            tags: projectTags.length > 0 ? projectTags : originalProject.tags || [],
            preview: previewDataURL,
            canvasData: canvasData,
            aiConversation: aiConversation,
            generatedContent: generatedImages,
            aiSettings: aiSettings,
            updatedAt: now.toISOString(),
            metadata: {
              ...originalProject.metadata,
              canvasObjectsCount: canvas.getObjects().length,
              hasAIInteraction: aiConversation.length > 0,
              hasGeneratedContent: generatedImages.length > 0,
              toolUsed: activeTool,
              brushSettings: {
                size: brushSize,
                color: brushColor
              }
            }
          }
          
          updatedProjects = [...existingProjects]
          updatedProjects[projectIndex] = projectRecord
        } else {
          // 如果找不到原项目，创建新项目
          projectRecord = {
            id: projectId,
            name: projectName,
            icon: projectIcon,
            description: projectDescription,
            tags: projectTags,
            preview: previewDataURL,
            canvasData: canvasData,
            aiConversation: aiConversation,
            generatedContent: generatedImages,
            aiSettings: aiSettings,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            metadata: {
              canvasObjectsCount: canvas.getObjects().length,
              hasAIInteraction: aiConversation.length > 0,
              hasGeneratedContent: generatedImages.length > 0,
              toolUsed: activeTool,
              brushSettings: {
                size: brushSize,
                color: brushColor
              }
            }
          }
          
          updatedProjects = [...existingProjects, projectRecord]
        }
      } else {
        // 新建模式：创建新项目
        projectRecord = {
          id: Date.now().toString(),
          name: projectName,
          icon: projectIcon,
          description: projectDescription,
          tags: projectTags,
          preview: previewDataURL,
          canvasData: canvasData,
          aiConversation: aiConversation,
          generatedContent: generatedImages,
          aiSettings: aiSettings,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          metadata: {
            canvasObjectsCount: canvas.getObjects().length,
            hasAIInteraction: aiConversation.length > 0,
            hasGeneratedContent: generatedImages.length > 0,
            toolUsed: activeTool,
            brushSettings: {
              size: brushSize,
              color: brushColor
            }
          }
        }
        
        updatedProjects = [...existingProjects, projectRecord]
      }
      
      // 保存到本地存储
      localStorage.setItem('userProjects', JSON.stringify(updatedProjects))
      
      // 同时保存聊天记录到单独的存储
      if (aiConversation.length > 0) {
        localStorage.setItem('chatHistory', JSON.stringify(aiConversation))
      }
      
      // 显示保存成功提示
      const projectNameStr = typeof name === 'string' ? name : '未命名项目'
      const saveMessage = editMode ? `项目已更新：${projectNameStr}` : `作品已保存到项目记录：${projectNameStr}`
      
      const notification = document.createElement('div')
      notification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 12px 16px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <strong>${editMode ? '更新成功！' : '保存成功！'}</strong><br>
          ${saveMessage}
        </div>
      `
      document.body.appendChild(notification)
      
      // 3秒后自动移除提示
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 3000)
      
      console.log('项目保存成功:', projectRecord)
      
      // 关闭弹窗
      setShowSaveModal(false)
      
      // 注意：保存项目后不应该清除聊天记录，因为聊天记录已经保存到项目中了
      // 只有在创建新项目时才需要重置聊天记录
      if (!editMode) {
        try {
          // 清除聊天记录（为新项目准备）
          localStorage.removeItem('chatHistory')
          
          // 通过ref调用ChatPanel的重置方法
          const chatPanel = document.querySelector('chat-panel') as any
          if (chatPanel && chatPanel.resetChat) {
            chatPanel.resetChat()
          }
          
          console.log('AI创作助手内容已重置，为新项目准备')
        } catch (error) {
          console.warn('重置AI创作助手失败:', error)
        }
      }
      
    } catch (error) {
      console.error('保存项目失败:', error)
      alert('保存失败，请重试')
    }
  }

  const handleUndo = () => {
    if (!canvas || historyIndex < 0) return
    
    const newIndex = historyIndex - 1
    const previousState = history[newIndex]
    
    // 清除当前画布并设置为纯白色背景
    canvas.clear()
    canvas.backgroundColor = '#ffffff'
    
    // 恢复之前的状态（可能为空数组，表示空画布）
    if (previousState && previousState.length > 0) {
      previousState.forEach(obj => {
        canvas.add(obj)
      })
    }
    
    canvas.renderAll()
    setHistoryIndex(newIndex)
  }

  const handleRedo = () => {
    if (!canvas || historyIndex >= history.length - 1) return
    
    const newIndex = historyIndex + 1
    const nextState = history[newIndex]
    
    // 清除当前画布并设置为纯白色背景
    canvas.clear()
    canvas.backgroundColor = '#ffffff'
    
    // 恢复下一个状态
    if (nextState) {
      nextState.forEach(obj => {
        canvas.add(obj)
      })
    }
    
    canvas.renderAll()
    setHistoryIndex(newIndex)
  }

  // 层级管理功能
  // 手动层级管理备用方案
  const manualLayerManagement = (operation: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward') => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (!activeObject) return
    
    console.log('手动层级管理 - 操作:', operation, '活动对象:', activeObject)
    
    const objects = canvas.getObjects()
    const currentIndex = objects.indexOf(activeObject)
    
    if (currentIndex === -1) {
      console.log('手动层级管理 - 对象不在画布中')
      return
    }
    
    console.log('手动层级管理 - 当前索引:', currentIndex, '对象总数:', objects.length)
    
    // 移除当前对象
    canvas.remove(activeObject)
    
    // 使用更兼容的方法重新添加对象到指定位置
    switch (operation) {
      case 'bringToFront':
        // 置顶：直接添加到画布（默认添加到顶部）
        canvas.add(activeObject)
        console.log('手动层级管理 - 置顶完成')
        break
      case 'sendToBack':
        // 置底：先移除所有对象，然后按顺序重新添加
        const allObjects = canvas.getObjects()
        canvas.clear()
        // 先添加当前对象（置底）
        canvas.add(activeObject)
        // 然后添加其他对象
        allObjects.forEach(obj => {
          if (obj !== activeObject) {
            canvas.add(obj)
          }
        })
        console.log('手动层级管理 - 置底完成')
        break
      case 'bringForward':
        // 上移一层：与后一个对象交换位置
        if (currentIndex < objects.length - 1) {
          const nextObject = objects[currentIndex + 1]
          canvas.remove(nextObject)
          canvas.add(activeObject)
          canvas.add(nextObject)
          console.log('手动层级管理 - 上移一层完成')
        } else {
          console.log('手动层级管理 - 已经在最顶层，无法上移')
        }
        break
      case 'sendBackward':
        // 下移一层：与前一个对象交换位置
        if (currentIndex > 0) {
          const prevObject = objects[currentIndex - 1]
          canvas.remove(prevObject)
          canvas.add(activeObject)
          canvas.add(prevObject)
          console.log('手动层级管理 - 下移一层完成')
        } else {
          console.log('手动层级管理 - 已经在最底层，无法下移')
        }
        break
    }
    
    // 重新选中对象
    canvas.setActiveObject(activeObject)
    // 重新渲染画布
    canvas.renderAll()
    console.log('手动层级管理 - 操作完成')
  }

  const handleBringToFront = () => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      saveCanvasState()
      console.log('置顶操作 - 活动对象:', activeObject)
      
      try {
        // 优先使用Fabric.js原生方法
        if (canvas.bringToFront) {
          console.log('使用Fabric.js置顶方法')
          canvas.bringToFront(activeObject)
        } else {
          console.log('使用手动层级管理置顶')
          manualLayerManagement('bringToFront')
        }
        canvas.renderAll()
        console.log('对象已置顶')
      } catch (error) {
        console.error('置顶操作失败:', error)
        console.log('使用备用方案置顶')
        manualLayerManagement('bringToFront')
      }
    }
  }

  const handleSendToBack = () => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      saveCanvasState()
      console.log('置底操作 - 活动对象:', activeObject)
      
      try {
        if (canvas.sendToBack) {
          console.log('使用Fabric.js置底方法')
          canvas.sendToBack(activeObject)
        } else {
          console.log('使用手动层级管理置底')
          manualLayerManagement('sendToBack')
        }
        canvas.renderAll()
        console.log('对象已置底')
      } catch (error) {
        console.error('置底操作失败:', error)
        console.log('使用备用方案置底')
        manualLayerManagement('sendToBack')
      }
    }
  }

  const handleBringForward = () => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      saveCanvasState()
      console.log('上移一层操作 - 活动对象:', activeObject)
      
      try {
        if (canvas.bringForward) {
          console.log('使用Fabric.js上移一层方法')
          canvas.bringForward(activeObject)
        } else {
          console.log('使用手动层级管理上移一层')
          manualLayerManagement('bringForward')
        }
        canvas.renderAll()
        console.log('对象已上移一层')
      } catch (error) {
        console.error('上移一层操作失败:', error)
        console.log('使用备用方案上移一层')
        manualLayerManagement('bringForward')
      }
    }
  }

  const handleSendBackward = () => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      saveCanvasState()
      console.log('下移一层操作 - 活动对象:', activeObject)
      
      try {
        if (canvas.sendBackwards) {
          console.log('使用Fabric.js下移一层方法')
          canvas.sendBackwards(activeObject)
        } else {
          console.log('使用手动层级管理下移一层')
          manualLayerManagement('sendBackward')
        }
        canvas.renderAll()
        console.log('对象已下移一层')
      } catch (error) {
        console.error('下移一层操作失败:', error)
        console.log('使用备用方案下移一层')
        manualLayerManagement('sendBackward')
      }
    }
  }

  // 获取所有对象的层级信息
  const getLayerInfo = () => {
    if (!canvas) return []
    return canvas.getObjects().map((obj: any, index: number) => ({
      id: obj.id || `obj-${index}`,
      type: obj.type || 'unknown',
      name: obj.name || `对象${index + 1}`,
      visible: obj.visible !== false,
      locked: obj.selectable === false,
      index: index
    }))
  }

  // 清除画板功能
  const handleClearCanvas = () => {
    if (!canvas) return
    
    // 保存当前状态到历史记录
    saveCanvasState()
    
    // 清除画板并设置为纯白色背景
    canvas.clear()
    canvas.backgroundColor = '#ffffff'
    canvas.renderAll()
    
    console.log('画板已清除')
  }

  // 处理画板缩放
  const handleZoomChange = (delta: number) => {
    if (!canvas) return
    
    const newZoomLevel = Math.max(10, Math.min(500, zoomLevel + delta))
    const scale = newZoomLevel / 100
    
    // 设置缩放比例
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0]
    vpt[0] = scale
    vpt[3] = scale
    
    canvas.setViewportTransform(vpt)
    canvas.requestRenderAll()
    setZoomLevel(newZoomLevel)
    
    console.log(`缩放比例: ${newZoomLevel}%`)
  }

  // 重置缩放比例
  const handleZoomReset = () => {
    if (!canvas) return
    
    // 重置到100%
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0]
    vpt[0] = 1
    vpt[3] = 1
    vpt[4] = 0  // 重置X轴偏移
    vpt[5] = 0  // 重置Y轴偏移
    
    canvas.setViewportTransform(vpt)
    canvas.requestRenderAll()
    setZoomLevel(100)
    
    console.log('缩放比例已重置为100%')
  }

  // 下载画板内容为JSON文件
  const handleDownloadCanvas = () => {
    if (!canvas) {
      alert('画布未初始化，无法下载')
      return
    }
    
    try {
      // 获取画布数据
      const canvasData = canvas.toJSON()
      
      // 添加元数据
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        canvasInfo: {
          width: canvas.width,
          height: canvas.height,
          backgroundColor: canvas.backgroundColor,
          zoomLevel: zoomLevel,
          objectCount: canvas.getObjects().length
        },
        canvasData: canvasData,
        metadata: {
          brushSettings: {
            size: brushSize,
            color: brushColor
          },
          activeTool: activeTool,
          theme: theme,
          language: language
        }
      }
      
      // 创建JSON字符串
      const jsonString = JSON.stringify(exportData, null, 2)
      
      // 创建Blob对象
      const blob = new Blob([jsonString], { type: 'application/json' })
      
      // 创建下载链接
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // 生成文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      a.download = `canvas-export-${timestamp}.json`
      
      // 触发下载
      document.body.appendChild(a)
      a.click()
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
      
      console.log('画板内容已导出为JSON文件')
      
      // 显示下载成功提示
      const notification = document.createElement('div')
      notification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 12px 16px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <strong>下载成功！</strong><br>
          画板内容已保存为JSON文件
        </div>
      `
      document.body.appendChild(notification)
      
      // 3秒后自动移除提示
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 3000)
      
    } catch (error) {
      console.error('下载画板失败:', error)
      alert('下载失败，请重试')
    }
  }

  // 导入画板内容从JSON文件
  const handleImportCanvas = () => {
    if (!canvas) {
      alert('画布未初始化，无法导入')
      return
    }
    
    // 创建文件输入元素
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.json'
    fileInput.style.display = 'none'
    
    fileInput.onchange = (event) => {
      const target = event.target as HTMLInputElement
      const file = target.files?.[0]
      
      if (!file) return
      
      // 清理文件输入值
      target.value = ''
      
      // 验证文件类型
      if (!file.name.endsWith('.json')) {
        alert('请选择JSON文件')
        return
      }
      
      // 使用FileReader读取文件
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const jsonContent = e.target?.result as string
          const importData = JSON.parse(jsonContent)
          
          // 验证文件格式
          if (!importData.canvasData || !importData.version) {
            alert('无效的画板文件格式')
            return
          }
          
          // 保存当前状态到历史记录
          saveCanvasState()
          
          // 清除当前画布
          canvas.clear()
          
          // 加载导入的画布数据
          canvas.loadFromJSON(importData.canvasData, () => {
            // 画布加载完成后的回调
            canvas.renderAll()
            
            // 强制重新渲染画布，确保内容立即显示
            setTimeout(() => {
              canvas.renderAll()
              // 触发一次画布重绘
              canvas.requestRenderAll()
            }, 100)
            
            // 恢复元数据设置
            if (importData.metadata) {
              const { brushSettings, theme: importTheme, language: importLanguage } = importData.metadata
              
              if (brushSettings) {
                setBrushSize(brushSettings.size || 3)
                setBrushColor(brushSettings.color || '#000000')
              }
              
              if (importTheme && importTheme !== theme) {
                setTheme(importTheme)
                // 立即应用到document
                if (typeof document !== 'undefined') {
                  if (importTheme === 'dark') {
                    document.documentElement.classList.add('dark')
                  } else {
                    document.documentElement.classList.remove('dark')
                  }
                }
              }
              
              if (importLanguage && importLanguage !== language) {
                setLanguage(importLanguage)
              }
            }
            
            // 恢复缩放设置
            if (importData.canvasInfo?.zoomLevel) {
              setZoomLevel(importData.canvasInfo.zoomLevel)
            }
            
            console.log('画板内容已成功导入')
            
            // 显示导入成功提示
            const notification = document.createElement('div')
            notification.innerHTML = `
              <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 12px 16px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <strong>导入成功！</strong><br>
                画板内容已从JSON文件加载
              </div>
            `
            document.body.appendChild(notification)
            
            // 3秒后自动移除提示
            setTimeout(() => {
              if (document.body.contains(notification)) {
                document.body.removeChild(notification)
              }
            }, 3000)
          })
          
        } catch (error) {
          console.error('导入画板失败:', error)
          alert('导入失败，文件格式可能不正确')
        }
      }
      
      reader.onerror = () => {
        alert('文件读取失败，请重试')
      }
      
      reader.readAsText(file)
    }
    
    // 触发文件选择
    document.body.appendChild(fileInput)
    fileInput.click()
    
    // 清理
    setTimeout(() => {
      if (document.body.contains(fileInput)) {
        document.body.removeChild(fileInput)
      }
    }, 1000)
  }

  const handleCaptureArea = async () => {
    const imageData = await onCaptureArea()
    if (imageData) {
      // 这里可以将截图发送到聊天面板
      console.log('Captured area:', imageData)
    }
  }

  // 返回用户项目页面
  const handleBackToUser = () => {
    router.push('/user/projects')
  }

  // 切换主题
  const handleToggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    
    // 立即应用到document
    if (typeof document !== 'undefined') {
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  // 切换语言
  const handleToggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh')
  }

  // 获取语言显示文本
  const getLanguageText = () => {
    return language === 'zh' ? '中文' : 'English'
  }

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-2 sm:px-4 py-2 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2 lg:gap-0 relative">
      {/* 形状选择卡片 */}
      {showShapePicker && (
        <div ref={shapePickerRef} className="absolute left-16 top-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-10">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">选择形状</h4>
            <button 
              onClick={() => setShowShapePicker(false)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {shapes.map((shape) => (
              <button
                key={shape.id}
                onClick={() => handleAddShape(shape.id)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex flex-col items-center min-w-[60px]"
                title={shape.label}
              >
                <shape.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center leading-tight">{shape.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 层级管理面板 */}
      {showLayerPanel && (
        <div ref={layerPanelRef} className="absolute right-16 top-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-10 w-64">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">层级管理</h4>
            <button 
              onClick={() => setShowLayerPanel(false)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
            >
              ×
            </button>
          </div>
          
          {/* 层级操作按钮 */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={handleBringToFront}
              className="flex items-center justify-center p-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              title="置顶 (Ctrl + Shift + ])"
            >
              <MoveUp className="h-3 w-3 mr-1" />
              置顶
              <span className="text-xs opacity-70 ml-1">Ctrl+Shift+]</span>
            </button>
            <button
              onClick={handleSendToBack}
              className="flex items-center justify-center p-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              title="置底 (Ctrl + Shift + [)"
            >
              <MoveDown className="h-3 w-3 mr-1" />
              置底
              <span className="text-xs opacity-70 ml-1">Ctrl+Shift+[</span>
            </button>
            <button
              onClick={handleBringForward}
              className="flex items-center justify-center p-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              title="上移一层 (Ctrl + ])"
            >
              <ArrowUp className="h-3 w-3 mr-1" />
              上移一层
              <span className="text-xs opacity-70 ml-1">Ctrl+]</span>
            </button>
            <button
              onClick={handleSendBackward}
              className="flex items-center justify-center p-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              title="下移一层 (Ctrl + [)"
            >
              <ArrowDown className="h-3 w-3 mr-1" />
              下移一层
              <span className="text-xs opacity-70 ml-1">Ctrl+[</span>
            </button>
          </div>
          
          {/* 层级列表 */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="flex justify-between items-center mb-2">
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300">对象层级</h5>
              <span className="text-xs text-gray-500 dark:text-gray-400">共 {getLayerInfo().length} 个对象</span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {getLayerInfo().length === 0 ? (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                  暂无对象
                </div>
              ) : (
                getLayerInfo().map((layer, index) => (
                  <div
                    key={layer.id}
                    className={`flex items-center justify-between p-1 text-xs rounded cursor-pointer ${
                      canvas?.getActiveObject()?.id === layer.id 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => {
                      // 点击层级项选中对应对象
                      const obj = canvas?.getObjects().find((o: any) => o.id === layer.id)
                      if (obj) {
                        canvas?.setActiveObject(obj)
                        canvas?.renderAll()
                      }
                    }}
                  >
                    <span className="truncate">{layer.name}</span>
                    <span className="text-gray-500 dark:text-gray-400">{layer.index + 1}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* 使用提示 */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <div className="font-medium mb-1">使用提示：</div>
              <div>• 右键点击对象可快速操作层级</div>
              <div>• 使用快捷键 Ctrl+[ ] 调整层级</div>
              <div>• 点击层级列表可选中对象</div>
            </div>
          </div>
        </div>
      )}

      {/* 文字工具面板 */}
      <TextToolPanel
        canvas={canvas}
        isVisible={showTextToolPanel}
        onClose={() => setShowTextToolPanel(false)}
        position={textToolPosition}
      />

      {/* 保存项目弹窗 */}
      <SaveProjectModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveProject}
        projectData={projectData}
      />

      {/* 左侧工具组 */}
      <div className="flex items-center justify-center lg:justify-start flex-wrap gap-1 lg:gap-2">
        {/* 返回按钮 */}
        <button
          onClick={handleBackToUser}
          className="p-1 lg:p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="返回用户页面"
        >
          <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5" />
        </button>
        
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolSelect(tool.id)}
            className={`p-1 lg:p-2 rounded-lg transition-colors ${
              activeTool === tool.id 
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title={tool.label}
            data-tool={tool.id}
          >
            <tool.icon className="h-4 w-4 lg:h-5 lg:w-5" />
          </button>
        ))}
      </div>

      {/* 中间控制组 */}
      <div className="flex items-center justify-center flex-wrap gap-2 lg:gap-4 mt-2 lg:mt-0">
        {/* 画笔大小 */}
        <div className="flex items-center space-x-1 lg:space-x-2">
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => handleBrushSizeChange(Number(e.target.value))}
            className="w-16 lg:w-20 dark:bg-gray-700 dark:border-gray-600"
          />
          <span className="text-xs lg:text-sm text-gray-600 dark:text-gray-300">{brushSize}px</span>
        </div>

        {/* 颜色选择 */}
        <div className="flex items-center space-x-1 lg:space-x-2">
          <input
            type="color"
            value={brushColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-6 h-6 lg:w-8 lg:h-8 rounded border border-gray-300 dark:border-gray-600"
          />
        </div>

        {/* 画板缩放控制 */}
        <div className="flex items-center space-x-1 lg:space-x-2">
          <button
            onClick={() => handleZoomChange(-10)}
            className="p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title="缩小"
          >
            <svg className="h-3 w-3 lg:h-4 lg:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={() => handleZoomReset()}
            className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-1 lg:px-2 py-1 rounded"
            title="重置缩放"
          >
            {zoomLevel}%
          </button>
          <button
            onClick={() => handleZoomChange(10)}
            className="p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title="放大"
          >
            <svg className="h-3 w-3 lg:h-4 lg:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>



      </div>

      {/* 右侧操作组 */}
      <div className="flex items-center justify-center lg:justify-end flex-wrap gap-1 lg:gap-2 mt-2 lg:mt-0">
        {/* 操作历史 */}
        <button
          onClick={handleUndo}
          className="p-1 lg:p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          title="撤销"
        >
          <RotateCcw className="h-4 w-4 lg:h-5 lg:w-5" />
        </button>
        <button
          onClick={handleClearCanvas}
          className="p-1 lg:p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          title="清除画板"
        >
          <svg className="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        {/* 保存 */}
        <button
          onClick={handleSave}
          className="p-1 lg:p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          title="保存画板"
        >
          <Save className="h-4 w-4 lg:h-5 lg:w-5" />
        </button>
        <button
          onClick={handleImportCanvas}
          className="p-1 lg:p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          title="导入画板(JSON)"
        >
          <Upload className="h-4 w-4 lg:h-5 lg:w-5" />
        </button>
        <button
          onClick={handleDownloadCanvas}
          className="p-1 lg:p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          title="下载画板(JSON)"
        >
          <Download className="h-4 w-4 lg:h-5 lg:w-5" />
        </button>

        {/* 主题切换按钮 */}
        <button
          onClick={handleToggleTheme}
          className="p-1 lg:p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          title={`切换到${theme === 'light' ? '深色' : '浅色'}主题`}
        >
          {theme === 'light' ? <Moon className="h-4 w-4 lg:h-5 lg:w-5" /> : <Sun className="h-4 w-4 lg:h-5 lg:w-5" />}
        </button>

        {/* 国际化按钮 */}
        <button
          onClick={handleToggleLanguage}
          className="p-1 lg:p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          title={`切换到${language === 'zh' ? 'English' : '中文'}`}
        >
          <Languages className="h-4 w-4 lg:h-5 lg:w-5" />
        </button>

        {/* 用户信息胶囊 */}
        {userInfo && (
          <div className="flex items-center space-x-1 lg:space-x-2 bg-gray-100 dark:bg-gray-800 rounded-full px-2 lg:px-3 py-1">
            {/* 消耗点数 */}
            <div className="flex items-center space-x-1">
              <span className="text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300">{userInfo.points}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">点</span>
            </div>
            
            {/* 分隔线 */}
            <div className="h-3 lg:h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
            
            {/* 用户头像 */}
            <div className="flex items-center">
              <img 
                src={userInfo.avatar} 
                alt={userInfo.username}
                className="w-4 h-4 lg:w-6 lg:h-6 rounded-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}