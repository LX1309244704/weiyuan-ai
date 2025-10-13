'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlignLeft, AlignCenter, AlignRight, ChevronDown, ChevronRight, Bold, Italic } from 'lucide-react'

interface TextPropertiesPanelProps {
  canvas: any
}

export default function TextPropertiesPanel({ canvas }: TextPropertiesPanelProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedObject, setSelectedObject] = useState<any>(null)
  const [fontSize, setFontSize] = useState(20)
  const [fontColor, setFontColor] = useState('#000000')
  const [fontFamily, setFontFamily] = useState('Arial')
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left')
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [fillColor, setFillColor] = useState('transparent')
  const [strokeColor, setStrokeColor] = useState('transparent')
  const [strokeWidth, setStrokeWidth] = useState(0)
  const [position, setPosition] = useState({ left: 0, top: 0 })

  // 监听画布选中对象变化
  useEffect(() => {
    if (!canvas) return

    const handleSelectionCreated = () => {
      const activeObject = canvas.getActiveObject()
      // 只显示文字对象
      if (activeObject && activeObject.type === 'textbox') {
        setSelectedObject(activeObject)
        setIsVisible(true)
        
        // 更新属性值
        setFontSize(activeObject.fontSize || 20)
        setFontColor(activeObject.fill || '#000000')
        setFontFamily(activeObject.fontFamily || 'Arial')
        setTextAlign(activeObject.textAlign || 'left')
        setIsBold(activeObject.fontWeight === 'bold')
        setIsItalic(activeObject.fontStyle === 'italic')
        setFillColor(activeObject.backgroundColor || 'transparent')
        setStrokeColor(activeObject.stroke || 'transparent')
        setStrokeWidth(activeObject.strokeWidth || 0)
        
        // 设置面板位置（左边居中）
        const panelWidth = 280
        const panelHeight = 500
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

  // 更新文字属性
  const updateTextProperty = (property: string, value: any) => {
    if (!selectedObject || !canvas) return
    
    selectedObject.set(property, value)
    canvas.requestRenderAll()
  }

  // 处理字体大小变化
  const handleFontSizeChange = (size: number) => {
    setFontSize(size)
    updateTextProperty('fontSize', size)
  }

  // 处理字体颜色变化
  const handleFontColorChange = (color: string) => {
    setFontColor(color)
    updateTextProperty('fill', color)
  }

  // 处理字体变化
  const handleFontFamilyChange = (family: string) => {
    setFontFamily(family)
    updateTextProperty('fontFamily', family)
  }

  // 处理文字对齐变化
  const handleTextAlignChange = (align: 'left' | 'center' | 'right') => {
    setTextAlign(align)
    updateTextProperty('textAlign', align)
  }

  // 处理字体加粗变化
  const handleBoldToggle = () => {
    const newBoldState = !isBold
    setIsBold(newBoldState)
    updateTextProperty('fontWeight', newBoldState ? 'bold' : 'normal')
  }

  // 处理字体倾斜变化
  const handleItalicToggle = () => {
    const newItalicState = !isItalic
    setIsItalic(newItalicState)
    updateTextProperty('fontStyle', newItalicState ? 'italic' : 'normal')
  }

  // 键盘快捷键处理
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 检查是否在文字编辑模式
    if (canvas?.getActiveObject()?.isEditing) {
      return // 如果正在编辑文字，让Fabric.js处理键盘事件
    }
    
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
      event.preventDefault()
      handleBoldToggle()
    }
    
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'i') {
      event.preventDefault()
      handleItalicToggle()
    }
  }, [canvas, handleBoldToggle])

  // 添加键盘事件监听
  useEffect(() => {
    if (isVisible && selectedObject) {
      document.addEventListener('keydown', handleKeyDown)
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVisible, selectedObject, handleKeyDown])

  // 处理填充颜色变化
  const handleFillColorChange = (color: string) => {
    setFillColor(color)
    updateTextProperty('backgroundColor', color === 'transparent' ? null : color)
  }

  // 处理边框颜色变化
  const handleStrokeColorChange = (color: string) => {
    setStrokeColor(color)
    updateTextProperty('stroke', color === 'transparent' ? null : color)
  }

  // 处理边框宽度变化
  const handleStrokeWidthChange = (width: number) => {
    setStrokeWidth(width)
    updateTextProperty('strokeWidth', width)
  }

  // 预设颜色
  const presetColors = [
    '#000000', '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316',
    '#6366f1', '#4b5563', '#9ca3af', '#d1d5db', '#ffffff'
  ]

  // 字体选项
  const fontFamilies = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Verdana',
    'Courier New',
    'Impact',
    'Comic Sans MS',
    'Trebuchet MS',
    'Lucida Sans Unicode'
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
            {isCollapsed ? "文字" : "文字属性"}
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
            {/* 字体大小 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                字体大小: {fontSize}px
              </label>
              <input
                type="range"
                min="8"
                max="72"
                value={fontSize}
                onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* 字体颜色 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                字体颜色
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={fontColor}
                  onChange={(e) => handleFontColorChange(e.target.value)}
                  className="w-10 h-8 rounded border border-gray-300 dark:border-gray-600"
                />
                <input
                  type="text"
                  value={fontColor}
                  onChange={(e) => handleFontColorChange(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div className="grid grid-cols-5 gap-1">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleFontColorChange(color)}
                    className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* 字体选择 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                字体
              </label>
              <select 
                value={fontFamily}
                onChange={(e) => handleFontFamilyChange(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-gray-100"
              >
                {fontFamilies.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>

            {/* 文字样式 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                文字样式
              </label>
              <div className="flex space-x-2">
                {/* 加粗按钮 */}
                <button
                  onClick={handleBoldToggle}
                  className={`flex-1 p-2 rounded border flex items-center justify-center ${
                    isBold 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  title="加粗 (Ctrl+B)"
                >
                  <Bold className="h-4 w-4" />
                </button>
                
                {/* 倾斜按钮 */}
                <button
                  onClick={handleItalicToggle}
                  className={`flex-1 p-2 rounded border flex items-center justify-center ${
                    isItalic 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  title="倾斜 (Ctrl+I)"
                >
                  <Italic className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 文字对齐 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                文字对齐
              </label>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleTextAlignChange('left')}
                  className={`flex-1 p-2 rounded border ${
                    textAlign === 'left' 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <AlignLeft className="h-4 w-4 mx-auto" />
                </button>
                <button
                  onClick={() => handleTextAlignChange('center')}
                  className={`flex-1 p-2 rounded border ${
                    textAlign === 'center' 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <AlignCenter className="h-4 w-4 mx-auto" />
                </button>
                <button
                  onClick={() => handleTextAlignChange('right')}
                  className={`flex-1 p-2 rounded border ${
                    textAlign === 'right' 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <AlignRight className="h-4 w-4 mx-auto" />
                </button>
              </div>
            </div>

            {/* 背景填充 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                背景填充
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={fillColor === 'transparent' ? '#ffffff' : fillColor}
                  onChange={(e) => handleFillColorChange(e.target.value)}
                  className="w-10 h-8 rounded border border-gray-300 dark:border-gray-600"
                />
                <select 
                  value={fillColor}
                  onChange={(e) => handleFillColorChange(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="transparent">透明</option>
                  <option value="#ffffff">白色</option>
                  <option value="#f3f4f6">浅灰</option>
                  <option value="#e5e7eb">灰色</option>
                  <option value="#d1d5db">深灰</option>
                </select>
              </div>
            </div>

            {/* 边框设置 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                边框设置
              </label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-12">颜色:</span>
                  <input
                    type="color"
                    value={strokeColor === 'transparent' ? '#000000' : strokeColor}
                    onChange={(e) => handleStrokeColorChange(e.target.value)}
                    className="w-10 h-8 rounded border border-gray-300 dark:border-gray-600"
                  />
                  <select 
                    value={strokeColor}
                    onChange={(e) => handleStrokeColorChange(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="transparent">无边框</option>
                    <option value="#000000">黑色</option>
                    <option value="#3b82f6">蓝色</option>
                    <option value="#ef4444">红色</option>
                    <option value="#10b981">绿色</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-12">宽度:</span>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={strokeWidth}
                    onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-8">{strokeWidth}px</span>
                </div>
              </div>
            </div>

            {/* 文字内容预览 */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <div className="truncate">内容: {selectedObject.text || '无内容'}</div>
                <div>位置: ({Math.round(selectedObject.left)}, {Math.round(selectedObject.top)})</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}