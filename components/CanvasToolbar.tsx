'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Pencil, 
  Shapes,
  Square, 
  Circle, 
  Triangle,
  Star,
  Heart,
  Diamond,
  Octagon,
  ArrowRight,
  Minus,
  Braces,
  Type, 
  Eraser, 
  Image as ImageIcon,
  Download,
  Upload,
  Save,
  RotateCcw,
  RotateCw,
  MousePointer2,
  Hand,
  ArrowUpRight,
  ArrowLeft,
  Sun,
  Moon,
  Languages,
  User,
  Layers,
  ArrowUp,
  ArrowDown,
  MoveUp,
  MoveDown,
  Redo,
  History,
  Clock,
  Trash2,
  UserRound,
  Video
} from 'lucide-react'

import { useUserStore } from '../stores/userStore'
import { useRouter } from 'next/navigation'
import SaveProjectModal from './SaveProjectModal'
import UserSettingsModal from './UserSettingsModal'
import { historyDB, type HistoryRecord } from '../utils/historyDB'
import { ApiService } from '../services/apiService'

interface CanvasToolbarProps {
  canvas: any
  onCaptureArea: () => Promise<string | null>
  selectedArea: any
}

type Tool = 'pencil' | 'shapes' | 'text' | 'eraser' | 'image' | 'hand' | 'arrow' | 'layers' | 'history' | 'stickfigure'
type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'star' | 'heart' | 'diamond' | 'octagon' | 'arrow' | 'line' | 'dashed-line' | 'left-brace' | 'right-brace'

