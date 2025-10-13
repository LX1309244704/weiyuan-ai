'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface BrushPropertiesPanelProps {
  canvas: any
  brushSize: number
  brushColor: string
  onBrushSizeChange: (size: number) => void
  onBrushColorChange: (color: string) => void
}

export default function BrushPropertiesPanel({ 
  canvas, 
  brushSize, 
  brushColor, 
  onBrushSizeChange, 
  onBrushColorChange 
}: BrushPropertiesPanelProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [opacity, setOpacity] = useState(1)
  const [shadowEnabled, setShadowEnabled] = useState(false)
  const [shadowBlur, setShadowBlur] = useState(0)
  const [shadowColor, setShadowColor] = useState('#000000')
  const [shadowOffsetX, setShadowOffsetX] = useState(0)
  const [shadowOffsetY, setShadowOffsetY] = useState(0)
  const [position, setPosition] = useState({ left: 0, top: 0 })

  // 监听画笔工具激活状态
  useEffect(() => {
    if (!canvas) return

    const checkDrawingMode = () => {
      if (canvas.isDrawingMode && canvas.freeDrawingBrush) {
        // 检查是否是橡皮擦模式（通过画笔颜色判断）
        const isEraser = canvas.freeDrawingBrush.color === '#ffffff' || 
                        canvas.freeDrawingBrush.color === '#1f2937'
        
        if (!isEraser) {
          setIsVisible(true)
          
          // 设置面板位置（左边居中）
          const panelWidth = 280
          const panelHeight = 400
          const left = 20
          const top = Math.max(20, (window.innerHeight - panelHeight) / 2)
          
          setPosition({ left, top })
        } else {
          setIsVisible(false)
        }
      } else {
        setIsVisible(false)
      }
    }

    // 初始检查
    checkDrawingMode()

    // 监听画布状态变化
    const interval = setInterval(checkDrawingMode, 100)

    return () => clearInterval(interval)
  }, [canvas])

  // 监听画笔属性变化，实时更新画笔
  useEffect(() => {
    if (!canvas || !canvas.freeDrawingBrush) return
    
    const brush = canvas.freeDrawingBrush
    brush.width = brushSize
    brush.color = brushColor
    canvas.requestRenderAll()
  }, [canvas, brushSize, brushColor])

  // 更新画笔属性
  const updateBrushProperties = () => {
    if (!canvas || !canvas.freeDrawingBrush) return

    const brush = canvas.freeDrawingBrush
    
    // 设置基本属性
    brush.width = brushSize
    brush.color = brushColor
    
    // 设置透明度
    brush.globalAlpha = opacity
    
    // 设置阴影效果
    if (shadowEnabled) {
      brush.shadow = new (window as any).fabric.Shadow({
        color: shadowColor,
        blur: shadowBlur,
        offsetX: shadowOffsetX,
        offsetY: shadowOffsetY
      })
    } else {
      brush.shadow = null
    }
    
    // 强制刷新画布
    canvas.requestRenderAll()
  }

  // 处理透明度变化
  const handleOpacityChange = (value: number) => {
    setOpacity(value)
    updateBrushProperties()
  }

  // 处理阴影开关
  const handleShadowToggle = (enabled: boolean) => {
    setShadowEnabled(enabled)
    updateBrushProperties()
  }

  // 处理阴影模糊度变化
  const handleShadowBlurChange = (blur: number) => {
    setShadowBlur(blur)
    updateBrushProperties()
  }

  // 处理阴影颜色变化
  const handleShadowColorChange = (color: string) => {
    setShadowColor(color)
    updateBrushProperties()
  }

  // 处理阴影偏移变化
  const handleShadowOffsetXChange = (offset: number) => {
    setShadowOffsetX(offset)
    updateBrushProperties()
  }

  const handleShadowOffsetYChange = (offset: number) => {
    setShadowOffsetY(offset)
    updateBrushProperties()
  }

  // 预设颜色
  const presetColors = [
    '#000000', '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316',
    '#6366f1', '#4b5563', '#9ca3af', '#d1d5db', '#ffffff'
  ]

  // 画笔样式预设
  const brushPresets = [
    { name: '标准', size: 3, opacity: 1, shadow: false },
    { name: '细线', size: 1, opacity: 1, shadow: false },
    { name: '粗线', size: 8, opacity: 1, shadow: false },
    { name: '半透明', size: 5, opacity: 0.5, shadow: false },
    { name: '阴影效果', size: 4, opacity: 1, shadow: true, shadowBlur: 5 }
  ]

  if (!isVisible) {
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
            {isCollapsed ? "画笔" : "画笔属性"}
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
            {/* 画笔大小 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                画笔大小: {brushSize}px
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={(e) => onBrushSizeChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* 画笔颜色 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                画笔颜色
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => onBrushColorChange(e.target.value)}
                  className="w-10 h-8 rounded border border-gray-300 dark:border-gray-600"
                />
                <input
                  type="text"
                  value={brushColor}
                  onChange={(e) => onBrushColorChange(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div className="grid grid-cols-5 gap-1">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => onBrushColorChange(color)}
                    className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
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

            {/* 阴影效果 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  阴影效果
                </label>
                <button
                  onClick={() => handleShadowToggle(!shadowEnabled)}
                  className={`px-3 py-1 rounded text-xs ${
                    shadowEnabled 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {shadowEnabled ? '开启' : '关闭'}
                </button>
              </div>

              {shadowEnabled && (
                <div className="space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                  {/* 阴影模糊度 */}
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600 dark:text-gray-400">
                      模糊度: {shadowBlur}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={shadowBlur}
                      onChange={(e) => handleShadowBlurChange(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* 阴影颜色 */}
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600 dark:text-gray-400">
                      阴影颜色
                    </label>
                    <input
                      type="color"
                      value={shadowColor}
                      onChange={(e) => handleShadowColorChange(e.target.value)}
                      className="w-full h-8 rounded border border-gray-300 dark:border-gray-600"
                    />
                  </div>

                  {/* 阴影偏移 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-600 dark:text-gray-400">
                        X偏移: {shadowOffsetX}px
                      </label>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        value={shadowOffsetX}
                        onChange={(e) => handleShadowOffsetXChange(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-600 dark:text-gray-400">
                        Y偏移: {shadowOffsetY}px
                      </label>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        value={shadowOffsetY}
                        onChange={(e) => handleShadowOffsetYChange(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 画笔预设 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                画笔预设
              </label>
              <div className="grid grid-cols-2 gap-2">
                {brushPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      onBrushSizeChange(preset.size)
                      handleOpacityChange(preset.opacity)
                      handleShadowToggle(preset.shadow || false)
                      if (preset.shadowBlur) {
                        handleShadowBlurChange(preset.shadowBlur)
                      }
                    }}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border border-gray-200 dark:border-gray-600"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}