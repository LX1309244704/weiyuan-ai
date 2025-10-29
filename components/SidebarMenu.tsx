'use client'

import { useRouter } from 'next/navigation'
import { Folder, Lightbulb, Database, User, CreditCard, Users, Home } from 'lucide-react'

interface SidebarMenuProps {
  activeMenu: string
  onMenuClick: (menuId: string) => void
  showInvitation?: boolean
}

export default function SidebarMenu({ activeMenu, onMenuClick, showInvitation = false }: SidebarMenuProps) {
  const router = useRouter()

  const menuItems = [
    { id: '首页', icon: Home, label: '首页', path: '/user' },
    { id: '项目', icon: Folder, label: '项目', path: '/user/projects' },
    { id: '灵感', icon: Lightbulb, label: '灵感', path: '/user/inspiration' },
    { id: '资产', icon: Database, label: '资产', path: '/user/assets' },
    { id: '账单', icon: CreditCard, label: '账单', path: '/user/billing' },
  ]

  if (showInvitation) {
    menuItems.push({ id: '邀请', icon: Users, label: '邀请', path: '/user/invitation' })
  }

  const handleMenuClick = (menuId: string, path: string) => {
    onMenuClick(menuId)
    router.push(path)
  }

  return (
    <div className="w-25 flex-shrink-0">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2 sticky top-24">
        {menuItems.map((item) => {
          // 为每个菜单项设置不同的颜色
          const getColorConfig = (menuId: string) => {
            switch(menuId) {
              case '首页': return 'from-blue-500 to-cyan-500'
              case '项目': return 'from-green-500 to-teal-500'
              case '灵感': return 'from-purple-500 to-pink-500'
              case '资产': return 'from-orange-500 to-red-500'
              case '账单': return 'from-indigo-500 to-purple-500'
              case '邀请': return 'from-pink-500 to-rose-500'
              default: return 'from-gray-500 to-gray-600'
            }
          }
          
          const colorConfig = getColorConfig(item.id)
          
          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id, item.path)}
              className={`w-full flex flex-col items-center p-3 rounded-lg mb-2 transition-all duration-200 ${
                activeMenu === item.id
                  ? 'bg-gradient-to-r ' + colorConfig + ' text-white shadow-lg transform scale-105'
                  : 'bg-gradient-to-r ' + colorConfig + ' text-white hover:shadow-lg hover:scale-105'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}