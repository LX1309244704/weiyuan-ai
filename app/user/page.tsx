'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import NavigationBar from '@/components/NavigationBar'
import { Home, Plus, TrendingUp, Users, Star } from 'lucide-react'

export default function UserHomePage() {
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

  return (
    <NavigationBar 
      title="用户首页" 
      icon={Home}
      activeMenu="首页"
    >
      <div className="space-y-8">
        {/* 欢迎区域 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">欢迎回来！</h1>
          <p className="text-blue-100 text-lg">今天准备创作什么精彩内容？</p>
        </div>

        {/* 快速操作卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            onClick={() => router.push('/canvas')}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-200 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">开始创作</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">创建新的画板项目</p>
          </div>
          
          <div 
            onClick={() => router.push('/user/projects')}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-200 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">我的项目</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">查看和管理项目</p>
          </div>
          
          <div 
            onClick={() => router.push('/user/inspiration')}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-200 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">灵感库</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">探索创意灵感</p>
          </div>
          
          <div 
            onClick={() => router.push('/user/invitation')}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-200 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">邀请好友</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">邀请好友获得奖励</p>
          </div>
        </div>

        {/* 内容区域网格 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 最近活动 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">最近活动</h2>
              <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300">
                查看全部
              </button>
            </div>
            
            <div className="space-y-4">
              {[
                { icon: '🎨', title: '创建了新项目', time: '刚刚', type: '画板项目' },
                { icon: '💾', title: '保存了项目', time: '2小时前', type: '我的设计' },
                { icon: '📊', title: '导出了数据', time: '昨天', type: '数据可视化' },
                { icon: '👥', title: '分享了项目', time: '2天前', type: '团队协作' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-white dark:bg-gray-600 rounded-xl flex items-center justify-center text-lg">
                      {activity.icon}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{activity.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                    {activity.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 统计数据 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">创作统计</h2>
            
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: '项目总数', value: '12', change: '+2', color: 'blue' },
                { label: '本周创作', value: '3', change: '+1', color: 'green' },
                { label: '灵感收藏', value: '28', change: '+5', color: 'purple' },
                { label: '团队协作', value: '4', change: '+0', color: 'orange' }
              ].map((stat, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className={`text-2xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400 mb-1`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</div>
                  <div className={`text-xs text-${stat.color}-500 dark:text-${stat.color}-300`}>
                    {stat.change} 本周
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 快速开始模板 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">快速开始模板</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'UI设计模板', description: '现代界面设计起点', icon: '🎨', color: 'from-blue-500 to-cyan-500' },
              { title: '数据仪表板', description: '数据可视化模板', icon: '📊', color: 'from-green-500 to-teal-500' },
              { title: '产品原型', description: '移动应用原型设计', icon: '📱', color: 'from-purple-500 to-pink-500' }
            ].map((template, index) => (
              <div 
                key={index}
                onClick={() => router.push('/canvas')}
                className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${template.color} rounded-2xl flex items-center justify-center text-2xl text-white mb-4 group-hover:scale-110 transition-transform`}>
                  {template.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{template.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{template.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </NavigationBar>
  )
}