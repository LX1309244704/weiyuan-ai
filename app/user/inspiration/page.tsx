'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import NavigationBar from '@/components/NavigationBar'
import { Lightbulb, Search, Filter, Heart, Bookmark, Share2, Eye, Plus } from 'lucide-react'

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

  // 模拟灵感数据
  const inspirations = [
    {
      id: 1,
      title: '现代UI设计趋势',
      description: '探索最新的用户界面设计风格和最佳实践，包括暗色模式、玻璃拟态等流行设计元素',
      image: '/placeholder-image-1.jpg',
      tags: ['UI设计', '趋势', '现代'],
      likes: 234,
      saves: 56,
      views: 1247,
      author: '设计达人',
      createdAt: '2024-10-15'
    },
    {
      id: 2,
      title: '数据可视化技巧',
      description: '如何创建引人入胜的数据图表和可视化效果，提升数据传达的效率和美感',
      image: '/placeholder-image-2.jpg',
      tags: ['数据', '可视化', '图表'],
      likes: 189,
      saves: 42,
      views: 892,
      author: '数据分析师',
      createdAt: '2024-10-12'
    },
    {
      id: 3,
      title: '色彩搭配指南',
      description: '专业的色彩理论和实际应用案例，帮助您创建和谐统一的视觉体验',
      image: '/placeholder-image-3.jpg',
      tags: ['色彩', '设计', '搭配'],
      likes: 312,
      saves: 78,
      views: 1563,
      author: '色彩专家',
      createdAt: '2024-10-08'
    },
    {
      id: 4,
      title: '交互设计原则',
      description: '深入理解用户行为，创建直观易用的交互体验设计',
      image: '/placeholder-image-4.jpg',
      tags: ['交互', 'UX', '用户体验'],
      likes: 267,
      saves: 63,
      views: 1124,
      author: 'UX设计师',
      createdAt: '2024-10-05'
    },
    {
      id: 5,
      title: '品牌视觉系统',
      description: '构建完整的企业品牌视觉识别系统，确保品牌一致性',
      image: '/placeholder-image-5.jpg',
      tags: ['品牌', '视觉', '系统'],
      likes: 198,
      saves: 45,
      views: 967,
      author: '品牌设计师',
      createdAt: '2024-10-01'
    },
    {
      id: 6,
      title: '移动端设计规范',
      description: '移动应用界面设计的最佳实践和平台规范指南',
      image: '/placeholder-image-6.jpg',
      tags: ['移动端', '规范', '设计'],
      likes: 223,
      saves: 51,
      views: 1342,
      author: '移动设计师',
      createdAt: '2024-09-28'
    }
  ]

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
          {[
            { label: '灵感总数', value: '156', icon: '💡', color: 'blue' },
            { label: '我的收藏', value: '28', icon: '❤️', color: 'red' },
            { label: '本周新增', value: '12', icon: '🆕', color: 'green' },
            { label: '热门标签', value: '24', icon: '🏷️', color: 'purple' }
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

        {/* 热门标签 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">热门标签</h3>
          <div className="flex flex-wrap gap-2">
            {['UI设计', '数据可视化', '色彩搭配', '交互设计', '品牌设计', '移动端', '用户体验', '创意'].map((tag, index) => (
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
                
                {/* 互动数据 */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center space-x-4">
                    <span>❤️ {inspiration.likes}</span>
                    <span>🔖 {inspiration.saves}</span>
                    <span>👁️ {inspiration.views}</span>
                  </div>
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
              💡
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">暂无灵感</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              开始收集和创建您的第一个灵感，激发无限创意可能
            </p>
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
              探索灵感
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