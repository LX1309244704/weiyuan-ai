'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import NavigationBar from '@/components/NavigationBar'
import { Users, Share2, Copy, CheckCircle, Gift } from 'lucide-react'

// 导入JSON数据
import invitationData from '@/data/invitation.json'

export default function InvitationPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [copied, setCopied] = useState(false)

  // 检查用户是否已登录
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  // 使用JSON数据
  const { invitationData: data, rewardRules, tip } = invitationData

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <NavigationBar 
      title="邀请好友" 
      icon={Users}
      activeMenu="邀请"
    >
      <div className="space-y-6">
        {/* 邀请概览 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">已邀请好友</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.invitedCount} 人
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">成功注册的好友数量</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">已获得奖励</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.rewardsEarned} 点数
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-full">
                <Gift className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">邀请好友获得的奖励</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">待获得奖励</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {data.pendingRewards} 点数
                </p>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-full">
                <Gift className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">好友注册后可获得的奖励</p>
          </div>
        </div>

        {/* 邀请链接和奖励规则 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 邀请链接 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">邀请链接</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  邀请码
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={data.inviteCode}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => copyToClipboard(data.inviteCode)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? '已复制' : '复制'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  邀请链接
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={data.inviteLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(data.inviteLink)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? '已复制' : '复制'}</span>
                  </button>
                </div>
              </div>

              <button className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                <Share2 className="w-5 h-5" />
                <span>分享邀请链接</span>
              </button>
            </div>
          </div>

          {/* 奖励规则 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">奖励规则</h3>
            <div className="space-y-3">
              {rewardRules.map((rule, index) => (
                <div key={index} className={`flex items-center space-x-3 p-3 ${
                  index === 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 
                  index === 1 ? 'bg-green-50 dark:bg-green-900/20' : 
                  'bg-purple-50 dark:bg-purple-900/20'
                } rounded-lg`}>
                  <div className={`w-8 h-8 ${
                    index === 0 ? 'bg-blue-100 dark:bg-blue-800' : 
                    index === 1 ? 'bg-green-100 dark:bg-green-800' : 
                    'bg-purple-100 dark:bg-purple-800'
                  } rounded-full flex items-center justify-center`}>
                    <span className={`${
                      index === 0 ? 'text-blue-600 dark:text-blue-300' : 
                      index === 1 ? 'text-green-600 dark:text-green-300' : 
                      'text-purple-600 dark:text-purple-300'
                    } font-bold`}>{rule.icon}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{rule.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{rule.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                {tip}
              </p>
            </div>
          </div>
        </div>

        {/* 邀请历史 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">邀请历史</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">邮箱</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">邀请日期</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">奖励</th>
                </tr>
              </thead>
              <tbody>
                {data.invitationHistory.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{item.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{item.date}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === '已注册' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {item.reward > 0 ? `${item.reward} 点数` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </NavigationBar>
  )
}