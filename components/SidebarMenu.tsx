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
    { id: '我的', icon: User, label: '我的', path: '/user/profile' },
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
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleMenuClick(item.id, item.path)}
            className={`w-full flex flex-col items-center p-3 rounded-lg mb-2 transition-colors ${
              activeMenu === item.id
                ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}