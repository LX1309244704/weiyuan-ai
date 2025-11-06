'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Trash2, GripVertical, Layers, Plus, Lock, Unlock } from 'lucide-react'

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
  
  // 处理拖拽
  const handleDragStart = (layerId: string) => {
    setDraggedLayer(layerId)
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }
  
  const handleDrop = (targetLayerId: string) => {
    if (!canvas || !draggedLayer || draggedLayer === targetLayerId) return
    
    const draggedIndex = layers.findIndex(l => l.id === draggedLayer)
    const targetIndex = layers.findIndex(l => l.id === targetLayerId)
    
    if (draggedIndex === -1 || targetIndex === -1) return
    
    // 交换在画布中的顺序
    const draggedObject = layers[draggedIndex].object
    const targetObject = layers[targetIndex].object
    
    if (!draggedObject || !targetObject) return
    
    // 获取所有对象
    const allObjects = canvas.getObjects()
    
    // 找到对象在画布中的实际索引
    const draggedObjectIndex = allObjects.indexOf(draggedObject)
    const targetObjectIndex = allObjects.indexOf(targetObject)
    
    if (draggedObjectIndex === -1 || targetObjectIndex === -1) return
    
    // 从画布中移除被拖拽的对象
    canvas.remove(draggedObject)
    
    // 计算新的索引位置
    let newIndex = targetObjectIndex
    if (draggedIndex < targetIndex) {
      // 向下拖拽，目标位置在原目标之后
      newIndex = targetObjectIndex
    } else {
      // 向上拖拽，目标位置在原目标之前
      newIndex = targetObjectIndex + 1
    }
    
    // 在新位置插入对象
    allObjects.splice(newIndex, 0, draggedObject)
    
    // 清空画布并重新添加所有对象
    canvas.clear()
    allObjects.forEach(obj => {
      canvas.add(obj)
    })
    
    canvas.renderAll()
    setDraggedLayer(null)
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* 添加新图层按钮 */}
      <button
        onClick={addNewLayer}
        className="flex items-center justify-center gap-2 p-2 mb-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
      >
        <Plus size={16} />
        <span>新建图层</span>
      </button>
      
      {/* 图层列表 */}
      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-4 text-slate-400">
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
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                  selectedLayerId === layer.id 
                    ? 'bg-blue-600/20 border border-blue-500/30' 
                    : 'hover:bg-slate-700/30'
                }`}
                onClick={() => selectLayer(layer.id)}
              >
                {/* 拖拽手柄 */}
                <GripVertical size={14} className="text-slate-500 cursor-grab" />
                
                {/* 图层缩略图 */}
                <div className="w-8 h-8 bg-slate-600 rounded flex-shrink-0 overflow-hidden">
                  {/* 这里可以添加更详细的缩略图 */}
                  <div className="w-full h-full flex items-center justify-center text-xs">
                    {layer.object?.type || 'obj'}
                  </div>
                </div>
                
                {/* 图层名称 */}
                <div className="flex-1 truncate text-sm">
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
                    className="p-1 hover:bg-slate-600/50 rounded transition-colors"
                  >
                    {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  
                  {/* 锁定切换 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleLock(layer.id)
                    }}
                    className="p-1 hover:bg-slate-600/50 rounded transition-colors"
                  >
                    {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                  
                  {/* 删除图层 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteLayer(layer.id)
                    }}
                    className="p-1 hover:bg-red-600/50 rounded transition-colors text-red-400"
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
  )
}