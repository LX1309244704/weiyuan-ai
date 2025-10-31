'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Video, Home, User, ArrowLeft } from 'lucide-react'

interface Storyboard {
  id: number
  title: string
  x: number
  y: number
  width: number
  height: number
  scriptText: string
  characterReferenceImage: string | null
  sceneReferenceImage: string | null
  cards: Card[]
  connections: Connection[]
}

interface Card {
  id: number
  type: 'image' | 'player'
  x: number
  y: number
  title?: string
  description?: string
  cameraMovement?: string
  imageUrl?: string
  isLoading?: boolean
  isReady?: boolean
  isPlaying?: boolean
  playlist?: Card[]
  currentFrame?: number
  thumbnailUrl?: string | null
}

interface Connection {
  from: number
  to: number
}

interface State {
  pan: { x: number; y: number }
  zoom: number
  isPanning: boolean
  panStart: { x: number; y: number }
  storyboards: Storyboard[]
  nextStoryboardId: number
  nextCardId: number
  activeModifyCardId: number | null
  activeExecuteStoryboardId: number | null
  characterReferenceImage: string | null
  sceneReferenceImage: string | null
  isConnecting: boolean
  connectionStart: { cardId: number; storyboardEl: HTMLElement; storyboardData: Storyboard } | null
  playbackIntervals: Record<number, NodeJS.Timeout>
  // 拖拽相关状态
  isDraggingStoryboard: boolean
  draggingStoryboardId: number | null
  dragStart: { x: number; y: number }
  dragStoryboardStart: { x: number; y: number }
  isDraggingCard: boolean
  draggingCardId: number | null
  draggingStoryboardIdForCard: number | null
  dragCardStart: { x: number; y: number }
}

// 认证包装组件
function AuthenticatedVideoCreationPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  return <VideoCreationContent />
}

