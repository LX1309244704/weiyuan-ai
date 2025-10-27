'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import NavigationBar from '@/components/NavigationBar'
import { Folder, Plus, Search, Filter, MoreHorizontal, Trash2, Share2, Download } from 'lucide-react'

// 导入JSON数据
import projectsData from '@/data/projects.json'

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

  // 使用JSON数据
  const projects = projectsData.projects

  return (
    <NavigationBar 
      title="我的项目" 
      icon={Folder}
      activeMenu="项目"
    >
      <div className="space-y-6">
        {/* 页面标题和操作栏 */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">我的项目</h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">管理您的所有创作项目</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
            {/* 搜索框 */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索项目..."
                className="w-full pl-10 pr-4 py-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              {/* 筛选按钮 */}
              <button className="flex items-center space-x-2 px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-all duration-200 backdrop-blur-sm">
                <Filter className="w-4 h-4" />
                <span>筛选</span>
              </button>
              
              {/* 新建项目按钮 */}
              <button 
                onClick={() => router.push('/canvas')}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span>新建项目</span>
              </button>
            </div>
          </div>
        </div>

        {/* 项目统计 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projectsData.stats.map((stat, index) => (
            <div key={index} className="bg-gradient-to-br bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{stat.label}</div>
                </div>
                <div className="text-3xl opacity-80">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 项目网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-blue-200/50 dark:hover:border-blue-600/50">
              {/* 项目头部 */}
              <div className="flex items-start mb-4">
                <div className="flex items-start space-x-3">
                  <div className="text-3xl p-2 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl">
                    {project.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{project.description}</p>
                  </div>
                </div>
              </div>
              
              {/* 标签 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 text-blue-600 dark:text-blue-300 text-xs rounded-full border border-blue-100/50 dark:border-blue-800/50">
                    #{tag}
                  </span>
                ))}
              </div>
              
              {/* 项目信息 */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <span>👥 {project.collaborators}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span>👁️ {project.views}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>修改: {project.lastModified}</span>
                  </span>
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 text-sm font-medium">
                  <Trash2 className="w-4 h-4" />
                  <span>删除</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2.5 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50/50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200 text-sm font-medium">
                  <Share2 className="w-4 h-4" />
                  <span>分享</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2.5 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 rounded-lg transition-all duration-200 text-sm font-medium">
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
              {projectsData.emptyState.icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{projectsData.emptyState.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {projectsData.emptyState.description}
            </p>
            <button 
              onClick={() => router.push('/canvas')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {projectsData.emptyState.buttonText}
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