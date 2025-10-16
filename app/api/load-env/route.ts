import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    // 检查.env.local文件路径
    const envPath = join(process.cwd(), '.env.local')
    
    // 验证文件路径安全性
    if (!envPath.startsWith(process.cwd())) {
      return NextResponse.json(
        { error: '无效的文件路径' },
        { status: 400 }
      )
    }

    // 检查文件是否存在
    if (!existsSync(envPath)) {
      return NextResponse.json({
        nanoBananaApiKey: '',
        seedream4ApiKey: '',
        veo3ApiKey: '',
        sora2ApiKey: '',
        apiBaseUrl: 'https://api.jmyps.com/v1'
      })
    }

    // 读取.env.local文件内容
    const envContent = readFileSync(envPath, 'utf8')
    
    // 解析环境变量
    const config = {
      nanoBananaApiKey: '',
      seedream4ApiKey: '',
      veo3ApiKey: '',
      sora2ApiKey: '',
      apiBaseUrl: 'https://api.jmyps.com/v1'
    }

    // 解析环境变量
    const lines = envContent.split('\n')
    for (const line of lines) {
      const trimmedLine = line.trim()
      // 跳过注释和空行
      if (!trimmedLine || trimmedLine.startsWith('#')) continue
      
      const [key, value] = trimmedLine.split('=')
      if (key && value) {
        const cleanKey = key.trim()
        const cleanValue = value.trim()
        
        switch (cleanKey) {
          case 'NEXT_PUBLIC_NANO_BANANA_API_KEY':
            config.nanoBananaApiKey = cleanValue
            break
          case 'NEXT_PUBLIC_SEEDREAM4_API_KEY':
            config.seedream4ApiKey = cleanValue
            break
          case 'NEXT_PUBLIC_VEO3_API_KEY':
            config.veo3ApiKey = cleanValue
            break
          case 'NEXT_PUBLIC_SORA2_API_KEY':
            config.sora2ApiKey = cleanValue
            break
          case 'NEXT_PUBLIC_API_BASE_URL':
            config.apiBaseUrl = cleanValue
            break
        }
      }
    }

    return NextResponse.json(config)

  } catch (error) {
    console.error('读取.env.local文件失败:', error)
    return NextResponse.json(
      { error: '读取配置失败' },
      { status: 500 }
    )
  }
}