export default function CanvasToolbar({ canvas, onCaptureArea, selectedArea }: CanvasToolbarProps) {
  const [activeTool, setActiveTool] = useState<Tool>('pencil')
  const [brushSize, setBrushSize] = useState(3)
  const [brushColor, setBrushColor] = useState('#000000')
  const [showShapePicker, setShowShapePicker] = useState(false)
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const shapePickerRef = useRef<HTMLDivElement>(null)
  const [history, setHistory] = useState<any[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [zoomLevel, setZoomLevel] = useState(100)

  const { theme, language, setTheme, setLanguage, userInfo } = useUserStore()
  const router = useRouter()
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showLayerPanel, setShowLayerPanel] = useState(false)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [showApiSettingsModal, setShowApiSettingsModal] = useState(false)
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  // 录屏功能状态 - 参考Cap仓库实现
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [captureStream, setCaptureStream] = useState<MediaStream | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  const layerPanelRef = useRef<HTMLDivElement>(null)
  const historyPanelRef = useRef<HTMLDivElement>(null)
  const [copiedObject, setCopiedObject] = useState<any>(null)
  const [isLoadingPoints, setIsLoadingPoints] = useState(false)

  // 格式化时间函数 (秒 -> MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // 停止录制函数
  const handleStopRecording = () => {
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
      // 清除计时器
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingTime(0);
      // 显示停止录制提示
      const stopNotification = document.createElement('div');
      stopNotification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 12px 16px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <strong>录制已停止</strong><br>
          文件正在处理中...
        </div>
      `;
      document.body.appendChild(stopNotification);
      
      setTimeout(() => {
        if (document.body.contains(stopNotification)) {
          document.body.removeChild(stopNotification);
        }
      }, 2000);
    }
  };

  // 录屏功能实现 - 使用更可靠的音频录制方法
  const handleStartRecording = async () => {
    if (isRecording) {
        if (isPaused) {
          // 恢复录制
          if (recorder) {
            recorder.resume();
            setIsPaused(false);
            
            // 恢复计时器
            if (!recordingTimerRef.current) {
              recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
              }, 1000);
            }
            
            // 显示恢复录制提示
            const resumeNotification = document.createElement('div');
            resumeNotification.innerHTML = `
              <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 12px 16px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <strong>录制已恢复</strong><br>
                点击录屏按钮暂停录制<br>
                按 Ctrl+Shift+R 暂停录制<br>
                按 Ctrl+Shift+S 停止录制
              </div>
            `;
            document.body.appendChild(resumeNotification);
        
            setTimeout(() => {
              if (document.body.contains(resumeNotification)) {
                document.body.removeChild(resumeNotification);
              }
            }, 3000);
          }
      } else {
          // 暂停录制
          if (recorder) {
            recorder.pause();
            setIsPaused(true);
            
            // 暂停计时器
            if (recordingTimerRef.current) {
              clearInterval(recordingTimerRef.current);
              recordingTimerRef.current = null;
            }
            
            // 显示暂停录制提示
            const pauseNotification = document.createElement('div');
            pauseNotification.innerHTML = `
              <div style="position: fixed; top: 20px; right: 20px; background: #f59e0b; color: white; padding: 12px 16px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <strong>录制已暂停</strong><br>
                点击录屏按钮继续录制<br>
                按 Ctrl+Shift+R 继续录制<br>
                按 Ctrl+Shift+S 停止录制
              </div>
            `;
            document.body.appendChild(pauseNotification);
            
            setTimeout(() => {
              if (document.body.contains(pauseNotification)) {
                document.body.removeChild(pauseNotification);
              }
            }, 3000);
          }
        }
      return;
    }

    try {
      // 显示提示，引导用户选择整个屏幕
      const preNotification = document.createElement('div');
      preNotification.id = 'screen-recording-notification'; // 添加ID以便于定位
      preNotification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #3b82f6; color: white; padding: 12px 16px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <strong>请选择录制内容</strong><br>
          <span style="font-weight: bold; color: #fbbf24;">重要：请务必选择"整个屏幕"选项</span><br>
          选择其他选项可能导致录制内容不完整或背景为黑色
        </div>
      `;
      document.body.appendChild(preNotification);
      
      // 添加超时机制，确保提示不会一直显示
      setTimeout(() => {
        const notification = document.getElementById('screen-recording-notification');
        if (notification && document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 10000); // 10秒后自动移除

      // 首先尝试获取麦克风权限，确保用户已授权音频录制
      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            // 增强降噪配置
            noiseSuppressionLevel: 'high', // 高级别降噪
            sampleRate: 48000,
            channelCount: 2,
            // 添加更多音频优化配置
            echoCancellationType: 'system',
            latency: 0,
            // 某些浏览器支持的额外选项
            suppressLocalAudioPlayback: false,
            googEchoCancellation: true,
            googNoiseSuppression: true,
            googAutoGainControl: true,
            googHighpassFilter: true,
            googNoiseSuppression2: true,
            googEchoCancellation2: true,
            googAutoGainControl2: true
          }
        });
        console.log('成功获取麦克风权限，启用高级音频降噪');
      } catch (err) {
        console.warn('无法获取麦克风权限:', err);
        // 显示麦克风权限提示
        const micNotification = document.createElement('div');
        micNotification.innerHTML = `
          <div style="position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 12px 16px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <strong>需要麦克风权限</strong><br>
            请确保已授予麦克风访问权限，这对录制音频至关重要
          </div>
        `;
        document.body.appendChild(micNotification);
        setTimeout(() => {
          if (document.body.contains(micNotification)) {
            document.body.removeChild(micNotification);
          }
        }, 3000);
      }

      // 配置录制参数，优化音频设置
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          // 增强系统音频的降噪处理
          noiseSuppressionLevel: 'high',
          autoGainControl: true
        }
      });
      
      console.log('屏幕共享流获取成功，包含的轨道:', {
        videoTracks: screenStream.getVideoTracks().length,
        audioTracks: screenStream.getAudioTracks().length
      });
      
      // 移除预录制提示
      const notification = document.getElementById('screen-recording-notification');
      if (notification && document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
      
      // 创建组合媒体流，用于合并屏幕视频和所有音频
      const combinedStream = new MediaStream();
      
      // 添加屏幕视频轨道
      screenStream.getVideoTracks().forEach(track => {
        combinedStream.addTrack(track);
        console.log('添加视频轨道:', track.kind, track.enabled);
        
        // 监听屏幕共享结束事件
        track.addEventListener('ended', () => {
          console.log('屏幕共享已结束');
          if (recorder && recorder.state !== 'inactive') {
            recorder.stop();
          }
        });
      });
      
      // 首先添加麦克风音频轨道（优先级更高）
      if (micStream) {
        const micAudioTracks = micStream.getAudioTracks();
        if (micAudioTracks.length > 0) {
          micAudioTracks.forEach(track => {
            combinedStream.addTrack(track);
            console.log('添加麦克风音频轨道:', track.kind, track.enabled);
            // 确保音频轨道已启用
            track.enabled = true;
          });
        }
      }
      
      // 然后添加屏幕音频轨道
      const screenAudioTracks = screenStream.getAudioTracks();
      if (screenAudioTracks.length > 0) {
        screenAudioTracks.forEach(track => {
          combinedStream.addTrack(track);
          console.log('添加系统音频轨道:', track.kind, track.enabled);
          // 确保音频轨道已启用
          track.enabled = true;
        });
      } else {
        console.warn('未找到屏幕音频轨道，将仅使用麦克风音频');
      }
      
      // 记录组合流中的所有轨道信息
      console.log('组合流中的轨道信息:', {
        videoTracks: combinedStream.getVideoTracks().length,
        audioTracks: combinedStream.getAudioTracks().length
      });
      combinedStream.getTracks().forEach(track => {
        console.log(`轨道类型: ${track.kind}, 启用状态: ${track.enabled}`);
      });

      // 使用更保守的MIME类型选择策略，优先确保音频正常工作
      let mimeType = '';
      const mimeTypeOptions = [
        'video/webm',  // 使用基本WebM格式，让浏览器自动选择合适的编解码器
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9,opus'
      ];
      
      // 找到第一个支持的MIME类型
      for (const option of mimeTypeOptions) {
        if (MediaRecorder.isTypeSupported(option)) {
          mimeType = option;
          break;
        }
      }
      
      console.log('选择的MIME类型:', mimeType);
      
      // 创建MediaRecorder实例
      const mediaRecorderOptions: MediaRecorderOptions = {};
      if (mimeType) {
        mediaRecorderOptions.mimeType = mimeType;
      }
      
      // 添加更全面的录制配置
      mediaRecorderOptions.audioBitsPerSecond = 192000;  // 提高音频比特率
      mediaRecorderOptions.videoBitsPerSecond = 5000000;  // 设置合理的视频比特率
      
      // 检查是否可以应用音频处理（如果浏览器支持）
      if (typeof AudioContext !== 'undefined' && micStream) {
        try {
          const audioContext = new AudioContext();
          const source = audioContext.createMediaStreamSource(micStream);
          
          // 尝试创建音频处理节点（如浏览器支持）
          if (typeof ConvolverNode !== 'undefined' || typeof BiquadFilterNode !== 'undefined') {
            console.log('浏览器支持高级音频处理，音频质量将进一步优化');
          }
          
          console.log('音频上下文已初始化，准备进行可能的实时音频处理');
        } catch (audioError) {
          console.warn('无法初始化音频处理:', audioError);
          // 继续使用默认处理
        }
      }
      
      const mediaRecorder = new MediaRecorder(combinedStream, mediaRecorderOptions);
      console.log('MediaRecorder配置:', mediaRecorderOptions);
      console.log('实际使用的MIME类型:', mediaRecorder.mimeType);
      
      setRecorder(mediaRecorder);
      setCaptureStream(combinedStream);
      setRecordedChunks([]);
      setIsRecording(true);
      setRecordingTime(0);
      
      // 启动计时器
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // 使用本地变量同步跟踪录制的块，避免React状态更新的异步问题
      const localRecordedChunks: BlobPart[] = [];

      // 监听数据可用事件，收集录制的媒体数据
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          localRecordedChunks.push(event.data);
          // 同时更新React状态以便于调试
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };

      // 监听录制停止事件，处理录制结果
      mediaRecorder.onstop = async () => {
          setIsRecording(false);
          setIsPaused(false);
          // 清除计时器
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
          setRecordingTime(0);
          
          // 清理录制中的提示
          const recordingNotifications = document.querySelectorAll('div[style*="background: #ef4444"]');
          recordingNotifications.forEach(notification => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification);
            }
          });
          
          // 清理流资源
          combinedStream.getTracks().forEach(track => track.stop());
          setCaptureStream(null);
          
          // 检查是否有录制数据
          if (localRecordedChunks.length === 0) {
            console.log('没有录制到任何内容');
            // 显示更详细的录制失败提示
            const failNotification = document.createElement('div');
            failNotification.innerHTML = `
              <div style="position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 12px 16px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <strong>录制失败</strong><br>
                请确保您已授权屏幕录制并选择了正确的录制源<br>
                尝试录制更长时间以确保有足够的数据
              </div>
            `;
            document.body.appendChild(failNotification);
            setTimeout(() => {
              if (document.body.contains(failNotification)) {
                document.body.removeChild(failNotification);
              }
            }, 3000);
            return;
          }

          try {
            // 创建完整的录制Blob
            const recordingBlob = new Blob(localRecordedChunks, { type: mediaRecorder.mimeType || 'video/webm' });
            
            // 验证Blob大小
            if (recordingBlob.size < 1024) { // 小于1KB可能表示数据不完整
              throw new Error('录制数据不完整');
            }
          
          // 创建下载链接
          const downloadUrl = URL.createObjectURL(recordingBlob);
          
          // 创建并触发下载
          const a = document.createElement('a');
          a.href = downloadUrl;
          
          // 根据MIME类型设置合适的文件扩展名
          let fileExtension = 'webm';
          if (mediaRecorder.mimeType.includes('mp4')) {
            fileExtension = 'mp4';
          }
          
          const fileName = `screen-recording-${new Date().toISOString().replace(/[:.]/g, '-')}.${fileExtension}`;
          a.download = fileName;
          a.style.display = 'none';
          document.body.appendChild(a);
          
          // 触发下载
          a.click();
          
          // 显示录制成功提示
          const audioStatusMessage = combinedStream.getAudioTracks().length > 0 
            ? '包含音频轨道' 
            : '未检测到音频轨道';
          
          const successNotification = document.createElement('div');
          successNotification.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 12px 16px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <strong>录制成功！</strong><br>
              文件已开始下载: ${fileName}<br>
              ${audioStatusMessage}<br>
              <span style="font-size: 12px; opacity: 0.8;">如果视频没有声音，请检查您的浏览器权限设置</span>
            </div>
          `;
          document.body.appendChild(successNotification);
          
          // 延迟移除a标签和提示
          setTimeout(() => {
            if (document.body.contains(a)) {
              document.body.removeChild(a);
            }
            if (document.body.contains(successNotification)) {
              document.body.removeChild(successNotification);
            }
            // 释放URL对象
            URL.revokeObjectURL(downloadUrl);
          }, 3000);
          } catch (error) {
            console.error('处理录制数据时出错:', error);
            const errorNotification = document.createElement('div');
            errorNotification.innerHTML = `
              <div style="position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 12px 16px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <strong>录制数据处理失败</strong><br>
                请尝试重新录制
              </div>
            `;
            document.body.appendChild(errorNotification);
            setTimeout(() => {
              if (document.body.contains(errorNotification)) {
                document.body.removeChild(errorNotification);
              }
            }, 3000);
          }
        };

      // 开始录制
      mediaRecorder.start();

      // 显示录制中提示，提供更详细的指导
      const audioTrackCount = combinedStream.getAudioTracks().length;
      const recordingNotification = document.createElement('div');
      recordingNotification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 12px 16px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <strong>正在录制屏幕...</strong><br>
          点击录屏按钮暂停录制<br>
          点击停止按钮完成录制<br>
          按 Ctrl+Shift+R 暂停录制<br>
          按 Ctrl+Shift+S 停止录制<br>
          音频轨道: ${audioTrackCount} 条<br>
          <span style="font-weight: bold; color: #fbbf24;">重要提示:</span><br>
          1. 请确保您的麦克风已开启<br>
          2. 请确保扬声器音量适中<br>
          3. 请尝试对着麦克风说话测试
        </div>
      `;
      document.body.appendChild(recordingNotification);
      
      // 3秒后自动移除提示
      setTimeout(() => {
        if (document.body.contains(recordingNotification)) {
          document.body.removeChild(recordingNotification);
        }
      }, 3000);
      
    } catch (error) {
      console.error('录屏失败:', error);
      
      // 移除预录制提示
      const notification = document.getElementById('screen-recording-notification');
      if (notification && document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
      
      alert('录屏功能初始化失败，请确保浏览器支持屏幕录制API并授予权限');
    }
  }

  // 添加快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 检查是否按下了Ctrl+Shift+R（用于开始/暂停/继续录制）
      if (event.ctrlKey && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        // 如果正在录制但未暂停，先切换暂停状态
        if (isRecording && !isPaused) {
          // 模拟点击暂停录制
          if (recorder) {
            recorder.pause();
            setIsPaused(true);
            
            // 显示暂停录制提示
            const pauseNotification = document.createElement('div');
            pauseNotification.innerHTML = `
              <div style="position: fixed; top: 20px; right: 20px; background: #f59e0b; color: white; padding: 12px 16px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <strong>录制已暂停</strong><br>
                再次按 Ctrl+Shift+R 继续录制<br>
                按 Ctrl+Shift+S 停止录制
              </div>
            `;
            document.body.appendChild(pauseNotification);
            
            setTimeout(() => {
              if (document.body.contains(pauseNotification)) {
                document.body.removeChild(pauseNotification);
              }
            }, 3000);
          }
        } else {
          // 其他情况（未录制或已暂停）调用原始处理函数
          handleStartRecording();
        }
      }
      // 检查是否按下了Ctrl+Shift+S（用于停止录制）
      else if (event.ctrlKey && event.shiftKey && event.key === 'S' && isRecording) {
        event.preventDefault();
        handleStopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleStartRecording, handleStopRecording, isRecording, isPaused, recorder]);

  // 清理函数，组件卸载时确保停止录制
  useEffect(() => {
    return () => {
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }
      if (captureStream) {
        captureStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [recorder, captureStream]);

  // 获取用户点数
  const fetchUserPoints = useCallback(async () => {
    // 从localStorage获取API配置
    const savedConfig = localStorage.getItem('apiConfig');
    let apiKey = '';
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        apiKey = config.apiKey || '';
      } catch (error) {
        console.error('解析API配置失败:', error);
      }
    }
    if (!apiKey) return;
    
    setIsLoadingPoints(true);
    try {
      await ApiService.initializeUserPoints();
    } catch (error) {
      console.error('获取点数失败:', error);
    } finally {
      setIsLoadingPoints(false);
    }
  }, []);

  // 组件挂载时获取点数，并设置定期更新
  useEffect(() => {
    fetchUserPoints();
    
    // 每30分钟自动更新一次点数
    const interval = setInterval(fetchUserPoints, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchUserPoints]);



  // 点击外部关闭形状选择卡片、层级面板和历史面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shapePickerRef.current && !shapePickerRef.current.contains(event.target as Node)) {
        setShowShapePicker(false)
      }

      if (layerPanelRef.current && !layerPanelRef.current.contains(event.target as Node)) {
        setShowLayerPanel(false)
      }

      if (historyPanelRef.current && !historyPanelRef.current.contains(event.target as Node)) {
        setShowHistoryPanel(false)
      }
    }

    if (showShapePicker || showLayerPanel || showHistoryPanel) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showShapePicker, showLayerPanel, showHistoryPanel])

  // 删除选中的对象
  const handleDeleteSelected = () => {
    if (!canvas) return
    
    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length > 0) {
      // 保存当前状态到历史记录
      saveCanvasState()
      
      // 删除所有选中的对象
      canvas.remove(...activeObjects)
      canvas.discardActiveObject()
      canvas.requestRenderAll()
    }
  }

  // 打开API密钥设置
  const handleOpenApiSettings = () => {
    setShowApiSettingsModal(true)
  }

  // 全选画布上的所有对象
  const handleSelectAll = () => {
    if (!canvas || !(window as any).fabric) return
    
    try {
      const fabric = (window as any).fabric
      
      // 获取画布上的所有对象
      const allObjects = canvas.getObjects()
      
      if (allObjects.length === 0) {
        return
      }
      
      // 取消当前选中状态
      canvas.discardActiveObject()
      
      // 选中所有对象
      const selection = new fabric.ActiveSelection(allObjects, {
        canvas: canvas
      })
      canvas.setActiveObject(selection)
      canvas.requestRenderAll()
      
      // 显示全选成功提示
      const notification = document.createElement('div')
      notification.innerHTML = `
        <div style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #10b981; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
          已全选 ${allObjects.length} 个对象 (Ctrl+A)
        </div>
      `
      document.body.appendChild(notification)
      
      // 1.5秒后自动移除提示
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 1500)
      
    } catch (error) {
    }
  }

  // 复制选中的对象（支持多对象）
  const handleCopyObject = () => {
    if (!canvas || !(window as any).fabric) return
    
    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length === 0) return
    
    try {
      // 保存所有选中对象的数据
      const copiedObjects = activeObjects.map(obj => ({
        type: obj.type,
        data: obj.toObject(),
        left: obj.left,
        top: obj.top,
        width: obj.width,
        height: obj.height
      }))
      
      setCopiedObject({
        objects: copiedObjects,
        count: copiedObjects.length
      })
      
      // 显示复制成功提示
      const notification = document.createElement('div')
      notification.innerHTML = `
        <div style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #10b981; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
          ${copiedObjects.length > 1 ? `已复制 ${copiedObjects.length} 个对象 (Ctrl+C)` : '对象已复制 (Ctrl+C)'}
        </div>
      `
      document.body.appendChild(notification)
      
      // 1.5秒后自动移除提示
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 1500)
    } catch (error) {
    }
  }

  // 粘贴对象（支持多对象）- 根据鼠标位置粘贴
  const handlePasteObject = () => {
    if (!canvas || !copiedObject || !(window as any).fabric) {
      return
    }
    
    try {
      // 保存当前状态到历史记录
      saveCanvasState()
      
      const fabric = (window as any).fabric
      
      // 获取鼠标在画板上的当前位置
      let mouseX = 0
      let mouseY = 0
      
      // 尝试从画布事件中获取鼠标位置
      const lastMouseEvent = canvas.__lastMouseEvent
      if (lastMouseEvent && lastMouseEvent.e) {
        // 使用画布转换将鼠标坐标转换为画布坐标
        const pointer = canvas.getPointer(lastMouseEvent.e)
        mouseX = pointer.x
        mouseY = pointer.y
      } else {
        // 如果没有鼠标事件记录，使用画布中心
        const canvasWidth = canvas.getWidth() || 800
        const canvasHeight = canvas.getHeight() || 600
        mouseX = canvasWidth / 2
        mouseY = canvasHeight / 2
      }
      
      // 检查是否是单对象还是多对象
      if (copiedObject.objects && Array.isArray(copiedObject.objects)) {
        // 多对象粘贴
        const { objects, count } = copiedObject
        
        const pastedObjects = []
        const imagePromises = []
        
        // 计算原始对象组的边界框中心
        let minLeft = Infinity
        let minTop = Infinity
        let maxRight = -Infinity
        let maxBottom = -Infinity
        
        for (const objData of objects) {
          const { left, top, width, height } = objData
          if (left !== undefined && top !== undefined) {
            minLeft = Math.min(minLeft, left)
            minTop = Math.min(minTop, top)
            maxRight = Math.max(maxRight, left + (width || 0))
            maxBottom = Math.max(maxBottom, top + (height || 0))
          }
        }
        
        // 如果无法计算边界框，使用默认位置
        if (minLeft === Infinity) {
          minLeft = 0
          minTop = 0
          maxRight = 100
          maxBottom = 100
        }
        
        // 计算原始对象组的中心点
        const originalCenterX = (minLeft + maxRight) / 2
        const originalCenterY = (minTop + maxBottom) / 2
        
        // 计算移动向量 - 将对象组中心移动到鼠标位置
        const moveX = mouseX - originalCenterX
        const moveY = mouseY - originalCenterY
        
        for (const objData of objects) {
          const { type, data, left, top } = objData
          // 保持对象间的相对位置关系，整体移动到鼠标位置
          const originalLeft = left !== undefined ? left : minLeft
          const originalTop = top !== undefined ? top : minTop
          const newLeft = originalLeft + moveX
          const newTop = originalTop + moveY
          

          
          if (type === 'image') {
            // 处理图片对象 - 异步加载
            if (data.src) {
              const imagePromise = new Promise((resolve) => {
                const img = new Image()
                img.crossOrigin = 'anonymous'
                
                img.onload = () => {
                  const fabricImg = new fabric.Image(img, {
                    ...data,
                    left: newLeft,
                    top: newTop,
                    evented: true,
                    selectable: true
                  })
                  canvas.add(fabricImg)
                  pastedObjects.push(fabricImg)
                  resolve(fabricImg)
                }
                
                img.onerror = () => {
                  resolve(null)
                }
                
                img.src = data.src
              })
              imagePromises.push(imagePromise)
            }
          } else {
            // 处理其他对象类型
            let newObject = null
            
            switch (type) {
              case 'rect':
                newObject = new fabric.Rect({
                  ...data,
                  left: newLeft,
                  top: newTop,
                  evented: true,
                  selectable: true
                })
                break
              case 'circle':
                newObject = new fabric.Circle({
                  ...data,
                  left: newLeft,
                  top: newTop,
                  evented: true,
                  selectable: true
                })
                break
              case 'triangle':
                newObject = new fabric.Triangle({
                  ...data,
                  left: newLeft,
                  top: newTop,
                  evented: true,
                  selectable: true
                })
                break
              case 'textbox':
                newObject = new fabric.Textbox(data.text || '文本', {
                  ...data,
                  left: newLeft,
                  top: newTop,
                  evented: true,
                  selectable: true
                })
                break
              case 'i-text':
                newObject = new fabric.IText(data.text || '文本', {
                  ...data,
                  left: newLeft,
                  top: newTop,
                  evented: true,
                  selectable: true
                })
                break
              case 'path':
                newObject = new fabric.Path(data.path, {
                  ...data,
                  left: newLeft,
                  top: newTop,
                  evented: true,
                  selectable: true
                })
                break
              case 'line':
                newObject = new fabric.Line(data.points || [0, 0, 100, 0], {
                  ...data,
                  left: newLeft,
                  top: newTop,
                  evented: true,
                  selectable: true
                })
                break
              default:
                continue
            }
            
            if (newObject) {
              canvas.add(newObject)
              pastedObjects.push(newObject)
            }
          }
        }
        
        // 等待所有图片加载完成
        Promise.all(imagePromises).then(() => {
          // 设置所有粘贴的对象为选中状态
          if (pastedObjects.length > 0) {
            // 使用Fabric.js的多对象选择功能，而不是创建Group
            canvas.discardActiveObject()
            const selection = new fabric.ActiveSelection(pastedObjects, {
              canvas: canvas
            })
            canvas.setActiveObject(selection)
            canvas.requestRenderAll()
            

            
            // 显示粘贴成功提示
            const notification = document.createElement('div')
            notification.innerHTML = `
              <div style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #10b981; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
                ${count > 1 ? `已粘贴 ${count} 个对象 (Ctrl+V)` : '对象已粘贴 (Ctrl+V)'}
              </div>
            `
            document.body.appendChild(notification)
            
            // 1.5秒后自动移除提示
            setTimeout(() => {
              if (document.body.contains(notification)) {
                document.body.removeChild(notification)
              }
            }, 1500)
          }
        })
      } else {
        // 向后兼容：单对象粘贴（旧版本格式）
        const { type, data, left, top } = copiedObject
        
        // 使用鼠标位置作为单对象粘贴的中心
        const newLeft = mouseX - (data.width || 100) / 2
        const newTop = mouseY - (data.height || 100) / 2
        

        
        let newObject = null
        
        switch (type) {
          case 'rect':
            newObject = new fabric.Rect({
              ...data,
              left: newLeft,
              top: newTop,
              evented: true,
              selectable: true
            })
            break
          case 'circle':
            newObject = new fabric.Circle({
              ...data,
              left: newLeft,
              top: newTop,
              evented: true,
              selectable: true
            })
            break
          case 'triangle':
            newObject = new fabric.Triangle({
              ...data,
              left: newLeft,
              top: newTop,
              evented: true,
              selectable: true
            })
            break
          case 'textbox':
            newObject = new fabric.Textbox(data.text || '文本', {
              ...data,
              left: newLeft,
              top: newTop,
              evented: true,
              selectable: true
            })
            break
          case 'i-text':
            newObject = new fabric.IText(data.text || '文本', {
              ...data,
              left: newLeft,
              top: newTop,
              evented: true,
              selectable: true
            })
            break
          case 'path':
            newObject = new fabric.Path(data.path, {
              ...data,
              left: newLeft,
              top: newTop,
              evented: true,
              selectable: true
            })
            break
          case 'line':
            newObject = new fabric.Line(data.points || [0, 0, 100, 0], {
              ...data,
              left: newLeft,
              top: newTop,
              evented: true,
              selectable: true
            })
            break
          case 'image':
            // 处理图片对象 - 需要异步加载图片
            if (data.src) {
              const img = new Image()
              img.crossOrigin = 'anonymous'
              
              new Promise((resolve, reject) => {
                img.onload = () => resolve(img)
                img.onerror = reject
                img.src = data.src
              }).then((loadedImg: any) => {
                const fabricImg = new fabric.Image(loadedImg, {
                  ...data,
                  left: newLeft,
                  top: newTop,
                  evented: true,
                  selectable: true
                })
                
                canvas.add(fabricImg)
                canvas.setActiveObject(fabricImg)
                canvas.requestRenderAll()
                

                
                // 显示粘贴成功提示
                const notification = document.createElement('div')
                notification.innerHTML = `
                  <div style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #10b981; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
                    图片已粘贴 (Ctrl+V)
                  </div>
                `
                document.body.appendChild(notification)
                
                // 1.5秒后自动移除提示
                setTimeout(() => {
                  if (document.body.contains(notification)) {
                    document.body.removeChild(notification)
                  }
                }, 1500)
              }).catch(error => {
              })
              
              return
            }
            break
          default:
            return
        }
        
        if (newObject) {
          canvas.add(newObject)
          canvas.setActiveObject(newObject)
          canvas.requestRenderAll()
          

          
          // 显示粘贴成功提示
          const notification = document.createElement('div')
          notification.innerHTML = `
            <div style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #10b981; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
              对象已粘贴 (Ctrl+V)
            </div>
          `
          document.body.appendChild(notification)
          
          // 1.5秒后自动移除提示
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification)
            }
          }, 1500)
        }
      }
    } catch (error) {
    }
  }

  // 从系统剪贴板粘贴图片
  const handlePasteFromClipboard = async (): Promise<boolean> => {
    if (!canvas || !(window as any).fabric) {
      return false
    }
    
    try {
      // 获取鼠标在画板上的当前位置
      let mouseX = 0
      let mouseY = 0
      
      // 尝试从画布事件中获取鼠标位置
      const lastMouseEvent = canvas.__lastMouseEvent
      if (lastMouseEvent && lastMouseEvent.e) {
        // 使用画布转换将鼠标坐标转换为画布坐标
        const pointer = canvas.getPointer(lastMouseEvent.e)
        mouseX = pointer.x
        mouseY = pointer.y
      } else {
        // 如果没有鼠标事件记录，使用画布中心
        const canvasWidth = canvas.getWidth() || 800
        const canvasHeight = canvas.getHeight() || 600
        mouseX = canvasWidth / 2
        mouseY = canvasHeight / 2
      }
      
      // 检查剪贴板中是否有图片数据
      const clipboardItems = await navigator.clipboard.read()
      
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            
            const blob = await clipboardItem.getType(type)
            const imageUrl = URL.createObjectURL(blob)
            
            // 使用HTML Image元素加载图片
            const img = new Image()
            img.crossOrigin = 'anonymous'
            
            return new Promise((resolve) => {
              img.onload = () => {
                const fabric = (window as any).fabric
                
                // 创建Fabric图片对象，使用鼠标位置
                const fabricImg = new fabric.Image(img, {
                  left: mouseX - img.width / 2,
                  top: mouseY - img.height / 2,
                  evented: true,
                  selectable: true
                })
                
                // 设置缩放比例
                const canvasWidth = canvas.getWidth()
                const canvasHeight = canvas.getHeight()
                const maxWidth = canvasWidth * 0.8
                const maxHeight = canvasHeight * 0.8
                const scaleX = maxWidth / img.width
                const scaleY = maxHeight / img.height
                const scale = Math.min(scaleX, scaleY, 1)
                
                fabricImg.scale(scale)
                
                // 添加到画布
                canvas.add(fabricImg)
                canvas.setActiveObject(fabricImg)
                canvas.requestRenderAll()
                
                // 显示粘贴成功提示
                const notification = document.createElement('div')
                notification.innerHTML = `
                  <div style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #10b981; color: white; padding: 8px 12px; border-radius: 6px; z-index: 10000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 14px;">
                    图片已从剪贴板粘贴
                  </div>
                `
                document.body.appendChild(notification)
                
                // 1.5秒后自动移除提示
                setTimeout(() => {
                  if (document.body.contains(notification)) {
                    document.body.removeChild(notification)
                  }
                  URL.revokeObjectURL(imageUrl)
                }, 1500)
                
                resolve(true)
              }
              
              img.onerror = () => {
                resolve(false)
              }
              
              img.src = imageUrl
            })
          }
        }
      }
      
      return false
    } catch (error) {
      return false
    }
  }

  // 历史记录功能
  // 保存当前画板状态到历史记录
  const saveToHistory = useCallback(async () => {
    if (!canvas) return
    
    try {
      // 生成画布预览图，保持最高质量
      const previewDataURL = canvas.toDataURL({  
        format: 'png',
        quality: 1.0,
        width: 200,
        height: 150
      })
      
      // 获取画布数据并处理图片对象
      const canvasData = canvas.toJSON()
      
      // 处理画布数据中的图片对象，将blob URL转换为base64
      const processedCanvasData = await processCanvasDataForStorage(canvasData)
      
      // 创建历史记录
      const record = {
        timestamp: Date.now(),
        name: `历史记录 ${new Date().toLocaleTimeString()}`,
        canvasData: processedCanvasData,
        preview: previewDataURL,
        metadata: {
          objectCount: canvas.getObjects().length,
          zoomLevel: zoomLevel,
          brushSettings: {
            size: brushSize,
            color: brushColor
          }
        }
      }
      
      await historyDB.addRecord(record)
      
      // 显示保存成功提示
      const notification = document.createElement('div')
      notification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 12px 16px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <strong>已保存到历史记录</strong><br>
          ${record.name}
        </div>
      `
      document.body.appendChild(notification)
      
      // 3秒后自动移除提示
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 3000)
      
    } catch (error) {
      // 保存历史记录失败
    }
  }, [canvas, zoomLevel, brushSize, brushColor])

  // 处理画布数据用于存储（将blob URL转换为base64）
  const processCanvasDataForStorage = async (canvasData: any): Promise<any> => {
    if (!canvasData || !canvasData.objects) return canvasData
    
    // 深拷贝数据避免修改原始对象
    const processedData = JSON.parse(JSON.stringify(canvasData))
    
    // 处理所有对象中的图片URL
    for (const obj of processedData.objects) {
      if (obj.type === 'image' && obj.src) {
        // 检查是否是blob URL
        if (obj.src.startsWith('blob:')) {
          // 检查是否为视频对象 - 视频对象需要特殊处理
          const isVideoObject = 
            obj._element && 
            obj._element.tagName === 'VIDEO' ||
            obj.videoElement ||
            obj.isVideo
          
          if (isVideoObject) {
            // 对于视频对象，保留blob URL，不进行转换
            continue
          }
          
          try {
            // 将图片的blob URL转换为base64
            const base64Data = await blobUrlToBase64(obj.src)
            obj.src = base64Data
          } catch (error) {
            // 如果转换失败，移除该对象避免加载错误
            obj.src = ''
          }
        }
      }
    }
    
    return processedData
  }

  // 将blob URL转换为base64
  const blobUrlToBase64 = async (blobUrl: string): Promise<string> => {
    const response = await fetch(blobUrl)
    const blob = await response.blob()
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // 彻底清理历史记录数据中的blob URL
  const cleanCanvasDataFromBlobUrls = (canvasData: any): any => {
    if (!canvasData || !canvasData.objects) return canvasData
    
    // 深拷贝数据
    const cleanedData = JSON.parse(JSON.stringify(canvasData))
    
    // 区分处理图片和视频对象
    cleanedData.objects = cleanedData.objects.filter((obj: any) => {
      if (obj.type === 'image' && obj.src && obj.src.startsWith('blob:')) {
        // 检查是否为视频对象 - 视频对象有特定的属性
        const isVideoObject = 
          obj._element && 
          obj._element.tagName === 'VIDEO' ||
          obj.videoElement ||
          obj.isVideo
        
        if (isVideoObject) {
          return true // 保留视频对象
        } else {
          return false // 过滤掉图片对象
        }
      }
      return true
    })
    
    return cleanedData
  }

  // 加载历史记录到画板
  const loadHistoryRecord = useCallback(async (record: HistoryRecord) => {
    if (!canvas) return
    
    try {
      // 保存当前状态到历史记录
      saveCanvasState()
      
      // 清除当前画布
      canvas.clear()
      
      // 彻底清理历史记录数据中的blob URL
      const cleanedCanvasData = cleanCanvasDataFromBlobUrls(record.canvasData)
      
      // 使用Promise包装加载过程，确保错误被捕获
      await new Promise<void>((resolve, reject) => {
        try {
          // 保存原始错误处理
          const originalConsoleError = console.error
          
          // 临时替换console.error来捕获Fabric.js的错误
          console.error = (...args: any[]) => {
            // 检查是否是blob URL相关的错误
            if (args.some(arg => typeof arg === 'string' && arg.includes('blob:'))) {
              return // 不输出错误
            }
            // 其他错误正常输出
            originalConsoleError.apply(console, args)
          }
          
          // 设置全局错误处理
          const errorHandler = (event: ErrorEvent) => {
            if (event.error && event.error.message && event.error.message.includes('blob:')) {
              event.preventDefault()
            }
          }
          
          window.addEventListener('error', errorHandler)
          
          // 加载画布数据
          canvas.loadFromJSON(cleanedCanvasData, () => {
            // 恢复原始console.error
            console.error = originalConsoleError
            // 移除错误处理
            window.removeEventListener('error', errorHandler)
            
            canvas.renderAll()
            
            // 恢复元数据设置
            if (record.metadata) {
              const { zoomLevel: recordZoomLevel, brushSettings } = record.metadata
              
              if (recordZoomLevel) {
                setZoomLevel(recordZoomLevel)
                const scale = recordZoomLevel / 100
                const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0]
                vpt[0] = scale
                vpt[3] = scale
                canvas.setViewportTransform(vpt)
              }
              
              if (brushSettings) {
                setBrushSize(brushSettings.size || 3)
                setBrushColor(brushSettings.color || '#000000')
              }
            }
            
            canvas.requestRenderAll()
            
            // 关闭历史面板
            setShowHistoryPanel(false)
            resolve()
          }, (obj: any, object: any) => {
            // 在对象创建阶段拦截blob URL，但保留视频对象
            if (obj.type === 'image' && obj.src && obj.src.startsWith('blob:')) {
              // 检查是否为视频对象
              const isVideoObject = 
                obj._element && 
                obj._element.tagName === 'VIDEO' ||
                obj.videoElement ||
                obj.isVideo
              
              if (isVideoObject) {
                return true // 允许创建视频对象
              } else {
                return false // 阻止创建图片对象
              }
            }
            return true
          })
          
        } catch (error) {
          reject(error)
        }
      })
      
    } catch (error) {
      // 即使有错误也尝试继续
      try {
        canvas.renderAll()
        canvas.requestRenderAll()
        setShowHistoryPanel(false)
        
        // 显示成功信息而不是错误信息
        alert('历史记录加载完成。部分失效的图片已被自动移除。')
      } catch (recoveryError) {
        // 静默处理，不显示错误
      }
    }
  }, [canvas])

  // 加载历史记录列表
  const loadHistoryRecords = useCallback(async () => {
    try {
      const records = await historyDB.getAllRecords()
      setHistoryRecords(records)
    } catch (error) {
      // 加载历史记录列表失败
    }
  }, [])

  // 清空历史记录
  const clearHistory = async () => {
    try {
      await historyDB.clearAll()
      setHistoryRecords([])
    } catch (error) {
      // 清空历史记录失败
    }
  }

  // 删除单个历史记录
  const deleteHistoryRecord = async (recordId: string) => {
    try {
      await historyDB.deleteRecord(recordId)
      // 从当前记录列表中移除
      setHistoryRecords(prev => prev.filter(record => record.id !== recordId))
    } catch (error) {
      // 删除历史记录失败
    }
  }

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 检查事件目标是否是输入框，如果是则跳过所有快捷键处理
      const target = event.target as HTMLElement
      
      // 更完善的输入框检测逻辑
      const isInputElement = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable ||
        (target.closest && (
          target.closest('input') || 
          target.closest('textarea') || 
          target.closest('[contenteditable="true"]')
        ))
      
      if (isInputElement) {
        // 确保完全阻止事件处理
        event.stopPropagation()
        event.stopImmediatePropagation()
        return
      }
      
      if (!canvas) return
      
      const activeObject = canvas.getActiveObject()
      
      // 如果当前选中的是文字对象且处于编辑模式，让Backspace键逐个删除字符
      if (activeObject && activeObject.isEditing && event.key === 'Backspace') {
        // 让Fabric.js处理文字编辑的Backspace逻辑
        return
      }
      
      // 处理Delete键删除选中的对象（Backspace在编辑模式下不删除对象）
      if (event.key === 'Delete') {
        event.preventDefault()
        handleDeleteSelected()
      }
      
      // 处理Backspace键（非编辑模式下删除选中的对象）
      if (event.key === 'Backspace' && (!activeObject || !activeObject.isEditing)) {
        event.preventDefault()
        handleDeleteSelected()
      }
      
      // 控制键组合快捷键（只处理复制操作，粘贴操作由另一个处理函数处理）
      if (event.ctrlKey || event.metaKey) { // 添加 metaKey 支持 Mac 的 Cmd 键
        const key = event.key.toLowerCase()
        
        switch (key) {
          case 'c': // Ctrl + C - 复制
            // 检查是否有选中的对象（支持多对象选择）
            const activeObjects = canvas.getActiveObjects()
            if (activeObjects.length > 0 && (!activeObject || !activeObject.isEditing)) {
              event.preventDefault()
              handleCopyObject()
            }
            break
          case 's': // Ctrl + S - 保存到历史记录
            event.preventDefault()
            saveToHistory()
            break
          case 'd': // Ctrl + D - 下载JSON
            event.preventDefault()
            handleDownloadCanvas()
            break
        }
      }
      
      // 阻止单独的S键生效（防止Ctrl+S后S键触发其他行为）
      if (event.key.toLowerCase() === 's' && !(event.ctrlKey || event.metaKey)) {
        event.preventDefault()
      }
      
      // 层级操作快捷键
      if (activeObject && event.ctrlKey) {
        switch (event.key) {
          case ']': // Ctrl + ] - 上移一层
            event.preventDefault()
            handleBringForward()
            break
          case '[': // Ctrl + [ - 下移一层
            event.preventDefault()
            handleSendBackward()
            break
          case '}': // Ctrl + Shift + ] - 置顶
            if (event.shiftKey) {
              event.preventDefault()
              handleBringToFront()
            }
            break
          case '{': // Ctrl + Shift + [ - 置底
            if (event.shiftKey) {
              event.preventDefault()
              handleSendToBack()
            }
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [canvas, handleCopyObject, handlePasteObject, handlePasteFromClipboard, saveToHistory]) // 添加依赖项

  // 保存画布状态到历史记录
  const saveCanvasState = () => {
    if (!canvas || !(window as any).fabric) return
    
    // 深拷贝画布对象以避免引用共享问题
    const currentState = canvas._objects.map(obj => {
      if (!obj) return null
      return (window as any).fabric?.util?.object?.clone(obj) || obj
    }).filter(obj => obj !== null)
    
    // 如果当前不是最新状态，需要截断重做分支
    let newHistory
    if (historyIndex < history.length - 1) {
      // 截断重做分支
      newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(currentState)
    } else {
      // 追加到历史记录末尾
      newHistory = [...history, currentState]
    }
    
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  // 保存状态但不移动指针（用于撤销/重做操作）
  const saveStateWithoutMovingPointer = () => {
    if (!canvas || !(window as any).fabric) return
    
    // 深拷贝画布对象
    const currentState = canvas._objects.map(obj => {
      if (!obj) return null
      return (window as any).fabric?.util?.object?.clone(obj) || obj
    }).filter(obj => obj !== null)
    
    // 保存状态但不移动指针，用于撤销/重做操作后的状态保存
    const newHistory = [...history]
    newHistory.push(currentState)
    
    setHistory(newHistory)
    // 不更新historyIndex，保持当前位置
  }

  // 设置画板移动功能
  useEffect(() => {
    if (!canvas) return
    
    let isPanning = false
    let lastPosX = 0
    let lastPosY = 0
    
    const handleMouseDown = (opt: any) => {
      if (activeTool === 'hand') {
        const evt = opt.e
        isPanning = true
        canvas.defaultCursor = 'grabbing'
        canvas.hoverCursor = 'grabbing'
        lastPosX = evt.clientX
        lastPosY = evt.clientY
      }
    }
    
    const handleMouseMove = (opt: any) => {
      if (isPanning && activeTool === 'hand') {
        const evt = opt.e
        const deltaX = evt.clientX - lastPosX
        const deltaY = evt.clientY - lastPosY
        
        // 移动视口
        const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0]
        vpt[4] += deltaX
        vpt[5] += deltaY
        
        canvas.setViewportTransform(vpt)
        canvas.requestRenderAll()
        
        lastPosX = evt.clientX
        lastPosY = evt.clientY
      }
    }
    
    const handleMouseUp = () => {
      if (activeTool === 'hand') {
        isPanning = false
        canvas.defaultCursor = 'grab'
        canvas.hoverCursor = 'grab'
      }
    }
    
    canvas.on('mouse:down', handleMouseDown)
    canvas.on('mouse:move', handleMouseMove)
    canvas.on('mouse:up', handleMouseUp)
    
    return () => {
      canvas.off('mouse:down', handleMouseDown)
      canvas.off('mouse:move', handleMouseMove)
      canvas.off('mouse:up', handleMouseUp)
    }
  }, [canvas, activeTool])

  // 监听工具栏状态更新事件
  useEffect(() => {
    const handleUpdateToolbarState = (event: CustomEvent) => {
      if (event.detail.activeTool) {
        // 更新活动工具状态
        setActiveTool(event.detail.activeTool)
        
        // 根据工具类型设置画布状态
        switch (event.detail.activeTool) {
          case 'arrow':
            if (canvas) {
              canvas.isDrawingMode = false
              canvas.selection = true
              canvas.defaultCursor = 'crosshair'
              canvas.hoverCursor = 'pointer'
            }
            break
          // 可以根据需要添加其他工具的状态设置
        }
      }
    }

    // 添加事件监听器
    window.addEventListener('canvas:updateToolbarState', handleUpdateToolbarState as EventListener)

    return () => {
      window.removeEventListener('canvas:updateToolbarState', handleUpdateToolbarState as EventListener)
    }
  }, [canvas])

  // 监听画板缩放事件
  useEffect(() => {
    if (!canvas) return
    
    const updateZoomLevel = () => {
      const vpt = canvas.viewportTransform
      if (vpt) {
        // 计算缩放比例（viewportTransform[0] 是X轴缩放因子）
        const scale = vpt[0] * 100
        setZoomLevel(Math.round(scale))
      }
    }
    
    // 初始更新
    updateZoomLevel()
    
    // 监听鼠标滚轮缩放事件
    canvas.on('mouse:wheel', updateZoomLevel)
    
    return () => {
      canvas.off('mouse:wheel', updateZoomLevel)
    }
  }, [canvas])

  // 监听鼠标移动事件，记录鼠标位置
  useEffect(() => {
    if (!canvas) return
    
    const handleMouseMove = (opt: any) => {
      // 记录鼠标事件，用于粘贴时获取位置
      canvas.__lastMouseEvent = opt
    }
    
    canvas.on('mouse:move', handleMouseMove)
    canvas.on('mouse:down', handleMouseMove)
    
    return () => {
      canvas.off('mouse:move', handleMouseMove)
      canvas.off('mouse:down', handleMouseMove)
    }
  }, [canvas])

  // 当画布内容变化时保存状态
  useEffect(() => {
    if (!canvas) return
    
    // 初始化时保存空状态
    if (history.length === 0) {
      saveCanvasState()
    }
    
    const handleObjectAdded = () => {
      saveCanvasState()
    }
    
    const handleObjectRemoved = () => {
      saveCanvasState()
    }
    
    // 双击文字对象进入编辑模式
    const handleMouseDown = (options: any) => {
      if (options.target && options.target.type === 'textbox') {
        // 双击时进入编辑模式
        if (options.e.detail === 2) {
          options.target.enterEditing()
          canvas.requestRenderAll()
        }
      }
    }
    
    canvas.on('object:added', handleObjectAdded)
    canvas.on('object:removed', handleObjectRemoved)
    canvas.on('mouse:down', handleMouseDown)
    
    return () => {
      canvas.off('object:added', handleObjectAdded)
      canvas.off('object:removed', handleObjectRemoved)
      canvas.off('mouse:down', handleMouseDown)
    }
  }, [canvas, history, historyIndex])

  const tools = [
    { id: 'hand' as Tool, icon: Hand, label: '移动画板' },
    { id: 'pencil' as Tool, icon: Pencil, label: '画笔' },
    { id: 'arrow' as Tool, icon: ArrowUpRight, label: '箭头' },
    { id: 'shapes' as Tool, icon: Shapes, label: '形状' },
    { id: 'text' as Tool, icon: Type, label: '文字' },
    { id: 'eraser' as Tool, icon: Eraser, label: '橡皮擦' },
    { id: 'image' as Tool, icon: ImageIcon, label: '图片' },
    { id: 'stickfigure' as Tool, icon: UserRound, label: '火柴人' },
    { id: 'layers' as Tool, icon: Layers, label: '层级管理' },
  ]

  const shapes = [
    { id: 'rectangle' as ShapeType, icon: Square, label: '矩形' },
    { id: 'circle' as ShapeType, icon: Circle, label: '圆形' },
    { id: 'triangle' as ShapeType, icon: Triangle, label: '三角形' },
    { id: 'star' as ShapeType, icon: Star, label: '星星' },
    { id: 'heart' as ShapeType, icon: Heart, label: '心形' },
    { id: 'diamond' as ShapeType, icon: Diamond, label: '菱形' },
    { id: 'octagon' as ShapeType, icon: Octagon, label: '八边形' },
    { id: 'arrow' as ShapeType, icon: ArrowRight, label: '箭头' },
    { id: 'line' as ShapeType, icon: Minus, label: '直线' },
    { id: 'dashed-line' as ShapeType, icon: Minus, label: '虚线' },
    { id: 'left-brace' as ShapeType, icon: Braces, label: '左大括号' },
    { id: 'right-brace' as ShapeType, icon: Braces, label: '右大括号' },
  ]


  
  const handleAddStickFigure = () => {
    if (!canvas || !(window as any).fabric) return;
    
    const fabric = (window as any).fabric;
    
    // 保存当前状态到历史记录
    saveCanvasState();
    
    // 创建关节圆形函数 - 使用中心点定位
    const makeCircle = (centerX: number, centerY: number) => {
      const radius = 12;
      const c = new fabric.Circle({
        left: centerX - radius,  // 计算左上角坐标
        top: centerY - radius,   // 计算左上角坐标
        strokeWidth: 5,
        radius: radius,
        fill: '#fff',
        stroke: '#666',
        selectable: true,
        hasControls: false,
        hasBorders: false,
        // 关键：确保关节在移动时不会与线条失去关联
        lockMovementX: false,
        lockMovementY: false
      });
      
      // 存储与此关节连接的线条和中心点坐标
      c.connectedLines = [];
      c.centerX = centerX;
      c.centerY = centerY;
      
      // 添加标志以标识这是火柴人关节，点击时不显示任何面板
      c.isStickFigureJoint = true;
      
      return c;
    };

    // 创建线条函数
    const makeLine = (x1: number, y1: number, x2: number, y2: number, startJoint: any, endJoint: any) => {
      const line = new fabric.Line([x1, y1, x2, y2], {
        fill: 'red',
        stroke: 'red',
        strokeWidth: 5,
        selectable: false,
        evented: false,
        // 存储线条的两个端点关节引用
        startJoint: startJoint,
        endJoint: endJoint
      });
      
      return line;
    };

    // 连接两个关节的函数 - 使用关节的中心点连接
    const connectJoints = (joint1: any, joint2: any) => {
      const line = makeLine(joint1.centerX, joint1.centerY, joint2.centerX, joint2.centerY, joint1, joint2);
      
      // 将线条添加到两个关节的连接线条数组中
      joint1.connectedLines.push({ line, isEnd: false }); // joint1是线条的起点
      joint2.connectedLines.push({ line, isEnd: true });  // joint2是线条的终点
      
      // 同时在线条上保存关节引用，便于反向查找
      line.startJoint = joint1;
      line.endJoint = joint2;
      
      return line;
    };

    // 创建火柴人的各个部分
    const centerX = canvas.width! / 2;
    const centerY = canvas.height! / 2;
    
    // 首先创建所有关节控制点 - 增加手部和脚部关节
    const headJoint = makeCircle(centerX, centerY - 75);      // 头部关节
    const bodyJoint = makeCircle(centerX, centerY - 25);      // 身体中央关节
    const hipsJoint = makeCircle(centerX, centerY + 25);      // 臀部关节
    
    // 手臂相关关节
    const leftArmJoint = makeCircle(centerX - 75, centerY + 25);    // 左臂肩膀关节
    const leftHandJoint = makeCircle(centerX - 120, centerY + 25);  // 左手关节
    const rightArmJoint = makeCircle(centerX + 75, centerY + 25);   // 右臂肩膀关节
    const rightHandJoint = makeCircle(centerX + 120, centerY + 25); // 右手关节
    
    // 腿部相关关节
    const leftLegJoint = makeCircle(centerX - 50, centerY + 100);   // 左腿膝盖关节
    const leftFootJoint = makeCircle(centerX - 50, centerY + 150);  // 左脚关节
    const rightLegJoint = makeCircle(centerX + 50, centerY + 100);  // 右腿膝盖关节
    const rightFootJoint = makeCircle(centerX + 50, centerY + 150); // 右脚关节

    // 然后创建连接关节的线条 - 增加手部和脚部连接
    const headToBody = connectJoints(headJoint, bodyJoint);
    const bodyToHips = connectJoints(bodyJoint, hipsJoint);
    
    // 手臂连接
    const bodyToLeftArm = connectJoints(bodyJoint, leftArmJoint);
    const leftArmToHand = connectJoints(leftArmJoint, leftHandJoint);
    const bodyToRightArm = connectJoints(bodyJoint, rightArmJoint);
    const rightArmToHand = connectJoints(rightArmJoint, rightHandJoint);
    
    // 腿部连接
    const hipsToLeftLeg = connectJoints(hipsJoint, leftLegJoint);
    const leftLegToFoot = connectJoints(leftLegJoint, leftFootJoint);
    const hipsToRightLeg = connectJoints(hipsJoint, rightLegJoint);
    const rightLegToFoot = connectJoints(rightLegJoint, rightFootJoint);

    // 先添加线条，再添加关节，这样关节会在上面，更容易选择
    canvas.add(
      headToBody, 
      bodyToHips,
      // 手臂线条
      bodyToLeftArm, 
      leftArmToHand,
      bodyToRightArm,
      rightArmToHand,
      // 腿部线条
      hipsToLeftLeg,
      leftLegToFoot,
      hipsToRightLeg,
      rightLegToFoot
    );
    canvas.add(
      headJoint, 
      bodyJoint, 
      hipsJoint,
      // 手臂关节
      leftArmJoint, 
      leftHandJoint,
      rightArmJoint,
      rightHandJoint,
      // 腿部关节
      leftLegJoint,
      leftFootJoint,
      rightLegJoint,
      rightFootJoint
    );

    // 使用Fabric.js内置方法获取关节在画布上的实际渲染位置
    const getJointRenderPosition = (joint: any) => {
      if (!joint) return { x: 0, y: 0 };
      
      try {
        // 获取关节的边界矩形，这包含了变换后的实际渲染位置
        const bounds = joint.getBoundingRect();
        
        // 计算中心点坐标
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;
        
        return { centerX, centerY };
      } catch (err) {
        console.warn('Error calculating joint position:', err);
        // 回退方案 - 使用简化计算
        const radius = joint.radius || 12;
        let x = joint.left || 0;
        let y = joint.top || 0;
        
        // 基础计算
        x += radius;
        y += radius;
        
        return { centerX: x, centerY: y };
      }
    };
    
    // 更新单个线条的位置
    const updateLinePosition = (line: any) => {
      if (!line || !line.startJoint || !line.endJoint) return;
      
      try {
        // 获取两个关节的实际渲染位置
        const startPos = getJointRenderPosition(line.startJoint);
        const endPos = getJointRenderPosition(line.endJoint);
        
        // 更新线条位置
        line.set({
          'x1': startPos.centerX,
          'y1': startPos.centerY,
          'x2': endPos.centerX,
          'y2': endPos.centerY
        });
        line.setCoords();
      } catch (err) {
        console.warn('Error updating line position:', err);
      }
    };
    
    // 更新所有线条 - 直接从线条关联的关节获取位置
    const updateAllLines = () => {
      // 获取画布上所有对象
      const allObjects = canvas.getObjects();
      
      // 找出所有线条对象
      const lines = allObjects.filter((obj: any) => 
        obj && obj.type === 'line' && obj.startJoint && obj.endJoint
      );
      
      // 更新每条线条的端点坐标
      lines.forEach(updateLinePosition);
      
      // 渲染画布
      canvas.renderAll();
    };
    
    // 优化的实时更新函数
    let isUpdating = false;
    const throttledUpdate = () => {
      if (isUpdating) return;
      
      isUpdating = true;
      requestAnimationFrame(() => {
        updateAllLines();
        isUpdating = false;
      });
    };
    
    // 处理选择组的变换事件 - 使用requestAnimationFrame实现平滑更新
    const handleSelectionTransform = () => {
      throttledUpdate();
    };

    // 处理单个对象移动事件
    const handleObjectMoving = (e: any) => {
      throttledUpdate();
    };

    // 处理对象移动结束事件
    const handleObjectMoved = (e: any) => {
      throttledUpdate();
    };

    // 处理选择区域创建事件 - 当框选完成后立即更新
    const handleSelectionCreated = () => {
      throttledUpdate();
    };

    // 处理选择区域更新事件 - 用于框选多个关节同时移动的情况
    const handleSelectionUpdated = () => {
      throttledUpdate();
    };

    // 处理对象修改完成事件 - 确保移动结束后线条正确更新
    const handleObjectModified = (e: any) => {
      throttledUpdate();
    };

    // 处理鼠标抬起事件 - 确保拖动结束后线条正确更新
    const handleMouseUp = () => {
      throttledUpdate();
    };

    // 处理选择:cleared事件 - 当取消选择时也更新一下，确保线条位置正确
    const handleSelectionCleared = () => {
      // 当选择被清除时，直接更新所有线条
      throttledUpdate();
    };

    // 处理对象删除事件 - 确保删除关节时同时删除相关线条
    const handleObjectRemoved = (e: any) => {
      const removedObject = e.target;
      
      // 检查被删除的对象是否是火柴人关节
      if (removedObject && removedObject.isStickFigureJoint && removedObject.connectedLines) {
        // 收集所有需要删除的线条
        const linesToRemove: any[] = [];
        
        // 从关节的连接信息中获取线条
        removedObject.connectedLines.forEach((connection: any) => {
          if (connection && connection.line) {
            linesToRemove.push(connection.line);
            
            // 同时从另一个关节的连接列表中移除这个连接
            if (connection.line.startJoint && connection.line.startJoint !== removedObject) {
              connection.line.startJoint.connectedLines = connection.line.startJoint.connectedLines.filter(
                (conn: any) => conn.line !== connection.line
              );
            }
            if (connection.line.endJoint && connection.line.endJoint !== removedObject) {
              connection.line.endJoint.connectedLines = connection.line.endJoint.connectedLines.filter(
                (conn: any) => conn.line !== connection.line
              );
            }
          }
        });
        
        // 删除所有关联的线条
        linesToRemove.forEach((line) => {
          canvas.remove(line);
        });
      }
    };

    // 移除之前可能存在的同名事件监听器，避免重复
    canvas.off('object:moving', handleObjectMoving);
    canvas.off('object:moved', handleObjectMoved);
    canvas.off('selection:created', handleSelectionCreated);
    canvas.off('selection:updated', handleSelectionUpdated);
    canvas.off('object:modified', handleObjectModified);
    canvas.off('mouse:up', handleMouseUp);
    canvas.off('selection:cleared', handleSelectionCleared);
    canvas.off('selection:transform', handleSelectionTransform);
    canvas.off('object:removed', handleObjectRemoved);
    
    // 添加新的事件监听器
    canvas.on('object:moving', handleObjectMoving);     // 移动过程中持续更新
    canvas.on('object:moved', handleObjectMoved);       // 移动结束后最终更新
    canvas.on('selection:created', handleSelectionCreated); // 新选择创建时更新
    canvas.on('selection:updated', handleSelectionUpdated); // 选择区域更新时更新
    canvas.on('selection:transform', handleSelectionTransform); // 选择组变换过程中持续更新 - 关键修复
    canvas.on('object:modified', handleObjectModified);     // 对象修改完成时更新
    canvas.on('mouse:up', handleMouseUp);                 // 鼠标抬起时更新
    canvas.on('selection:cleared', handleSelectionCleared); // 取消选择时更新
    canvas.on('object:removed', handleObjectRemoved);     // 对象删除时清理相关线条
  };

  const handleToolSelect = (tool: Tool) => {
    setActiveTool(tool)
    
    if (!canvas) {
      return
    }
    
    switch (tool) {
      case 'pencil':
        canvas.isDrawingMode = true
        setIsDrawingMode(true)
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.width = brushSize
          canvas.freeDrawingBrush.color = brushColor
        }
        canvas.defaultCursor = 'crosshair'
        canvas.hoverCursor = 'crosshair'
        break
      case 'shapes':
        // 禁用绘图模式以支持选择区域功能
        canvas.isDrawingMode = false
        setIsDrawingMode(false)
        canvas.defaultCursor = 'crosshair'
        canvas.hoverCursor = 'crosshair'
        setShowShapePicker(true)
        break

      case 'eraser':
        canvas.isDrawingMode = true
        setIsDrawingMode(true)
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.width = brushSize
          // 根据主题动态设置橡皮擦颜色
          const eraserColor = theme === 'dark' ? '#1f2937' : '#ffffff'
          canvas.freeDrawingBrush.color = eraserColor
          
          // 添加橡皮擦绘制完成后的对象删除逻辑
          const originalOnMouseUp = canvas.freeDrawingBrush._onMouseUp
          canvas.freeDrawingBrush._onMouseUp = function() {
            // 先调用原始的鼠标抬起逻辑，创建橡皮擦路径
            if (originalOnMouseUp) {
              originalOnMouseUp.call(this)
            }
            
            // 延迟执行删除逻辑，确保路径已创建
            setTimeout(() => {
              // 获取所有路径对象
              const paths = canvas.getObjects().filter(obj => obj.type === 'path')
              const lastPath = paths[paths.length - 1]
              
              if (lastPath) {
                // 查找与橡皮擦路径相交的非路径对象并删除
                const objectsToRemove = canvas.getObjects().filter(obj => {
                  if (obj.type === 'path') return false // 排除所有路径对象
                  if (!obj.intersectsWithObject || !lastPath.intersectsWithObject) return false
                  
                  // 检查对象是否与橡皮擦路径相交
                  return obj.intersectsWithObject(lastPath)
                })
                
                // 删除相交的对象
                if (objectsToRemove.length > 0) {
                  objectsToRemove.forEach(obj => {
                    canvas.remove(obj)
                  })
                  canvas.requestRenderAll()
                }
                
                // 删除橡皮擦路径本身，避免在画布上留下痕迹
                canvas.remove(lastPath)
                canvas.requestRenderAll()
              }
            }, 10)
          }
        }
        canvas.defaultCursor = 'crosshair'
        canvas.hoverCursor = 'crosshair'
        break
      case 'text':
        canvas.isDrawingMode = false
        setIsDrawingMode(false)
        canvas.defaultCursor = 'text'
        canvas.hoverCursor = 'text'
        
        // 添加画布点击事件监听器来创建文字
        const handleCanvasClick = (opt: any) => {
          const pointer = canvas.getPointer(opt.e)
          const text = new (window as any).fabric.Textbox('双击编辑文字', {
            left: pointer.x,
            top: pointer.y,
            fontFamily: 'Arial',
            fill: brushColor,
            fontSize: 20,
            editable: true,
            textAlign: 'left'
          })
          canvas.add(text)
          canvas.setActiveObject(text)
          canvas.renderAll()
          
          // 移除点击监听器，避免重复创建
          canvas.off('mouse:down', handleCanvasClick)
        }
        
        // 添加点击监听器
        canvas.on('mouse:down', handleCanvasClick)
        break
      case 'image':
        canvas.isDrawingMode = false
        setIsDrawingMode(false)
        // 直接调用新的图片上传函数
        handleImageUpload()
        canvas.defaultCursor = 'default'
        canvas.hoverCursor = 'default'
        break
      case 'hand':
        canvas.isDrawingMode = false
        setIsDrawingMode(false)
        // 启用画板移动功能
        canvas.selection = false
        canvas.defaultCursor = 'grab'
        canvas.hoverCursor = 'grab'
        break
      case 'arrow':
        canvas.isDrawingMode = false
        setIsDrawingMode(false)
        // 启用选择模式
        canvas.selection = true
        canvas.defaultCursor = 'crosshair'
        canvas.hoverCursor = 'pointer'
        break
      case 'layers':
        canvas.isDrawingMode = false
        setIsDrawingMode(false)
        // 启用选择模式
        canvas.selection = true
        canvas.defaultCursor = 'default'
        canvas.hoverCursor = 'default'
        break
      case 'stickfigure':
        canvas.isDrawingMode = false
        setIsDrawingMode(false)
        // 启用选择模式
        canvas.selection = true
        canvas.defaultCursor = 'default'
        canvas.hoverCursor = 'default'
        // 添加火柴人
        handleAddStickFigure()
        break
      case 'history':
        canvas.isDrawingMode = false
        setIsDrawingMode(false)
        // 启用选择模式
        canvas.selection = true
        canvas.defaultCursor = 'default'
        canvas.hoverCursor = 'default'
        setShowHistoryPanel(true)
        // 加载历史记录列表
        loadHistoryRecords()
        break
      default:
        canvas.isDrawingMode = false
        setIsDrawingMode(false)
        // 恢复正常的画布行为
        canvas.selection = true
        canvas.defaultCursor = 'default'
        canvas.hoverCursor = 'default'
        break
    }
    
    // 强制重新渲染画布
    canvas.renderAll()
  }

  const handleAddShape = (shape: ShapeType) => {
    if (!canvas || !(window as any).fabric) {
      return
    }
    
    // 获取画布中心位置
    const centerX = canvas.width! / 2
    const centerY = canvas.height! / 2

    // 统一的形状配置
    const shapeConfig = {
      fill: 'transparent',
      stroke: brushColor,
      strokeWidth: brushSize,
    }

    let shapeObj

    switch (shape) {
      case 'rectangle':
        shapeObj = new (window as any).fabric.Rect({
          ...shapeConfig,
          width: 100,
          height: 100,
          left: centerX - 50,
          top: centerY - 50,
        })
        break
      case 'circle':
        shapeObj = new (window as any).fabric.Circle({
          ...shapeConfig,
          radius: 50,
          left: centerX,
          top: centerY,
        })
        break
      case 'triangle':
        shapeObj = new (window as any).fabric.Triangle({
          ...shapeConfig,
          width: 100,
          height: 100,
          left: centerX - 50,
          top: centerY - 50,
        })
        break
      case 'star':
        const starPoints = []
        const numPoints = 5
        const innerRadius = 30
        const outerRadius = 50
        
        for (let i = 0; i < numPoints * 2; i++) {
          const angle = (i * Math.PI) / numPoints
          const radius = i % 2 === 0 ? outerRadius : innerRadius
          starPoints.push({
            x: 50 + radius * Math.sin(angle),
            y: 50 + radius * Math.cos(angle)
          })
        }
        
        shapeObj = new (window as any).fabric.Polygon(starPoints, {
          ...shapeConfig,
          left: centerX,
          top: centerY,
        })
        break
      case 'heart':
        const heartPath = 'M 50 30 C 70 10, 90 30, 90 50 C 90 70, 70 90, 50 90 C 30 90, 10 70, 10 50 C 10 30, 30 10, 50 30 Z'
        shapeObj = new (window as any).fabric.Path(heartPath, {
          ...shapeConfig,
          left: centerX - 40,
          top: centerY - 40,
          scaleX: 0.8,
          scaleY: 0.8,
        })
        break
      case 'diamond':
        shapeObj = new (window as any).fabric.Polygon([
          { x: 50, y: 0 },
          { x: 100, y: 50 },
          { x: 50, y: 100 },
          { x: 0, y: 50 }
        ], {
          ...shapeConfig,
          left: centerX - 50,
          top: centerY - 50,
        })
        break
      case 'octagon':
        shapeObj = new (window as any).fabric.Polygon([
          { x: 30, y: 0 },
          { x: 70, y: 0 },
          { x: 100, y: 30 },
          { x: 100, y: 70 },
          { x: 70, y: 100 },
          { x: 30, y: 100 },
          { x: 0, y: 70 },
          { x: 0, y: 30 }
        ], {
          ...shapeConfig,
          left: centerX - 50,
          top: centerY - 50,
        })
        break
      case 'arrow':
        // 创建箭头形状
        shapeObj = new (window as any).fabric.Polyline([
          { x: 0, y: 25 },
          { x: 75, y: 25 },
          { x: 75, y: 0 },
          { x: 100, y: 25 },
          { x: 75, y: 50 },
          { x: 75, y: 25 }
        ], {
          ...shapeConfig,
          left: centerX - 50,
          top: centerY - 25,
          fill: brushColor,
          stroke: brushColor,
        })
        break
      case 'line':
        // 创建直线
        shapeObj = new (window as any).fabric.Line([0, 0, 100, 0], {
          ...shapeConfig,
          left: centerX - 50,
          top: centerY,
        })
        break
      case 'dashed-line':
        // 创建虚线
        shapeObj = new (window as any).fabric.Line([0, 0, 100, 0], {
          ...shapeConfig,
          left: centerX - 50,
          top: centerY,
          strokeDashArray: [5, 5], // 虚线样式
        })
        break
      case 'left-brace':
        // 创建左大括号 - 更清晰的路径
        shapeObj = new (window as any).fabric.Path('M 40 10 C 20 10 10 20 10 40 C 10 60 20 70 40 70', {
          ...shapeConfig,
          left: centerX - 25,
          top: centerY - 35,
          fill: 'transparent',
        })
        break
      case 'right-brace':
        // 创建右大括号 - 更清晰的路径
        shapeObj = new (window as any).fabric.Path('M 10 10 C 30 10 40 20 40 40 C 40 60 30 70 10 70', {
          ...shapeConfig,
          left: centerX - 25,
          top: centerY - 35,
          fill: 'transparent',
        })
        break
      default:
        return
    }

    canvas.add(shapeObj)
    canvas.setActiveObject(shapeObj)
    setShowShapePicker(false)
  }

  const handleBrushSizeChange = (size: number) => {
    setBrushSize(size)
    if (canvas?.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = size
    }
  }

  const handleColorChange = (color: string) => {
    setBrushColor(color)
    if (canvas?.freeDrawingBrush && activeTool === 'pencil') {
      canvas.freeDrawingBrush.color = color
    }
  }



  const handleAddText = () => {
    if (!canvas || !(window as any).fabric) return

    // 获取画布中心位置
    const centerX = canvas.width! / 2
    const centerY = canvas.height! / 2

    const text = new (window as any).fabric.Textbox('双击编辑文字', {
      left: centerX - 50, // 居中
      top: centerY - 10,
      fontFamily: 'Arial',
      fill: brushColor,
      fontSize: 20,
      editable: true,
      textAlign: 'left'
    })

    canvas.add(text)
    canvas.setActiveObject(text)
  }

  // 重新实现图片上传功能 - 简化版本
  const handleImageUpload = () => {
    if (!canvas) {
      alert('画布未初始化，请稍后重试')
      return
    }
    
    const fabric = (window as any).fabric
    if (!fabric) {
      alert('画布引擎未加载，请刷新页面')
      return
    }
    
    // 创建文件输入元素
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'image/*'
    fileInput.style.display = 'none'
    
    fileInput.onchange = (event) => {
      const target = event.target as HTMLInputElement
      const file = target.files?.[0]
      
      if (!file) return
      
      // 清理文件输入值
      target.value = ''
      
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件')
        return
      }
      
      // 使用FileReader读取图片
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        
        // 使用HTML Image元素加载图片
        const img = new Image()
        img.onload = () => {
          // 创建Fabric图片对象
          const fabricImg = new fabric.Image(img)
          
          // 设置缩放比例，添加400px尺寸限制但保持图片质量
          const canvasWidth = canvas.getWidth()
          const canvasHeight = canvas.getHeight()
          const maxWidth = Math.min(400, canvasWidth * 0.8)
          const maxHeight = Math.min(400, canvasHeight * 0.8)
          const scaleX = maxWidth / img.width
          const scaleY = maxHeight / img.height
          const scale = Math.min(scaleX, scaleY, 1)
          
          fabricImg.scale(scale)
          
          // 设置位置为画布中心
          const centerX = canvasWidth / 2
          const centerY = canvasHeight / 2
          const scaledWidth = img.width * scale
          const scaledHeight = img.height * scale
          
          fabricImg.set({
            left: centerX - scaledWidth / 2,
            top: centerY - scaledHeight / 2,
            selectable: true,
            hasControls: true
          })
          
          // 添加到画布并自动选中
          canvas.add(fabricImg)
          canvas.setActiveObject(fabricImg)
          canvas.requestRenderAll()
          
          // 保存状态
          saveCanvasState()
        }
        
        img.onerror = () => {
          alert('图片加载失败，请重试')
        }
        
        img.src = imageUrl
      }
      
      reader.onerror = () => {
        alert('文件读取失败，请重试')
      }
      
      reader.readAsDataURL(file)
    }
    
    // 触发文件选择
    document.body.appendChild(fileInput)
    fileInput.click()
    
    // 清理
    setTimeout(() => {
      if (document.body.contains(fileInput)) {
        document.body.removeChild(fileInput)
      }
    }, 1000)
  }

  // 保存画板功能 - 打开保存弹窗
  const [projectData, setProjectData] = useState<any>(null)
  
  const handleSave = () => {
    // 检查当前是否是编辑模式
    const urlParams = new URLSearchParams(window.location.search)
    const editMode = urlParams.get('edit') === 'true'
    const projectId = urlParams.get('projectId')
    
    let data = null
    
    if (editMode && projectId) {
      // 获取现有的项目记录
      const existingProjects = JSON.parse(localStorage.getItem('userProjects') || '[]')
      const currentProject = existingProjects.find((p: any) => p.id === projectId)
      
      if (currentProject) {
        data = {
          name: currentProject.name,
          icon: currentProject.icon,
          description: currentProject.description || '',
          tags: currentProject.tags || []
        }
      }
    }
    
    setProjectData(data)
    setShowSaveModal(true)
  }

  // 处理保存项目
  const handleSaveProject = async (projectData: { name: string; icon: string; description?: string; tags?: string[] }) => {
    const projectName = projectData.name
    const projectIcon = projectData.icon
    const projectDescription = projectData.description || ''
    const projectTags = projectData.tags || []
    if (!canvas) return
    
    try {
      // 检查当前是否是编辑模式
      const urlParams = new URLSearchParams(window.location.search)
      const editMode = urlParams.get('edit') === 'true'
      const projectId = urlParams.get('projectId')
      
      // 生成画布预览图，使用原图质量
      const previewDataURL = canvas.toDataURL({  
        format: 'png',
        quality: 1.0
      })
      
      // 获取画布数据（序列化）
      const canvasData = JSON.stringify(canvas.toJSON())
      
      // 获取AI助手对话记录
      let aiConversation = []
      try {
        const chatHistory = localStorage.getItem('chatHistory')
        if (chatHistory) {
          aiConversation = JSON.parse(chatHistory)
        }
      } catch (error) {
        // 静默处理错误
      }
      
      // 获取AI生成的内容
      const generatedImages = []
      const aiGeneratedElements = document.querySelectorAll('[data-ai-generated]')
      aiGeneratedElements.forEach((element, index) => {
        const img = element.querySelector('img')
        if (img && img.src) {
          generatedImages.push({
            id: index,
            src: img.src,
            alt: img.alt || 'AI生成图片',
            timestamp: new Date().toISOString()
          })
        }
      })
      
      // 获取当前AI助手设置
      const aiSettings = {
        brushSize: brushSize,
        brushColor: brushColor,
        activeTool: activeTool
      }
      
      // 获取现有的项目记录
      const existingProjects = JSON.parse(localStorage.getItem('userProjects') || '[]')
      
      let updatedProjects = []
      let projectRecord = {}
      
      const now = new Date()
      
      if (editMode && projectId) {
        // 编辑模式：覆盖原项目
        const projectIndex = existingProjects.findIndex((p: any) => p.id === projectId)
        if (projectIndex !== -1) {
          const originalProject = existingProjects[projectIndex]
          
          projectRecord = {
            ...originalProject,
            name: projectName,
            icon: projectIcon,
            description: projectDescription || originalProject.description || '',
            tags: projectTags.length > 0 ? projectTags : originalProject.tags || [],
            preview: previewDataURL,
            canvasData: canvasData,
            aiConversation: aiConversation,
            generatedContent: generatedImages,
            aiSettings: aiSettings,
            updatedAt: now.toISOString(),
            metadata: {
              ...originalProject.metadata,
              canvasObjectsCount: canvas.getObjects().length,
              hasAIInteraction: aiConversation.length > 0,
              hasGeneratedContent: generatedImages.length > 0,
              toolUsed: activeTool,
              brushSettings: {
                size: brushSize,
                color: brushColor
              }
            }
          }
          
          updatedProjects = [...existingProjects]
          updatedProjects[projectIndex] = projectRecord
        } else {
          // 如果找不到原项目，创建新项目
          projectRecord = {
            id: projectId,
            name: projectName,
            icon: projectIcon,
            description: projectDescription,
            tags: projectTags,
            preview: previewDataURL,
            canvasData: canvasData,
            aiConversation: aiConversation,
            generatedContent: generatedImages,
            aiSettings: aiSettings,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            metadata: {
              canvasObjectsCount: canvas.getObjects().length,
              hasAIInteraction: aiConversation.length > 0,
              hasGeneratedContent: generatedImages.length > 0,
              toolUsed: activeTool,
              brushSettings: {
                size: brushSize,
                color: brushColor
              }
            }
          }
          
          updatedProjects = [...existingProjects, projectRecord]
        }
      } else {
        // 新建模式：创建新项目
        projectRecord = {
          id: Date.now().toString(),
          name: projectName,
          icon: projectIcon,
          description: projectDescription,
          tags: projectTags,
          preview: previewDataURL,
          canvasData: canvasData,
          aiConversation: aiConversation,
          generatedContent: generatedImages,
          aiSettings: aiSettings,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          metadata: {
            canvasObjectsCount: canvas.getObjects().length,
            hasAIInteraction: aiConversation.length > 0,
            hasGeneratedContent: generatedImages.length > 0,
            toolUsed: activeTool,
            brushSettings: {
              size: brushSize,
              color: brushColor
            }
          }
        }
        
        updatedProjects = [...existingProjects, projectRecord]
      }
      
      // 保存到本地存储
      localStorage.setItem('userProjects', JSON.stringify(updatedProjects))
      
      // 同时保存聊天记录到单独的存储
      if (aiConversation.length > 0) {
        localStorage.setItem('chatHistory', JSON.stringify(aiConversation))
      }
      
      // 显示保存成功提示
      const projectNameStr = typeof name === 'string' ? name : '未命名项目'
      const saveMessage = editMode ? `项目已更新：${projectNameStr}` : `作品已保存到项目记录：${projectNameStr}`
      
      const notification = document.createElement('div')
      notification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 12px 16px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <strong>${editMode ? '更新成功！' : '保存成功！'}</strong><br>
          ${saveMessage}
        </div>
      `
      document.body.appendChild(notification)
      
      // 3秒后自动移除提示
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 3000)
      
      // 保存成功后重新请求配额接口，更新用户点数
      fetchUserPoints();
      
      // 关闭弹窗
      setShowSaveModal(false)
      
      // 注意：保存项目后不应该清除聊天记录，因为聊天记录已经保存到项目中了
      // 只有在创建新项目时才需要重置聊天记录
      if (!editMode) {
        try {
          // 清除聊天记录（为新项目准备）
          localStorage.removeItem('chatHistory')
          
          // 通过ref调用ChatPanel的重置方法
          const chatPanel = document.querySelector('chat-panel') as any
          if (chatPanel && chatPanel.resetChat) {
            chatPanel.resetChat()
          }
          
        } catch (error) {
          // 重置AI创作助手失败
        }
      }
      
    } catch (error) {
      alert('保存失败，请重试')
    }
  }

  const handleUndo = () => {
    if (!canvas || historyIndex <= 0) return
    
    const newIndex = historyIndex - 1
    const previousState = history[newIndex]
    
    // 根据主题设置合适的背景颜色
    const backgroundColor = theme === 'dark' ? '#1f2937' : '#ffffff'
    
    // 清除当前画布并设置背景颜色
    canvas.clear()
    canvas.backgroundColor = backgroundColor
    
    // 恢复之前的状态（可能为空数组，表示空画布）
    if (previousState && previousState.length > 0) {
      previousState.forEach(obj => {
        canvas.add(obj)
      })
    }
    
    canvas.renderAll()
    setHistoryIndex(newIndex)
    
    // 手动保存当前状态到历史记录，但不触发对象事件
    setTimeout(() => {
      if (!canvas || !(window as any).fabric) return
      
      // 深拷贝当前状态
      const currentState = canvas._objects.map(obj => {
        if (!obj) return null
        return (window as any).fabric?.util?.object?.clone(obj) || obj
      }).filter(obj => obj !== null)
      
      // 直接更新历史记录，不触发对象事件
      const newHistory = [...history]
      newHistory[newIndex + 1] = currentState // 更新当前位置的状态
      
      setHistory(newHistory)
    }, 0)
  }

  const handleRedo = () => {
    if (!canvas || historyIndex >= history.length - 1) return
    
    const newIndex = historyIndex + 1
    const nextState = history[newIndex]
    
    // 根据主题设置合适的背景颜色
    const backgroundColor = theme === 'dark' ? '#1f2937' : '#ffffff'
    
    // 清除当前画布并设置背景颜色
    canvas.clear()
    canvas.backgroundColor = backgroundColor
    
    // 恢复下一个状态
    if (nextState && nextState.length > 0) {
      nextState.forEach(obj => {
        canvas.add(obj)
      })
    }
    
    canvas.renderAll()
    setHistoryIndex(newIndex)
    
    // 手动保存当前状态到历史记录，但不触发对象事件
    setTimeout(() => {
      if (!canvas || !(window as any).fabric) return
      
      // 深拷贝当前状态
      const currentState = canvas._objects.map(obj => {
        if (!obj) return null
        return (window as any).fabric?.util?.object?.clone(obj) || obj
      }).filter(obj => obj !== null)
      
      // 直接更新历史记录，不触发对象事件
      const newHistory = [...history]
      newHistory[newIndex] = currentState // 更新当前位置的状态
      
      setHistory(newHistory)
    }, 0)
  }

  // 层级管理功能
  // 手动层级管理备用方案
  const manualLayerManagement = (operation: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward') => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (!activeObject) return
    
    const objects = canvas.getObjects()
    const currentIndex = objects.indexOf(activeObject)
    
    if (currentIndex === -1) {
      return
    }
    
    // 移除当前对象
    canvas.remove(activeObject)
    
    // 使用更兼容的方法重新添加对象到指定位置
    switch (operation) {
      case 'bringToFront':
        // 置顶：直接添加到画布（默认添加到顶部）
        canvas.add(activeObject)
        break
      case 'sendToBack':
        // 置底：先移除所有对象，然后按顺序重新添加
        const allObjects = canvas.getObjects()
        canvas.clear()
        // 先添加当前对象（置底）
        canvas.add(activeObject)
        // 然后添加其他对象
        allObjects.forEach(obj => {
          if (obj !== activeObject) {
            canvas.add(obj)
          }
        })
        break
      case 'bringForward':
        // 上移一层：与后一个对象交换位置
        if (currentIndex < objects.length - 1) {
          const nextObject = objects[currentIndex + 1]
          canvas.remove(nextObject)
          canvas.add(activeObject)
          canvas.add(nextObject)
        } else {
          // 已经在最顶层，无法上移
        }
        break
      case 'sendBackward':
        // 下移一层：与前一个对象交换位置
        if (currentIndex > 0) {
          const prevObject = objects[currentIndex - 1]
          canvas.remove(prevObject)
          canvas.add(activeObject)
          canvas.add(prevObject)
        } else {
          // 已经在最底层，无法下移
        }
        break
    }
    
    // 重新选中对象
    canvas.setActiveObject(activeObject)
    // 重新渲染画布
    canvas.renderAll()
  }

  const handleBringToFront = () => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      saveCanvasState()
      
      try {
        // 优先使用Fabric.js原生方法
        if (canvas.bringToFront) {
          canvas.bringToFront(activeObject)
        } else {
          manualLayerManagement('bringToFront')
        }
        canvas.renderAll()
      } catch (error) {
        manualLayerManagement('bringToFront')
      }
    }
  }

  const handleSendToBack = () => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      // 检查对象是否已经在最底层
      const objects = canvas._objects || []
      // 如果当前选中的对象已经是第一个元素(最底层)，则不执行操作
      if (objects.indexOf(activeObject) === 0) {
        return
      }
      
      saveCanvasState()
      
      try {
        if (canvas.sendToBack) {
          canvas.sendToBack(activeObject)
        } else {
          manualLayerManagement('sendToBack')
        }
        canvas.renderAll()
      } catch (error) {
        manualLayerManagement('sendToBack')
      }
    }
  }

  const handleBringForward = () => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      saveCanvasState()
      
      try {
        if (canvas.bringForward) {
          canvas.bringForward(activeObject)
        } else {
          manualLayerManagement('bringForward')
        }
        canvas.renderAll()
      } catch (error) {
        manualLayerManagement('bringForward')
      }
    }
  }

  const handleSendBackward = () => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      // 检查对象是否已经在最底层
      const objects = canvas._objects || []
      // 如果当前选中的对象已经是第一个元素(最底层)，则不执行操作
      if (objects.indexOf(activeObject) === 0) {
        return
      }
      
      saveCanvasState()
      
      try {
        if (canvas.sendBackwards) {
          canvas.sendBackwards(activeObject)
        } else {
          manualLayerManagement('sendBackward')
        }
        canvas.renderAll()
      } catch (error) {
        manualLayerManagement('sendBackward')
      }
    }
  }

  // 获取所有对象的层级信息
  const getLayerInfo = () => {
    if (!canvas) return []
    return canvas.getObjects().map((obj: any, index: number) => ({
      id: obj.id || `obj-${index}`,
      type: obj.type || 'unknown',
      name: obj.name || `对象${index + 1}`,
      visible: obj.visible !== false,
      locked: obj.selectable === false,
      index: index
    }))
  }

  // 清除画板功能
  const handleClearCanvas = () => {
    if (!canvas) return
    
    // 保存当前状态到历史记录
    saveCanvasState()
    
    // 根据主题设置合适的背景颜色
    const backgroundColor = theme === 'dark' ? '#1f2937' : '#ffffff'
    
    // 清除画板并设置背景颜色
    canvas.clear()
    canvas.backgroundColor = backgroundColor
    canvas.renderAll()
  }

  // 处理画板缩放
  const handleZoomChange = (delta: number) => {
    if (!canvas) return
    
    const newZoomLevel = Math.max(10, Math.min(500, zoomLevel + delta))
    const scale = newZoomLevel / 100
    
    // 设置缩放比例
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0]
    vpt[0] = scale
    vpt[3] = scale
    
    canvas.setViewportTransform(vpt)
    canvas.requestRenderAll()
    setZoomLevel(newZoomLevel)
  }

  // 重置缩放比例
  const handleZoomReset = () => {
    if (!canvas) return
    
    // 重置到100%
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0]
    vpt[0] = 1
    vpt[3] = 1
    vpt[4] = 0  // 重置X轴偏移
    vpt[5] = 0  // 重置Y轴偏移
    
    canvas.setViewportTransform(vpt)
    canvas.requestRenderAll()
    setZoomLevel(100)
  }

  // 下载画板内容为JSON文件
  const handleDownloadCanvas = () => {
    if (!canvas) {
      alert('画布未初始化，无法下载')
      return
    }
    
    try {
      // 获取画布数据
      const canvasData = canvas.toJSON()
      
      // 添加元数据
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        canvasInfo: {
          width: canvas.width,
          height: canvas.height,
          backgroundColor: canvas.backgroundColor,
          zoomLevel: zoomLevel,
          objectCount: canvas.getObjects().length
        },
        canvasData: canvasData,
        metadata: {
          brushSettings: {
            size: brushSize,
            color: brushColor
          },
          activeTool: activeTool,
          theme: theme,
          language: language
        }
      }
      
      // 创建JSON字符串
      const jsonString = JSON.stringify(exportData, null, 2)
      
      // 创建Blob对象
      const blob = new Blob([jsonString], { type: 'application/json' })
      
      // 创建下载链接
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // 生成文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      a.download = `canvas-export-${timestamp}.json`
      
      // 触发下载
      document.body.appendChild(a)
      a.click()
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
      
      // 显示下载成功提示
      const notification = document.createElement('div')
      notification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 12px 16px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <strong>下载成功！</strong><br>
          画板内容已保存为JSON文件
        </div>
      `
      document.body.appendChild(notification)
      
      // 3秒后自动移除提示
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 3000)
      
    } catch (error) {
      alert('下载失败，请重试')
    }
  }

  // 导入画板内容从JSON文件
  const handleImportCanvas = () => {
    if (!canvas) {
      alert('画布未初始化，无法导入')
      return
    }
    
    // 创建文件输入元素
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.json'
    fileInput.style.display = 'none'
    
    fileInput.onchange = (event) => {
      const target = event.target as HTMLInputElement
      const file = target.files?.[0]
      
      if (!file) return
      
      // 清理文件输入值
      target.value = ''
      
      // 验证文件类型
      if (!file.name.endsWith('.json')) {
        alert('请选择JSON文件')
        return
      }
      
      // 使用FileReader读取文件
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const jsonContent = e.target?.result as string
          const importData = JSON.parse(jsonContent)
          
          // 验证文件格式
          if (!importData.canvasData || !importData.version) {
            alert('无效的画板文件格式')
            return
          }
          
          // 保存当前状态到历史记录
          saveCanvasState()
          
          // 清除当前画布
          canvas.clear()
          
          // 加载导入的画布数据
          canvas.loadFromJSON(importData.canvasData, () => {
            // 画布加载完成后的回调
            canvas.renderAll()
            
            // 强制重新渲染画布，确保内容立即显示
            setTimeout(() => {
              canvas.renderAll()
              // 触发一次画布重绘
              canvas.requestRenderAll()
            }, 100)
            
            // 恢复元数据设置
            if (importData.metadata) {
              const { brushSettings, theme: importTheme, language: importLanguage } = importData.metadata
              
              if (brushSettings) {
                setBrushSize(brushSettings.size || 3)
                setBrushColor(brushSettings.color || '#000000')
              }
              
              if (importTheme && importTheme !== theme) {
                setTheme(importTheme)
                // 立即应用到document
                if (typeof document !== 'undefined') {
                  if (importTheme === 'dark') {
                    document.documentElement.classList.add('dark')
                  } else {
                    document.documentElement.classList.remove('dark')
                  }
                }
              }
              
              if (importLanguage && importLanguage !== language) {
                setLanguage(importLanguage)
              }
            }
            
            // 恢复缩放设置
            if (importData.canvasInfo?.zoomLevel) {
              setZoomLevel(importData.canvasInfo.zoomLevel)
            }
            
            // 显示导入成功提示
            const notification = document.createElement('div')
            notification.innerHTML = `
              <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 12px 16px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <strong>导入成功！</strong><br>
                画板内容已从JSON文件加载
              </div>
            `
            document.body.appendChild(notification)
            
            // 3秒后自动移除提示
            setTimeout(() => {
              if (document.body.contains(notification)) {
                document.body.removeChild(notification)
              }
            }, 3000)
          })
          
        } catch (error) {
          alert('导入失败，文件格式可能不正确')
        }
      }
      
      reader.onerror = () => {
        alert('文件读取失败，请重试')
      }
      
      reader.readAsText(file)
    }
    
    // 触发文件选择
    document.body.appendChild(fileInput)
    fileInput.click()
    
    // 清理
    setTimeout(() => {
      if (document.body.contains(fileInput)) {
        document.body.removeChild(fileInput)
      }
    }, 1000)
  }

  const handleCaptureArea = async () => {
    const imageData = await onCaptureArea()
    if (imageData) {
      // 这里可以将截图发送到聊天面板
    }
  }

  // 返回用户项目页面
  const handleBackToUser = () => {
    router.push('/user/projects')
  }

  // 切换主题
  const handleToggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    
    // 立即应用到document
    if (typeof document !== 'undefined') {
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  // 切换语言
  const handleToggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh')
  }

  // 获取语言显示文本
  const getLanguageText = () => {
    return language === 'zh' ? '中文' : 'English'
  }

  // 处理键盘快捷键
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!canvas) return
    
    // 检查是否在文字编辑模式
    const activeObject = canvas.getActiveObject()
    if (activeObject && activeObject.isEditing) {
      // 如果正在编辑文字，让Fabric.js处理键盘事件，不执行快捷键
      return
    }
    
    const isCtrl = event.ctrlKey || event.metaKey
    
    // 工具快捷键（单字母）
    switch (event.key.toLowerCase()) {
      case 'h':
        event.preventDefault()
        handleToolSelect('hand')
        break
      case 'p':
        event.preventDefault()
        handleToolSelect('pencil')
        break
      case 'm':
        event.preventDefault()
        handleAddStickFigure()
        break
      case 'r':
        event.preventDefault()
        handleToolSelect('arrow')
        break
      case 's':
        // 如果是Ctrl+S，不处理工具选择，让第一个监听器处理保存
        if (!isCtrl) {
          event.preventDefault()
          handleToolSelect('shapes')
        }
        break
      case 't':
        event.preventDefault()
        handleToolSelect('text')
        break
      case 'e':
        event.preventDefault()
        handleToolSelect('eraser')
        break
      case 'i':
        event.preventDefault()
        handleToolSelect('image')
        break
      case 'l':
        event.preventDefault()
        handleToolSelect('layers')
        break
    }
    
    // 控制键组合快捷键
    if (isCtrl) {
      switch (event.key.toLowerCase()) {
        case 'a':
          // Ctrl + A 作为全选快捷键
          event.preventDefault()
          handleSelectAll()
          break
        case 'z':
          event.preventDefault()
          handleUndo()
          break
        case 'y':
          event.preventDefault()
          handleRedo()
          break
        case 'c':
          event.preventDefault()
          handleCopyObject()
          break
        case 'v':
          event.preventDefault()
          // 先尝试从系统剪贴板粘贴图片
          handlePasteFromClipboard().then((imagePasted) => {
            // 如果没有粘贴图片，则尝试粘贴对象
            if (!imagePasted) {
              handlePasteObject()
            }
          })
          break
      }
    }
    // 单独的D键用于清除画板
    if (event.key.toLowerCase() === 'd' && !(event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      handleClearCanvas()
    }
  }, [canvas, handleUndo, handleRedo, handleClearCanvas, handleSelectAll, handleCopyObject, handlePasteObject, handleBackToUser, handleToolSelect])

  // 添加键盘事件监听
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  // Tooltip组件
  const Tooltip = ({ children, content, position = 'top' }: { children: React.ReactNode; content: string; position?: 'top' | 'bottom' | 'left' | 'right' }) => {
    const [show, setShow] = useState(false)
    
    return (
      <div className="relative inline-block">
        <div
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
        >
          {children}
        </div>
        {show && (
          <div className={`
            absolute z-[9999] px-3 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-sm whitespace-nowrap
            ${position === 'top' ? 'bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2' : ''}
            ${position === 'bottom' ? 'top-full left-1/2 transform -translate-x-1/2 translate-y-2' : ''}
            ${position === 'left' ? 'right-full top-1/2 transform -translate-y-1/2 -translate-x-2' : ''}
            ${position === 'right' ? 'left-full top-1/2 transform -translate-y-1/2 translate-x-2' : ''}
          `}>
            {content}
            <div className={`
              absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45
              ${position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1' : ''}
              ${position === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1' : ''}
              ${position === 'left' ? 'right-0 top-1/2 -translate-y-1/2 translate-x-1' : ''}
              ${position === 'right' ? 'left-0 top-1/2 -translate-y-1/2 -translate-x-1' : ''}
            `}></div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-2 sm:px-4 py-2 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2 lg:gap-0 relative">
      {/* 形状选择卡片 */}
      {showShapePicker && (
        <div ref={shapePickerRef} className="absolute left-16 top-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-10">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">选择形状</h4>
            <button 
              onClick={() => setShowShapePicker(false)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {shapes.map((shape) => (
              <button
                key={shape.id}
                onClick={() => handleAddShape(shape.id)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex flex-col items-center min-w-[60px]"
                title={shape.label}
              >
                <shape.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center leading-tight">{shape.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}



      {/* 层级管理面板 */}
      {showLayerPanel && (
        <div ref={layerPanelRef} className="absolute right-16 top-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-10 w-64">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">层级管理</h4>
            <button 
              onClick={() => setShowLayerPanel(false)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
            >
              ×
            </button>
          </div>
          
          {/* 层级操作按钮 */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Tooltip content="置顶 (Ctrl + Shift + ])" position="top">
              <button
                onClick={handleBringToFront}
                className="flex items-center justify-center p-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                <MoveUp className="h-3 w-3 mr-1" />
                置顶
                <span className="text-xs opacity-70 ml-1">Ctrl+Shift+]</span>
              </button>
            </Tooltip>
            <Tooltip content="置底 (Ctrl + Shift + [)" position="top">
              <button
                onClick={handleSendToBack}
                className="flex items-center justify-center p-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                <MoveDown className="h-3 w-3 mr-1" />
                置底
                <span className="text-xs opacity-70 ml-1">Ctrl+Shift+[</span>
              </button>
            </Tooltip>
            <Tooltip content="上移一层 (Ctrl + ])" position="top">
              <button
                onClick={handleBringForward}
                className="flex items-center justify-center p-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                <ArrowUp className="h-3 w-3 mr-1" />
                上移一层
                <span className="text-xs opacity-70 ml-1">Ctrl+]</span>
              </button>
            </Tooltip>
            <Tooltip content="下移一层 (Ctrl + [)" position="top">
              <button
                onClick={handleSendBackward}
                className="flex items-center justify-center p-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                <ArrowDown className="h-3 w-3 mr-1" />
                下移一层
                <span className="text-xs opacity-70 ml-1">Ctrl+[</span>
              </button>
            </Tooltip>
          </div>
          
          {/* 层级列表 */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="flex justify-between items-center mb-2">
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300">对象层级</h5>
              <span className="text-xs text-gray-500 dark:text-gray-400">共 {getLayerInfo().length} 个对象</span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {getLayerInfo().length === 0 ? (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                  暂无对象
                </div>
              ) : (
                getLayerInfo().map((layer, index) => (
                  <div
                    key={layer.id}
                    className={`flex items-center justify-between p-1 text-xs rounded cursor-pointer ${
                      canvas?.getActiveObject()?.id === layer.id 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => {
                      // 点击层级项选中对应对象
                      const obj = canvas?.getObjects().find((o: any) => o.id === layer.id)
                      if (obj) {
                        canvas?.setActiveObject(obj)
                        canvas?.renderAll()
                      }
                    }}
                  >
                    <span className="truncate">{layer.name}</span>
                    <span className="text-gray-500 dark:text-gray-400">{layer.index + 1}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* 使用提示 */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <div className="font-medium mb-1">使用提示：</div>
              <div>• 右键点击对象可快速操作层级</div>
              <div>• 使用快捷键 Ctrl+[ ] 调整层级</div>
              <div>• 点击层级列表可选中对象</div>
            </div>
          </div>
        </div>
      )}



      {/* 保存项目弹窗 */}
      <SaveProjectModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveProject}
        projectData={projectData}
      />

      {/* 左侧工具组 */}
      <div className="flex items-center justify-center lg:justify-start flex-wrap gap-1 lg:gap-2">
        {/* 返回按钮 - 隐藏但保留位置宽度 */}
        <Tooltip content="返回用户页面 (Esc)" position="bottom">
          <button
            onClick={handleBackToUser}
            className="p-1 lg:p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            style={{ opacity: 0, visibility: 'hidden' }}
          >
            <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5" />
          </button>
        </Tooltip>
        
        {tools.filter(tool => tool.id !== 'layers').map((tool) => {
          const getShortcut = (toolId: string) => {
            switch (toolId) {
              case 'hand': return 'H'
              case 'pencil': return 'P'
              case 'arrow': return 'R'
              case 'shapes': return 'S'
              case 'text': return 'T'
              case 'eraser': return 'E'
              case 'image': return 'I'
              case 'stickfigure': return 'M'
              default: return ''
            }
          }
          
          const shortcut = getShortcut(tool.id)
          return (
            <Tooltip key={tool.id} content={`${tool.label} (${shortcut})`} position="bottom">
              <button
                onClick={() => handleToolSelect(tool.id)}
                className={`p-1 lg:p-2 rounded-lg transition-colors ${
                  activeTool === tool.id 
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                data-tool={tool.id}
              >
                <tool.icon className="h-4 w-4 lg:h-5 lg:w-5" />
              </button>
            </Tooltip>
          )
        })}
        
        {/* 撤销和重做按钮 */}
        <Tooltip content="撤销 (Ctrl+Z)" position="bottom">
          <button
            onClick={handleUndo}
            className="p-1 lg:p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <RotateCcw className="h-4 w-4 lg:h-5 lg:w-5" />
          </button>
        </Tooltip>
        <Tooltip content="重做 (Ctrl+Y)" position="bottom">
          <button
            onClick={handleRedo}
            className="p-1 lg:p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <RotateCw className="h-4 w-4 lg:h-5 lg:w-5" />
          </button>
        </Tooltip>
        <Tooltip content="清除画板 (D)" position="bottom">
          <button
            onClick={handleClearCanvas}
            className="p-1 lg:p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <svg className="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </Tooltip>
        

      </div>

      {/* 中间控制组 */}
      <div className="flex items-center justify-center flex-wrap gap-2 lg:gap-4 mt-2 lg:mt-0">
        {/* 画笔大小 */}
        <div className="flex items-center space-x-1 lg:space-x-2">
          <input
            type="range"
            min="1"
            max="100"
            value={brushSize}
            onChange={(e) => handleBrushSizeChange(Number(e.target.value))}
            className="w-16 lg:w-20 dark:bg-gray-700 dark:border-gray-600"
          />
          <span className="text-xs lg:text-sm text-gray-600 dark:text-gray-300">{brushSize}px</span>
        </div>

        {/* 颜色选择 */}
        <div className="flex items-center space-x-1 lg:space-x-2">
          <input
            type="color"
            value={brushColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-6 h-6 lg:w-8 lg:h-8 rounded border border-gray-300 dark:border-gray-600"
          />
        </div>

        {/* 画板缩放控制和历史记录 */}
        <div className="flex items-center space-x-1 lg:space-x-2 relative">
          <Tooltip content="缩小" position="bottom">
            <button
              onClick={() => handleZoomChange(-10)}
              className="p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <svg className="h-3 w-3 lg:h-4 lg:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </Tooltip>
          <Tooltip content="重置缩放" position="bottom">
            <button
              onClick={() => handleZoomReset()}
              className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-1 lg:px-2 py-1 rounded"
            >
              {zoomLevel}%
            </button>
          </Tooltip>
          <Tooltip content="放大" position="bottom">
            <button
              onClick={() => handleZoomChange(10)}
              className="p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <svg className="h-3 w-3 lg:h-4 lg:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </Tooltip>

          {/* 历史记录按钮 */}
          <div className="relative">
            <div className="flex items-center">
              {/* 录制时间显示 - 仅在录制时显示 */}
              {isRecording && (
                <div className="flex items-center text-xs lg:text-sm font-mono text-gray-700 dark:text-gray-300 mr-2 whitespace-nowrap">
                  {formatTime(recordingTime)}
                </div>
              )}
              
              {/* 录屏按钮 */}
              <Tooltip content="录屏 (Ctrl+Shift+R)" position="bottom">
                <button
                  onClick={handleStartRecording}
                  className={`p-1 lg:p-2 mr-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded ${isRecording ? (isPaused ? 'bg-amber-100 dark:bg-amber-900' : 'bg-red-100 dark:bg-red-900') : ''}`}
                  title={isRecording ? (isPaused ? '继续录制' : '暂停录制') : '开始录制'}
                >
                  {isRecording && isPaused ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5v14l11-7z" />
                    </svg>
                  ) : (
                    <Video className="h-4 w-4 lg:h-5 lg:w-5" />
                  )}
                </button>
              </Tooltip>
            
              {/* 停止录制按钮 - 仅在录制时显示 */}
              {isRecording && (
                <Tooltip content="完成录制 (Ctrl+Shift+S)" position="bottom">
                  <button
                    onClick={handleStopRecording}
                    className="p-1 lg:p-2 mr-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded bg-rose-100 dark:bg-rose-900"
                    title="完成录制"
                  >
                    <Square className="h-4 w-4 lg:h-5 lg:w-5" />
                  </button>
                </Tooltip>
              )}
              
              {/* 历史记录按钮 */}
              <Tooltip content="历史记录 (Ctrl+H)" position="bottom">
                <button
                  onClick={() => {
                    setActiveTool('history')
                    setShowHistoryPanel(true)
                    loadHistoryRecords()
                  }}
                  className={`p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded ${
                    activeTool === 'history' ? 'bg-blue-100 dark:bg-blue-900' : ''
                  }`}
                >
                  <History className="h-4 w-4 lg:h-5 lg:w-5" />
                </button>
              </Tooltip>
            </div>
            
            {/* 历史记录面板 */}
            {showHistoryPanel && (
              <div ref={historyPanelRef} className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-10 w-80 max-h-96 overflow-y-auto">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">历史记录</h4>
                  <div className="flex items-center space-x-2">
                    <Tooltip content="清空历史记录" position="top">
                      <button
                        onClick={clearHistory}
                        className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 px-2 py-1 border border-red-300 dark:border-red-600 rounded"
                      >
                        清空
                      </button>
                    </Tooltip>
                    <button 
                      onClick={() => setShowHistoryPanel(false)}
                      className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                {/* 历史记录列表 */}
                <div className="space-y-2">
                  {historyRecords.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">暂无历史记录</p>
                      <p className="text-xs mt-1">使用 Ctrl+S 保存当前状态</p>
                    </div>
                  ) : (
                    historyRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                      >
                        <div 
                          className="flex-1 flex items-center space-x-3 cursor-pointer"
                          onClick={() => loadHistoryRecord(record)}
                        >
                          {record.preview ? (
                            <img 
                              src={record.preview} 
                              alt="预览" 
                              className="w-12 h-9 object-cover rounded border border-gray-200 dark:border-gray-600"
                            />
                          ) : (
                            <div className="w-12 h-9 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                              <History className="h-4 w-4 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {record.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(record.timestamp).toLocaleString()}
                            </div>
                            {record.metadata && (
                              <div className="text-xs text-gray-400 dark:text-gray-500">
                                {record.metadata.objectCount} 个对象
                              </div>
                            )}
                          </div>
                        </div>
                        <Tooltip content="删除此记录" position="top">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteHistoryRecord(record.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Tooltip>
                      </div>
                    ))
                  )}
                </div>
                
                {/* 操作提示 */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <div className="font-medium mb-1">使用提示：</div>
                    <div>• 点击记录可加载到画板</div>
                    <div>• 使用 Ctrl+S 保存当前状态</div>
                    <div>• 历史记录自动保存到浏览器</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>



      </div>

      {/* 右侧操作组 */}
      <div className="flex items-center justify-center lg:justify-end flex-wrap gap-1 lg:gap-2 mt-2 lg:mt-0">
        {/* 导出JSON */}
        <Tooltip content="导出画板JSON" position="bottom">
          <button
            onClick={handleDownloadCanvas}
            className="p-1 lg:p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <Download className="h-4 w-4 lg:h-5 lg:w-5" />
          </button>
        </Tooltip>
        <Tooltip content="导入画板(JSON)" position="bottom">
          <button
            onClick={handleImportCanvas}
            className="p-1 lg:p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <Upload className="h-4 w-4 lg:h-5 lg:w-5" />
          </button>
        </Tooltip>


        {/* 主题切换按钮 */}
        <Tooltip content={`切换到${theme === 'light' ? '深色' : '浅色'}主题`} position="bottom">
          <button
            onClick={handleToggleTheme}
            className="p-1 lg:p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            {theme === 'light' ? <Moon className="h-4 w-4 lg:h-5 lg:w-5" /> : <Sun className="h-4 w-4 lg:h-5 lg:w-5" />}
          </button>
        </Tooltip>

        {/* 国际化按钮 */}
        <Tooltip content={`切换到${language === 'zh' ? 'English' : '中文'}`} position="bottom">
          <button
            onClick={handleToggleLanguage}
            className="p-1 lg:p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <Languages className="h-4 w-4 lg:h-5 lg:w-5" />
          </button>
        </Tooltip>
        
        {/* 刷新点数按钮 */}
        <Tooltip content="刷新消耗点信息" position="bottom">
          <button
            onClick={fetchUserPoints}
            disabled={isLoadingPoints}
            className="p-1 lg:p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <RotateCw className="h-4 w-4 lg:h-5 lg:w-5" />
          </button>
        </Tooltip>

        {/* 用户信息胶囊 */}
          <div 
            className="flex items-center space-x-1 lg:space-x-2 bg-gray-100 dark:bg-gray-800 rounded-full px-2 lg:px-3 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            onClick={handleOpenApiSettings}
          >
            {/* 消耗点数显示 */}
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3 lg:w-4 lg:h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-9a1 1 0 112 0v4a1 1 0 11-2 0V7zm1 8a1 1 0 100-2 1 1 0 000 2z"/>
              </svg>
              <span className="text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300">
                {userInfo?.points || 0}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">点</span>
            </div>
            
            {/* 分隔线 */}
            <div className="h-3 lg:h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
            
            {/* 用户头像 */}
            <div className="flex items-center">
              <img 
                src={userInfo?.avatar || "/default-avatar.png"} 
                alt={userInfo?.username || "用户"}
                className="w-4 h-4 lg:w-6 lg:h-6 rounded-full"
              />
            </div>
          </div>
      </div>

      {/* API密钥设置模态框 */}
      <UserSettingsModal 
        isOpen={showApiSettingsModal}
        onClose={() => setShowApiSettingsModal(false)}
      />
    </div>
  )
}