'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Upload,
  RotateCcw,
  Redo,
  ZoomIn,
  ZoomOut,
  Square,
  PenTool,
  Type,
  Brush,
  Layers,
  Trash2,
  History,
  Sparkles,
  X,
  Sun,
  Moon,
  ArrowLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// 添加全局类型声明
declare global {
  interface Window {
    fabric: any
  }
}
import { useUserStore } from '@/stores/userStore'
import Script from 'next/script'

import AdCreationCanvas from './AdCreationCanvas'
import LayerPanel from './LayerPanel'
import HistoryPanel from './HistoryPanel'

export default function AdCreationPage() {
  const router = useRouter()
  const [canvas, setCanvas] = useState<any>(null)
  const [canvasInitialized, setCanvasInitialized] = useState(false)
  const [fabricLoaded, setFabricLoaded] = useState(false)
  const [activeTool, setActiveTool] = useState<string>('select')
  const [isLayerPanelCollapsed, setIsLayerPanelCollapsed] = useState(false)
  const [isHistoryPanelCollapsed, setIsHistoryPanelCollapsed] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(100)
  // 初始画布尺寸设置为更大的值，避免频繁更新
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 })
  
  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false)
  // 提示词输入
  const [promptText, setPromptText] = useState('')
  // 输入框聚焦状态
  const [isInputFocused, setIsInputFocused] = useState(false)
  // 输入框展开状态（用于延迟显示内容）
  const [isInputExpanded, setIsInputExpanded] = useState(false)
  // 快捷键帮助面板显示状态
  const [isHelpPanelVisible, setIsHelpPanelVisible] = useState(false)
  
  // 获取用户状态和主题设置
  const { theme, setTheme, userInfo } = useUserStore()
  
  // 返回首页
  const handleBackToHome = () => {
    router.push('/')
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
  
  // 处理输入框外部点击事件
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 查找输入框容器元素
      const inputContainer = event.target as Element
      const isInsideInput = inputContainer.closest('[data-input-container]')
      
      if (!isInsideInput && isInputFocused && !isGenerating) {
        // 先隐藏内容，再缩小
        setIsInputExpanded(false)
        setTimeout(() => {
          setIsInputFocused(false)
        }, 150)
      }
    }

    // 添加事件监听器
    document.addEventListener('mousedown', handleClickOutside)
    
    // 清理函数
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isInputFocused, isInputExpanded, isGenerating])

  // 删除选中的对象
  const handleDeleteSelected = useCallback(() => {
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  }, [canvas]);

  // 工具切换函数
  const handleToolSwitch = (toolId: string) => {
    setActiveTool(toolId);
  };

  // 键盘事件处理函数定义（将在所有函数定义后使用）
  const setupKeyboardShortcuts = () => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 检查焦点是否在输入框或文本区域
      const isInputFocused = (e.target as HTMLElement)?.tagName === 'INPUT' || 
                          (e.target as HTMLElement)?.tagName === 'TEXTAREA';
      
      // 如果焦点在输入框中，只处理输入框相关的快捷键
      if (isInputFocused) {
        // 在输入框中只处理Tab键切换到下一个工具
        if (e.key === 'Tab' && !e.shiftKey) {
          e.preventDefault();
          const tools = ['select', 'brush', 'mask-brush', 'text'];
          const currentIndex = tools.indexOf(activeTool);
          const nextIndex = (currentIndex + 1) % tools.length;
          handleToolSwitch(tools[nextIndex]);
        }
        return;
      }
      
      // 处理画布相关的快捷键
      switch(e.key) {
        // 删除选中的对象
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          handleDeleteSelected();
          break;
          
        // 撤销
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleUndo();
          }
          break;
          
        // 重做
        case 'y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleRedo();
          }
          break;
          
        // 放大
        case '=':
        case '+':
          e.preventDefault();
          handleZoomIn();
          break;
          
        // 缩小
        case '-':
        case '_':
          e.preventDefault();
          handleZoomOut();
          break;
          
        // 重置缩放
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomReset();
          }
          break;
          
        // 下载
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleDownload();
          }
          break;
          
        // 上传图片
        case 'u':
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            handleImageUpload();
          }
          break;
          
        // 生成
        case 'g':
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            handleGenerate();
          }
          break;
          
        // 重置画布
        case 'r':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleResetCanvas();
          }
          break;
          
        // 切换工具
        case 'v':
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            handleToolSwitch('select');
          }
          break;
          
        case 'b':
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            handleToolSwitch('brush');
          }
          break;
          
        case 'm':
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            handleToolSwitch('mask-brush');
          }
          break;
          
        case 't':
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            handleToolSwitch('text');
          }
          break;
          
        // 切换面板
        case 'l':
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            setIsLayerPanelCollapsed(!isLayerPanelCollapsed);
          }
          break;
          
        case 'h':
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            setIsHistoryPanelCollapsed(!isHistoryPanelCollapsed);
          }
          break;
          
        // 显示/隐藏快捷键帮助
        case '?':
          if (e.shiftKey) {
            e.preventDefault();
            setIsHelpPanelVisible(!isHelpPanelVisible);
          }
          break;
          
        // 返回首页
        case 'Escape':
          if (!isInputFocused && !isInputExpanded && !isHelpPanelVisible && e.ctrlKey) {
            e.preventDefault();
            handleBackToHome();
          }
          break;
          
        // 清空输入
        case 'Escape':
          if (isInputFocused || isInputExpanded) {
            e.preventDefault();
            setIsInputExpanded(false);
            setTimeout(() => {
              setIsInputFocused(false);
            }, 150);
          } else if (isHelpPanelVisible) {
            e.preventDefault();
            setIsHelpPanelVisible(false);
          }
          break;
      }
    };

    // 添加键盘事件监听器
    document.addEventListener('keydown', handleKeyDown);
    
    // 返回清理函数
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  };

  // 初始化主题
  useEffect(() => {
    // 确保页面加载时应用当前主题
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [theme])

  // 初始化画布尺寸
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = document.getElementById('canvas-container')
      if (container) {
        const { clientWidth, clientHeight } = container
        // 增大画板尺寸，使其占用更多可用空间
        const newWidth = Math.min(1400, clientWidth - 20)
        const newHeight = Math.min(900, clientHeight - 20)
        
        // 只有当尺寸真正改变时才更新状态
        setCanvasSize(prevSize => {
          if (prevSize.width !== newWidth || prevSize.height !== newHeight) {
            return { width: newWidth, height: newHeight }
          }
          return prevSize
        })
      }
    }
    
    // 延迟执行一次，确保DOM已经渲染
    const timer = setTimeout(updateCanvasSize, 100)
    window.addEventListener('resize', updateCanvasSize)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateCanvasSize)
    }
  }, [])
  
  // 使用useCallback稳定onCanvasReady回调函数
  const handleCanvasReady = useCallback((c: any) => {
    console.log('Canvas ready:', c);
    setCanvas(c);
    setCanvasInitialized(true);
    
    // 确保撤销/重做功能正确初始化
    if (c && typeof c.undo === 'function' && typeof c.redo === 'function') {
      console.log('Undo/Redo functions are available on canvas');
    } else {
      console.error('Undo/Redo functions are not available on canvas');
    }
  }, []);
  
  // 检查fabric是否已加载
  useEffect(() => {
    if (window.fabric) {
      setFabricLoaded(true)
    }
  }, [])
  
  // 工具列表
  const tools = [
    { id: 'select', icon: Square, label: '选择' },
    { id: 'brush', icon: PenTool, label: '画笔' },
    { id: 'mask-brush', icon: Brush, label: '遮罩画笔' },
    { id: 'text', icon: Type, label: '文字' },
  ]
  
  // 缩放控制
  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 10, 200)
    setZoomLevel(newZoom)
    if (canvas) {
      const scale = newZoom / 100
      canvas.setZoom(scale)
      canvas.renderAll()
    }
  }
  
  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 10, 50)
    setZoomLevel(newZoom)
    if (canvas) {
      const scale = newZoom / 100
      canvas.setZoom(scale)
      canvas.renderAll()
    }
  }
  
  const handleZoomReset = () => {
    setZoomLevel(100)
    if (canvas) {
      canvas.setZoom(1)
      canvas.renderAll()
    }
  }
  
  // 下载功能
  const handleDownload = async () => {
    if (!canvas) return;
    
    try {
      // 获取当前画布中的选中对象
      const activeObject = canvas.getActiveObject();
      
      // 准备下载的数据
      let dataUrl = '';
      let fileName = '';
      
      // 检查Fabric是否已加载
      if (typeof window !== 'undefined' && (window as any).fabric) {
        const fabric = (window as any).fabric;
        
        if (activeObject && activeObject.type === 'image') {
          // 如果有选中的图片，需要获取图片及其上面的所有涂鸦
          const { left, top, width, height, scaleX, scaleY } = activeObject;
          const actualWidth = width * scaleX;
          const actualHeight = height * scaleY;
          
          // 创建临时画布，只包含选中图片及其上的涂鸦
          const tempCanvas = new fabric.Canvas(null, {
            width: actualWidth * 2, // 提高分辨率
            height: actualHeight * 2,
          });
          
          // 获取画布中所有的对象
          const allObjects = canvas.getObjects();
          
          // 找出选中图片及其上面的涂鸦
          const objectsToInclude = [];
          
          for (const obj of allObjects) {
            // 检查对象是否在选中图片的范围内或与之重叠
            const objLeft = obj.left || 0;
            const objTop = obj.top || 0;
            const objRight = objLeft + (obj.width * (obj.scaleX || 1));
            const objBottom = objTop + (obj.height * (obj.scaleY || 1));
            
            // 检查对象是否与选中图片重叠
            const activeRight = left + actualWidth;
            const activeBottom = top + actualHeight;
            
            // 如果是选中的图片本身，或者与选中图片有重叠，则包含它
            if (obj === activeObject || (
              objRight > left && objLeft < activeRight &&
              objBottom > top && objTop < activeBottom
            )) {
              objectsToInclude.push(obj);
            }
          }
          
          // 按照对象的层级顺序克隆到临时画布
          for (const obj of objectsToInclude) {
            await new Promise((resolve) => {
              obj.clone((clonedObj: any) => {
                if (clonedObj) {
                  // 调整克隆对象的位置和尺寸
                  const adjustedLeft = (obj.left - left) * 2; // 调整到临时画布位置并提高分辨率
                  const adjustedTop = (obj.top - top) * 2;
                  const adjustedScaleX = obj.scaleX * 2;
                  const adjustedScaleY = obj.scaleY * 2;
                  
                  clonedObj.set({
                    left: adjustedLeft,
                    top: adjustedTop,
                    scaleX: adjustedScaleX,
                    scaleY: adjustedScaleY,
                  });
                  
                  tempCanvas.add(clonedObj);
                }
                resolve(null);
              });
            });
          }
          
          tempCanvas.renderAll();
          
          // 导出为高分辨率图片
          dataUrl = tempCanvas.toDataURL({
            format: 'png',
            quality: 1,
          });
          fileName = 'selected-image-with-doodles.png';
        } else {
          // 如果没有选中图片，下载整个画布
          dataUrl = canvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 2, // 提高分辨率
          });
          fileName = 'canvas.png';
        }
      } else {
        // 如果Fabric未加载，使用普通canvas API
        dataUrl = canvas.toDataURL('image/png');
        fileName = activeObject ? 'selected-image-with-doodles.png' : 'canvas.png';
      }
      
      // 创建下载链接
      if (dataUrl) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请重试');
    }
  }
  
  // 上传图片
  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && canvas) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const imgUrl = e.target?.result as string
          // 确保fabric已加载
          if (!window.fabric) {
            console.error('Fabric.js not loaded')
            return
          }
          
          if (window.fabric.Image) {
            window.fabric.Image.fromURL(imgUrl, (img: any) => {
              if (!img) return
              // 调整图片大小以适应画布
              const scale = Math.min(
                canvas.width / img.width,
                canvas.height / img.height,
                1
              )
              img.scale(scale)
              canvas.add(img)
              canvas.centerObject(img)
              canvas.setActiveObject(img)
              canvas.renderAll()
            })
          }
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }
  
  // 重置画板
  const handleResetCanvas = () => {
    if (canvas) {
      // 清除画布
      canvas.clear()
      canvas.backgroundColor = 'white'
      canvas.renderAll()
      setZoomLevel(100)
      canvas.setZoom(1)
      
      // 重置历史记录
      canvas.historyData = []
      canvas.historyIndex = -1
      
      // 保存重置后的初始状态
      if (canvas.saveState) {
        canvas.saveState()
      }
    }
  }
  
  const handleUndo = () => {
    if (canvas) {
      try {
        console.log('Undo called from page')
        
        // 直接在页面中实现撤销逻辑
        if (!canvas.historyData || canvas.historyData.length === 0 || canvas.historyIndex <= 0) {
          console.log('Cannot undo: no history to undo')
          return
        }
        
        canvas.isUndoing = true
        canvas.historyIndex--
        
        console.log('Undoing to index:', canvas.historyIndex)
        
        canvas.loadFromJSON(canvas.historyData[canvas.historyIndex], () => {
          canvas.renderAll()
          canvas.isUndoing = false
          console.log('Undo completed, new historyIndex:', canvas.historyIndex)
        })
      } catch (error) {
        console.error('Error during undo:', error)
        canvas.isUndoing = false
      }
    }
  }
  
  const handleRedo = () => {
    if (canvas) {
      try {
        console.log('Redo called from page')
        
        // 直接在页面中实现重做逻辑
        if (!canvas.historyData || canvas.historyData.length === 0) {
          console.log('Cannot redo: no history data')
          return
        }
        
        if (canvas.historyIndex >= canvas.historyData.length - 1) {
          console.log('Cannot redo: already at the latest state')
          return
        }
        
        canvas.isUndoing = true
        canvas.historyIndex++
        
        console.log('Redoing to index:', canvas.historyIndex)
        
        canvas.loadFromJSON(canvas.historyData[canvas.historyIndex], () => {
          canvas.renderAll()
          canvas.isUndoing = false
          console.log('Redo completed, new historyIndex:', canvas.historyIndex)
        })
      } catch (error) {
        console.error('Error during redo:', error)
        canvas.isUndoing = false
      }
    }
  }
  
  // 立即生成
  const handleGenerate = async () => {
    if (!promptText.trim()) {
      alert('请输入提示词')
      return
    }
    
    // 保持输入框放大状态，不收缩
    // setIsInputExpanded(false)
    // setTimeout(() => {
    //   setIsInputFocused(false)
    // }, 150)
    
    setIsGenerating(true)
    try {
      // 获取当前画布中的选中对象
      const activeObject = canvas ? canvas.getActiveObject() : null;
      
      // 准备截图数据
      let imageDataUrl = '';
      
      // 检查Fabric是否已加载
      if (typeof window !== 'undefined' && (window as any).fabric) {
        const fabric = (window as any).fabric;
        
        if (activeObject && activeObject.type === 'image') {
          // 如果有选中的图片，截取选中图片的范围
          const { width, height } = activeObject;
          
          // 获取选中图片的数据URL
          if (activeObject.getElement && typeof activeObject.getElement === 'function') {
            // 如果是图片对象，尝试获取其原始元素
            const imgElement = activeObject.getElement();
            if (imgElement && imgElement.src) {
              imageDataUrl = imgElement.src;
            }
          }
          
          // 如果无法直接获取图片源，则对选中对象区域进行截图
          if (!imageDataUrl) {
            // 创建临时画布，只包含选中对象
            const tempCanvas = new fabric.Canvas(null, {
              width: width * 2, // 提高分辨率
              height: height * 2,
            });
            
            // 克隆选中对象到临时画布
            await new Promise((resolve) => {
              activeObject.clone((cloned: any) => {
                if (cloned) {
                  // 调整克隆对象的位置和尺寸
                  cloned.set({
                    left: 0,
                    top: 0,
                    scaleX: 2,
                    scaleY: 2,
                  });
                  
                  tempCanvas.add(cloned);
                  tempCanvas.renderAll();
                  imageDataUrl = tempCanvas.toDataURL({
                    format: 'png',
                    quality: 1,
                  });
                }
                resolve(null);
              });
            });
          }
        } else {
          // 如果没有选中图片，截取整个画布
          imageDataUrl = canvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 2, // 提高分辨率
          });
        }
      } else {
        // 如果Fabric未加载，使用普通canvas API
        if (canvas) {
          imageDataUrl = canvas.toDataURL('image/png');
        }
      }
      
      // 这里可以添加实际的生成逻辑
      console.log('生成提示词:', promptText)
      console.log('选中对象类型:', activeObject ? activeObject.type : '无')
      console.log('截图数据:', imageDataUrl ? '已获取' : '未获取')
      
      // TODO: 根据提示词和截图数据生成内容并更新画布
      
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error('生成失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }
  

  
  
  
  // 设置键盘快捷键
  useEffect(() => {
    return setupKeyboardShortcuts();
  }, [
    handleDeleteSelected, 
    handleUndo, 
    handleRedo, 
    handleZoomIn, 
    handleZoomOut, 
    handleZoomReset, 
    handleDownload, 
    handleImageUpload, 
    handleGenerate, 
    handleResetCanvas,
    activeTool,
    isLayerPanelCollapsed,
    isHistoryPanelCollapsed,
    isInputFocused,
    isInputExpanded,
    isHelpPanelVisible,
    handleToolSwitch
  ]);
  
  return (
    <>
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js"
        strategy="beforeInteractive"
        onLoad={() => {
          setFabricLoaded(true)
        }}
      />
      
      <div className={`flex flex-col h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'} overflow-hidden`}>
        {/* 顶部导航栏 */}
        <header className={`flex items-center justify-between px-6 py-3 ${theme === 'dark' ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-xl border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-4">
            {/* 返回首页按钮 */}
            <button
              onClick={handleBackToHome}
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
              title="返回首页"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">返回</span>
            </button>
            
            <h1 className="text-xl font-bold">广告创作工作台</h1>
          </div>
          <div className="flex items-center gap-4"> 
            {/* 快捷键帮助按钮 */}
            <button
              onClick={() => setIsHelpPanelVisible(!isHelpPanelVisible)}
              className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
              title="快捷键帮助 (Shift+?)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="17" r="1" fill="currentColor"/>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
             {/* 主题切换按钮 */}
            <button
              onClick={handleToggleTheme}
              className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
              title={`切换到${theme === 'light' ? '深色' : '浅色'}主题`}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            {/* 用户胶囊 */}
            <div 
              className={`flex items-center space-x-2 ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} rounded-full px-3 py-1 transition-colors cursor-pointer`}
            >
              {/* 积分显示 */}
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-9a1 1 0 112 0v4a1 1 0 11-2 0V7zm1 8a1 1 0 100-2 1 1 0 000 2z"/>
                </svg>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {userInfo?.points || 0}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  点
                </span>
              </div>
              
              {/* 分隔线 */}
              <div className={`h-4 w-px ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
              
              {/* 用户头像 */}
              <img 
                src={userInfo?.avatar || "/default-avatar.svg"} 
                alt={userInfo?.username || "用户"}
                className="w-6 h-6 rounded-full"
              />
            </div>
          </div>
        </header>
        
        {/* 主体区域 */}
        <main className="flex flex-1 overflow-hidden">
          {/* 左侧图层面板 */}
          <aside className={`${isLayerPanelCollapsed ? 'w-12' : 'w-64'} ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} transition-all border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="h-full flex flex-col">
              <div className={`flex items-center justify-between p-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} border-b ${isLayerPanelCollapsed ? 'border-r' : ''}`}>
                {!isLayerPanelCollapsed && <h2 className="font-semibold flex items-center gap-2">
                  <Layers size={18} className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} />
                  <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>图层管理</span>
                </h2>}
                <button
                  onClick={() => setIsLayerPanelCollapsed(!isLayerPanelCollapsed)}
                  className={`p-1 rounded transition-colors ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  {isLayerPanelCollapsed ? <Layers size={18} /> : <X size={18} />}
                </button>
              </div>
              
              {!isLayerPanelCollapsed && canvasInitialized && (
                <div className="flex-1 overflow-y-auto p-2">
                  <LayerPanel canvas={canvas} />
                </div>
              )}
            </div>
          </aside>
          
          {/* 中间画布区域 */}
          <div className={`flex-1 flex flex-col overflow-hidden relative ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* 画布上方的工具栏 - 只在canvas初始化后显示 */}
            {canvasInitialized && (
              <div className={`flex items-center justify-center gap-2 p-3 ${theme === 'dark' ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-xl border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                {/* 上传图片 */}
                <button
                  onClick={handleImageUpload}
                  className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  title="上传图片 (U)"
                >
                  <Upload size={18} />
                </button>
                
                {/* 分隔线 */}
                <div className={`h-6 w-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`} />
                
                {/* 工具按钮 */}
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      activeTool === tool.id 
                        ? 'bg-blue-500 text-white' 
                        : theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title={`${tool.label} (${tool.id === 'select' ? 'V' : tool.id === 'brush' ? 'B' : tool.id === 'mask-brush' ? 'M' : 'T'})`}
                  >
                    <tool.icon size={18} />
                  </button>
                ))}
                
                {/* 分隔线 */}
                <div className={`h-6 w-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`} />
                
                {/* 撤销/重做/重置 */}
                <button
                  onClick={handleUndo}
                  className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  title="撤销 (Ctrl+Z)"
                >
                  <RotateCcw size={18} />
                </button>
                
                <button
                  onClick={handleRedo}
                  className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  title="重做 (Ctrl+Y)"
                >
                  <Redo size={18} />
                </button>
                
                <button
                  onClick={handleResetCanvas}
                  className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  title="重置画板 (Ctrl+R)"
                >
                  <Trash2 size={18} />
                </button>
                
                {/* 分隔线 */}
                <div className={`h-6 w-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`} />
                
                {/* 缩放控制 */}
                <button
                  onClick={handleZoomOut}
                  className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  title="缩小"
                >
                  <ZoomOut size={18} />
                </button>
                
                <span className={`min-w-[3rem] text-center text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {zoomLevel}%
                </span>
                
                <button
                  onClick={handleZoomIn}
                  className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  title="放大"
                >
                  <ZoomIn size={18} />
                </button>
                
                <button
                  onClick={handleZoomReset}
                  className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  title="重置缩放"
                >
                  <RotateCcw size={18} />
                </button>
                
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center w-10 h-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                  title="下载 (Ctrl+S)"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
            
            <div 
              id="canvas-container"
              className="flex-1 flex items-start justify-center p-12 px-2 pb-8 overflow-hidden"
            >
              {fabricLoaded ? (
                <div className={`relative ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-lg`}>
                  <AdCreationCanvas
                    width={canvasSize.width}
                    height={canvasSize.height}
                    onCanvasReady={handleCanvasReady}
                    activeTool={activeTool}
                  />
                </div>
              ) : (
                <div className={`flex flex-col items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} rounded-lg p-8 shadow-lg`}>
                  <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className={`mt-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} text-sm`}>Loading Fabric.js...</p>
                </div>
              )}
              

            </div>
            
            {/* 快捷键帮助面板 */}
            {isHelpPanelVisible && (
              <div 
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setIsHelpPanelVisible(false);
                  }
                }}
              >
                <div 
                  className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl border`}
                >
                  <div className="flex justify-between items-center mb-5">
                    <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>快捷键</h2>
                    <button
                      onClick={() => setIsHelpPanelVisible(false)}
                      className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} bg-transparent border-none cursor-pointer`}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'V', desc: '选择工具' },
                      { key: 'B', desc: '画笔工具' },
                      { key: 'M', desc: '遮罩画笔' },
                      { key: 'T', desc: '文字工具' },
                      { key: 'Delete', desc: '删除选中对象' },
                      { key: 'Ctrl+Z', desc: '撤销' },
                      { key: 'Ctrl+Y', desc: '重做' },
                      { key: 'Ctrl+R', desc: '重置画板' },
                      { key: '+/-', desc: '放大/缩小' },
                      { key: 'Ctrl+0', desc: '重置缩放' },
                      { key: 'Ctrl+S', desc: '下载' },
                      { key: 'U', desc: '上传图片' },
                      { key: 'G', desc: '生成' },
                      { key: 'L', desc: '切换图层面板' },
                      { key: 'H', desc: '切换历史面板' },
                      { key: 'Shift+?', desc: '显示/隐藏帮助' },
                      { key: 'Ctrl+ESC', desc: '返回首页' },
                      { key: 'ESC', desc: '关闭面板/输入框' },
                    ].map(({key, desc}, index) => (
                      <div key={index} className={`flex justify-between py-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{desc}</span>
                        <span className={`
                          text-sm font-mono font-semibold px-2 py-0.5 rounded
                          ${theme === 'dark' 
                            ? 'text-blue-400 bg-blue-900/20' 
                            : 'text-blue-600 bg-blue-50'
                          }
                        `}>{key}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* 底部悬浮输入框 - 只在canvas初始化后显示 */}
            {canvasInitialized && (
              <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-4/5 min-w-[480px] max-w-[720px] z-50">
                <div className="relative">
                  {/* 输入框主体 */}
                  <div 
                    data-input-container="true"
                    className={`${theme === 'dark' ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-200'} backdrop-blur-xl rounded-2xl shadow-lg border transition-all duration-300 ${
                      isInputFocused ? 'h-[170px] p-5 shadow-xl' : 'h-[46px] px-5'
                    } ${
                      promptText && !isGenerating ? 'shadow-lg' : ''
                    } ${
                      isGenerating ? 'shadow-md' : ''
                    }`}>
                    {/* 顶部工具栏（展开时显示） */}
                    {isInputExpanded && (
                      <div className="flex justify-between mb-3 items-center">
                        <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          描述您的广告创意
                        </div>
                        <div className="flex gap-2">
                          <button
                            className={`${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} border-none rounded-lg px-3 py-1.5 text-xs cursor-pointer transition-colors`}
                            onClick={() => setPromptText('')}
                          >
                            清空
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className={`flex ${
                      isInputFocused ? 'items-start flex-1' : 'items-center h-full'
                    }`}>
                      {/* 输入区域 */}
                      {isInputExpanded ? (
                        <textarea
                          value={promptText}
                          onChange={(e) => setPromptText(e.target.value)}
                          placeholder="描述您想要的广告内容，例如：
• 为新产品推广设计一个现代简约的广告
• 创建一个引人注目的社交媒体广告
• 设计一个具有强烈视觉冲击力的产品广告"
                          disabled={isGenerating}
                          rows={5}
                          className={`flex-1 bg-transparent border-none outline-none text-base font-medium leading-6 resize-none ${
                            theme === 'dark' ? 'text-gray-100 placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'
                          } ${isGenerating ? 'opacity-70' : ''}`}
                          onBlur={() => {
                            // 延迟失去焦点，允许点击按钮
                            setTimeout(() => {
                              setIsInputExpanded(false)
                              setTimeout(() => {
                                setIsInputFocused(false)
                              }, 150)
                            }, 50)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && !isGenerating) {
                              e.preventDefault()
                              handleGenerate()
                              setIsInputExpanded(false)
                              setTimeout(() => {
                                setIsInputFocused(false)
                              }, 150)
                            }
                          }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={promptText}
                          onChange={(e) => setPromptText(e.target.value)}
                          placeholder="灵感来了？一句话帮你开始创作"
                          disabled={isGenerating}
                          className={`flex-1 bg-transparent border-none outline-none text-base font-medium h-full ${
                            theme === 'dark' ? 'text-gray-100 placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'
                          } ${isGenerating ? 'opacity-70' : ''}`}
                          onFocus={() => {
                            setIsInputFocused(true)
                            // 延迟显示内容，让放大动画先执行
                            setTimeout(() => {
                              setIsInputExpanded(true)
                            }, 150)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isGenerating) {
                              e.preventDefault()
                              handleGenerate()
                            }
                          }}
                        />
                      )}
                      
                      {/* 生成按钮 */}
                      <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !promptText.trim()}
                        className={`ml-4 border-none rounded-2xl outline-none w-9 h-9 flex items-center justify-center transition-all duration-200 ${
                          (isGenerating || !promptText.trim())
                            ? theme === 'dark' ? 'bg-gray-700 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-md hover:shadow-lg hover:scale-105'
                        }`}
                      >
                        {isGenerating ? (
                          <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Sparkles size={18} className="text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* 背景光晕效果 */}
                  {(promptText.trim() && !isGenerating) && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/15 to-purple-600/15 blur-md -z-10"></div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* 右侧历史记录面板 */}
          <aside className={`${isHistoryPanelCollapsed ? 'w-12' : 'w-80'} ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} transition-all border-l ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="h-full flex flex-col">
              <div className={`flex items-center justify-between p-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} border-b ${isHistoryPanelCollapsed ? 'border-l' : ''}`}>
                {!isHistoryPanelCollapsed && <h2 className="font-semibold flex items-center gap-2">
                  <History size={18} className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} />
                  <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>生成历史</span>
                </h2>}
                <button
                  onClick={() => setIsHistoryPanelCollapsed(!isHistoryPanelCollapsed)}
                  className={`p-1 rounded transition-colors ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  {isHistoryPanelCollapsed ? <History size={18} /> : <X size={18} />}
                </button>
              </div>
              
              {!isHistoryPanelCollapsed && canvasInitialized && (
                <div className="flex-1 overflow-y-auto p-2">
                  <HistoryPanel canvas={canvas} />
                </div>
              )}
            </div>
          </aside>
        </main>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  )
}