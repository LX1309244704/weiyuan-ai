import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { targetUrl, method = 'POST', headers = {}, body } = await request.json();
    
    if (!targetUrl) {
      return NextResponse.json({ error: '缺少目标URL' }, { status: 400 });
    }

    // 验证URL格式
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      return NextResponse.json({ error: '无效的URL格式' }, { status: 400 });
    }

    // 设置超时时间（30秒）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      // 准备请求选项
      const fetchOptions: RequestInit = {
        signal: controller.signal,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
          // 移除可能导致问题的头信息
          'Host': '',
          'Origin': '',
          'Referer': ''
        }
      };

      // 添加请求体
      if (body && (method === 'POST' || method === 'PUT')) {
        fetchOptions.body = JSON.stringify(body);
      }

      // 发送请求到目标API
      const response = await fetch(targetUrl, fetchOptions);
      clearTimeout(timeoutId);

      // 获取响应数据
      const responseData = await response.json();
      
      // 返回原始状态码和数据
      return NextResponse.json(responseData, { status: response.status });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json({ error: '请求超时' }, { status: 408 });
      }
      
      return NextResponse.json(
        { error: '代理请求失败: ' + (fetchError instanceof Error ? fetchError.message : String(fetchError)) }, 
        { status: 500 }
      );
    }

  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误: ' + (error instanceof Error ? error.message : String(error)) }, 
      { status: 500 }
    );
  }
}

// 添加GET方法用于健康检查
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: '模型API代理服务正常运行' });
}