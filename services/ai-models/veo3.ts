import axios from 'axios';

// 请求参数接口
interface ToVideoDvo {
  prompt: string;
  images?: string[];
  key: string;
  taskId?: string;
  duration?: string;
  resolution?: string;
}

interface HumanDto {
  status: string;
  videoUrl?: string;
  error?: string;
}

/**
 * Veo3 模型配置 - 视频生成
 */
export const veo3Config = {
  name: 'Veo3',
  type: 'video' as const,
  baseUrl: process.env.NEXT_PUBLIC_VEO_API_BASE_URL || 'https://api.veo.ai/v1',
  defaultDuration: '5s',
  defaultResolution: '720p',
  supportedDurations: ['3s', '5s', '10s', '15s', '30s'],
  supportedResolutions: ['480p', '720p', '1080p'],
  
  // 创建视频生成任务
  async createVideo(toVideoDvo: ToVideoDvo): Promise<string> {
    // 使用环境变量中的API密钥
    const apiKey = process.env.NEXT_PUBLIC_VEO_API_KEY || toVideoDvo.key;
    
    const requestBody = {
      model: "veo-3",
      prompt: toVideoDvo.prompt,
      duration: toVideoDvo.duration || this.defaultDuration,
      resolution: toVideoDvo.resolution || this.defaultResolution,
      num_videos: 1,
      ...(toVideoDvo.images && toVideoDvo.images.length > 0 && {
        init_image: toVideoDvo.images[0]
      })
    };
    
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    
    try {
      const response = await axios.post(`${this.baseUrl}/videos/generations`, requestBody, { headers });
      console.log('Veo3 返回的数据：', response.data);
      return response.data.id || response.data.task_id;
    } catch (error) {
      console.error('Veo3 请求失败：', error);
      throw error;
    }
  },

  /**
   * 查询视频生成任务状态
   */
  async getTask(toVideoDvo: ToVideoDvo): Promise<HumanDto | null> {
    // 使用环境变量中的API密钥
    const apiKey = process.env.NEXT_PUBLIC_VEO_API_KEY || toVideoDvo.key;
    
    const humanDto: HumanDto = { status: '3' };
    
    if (!toVideoDvo.taskId) {
      humanDto.error = '任务ID不能为空';
      return humanDto;
    }

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    
    try {
      const response = await axios.get(`${this.baseUrl}/videos/tasks/${toVideoDvo.taskId}`, { headers });
      console.log('Veo3 查询返回数据：', response.data);
      
      const result = response.data;
      
      // 根据新的API响应格式处理状态
      if (result.code === 'success') {
        const taskData = result.data;
        
        if (taskData.status === 'SUCCESS') {
          humanDto.status = '2';
          // 获取data.data数组中的第一个url
          const videoData = taskData.data?.data?.[0];
          humanDto.videoUrl = videoData?.url;
          return humanDto;
        } else if (taskData.status === 'FAILURE') {
          humanDto.status = '3';
          humanDto.error = taskData.fail_reason || '视频生成失败';
          return humanDto;
        } else if (taskData.status === 'IN_PROGRESS' || taskData.status === 'NOT_START') {
          humanDto.status = '1';
          return humanDto;
        }
      }
      
      return humanDto;
    } catch (error) {
      console.error('Veo3 查询任务失败：', error);
      throw error;
    }
  },

  // 验证API密钥格式
  validateApiKey(key: string): boolean {
    return key && key.startsWith('vk-') && key.length > 10;
  },

  // 验证提示词格式
  validatePrompt(prompt: string): boolean {
    return prompt && prompt.trim().length > 0 && prompt.trim().length <= 500;
  },

  // 获取支持的视频时长
  getSupportedDurations(): string[] {
    return this.supportedDurations;
  },

  // 获取支持的分辨率
  getSupportedResolutions(): string[] {
    return this.supportedResolutions;
  },

  // 将秒数转换为API需要的格式
  parseDuration(seconds: string): string {
    return seconds.endsWith('s') ? seconds : `${seconds}s`;
  }
};

export type { ToVideoDvo, HumanDto };