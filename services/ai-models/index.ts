import { nanoBananaConfig, type ToImageDvo as NanoBananaDvo, type ImageDto as NanoBananaHumanDto } from './nano-banana';
import { seedream4Config, type ToImageDvo as Seedream4Dvo, type ImageDto as Seedream4HumanDto } from './seedream-4';
import { veo3Config, type ToVideoDvo as Veo3Dvo, type VideoDto as Veo3HumanDto } from './veo3';
import { sora2Config, type ToVideoDvo as Sora2Dvo, type VideoDto as Sora2HumanDto } from './sora2';
import { gpt5Config, type TextRequestDvo as Gpt5RequestDvo, type TextResponseDto as Gpt5ResponseDto } from './gpt5';
import { deepseekConfig, type TextRequestDvo as DeepSeekRequestDvo, type TextResponseDto as DeepSeekResponseDto } from './deepseek';
import { gemini25Config, type TextRequestDvo as Gemini25RequestDvo, type TextResponseDto as Gemini25ResponseDto } from './gemini2.5';

// 统一的模型类型定义
export type ModelType = 'image' | 'video' | 'text';
export type ImageModel = 'nano-banana' | 'seedream-4';
export type VideoModel = 'veo3.1' | 'sora2';
export type TextModel = 'gpt5' | 'deepseek' | 'gemini2.5';

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
  aspectRatio?: string;
  model: VideoModel;
}

export interface TextRequestDvo extends BaseRequestDvo {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  model: TextModel;
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

export interface TextResponseDto extends BaseResponseDto {
  text?: string;
}

// 模型配置映射
export const modelConfigs = {
  // 图片生成模型
  'nano-banana': nanoBananaConfig,
  'seedream-4': seedream4Config,
  
  // 视频生成模型
  'veo3.1': veo3Config,
  'sora2': sora2Config,
  
  // 文本生成模型
  'gpt5': gpt5Config,
  'deepseek': deepseekConfig,
  'gemini2.5': gemini25Config,
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
  'veo3.1': {
    name: 'Veo3.1',
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
  },
  'gpt5': {
    name: 'GPT-5',
    type: 'text' as const,
    description: 'OpenAI最新文本生成模型',
    supportsImageInput: false,
    maxPromptLength: 4000
  },
  'deepseek': {
    name: 'DeepSeek',
    type: 'text' as const,
    description: '深度求索文本生成模型',
    supportsImageInput: false,
    maxPromptLength: 4000
  },
  'gemini2.5': {
    name: 'Gemini 2.5',
    type: 'text' as const,
    description: 'Google Gemini文本生成模型',
    supportsImageInput: false,
    maxPromptLength: 4000
  }
} as const;

// 统一的模型服务类
export class ModelService {
  /**
   * 创建生成任务
   */
  static async createTask(request: ImageRequestDvo | VideoRequestDvo | TextRequestDvo): Promise<string> {
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
        // 为图片模型构建正确的参数对象，确保aspectRatio正确传递
        const imageRequest = request as ImageRequestDvo;
        const toImageDvo = {
          prompt: imageRequest.prompt,
          key: imageRequest.key,
          taskId: imageRequest.taskId,
          images: imageRequest.images,
          size: imageRequest.size,
          aspectRatio: imageRequest.aspectRatio // 确保aspectRatio参数传递
        };
        return await config.createAsyncImage(toImageDvo as any);
      } else if (config.type === 'video') {
        // 为视频模型构建正确的参数对象，确保aspectRatio正确传递
        const videoRequest = request as VideoRequestDvo;
        const toVideoDvo = {
          prompt: videoRequest.prompt,
          key: videoRequest.key,
          taskId: videoRequest.taskId,
          images: videoRequest.images,
          duration: videoRequest.duration,
          resolution: videoRequest.resolution,
          style: videoRequest.style,
          aspectRatio: videoRequest.aspectRatio // 确保aspectRatio参数传递
        };
        return await config.createVideo(toVideoDvo as any);
      } else if (config.type === 'text') {
        // 文本模型处理
        const textRequest = request as TextRequestDvo;
        const textDvo = {
          prompt: textRequest.prompt,
          key: textRequest.key,
          taskId: textRequest.taskId,
          maxTokens: textRequest.maxTokens,
          temperature: textRequest.temperature,
          topP: textRequest.topP
        };
        return await config.createTextGeneration(textDvo as any);
      } else {
        throw new Error(`不支持的模型类型`);
      }
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 查询任务状态（支持状态循环查询）
   */
  static async getTaskStatus(request: ImageRequestDvo | VideoRequestDvo | TextRequestDvo): Promise<ImageResponseDto | VideoResponseDto | TextResponseDto> {
    const model = request.model;
    const config = modelConfigs[model];
    
    if (!config) {
      throw new Error(`不支持的模型: ${model}`);
    }
    
    if (!request.taskId) {
      throw new Error('任务ID不能为空');
    }
    
    try {
      // 循环查询直到出现最终状态（SUCCESS或FAILURE）
      let result: any = null;
      let attempts = 0;
      const maxAttempts = 300; // 最多尝试5分钟（300秒）
      
      while (attempts < maxAttempts) {
        if (config.type === 'image') {
          result = await config.getTask(request as any);
        } else if (config.type === 'video') {
          result = await config.getTask(request as any);
        } else if (config.type === 'text') {
          result = await config.getTask(request as any);
        } else {
          throw new Error(`不支持的模型类型`);
        }
        
        // 检查是否为最终状态（SUCCESS或FAILURE）
        // 对于Nano-Banana模型，result.status为'2'表示成功，'3'表示失败
        // '1'表示处理中状态，需要继续循环查询
        if (result && (result.status === '2' || result.status === '3')) {
          break;
        }
        
        // 如果不是最终状态，等待1秒后继续查询
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
        }
      }
      
      // 如果达到最大尝试次数仍未获得最终状态，返回超时错误
      if (attempts >= maxAttempts && result && !(result.status === '2' || result.status === '3')) {
        return {
          status: '3',
          error: '任务状态查询超时'
        } as any;
      }
      
      // 返回标准化响应
      if (config.type === 'image') {
        return this.normalizeImageResponse(result);
      } else if (config.type === 'video') {
        return this.normalizeVideoResponse(result);
      } else {
        return this.normalizeTextResponse(result);
      }
    } catch (error) {
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
  
  // 标准化文本响应
  private static normalizeTextResponse(response: any): TextResponseDto {
    if (!response) {
      return { status: '3', error: '无响应数据' };
    }
    
    return {
      status: response.status || '3',
      text: response.text,
      error: response.error
    };
  }
}



// 默认导出模型服务
export default ModelService;