export const metadata = {
  title: 'WeiYuanAI',
  description: '可视化AI创意工作台'
}

import './globals.css'
import ClientThemeProvider from '@/components/ClientThemeProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="antialiased">
        <ClientThemeProvider>
          {children}
        </ClientThemeProvider>
      </body>
    </html>
  )
}