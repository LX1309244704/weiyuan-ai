// API域名地址验证工具函数

/**
 * 验证API域名地址是否存在
 * @param baseUrl API域名地址
 * @param modelName 模型名称（可选），用于生成更具体的错误信息
 * @returns 如果域名地址有效，返回true；否则抛出错误
 */
export function validateApiBaseUrl(baseUrl: string, modelName?: string): boolean {
  if (!baseUrl) {
    const errorMessage = modelName 
      ? `请先填写${modelName} API域名地址` 
      : '请先填写API域名地址';
    throw new Error(errorMessage);
  }
  return true;
}

/**
 * 从localStorage获取API配置信息
 * @param key localStorage中的键名
 * @returns 存储的配置值
 */
export function getApiConfigFromStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('从localStorage获取配置失败:', error);
    return null;
  }
}

/**
 * 将API配置信息保存到localStorage
 * @param key localStorage中的键名
 * @param value 要保存的配置值
 */
export function saveApiConfigToStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error('保存配置到localStorage失败:', error);
    throw new Error('保存配置失败');
  }
}