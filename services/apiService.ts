import axios from 'axios';

// API相关配置
const API_BASE_URL = 'https://api.jmyps.com';

// Token配额响应接口
export interface TokenQuotaResponse {
  id: number;
  name: string;
  quota: number;
  unlimited_quota: boolean;
  used_quota: number;
}

/**
 * API服务类，处理与后端API的交互
 */
export class ApiService {
  /**
   * 获取用户的Token配额
   * @param apiKey 用户的API密钥
   * @returns Promise<TokenQuotaResponse>
   */
  static async getTokenQuota(apiKey: string): Promise<TokenQuotaResponse> {
    try {
      const response = await axios.get<TokenQuotaResponse>(
        `${API_BASE_URL}/v1/token/quota`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('获取Token配额失败:', error);
      throw new Error('获取点数信息失败');
    }
  }
  
  /**
   * 初始化用户点数
   * 从localStorage获取API密钥并更新用户点数
   */
  static async initializeUserPoints(): Promise<void> {
    try {
      console.log('开始初始化用户点数...');
      
      // 动态导入userStore以避免循环依赖
      const { useUserStore } = await import('../stores/userStore');
      const userStore = useUserStore.getState();
      
      // 从localStorage获取API密钥
      let apiKey = '';
      try {
        const savedConfig = localStorage.getItem('apiConfig');
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          apiKey = config.apiKey || '';
        }
      } catch (error) {
        console.error('读取API密钥失败:', error);
      }
      
      // 只使用localStorage中的配置，不再使用环境变量
      apiKey = apiKey || '';
      
      let pointsToSet = 6.7; // 默认点数，使用示例数据中的quota值
      
      if (apiKey) {
        try {
          console.log('正在获取用户配额...');
          // 获取用户配额
          const quotaData = await this.getTokenQuota(apiKey);
          console.log('获取到配额数据:', quotaData);
          pointsToSet = quotaData.quota;
        } catch (apiError) {
          console.error('获取API配额失败，使用默认点数:', apiError);
        }
      } else {
        console.warn('未配置API密钥，使用默认点数');
      }
      
      console.log('准备更新点数:', pointsToSet);
      
      // 检查用户信息是否存在
      const currentUser = userStore.userInfo;
      
      if (currentUser) {
        // 如果用户信息存在，直接更新点数
        console.log('用户信息存在，更新点数');
        userStore.updatePoints(pointsToSet);
      } else {
        // 如果用户信息不存在，创建默认用户信息
        console.log('用户信息不存在，创建默认用户信息');
        const defaultUserInfo = {
          id: 'test-user-001',
          email: 'test@example.com',
          username: '测试用户',
          avatar: '/default-avatar.png',
          points: pointsToSet,
          createdAt: new Date().toISOString()
        };
        userStore.setUserInfo(defaultUserInfo);
      }
      
    } catch (error) {
      console.error('初始化用户点数失败:', error);
      // 最后兜底，确保设置默认点数
      try {
        const { useUserStore } = await import('../stores/userStore');
        const userStore = useUserStore.getState();
        console.log('最终兜底设置默认点数: 6.7');
        
        const currentUser = userStore.userInfo;
        if (currentUser) {
          userStore.updatePoints(6.7);
        } else {
          userStore.setUserInfo({
            id: 'test-user-001',
            email: 'test@example.com',
            username: '测试用户',
            avatar: '/default-avatar.png',
            points: 6.7,
            createdAt: new Date().toISOString()
          });
        }
      } catch (storeError) {
        console.error('最终兜底设置点数失败:', storeError);
      }
    }
  }
}