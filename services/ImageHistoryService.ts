import { ModelService, ImageRequestDvo, ImageResponseDto, ImageModel } from '@/services/ai-models';
import { HistoryItem } from '@/app/ad-creation/HistoryPanel';
import { nanoBananaConfig } from '@/services/ai-models/weiyuan/nano-banana';

/**
 * 图片生成历史服务
 * 负责生成图片并将其添加到历史记录中
 */
export class ImageHistoryService {
  /**
   * 生成图片并添加到历史记录
   * @param prompt 图片生成提示词
   * @param aspectRatio 图片宽高比，可选
   * @param size 图片尺寸，可选
   * @param updateHistory 更新历史记录的回调函数
   * @returns 生成的历史记录项或null
   */
  static async generateAndAddToHistory(
    prompt: string,
    aspectRatio?: string,
    size?: string,
    updateHistory?: (item: HistoryItem, replaceId?: string) => void
  ): Promise<HistoryItem | null> {
    try {
      console.log('开始生成图片，提示词:', prompt);
      
      // 创建图片生成请求
      const request: ImageRequestDvo = {
        model: 'nano-banana',
        prompt: prompt,
        size: size || nanoBananaConfig.defaultSize,
        aspectRatio: aspectRatio || '1:1'
      };

      console.log('发送到API的请求参数:', request);

      // 创建生成任务
      const taskId = await ModelService.createTask(request);
      console.log('创建图片生成任务，任务ID:', taskId);
      
      // 更新请求对象，添加任务ID
      request.taskId = taskId;
      
      // 创建临时历史记录项，表示正在生成中
      const tempHistoryItem: HistoryItem = {
        id: `generating-${Date.now()}`,
        title: `生成中: ${prompt.substring(0, 20)}${prompt.length > 20 ? '...' : ''}`,
        timestamp: Date.now(),
        preview: '/api/placeholder/200/150?text=生成中...',
        canvasData: undefined
      };

      // 如果提供了更新函数，立即添加临时项
      if (updateHistory) {
        updateHistory(tempHistoryItem);
      }

      // 轮询任务状态直到完成
      const result = await ModelService.getTaskStatus(request);
      console.log('任务状态查询结果:', result);
      
      if (result.status === '2') { // 成功状态
        const imageUrl = (result as ImageResponseDto).imageUrl;
        console.log('图片生成成功，URL:', imageUrl);
        
        // 创建最终的历史记录项
        const historyItem: HistoryItem = {
          id: `history-${Date.now()}`,
          title: prompt,
          timestamp: Date.now(),
          preview: imageUrl,
          canvasData: JSON.stringify({
            version: '5.3.0',
            objects: [
              {
                type: 'image',
                src: imageUrl,
                left: 50,
                top: 50,
                crossOrigin: 'anonymous'
              }
            ]
          })
        };

        // 更新历史记录
        if (updateHistory) {
          // 先移除临时项，然后添加新项
          updateHistory(historyItem, tempHistoryItem.id);
        }

        return historyItem;
      } else { // 失败状态
        console.error('图片生成失败:', result.status, result.error);
        
        // 如果提供了更新函数，移除临时项
        if (updateHistory) {
          // 可以通过返回一个特殊标记或undefined来表示移除
          updateHistory({} as HistoryItem, tempHistoryItem.id);
        }
        
        return null;
      }
    } catch (error) {
      console.error('生成图片时出错:', error);
      return null;
    }
  }

  /**
   * 批量生成图片并添加到历史记录
   * @param prompts 图片生成提示词数组
   * @param aspectRatio 图片宽高比，可选
   * @param size 图片尺寸，可选
   * @param updateHistory 更新历史记录的回调函数
   * @returns 生成的历史记录项数组
   */
  static async batchGenerateAndAddToHistory(
    prompts: string[],
    aspectRatio?: string,
    size?: string,
    updateHistory?: (item: HistoryItem, replaceId?: string) => void
  ): Promise<HistoryItem[]> {
    const results: HistoryItem[] = [];
    
    for (const prompt of prompts) {
      const result = await this.generateAndAddToHistory(prompt, aspectRatio, size, updateHistory);
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  }
}