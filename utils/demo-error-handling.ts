/**
 * 错误处理演示脚本
 * 展示令牌错误处理功能
 */

import { parseApiError, isTokenError, getUserFriendlyErrorMessage, ErrorType } from './errorHandler';

console.log('=== 令牌错误处理演示 ===\n');

// 模拟API返回的令牌错误响应
const tokenErrorResponse = {
  response: {
    data: {
      error: {
        code: 'invalid_request',
        message: '未提供令牌 (request id: B20251025015005645625781ovIwpFxf)',
        type: 'new_api_error',
        request_id: 'B20251025015005645625781ovIwpFxf'
      }
    }
  }
};

console.log('1. 原始API错误响应:');
console.log(JSON.stringify(tokenErrorResponse, null, 2));

console.log('\n2. 解析后的错误信息:');
const parsedError = parseApiError(tokenErrorResponse);
console.log('错误类型:', parsedError.type);
console.log('错误代码:', parsedError.code);
console.log('错误消息:', parsedError.message);
console.log('用户友好消息:', parsedError.userFriendly);
console.log('请求ID:', parsedError.requestId);

console.log('\n3. 检查是否是令牌错误:');
console.log('是否是令牌错误:', isTokenError(tokenErrorResponse));

console.log('\n4. 获取用户友好错误消息:');
console.log('用户友好消息:', getUserFriendlyErrorMessage(tokenErrorResponse));

console.log('\n5. 处理错误（模拟抛出）:');
try {
  // 模拟错误处理
  if (isTokenError(tokenErrorResponse)) {
    const errorInfo = parseApiError(tokenErrorResponse);
    throw new Error(`令牌错误: ${errorInfo.userFriendly} (请求ID: ${errorInfo.requestId})`);
  }
} catch (error) {
  console.log('捕获到的错误:', error.message);
}

console.log('\n=== 其他错误类型演示 ===\n');

// 测试无效令牌错误
const invalidTokenError = {
  response: {
    data: {
      error: {
        code: 'invalid_token',
        message: '令牌无效',
        request_id: 'test-request-id'
      }
    }
  }
};

console.log('无效令牌错误处理:');
console.log('用户友好消息:', getUserFriendlyErrorMessage(invalidTokenError));

// 测试频率限制错误
const rateLimitError = {
  response: {
    data: {
      error: {
        code: 'rate_limit',
        message: '请求频率超限'
      }
    }
  }
};

console.log('\n频率限制错误处理:');
console.log('用户友好消息:', getUserFriendlyErrorMessage(rateLimitError));

console.log('\n=== 演示完成 ===');