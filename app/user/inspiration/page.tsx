'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import NavigationBar from '@/components/NavigationBar'
import { Lightbulb, Search, Filter, Heart, Bookmark, Share2, Eye, Plus } from 'lucide-react'

// 导入JSON数据
import inspirationData from '@/data/inspiration.json'

export default function UserInspirationPage() {
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
  const inspirations = inspirationData.inspirations

  return (
    <NavigationBar 
      title="灵感库" 
      icon={Lightbulb}
      activeMenu="灵感"
    >
      <div className="space-y-6">
        {/* 页面标题和操作栏 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">灵感库</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">发现创意灵感，激发创作潜能</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索灵感..."
                className="pl-10 pr-4 py-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* 筛选按钮 */}
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Filter className="w-4 h-4" />
              <span>筛选</span>
            </button>
            

          </div>
        </div>

        {/* 灵感统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {inspirationData.stats.map((stat, index) => (
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

        {/* 热门标签 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">热门标签</h3>
          <div className="flex flex-wrap gap-2">
            {inspirationData.hotTags.map((tag, index) => (
              <button
                key={index}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-blue-100 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* 灵感网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inspirations.map((inspiration) => (
            <div key={inspiration.id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group">
              {/* 灵感图片 */}
              <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center relative">
                <span className="text-6xl text-white">💡</span>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* 灵感内容 */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{inspiration.createdAt}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">by {inspiration.author}</span>
                </div>
                
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {inspiration.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {inspiration.description}
                </p>
                
                {/* 标签 */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {inspiration.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
                

                
                {/* 操作按钮 */}
                <div className="flex items-center space-x-2">
                  <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm">
                    <Heart className="w-4 h-4" />
                    <span>喜欢</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm">
                    <Bookmark className="w-4 h-4" />
                    <span>收藏</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm">
                    <Share2 className="w-4 h-4" />
                    <span>分享</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 空状态 */}
        {inspirations.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">
              {inspirationData.emptyState.icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{inspirationData.emptyState.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {inspirationData.emptyState.description}
            </p>
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
              {inspirationData.emptyState.buttonText}
            </button>
          </div>
        )}

        {/* 加载更多 */}
        {inspirations.length > 0 && (
          <div className="text-center">
            <button className="px-6 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              加载更多灵感
            </button>
          </div>
        )}
      </div>
    </NavigationBar>
  )
}