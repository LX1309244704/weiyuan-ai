import axios from 'axios';
import { validateApiBaseUrl } from '../../utils/apiConfigValidator';
import qs from 'qs';

// 常量定义
const SUCCESS_CODE = '0';
const SUCCESS_STATUS = 'SUCCESS';
const ApiConst = {
  STRING_TWO: '2',
  STRING_THREE: '3'
};

// 请求参数接口
interface ToImageDvo {
  prompt: string;
  images?: string[];
  taskId?: string;
  size?: string;
  aspectRatio?: string;
}

interface ImageDto {
  status: string;
  imageUrl?: string;
}

/**
 * Nano-Banana 模型配置
 */
export const nanoBananaConfig = {
  name: 'Nano-Banana',
  type: 'image' as const,
  baseUrl: '',
  defaultSize: '1024x1024',
  supportedSizes: ['1024x1024', '512x512', '256x256'],
  supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
  
  // 创建异步图片生成任务
  async createAsyncImage(toImageDvo: ToImageDvo): Promise<string> {
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
    
    // 根据宽高比获取对应的尺寸，优先使用aspectRatio
    const size = toImageDvo.aspectRatio 
      ? this.getSizeByAspectRatio(toImageDvo.aspectRatio)
      : toImageDvo.size || "auto";
    
    // 构建请求体
    const map = {
      model: "nano-banana",
      size: size,
      prompt: toImageDvo.prompt,
      image_urls: toImageDvo.images || []
    };
    
    // 设置请求头
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    
    // 构建带Query参数的URL
    const url = `${apiBaseUrl}/v1/images/generations`;
    const urlWithParams = `${url}?${qs.stringify({ async: 'true' })}`;
    
    try {
      // 发送POST请求
      const response = await axios.post(urlWithParams, map, { headers });
      return response.data.task_id.toString();
    } catch (error) {
      throw error;
    }
  },

  /**
   * 根据taskId查询结果
   */
  async getTask(toImageDvo: ToImageDvo): Promise<ImageDto | null> {
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
    
    const ImageDto: ImageDto = { status: ApiConst.STRING_THREE };
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    
    try {
      const response = await axios.get(
        `${apiBaseUrl}/v1/images/tasks/${toImageDvo.taskId}`,
        { headers }
      );
      
      const result = response.data;
      
      if (result.code === 'success') {
        const taskData = result.data;
        const status = taskData.status;
        
        if (status === 'SUCCESS') {
          // 任务成功完成
          const imageData = taskData.data?.data;
          
          if (imageData && imageData.length > 0) {
            ImageDto.status = ApiConst.STRING_TWO;
            ImageDto.imageUrl = imageData[0].url;
            return ImageDto;
          } else {
            // 没有图片数据，返回失败
            ImageDto.status = ApiConst.STRING_THREE;
            return ImageDto;
          }
        } else if (status === 'FAILURE') {
          // 任务失败
          ImageDto.status = ApiConst.STRING_THREE;
          return ImageDto;
        } else {
          // 任务未完成状态（NOT_START、IN_PROGRESS等），返回中间状态
          // 循环查询由ModelService统一处理
          ImageDto.status = '1'; // 处理中状态，ModelService会继续查询
          return ImageDto;
        }
      } else {
        // API调用失败
        ImageDto.status = ApiConst.STRING_THREE;
        return ImageDto;
      }
    } catch (error) {
      throw error;
    }
  },

  // 验证API密钥格式
  validateApiKey(key: string): boolean {
    return key && key.length > 0;
  },

  // 验证提示词格式
  validatePrompt(prompt: string): boolean {
    return prompt && prompt.trim().length > 0;
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
      '16:9': '2560x1440',
      '9:16': '1440x2560',
      '4:3': '2304x1728',
      '3:4': '1728x2304'
    };
    
    return ratioMap[aspectRatio] || this.defaultSize;
  }
};

export type { ToImageDvo, ImageDto };