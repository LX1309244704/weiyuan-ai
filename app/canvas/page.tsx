'use client'

import { useEffect, useRef, useState } from 'react'
 // 动态导入 fabric 于客户端（避免 SSR 环境下 undefined）
import CanvasToolbar from '../../components/CanvasToolbar'
import SelectionPanel from '../../components/SelectionPanel'
import ChatPanel from '../../components/ChatPanel'
import { useUserStore } from '@/stores/userStore'

type SelectionData = {
  rect: any
  mousePosition: { x: number; y: number }
  screenPosition: { x: number; y: number }
}

export default function CanvasPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [fabricCanvas, setFabricCanvas] = useState<any | null>(null)
  const [selectedArea, setSelectedArea] = useState<SelectionData | null>(null)
  const chatPanelRef = useRef<{ handleReceiveScreenshot: (imageData: string, prompt: string) => void } | null>(null)
  const fabricNSRef = useRef<any>(null)
  const { theme } = useUserStore()
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 })

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
      const width = pointer.x - startX
      const height = pointer.y - startY

      selectionRect.set({
        width: Math.abs(width),
        height: Math.abs(height),
        left: width < 0 ? pointer.x : startX,
        top: height < 0 ? pointer.y : startY
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

  // AI 生成占位逻辑（与 ChatPanel 的模拟一致）
  const handleGenerateImage = async (prompt: string) => {
    // 这里可对接真实后端/模型；先由 ChatPanel 自身模拟
    console.log('请求生成图片:', prompt)
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

      {/* 悬浮 AI 创作助手 */}
      <ChatPanel
        ref={chatPanelRef as any}
        onCaptureArea={handleCaptureArea}
        onReceiveScreenshot={handleReceiveScreenshot}
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