// 主要内容组件
function VideoCreationContent() {
  const router = useRouter()
  
  const [state, setState] = useState<State>({
    pan: { x: 0, y: 0 },
    zoom: 1,
    isPanning: false,
    panStart: { x: 0, y: 0 },
    storyboards: [],
    nextStoryboardId: 0,
    nextCardId: 0,
    activeModifyCardId: null,
    activeExecuteStoryboardId: null,
    characterReferenceImage: null,
    sceneReferenceImage: null,
    isConnecting: false,
    connectionStart: null,
    playbackIntervals: {},
    // 拖拽相关状态
    isDraggingStoryboard: false,
    draggingStoryboardId: null,
    dragStart: { x: 0, y: 0 },
    dragStoryboardStart: { x: 0, y: 0 },
    isDraggingCard: false,
    draggingCardId: null,
    draggingStoryboardIdForCard: null,
    dragCardStart: { x: 0, y: 0 }
  })

  const [promptInput, setPromptInput] = useState('')
  // const [modifyPrompt, setModifyPrompt] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const uploadCharacterInputRef = useRef<HTMLInputElement>(null)
  const uploadSceneInputRef = useRef<HTMLInputElement>(null)

  // 更新画布变换
  const updateCanvasTransform = () => {
    if (canvasRef.current) {
      canvasRef.current.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`
    }
  }

  // 处理参考图片上传
  const handleReferenceUpload = (file: File, type: 'character' | 'scene') => {
    if (!file || !file.type.startsWith('image/')) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string
      setState(prev => ({
        ...prev,
        [type === 'character' ? 'characterReferenceImage' : 'sceneReferenceImage']: imageUrl
      }))
    }
    reader.readAsDataURL(file)
  }

  // 清除参考图片
  const clearReferenceImage = (type: 'character' | 'scene') => {
    setState(prev => ({
      ...prev,
      [type === 'character' ? 'characterReferenceImage' : 'sceneReferenceImage']: null
    }))
  }

  // 生成故事板
  const handleGenerate = async () => {
    if (!promptInput.trim()) return

    setIsThinking(true)
    
    // 模拟API调用
    setTimeout(() => {
      const mockStoryboardData = {
        scriptText: `这是一个关于${promptInput}的剧本。故事开始于一个神秘的场景，主角在这里展开冒险。`,
        shots: [
          {
            title: "开场镜头",
            cameraMovement: "广角镜头，缓慢推进",
            prompt: `一个关于${promptInput}的开场场景，充满神秘感和期待感`
          },
          {
            title: "主角登场",
            cameraMovement: "中景镜头，跟随主角移动",
            prompt: `主角在${promptInput}场景中登场，展现主角的特征和状态`
          },
          {
            title: "冲突发展",
            cameraMovement: "特写镜头，快速切换",
            prompt: `展现${promptInput}中的冲突和紧张氛围`
          }
        ]
      }

      const CARD_WIDTH = 288
      const LEFT_PANEL_WIDTH = 320
      const CARD_GAP = 20
      const PADDING = 20
      // const PLAYER_CARD_WIDTH = 576
      const CARD_HEIGHT_WITH_GAP = 420
      const CARDS_PER_ROW = 8

      const shotPanelWidth = PADDING * 2 + (CARDS_PER_ROW * (CARD_WIDTH + CARD_GAP)) - CARD_GAP
      const containerWidth = LEFT_PANEL_WIDTH + shotPanelWidth

      let initialX: number, initialY: number
      if (state.storyboards.length === 0) {
        initialX = (window.innerWidth / 2 - containerWidth / 2) / state.zoom - state.pan.x / state.zoom
        initialY = 100 / state.zoom - state.pan.y / state.zoom
      } else {
        // 找到最右边的故事板
        const rightmostSB = state.storyboards.reduce((p, c) => (p.x > c.x) ? p : c, { x: 0, y: 0 } as Storyboard)
        
        // 检查是否有重叠，如果有重叠就向下移动
        let newY = rightmostSB.y
        const newX = rightmostSB.x + rightmostSB.width + 100
        
        // 检查新位置是否会与现有故事板重叠
        const hasOverlap = state.storyboards.some(sb => {
          return newX < sb.x + sb.width && 
                 newX + containerWidth > sb.x &&
                 newY < sb.y + sb.height && 
                 newY + 600 > sb.y
        })
        
        // 如果有重叠，向下移动
        if (hasOverlap) {
          // 找到最下面的故事板
          const bottommostSB = state.storyboards.reduce((p, c) => (p.y > c.y) ? p : c, { x: 0, y: 0 } as Storyboard)
          newY = bottommostSB.y + bottommostSB.height + 100
        }
        
        initialX = newX
        initialY = newY
      }

      const newStoryboard: Storyboard = {
        id: state.nextStoryboardId,
        title: promptInput,
        x: initialX,
        y: initialY,
        width: containerWidth,
        height: 600,
        scriptText: mockStoryboardData.scriptText,
        characterReferenceImage: state.characterReferenceImage,
        sceneReferenceImage: state.sceneReferenceImage,
        cards: [],
        connections: []
      }

      // 添加图片卡片
      mockStoryboardData.shots.forEach((shot, index) => {
        const rowIndex = Math.floor(index / CARDS_PER_ROW)
        const colIndex = index % CARDS_PER_ROW
        newStoryboard.cards.push({
          id: state.nextCardId + index,
          type: 'image',
          x: PADDING + (colIndex * (CARD_WIDTH + CARD_GAP)),
          y: PADDING + (rowIndex * CARD_HEIGHT_WITH_GAP),
          title: shot.title,
          description: shot.prompt,
          cameraMovement: shot.cameraMovement,
          isLoading: true
        })
      })

      // 添加播放器卡片
      const lastShotIndex = mockStoryboardData.shots.length - 1
      const lastRow = Math.floor(lastShotIndex / CARDS_PER_ROW)
      const lastCol = lastShotIndex % CARDS_PER_ROW
      let playerX: number, playerY: number
      
      if (lastCol < CARDS_PER_ROW - 2) {
        playerX = PADDING + ((lastCol + 1) * (CARD_WIDTH + CARD_GAP))
        playerY = PADDING + (lastRow * CARD_HEIGHT_WITH_GAP)
      } else {
        playerX = PADDING
        playerY = PADDING + ((lastRow + 1) * CARD_HEIGHT_WITH_GAP)
      }

      newStoryboard.cards.push({
        id: state.nextCardId + mockStoryboardData.shots.length,
        type: 'player',
        x: playerX,
        y: playerY,
        isReady: false,
        isPlaying: false,
        playlist: [],
        currentFrame: 0,
        thumbnailUrl: null
      })

      setState(prev => ({
        ...prev,
        storyboards: [...prev.storyboards, newStoryboard],
        nextStoryboardId: prev.nextStoryboardId + 1,
        nextCardId: prev.nextCardId + mockStoryboardData.shots.length + 1
      }))

      setPromptInput('')
      setIsThinking(false)

      // 模拟图片生成
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          storyboards: prev.storyboards.map(sb => 
            sb.id === newStoryboard.id 
              ? {
                  ...sb,
                  cards: sb.cards.map(card => 
                    card.type === 'image' 
                      ? { ...card, isLoading: false, imageUrl: null }
                      : card
                  )
                }
              : sb
          )
        }))
      }, 2000)
    }, 1500)
  }

  // 缩放控制
  const handleZoomIn = () => {
    setState(prev => ({ ...prev, zoom: Math.min(3, prev.zoom * 1.2) }))
  }

  const handleZoomOut = () => {
    setState(prev => ({ ...prev, zoom: Math.max(0.2, prev.zoom * 0.8) }))
  }

  const handleResetView = () => {
    setState(prev => ({ ...prev, zoom: 1, pan: { x: 0, y: 0 } }))
  }

  // 鼠标事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.storyboard-container') || 
        (e.target as HTMLElement).closest('#bottom-controls')) {
      return
    }

    // 只在需要平移时阻止默认行为
    if (!state.isDraggingStoryboard) {
      e.preventDefault()
    }
    setState(prev => ({
      ...prev,
      isPanning: true,
      panStart: { x: e.clientX - prev.pan.x, y: e.clientY - prev.pan.y }
    }))

    if (canvasContainerRef.current) {
      canvasContainerRef.current.style.cursor = 'grabbing'
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (state.isDraggingStoryboard) return
    if (!state.isPanning) return

    setState(prev => ({
      ...prev,
      pan: {
        x: e.clientX - prev.panStart.x,
        y: e.clientY - prev.panStart.y
      }
    }))
  }

  const handleMouseUp = () => {
    setState(prev => ({ ...prev, isPanning: false, isDraggingStoryboard: false, draggingStoryboardId: null }))
    if (canvasContainerRef.current) {
      canvasContainerRef.current.style.cursor = 'grab'
    }
  }

  // 故事板拖拽事件处理
  const handleStoryboardMouseDown = (e: React.MouseEvent, storyboardId: number) => {
    e.stopPropagation()
    
    const storyboard = state.storyboards.find(sb => sb.id === storyboardId)
    if (!storyboard) return
    
    setState(prev => ({
      ...prev,
      isDraggingStoryboard: true,
      draggingStoryboardId: storyboardId,
      dragStart: { 
        x: e.clientX,
        y: e.clientY
      },
      dragStoryboardStart: {
        x: storyboard.x,
        y: storyboard.y
      }
    }))
  }

  const handleStoryboardMouseMove = (e: MouseEvent) => {
    if (!state.isDraggingStoryboard || state.draggingStoryboardId === null) return

    const deltaX = (e.clientX - state.dragStart.x) / state.zoom
    const deltaY = (e.clientY - state.dragStart.y) / state.zoom

    setState(prev => ({
      ...prev,
      storyboards: prev.storyboards.map(sb => 
        sb.id === prev.draggingStoryboardId
          ? { 
              ...sb, 
              x: prev.dragStoryboardStart.x + deltaX,
              y: prev.dragStoryboardStart.y + deltaY
            }
          : sb
      )
    }))
  }

  // 分镜卡片拖拽交换顺序
  const handleCardMouseDown = (e: React.MouseEvent, cardId: number, storyboardId: number) => {
    e.stopPropagation()
    
    const storyboard = state.storyboards.find(sb => sb.id === storyboardId)
    if (!storyboard) return
    
    const card = storyboard.cards.find(c => c.id === cardId)
    if (!card) return
    
    setState(prev => ({
      ...prev,
      isDraggingCard: true,
      draggingCardId: cardId,
      draggingStoryboardIdForCard: storyboardId,
      dragCardStart: {
        x: e.clientX,
        y: e.clientY
      }
    }))
  }

  const handleCardMouseMove = (e: MouseEvent) => {
    if (!state.isDraggingCard || state.draggingCardId === null || state.draggingStoryboardIdForCard === null) return

    const deltaX = (e.clientX - state.dragCardStart.x) / state.zoom
    const deltaY = (e.clientY - state.dragCardStart.y) / state.zoom

    setState(prev => ({
      ...prev,
      storyboards: prev.storyboards.map(sb => 
        sb.id === prev.draggingStoryboardIdForCard
          ? {
              ...sb,
              cards: sb.cards.map(card => {
                if (card.id === prev.draggingCardId) {
                  // 计算新的位置
                  let newX = card.x + deltaX
                  let newY = card.y + deltaY
                  
                  // 卡片边界检查 - 确保卡片不会移出故事板
                  const cardWidth = card.type === 'player' ? 576 : 288
                  const cardHeight = card.type === 'player' ? 384 : 192
                  
                  // 故事板内容区域边界（减去内边距）
                  const storyboardContentWidth = sb.width - 40 // 左右各20px内边距
                  const storyboardContentHeight = sb.height - 40 // 上下各20px内边距
                  
                  // 限制卡片在故事板内容区域内
                  newX = Math.max(0, Math.min(newX, storyboardContentWidth - cardWidth))
                  newY = Math.max(0, Math.min(newY, storyboardContentHeight - cardHeight))
                  
                  return { ...card, x: newX, y: newY }
                }
                return card
              })
            }
          : sb
      )
    }))
  }

  const handleCardMouseUp = () => {
    if (!state.isDraggingCard || state.draggingCardId === null || state.draggingStoryboardIdForCard === null) return

    const storyboard = state.storyboards.find(sb => sb.id === state.draggingStoryboardIdForCard)
    if (!storyboard) return

    const draggingCard = storyboard.cards.find(c => c.id === state.draggingCardId)
    if (!draggingCard) return

    // 检查是否与其他卡片重叠，实现交换顺序
    const overlappingCard = storyboard.cards.find(card => 
      card.id !== state.draggingCardId &&
      Math.abs(card.x - draggingCard.x) < 150 &&
      Math.abs(card.y - draggingCard.y) < 150
    )

    if (overlappingCard) {
      // 交换卡片位置
      setState(prev => ({
        ...prev,
        storyboards: prev.storyboards.map(sb => 
          sb.id === prev.draggingStoryboardIdForCard
            ? {
                ...sb,
                cards: sb.cards.map(card => {
                  if (card.id === prev.draggingCardId) {
                    return { ...card, x: overlappingCard.x, y: overlappingCard.y }
                  }
                  if (card.id === overlappingCard.id) {
                    return { ...card, x: draggingCard.x, y: draggingCard.y }
                  }
                  return card
                })
              }
            : sb
        )
      }))
    }

    setState(prev => ({
      ...prev,
      isDraggingCard: false,
      draggingCardId: null,
      draggingStoryboardIdForCard: null
    }))
  }

  // 剧本操作函数
  const handleModifyScript = (storyboardId: number) => {
    const storyboard = state.storyboards.find(sb => sb.id === storyboardId)
    if (!storyboard) return
    
    const newScript = prompt('修改剧本内容：', storyboard.scriptText)
    if (newScript !== null) {
      setState(prev => ({
        ...prev,
        storyboards: prev.storyboards.map(sb => 
          sb.id === storyboardId
            ? { ...sb, scriptText: newScript }
            : sb
        )
      }))
    }
  }

  const handleRegenerateScript = (storyboardId: number) => {
    const storyboard = state.storyboards.find(sb => sb.id === storyboardId)
    if (!storyboard) return
    
    // 模拟重新生成剧本
    const newScript = `这是重新生成的关于${storyboard.title}的剧本。剧本内容已经根据最新要求进行了优化和调整。`
    
    setState(prev => ({
      ...prev,
      storyboards: prev.storyboards.map(sb => 
        sb.id === storyboardId
          ? { ...sb, scriptText: newScript }
          : sb
      )
    }))
  }

  const handleDeleteScript = (storyboardId: number) => {
    if (confirm('确定要删除这个剧本吗？')) {
      setState(prev => ({
        ...prev,
        storyboards: prev.storyboards.filter(sb => sb.id !== storyboardId)
      }))
    }
  }

  // 滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    // 只在需要缩放时阻止默认行为
    if (Math.abs(e.deltaY) > 0) {
      e.preventDefault()
    }
    const zoomFactor = 1.1
    const oldZoom = state.zoom
    
    if (!canvasContainerRef.current) return
    
    const rect = canvasContainerRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    let newZoom = state.zoom
    if (e.deltaY < 0) {
      newZoom = Math.min(3, state.zoom * zoomFactor)
    } else {
      newZoom = Math.max(0.2, state.zoom / zoomFactor)
    }

    setState(prev => ({
      ...prev,
      zoom: newZoom,
      pan: {
        x: mouseX - (mouseX - prev.pan.x) * (newZoom / oldZoom),
        y: mouseY - (mouseY - prev.pan.y) * (newZoom / oldZoom)
      }
    }))
  }

  // 添加事件监听器
  useEffect(() => {
    updateCanvasTransform()
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousemove', handleStoryboardMouseMove)
    document.addEventListener('mousemove', handleCardMouseMove)
    document.addEventListener('mouseup', handleCardMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousemove', handleStoryboardMouseMove)
      document.removeEventListener('mousemove', handleCardMouseMove)
      document.removeEventListener('mouseup', handleCardMouseUp)
    }
  }, [state.pan, state.zoom, state.isPanning, state.isDraggingStoryboard, state.isDraggingCard])

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900">
      {/* 顶部导航栏 */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-gray-900/80 backdrop-blur-lg border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/user')}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回首页</span>
            </button>
            <div className="w-px h-6 bg-gray-600"></div>
            <Video className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold text-white">剧本大师无限画布</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-white transition-colors">
              帮助
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              设置
            </button>
          </div>
        </div>
      </div>
      
      {/* 画布容器 */}
      <div 
        ref={canvasContainerRef}
        className="absolute top-16 left-0 w-full h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-800 to-gray-900 cursor-grab"
        style={{
          backgroundImage: 'radial-gradient(#4b5563 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
        <div 
          ref={canvasRef}
          className="relative w-full h-full"
          style={{ transformOrigin: '0 0' }}
        >
          {/* 故事板渲染区域 */}
          {state.storyboards.map(storyboard => (
            <div
              key={storyboard.id}
              className="storyboard-container absolute rounded-2xl shadow-2xl flex flex-col select-none bg-gray-800/70 backdrop-blur-lg border border-gray-600"
              style={{
                left: `${storyboard.x}px`,
                top: `${storyboard.y}px`,
                width: `${storyboard.width}px`,
                height: `${storyboard.height}px`
              }}
            >
              {/* 故事板头部 - 可拖拽区域 */}
              <div 
                className="storyboard-header bg-gray-900/70 p-4 flex justify-between items-center cursor-move"
                onMouseDown={(e) => handleStoryboardMouseDown(e, storyboard.id)}
              >
                <h2 className="font-bold text-white truncate flex-1">{storyboard.title}</h2>
                <div className="flex items-center space-x-2">
                  <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-2 rounded-lg text-sm">
                    执行
                  </button>
                  <button className="bg-green-600 hover:bg-green-700 text-white font-bold w-8 h-8 rounded-lg flex items-center justify-center">
                    <Video className="w-4 h-4" />
                  </button>
                  <button className="bg-red-600 hover:bg-red-700 text-white font-bold w-8 h-8 rounded-lg flex items-center justify-center">
                    ×
                  </button>
                </div>
              </div>

              {/* 故事板内容 */}
              <div className="flex-grow flex">
                {/* 左侧信息面板 */}
                <div className="w-80 p-5 overflow-y-auto border-r border-gray-600">
                  <h3 className="text-base font-semibold text-gray-300 mb-4">主题</h3>
                  <p className="text-white mb-6">{storyboard.title}</p>
                  
                  {storyboard.characterReferenceImage && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">角色参考</h4>
                      <img 
                        src={storyboard.characterReferenceImage} 
                        className="w-full h-auto object-cover rounded-md"
                        alt="角色参考"
                      />
                    </div>
                  )}
                  
                  {storyboard.sceneReferenceImage && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">场景参考</h4>
                      <img 
                        src={storyboard.sceneReferenceImage} 
                        className="w-full h-auto object-cover rounded-md"
                        alt="场景参考"
                      />
                    </div>
                  )}
                  
                  {storyboard.scriptText && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">剧本内容</h4>
                      <p className="text-gray-300 text-sm whitespace-pre-wrap mb-4">
                        {storyboard.scriptText}
                      </p>
                      <div className="flex space-x-2">
                        <button 
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded text-xs"
                          onClick={() => handleModifyScript(storyboard.id)}
                        >
                          修改
                        </button>
                        <button 
                          className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1 rounded text-xs"
                          onClick={() => handleRegenerateScript(storyboard.id)}
                        >
                          重新生成
                        </button>
                        <button 
                          className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1 rounded text-xs"
                          onClick={() => handleDeleteScript(storyboard.id)}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 右侧卡片区域 */}
                <div className="flex-grow relative p-5">
                  {storyboard.cards.map(card => (
                    <div
                      key={card.id}
                      className={`absolute bg-gray-700 rounded-lg shadow-lg overflow-hidden transition-all duration-200 ${
                        state.isDraggingCard && state.draggingCardId === card.id 
                          ? 'shadow-2xl scale-105 z-50 cursor-grabbing' 
                          : 'hover:shadow-xl hover:-translate-y-1 cursor-grab'
                      }`}
                      style={{
                        left: `${card.x}px`,
                        top: `${card.y}px`,
                        width: card.type === 'player' ? '576px' : '288px'
                      }}
                      onMouseDown={(e) => handleCardMouseDown(e, card.id, storyboard.id)}
                    >
                      {card.type === 'image' ? (
                        <>
                          <div className="w-full h-48 bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                            {card.isLoading ? (
                              <div className="border-4 border-gray-300 border-t-blue-500 rounded-full w-8 h-8 animate-spin"></div>
                            ) : (
                              <div className="text-white text-center p-4">
                                <div className="font-bold text-lg mb-2">{card.title}</div>
                                <div className="text-sm opacity-80">图片已生成</div>
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h3 className="font-semibold text-white mb-2">{card.title}</h3>
                            {card.cameraMovement && (
                              <p className="text-gray-400 text-xs mb-2">{card.cameraMovement}</p>
                            )}
                            <p className="text-gray-300 text-sm">{card.description}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-full h-96 bg-gray-600 flex items-center justify-center">
                            {card.isReady ? (
                              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                播放器预览
                              </div>
                            ) : (
                              <span className="text-gray-500">未执行</span>
                            )}
                          </div>
                          <div className="p-3 bg-gray-800/50">
                            <h3 className="font-semibold text-white">播放器</h3>
                            <p className="text-gray-400 text-xs">连接卡片并点击执行</p>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部控制区域 */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-20">
        {/* 思考指示器 */}
        {isThinking && (
          <div className="text-center mb-2">
            <p className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse">
              思考中...
            </p>
          </div>
        )}
        
        {/* 控制面板 */}
        <div className="bg-gray-900/70 backdrop-blur-lg rounded-full shadow-2xl flex items-center h-16 border border-gray-700">
          {/* 角色参考 */}
          <div 
            className="h-full w-32 flex-shrink-0 flex items-center justify-center text-gray-400 relative cursor-pointer hover:bg-white/10 transition-colors border-r border-gray-600"
            onClick={() => uploadCharacterInputRef.current?.click()}
          >
            {state.characterReferenceImage ? (
              <>
                <img 
                  src={state.characterReferenceImage} 
                  className="w-full h-full object-cover rounded-l-full"
                  alt="角色参考"
                />
                <button 
                  className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    clearReferenceImage('character')
                  }}
                >
                  ×
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="text-xs font-semibold">角色</span>
              </div>
            )}
          </div>
          
          <input 
            ref={uploadCharacterInputRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleReferenceUpload(e.target.files[0], 'character')
              }
            }}
          />

          {/* 场景参考 */}
          <div 
            className="h-full w-32 flex-shrink-0 flex items-center justify-center text-gray-400 relative cursor-pointer hover:bg-white/10 transition-colors border-r border-gray-600"
            onClick={() => uploadSceneInputRef.current?.click()}
          >
            {state.sceneReferenceImage ? (
              <>
                <img 
                  src={state.sceneReferenceImage} 
                  className="w-full h-full object-cover"
                  alt="场景参考"
                />
                <button 
                  className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    clearReferenceImage('scene')
                  }}
                >
                  ×
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Video className="w-4 h-4" />
                <span className="text-xs font-semibold">场景</span>
              </div>
            )}
          </div>
          
          <input 
            ref={uploadSceneInputRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleReferenceUpload(e.target.files[0], 'scene')
              }
            }}
          />

          {/* 提示词输入 */}
          <input 
            type="text" 
            placeholder="输入剧本主题，例如'一个侦探故事，分6个镜头'"
            className="bg-transparent text-white placeholder-gray-400 text-base px-6 h-full w-full focus:ring-0 focus:outline-none"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleGenerate()
              }
            }}
          />

          {/* 生成按钮 */}
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-full px-6 flex-shrink-0 flex items-center transition whitespace-nowrap rounded-r-full"
            onClick={handleGenerate}
            disabled={isThinking}
          >
            <Video className="w-5 h-5 mr-2" />
            <span>生成</span>
          </button>
        </div>
      </div>

      {/* 缩放控制 */}
      <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-10">
        <button 
          className="w-10 h-10 bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center text-xl hover:bg-gray-700 transition"
          onClick={handleZoomIn}
        >
          +
        </button>
        <button 
          className="w-10 h-10 bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center text-xl hover:bg-gray-700 transition"
          onClick={handleZoomOut}
        >
          -
        </button>
        <button 
          className="w-10 h-10 bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center text-sm hover:bg-gray-700 transition"
          onClick={handleResetView}
        >
          <Home className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default AuthenticatedVideoCreationPage