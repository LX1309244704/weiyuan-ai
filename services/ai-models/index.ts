import { nanoBananaConfig, type ToImageDvo as NanoBananaDvo, type HumanDto as NanoBananaHumanDto } from './nano-banana';
import { seedream4Config, type ToImageDvo as Seedream4Dvo, type HumanDto as Seedream4HumanDto } from './seedream-4';
import { veo3Config, type ToVideoDvo as Veo3Dvo, type HumanDto as Veo3HumanDto } from './veo3';
import { sora2Config, type ToVideoDvo as Sora2Dvo, type HumanDto as Sora2HumanDto } from './sora2';

// 统一的模型类型定义
export type ModelType = 'image' | 'video' | 'text';
export type ImageModel = 'nano-banana' | 'seedream-4';
export type VideoModel = 'veo3' | 'sora2';
export type TextModel = 'gpt-4' | 'claude-3'; // 预留文本模型

// 统一的请求参数接口
export interface BaseRequestDvo {
  prompt: string;
  key: string;
  taskId?: string;
  images?: string[];
}

export interface ImageRequestDvo extends BaseRequestDvo {
  size?: string;
  aspectRatio?: string;
  model: ImageModel;
}

export interface VideoRequestDvo extends BaseRequestDvo {
  duration?: string;
  resolution?: string;
  style?: string;
  model: VideoModel;
}

export interface BaseResponseDto {
  status: string; // '0': 等待, '1': 处理中, '2': 成功, '3': 失败
  error?: string;
}

export interface ImageResponseDto extends BaseResponseDto {
  imageUrl?: string;
}

export interface VideoResponseDto extends BaseResponseDto {
  videoUrl?: string;
}

// 模型配置映射
export const modelConfigs = {
  // 图片生成模型
  'nano-banana': nanoBananaConfig,
  'seedream-4': seedream4Config,
  
  // 视频生成模型
  'veo3': veo3Config,
  'sora2': sora2Config,
} as const;

// 模型信息映射
export const modelInfo = {
  'nano-banana': {
    name: 'Nano-Banana',
    type: 'image' as const,
    description: '快速图片生成模型',
    supportsImageInput: true,
    maxPromptLength: 500
  },
  'seedream-4': {
    name: 'Seedream-4',
    type: 'image' as const,
    description: '高质量图片生成模型',
    supportsImageInput: true,
    maxPromptLength: 1000
  },
  'veo3': {
    name: 'Veo3',
    type: 'video' as const,
    description: '快速视频生成模型',
    supportsImageInput: true,
    maxPromptLength: 500
  },
  'sora2': {
    name: 'Sora2',
    type: 'video' as const,
    description: '高级视频生成模型',
    supportsImageInput: true,
    maxPromptLength: 1000
  }
} as const;

// 统一的模型服务类
export class ModelService {
  /**
   * 创建生成任务
   */
  static async createTask(request: ImageRequestDvo | VideoRequestDvo): Promise<string> {
    const model = request.model;
    const config = modelConfigs[model];
    
    if (!config) {
      throw new Error(`不支持的模型: ${model}`);
    }
    
    // 验证API密钥
    if (!config.validateApiKey(request.key)) {
      throw new Error('无效的API密钥');
    }
    
    // 验证提示词
    if (!config.validatePrompt(request.prompt)) {
      throw new Error('无效的提示词');
    }
    
    try {
      if (config.type === 'image') {
        return await config.createAsyncImage(request as any);
      } else if (config.type === 'video') {
        return await config.createVideo(request as any);
      } else {
        throw new Error(`不支持的模型类型`);
      }
    } catch (error) {
      console.error(`创建 ${model} 任务失败:`, error);
      throw error;
    }
  }
  
  /**
   * 查询任务状态（支持状态循环查询）
   */
  static async getTaskStatus(request: ImageRequestDvo | VideoRequestDvo): Promise<ImageResponseDto | VideoResponseDto> {
    const model = request.model;
    const config = modelConfigs[model];
    
    if (!config) {
      throw new Error(`不支持的模型: ${model}`);
    }
    
    if (!request.taskId) {
      throw new Error('任务ID不能为空');
    }
    
    try {
      // 循环查询直到出现最终状态（FAILURE或SUCCESS）
      let result: any = null;
      let attempts = 0;
      const maxAttempts = 300; // 最多尝试5分钟（300秒）
      
      while (attempts < maxAttempts) {
        if (config.type === 'image') {
          result = await config.getTask(request as any);
        } else if (config.type === 'video') {
          result = await config.getTask(request as any);
        } else {
          throw new Error(`不支持的模型类型`);
        }
        
        // 检查是否为最终状态（SUCCESS或FAILURE）
        // 对于Nano-Banana模型，result.status为'2'表示成功，'3'表示失败
        // '1'表示处理中状态，需要继续循环查询
        if (result.status === '2' || result.status === '3') {
          break;
        }
        
        // 如果不是最终状态，等待1秒后继续查询
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
        }
      }
      
      // 返回标准化响应
      if (config.type === 'image') {
        return this.normalizeImageResponse(result);
      } else {
        return this.normalizeVideoResponse(result);
      }
    } catch (error) {
      console.error(`查询 ${model} 任务状态失败:`, error);
      throw error;
    }
  }
  
  /**
   * 获取模型信息
   */
  static getModelInfo(model: string) {
    return modelInfo[model as keyof typeof modelInfo] || null;
  }
  
  /**
   * 获取所有支持的模型
   */
  static getSupportedModels(): string[] {
    return Object.keys(modelConfigs);
  }
  
  /**
   * 根据类型获取模型
   */
  static getModelsByType(type: ModelType): string[] {
    return Object.entries(modelInfo)
      .filter(([_, info]) => info.type === type)
      .map(([model]) => model);
  }
  
  /**
   * 验证模型配置
   */
  static validateModelConfig(model: string, key: string, prompt: string): { isValid: boolean; errors: string[] } {
    const config = modelConfigs[model as keyof typeof modelConfigs];
    const errors: string[] = [];
    
    if (!config) {
      errors.push(`不支持的模型: ${model}`);
      return { isValid: false, errors };
    }
    
    if (!config.validateApiKey(key)) {
      errors.push('无效的API密钥格式');
    }
    
    if (!config.validatePrompt(prompt)) {
      errors.push('提示词格式无效或长度超出限制');
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  // 标准化图片响应
  private static normalizeImageResponse(response: any): ImageResponseDto {
    if (!response) {
      return { status: '3', error: '无响应数据' };
    }
    
    return {
      status: response.status || '3',
      imageUrl: response.imageUrl,
      error: response.error
    };
  }
  
  // 标准化视频响应
  private static normalizeVideoResponse(response: any): VideoResponseDto {
    if (!response) {
      return { status: '3', error: '无响应数据' };
    }
    
    return {
      status: response.status || '3',
      videoUrl: response.videoUrl,
      error: response.error
    };
  }
}



// 默认导出模型服务
export default ModelService;