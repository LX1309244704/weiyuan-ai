'use client'

import { useEffect, useRef, forwardRef } from 'react'
import { useUserStore } from '@/stores/userStore'

// 添加全局类型声明
declare global {
  interface Window {
    fabric: any
  }
}

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
  const borderRef = useRef<any>(null)
  
  // 获取主题状态
  const { theme } = useUserStore()
  const isInitializedRef = useRef(false)
  
  // 初始化画布
  useEffect(() => {
    if (!canvasRef.current || isInitializedRef.current) return
    
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
          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
          selection: true,
          preserveObjectStacking: true
        })
        
        fabricCanvasRef.current = canvas
        
        // 添加边框
        try {
          borderRef.current = new fabric.Rect({
            left: 0,
            top: 0,
            width: width,
            height: height,
            fill: 'transparent',
            stroke: theme === 'dark' ? '#374151' : '#e5e7eb',
            strokeWidth: 1,
            selectable: false,
            evented: false,
            strokeDashArray: [5, 5]
          })
          canvas.add(borderRef.current)
          canvas.sendToBack(borderRef.current)
        } catch (error) {
          console.error('Error creating border:', error)
        }
        
        // 历史记录功能
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
            
            // 更新历史数据 - 移除当前位置之后的所有历史记录
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
        
        // 撤销函数
        canvas.undo = () => {
          console.log('Undo called, historyIndex:', canvas.historyIndex, 'historyData.length:', canvas.historyData.length)
          
          // 检查是否有可撤销的历史记录
          if (!canvas.historyData || canvas.historyData.length === 0 || canvas.historyIndex <= 0) {
            console.log('Cannot undo: no history to undo')
            return
          }
          
          canvas.isUndoing = true
          
          try {
            // 减小历史索引
            canvas.historyIndex--
            
            console.log('Undoing to index:', canvas.historyIndex)
            
            // 加载前一个状态
            canvas.loadFromJSON(canvas.historyData[canvas.historyIndex], () => {
              // 确保所有对象正确渲染
              canvas.renderAll()
              canvas.isUndoing = false
              console.log('Undo completed, new historyIndex:', canvas.historyIndex)
            })
          } catch (error) {
            console.error('Error during undo:', error)
            canvas.isUndoing = false
          }
        }
        
        // 重做函数
        canvas.redo = () => {
          console.log('Redo called, historyIndex:', canvas.historyIndex, 'historyData.length:', canvas.historyData.length)
          
          // 检查是否有可重做的历史记录
          if (!canvas.historyData || canvas.historyData.length === 0) {
            console.log('Cannot redo: no history data')
            return
          }
          
          // 检查是否可以重做
          if (canvas.historyIndex >= canvas.historyData.length - 1) {
            console.log('Cannot redo: already at the latest state')
            return
          }
          
          canvas.isUndoing = true
          
          try {
            // 增加历史索引
            canvas.historyIndex++
            
            console.log('Redoing to index:', canvas.historyIndex)
            
            // 加载后一个状态
            canvas.loadFromJSON(canvas.historyData[canvas.historyIndex], () => {
              // 确保所有对象正确渲染
              canvas.renderAll()
              canvas.isUndoing = false
              console.log('Redo completed, new historyIndex:', canvas.historyIndex)
            })
          } catch (error) {
            console.error('Error during redo:', error)
            canvas.isUndoing = false
          }
        }
        
        // 使用防抖机制减少保存频率
        let saveTimeout: any = null
        const debouncedSave = () => {
          if (saveTimeout) clearTimeout(saveTimeout)
          saveTimeout = setTimeout(() => {
            try {
              console.log('Saving state after operation')
              canvas.saveState()
            } catch (error) {
              console.error('Error in debounced save:', error)
            }
          }, 300)
        }
        
        // 添加事件监听器
        canvas.on('object:modified', () => {
          console.log('Object modified, saving state')
          if (!canvas.isUndoing) {
            debouncedSave()
          }
        })
        canvas.on('object:added', () => {
          console.log('Object added, saving state')
          if (!canvas.isUndoing) {
            debouncedSave()
          }
        })
        canvas.on('object:removed', () => {
          console.log('Object removed, saving state')
          if (!canvas.isUndoing) {
            debouncedSave()
          }
        })
        
        // 保存初始状态
        try {
          console.log('Saving initial state')
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
        
        // 确保重做功能在父组件中可用
        console.log('Canvas initialized with redo function:', typeof canvas.redo)
        
        isInitializedRef.current = true
        
      } catch (error) {
        console.error('Error initializing canvas:', error)
      }
    }, 100)
    
    return () => {
      clearTimeout(timer)
      // 清理画布和事件监听器，防止内存泄漏
      if (fabricCanvasRef.current) {
        try {
          // 先清除所有事件监听器
          fabricCanvasRef.current.off()
          // 确保canvas对象仍然有效后再调用dispose
          if (fabricCanvasRef.current.lowerCanvasEl) {
            fabricCanvasRef.current.dispose()
          }
        } catch (error) {
          console.error('Error disposing canvas:', error)
        }
      }
      isInitializedRef.current = false
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
        fabricCanvasRef.current?.renderAll();
      }
    } catch (error) {
      console.error('Error handling text double click:', error)
    }
  })
  
  // 工具切换
  useEffect(() => {
    if (!fabricCanvasRef.current || !window.fabric || !isInitializedRef.current) return
    
    const canvas = fabricCanvasRef.current
    const fabric = window.fabric
    
    // 确保重做功能始终可用
    if (canvas.redo === undefined) {
      console.error('Redo function is not defined on canvas')
      return
    }
    
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
  
  // 主题更新
  useEffect(() => {
    if (!fabricCanvasRef.current) return
    
    const canvas = fabricCanvasRef.current
    const newBackgroundColor = theme === 'dark' ? '#1f2937' : '#ffffff'
    const newBorderColor = theme === 'dark' ? '#374151' : '#e5e7eb'
    
    try {
      // 只有当背景色确实需要改变时才更新
      if (canvas.backgroundColor !== newBackgroundColor) {
        canvas.backgroundColor = newBackgroundColor
      }
      
      // 更新边框颜色
      if (borderRef.current && borderRef.current.stroke !== newBorderColor) {
        borderRef.current.set('stroke', newBorderColor)
      }
      
      canvas.renderAll()
    } catch (error) {
      console.error('Error updating theme:', error)
    }
  }, [theme])
  
  return <canvas ref={canvasRef} />
})

AdCreationCanvas.displayName = 'AdCreationCanvas'

export default AdCreationCanvas