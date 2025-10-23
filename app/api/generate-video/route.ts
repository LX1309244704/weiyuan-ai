import { NextRequest, NextResponse } from 'next/server'
import { ModelService } from '@/services/ai-models'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      prompt, 
      model = 'sora2', 
      images = [], 
      duration = '10s', 
      aspectRatio = '16:9'
    } = body

    // 验证必填参数
    if (!prompt) {
      return NextResponse.json(
        { error: '提示词不能为空' },
        { status: 400 }
      )
    }

    // 验证模型类型
    if (model !== 'sora2') {
      return NextResponse.json(
        { error: `不支持的视频生成模型: ${model}` },
        { status: 400 }
      )
    }

    // 准备请求参数
    const videoRequest = {
      prompt,
      model: model as any,
      duration,
      aspectRatio,
      images: images.filter((img: string) => img && img.trim().length > 0)
    }

    // 创建视频生成任务
    const taskId = await ModelService.createTask(videoRequest)

    return NextResponse.json({
      success: true,
      taskId,
      message: '视频生成任务已创建'
    })

  } catch (error: any) {
    return NextResponse.json(
      { 
        error: error.response?.data?.error || error.message || '视频生成失败' 
      },
      { status: 500 }
    )
  }
}

// 查询视频生成状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const model = searchParams.get('model')

    if (!taskId || !model) {
      return NextResponse.json(
        { error: '任务ID和模型不能为空' },
        { status: 400 }
      )
    }

    // 验证模型类型
    if (model !== 'sora2') {
      return NextResponse.json(
        { error: `不支持的视频生成模型: ${model}` },
        { status: 400 }
      )
    }

    const videoRequest = {
      taskId,
      model: model as any,
      prompt: '' // 添加空的prompt属性以满足类型要求
    }

    const result = await ModelService.getTaskStatus(videoRequest)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error: any) {
    return NextResponse.json(
      { 
        error: error.response?.data?.error || error.message || '查询视频状态失败' 
      },
      { status: 500 }
    )
  }
}