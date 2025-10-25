/**
 * 错误处理工具测试
 * 验证令牌错误处理功能
 */

import { parseApiError, isTokenError, getUserFriendlyErrorMessage, ErrorType } from './errorHandler';

describe('错误处理工具', () => {
  describe('parseApiError', () => {
    test('应该正确解析令牌错误响应', () => {
      const errorResponse = {
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

      const result = parseApiError(errorResponse);

      expect(result.type).toBe(ErrorType.INVALID_REQUEST);
      expect(result.code).toBe('invalid_request');
      expect(result.message).toBe('未提供令牌 (request id: B20251025015005645625781ovIwpFxf)');
      expect(result.userFriendly).toBe('API令牌无效或未提供，请检查API密钥配置');
      expect(result.requestId).toBe('B20251025015005645625781ovIwpFxf');
    });

    test('应该正确解析无效令牌错误', () => {
      const errorResponse = {
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

      const result = parseApiError(errorResponse);

      expect(result.type).toBe(ErrorType.INVALID_TOKEN);
      expect(result.code).toBe('invalid_token');
      expect(result.userFriendly).toBe('API令牌无效，请检查API密钥是否正确配置');
    });

    test('应该处理网络错误', () => {
      const networkError = {
        code: 'NETWORK_ERROR',
        message: 'Network Error'
      };

      const result = parseApiError(networkError);

      expect(result.type).toBe(ErrorType.NETWORK_ERROR);
      expect(result.userFriendly).toBe('网络连接错误，请检查网络连接后重试');
    });

    test('应该处理未知错误', () => {
      const unknownError = {
        message: 'Some unknown error'
      };

      const result = parseApiError(unknownError);

      expect(result.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(result.userFriendly).toBe('发生未知错误，请稍后重试');
    });
  });

  describe('isTokenError', () => {
    test('应该识别令牌错误', () => {
      const tokenError = {
        response: {
          data: {
            error: {
              code: 'invalid_request',
              message: '未提供令牌'
            }
          }
        }
      };

      expect(isTokenError(tokenError)).toBe(true);
    });

    test('应该识别无效令牌错误', () => {
      const invalidTokenError = {
        response: {
          data: {
            error: {
              code: 'invalid_token',
              message: '令牌无效'
            }
          }
        }
      };

      expect(isTokenError(invalidTokenError)).toBe(true);
    });

    test('应该排除非令牌错误', () => {
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

      expect(isTokenError(rateLimitError)).toBe(false);
    });
  });

  describe('getUserFriendlyErrorMessage', () => {
    test('应该返回用户友好的错误消息', () => {
      const error = {
        response: {
          data: {
            error: {
              code: 'invalid_request',
              message: '未提供令牌',
              request_id: 'test-id'
            }
          }
        }
      };

      const message = getUserFriendlyErrorMessage(error);
      expect(message).toBe('API令牌无效或未提供，请检查API密钥配置');
    });
  });
});

// 模拟测试环境
global.expect = (actual: any) => ({
  toBe: (expected: any) => {
    if (actual !== expected) {
      throw new Error(`Expected ${expected} but got ${actual}`);
    }
  }
});

global.describe = (name: string, fn: () => void) => {
  console.log(`\n${name}`);
  fn();
};

global.test = (name: string, fn: () => void) => {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.log(`  ✗ ${name} - ${error.message}`);
  }
};

// 运行测试
console.log('=== 错误处理工具测试 ===');

describe('错误处理工具', () => {
  describe('parseApiError', () => {
    test('应该正确解析令牌错误响应', () => {
      const errorResponse = {
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

      const result = parseApiError(errorResponse);
      expect(result.type).toBe(ErrorType.INVALID_REQUEST);
      expect(result.code).toBe('invalid_request');
      expect(result.message).toBe('未提供令牌 (request id: B20251025015005645625781ovIwpFxf)');
      expect(result.userFriendly).toBe('API令牌无效或未提供，请检查API密钥配置');
      expect(result.requestId).toBe('B20251025015005645625781ovIwpFxf');
    });
  });
});

console.log('\n=== 测试完成 ===');