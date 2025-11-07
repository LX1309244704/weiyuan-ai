'use client'

import { useState, useEffect } from 'react'
import { Download, Clock, Calendar, ChevronRight, Trash2, Plus } from 'lucide-react'

interface HistoryPanelProps {
  canvas: any
}

interface HistoryItem {
  id: string
  title: string
  timestamp: number
  preview: string
  canvasData?: any
}

export default function HistoryPanel({ canvas }: HistoryPanelProps) {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // 模拟从服务器加载历史记录
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true)
      
      // 这里应该是从服务器API获取数据，现在使用模拟数据
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockHistory: HistoryItem[] = [
        {
          id: '1',
          title: '春季促销广告',
          timestamp: Date.now() - 1000 * 60 * 5, // 5分钟前
          preview: 'https://picsum.photos/seed/ad1/200/150.jpg'
        },
        {
          id: '2',
          title: '新品发布海报',
          timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2小时前
          preview: 'https://picsum.photos/seed/ad2/200/150.jpg'
        },
        {
          id: '3',
          title: '周年庆活动',
          timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1天前
          preview: 'https://picsum.photos/seed/ad3/200/150.jpg'
        },
        {
          id: '4',
          title: '会员专享优惠',
          timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3天前
          preview: 'https://picsum.photos/seed/ad4/200/150.jpg'
        },
        {
          id: '5',
          title: '品牌形象设计',
          timestamp: Date.now() - 1000 * 60 * 60 * 24 * 7, // 7天前
          preview: 'https://picsum.photos/seed/ad5/200/150.jpg'
        }
      ]
      
      // 为每个历史项添加默认的canvasData
      const historyWithCanvasData = mockHistory.map((item, index) => {
        let canvasData
        
        switch (index) {
          case 0: // 春季促销广告
            canvasData = JSON.stringify({
              version: '5.3.0',
              objects: [
                {
                  type: 'rect',
                  left: 50,
                  top: 50,
                  width: 100,
                  height: 80,
                  fill: '#ff0000',
                  stroke: '#000000',
                  strokeWidth: 2
                },
                {
                  type: 'i-text',
                  left: 100,
                  top: 90,
                  text: '春季促销',
                  fontSize: 20,
                  fill: '#ffffff',
                  fontFamily: 'Arial'
                }
              ]
            })
            break
            
          case 1: // 新品发布海报
            canvasData = JSON.stringify({
              version: '5.3.0',
              objects: [
                {
                  type: 'rect',
                  left: 30,
                  top: 40,
                  width: 140,
                  height: 70,
                  fill: '#00ff00',
                  stroke: '#000000',
                  strokeWidth: 1
                },
                {
                  type: 'i-text',
                  left: 100,
                  top: 75,
                  text: '新品发布',
                  fontSize: 18,
                  fill: '#000000',
                  fontFamily: 'Arial'
                }
              ]
            })
            break
            
          case 2: // 周年庆活动
            canvasData = JSON.stringify({
              version: '5.3.0',
              objects: [
                {
                  type: 'circle',
                  left: 100,
                  top: 75,
                  radius: 50,
                  fill: '#0000ff',
                  stroke: '#ffffff',
                  strokeWidth: 2
                },
                {
                  type: 'i-text',
                  left: 100,
                  top: 75,
                  text: '周年庆',
                  fontSize: 16,
                  fill: '#ffffff',
                  fontFamily: 'Arial'
                }
              ]
            })
            break
            
          case 3: // 会员专享优惠
            canvasData = JSON.stringify({
              version: '5.3.0',
              objects: [
                {
                  type: 'rect',
                  left: 40,
                  top: 30,
                  width: 120,
                  height: 90,
                  fill: '#ff00ff',
                  stroke: '#000000',
                  strokeWidth: 1
                },
                {
                  type: 'i-text',
                  left: 100,
                  top: 75,
                  text: '会员优惠',
                  fontSize: 18,
                  fill: '#000000',
                  fontFamily: 'Arial'
                }
              ]
            })
            break
            
          case 4: // 品牌形象设计
            canvasData = JSON.stringify({
              version: '5.3.0',
              objects: [
                {
                  type: 'triangle',
                  left: 100,
                  top: 50,
                  width: 80,
                  height: 80,
                  fill: '#00ffff',
                  stroke: '#000000',
                  strokeWidth: 2
                },
                {
                  type: 'i-text',
                  left: 100,
                  top: 85,
                  text: '品牌形象',
                  fontSize: 16,
                  fill: '#000000',
                  fontFamily: 'Arial'
                }
              ]
            })
            break
            
          default:
            // 默认内容
            canvasData = JSON.stringify({
              version: '5.3.0',
              objects: [
                {
                  type: 'rect',
                  left: 50,
                  top: 50,
                  width: 100,
                  height: 80,
                  fill: '#cccccc',
                  stroke: '#000000',
                  strokeWidth: 2
                },
                {
                  type: 'i-text',
                  left: 100,
                  top: 90,
                  text: '示例文本',
                  fontSize: 16,
                  fill: '#000000',
                  fontFamily: 'Arial'
                }
              ]
            })
        }
        
        return {
          ...item,
          canvasData
        }
      })
      
      setHistoryItems(historyWithCanvasData)
      console.log('加载历史记录，第一项的canvasData:', historyWithCanvasData[0].canvasData ? '存在' : '不存在')
      setIsLoading(false)
    }
    
    loadHistory()
  }, [])
  
  // 保存当前画布到历史记录
  const saveToHistory = async () => {
    if (!canvas) return
    
    setIsLoading(true)
    
    try {
      // 生成预览图
      const previewDataURL = canvas.toDataURL({
        format: 'png',
        quality: 0.5,
        width: 200,
        height: 150
      })
      
      // 获取画布数据
      const canvasData = canvas.toJSON()
      
      // 创建新的历史记录项
      const newHistoryItem: HistoryItem = {
        id: `history-${Date.now()}`,
        title: `广告创作 ${new Date().toLocaleString()}`,
        timestamp: Date.now(),
        preview: previewDataURL,
        canvasData
      }
      
      // 添加到历史记录列表开头
      setHistoryItems(prev => [newHistoryItem, ...prev])
      
      // 显示保存成功提示
      const notification = document.createElement('div')
      notification.innerHTML = `
        <div class="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          已保存到历史记录
        </div>
      `
      document.body.appendChild(notification)
      
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 2000)
      
    } catch (error) {
      console.error('保存历史记录失败:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // 加载历史记录到画布
  const loadHistoryItem = (item: HistoryItem) => {
    if (!canvas || !item.canvasData) return
    
    try {
      // 清除当前画布
      canvas.clear()
      canvas.backgroundColor = 'white'
      
      // 加载历史数据
      canvas.loadFromJSON(item.canvasData, () => {
        canvas.renderAll()
      })
      
      // 显示加载成功提示
      const notification = document.createElement('div')
      notification.innerHTML = `
        <div class="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          已加载历史记录
        </div>
      `
      document.body.appendChild(notification)
      
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 2000)
      
    } catch (error) {
      console.error('加载历史记录失败:', error)
    }
  }
  
  // 下载历史记录项
  const downloadHistoryItem = (item: HistoryItem) => {
    const link = document.createElement('a')
    link.download = `${item.title}.png`
    link.href = item.preview
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  // 添加历史记录项到画板（保留当前画布内容）
  const addToCanvas = (item: HistoryItem) => {
    console.log('尝试添加到画板，历史项ID:', item.id)
    
    if (!canvas) {
      console.log('无法添加到画板: 画布不存在')
      return
    }
    
    if (!window.fabric) {
      console.log('无法添加到画板: Fabric.js未加载')
      return
    }
    
    if (!item.canvasData) {
      console.log('无法添加到画板: 历史记录没有画布数据')
      return
    }
    
    try {
      console.log('开始添加历史记录到画板:', item.id)
      const fabric = window.fabric
      
      // 直接解析JSON数据获取对象
      const canvasData = typeof item.canvasData === 'string' 
        ? JSON.parse(item.canvasData) 
        : item.canvasData
        
      if (!canvasData || !canvasData.objects || canvasData.objects.length === 0) {
        console.log('历史记录中没有对象')
        return
      }
      
      const objects = canvasData.objects
      console.log('历史记录对象数量:', objects.length)
      
      // 计算历史内容的边界框（基于原始数据）
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      
      objects.forEach(objData => {
        const objLeft = objData.left || 0
        const objTop = objData.top || 0
        let objWidth = 0
        let objHeight = 0
        
        if (objData.type === 'circle') {
          objWidth = objHeight = (objData.radius || 0) * 2
        } else if (objData.type === 'triangle') {
          objWidth = objData.width || 0
          objHeight = objData.height || 0
        } else {
          objWidth = objData.width || 0
          objHeight = objData.height || 0
        }
        
        minX = Math.min(minX, objLeft)
        minY = Math.min(minY, objTop)
        maxX = Math.max(maxX, objLeft + objWidth)
        maxY = Math.max(maxY, objTop + objHeight)
      })
      
      // 处理边界情况
      if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
        minX = 0
        minY = 0
        maxX = 100
        maxY = 100
      }
      
      const historyWidth = maxX - minX
      const historyHeight = maxY - minY
      const historyCenterX = minX + historyWidth / 2
      const historyCenterY = minY + historyHeight / 2
      
      // 获取实际画布尺寸
      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      const canvasCenterX = canvasWidth / 2
      const canvasCenterY = canvasHeight / 2
      
      console.log('画布尺寸:', { width: canvasWidth, height: canvasHeight })
      console.log('画布中心:', { x: canvasCenterX, y: canvasCenterY })
      console.log('历史内容边界:', { minX, minY, maxX, maxY })
      console.log('历史内容中心:', { x: historyCenterX, y: historyCenterY })
      
      // 计算偏移量
      const offsetX = canvasCenterX - historyCenterX
      const offsetY = canvasCenterY - historyCenterY
      
      console.log('计算偏移量:', { offsetX, offsetY })
      
      // 暂时禁用画布的事件监听器，避免自动保存状态
      const originalSelection = canvas.selection
      const originalEvented = canvas.evented
      
      canvas.selection = false
      canvas.evented = false
      
      // 临时移除事件监听器
      const eventListeners = canvas._events || {}
      const originalObjectAddedListener = eventListeners['object:added']
      const originalObjectModifiedListener = eventListeners['object:modified']
      
      // 移除事件监听器
      canvas.off('object:added')
      canvas.off('object:modified')
      
      // 直接使用fabric的enlivenObjects方法创建对象
      fabric.util.enlivenObjects(objects, (enlivenedObjects) => {
        console.log('enlivenedObjects 数量:', enlivenedObjects.length)
        
        enlivenedObjects.forEach((obj, index) => {
          try {
            // 应用偏移
            const currentLeft = obj.left || 0
            const currentTop = obj.top || 0
            
            obj.set({
              left: currentLeft + offsetX,
              top: currentTop + offsetY,
              selectable: true,
              evented: true
            })
            
            console.log(`添加对象 ${index} 到画布:`, {
              type: obj.type,
              originalLeft: currentLeft,
              originalTop: currentTop,
              newLeft: obj.left,
              newTop: obj.top
            })
            
            // 添加到当前画布
            canvas.add(obj)
          } catch (error) {
            console.error('添加对象时出错:', error)
          }
        })
        
        // 重新渲染画布
        canvas.renderAll()
        
        // 恢复画布的事件监听器
        canvas.selection = originalSelection
        canvas.evented = originalEvented
        
        // 恢复原始事件监听器
        if (originalObjectAddedListener) {
          canvas.on('object:added', originalObjectAddedListener)
        }
        if (originalObjectModifiedListener) {
          canvas.on('object:modified', originalObjectModifiedListener)
        }
        
        // 验证对象位置
        setTimeout(() => {
          console.log('验证添加的对象位置:')
          const addedObjects = canvas.getObjects().slice(-enlivenedObjects.length)
          addedObjects.forEach((obj, index) => {
            console.log(`对象 ${index}:`, {
              type: obj.type,
              left: obj.left,
              top: obj.top,
              width: obj.width || (obj.radius ? obj.radius * 2 : 0),
              height: obj.height || (obj.radius ? obj.radius * 2 : 0)
            })
          })
        }, 100)
      })
      
      // 显示添加成功提示
      const notification = document.createElement('div')
      notification.innerHTML = `
        <div class="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          已添加到画板
        </div>
      `
      document.body.appendChild(notification)
      
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 2000)
      
    } catch (error) {
      console.error('添加到画板失败:', error)
      
      // 显示错误提示
      const notification = document.createElement('div')
      notification.innerHTML = `
        <div class="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          添加到画板失败
        </div>
      `
      document.body.appendChild(notification)
      
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 2000)
    }
  }
  
  // 删除历史记录项
  const deleteHistoryItem = (itemId: string) => {
    setHistoryItems(prev => prev.filter(item => item.id !== itemId))
  }
  


  // 格式化时间戳
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    
    if (diff < 60 * 1000) {
      return '刚刚'
    } else if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))}分钟前`
    } else if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
    } else if (diff < 7 * 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
    } else {
      return new Date(timestamp).toLocaleDateString()
    }
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* 历史记录列表 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-4 text-slate-400">
            <Clock size={24} />
            <p className="text-sm mt-2">暂无历史记录</p>
          </div>
        ) : (
          <div className="space-y-2">
            {historyItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-700/30 rounded-lg overflow-hidden hover:bg-slate-700/50 transition-colors"
              >
                {/* 预览图 */}
                <div 
                  className="relative h-32 bg-slate-800/50 cursor-pointer"
                  onClick={() => loadHistoryItem(item)}
                >
                  <img 
                    src={item.preview} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* 加载按钮 */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                    <ChevronRight size={24} />
                  </div>
                </div>
                
                {/* 信息区域 */}
                <div className="p-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm truncate">{item.title}</h3>
                      <div className="flex items-center text-xs text-slate-400 mt-1">
                        <Calendar size={10} className="mr-1" />
                        <span>{formatTimestamp(item.timestamp)}</span>
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => addToCanvas(item)}
                        className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                        title="添加到画板"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => downloadHistoryItem(item)}
                        className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                        title="下载"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => deleteHistoryItem(item.id)}
                        className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}