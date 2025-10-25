// 简单的错误处理测试
const { parseApiError, isTokenError, getUserFriendlyErrorMessage, handleApiError } = require('./errorHandler');

console.log('=== 测试扁平格式错误响应 ===\n');

// 测试您提供的错误格式
const flatErrorResponse = {
  response: {
    data: {
      code: "invalid_request",
      message: "未提供令牌 (request id: B2025102502272723525386N33rXgw9)",
      type: "new_api_error"
    }
  }
};

console.log('1. 原始错误响应:');
console.log(JSON.stringify(flatErrorResponse, null, 2));

console.log('\n2. 解析错误信息:');
const parsedError = parseApiError(flatErrorResponse);
console.log('错误类型:', parsedError.type);
console.log('错误代码:', parsedError.code);
console.log('错误消息:', parsedError.message);
console.log('用户友好消息:', parsedError.userFriendly);
console.log('请求ID:', parsedError.requestId);

console.log('\n3. 检查是否是令牌错误:');
console.log('是否是令牌错误:', isTokenError(flatErrorResponse));

console.log('\n4. 获取用户友好错误消息:');
console.log('用户友好消息:', getUserFriendlyErrorMessage(flatErrorResponse));

console.log('\n5. 模拟错误处理:');
try {
  handleApiError(flatErrorResponse);
} catch (error) {
  console.log('捕获到的错误消息:', error.message);
}

console.log('\n=== 测试完成 ===');