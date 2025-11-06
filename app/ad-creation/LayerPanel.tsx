'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Trash2, GripVertical, Layers, Plus, Lock, Unlock } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'

interface LayerPanelProps {
  canvas: any
}

interface Layer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  object?: any
}

export default function LayerPanel({ canvas }: LayerPanelProps) {
  const [layers, setLayers] = useState<Layer[]>([])
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null)
  const [contextMenuLayerId, setContextMenuLayerId] = useState<string | null>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  
  // 获取主题状态
  const { theme } = useUserStore()
  
  // 更新图层列表
  useEffect(() => {
    if (!canvas) return
    
    const updateLayers = () => {
      const objects = canvas.getObjects()
      const newLayers: Layer[] = []
      
      // 过滤掉非可视对象（如网格线等）
      const visibleObjects = objects.filter(obj => 
        obj.selectable !== false || obj.evented !== false
      )
      
      visibleObjects.forEach((obj, index) => {
        let name = obj.type || '对象'
        
        // 根据类型设置更好的名称
        if (obj.type === 'i-text' || obj.type === 'textbox') {
          name = obj.text ? obj.text.substring(0, 15) + (obj.text.length > 15 ? '...' : '') : '文本'
        } else if (obj.type === 'image') {
          name = '图片'
        } else if (obj.type === 'rect') {
          name = '矩形'
        } else if (obj.type === 'circle') {
          name = '圆形'
        } else if (obj.type === 'triangle') {
          name = '三角形'
        } else if (obj.type === 'path') {
          name = '路径'
        } else if (obj.type === 'line') {
          name = '线条'
        }
        
        newLayers.push({
          id: obj.id || `layer-${index}`,
          name,
          visible: obj.visible !== false, // 默认可见
          locked: obj.lockMovementX && obj.lockMovementY && obj.hasControls === false,
          object: obj
        })
      })
      
      // 反转数组，使最上层的对象显示在最前面
      setLayers(newLayers.reverse())
    }
    
    // 初始更新
    updateLayers()
    
    // 监听画布变化
    canvas.on('object:added', updateLayers)
    canvas.on('object:removed', updateLayers)
    canvas.on('object:modified', updateLayers)
    
    return () => {
      canvas.off('object:added', updateLayers)
      canvas.off('object:removed', updateLayers)
      canvas.off('object:modified', updateLayers)
    }
  }, [canvas])
  
  // 选择图层
  const selectLayer = (layerId: string) => {
    if (!canvas) return
    
    setSelectedLayerId(layerId)
    
    const layer = layers.find(l => l.id === layerId)
    if (layer && layer.object) {
      canvas.discardActiveObject()
      canvas.setActiveObject(layer.object)
      canvas.renderAll()
    }
  }
  
  // 切换图层可见性
  const toggleVisibility = (layerId: string) => {
    if (!canvas) return
    
    const layer = layers.find(l => l.id === layerId)
    if (layer && layer.object) {
      layer.object.visible = !layer.object.visible
      canvas.renderAll()
      setLayers(prev => prev.map(l => 
        l.id === layerId ? { ...l, visible: !l.visible } : l
      ))
    }
  }
  
  // 切换图层锁定状态
  const toggleLock = (layerId: string) => {
    if (!canvas) return
    
    const layer = layers.find(l => l.id === layerId)
    if (layer && layer.object) {
      const isLocked = layer.locked
      layer.object.lockMovementX = !isLocked
      layer.object.lockMovementY = !isLocked
      layer.object.lockRotation = !isLocked
      layer.object.lockScalingX = !isLocked
      layer.object.lockScalingY = !isLocked
      layer.object.hasControls = isLocked
      layer.object.selectable = isLocked
      
      canvas.renderAll()
      setLayers(prev => prev.map(l => 
        l.id === layerId ? { ...l, locked: !l.locked } : l
      ))
    }
  }
  
  // 删除图层
  const deleteLayer = (layerId: string) => {
    if (!canvas) return
    
    const layer = layers.find(l => l.id === layerId)
    if (layer && layer.object) {
      canvas.remove(layer.object)
      canvas.renderAll()
    }
  }
  
  // 新建图层（添加一个简单的矩形作为示例）
  const addNewLayer = () => {
    if (!canvas) return
    
    // 使用window.fabric而不是直接导入，确保兼容性
    if (!window.fabric || !window.fabric.Rect) {
      console.error('Fabric.js is not loaded yet')
      return
    }
    
    const rect = new window.fabric.Rect({
      left: canvas.width / 2 - 50,
      top: canvas.height / 2 - 50,
      width: 100,
      height: 100,
      fill: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      id: `layer-${Date.now()}`
    })
    
    canvas.add(rect)
    canvas.setActiveObject(rect)
    canvas.renderAll()
  }
  

  
  // 将图层移到最顶层
  const bringLayerToFront = (layerId: string) => {
    if (!canvas) return
    
    const layer = layers.find(l => l.id === layerId)
    if (!layer || !layer.object) return
    
    canvas.bringToFront(layer.object)
    canvas.renderAll()
  }
  
  // 将图层移到最底层
  const sendLayerToBack = (layerId: string) => {
    if (!canvas) return
    
    const layer = layers.find(l => l.id === layerId)
    if (!layer || !layer.object) return
    
    canvas.sendToBack(layer.object)
    canvas.renderAll()
  }
  
  // 处理拖拽
  const handleDragStart = (layerId: string) => {
    setDraggedLayer(layerId)
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }
  
  // 处理右键菜单
  const handleContextMenu = (e: React.MouseEvent, layerId: string) => {
    e.preventDefault()
    setContextMenuLayerId(layerId)
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
  }
  
  const closeContextMenu = () => {
    setContextMenuLayerId(null)
  }
  
  // 关闭右键菜单（点击其他地方）
  useEffect(() => {
    const handleClickOutside = () => {
      closeContextMenu()
    }
    
    document.addEventListener('click', handleClickOutside)
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])
  
  const handleDrop = (targetLayerId: string) => {
    if (!canvas || !draggedLayer || draggedLayer === targetLayerId) return
    
    // 获取被拖拽图层和目标图层在列表中的位置
    const draggedIndex = layers.findIndex(l => l.id === draggedLayer)
    const targetIndex = layers.findIndex(l => l.id === targetLayerId)
    
    if (draggedIndex === -1 || targetIndex === -1) return
    
    // 创建新的图层顺序数组
    const newOrder = [...layers]
    const [draggedLayerItem] = newOrder.splice(draggedIndex, 1)
    
    // 将被拖拽的图层插入到目标位置
    newOrder.splice(targetIndex, 0, draggedLayerItem)
    
    // 获取所有对象并清空画布
    const allObjects = canvas.getObjects()
    
    // 保存背景色
    const bgColor = canvas.backgroundColor
    
    // 清空画布但不销毁对象
    canvas.clear()
    
    // 按照新的顺序重新添加所有对象
    // 图层列表顺序是从上到下，但画布对象顺序是从下到上
    for (let i = newOrder.length - 1; i >= 0; i--) {
      canvas.add(newOrder[i].object)
    }
    
    // 恢复背景色
    canvas.backgroundColor = bgColor
    
    canvas.renderAll()
    setDraggedLayer(null)
  }
  
  return (
    <>
      <div className="flex flex-col h-full w-60">
        {/* 添加新图层按钮 */}
        <button
          onClick={addNewLayer}
          className={`flex items-center justify-center gap-2 p-2 mb-2 rounded-lg transition-colors ${
            theme === 'dark' 
              ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400' 
              : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
          }`}
        >
          <Plus size={16} />
          <span>新建图层</span>
        </button>
        
        {/* 图层列表 */}
        <div className="flex-1 overflow-y-auto">
          {layers.length === 0 ? (
            <div className={`flex flex-col items-center justify-center p-4 ${
              theme === 'dark' ? 'text-slate-400' : 'text-gray-400'
            }`}>
              <Layers size={24} />
              <p className="text-sm mt-2">暂无图层</p>
            </div>
          ) : (
            <div className="space-y-1">
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  draggable
                  onDragStart={() => handleDragStart(layer.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(layer.id)}
                  onContextMenu={(e) => handleContextMenu(e, layer.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all w-full ${
                    selectedLayerId === layer.id 
                      ? theme === 'dark' 
                        ? 'bg-blue-600/20 border border-blue-500/30'
                        : 'bg-blue-100 border border-blue-300'
                      : theme === 'dark'
                        ? 'hover:bg-gray-700/50'
                        : 'hover:bg-gray-100'
                  }`}
                  onClick={() => selectLayer(layer.id)}
                >
                  {/* 拖拽手柄 */}
                  <GripVertical size={14} className={`${
                    theme === 'dark' ? 'text-slate-500' : 'text-gray-400'
                  } cursor-grab`} />
                  
                {/* 图层缩略图 */}
                <div className={`w-10 h-8 rounded flex-shrink-0 overflow-hidden ${
                  theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'
                }`}>
                  {/* 这里可以添加更详细的缩略图 */}
                  <div className="w-full h-full flex items-center justify-center text-xs">
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                      {layer.object?.type === 'i-text' || layer.object?.type === 'textbox' 
                        ? 'T' 
                        : layer.object?.type === 'image' 
                          ? '🖼' 
                          : layer.object?.type === 'rect' 
                            ? '▢' 
                            : layer.object?.type === 'circle' 
                              ? '○' 
                              : layer.object?.type === 'path' 
                                ? '⧣' 
                                : layer.object?.type === 'line' 
                                  ? '╱' 
                                  : '?'
                      }
                    </span>
                  </div>
                </div>
                
                {/* 图层名称 */}
                <div className={`flex-1 truncate text-sm min-w-0 ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  {layer.name}
                </div>
                  
                {/* 操作按钮 */}
                <div className="flex items-center gap-1">
                  {/* 可见性切换 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleVisibility(layer.id)
                    }}
                    className={`p-1 rounded transition-colors ${
                      theme === 'dark' 
                        ? 'hover:bg-gray-600/50 text-gray-400' 
                        : 'hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  
                  {/* 锁定切换 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleLock(layer.id)
                    }}
                    className={`p-1 rounded transition-colors ${
                      theme === 'dark' 
                        ? 'hover:bg-gray-600/50 text-gray-400' 
                        : 'hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                  
                  {/* 删除图层 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteLayer(layer.id)
                    }}
                    className={`p-1 rounded transition-colors ${
                      theme === 'dark' 
                        ? 'hover:bg-red-600/50 text-red-400' 
                        : 'hover:bg-red-100 text-red-500'
                    }`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* 右键菜单 */}
      {contextMenuLayerId && (
        <div 
          className={`fixed z-50 py-1 rounded-md shadow-lg border min-w-[150px] ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}
          style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              bringLayerToFront(contextMenuLayerId)
              closeContextMenu()
            }}
            className={`w-full text-left px-3 py-1.5 text-sm ${
              theme === 'dark' 
                ? 'text-gray-200 hover:bg-gray-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            置于顶层
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              sendLayerToBack(contextMenuLayerId)
              closeContextMenu()
            }}
            className={`w-full text-left px-3 py-1.5 text-sm ${
              theme === 'dark' 
                ? 'text-gray-200 hover:bg-gray-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            置于底层
          </button>
        </div>
      )}
    </>
  )
}