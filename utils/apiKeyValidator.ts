/**
 * API密钥验证工具
 * 用于检查API密钥是否已配置，并提供用户友好的提示
 */

import { ApiKeyCache } from './apiKeyCache'

export class ApiKeyValidator {
  /**
   * 检查API密钥是否已配置
   * @returns 如果已配置返回true，否则返回false
   */
  static isApiKeyConfigured(): boolean {
    return ApiKeyCache.isApiKeyConfigured()
  }

  /**
   * 获取API密钥配置状态
   * @returns 配置状态对象
   */
  static getApiKeyStatus() {
    const isConfigured = this.isApiKeyConfigured()
    const apiKey = ApiKeyCache.getApiKey()
    
    return {
      isConfigured,
      hasKey: !!apiKey,
      keyLength: apiKey.length,
      keyPreview: apiKey ? `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}` : '未配置'
    }
  }

  /**
   * 验证API密钥并返回用户友好的错误消息
   * @returns 如果验证通过返回null，否则返回错误消息
   */
  static validateApiKey(): string | null {
    if (!this.isApiKeyConfigured()) {
      return 'API密钥未配置，请先设置API密钥才能使用AI功能。'
    }
    
    const apiKey = ApiKeyCache.getApiKey()
    if (!apiKey.trim()) {
      return 'API密钥为空，请重新设置有效的API密钥。'
    }
    
    return null
  }

  /**
   * 获取API密钥配置提示信息
   * @returns 提示信息对象
   */
  static getApiKeyPrompt() {
    const error = this.validateApiKey()
    
    if (error) {
      return {
        type: 'error' as const,
        title: 'API密钥未配置',
        message: error,
        action: '前往设置',
        showSettings: true
      }
    }
    
    return {
      type: 'success' as const,
      title: 'API密钥已配置',
      message: '可以正常使用AI功能',
      action: '',
      showSettings: false
    }
  }

  /**
   * 在需要API密钥的操作前进行检查
   * @param operationName 操作名称（用于错误消息）
   * @returns 如果检查通过返回true，否则抛出错误
   */
  static checkBeforeOperation(operationName: string = 'AI功能'): boolean {
    const error = this.validateApiKey()
    if (error) {
      throw new Error(`${operationName}需要API密钥：${error}`)
    }
    return true
  }
}