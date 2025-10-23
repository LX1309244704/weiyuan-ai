import axios from 'axios';
import { validateApiBaseUrl } from '../../utils/apiConfigValidator';

// 请求参数接口
interface ToVideoDvo {
  prompt: string;
  images?: string[];
  taskId?: string;
  duration?: string;
  resolution?: string;
  style?: string;
  aspectRatio?: string;
}

interface VideoDto {
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
  baseUrl: '',
  defaultDuration: '10',
  defaultResolution: '1080p',
  defaultStyle: 'realistic',
  supportedDurations: ['5', '10', '15', '30', '60'],
  // 获取支持的视频时长（带单位，用于UI显示）
  getSupportedDurationsWithUnit(): string[] {
    return this.supportedDurations.map(d => `${d}s`);
  },
  supportedResolutions: ['720p', '1080p', '2k', '4k'],
  supportedStyles: ['realistic', 'animated', 'cinematic', 'artistic', 'minimal'],
  
  // 创建视频生成任务
  async createVideo(toVideoDvo: ToVideoDvo): Promise<string> {
    // 从localStorage获取用户配置的API地址和密钥
    let apiBaseUrl = this.baseUrl;
    let apiKey = '';
    
    try {
      const savedConfig = localStorage.getItem('apiConfig');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        if (config.apiBaseUrl) apiBaseUrl = config.apiBaseUrl;
        if (config.apiKey) apiKey = config.apiKey;
      }
    } catch (error) {
      console.error('读取API配置失败:', error);
    }
    
    // 验证API域名地址
    validateApiBaseUrl(apiBaseUrl);
    const requestBody = {
      prompt: toVideoDvo.prompt,
      model: "sora-2",
      aspect_ratio: toVideoDvo.aspectRatio || "16:9",
      hd: true,
      duration: (toVideoDvo.duration || this.defaultDuration).replace('s', ''),
      watermark: false,
      ...(toVideoDvo.images && toVideoDvo.images.length > 0 && {
        images: toVideoDvo.images
      })
    };
    
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Sora-Version': '2.0'
    };
    
    try {
      const response = await axios.post(`${apiBaseUrl}/v2/videos/generations`, requestBody, { headers });
      
      return response.data.id || response.data.task_id;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 查询视频生成任务状态
   */
  async getTask(toVideoDvo: ToVideoDvo): Promise<VideoDto | null> {
    // 从localStorage获取用户配置的API地址和密钥
    let apiBaseUrl = this.baseUrl;
    let apiKey = '';
    
    try {
      const savedConfig = localStorage.getItem('apiConfig');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        if (config.apiBaseUrl) apiBaseUrl = config.apiBaseUrl;
        if (config.apiKey) apiKey = config.apiKey;
      }
    } catch (error) {
      console.error('读取API配置失败:', error);
    }
    
    // 验证API域名地址
    validateApiBaseUrl(apiBaseUrl);
    
    const VideoDto: VideoDto = { status: '3' };
    
    if (!toVideoDvo.taskId) {
      VideoDto.error = '任务ID不能为空';
      return VideoDto;
    }

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Sora-Version': '2.0'
    };
    
    try {
      const response = await axios.get(`${apiBaseUrl}/v2/videos/generations/${toVideoDvo.taskId}`, { headers });
      
      const result = response.data;
      
      // 根据新的API响应格式处理状态
      if (result.status === 'SUCCESS' || result.status === 'success' || result.status === 'SUCCESSFUL') {
        VideoDto.status = '2';
        
        // 尝试从多个可能的路径提取视频URL
        // 1. 首先尝试 result.data?.output
        // 2. 然后尝试 result.output
        // 3. 最后尝试 result.video_url 或 result.url
        VideoDto.videoUrl = result.data?.output || 
                           result.output || 
                           result.video_url || 
                           result.url ||
                           result.data?.url;
        
        // 如果视频URL是相对路径，转换为完整URL
        if (VideoDto.videoUrl && !VideoDto.videoUrl.startsWith('http')) {
          VideoDto.videoUrl = `${this.baseUrl}${VideoDto.videoUrl.startsWith('/') ? '' : '/'}${VideoDto.videoUrl}`;
        }
        
        return VideoDto;
      } else if (result.status === 'FAILURE' || result.status === 'failure' || result.status === 'FAILED') {
        VideoDto.status = '3';
        // 提取详细的失败原因
        let errorMessage = result.fail_reason || result.error || '视频生成失败';
        // 如果是JSON格式的错误信息，解析它
        if (errorMessage.startsWith('{') && errorMessage.endsWith('}')) {
          try {
            const errorObj = JSON.parse(errorMessage);
            errorMessage = errorObj.message || errorObj.error || errorMessage;
          } catch (e) {
            // 解析失败，保持原错误信息
          }
        }
        VideoDto.error = errorMessage;
        return VideoDto;
      } else if (result.status === 'IN_PROGRESS' || result.status === 'NOT_START' || result.status === 'PROCESSING' || result.status === 'in_progress' || result.status === 'PENDING') {
        VideoDto.status = '1';
        return VideoDto;
      }
      
      return VideoDto;
    } catch (error) {
      throw error;
    }
  },

  // 验证API密钥格式
  validateApiKey(key: string): boolean {
    return key && key.startsWith('sk-') && key.length > 15;
  },

  // 验证提示词格式
  validatePrompt(prompt: string): boolean {
    return prompt && prompt.trim().length > 0 && prompt.trim().length <= 1000;
  },

  // 获取支持的视频时长（不带单位，用于API调用）
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

export type { ToVideoDvo, VideoDto };