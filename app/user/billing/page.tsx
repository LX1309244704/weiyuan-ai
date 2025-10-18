'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import NavigationBar from '@/components/NavigationBar'
import { CreditCard, DollarSign, TrendingUp, Calendar, Download, Receipt } from 'lucide-react'

export default function BillingPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { userInfo } = useUserStore()

  // 检查用户是否已登录
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  // 模拟账单数据
  const billingData = {
    currentBalance: 1500,
    usageThisMonth: 320,
    plan: 'Pro',
    nextBillingDate: '2024-12-01',
    billingHistory: [
      { id: 1, date: '2024-10-15', amount: 99, description: 'Pro Plan Subscription', status: 'Paid' },
      { id: 2, date: '2024-09-15', amount: 99, description: 'Pro Plan Subscription', status: 'Paid' },
      { id: 3, date: '2024-08-15', amount: 99, description: 'Pro Plan Subscription', status: 'Paid' },
      { id: 4, date: '2024-07-15', amount: 49, description: 'Basic Plan Subscription', status: 'Paid' }
    ]
  }

  return (
    <NavigationBar 
      title="账单管理" 
      icon={CreditCard}
      activeMenu="账单"
    >
      <div className="space-y-6">
        {/* 账户概览 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">当前余额</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ¥{billingData.currentBalance.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              充值余额
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">本月使用</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {billingData.usageThisMonth} 点数
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">剩余点数: {billingData.currentBalance - billingData.usageThisMonth}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">当前套餐</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{billingData.plan}</p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-full">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">下次扣费: {billingData.nextBillingDate}</p>
          </div>
        </div>

        {/* 套餐选择 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">选择套餐</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">基础版</h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">¥49<span className="text-sm font-normal text-gray-600 dark:text-gray-400">/月</span></p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• 1000 点数/月</li>
                <li>• 基础AI模型</li>
                <li>• 标准支持</li>
              </ul>
              <button className="w-full mt-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                选择套餐
              </button>
            </div>

            <div className="border-2 border-blue-500 dark:border-blue-400 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 dark:text-white">专业版</h4>
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">推荐</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">¥99<span className="text-sm font-normal text-gray-600 dark:text-gray-400">/月</span></p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• 5000 点数/月</li>
                <li>• 高级AI模型</li>
                <li>• 优先支持</li>
                <li>• 团队协作</li>
              </ul>
              <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                当前套餐
              </button>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">企业版</h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">¥199<span className="text-sm font-normal text-gray-600 dark:text-gray-400">/月</span></p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• 无限点数</li>
                <li>• 所有AI模型</li>
                <li>• 专属支持</li>
                <li>• 定制功能</li>
              </ul>
              <button className="w-full mt-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                选择套餐
              </button>
            </div>
          </div>
        </div>

        {/* 账单历史 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">账单历史</h3>
            <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              <Download className="w-4 h-4" />
              <span className="text-sm">导出账单</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">日期</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">描述</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">金额</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">操作</th>
                </tr>
              </thead>
              <tbody>
                {billingData.billingHistory.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{item.date}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{item.description}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">¥{item.amount}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'Paid' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                        <Receipt className="w-4 h-4" />
                        <span className="text-sm">查看详情</span>
                      </button>
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