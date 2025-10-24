import axios from 'axios';
import { ApiKeyCache } from '@/utils/apiKeyCache';

// 请求参数接口
interface ToVideoDvo {
  prompt: string;
  images?: string[];
  taskId?: string;
  duration?: string;
  resolution?: string;
}

interface VideoDto {
  status: string;
  videoUrl?: string;
  error?: string;
}

/**
 * Veo3.1 模型配置 - 视频生成
 */
export const veo3Config = {
  name: 'Veo3.1',
  type: 'video' as const,
  baseUrl: ApiKeyCache.getApiBaseUrl(),
  defaultDuration: '8s',
  defaultResolution: '720p',
  supportedDurations: ['8s'],
  supportedResolutions: ['720p', '1080p'],
  
  // 创建视频生成任务
  async createVideo(toVideoDvo: ToVideoDvo): Promise<string> {
    // 直接从缓存获取API密钥
    const apiKey = ApiKeyCache.getApiKey();
    
    const requestBody = {
      model: "veo-3.1",
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
      return response.data.id || response.data.task_id;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 查询视频生成任务状态
   */
  async getTask(toVideoDvo: ToVideoDvo): Promise<VideoDto | null> {
    // 直接从缓存获取API密钥
    const apiKey = ApiKeyCache.getApiKey();
    
    const VideoDto: VideoDto = { status: '3' };
    
    if (!toVideoDvo.taskId) {
      VideoDto.error = '任务ID不能为空';
      return VideoDto;
    }

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    
    try {
      const response = await axios.get(`${this.baseUrl}/videos/tasks/${toVideoDvo.taskId}`, { headers });
      
      const result = response.data;
      
      // 根据新的API响应格式处理状态
      if (result.code === 'success') {
        const taskData = result.data;
        
        if (taskData.status === 'SUCCESS') {
          VideoDto.status = '2';
          // 获取data.data数组中的第一个url
          const videoData = taskData.data?.data?.[0];
          VideoDto.videoUrl = videoData?.url;
          return VideoDto;
        } else if (taskData.status === 'FAILURE') {
          VideoDto.status = '3';
          VideoDto.error = taskData.fail_reason || '视频生成失败';
          return VideoDto;
        } else if (taskData.status === 'IN_PROGRESS' || taskData.status === 'NOT_START') {
          VideoDto.status = '1';
          return VideoDto;
        }
      }
      
      return VideoDto;
    } catch (error) {
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

export type { ToVideoDvo, VideoDto };