'use client'

import { useState, useEffect } from 'react'
import { Download, Clock, Calendar, Sparkles, ChevronRight, Trash2 } from 'lucide-react'

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
      
      setHistoryItems(mockHistory)
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
      {/* 保存当前画布按钮 */}
      <button
        onClick={saveToHistory}
        disabled={isLoading}
        className="flex items-center justify-center gap-2 p-2 mb-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors disabled:opacity-50"
      >
        <Sparkles size={16} />
        <span>保存当前创作</span>
      </button>
      
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
                        onClick={() => downloadHistoryItem(item)}
                        className="p-1 hover:bg-slate-600/50 rounded transition-colors"
                        title="下载"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => deleteHistoryItem(item.id)}
                        className="p-1 hover:bg-red-600/50 rounded transition-colors text-red-400"
                        title="删除"
                      >
                        <Trash2 size={14} />
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