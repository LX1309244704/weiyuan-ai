'use client'

import { useEffect, useRef, forwardRef } from 'react'

interface AdCreationCanvasProps {
  width: number
  height: number
  onCanvasReady?: (canvas: any) => void
  activeTool: string
}

const AdCreationCanvas = forwardRef<any, AdCreationCanvasProps>(({
  width,
  height,
  onCanvasReady,
  activeTool
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<any>(null)
  const textClickHandlerRef = useRef<any>(null)
  
  // 初始化画布
  useEffect(() => {
    if (!canvasRef.current) return
    
    // 使用延迟来确保Fabric.js已经加载
    const timer = setTimeout(() => {
      try {
        if (!window.fabric) {
          console.error('Fabric.js not loaded yet')
          return
        }
        
        const fabric = window.fabric
        
        // 创建画布
        const canvas = new fabric.Canvas(canvasRef.current, {
          width,
          height,
          backgroundColor: 'white',
          selection: true,
          preserveObjectStacking: true
        })
        
        fabricCanvasRef.current = canvas
        
        // 添加边框
        try {
          const rect = new fabric.Rect({
            left: 0,
            top: 0,
            width: width,
            height: height,
            fill: 'transparent',
            stroke: '#e5e7eb',
            strokeWidth: 1,
            selectable: false,
            evented: false,
            strokeDashArray: [5, 5]
          })
          canvas.add(rect)
          canvas.sendToBack(rect)
        } catch (error) {
          console.error('Error creating border:', error)
        }
        
        // 添加一个示例矩形
        try {
          const sampleRect = new fabric.Rect({
            left: 50,
            top: 50,
            width: 100,
            height: 100,
            fill: '#3b82f6',
            strokeWidth: 1,
            stroke: '#1e40af',
            rx: 5,
            ry: 5
          })
          canvas.add(sampleRect)
        } catch (error) {
          console.error('Error creating sample rectangle:', error)
        }
        
        // 历史记录功能 - 使用canvas对象作为数据存储
        canvas.historyData = []
        canvas.historyIndex = -1
        canvas.maxHistorySize = 20
        canvas.isUndoing = false
        canvas.isSaving = false
        
        // 保存状态函数
        canvas.saveState = (directState?: any) => {
          if (canvas.isUndoing || canvas.isSaving) return
          
          canvas.isSaving = true
          
          try {
            let state: string
            
            if (directState) {
              state = directState
            } else {
              state = JSON.stringify(canvas.toJSON([
                'left', 'top', 'width', 'height', 'fill', 'stroke', 'strokeWidth',
                'angle', 'scaleX', 'scaleY', 'type', 'originX', 'originY', 'opacity',
                'selectable', 'evented', 'visible', 'text', 'fontSize', 'fontFamily'
              ]))
            }
            
            // 更新历史数据
            canvas.historyData = canvas.historyData.slice(0, canvas.historyIndex + 1)
            canvas.historyData.push(state)
            canvas.historyIndex++
            
            // 限制历史记录数量
            if (canvas.historyData.length > canvas.maxHistorySize) {
              canvas.historyData.shift()
              canvas.historyIndex--
            }
            
            console.log('State saved, historyIndex:', canvas.historyIndex, 'historyData.length:', canvas.historyData.length)
          } catch (error) {
            console.error('Error saving state:', error)
          } finally {
            canvas.isSaving = false
          }
        }
        
        canvas.undo = () => {
          console.log('Undo called, historyIndex:', canvas.historyIndex, 'historyData.length:', canvas.historyData.length)
          
          if (canvas.historyIndex > 0) {
            canvas.isUndoing = true
            
            try {
              canvas.historyIndex--
              
              console.log('Undoing to index:', canvas.historyIndex)
              
              canvas.loadFromJSON(canvas.historyData[canvas.historyIndex], () => {
                canvas.renderAll()
                canvas.isUndoing = false
                console.log('Undo completed, new historyIndex:', canvas.historyIndex)
              })
            } catch (error) {
              console.error('Error during undo:', error)
              canvas.isUndoing = false
            }
          } else {
            console.log('Cannot undo: at start of history')
          }
        }
        
        canvas.redo = () => {
          console.log('Redo called, historyIndex:', canvas.historyIndex, 'historyData.length:', canvas.historyData.length)
          
          if (canvas.historyIndex < canvas.historyData.length - 1) {
            canvas.isUndoing = true
            
            try {
              canvas.historyIndex++
              
              console.log('Redoing to index:', canvas.historyIndex)
              
              canvas.loadFromJSON(canvas.historyData[canvas.historyIndex], () => {
                canvas.renderAll()
                canvas.isUndoing = false
                console.log('Redo completed, new historyIndex:', canvas.historyIndex)
              })
            } catch (error) {
              console.error('Error during redo:', error)
              canvas.isUndoing = false
            }
          } else {
            console.log('Cannot redo: at the end of history')
          }
        }
        
        // 使用防抖机制减少保存频率
        let saveTimeout: any = null
        const debouncedSave = () => {
          if (saveTimeout) clearTimeout(saveTimeout)
          saveTimeout = setTimeout(() => {
            try {
              canvas.saveState()
            } catch (error) {
              console.error('Error in debounced save:', error)
            }
          }, 300)
        }
        
        // 添加事件监听器
        canvas.on('object:modified', () => {
          if (canvas.saveState) canvas.saveState()
        })
        canvas.on('object:added', () => {
          if (canvas.saveState) canvas.saveState()
        })
        canvas.on('object:removed', () => {
          if (canvas.saveState) canvas.saveState()
        })
        
        // 保存初始状态
        try {
          canvas.saveState()
        } catch (error) {
          console.error('Error saving initial state:', error)
        }
        
        // 通知父组件
        if (onCanvasReady) {
          onCanvasReady(canvas)
        }
        
        if (ref) {
          (ref as any).current = canvas
        }
        
        // 设置默认工具
        canvas.isDrawingMode = false
        canvas.selection = true
        canvas.defaultCursor = 'default'
        canvas.hoverCursor = 'move'
        
      } catch (error) {
        console.error('Error initializing canvas:', error)
      }
    }, 100)
    
    return () => {
      clearTimeout(timer)
      // 清理画布和事件监听器，防止内存泄漏
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.off()
          fabricCanvasRef.current.dispose()
        } catch (error) {
          console.error('Error disposing canvas:', error)
        }
      }
    }
  }, [width, height, onCanvasReady])
  
  // 用于存储双击状态的引用，避免在每次工具切换时重新创建
  const textDoubleClickStateRef = useRef({
    lastClickTime: 0,
    lastClickTarget: null as any
  })
  
  // 文本双击处理函数，所有工具共用
  const handleTextDoubleClick = useRef((e: any) => {
    try {
      const target = e.target;
      if (target && target.type === 'i-text') {
        target.enterEditing();
        canvas.renderAll();
      }
    } catch (error) {
      console.error('Error handling text double click:', error)
    }
  })
  
  // 工具切换
  useEffect(() => {
    if (!fabricCanvasRef.current || !window.fabric) return
    
    const canvas = fabricCanvasRef.current
    const fabric = window.fabric
    
    try {
      // 清除所有事件监听器
      canvas.off('mouse:up')
      canvas.off('mouse:dblclick')
      
      // 重置所有工具状态
      canvas.isDrawingMode = false
      canvas.selection = true
      canvas.defaultCursor = 'default'
      canvas.hoverCursor = 'move'
      
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = 0
      }
      
      // 为所有工具添加双击文本编辑功能
      canvas.on('mouse:dblclick', handleTextDoubleClick.current)
      
      // 根据活动工具设置画布状态
      switch (activeTool) {
        case 'select':
          // 选择工具的默认设置已在上面设置
          break
          
        case 'brush':
          canvas.isDrawingMode = true
          if (canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.width = 3
            canvas.freeDrawingBrush.color = '#000000'
          }
          break
          
        case 'text':
          canvas.isDrawingMode = false
          canvas.selection = false
          canvas.defaultCursor = 'text'
          
          // 创建文字点击处理函数
          textClickHandlerRef.current = (e: any) => {
            try {
              // Fabric.js 的事件对象可能没有 preventDefault 方法
              if (e && typeof e.preventDefault === 'function') {
                e.preventDefault()
              }
              
              const currentTime = new Date().getTime();
              const pointer = canvas.getPointer(e.e || e)
              const target = e.target;
              
              // 获取双击状态
              const doubleClickState = textDoubleClickStateRef.current
              
              // 如果点击的是非文本对象或空白区域
              if (!target || target.type !== 'i-text') {
                const text = new fabric.IText('点击编辑文本', {
                  left: pointer.x,
                  top: pointer.y,
                  fontFamily: 'Arial',
                  fontSize: 20,
                  fill: '#000000',
                  editable: true,
                  hasControls: true,
                  hasBorders: true
                });
                
                canvas.add(text);
                canvas.setActiveObject(text);
                text.enterEditing();
                canvas.renderAll();
              }
              
              // 更新点击状态
              doubleClickState.lastClickTime = currentTime;
              doubleClickState.lastClickTarget = target;
              textDoubleClickStateRef.current = doubleClickState;
              
            } catch (error) {
              console.error('Error handling text click:', error)
            }
          }
          
          // 添加事件监听器
          canvas.on('mouse:up', textClickHandlerRef.current)
          break
          
        case 'mask-brush':
          canvas.isDrawingMode = true
          if (canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.width = 20
            canvas.freeDrawingBrush.color = 'rgba(59, 130, 246, 0.5)'
          }
          break
      }
    } catch (error) {
      console.error('Error setting tool:', error)
    }
  }, [activeTool])
  
  return <canvas ref={canvasRef} />
})

AdCreationCanvas.displayName = 'AdCreationCanvas'

export default AdCreationCanvas