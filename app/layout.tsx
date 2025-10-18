export const metadata = {
  title: 'WeiYuanAI - 可视化AI创意工作台',
  description: '基于先进AI技术，为您提供直观、高效的创意生成体验，帮助您实现从"我不会画"到"我能创造"的转变'
}

import './globals.css'
import ClientThemeProvider from '@/components/ClientThemeProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased">
        <ClientThemeProvider>
          {children}
        </ClientThemeProvider>
      </body>
    </html>
  )
}