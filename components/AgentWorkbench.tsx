'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Play, 
  Square, 
  Settings, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Brain, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Download,
  Share2
} from 'lucide-react'

interface AgentTask {
  id: string
  type: 'image' | 'video' | 'text' | 'composite'
  prompt: string
  models: string[]
  status: 'pending' | 'planning' | 'executing' | 'optimizing' | 'completed' | 'failed'
  results: AgentResult[]
  createdAt: Date
  updatedAt: Date
}

interface AgentResult {
  model: string
  type: 'image' | 'video' | 'text'
  content: string
  quality: number
  metadata: Record<string, any>
}

interface AgentWorkbenchProps {
  isOpen?: boolean
  onToggle?: (isOpen: boolean) => void
}

const AgentWorkbench = ({ isOpen = true, onToggle }: AgentWorkbenchProps) => {
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [activeTask, setActiveTask] = useState<AgentTask | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt5', 'seedream-4'])
  const [taskType, setTaskType] = useState<'image' | 'video' | 'text' | 'composite'>('composite')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [qualityPreference, setQualityPreference] = useState<'speed' | 'balanced' | 'quality'>('balanced')
  const [creativity, setCreativity] = useState(0.7)
  const [detailLevel, setDetailLevel] = useState(0.8)

  // 模拟任务执行
  const executeAgentTask = async () => {
    if (!prompt.trim()) {
      alert('请输入创作提示词')
      return
    }

    if (selectedModels.length === 0) {
      alert('请至少选择一个模型')
      return
    }

    setIsGenerating(true)
    
    const newTask: AgentTask = {
      id: `task_${Date.now()}`,
      type: taskType,
      prompt: prompt.trim(),
      models: selectedModels,
      status: 'planning',
      results: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setTasks(prev => [newTask, ...prev])
    setActiveTask(newTask)

    // 模拟任务执行过程
    try {
      // 规划阶段
      await simulateTaskPhase(newTask, 'planning', 2000)
      
      // 执行阶段
      await simulateTaskPhase(newTask, 'executing', 3000)
      
      // 生成模拟结果
      const mockResults: AgentResult[] = selectedModels.map(model => ({
        model,
        type: getModelType(model),
        content: `https://example.com/generated/${model}_${Date.now()}.${getModelType(model) === 'image' ? 'jpg' : getModelType(model) === 'video' ? 'mp4' : 'txt'}`,
        quality: Math.random() * 0.3 + 0.6, // 0.6-0.9之间的随机质量
        metadata: {
          generationTime: Date.now(),
          parameters: { creativity, detailLevel }
        }
      }))

      // 优化阶段
      await simulateTaskPhase(newTask, 'optimizing', 2000)
      
      // 完成
      await simulateTaskPhase(newTask, 'completed', 1000, mockResults)
      
    } catch (error) {
      await simulateTaskPhase(newTask, 'failed', 1000)
    } finally {
      setIsGenerating(false)
    }
  }

  const simulateTaskPhase = async (
    task: AgentTask, 
    status: AgentTask['status'], 
    delay: number,
    results?: AgentResult[]
  ) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setTasks(prev => prev.map(t => 
          t.id === task.id ? {
            ...t,
            status,
            results: results || t.results,
            updatedAt: new Date()
          } : t
        ))
        
        if (activeTask?.id === task.id) {
          setActiveTask(prev => prev ? {
            ...prev,
            status,
            results: results || prev.results,
            updatedAt: new Date()
          } : null)
        }
        
        resolve()
      }, delay)
    })
  }

  const getModelType = (model: string): 'image' | 'video' | 'text' => {
    if (['nano-banana', 'seedream-4'].includes(model)) return 'image'
    if (['sora2'].includes(model)) return 'video'
    return 'text'
  }

  const getStatusIcon = (status: AgentTask['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'executing': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      case 'optimizing': return <Zap className="w-4 h-4 text-yellow-500" />
      case 'planning': return <Brain className="w-4 h-4 text-purple-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: AgentTask['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'failed': return 'text-red-600'
      case 'executing': return 'text-blue-600'
      case 'optimizing': return 'text-yellow-600'
      case 'planning': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusText = (status: AgentTask['status']) => {
    switch (status) {
      case 'completed': return '已完成'
      case 'failed': return '失败'
      case 'executing': return '执行中'
      case 'optimizing': return '优化中'
      case 'planning': return '规划中'
      default: return '等待中'
    }
  }

  const availableModels = [
    { id: 'gpt5', name: 'GPT-5', type: 'text', description: 'OpenAI最新文本模型' },
    { id: 'deepseek', name: 'DeepSeek', type: 'text', description: '深度求索文本模型' },
    { id: 'gemini2.5', name: 'Gemini 2.5', type: 'text', description: 'Google文本模型' },
    { id: 'nano-banana', name: 'Nano-Banana', type: 'image', description: '快速图片生成' },
    { id: 'seedream-4', name: 'Seedream-4', type: 'image', description: '高质量图片生成' },
    { id: 'sora2', name: 'Sora2', type: 'video', description: '高级视频生成' }
  ]

  const toggleModelSelection = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    )
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => onToggle?.(true)}
        className="fixed right-4 top-20 bg-blue-600 text-white p-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        <Brain className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div className="fixed right-4 top-20 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[80vh] overflow-hidden">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6" />
            <h2 className="text-lg font-semibold">AI创作助手</h2>
          </div>
          <button 
            onClick={() => onToggle?.(false)}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm opacity-90 mt-1">智能Agent化创作工作流</p>
      </div>

      {/* 内容区域 */}
      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(80vh-120px)]">
        {/* 任务输入区域 */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">创作提示词</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述您想要创作的内容..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* 任务类型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">任务类型</label>
            <div className="grid grid-cols-2 gap-2">
              {['image', 'video', 'text', 'composite'].map(type => (
                <button
                  key={type}
                  onClick={() => setTaskType(type as any)}
                  className={`p-2 rounded text-sm font-medium transition-colors ${
                    taskType === type 
                      ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type === 'image' ? '图片' : type === 'video' ? '视频' : type === 'text' ? '文本' : '复合'}
                </button>
              ))}
            </div>
          </div>

          {/* 模型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">选择模型</label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {availableModels.map(model => (
                <label key={model.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedModels.includes(model.id)}
                    onChange={() => toggleModelSelection(model.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{model.name}</span>
                  <span className="text-xs text-gray-500">{model.description}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 高级设置 */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <Settings className="w-4 h-4" />
              <span>高级设置</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showAdvanced && (
              <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">质量偏好</label>
                  <div className="flex space-x-2">
                    {['speed', 'balanced', 'quality'].map(pref => (
                      <button
                        key={pref}
                        onClick={() => setQualityPreference(pref as any)}
                        className={`flex-1 p-1 text-xs rounded ${
                          qualityPreference === pref 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {pref === 'speed' ? '速度' : pref === 'balanced' ? '平衡' : '质量'}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    创意性: {Math.round(creativity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={creativity}
                    onChange={(e) => setCreativity(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    细节程度: {Math.round(detailLevel * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={detailLevel}
                    onChange={(e) => setDetailLevel(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 执行按钮 */}
          <button
            onClick={executeAgentTask}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isGenerating ? (
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>执行中...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Play className="w-4 h-4" />
                <span>开始智能创作</span>
              </div>
            )}
          </button>
        </div>

        {/* 任务列表 */}
        {tasks.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">任务历史</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {tasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => setActiveTask(task)}
                  className={`p-2 rounded border cursor-pointer transition-colors ${
                    activeTask?.id === task.id 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(task.status)}
                      <span className="text-sm font-medium truncate max-w-[120px]">
                        {task.prompt.slice(0, 20)}...
                      </span>
                    </div>
                    <span className={`text-xs ${getStatusColor(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {task.models.join(', ')} • {new Date(task.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 任务详情 */}
        {activeTask && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">任务详情</h3>
              <div className="flex space-x-1">
                <button className="p-1 text-gray-500 hover:text-gray-700">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-500 hover:text-gray-700">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-500">提示词:</span>
                <p className="text-sm">{activeTask.prompt}</p>
              </div>
              
              <div>
                <span className="text-xs text-gray-500">使用模型:</span>
                <p className="text-sm">{activeTask.models.join(', ')}</p>
              </div>
              
              <div>
                <span className="text-xs text-gray-500">生成结果:</span>
                <div className="space-y-2 mt-1">
                  {activeTask.results.map((result, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium">{result.model}</span>
                        <span className="text-xs text-gray-500">质量: {Math.round(result.quality * 100)}%</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1 truncate">
                        {result.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AgentWorkbench