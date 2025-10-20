import axios from 'axios';

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
  baseUrl: process.env.NEXT_PUBLIC_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
  defaultMaxTokens: 2048,
  defaultTemperature: 0.7,
  defaultTopP: 0.9,
  
  // 创建文本生成任务
  async createTextGeneration(request: TextRequestDvo): Promise<string> {
    const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || request.key;
    
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
        `${this.baseUrl}/chat/completions`,
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