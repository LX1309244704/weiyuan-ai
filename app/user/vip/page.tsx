'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import NavigationBar from '@/components/NavigationBar'
import { Crown, Check, Star, Zap, Shield, Users, Globe, Infinity, CreditCard, Sparkles } from 'lucide-react'

// 导入JSON数据
import vipData from '@/data/vip.json'

export default function VIPPage() {
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

  const { pricingPlans, featureComparison, faqs, finalCTA, header } = vipData

  return (
    <NavigationBar 
      title="VIP套餐" 
      icon={Crown}
      activeMenu="账单"
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* 头部区域 */}
        <div className="text-center py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {header.title}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              {header.description}
            </p>
            
            {/* 年度/月度切换 */}
            <div className="inline-flex items-center bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg">
              {header.billingOptions.map((option, index) => (
                <button 
                  key={index}
                  className={`px-6 py-2 rounded-full ${
                    option.active 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 定价卡片 */}
        <div className="max-w-7xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl transition-all duration-300 hover:shadow-2xl ${
                  plan.popular ? 'ring-2 ring-blue-500 transform scale-105' : 'border border-gray-200 dark:border-gray-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      最受欢迎
                    </span>
                  </div>
                )}
                
                <div className="p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">{plan.description}</p>
                  </div>

                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center space-x-1">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {plan.price}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full bg-gradient-to-r ${plan.buttonColor} hover:shadow-xl text-white py-4 rounded-xl font-bold text-lg transition-all duration-200`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 功能对比表格 */}
        <div className="max-w-7xl mx-auto px-4 pb-16">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                功能详细对比
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                      <th className="text-left py-6 font-bold text-gray-900 dark:text-white text-lg">
                        功能特性
                      </th>
                      <th className="text-center py-6 font-bold text-gray-900 dark:text-white text-lg">
                        基础版
                      </th>
                      <th className="text-center py-6 font-bold text-gray-900 dark:text-white text-lg">
                        专业版
                      </th>
                      <th className="text-center py-6 font-bold text-gray-900 dark:text-white text-lg">
                        企业版
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureComparison.map((row, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-4 text-gray-700 dark:text-gray-300 font-medium">
                          {row.name}
                        </td>
                        <td className="text-center py-4 text-gray-600 dark:text-gray-400 font-medium">
                          {row.基础版}
                        </td>
                        <td className="text-center py-4 text-gray-600 dark:text-gray-400 font-medium">
                          {row.专业版}
                        </td>
                        <td className="text-center py-4 text-gray-600 dark:text-gray-400 font-medium">
                          {row.企业版}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ部分 */}
        <div className="max-w-4xl mx-auto px-4 pb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              常见问题
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              您可能关心的问题都在这里
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">
                  {faq.question}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 底部CTA */}
        <div className="max-w-4xl mx-auto px-4 pb-16">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-12 text-center text-white shadow-2xl">
            <Sparkles className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">{finalCTA.title}</h2>
            <p className="text-blue-100 text-xl mb-8 max-w-2xl mx-auto">
              {finalCTA.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {finalCTA.buttons.map((button, index) => (
                <button 
                  key={index}
                  className={`${button.variant === 'primary' ? 'bg-white text-blue-600 hover:bg-gray-100' : 'border-2 border-white text-white hover:bg-white hover:text-blue-600'} px-8 py-4 rounded-xl font-bold text-lg transition-colors`}
                >
                  {button.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </NavigationBar>
  )
}