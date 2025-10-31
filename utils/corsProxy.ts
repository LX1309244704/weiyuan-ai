/**
 * CORS代理工具函数
 * 用于解决跨域图片加载问题
 */

/**
 * 获取可用的CORS代理服务列表
 * @param url 原始URL
 * @returns 代理URL数组
 */
const getCorsProxyUrls = (url: string): string[] => {
  // 如果URL已经是本地或同源，直接返回
  if (url.startsWith('http://localhost') || 
      url.startsWith('data:') ||
      url.startsWith('blob:')) {
    return [url];
  }

  // 多个备选CORS代理服务（使用更可靠的服务）
  const proxyServices = [
    // 使用本地代理服务作为首选
    `/api/cors-proxy?url=${encodeURIComponent(url)}`,
    // 可靠的公共CORS代理服务
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    `https://cors-anywhere.herokuapp.com/${url}`,
    // 更多备选代理服务
    `https://cors.bridged.cc/${url}`,
    `https://proxy.cors.sh/${url}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  ];
  
  return proxyServices;
};

/**
 * 使用CORS代理加载图片
 * @param url 原始图片URL
 * @returns 代理后的图片URL或原始URL
 */
export const getCorsProxyUrl = (url: string): string => {
  const proxyUrls = getCorsProxyUrls(url);
  return proxyUrls[0]; // 默认使用第一个代理服务
};

/**
 * 检查图片URL是否需要CORS代理
 * @param url 图片URL
 * @returns 是否需要代理
 */
export const needsCorsProxy = (url: string): boolean => {
  return !url.startsWith('http://localhost') && 
         !url.startsWith('data:') &&
         !url.startsWith('blob:') &&
         (url.startsWith('http://') || url.startsWith('https://'));
};

/**
 * 安全加载图片，自动处理CORS问题
 * @param url 图片URL
 * @returns Promise<HTMLImageElement>
 */
export const loadImageWithCors = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    // 获取所有可用的代理URL
    const proxyUrls = getCorsProxyUrls(url);
    
    // 尝试加载图片的函数
    const tryLoadImage = (urlIndex: number) => {
      if (urlIndex >= proxyUrls.length) {
        // 所有代理都失败，尝试直接加载原始URL
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = 'anonymous';
        fallbackImg.onload = () => resolve(fallbackImg);
        fallbackImg.onerror = () => reject(new Error(`所有CORS代理服务都失败，无法加载图片: ${url}`));
        fallbackImg.src = url;
        return;
      }
      
      let currentUrl = proxyUrls[urlIndex];
      
      // 如果是本地代理服务，确保URL格式正确
      if (currentUrl.startsWith('/api/cors-proxy')) {
        // 本地代理服务已经是相对路径，不需要修改
      } else if (currentUrl.startsWith('http')) {
        // 公共代理服务，保持原样
      }
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        resolve(img);
      };
      
      img.onerror = (error) => {
        console.warn(`CORS代理服务 ${currentUrl} 加载失败，尝试下一个服务`);
        // 尝试下一个代理服务
        tryLoadImage(urlIndex + 1);
      };
      
      img.src = currentUrl;
    };
    
    // 开始尝试加载
    tryLoadImage(0);
  });
};

/**
 * 增强的CORS代理URL获取函数，提供更好的错误处理
 * @param url 原始URL
 * @returns 代理URL
 */
export const getEnhancedCorsProxyUrl = (url: string): string => {
  const proxyUrls = getCorsProxyUrls(url);
  
  // 优先使用本地代理服务
  for (const proxyUrl of proxyUrls) {
    if (proxyUrl.startsWith('/api/cors-proxy')) {
      return proxyUrl;
    }
  }
  
  // 如果没有本地代理，使用第一个可用的代理
  return proxyUrls[0];
};