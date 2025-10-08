'use client'

import { useState, useRef, useEffect } from 'react'
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

// 动态获取 fabric 对象，确保在客户端运行时才使用
const getFabric = () => {
  if (typeof window !== 'undefined') {
    return (window as any).fabric
  }
  return undefined
}

interface TextToolPanelProps {
  canvas: any
  isVisible: boolean
  onClose: () => void
  position: { left: number; top: number }
}

export default function TextToolPanel({ canvas, isVisible, onClose, position }: TextToolPanelProps) {
  const [fontSize, setFontSize] = useState(20)
  const [fontColor, setFontColor] = useState('#000000')
  const [fontFamily, setFontFamily] = useState('Arial')
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left')
  const panelRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isVisible, onClose])

  // 应用文字样式到当前选中的文字对象
  const applyTextStyle = () => {
    const fabric = getFabric()
    console.log('applyTextStyle called - fabric:', fabric, 'canvas:', canvas)
    if (!canvas || !fabric) {
      console.log('applyTextStyle: canvas or fabric not available')
      return
    }

    const activeObject = canvas.getActiveObject()
    console.log('Active object:', activeObject)
    if (activeObject && activeObject.type === 'textbox') {
      const textObject = activeObject as any
      
      textObject.set({
        fontSize,
        fill: fontColor,
        fontFamily,
        textAlign,
      })
      
      canvas.renderAll()
      console.log('Text style applied successfully')
    } else {
      console.log('No textbox object selected')
    }
    
    onClose()
  }

  // 添加新文字到画布
  const addTextToCanvas = () => {
    const fabric = getFabric()
    console.log('addTextToCanvas called - fabric:', fabric, 'canvas:', canvas)
    if (!canvas || !fabric) {
      console.log('addTextToCanvas: canvas or fabric not available')
      return
    }

    const centerX = canvas.width! / 2
    const centerY = canvas.height! / 2

    try {
      // 使用fabric.Textbox替代fabric.IText（Fabric.js 6.x版本）
      const text = new fabric.Textbox('双击编辑文字', {
        left: centerX - 100,
        top: centerY - 10,
        fontFamily,
        fontSize,
        fill: fontColor,
        textAlign,
        editable: true
      })

      canvas.add(text)
      canvas.setActiveObject(text)
      canvas.renderAll()
      console.log('Text added successfully')
    } catch (error) {
      console.error('Error adding text to canvas:', error)
    }
    
    onClose()
  }

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

  if (!isVisible) return null

  return (
    <div 
      ref={panelRef}
      className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50"
      style={{ 
        left: `${position.left}px`, 
        top: `${position.top}px`,
        width: '180px'
      }}
    >
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-semibold text-gray-900">文字工具</h4>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-lg"
        >
          ×
        </button>
      </div>

      <div className="space-y-3">
        {/* 文字大小 */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">文字大小</label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="8"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-gray-600 w-8">{fontSize}px</span>
          </div>
        </div>

        {/* 文字颜色 */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">文字颜色</label>
          <input
            type="color"
            value={fontColor}
            onChange={(e) => setFontColor(e.target.value)}
            className="w-full h-8 rounded border border-gray-300 cursor-pointer"
          />
        </div>

        {/* 文字字体 */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">文字字体</label>
          <select 
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-sm"
          >
            {fontFamilies.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>

        {/* 文字对齐 */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">文字对齐</label>
          <div className="flex space-x-1">
            <button
              onClick={() => setTextAlign('left')}
              className={`flex-1 p-2 rounded border ${
                textAlign === 'left' 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <AlignLeft className="h-4 w-4 mx-auto" />
            </button>
            <button
              onClick={() => setTextAlign('center')}
              className={`flex-1 p-2 rounded border ${
                textAlign === 'center' 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <AlignCenter className="h-4 w-4 mx-auto" />
            </button>
            <button
              onClick={() => setTextAlign('right')}
              className={`flex-1 p-2 rounded border ${
                textAlign === 'right' 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <AlignRight className="h-4 w-4 mx-auto" />
            </button>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex space-x-2 pt-1">
          <button
            onClick={applyTextStyle}
            className="flex-1 bg-blue-500 text-white py-2 px-3 rounded text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            应用
          </button>
          <button
            onClick={addTextToCanvas}
            className="flex-1 bg-green-500 text-white py-2 px-3 rounded text-sm font-medium hover:bg-green-600 transition-colors"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  )
}