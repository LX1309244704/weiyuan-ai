import axios from 'axios';

// 请求参数接口
interface ToImageDvo {
  prompt: string;
  images?: string[];
  key: string;
  taskId?: string;
  size?: string;
  aspectRatio?: string;
}

interface HumanDto {
  status: string;
  imageUrl?: string;
  error?: string;
}

/**
 * Seedream-4 模型配置
 */
export const seedream4Config = {
  name: 'Seedream-4',
  type: 'image' as const,
  baseUrl: process.env.NEXT_PUBLIC_SEEDREAM_API_BASE_URL || 'https://api.seedream.ai/v1',
  defaultSize: '1024x1024',
  supportedSizes: ['1024x1024', '768x768', '512x512'],
  supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
  
  // 创建图片生成任务
  async createAsyncImage(toImageDvo: ToImageDvo): Promise<string> {
    // 使用环境变量中的API密钥
    const apiKey = process.env.NEXT_PUBLIC_SEEDREAM_API_KEY || toImageDvo.key;
    
    // 根据宽高比获取对应的尺寸（比例参数通过size对应）
    const size = toImageDvo.aspectRatio 
      ? this.getSizeByAspectRatio(toImageDvo.aspectRatio)
      : (toImageDvo.size || this.defaultSize);
    
    const requestBody = {
      model: "seedream-4",
      prompt: toImageDvo.prompt,
      size: size, // 比例参数通过size对应
      num_images: 1,
      guidance_scale: 7.5,
      steps: 50,
      ...(toImageDvo.images && toImageDvo.images.length > 0 && {
        init_image: toImageDvo.images[0],
        strength: 0.7
      })
    };
    
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    
    try {
      const response = await axios.post(`${this.baseUrl}/images/generations`, requestBody, { headers });
      return response.data.id || response.data.task_id;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 查询任务状态
   */
  async getTask(toImageDvo: ToImageDvo): Promise<HumanDto | null> {
    // 使用环境变量中的API密钥
    const apiKey = process.env.NEXT_PUBLIC_SEEDREAM_API_KEY || toImageDvo.key;
    
    const humanDto: HumanDto = { status: '3' };
    
    if (!toImageDvo.taskId) {
      humanDto.error = '任务ID不能为空';
      return humanDto;
    }

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    
    try {
      // 循环查询直到任务完成或失败
      while (true) {
        const response = await axios.get(`${this.baseUrl}/images/tasks/${toImageDvo.taskId}`, { headers });
        const result = response.data;
        
        if (result.code === 'success') {
          const taskData = result.data;
          const status = taskData.status;
          
          if (status === 'SUCCESS') {
            // 任务成功完成
            const imageData = taskData.data?.data;
            
            if (imageData && imageData.length > 0) {
              humanDto.status = '2';
              humanDto.imageUrl = imageData[0].url;
              return humanDto; // 成功获取图片，立即返回
            } else {
              // 没有图片数据，返回失败
              humanDto.status = '3';
              humanDto.error = '任务成功但未获取到图片数据';
              return humanDto;
            }
          } else if (status === 'FAILURE') {
            // 任务失败
            humanDto.status = '3';
            humanDto.error = taskData.fail_reason || '任务执行失败';
            return humanDto;
          } else if (status === 'NOT_START' || status === 'IN_PROGRESS') {
            // 任务未开始或处理中，等待1秒后继续查询
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          } else {
            // 未知状态，返回失败
            humanDto.status = '3';
            humanDto.error = '未知的任务状态';
            return humanDto;
          }
        } else {
          // API调用失败
          humanDto.status = '3';
          humanDto.error = result.message || 'API调用失败';
          return humanDto;
        }
      }
    } catch (error) {
      throw error;
    }
  },

  // 验证API密钥格式
  validateApiKey(key: string): boolean {
    return key && key.startsWith('sk-') && key.length > 10;
  },

  // 验证提示词格式
  validatePrompt(prompt: string): boolean {
    return prompt && prompt.trim().length > 0 && prompt.trim().length <= 1000;
  },

  // 获取支持的图片尺寸
  getSupportedSizes(): string[] {
    return this.supportedSizes;
  },

  // 获取支持的宽高比
  getSupportedAspectRatios(): string[] {
    return this.supportedAspectRatios;
  },

  // 根据宽高比获取对应的尺寸
  getSizeByAspectRatio(aspectRatio: string): string {
    const ratioMap: Record<string, string> = {
      '1:1': '1024x1024',
      '16:9': '1024x576',
      '9:16': '576x1024',
      '4:3': '1024x768',
      '3:4': '768x1024'
    };
    
    return ratioMap[aspectRatio] || this.defaultSize;
  }
};

export type { ToImageDvo, HumanDto };