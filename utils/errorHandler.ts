/**
 * 统一错误处理工具
 * 处理API返回的各种错误类型，特别是令牌相关的错误
 */

// API错误响应接口
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    type?: string;
    request_id?: string;
  };
}

// 错误类型枚举
export enum ErrorType {
  INVALID_TOKEN = 'invalid_token',
  INVALID_REQUEST = 'invalid_request',
  RATE_LIMIT = 'rate_limit',
  SERVER_ERROR = 'server_error',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error'
}

// 错误信息映射
const ERROR_MESSAGES: Record<string, { type: ErrorType; message: string; userFriendly: string }> = {
  'invalid_request': {
    type: ErrorType.INVALID_REQUEST,
    message: '未提供令牌',
    userFriendly: 'API令牌无效或未提供，请检查API密钥配置'
  },
  'invalid_token': {
    type: ErrorType.INVALID_TOKEN,
    message: '令牌无效',
    userFriendly: 'API令牌无效，请检查API密钥是否正确配置'
  },
  'rate_limit': {
    type: ErrorType.RATE_LIMIT,
    message: '请求频率超限',
    userFriendly: '请求频率超限，请稍后重试'
  },
  'server_error': {
    type: ErrorType.SERVER_ERROR,
    message: '服务器内部错误',
    userFriendly: '服务器内部错误，请稍后重试'
  }
};

/**
 * 解析API错误响应
 */
export function parseApiError(error: any): {
  type: ErrorType;
  code: string;
  message: string;
  userFriendly: string;
  requestId?: string;
} {
  // 如果是网络错误
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
    return {
      type: ErrorType.NETWORK_ERROR,
      code: 'network_error',
      message: '网络连接错误',
      userFriendly: '网络连接错误，请检查网络连接后重试'
    };
  }

  // 如果是axios错误
  if (error?.response?.data) {
    const responseData = error.response.data;
    
    // 检查是否是标准的API错误格式（嵌套格式）
    if (responseData.error && typeof responseData.error === 'object') {
      const errorData = responseData.error;
      const errorCode = errorData.code || 'unknown_error';
      
      // 查找对应的错误信息
      const errorInfo = ERROR_MESSAGES[errorCode] || {
        type: ErrorType.UNKNOWN_ERROR,
        message: errorData.message || '未知错误',
        userFriendly: '发生未知错误，请稍后重试'
      };
      
      return {
        type: errorInfo.type,
        code: errorCode,
        message: errorData.message || errorInfo.message,
        userFriendly: errorInfo.userFriendly,
        requestId: errorData.request_id
      };
    }
    
    // 检查是否是扁平格式的错误响应（直接包含code、message、type）
    if (responseData.code && responseData.message) {
      const errorCode = responseData.code;
      const errorMessage = responseData.message;
      
      // 从消息中提取请求ID
      let requestId: string | undefined;
      let cleanMessage = errorMessage;
      const requestIdMatch = errorMessage.match(/\(request id: ([^)]+)\)/);
      if (requestIdMatch) {
        requestId = requestIdMatch[1];
        cleanMessage = errorMessage.replace(requestIdMatch[0], '').trim();
      }
      
      // 查找对应的错误信息
      const errorInfo = ERROR_MESSAGES[errorCode] || {
        type: ErrorType.UNKNOWN_ERROR,
        message: cleanMessage,
        userFriendly: '发生未知错误，请稍后重试'
      };
      
      return {
        type: errorInfo.type,
        code: errorCode,
        message: cleanMessage,
        userFriendly: errorInfo.userFriendly,
        requestId: requestId
      };
    }
  }

  // 如果是字符串错误
  if (typeof error === 'string') {
    return {
      type: ErrorType.UNKNOWN_ERROR,
      code: 'unknown_error',
      message: error,
      userFriendly: '发生未知错误，请稍后重试'
    };
  }

  // 默认未知错误
  return {
    type: ErrorType.UNKNOWN_ERROR,
    code: 'unknown_error',
    message: error?.message || '未知错误',
    userFriendly: '发生未知错误，请稍后重试'
  };
}

/**
 * 检查是否是令牌相关的错误
 */
export function isTokenError(error: any): boolean {
  const parsedError = parseApiError(error);
  return parsedError.type === ErrorType.INVALID_TOKEN || 
         parsedError.type === ErrorType.INVALID_REQUEST;
}

/**
 * 获取用户友好的错误消息
 */
export function getUserFriendlyErrorMessage(error: any): string {
  return parseApiError(error).userFriendly;
}

/**
 * 处理API调用错误
 */
export function handleApiError(error: any): never {
  const parsedError = parseApiError(error);
  
  // 如果是令牌错误，提供更明确的错误信息
  if (isTokenError(error)) {
    throw new Error(`令牌错误: ${parsedError.userFriendly} (请求ID: ${parsedError.requestId || '未知'})`);
  }
  
  // 其他错误类型
  throw new Error(`${parsedError.userFriendly}${parsedError.requestId ? ` (请求ID: ${parsedError.requestId})` : ''}`);
}

/**
 * 创建错误处理包装器
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleApiError(error);
    }
  };
}