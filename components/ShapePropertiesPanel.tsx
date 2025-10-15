'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface ShapePropertiesPanelProps {
  canvas: any
}

export default function ShapePropertiesPanel({ canvas }: ShapePropertiesPanelProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedObject, setSelectedObject] = useState<any>(null)
  const [fillColor, setFillColor] = useState('#3b82f6')
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [opacity, setOpacity] = useState(1)
  const [position, setPosition] = useState({ left: 0, top: 0 })

  // 监听画布选中对象变化
  useEffect(() => {
    if (!canvas) return

    const handleSelectionCreated = () => {
      const activeObject = canvas.getActiveObject()
      // 只显示形状对象（排除文字）
      const shapeTypes = ['rect', 'circle', 'triangle', 'polygon', 'ellipse', 'line', 'path']
      if (activeObject && shapeTypes.includes(activeObject.type)) {
        setSelectedObject(activeObject)
        setIsVisible(true)
        
        // 更新属性值
        setFillColor(activeObject.fill || '#3b82f6')
        setStrokeColor(activeObject.stroke || '#000000')
        setStrokeWidth(activeObject.strokeWidth || 2)
        setOpacity(activeObject.opacity || 1)
        
        // 设置面板位置（左边居中）
        const panelWidth = 280
        const panelHeight = 400
        const left = 20
        const top = Math.max(20, (window.innerHeight - panelHeight) / 2)
        
        setPosition({ left, top })
      } else {
        setIsVisible(false)
        setSelectedObject(null)
      }
    }

    const handleSelectionCleared = () => {
      setIsVisible(false)
      setSelectedObject(null)
    }

    canvas.on('selection:created', handleSelectionCreated)
    canvas.on('selection:updated', handleSelectionCreated)
    canvas.on('selection:cleared', handleSelectionCleared)

    return () => {
      canvas.off('selection:created', handleSelectionCreated)
      canvas.off('selection:updated', handleSelectionCreated)
      canvas.off('selection:cleared', handleSelectionCleared)
    }
  }, [canvas])

  // 更新对象属性
  const updateObjectProperty = (property: string, value: any) => {
    if (!selectedObject || !canvas) return
    
    selectedObject.set(property, value)
    canvas.requestRenderAll()
  }

  // 处理填充颜色变化
  const handleFillColorChange = (color: string) => {
    setFillColor(color)
    updateObjectProperty('fill', color)
  }

  // 处理边框颜色变化
  const handleStrokeColorChange = (color: string) => {
    setStrokeColor(color)
    updateObjectProperty('stroke', color)
  }

  // 处理边框宽度变化
  const handleStrokeWidthChange = (width: number) => {
    setStrokeWidth(width)
    updateObjectProperty('strokeWidth', width)
  }

  // 处理透明度变化
  const handleOpacityChange = (value: number) => {
    setOpacity(value)
    updateObjectProperty('opacity', value)
  }

  // 预设颜色
  const presetColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
    '#000000', '#4b5563', '#9ca3af', '#d1d5db', '#ffffff'
  ]

  if (!isVisible || !selectedObject) {
    return null
  }

  return (
    <div 
      className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-40"
      style={{ 
        left: `${position.left}px`, 
        top: `${position.top}px`,
        width: isCollapsed ? '120px' : '280px'
      }}
    >
      <div className={isCollapsed ? "p-2" : "p-4"}>
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold text-gray-900 dark:text-gray-100 ${isCollapsed ? "text-sm" : "text-lg"}`}>
            {isCollapsed ? "形状" : "形状属性"}
          </h3>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title={isCollapsed ? "展开" : "收缩"}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
        {!isCollapsed && (
          <div className="space-y-4 mt-2">
            {/* 填充颜色 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                填充颜色
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => handleFillColorChange(e.target.value)}
                  className="w-10 h-8 rounded border border-gray-300 dark:border-gray-600"
                />
                <input
                  type="text"
                  value={fillColor}
                  onChange={(e) => handleFillColorChange(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div className="grid grid-cols-5 gap-1">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleFillColorChange(color)}
                    className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* 边框颜色 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                边框颜色
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => handleStrokeColorChange(e.target.value)}
                  className="w-10 h-8 rounded border border-gray-300 dark:border-gray-600"
                />
                <input
                  type="text"
                  value={strokeColor}
                  onChange={(e) => handleStrokeColorChange(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>

            {/* 边框宽度 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                边框宽度: {strokeWidth}px
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={strokeWidth}
                onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* 透明度 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                透明度: {Math.round(opacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={opacity}
                onChange={(e) => handleOpacityChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* 对象信息 */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div>类型: {selectedObject.type}</div>
                <div>位置: ({Math.round(selectedObject.left)}, {Math.round(selectedObject.top)})</div>
                <div>尺寸: {Math.round(selectedObject.width)} × {Math.round(selectedObject.height)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}