import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ error: '缺少URL参数' }, { status: 400 });
    }

    // 验证URL格式
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return NextResponse.json({ error: '无效的URL格式' }, { status: 400 });
    }

    // 设置超时时间（15秒）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      // 使用fetch获取图片 - 添加更详细的错误处理
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/*,*/*;q=0.8',
          'Referer': 'http://localhost:3000'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
      }

      // 获取图片数据
      const arrayBuffer = await response.arrayBuffer();
      
      // 验证图片数据是否有效
      if (arrayBuffer.byteLength === 0) {
        throw new Error('图片数据为空');
      }
      
      const buffer = Buffer.from(arrayBuffer);
      
      // 检测图片类型
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      // 验证是否为有效的图片类型
      if (!contentType.startsWith('image/')) {
        throw new Error(`无效的内容类型: ${contentType}`);
      }
      
      // 直接返回图片数据流
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': buffer.length.toString(),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Cache-Control': 'public, max-age=86400' // 缓存1天
        }
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({ error: '请求超时' }, { status: 408 });
      }
      
      console.error('CORS代理错误:', fetchError);
      return NextResponse.json(
        { error: `代理请求失败: ${fetchError.message}` }, 
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('CORS代理全局错误:', error);
    return NextResponse.json(
      { error: '无法获取图片数据' }, 
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}