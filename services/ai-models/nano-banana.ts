import axios from 'axios';
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
  key: string;
  taskId?: string;
  size?: string;
  aspectRatio?: string;
}

interface HumanDto {
  status: string;
  imageUrl?: string;
}

/**
 * Nano-Banana 模型配置
 */
export const nanoBananaConfig = {
  name: 'Nano-Banana',
  type: 'image' as const,
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.jmyps.com/v1',
  defaultSize: '1024x1024',
  supportedSizes: ['1024x1024', '512x512', '256x256'],
  supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
  
  // 创建异步图片生成任务
  async createAsyncImage(toImageDvo: ToImageDvo): Promise<string> {
    // 使用环境变量中的API密钥
    const apiKey = process.env.NEXT_PUBLIC_NANO_BANANA_API_KEY || toImageDvo.key;
    
    // 根据宽高比获取对应的尺寸，优先使用aspectRatio
    const size = toImageDvo.aspectRatio 
      ? this.getSizeByAspectRatio(toImageDvo.aspectRatio)
      : toImageDvo.size || "1024x1024";
    
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
    const url = `${this.baseUrl}/images/generations`;
    const urlWithParams = `${url}?${qs.stringify({ async: 'true' })}`;
    
    try {
      // 发送POST请求
      const response = await axios.post(urlWithParams, map, { headers });
      console.log('Nano-Banana 返回的数据：', response.data);
      return response.data.task_id.toString();
    } catch (error) {
      console.error('Nano-Banana 请求失败：', error);
      throw error;
    }
  },

  /**
   * 根据taskId查询结果
   */
  async getTask(toImageDvo: ToImageDvo): Promise<HumanDto | null> {
    // 使用环境变量中的API密钥
    const apiKey = process.env.NEXT_PUBLIC_NANO_BANANA_API_KEY || toImageDvo.key;
    
    const humanDto: HumanDto = { status: ApiConst.STRING_THREE };
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36'
    };
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/images/tasks/${toImageDvo.taskId}`,
        { headers }
      );
      
      console.log('Nano-Banana 查询返回数据：', response.data);
      const result = response.data;
      
      if (result.code === 'success') {
        const taskData = result.data;
        const status = taskData.status;
        
        console.log('任务状态:', status);
        
        if (status === 'SUCCESS') {
          // 任务成功完成
          const imageData = taskData.data?.data;
          
          if (imageData && imageData.length > 0) {
            humanDto.status = ApiConst.STRING_TWO;
            humanDto.imageUrl = imageData[0].url;
            return humanDto;
          } else {
            // 没有图片数据，返回失败
            humanDto.status = ApiConst.STRING_THREE;
            return humanDto;
          }
        } else if (status === 'FAILURE') {
          // 任务失败
          humanDto.status = ApiConst.STRING_THREE;
          return humanDto;
        } else {
          // 任务未完成状态（NOT_START、IN_PROGRESS等），返回中间状态
          // 循环查询由ModelService统一处理
          humanDto.status = '1'; // 处理中状态，ModelService会继续查询
          return humanDto;
        }
      } else {
        // API调用失败
        console.error('API调用失败:', result.message);
        humanDto.status = ApiConst.STRING_THREE;
        return humanDto;
      }
    } catch (error) {
      console.error('Nano-Banana 查询任务失败：', error);
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
      '16:9': '1024x576',
      '9:16': '576x1024',
      '4:3': '1024x768',
      '3:4': '768x1024'
    };
    
    return ratioMap[aspectRatio] || this.defaultSize;
  }
};

export type { ToImageDvo, HumanDto };