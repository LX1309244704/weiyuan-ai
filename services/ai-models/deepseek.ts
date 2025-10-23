import axios from 'axios';
import { validateApiBaseUrl } from '../../utils/apiConfigValidator';

// 请求参数接口
interface TextRequestDvo {
  prompt: string;
  key: string;
  taskId?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

interface TextResponseDto {
  status: string; // '0': 等待, '1': 处理中, '2': 成功, '3': 失败
  text?: string;
  error?: string;
}

/**
 * DeepSeek 文本生成模型配置
 */
export const deepseekConfig = {
  name: 'DeepSeek',
  type: 'text' as const,
  baseUrl: '',
  defaultMaxTokens: 2048,
  defaultTemperature: 0.7,
  defaultTopP: 0.9,
  
  // 创建文本生成任务
  async createTextGeneration(request: TextRequestDvo): Promise<string> {
    // 从localStorage获取用户配置的API地址和密钥
    let apiBaseUrl = this.baseUrl;
    let apiKey = request.key || '';
    
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
    validateApiBaseUrl(apiBaseUrl, 'DeepSeek');
    
    const requestBody = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: request.prompt
        }
      ],
      max_tokens: request.maxTokens || this.defaultMaxTokens,
      temperature: request.temperature || this.defaultTemperature,
      top_p: request.topP || this.defaultTopP,
      stream: false
    };
    
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    
    try {
      const response = await axios.post(
        `${apiBaseUrl}/chat/completions`,
        requestBody,
        { headers }
      );
      
      // 直接返回生成的文本
      return response.data.choices[0].message.content;
    } catch (error) {
      throw error;
    }
  },

  // 查询任务状态（DeepSeek是同步的，直接返回结果）
  async getTask(request: TextRequestDvo): Promise<TextResponseDto> {
    return {
      status: '2',
      text: request.taskId || ''
    };
  },

  // 验证API密钥格式
  validateApiKey(key: string): boolean {
    return key && key.length > 0;
  },

  // 验证提示词格式
  validatePrompt(prompt: string): boolean {
    return prompt && prompt.trim().length > 0 && prompt.trim().length <= 4000;
  },

  // 获取支持的参数范围
  getSupportedParameters() {
    return {
      maxTokens: { min: 1, max: 8192, default: 2048 },
      temperature: { min: 0, max: 2, default: 0.7 },
      topP: { min: 0, max: 1, default: 0.9 }
    };
  }
};

export type { TextRequestDvo, TextResponseDto };