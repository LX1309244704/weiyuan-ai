'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Upload,
  Download,
  RotateCcw,
  Redo,
  ZoomIn,
  ZoomOut,
  Square,
  PenTool,
  Type,
  Brush,
  Layers,
  Trash2,
  History,
  Sparkles,
  X
} from 'lucide-react'
import Script from 'next/script'

import AdCreationCanvas from './AdCreationCanvas'
import LayerPanel from './LayerPanel'
import HistoryPanel from './HistoryPanel'

export default function AdCreationPage() {
  const [canvas, setCanvas] = useState<any>(null)
  const [canvasInitialized, setCanvasInitialized] = useState(false)
  const [fabricLoaded, setFabricLoaded] = useState(false)
  const [activeTool, setActiveTool] = useState<string>('select')
  const [isLayerPanelCollapsed, setIsLayerPanelCollapsed] = useState(false)
  const [isHistoryPanelCollapsed, setIsHistoryPanelCollapsed] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(100)
  // 初始画布尺寸设置为更大的值，避免频繁更新
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 })
  
  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false)
  
  // 初始化画布尺寸
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = document.getElementById('canvas-container')
      if (container) {
        const { clientWidth, clientHeight } = container
        // 增大画板尺寸，使其占用更多可用空间
        const newWidth = Math.min(1400, clientWidth - 20)
        const newHeight = Math.min(900, clientHeight - 20)
        
        // 只有当尺寸真正改变时才更新状态
        setCanvasSize(prevSize => {
          if (prevSize.width !== newWidth || prevSize.height !== newHeight) {
            return { width: newWidth, height: newHeight }
          }
          return prevSize
        })
      }
    }
    
    // 延迟执行一次，确保DOM已经渲染
    const timer = setTimeout(updateCanvasSize, 100)
    window.addEventListener('resize', updateCanvasSize)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateCanvasSize)
    }
  }, [])
  
  // 使用useCallback稳定onCanvasReady回调函数
  const handleCanvasReady = useCallback((c: any) => {
    console.log('Canvas ready:', c);
    setCanvas(c);
    setCanvasInitialized(true);
  }, []);
  
  // 检查fabric是否已加载
  useEffect(() => {
    if (window.fabric) {
      setFabricLoaded(true)
    }
  }, [])
  
  // 工具列表
  const tools = [
    { id: 'select', icon: Square, label: '选择' },
    { id: 'brush', icon: PenTool, label: '画笔' },
    { id: 'mask-brush', icon: Brush, label: '遮罩画笔' },
    { id: 'text', icon: Type, label: '文字' },
  ]
  
  // 缩放控制
  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 10, 200)
    setZoomLevel(newZoom)
    if (canvas) {
      const scale = newZoom / 100
      canvas.setZoom(scale)
      canvas.renderAll()
    }
  }
  
  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 10, 50)
    setZoomLevel(newZoom)
    if (canvas) {
      const scale = newZoom / 100
      canvas.setZoom(scale)
      canvas.renderAll()
    }
  }
  
  const handleZoomReset = () => {
    setZoomLevel(100)
    if (canvas) {
      canvas.setZoom(1)
      canvas.renderAll()
    }
  }
  
  // 上传图片
  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && canvas) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const imgUrl = e.target?.result as string
          // 确保fabric已加载
          if (!window.fabric) {
            console.error('Fabric.js not loaded')
            return
          }
          
          if (window.fabric.Image) {
            window.fabric.Image.fromURL(imgUrl, (img: any) => {
              if (!img) return
              // 调整图片大小以适应画布
              const scale = Math.min(
                canvas.width / img.width,
                canvas.height / img.height,
                1
              )
              img.scale(scale)
              canvas.add(img)
              canvas.centerObject(img)
              canvas.setActiveObject(img)
              canvas.renderAll()
            })
          }
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }
  
  // 重置画板
  const handleResetCanvas = () => {
    if (canvas) {
      // 清除画布
      canvas.clear()
      canvas.backgroundColor = 'white'
      canvas.renderAll()
      setZoomLevel(100)
      canvas.setZoom(1)
      
      // 重置历史记录
      canvas.historyData = []
      canvas.historyIndex = -1
      
      // 保存重置后的初始状态
      if (canvas.saveState) {
        canvas.saveState()
      }
    }
  }
  
  const handleUndo = () => {
    if (canvas) {
      canvas.undo()
    }
  }
  
  const handleRedo = () => {
    if (canvas) {
      canvas.redo()
    }
  }
  
  // 立即生成
  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      // 这里可以添加实际的生成逻辑
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error('生成失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }
  
  // 下载作品
  const handleDownload = () => {
    if (canvas) {
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1
      })
      
      const link = document.createElement('a')
      link.download = `ad-creation-${Date.now()}.png`
      link.href = dataURL
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
  
  // 样式对象
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    background: 'linear-gradient(to bottom right, #0f172a, #1e293b)',
    color: 'white',
    overflow: 'hidden' as const,
  }
  
  const headerStyle = {
    display: 'flex',
    alignItems: 'center' as const,
    justifyContent: 'space-between',
    padding: '0.75rem 1.5rem',
    background: 'rgba(30, 41, 59, 0.8)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
  }
  
  const mainStyle = {
    display: 'flex',
    flex: 1,
    overflow: 'hidden' as const,
  }
  
  const asideStyle = (width: string) => ({
    width,
    background: 'rgba(30, 41, 59, 0.6)',
    backdropFilter: 'blur(4px)',
    transition: 'all 0.3s',
  })
  
  const canvasContainerStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  }
  
  const toolsBarStyle = {
    position: 'absolute' as const,
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(30, 41, 59, 0.9)',
    backdropFilter: 'blur(12px)',
    borderRadius: '9999px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
    padding: '0.5rem 0.5rem',
    display: 'flex',
    alignItems: 'center' as const,
    gap: '0.5rem',
  }
  
  return (
    <>
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js"
        strategy="beforeInteractive"
        onLoad={() => {
          setFabricLoaded(true)
        }}
      />
      
      <div style={containerStyle}>
        {/* 顶部导航栏 */}
        <header style={headerStyle}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>广告创作工作台</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={handleDownload}
              disabled={!canvasInitialized}
              style={{ 
                padding: '0.5rem 1rem', 
                background: '#334155', 
                borderRadius: '0.5rem', 
                display: 'flex', 
                alignItems: 'center' as const, 
                gap: '0.5rem', 
                transition: 'all 0.2s',
                ...(canvasInitialized ? {} : { opacity: 0.5, cursor: 'not-allowed' })
              }}
            >
              <Download size={18} />
              <span>下载</span>
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !canvasInitialized}
              style={{ 
                padding: '0.5rem 1.5rem', 
                background: 'linear-gradient(to right, #2563eb, #9333ea)', 
                borderRadius: '0.5rem', 
                display: 'flex', 
                alignItems: 'center' as const, 
                gap: '0.5rem', 
                transition: 'all 0.2s',
                ...((isGenerating || !canvasInitialized) ? { opacity: 0.5, cursor: 'not-allowed' } : {})
              }}
            >
              <Sparkles size={18} />
              <span>{isGenerating ? '生成中...' : '立即生成'}</span>
            </button>
          </div>
        </header>
        
        {/* 主体区域 */}
        <main style={mainStyle}>
          {/* 左侧图层面板 */}
          <aside style={asideStyle(isLayerPanelCollapsed ? '3rem' : '14rem')}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '1rem', 
                borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
                ...(isLayerPanelCollapsed ? { borderRight: '1px solid rgba(51, 65, 85, 0.5)' } : {})
              }}>
                {!isLayerPanelCollapsed && <h2 style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={18} />
                  <span>图层管理</span>
                </h2>}
                <button
                  onClick={() => setIsLayerPanelCollapsed(!isLayerPanelCollapsed)}
                  style={{ padding: '0.25rem', background: 'transparent', border: 'none', borderRadius: '0.25rem', transition: 'all 0.2s' }}
                >
                  {isLayerPanelCollapsed ? <Layers size={18} /> : <X size={18} />}
                </button>
              </div>
              
              {!isLayerPanelCollapsed && canvasInitialized && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                  <LayerPanel canvas={canvas} />
                </div>
              )}
            </div>
          </aside>
          
          {/* 中间画布区域 */}
          <div style={canvasContainerStyle}>
            <div 
              id="canvas-container"
              style={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '0.5rem', 
                overflow: 'hidden' 
              }}
            >
              {fabricLoaded ? (
                <div style={{ 
                  position: 'relative', 
                  background: 'white', 
                  borderRadius: '0.5rem', 
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' 
                }}>
                  <AdCreationCanvas
                    width={canvasSize.width}
                    height={canvasSize.height}
                    onCanvasReady={handleCanvasReady}
                    activeTool={activeTool}
                  />
                </div>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  background: 'white', 
                  borderRadius: '0.5rem', 
                  padding: '2rem', 
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' 
                }}>
                  <div style={{ 
                    display: 'inline-block', 
                    width: '2rem', 
                    height: '2rem', 
                    border: '0.25rem solid #3b82f6', 
                    borderTop: 'transparent', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite' 
                  }}></div>
                  <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.875rem' }}>Loading Fabric.js...</p>
                </div>
              )}
              
              {/* 缩放控制 - 只在canvas初始化后显示 */}
              {canvasInitialized && (
                <div style={{ 
                  position: 'absolute', 
                  bottom: '1rem', 
                  right: '1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  background: 'rgba(30, 41, 59, 0.8)', 
                  backdropFilter: 'blur(4px)', 
                  borderRadius: '0.5rem', 
                  padding: '0.5rem' 
                }}>
                  <button
                    onClick={handleZoomOut}
                    style={{ padding: '0.375rem', background: 'transparent', border: 'none', borderRadius: '0.25rem', transition: 'all 0.2s' }}
                  >
                    <ZoomOut size={18} />
                  </button>
                  <span style={{ minWidth: '3rem', textAlign: 'center', fontSize: '0.875rem' }}>{zoomLevel}%</span>
                  <button
                    onClick={handleZoomIn}
                    style={{ padding: '0.375rem', background: 'transparent', border: 'none', borderRadius: '0.25rem', transition: 'all 0.2s' }}
                  >
                    <ZoomIn size={18} />
                  </button>
                  <button
                    onClick={handleZoomReset}
                    style={{ padding: '0.375rem', background: 'transparent', border: 'none', borderRadius: '0.25rem', transition: 'all 0.2s' }}
                  >
                    <RotateCcw size={18} />
                  </button>
                </div>
              )}
            </div>
            
            {/* 底部悬浮工具栏 - 只在canvas初始化后显示 */}
            {canvasInitialized && (
              <div style={toolsBarStyle}>
                {/* 上传图片 */}
                <button
                  onClick={handleImageUpload}
                  style={{ padding: '0.75rem', background: 'transparent', border: 'none', borderRadius: '50%', transition: 'all 0.2s' }}
                  title="上传图片"
                >
                  <Upload size={18} />
                </button>
                
                {/* 分隔线 */}
                <div style={{ height: '2rem', width: '1px', background: '#475569' }} />
                
                {/* 工具按钮 */}
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    style={{ 
                      padding: '0.75rem', 
                      borderRadius: '50%', 
                      transition: 'all 0.2s',
                      ...(activeTool === tool.id 
                        ? { background: '#2563eb', color: 'white' } 
                        : { background: 'transparent', color: '#d1d5db' }
                      )
                    }}
                    title={tool.label}
                  >
                    <tool.icon size={18} />
                  </button>
                ))}
                
                {/* 分隔线 */}
                <div style={{ height: '2rem', width: '1px', background: '#475569' }} />
                
                {/* 撤销/重做/重置 */}
                <button
                  onClick={handleUndo}
                  style={{ padding: '0.75rem', background: 'transparent', border: 'none', borderRadius: '50%', transition: 'all 0.2s' }}
                  title="撤销"
                >
                  <RotateCcw size={18} />
                </button>
                
                <button
                  onClick={handleRedo}
                  style={{ padding: '0.75rem', background: 'transparent', border: 'none', borderRadius: '50%', transition: 'all 0.2s' }}
                  title="重做"
                >
                  <Redo size={18} />
                </button>
                
                <button
                  onClick={handleResetCanvas}
                  style={{ padding: '0.75rem', background: 'transparent', border: 'none', borderRadius: '50%', transition: 'all 0.2s' }}
                  title="重置画板"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>
          
          {/* 右侧历史记录面板 */}
          <aside style={asideStyle(isHistoryPanelCollapsed ? '3rem' : '16rem')}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '1rem', 
                borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
                ...(isHistoryPanelCollapsed ? { borderLeft: '1px solid rgba(51, 65, 85, 0.5)' } : {})
              }}>
                {!isHistoryPanelCollapsed && <h2 style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History size={18} />
                  <span>生成历史</span>
                </h2>}
                <button
                  onClick={() => setIsHistoryPanelCollapsed(!isHistoryPanelCollapsed)}
                  style={{ padding: '0.25rem', background: 'transparent', border: 'none', borderRadius: '0.25rem', transition: 'all 0.2s' }}
                >
                  {isHistoryPanelCollapsed ? <History size={18} /> : <X size={18} />}
                </button>
              </div>
              
              {!isHistoryPanelCollapsed && canvasInitialized && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                  <HistoryPanel canvas={canvas} />
                </div>
              )}
            </div>
          </aside>
        </main>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  )
}