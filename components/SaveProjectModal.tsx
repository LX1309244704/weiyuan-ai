'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Upload, Image as ImageIcon, Save } from 'lucide-react'
import Button from './ui/Button'
import Input from './ui/Input'

interface SaveProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (projectData: { name: string; icon: string; description?: string; tags?: string[] }) => void
  defaultName?: string
  projectData?: { name: string; icon: string; description?: string; tags?: string[] }
}

const defaultIcons = [
  '🎨', '🖼️', '📐', '✏️', '🎯', '🌟', '💡', '📊',
  '🔄', '🎪', '📝', '🔍', '📌', '📍', '🖋️', '📎'
]

export default function SaveProjectModal({ isOpen, onClose, onSave, defaultName = '', projectData }: SaveProjectModalProps) {
  const [projectName, setProjectName] = useState(projectData?.name || defaultName)
  const [selectedIcon, setSelectedIcon] = useState(projectData?.icon || '🎨')
  const [description, setDescription] = useState(projectData?.description || '')
  const [tags, setTags] = useState<string[]>(projectData?.tags || [])
  const [customIcon, setCustomIcon] = useState('')
  const [showCustomIconInput, setShowCustomIconInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 当projectData变化时更新表单
  useEffect(() => {
    if (projectData) {
      setProjectName(projectData.name)
      setSelectedIcon(projectData.icon)
      setDescription(projectData.description || '')
      setTags(projectData.tags || [])
    }
  }, [projectData])

  const handleSave = () => {
    if (!projectName.trim()) {
      alert('请输入项目名称')
      return
    }

    const iconToUse = showCustomIconInput && customIcon ? customIcon : selectedIcon
    
    onSave({
      name: projectName.trim(),
      icon: iconToUse,
      description: description.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined
    })
    
    // 重置表单
    setProjectName('')
    setSelectedIcon('🎨')
    setDescription('')
    setTags([])
    setCustomIcon('')
    setShowCustomIconInput(false)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageData = e.target?.result as string
      setCustomIcon(imageData)
      setShowCustomIconInput(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCustomIconClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Save className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              保存画板为项目
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto flex-1 max-h-[calc(85vh-160px)]">
          <div className="space-y-6">
            {/* 项目名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                项目名称 *
              </label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="请输入项目名称"
                className="w-full"
              />
            </div>

            {/* 项目描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                项目描述（可选）
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请输入项目描述..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
            </div>

            {/* 项目标签 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                项目标签（可选）
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="输入标签，用#分隔（例如：#创意 #画板作品 #设计）"
                  defaultValue={tags.map(tag => `#${tag}`).join(' ')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  onBlur={(e) => {
                    const inputValue = e.target.value
                    // 使用正则表达式匹配所有#开头的标签
                    const tagMatches = inputValue.match(/#[^#\s]+/g) || []
                    const tags = tagMatches.map(tag => tag.substring(1).trim()).filter(tag => tag)
                    setTags(tags)
                  }}
                />
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  标签将显示在项目卡片中，帮助分类和组织项目
                  <br />
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    格式提示：使用 # 符号开头，多个标签用空格分隔
                  </span>
                  <br />
                  <span className="text-gray-400 dark:text-gray-500">
                    例如：#创意 #画板作品 #设计
                  </span>
                </div>
              </div>
            </div>

            {/* 项目图标 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                项目图标
              </label>
              
              <div className="mb-4">
                {/* 自定义图标上传 */}
                <div className="flex items-center space-x-3 mb-3">
                  <button
                    onClick={handleCustomIconClick}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 transition-colors ${
                      showCustomIconInput
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">上传图标</span>
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  {showCustomIconInput && customIcon && (
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 overflow-hidden">
                        <img 
                          src={customIcon} 
                          alt="自定义图标" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">已上传</span>
                    </div>
                  )}
                </div>
                
                {/* 默认图标选择 */}
                <div>
                  <div className="grid grid-cols-8 gap-2">
                    {defaultIcons.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => {
                          setSelectedIcon(icon)
                          setShowCustomIconInput(false)
                          setCustomIcon('')
                        }}
                        className={`p-2 rounded-lg text-2xl transition-colors ${
                          selectedIcon === icon && !showCustomIconInput
                            ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>

        {/* 底部操作按钮 */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600 flex-shrink-0">
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6"
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={!projectName.trim()}
              className="px-6"
            >
              保存项目
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}