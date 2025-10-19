import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, existsSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json(
        { error: '内容不能为空' },
        { status: 400 }
      )
    }

    // 检查.env.local文件路径
    const envPath = join(process.cwd(), '.env.local')
    
    // 验证文件路径安全性
    if (!envPath.startsWith(process.cwd())) {
      return NextResponse.json(
        { error: '无效的文件路径' },
        { status: 400 }
      )
    }

    // 保存到.env.local文件
    writeFileSync(envPath, content, 'utf8')

    return NextResponse.json(
      { message: '配置保存成功' },
      { status: 200 }
    )

  } catch (error) {
    return NextResponse.json(
      { error: '保存失败，请检查文件权限' },
      { status: 500 }
    )
  }
}