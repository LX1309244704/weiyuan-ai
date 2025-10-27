import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json({ error: '缺少图片URL' }, { status: 400 });
    }

    // 验证URL格式
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      return NextResponse.json({ error: '无效的URL格式' }, { status: 400 });
    }

    // 设置超时时间（10秒）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      // 使用fetch获取图片
      const response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      // 获取图片数据
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // 检测图片类型
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      // 转换为base64
      const base64Data = `data:${contentType};base64,${buffer.toString('base64')}`;

      return NextResponse.json({ 
        imageData: base64Data,
        contentType: contentType,
        size: buffer.length
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({ error: '请求超时' }, { status: 408 });
      }
      
      throw fetchError;
    }

  } catch (error) {
    return NextResponse.json(
      { error: '无法获取图片数据' }, 
      { status: 500 }
    );
  }
}

// 添加GET方法用于测试
// export async function GET(request: NextRequest) {
//   return NextResponse.json({ message: '图片代理API正常运行' });
// }