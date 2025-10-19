import axios from 'axios';

// 请求参数接口
interface ToVideoDvo {
  prompt: string;
  images?: string[];
  key: string;
  taskId?: string;
  duration?: string;
  resolution?: string;
  style?: string;
}

interface HumanDto {
  status: string;
  videoUrl?: string;
  error?: string;
}

/**
 * Sora2 模型配置 - 高级视频生成
 */
export const sora2Config = {
  name: 'Sora2',
  type: 'video' as const,
  baseUrl: process.env.NEXT_PUBLIC_SORA_API_BASE_URL || 'https://api.sora.ai/v2',
  defaultDuration: '10s',
  defaultResolution: '1080p',
  defaultStyle: 'realistic',
  supportedDurations: ['5s', '10s', '15s', '30s', '60s'],
  supportedResolutions: ['720p', '1080p', '2k', '4k'],
  supportedStyles: ['realistic', 'animated', 'cinematic', 'artistic', 'minimal'],
  
  // 创建视频生成任务
  async createVideo(toVideoDvo: ToVideoDvo): Promise<string> {
    const requestBody = {
      model: "sora-2",
      prompt: toVideoDvo.prompt,
      duration: toVideoDvo.duration || this.defaultDuration,
      resolution: toVideoDvo.resolution || this.defaultResolution,
      style: toVideoDvo.style || this.defaultStyle,
      num_videos: 1,
      motion_intensity: 5,
      camera_movement: "static",
      ...(toVideoDvo.images && toVideoDvo.images.length > 0 && {
        init_images: toVideoDvo.images
      })
    };
    
    const headers = {
      'Authorization': `Bearer ${process.env.SORA_API_KEY || toVideoDvo.key}`,
      'Content-Type': 'application/json',
      'X-Sora-Version': '2.0'
    };
    
    try {
      const response = await axios.post(`${this.baseUrl}/videos/generations`, requestBody, { headers });
      return response.data.id || response.data.task_id;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 查询视频生成任务状态
   */
  async getTask(toVideoDvo: ToVideoDvo): Promise<HumanDto | null> {
    const humanDto: HumanDto = { status: '3' };
    
    if (!toVideoDvo.taskId) {
      humanDto.error = '任务ID不能为空';
      return humanDto;
    }

    const headers = {
      'Authorization': `Bearer ${process.env.SORA_API_KEY || toVideoDvo.key}`,
      'Content-Type': 'application/json',
      'X-Sora-Version': '2.0'
    };
    
    try {
      const response = await axios.get(`${this.baseUrl}/videos/tasks/${toVideoDvo.taskId}`, { headers });
      
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
      throw error;
    }
  },

  // 验证API密钥格式
  validateApiKey(key: string): boolean {
    return key && key.startsWith('sk-sora-') && key.length > 15;
  },

  // 验证提示词格式
  validatePrompt(prompt: string): boolean {
    return prompt && prompt.trim().length > 0 && prompt.trim().length <= 1000;
  },

  // 获取支持的视频时长
  getSupportedDurations(): string[] {
    return this.supportedDurations;
  },

  // 获取支持的分辨率
  getSupportedResolutions(): string[] {
    return this.supportedResolutions;
  },

  // 获取支持的风格
  getSupportedStyles(): string[] {
    return this.supportedStyles;
  },

  // 验证时长是否支持
  validateDuration(duration: string): boolean {
    return this.supportedDurations.includes(duration);
  },

  // 验证分辨率是否支持
  validateResolution(resolution: string): boolean {
    return this.supportedResolutions.includes(resolution);
  }
};

export type { ToVideoDvo, HumanDto };