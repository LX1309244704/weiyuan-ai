'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import NavigationBar from '@/components/NavigationBar'
import { Folder, Plus, Search, Filter, MoreHorizontal, Eye, Share2, Download } from 'lucide-react'

export default function UserProjectsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  // 模拟项目数据
  const projects = [
    {
      id: 1,
      name: '创意画板设计',
      description: '用于UI设计的创意画板项目',
      icon: '🎨',
      tags: ['设计', 'UI', '创意'],
      lastModified: '2024-10-18',
      size: '2.3 MB',
      collaborators: 3,
      views: 124
    },
    {
      id: 2,
      name: '数据可视化仪表板',
      description: '商业数据图表展示与分析',
      icon: '📊',
      tags: ['数据', '图表', '分析'],
      lastModified: '2024-10-15',
      size: '1.8 MB',
      collaborators: 2,
      views: 89
    },
    {
      id: 3,
      name: '移动应用产品原型',
      description: '现代化移动应用界面设计',
      icon: '📱',
      tags: ['原型', '移动端', '界面'],
      lastModified: '2024-10-10',
      size: '3.1 MB',
      collaborators: 1,
      views: 156
    },
    {
      id: 4,
      name: '品牌视觉识别系统',
      description: '企业品牌视觉规范设计',
      icon: '🏢',
      tags: ['品牌', '视觉', '规范'],
      lastModified: '2024-10-05',
      size: '4.2 MB',
      collaborators: 4,
      views: 67
    },
    {
      id: 5,
      name: '交互设计文档',
      description: '产品交互流程和规范',
      icon: '📝',
      tags: ['交互', '文档', '流程'],
      lastModified: '2024-10-01',
      size: '1.5 MB',
      collaborators: 2,
      views: 98
    },
    {
      id: 6,
      name: '营销素材库',
      description: '市场营销相关设计素材',
      icon: '🖼️',
      tags: ['营销', '素材', '设计'],
      lastModified: '2024-09-28',
      size: '5.7 MB',
      collaborators: 5,
      views: 203
    }
  ]

  return (
    <NavigationBar 
      title="我的项目" 
      icon={Folder}
      activeMenu="项目"
    >
      <div className="space-y-6">
        {/* 页面标题和操作栏 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">我的项目</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">管理您的所有创作项目</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索项目..."
                className="pl-10 pr-4 py-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* 筛选按钮 */}
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Filter className="w-4 h-4" />
              <span>筛选</span>
            </button>
            
            {/* 新建项目按钮 */}
            <button 
              onClick={() => router.push('/canvas')}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              <span>新建项目</span>
            </button>
          </div>
        </div>

        {/* 项目统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: '总项目数', value: '12', icon: '📁', color: 'blue' },
            { label: '协作项目', value: '6', icon: '👥', color: 'green' },
            { label: '本周更新', value: '3', icon: '🔄', color: 'purple' },
            { label: '存储用量', value: '18.6 MB', icon: '💾', color: 'orange' }
          ].map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                </div>
                <div className="text-3xl">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 项目网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-200 group">
              {/* 项目头部 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{project.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{project.description}</p>
                  </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              
              {/* 标签 */}
              <div className="flex flex-wrap gap-1 mb-4">
                {project.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
              
              {/* 项目信息 */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                <span>修改: {project.lastModified}</span>
                <span>{project.size}</span>
              </div>
              
              {/* 协作信息 */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                <div className="flex items-center space-x-1">
                  <span>👥 {project.collaborators}</span>
                  <span>👁️ {project.views}</span>
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex items-center space-x-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm">
                  <Eye className="w-4 h-4" />
                  <span>查看</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm">
                  <Share2 className="w-4 h-4" />
                  <span>分享</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm">
                  <Download className="w-4 h-4" />
                  <span>导出</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 空状态 */}
        {projects.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">
              📁
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">暂无项目</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              创建您的第一个项目，开始您的创作之旅
            </p>
            <button 
              onClick={() => router.push('/canvas')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              开始创作
            </button>
          </div>
        )}

        {/* 加载更多 */}
        {projects.length > 0 && (
          <div className="text-center">
            <button className="px-6 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              加载更多项目
            </button>
          </div>
        )}
      </div>
    </NavigationBar>
  )
}