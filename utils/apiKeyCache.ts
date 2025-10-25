/**
 * API密钥缓存管理工具
 * 统一管理所有AI模型的API密钥配置
 */

const API_KEY_STORAGE_KEY = 'ai_model_api_key';
const API_BASE_URL_STORAGE_KEY = 'ai_model_api_base_url';
const API_PROVIDER_STORAGE_KEY = 'ai_model_api_provider';

// 支持的模型供应商
export type ApiProvider = 'weiyuan' | 'openrouter';

interface ApiConfig {
  apiKey: string;
  apiBaseUrl: string;
  provider: ApiProvider;
}

// 模型供应商配置映射
const PROVIDER_CONFIGS: Record<ApiProvider, { baseUrl: string; name: string; description: string }> = {
  weiyuan: {
    baseUrl: 'https://api.jmyps.com',
    name: '微元API',
    description: '微元AI平台提供的API服务'
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    name: 'OpenRouter',
    description: 'OpenRouter AI模型聚合平台'
  }
};

export class ApiKeyCache {
  /**
   * 获取缓存的API密钥
   */
  static getApiKey(): string {
    if (typeof window === 'undefined') {
      return '';
    }
    
    try {
      const cached = localStorage.getItem(API_KEY_STORAGE_KEY);
      return cached || '';
    } catch (error) {
      console.error('获取API密钥缓存失败:', error);
      return '';
    }
  }

  /**
   * 获取缓存的API基础地址
   */
  static getApiBaseUrl(): string {
    if (typeof window === 'undefined') {
      return 'https://api.jmyps.com';
    }
    
    try {
      const cached = localStorage.getItem(API_BASE_URL_STORAGE_KEY);
      return cached || 'https://api.jmyps.com';
    } catch (error) {
      console.error('获取API基础地址缓存失败:', error);
      return 'https://api.jmyps.com';
    }
  }

  /**
   * 获取缓存的模型供应商
   */
  static getApiProvider(): ApiProvider {
    if (typeof window === 'undefined') {
      return 'weiyuan';
    }
    
    try {
      const cached = localStorage.getItem(API_PROVIDER_STORAGE_KEY);
      return (cached as ApiProvider) || 'weiyuan';
    } catch (error) {
      console.error('获取模型供应商缓存失败:', error);
      return 'weiyuan';
    }
  }

  /**
   * 根据供应商获取基础地址
   */
  static getBaseUrlByProvider(provider: ApiProvider): string {
    return PROVIDER_CONFIGS[provider]?.baseUrl || 'https://api.jmyps.com';
  }

  /**
   * 获取所有支持的模型供应商
   */
  static getSupportedProviders(): ApiProvider[] {
    return Object.keys(PROVIDER_CONFIGS) as ApiProvider[];
  }

  /**
   * 获取模型供应商配置信息
   */
  static getProviderConfig(provider: ApiProvider) {
    return PROVIDER_CONFIGS[provider];
  }

  /**
   * 保存API配置到缓存
   */
  static saveApiConfig(config: ApiConfig): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    
    try {
      localStorage.setItem(API_KEY_STORAGE_KEY, config.apiKey);
      localStorage.setItem(API_BASE_URL_STORAGE_KEY, config.apiBaseUrl);
      localStorage.setItem(API_PROVIDER_STORAGE_KEY, config.provider);
      return true;
    } catch (error) {
      console.error('保存API配置到缓存失败:', error);
      return false;
    }
  }

  /**
   * 检查API密钥是否已配置
   */
  static isApiKeyConfigured(): boolean {
    const apiKey = this.getApiKey();
    return !!apiKey && apiKey.trim().length > 0;
  }

  /**
   * 清除API配置缓存
   */
  static clearApiConfig(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    
    try {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      localStorage.removeItem(API_BASE_URL_STORAGE_KEY);
      localStorage.removeItem(API_PROVIDER_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('清除API配置缓存失败:', error);
      return false;
    }
  }

  /**
   * 获取完整的API配置
   */
  static getApiConfig(): ApiConfig {
    return {
      apiKey: this.getApiKey(),
      apiBaseUrl: this.getApiBaseUrl(),
      provider: this.getApiProvider()
    };
  }

  /**
   * 验证API密钥格式（通用验证）
   */
  static validateApiKey(key: string): boolean {
    return key && key.trim().length > 0;
  }
}