'use client'

import { useState, useEffect } from 'react'

interface SelectionData {
  rect: any
  mousePosition: { x: number; y: number }
  screenPosition: { x: number; y: number }
}

interface SelectionPanelProps {
  selectedArea: SelectionData | null
  onGenerateImage: (prompt: string, model: string) => void
  onGenerateVideo: (prompt: string, model: string) => void
  onCaptureArea: () => Promise<string | null>
  onReceiveScreenshot?: (imageData: string, prompt: string) => void
  onClearSelection?: () => void
}

export default function SelectionPanel({ selectedArea, onGenerateImage, onCaptureArea, onReceiveScreenshot, onClearSelection }: SelectionPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [panelPosition, setPanelPosition] = useState({ left: 0, top: 0 })
  const [isVisible, setIsVisible] = useState(false)

  console.log('SelectionPanel 渲染，selectedArea:', selectedArea)

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    if (!selectedArea) {
      setIsVisible(false)
      return
    }

    const { screenPosition } = selectedArea
    
    console.log('SelectionPanel: 鼠标屏幕位置:', screenPosition)
    
    // 直接使用鼠标的屏幕位置计算面板位置
    const calculatePanelPosition = () => {
      const panelWidth = 60
      const panelHeight = 30
      
      // 使用鼠标的屏幕位置
      const screenX = screenPosition.x
      const screenY = screenPosition.y
      
      // 面板位置在鼠标最后位置附近
      let panelLeft = screenX + 10
      let panelTop = screenY + 10
      
      // 边界检查 - 如果超出屏幕右侧，调整到鼠标位置左侧
      if (panelLeft + panelWidth > window.innerWidth) {
        panelLeft = Math.max(10, screenX - panelWidth - 10)
      }
      
      // 边界检查 - 如果超出屏幕底部，调整到鼠标位置上方
      if (panelTop + panelHeight > window.innerHeight) {
        panelTop = Math.max(10, screenY - panelHeight - 10)
      }
      
      // 确保位置不会超出屏幕边界
      panelLeft = Math.max(10, Math.min(panelLeft, window.innerWidth - panelWidth - 10))
      panelTop = Math.max(10, Math.min(panelTop, window.innerHeight - panelHeight - 10))
      
      console.log('SelectionPanel: 鼠标屏幕位置:', { screenX, screenY })
      console.log('SelectionPanel: 面板最终位置:', { panelLeft, panelTop })
      return { left: panelLeft, top: panelTop }
    }
    
    const position = calculatePanelPosition()
    setPanelPosition(position)
    setIsVisible(true)
  }, [selectedArea])

  // 如果不显示面板，直接返回null
  if (!isVisible) {
    return null
  }

  return (
    <div 
      className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
      style={{ 
        left: `${panelPosition.left}px`, 
        top: `${panelPosition.top}px`,
        width: '60px',
        padding: '6px'
      }}
    >
      <button
        onClick={async () => {
          if (!selectedArea) return
          
          setIsGenerating(true)
          // 先截图
          const imageData = await onCaptureArea()
          if (imageData) {
            // 发送截图到AI创作助手的输入区域左侧
            if (onReceiveScreenshot) {
              const { left, top } = selectedArea.rect
              onReceiveScreenshot(imageData, `基于选择区域生成图片，位置: (${left.toFixed(0)}, ${top.toFixed(0)})`)
            }
            // 然后生成图片
            const { left, top } = selectedArea.rect
            onGenerateImage(`基于选择区域生成图片，位置: (${left.toFixed(0)}, ${top.toFixed(0)})`, 'stable-diffusion')
          }
          setIsGenerating(false)
          // 操作完成后隐藏面板和清除框选
          setIsVisible(false)
          onClearSelection?.()
        }}
        disabled={isGenerating}
        className="w-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 py-1 px-2 rounded text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? '...' : '生图'}
      </button>
    </div>
  )
}