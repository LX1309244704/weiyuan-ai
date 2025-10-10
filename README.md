# Weiyuan AI - 智能画板应用

一个功能强大的智能画板应用，集成了AI创作助手，支持丰富的绘图工具和便捷的操作体验。

## 🌟 主要特性

### 🎨 绘图工具
- **画笔工具** - 自由绘制，支持自定义笔刷大小和颜色
- **形状工具** - 矩形、圆形、三角形、星星、心形、菱形、八边形、箭头、直线、虚线、大括号等多种几何形状
- **文字工具** - 支持双击编辑文字内容，可自定义字体和样式
- **箭头工具** - 创建各种方向的箭头
- **橡皮擦** - 精确擦除画布内容
- **图片工具** - 支持上传和粘贴图片到画板，支持从系统剪贴板粘贴图片

### 🖱️ 操作功能
- **移动画板** - 支持拖动画板查看不同区域
- **多对象选择** - 框选多个对象进行批量操作
- **复制粘贴** - 支持多对象复制粘贴，保持相对位置和层级关系
- **层级管理** - 右键菜单和层级面板支持置顶、置底、上移一层、下移一层
- **撤销重做** - 完整的操作历史记录，支持无限次撤销重做
- **全选删除** - 支持全选和批量删除操作
- **画板缩放** - 支持鼠标滚轮缩放画板，可重置缩放比例

### ⌨️ 键盘快捷键
- **工具快捷键**: 
  - `Ctrl+H` - 手形工具（移动画板）
  - `Ctrl+P` - 铅笔工具（画笔）
  - `Ctrl+R` - 箭头工具
  - `Ctrl+S` - 形状工具
  - `Ctrl+T` - 文字工具
  - `Ctrl+E` - 橡皮擦工具
  - `Ctrl+I` - 图片工具
  - `Ctrl+L` - 层级管理工具
- **操作快捷键**: 
  - `Ctrl+Z` - 撤销
  - `Ctrl+Y` - 重做
  - `Ctrl+D` - 清除画板
  - `Ctrl+A` - 全选
  - `Ctrl+C` - 复制选中对象
  - `Ctrl+V` - 粘贴对象（优先粘贴系统剪贴板图片）
  - `Ctrl+滚轮` - 缩放画板
  - `Ctrl+[` / `Ctrl+]` - 下移一层/上移一层
  - `Ctrl+Shift+[` / `Ctrl+Shift+]` - 置底/置顶
  - `Delete` / `Backspace` - 删除选中对象
  - `Esc` - 返回用户页面

### 🎯 AI创作助手
- **智能截图** - 按住Shift键框选区域生成高质量截图
- **AI对话** - 与AI助手进行创作交流，支持多模型选择
- **内容生成** - 支持图片和视频生成功能
- **多模型支持** - 图像模型（Nanobanbana、GPT Image）、视频模型（Veo3、Sora2）、文本模型（GPT5、DeepSeek）
- **参数设置** - 支持设置图片比例（16:9、9:16、4:3、3:4、2:1、1:2、1:1）和生成张数（1-10张）
- **图片上传** - 支持上传多张图片作为参考

### 🌙 主题与界面
- **深色/浅色主题** - 自动适配系统主题偏好，支持手动切换
- **多语言支持** - 中英文界面切换
- **响应式设计** - 适配不同屏幕尺寸
- **悬浮面板** - AI创作助手和工具栏采用悬浮设计，不占用画布空间

## 🚀 快速开始

### 环境要求
- Node.js 16+ 
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/LX1309244704/weiyuan-ai.git
cd weiyuan-ai
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
```

3. **启动开发服务器**
```bash
npm run dev
# 或
yarn dev
```

4. **访问应用**
打开浏览器访问 `http://localhost:3000`

## 📁 项目结构

```
weiyuan-ai/
├── app/                    # Next.js App Router 页面
│   ├── canvas/            # 画板主页面
│   ├── user/              # 用户相关页面
│   └── globals.css        # 全局样式
├── components/            # React 组件
│   ├── CanvasToolbar.tsx  # 画板工具栏（包含所有绘图工具和操作功能）
│   ├── ChatPanel.tsx      # AI创作助手面板（支持多模型和参数设置）
│   ├── SelectionPanel.tsx # 区域选择面板（智能截图功能）
│   ├── SaveProjectModal.tsx # 项目保存弹窗
│   ├── TextToolPanel.tsx  # 文字工具面板
│   └── ui/                # UI组件库
├── stores/                 # Zustand状态管理
│   ├── authStore.ts       # 认证状态管理
│   └── userStore.ts       # 用户状态管理
├── types/                  # TypeScript类型定义
└── package.json           # 项目配置
```

## 🛠️ 技术栈

- **前端框架**: Next.js 14 (App Router)
- **UI库**: React 18 + TypeScript
- **画布引擎**: Fabric.js 6.7
- **状态管理**: Zustand
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **构建工具**: Next.js Built-in

## 🎮 使用指南

### 基本操作
1. **选择工具**: 点击工具栏图标或使用快捷键选择绘图工具
2. **绘制内容**: 在画板上点击拖拽进行绘制
3. **选择对象**: 使用箭头工具点击对象进行选择，或按住Shift键框选多个对象
4. **调整属性**: 在工具栏调整笔刷大小和颜色

### 高级功能
1. **复制粘贴**: 选中对象后使用 `Ctrl+C` 复制，`Ctrl+V` 粘贴（支持多对象批量操作）
2. **层级管理**: 右键点击对象选择层级操作，或使用层级面板进行精细管理
3. **画板缩放**: 按住 `Ctrl` 键滚动鼠标滚轮进行缩放，支持重置到100%
4. **画板移动**: 选择手形工具后拖动画板
5. **智能截图**: 按住 `Shift` 键框选区域，自动生成高质量截图并发送到AI助手
6. **项目保存**: 支持保存画板内容为JSON文件，包含所有对象数据和AI对话记录
7. **项目导入**: 支持从JSON文件导入画板内容，恢复完整创作状态

### AI创作
1. **框选截图**: 按住 `Shift` 键框选区域生成截图，自动填充到AI助手
2. **AI对话**: 在右侧AI面板输入创作需求，支持多模型切换
3. **内容生成**: 根据AI建议生成图片或视频内容
4. **参数调整**: 设置图片比例、生成张数等参数
5. **图片参考**: 上传参考图片辅助AI生成

## 🔧 开发指南

### 添加新工具
1. 在 `CanvasToolbar.tsx` 的 `tools` 数组中添加新工具配置
2. 在 `handleToolSelect` 函数中添加工具逻辑
3. 添加对应的快捷键处理
4. 如果需要新的形状，在 `shapes` 数组中添加配置

### 添加新AI模型
1. 在 `ChatPanel.tsx` 的模型选择部分添加新模型
2. 根据模型类型（图像/视频/文本）添加到对应Tab
3. 更新生成逻辑以支持新模型

### 自定义样式
项目使用Tailwind CSS，可以通过修改 `app/globals.css` 文件自定义主题色和样式。

### 状态管理
使用Zustand进行状态管理，相关状态存储在 `stores/` 目录下：
- `userStore.ts` - 管理用户信息、主题、语言等全局状态
- `authStore.ts` - 管理认证状态和用户权限

### 数据持久化
- 聊天记录自动保存到 `localStorage`，支持会话恢复
- 项目数据支持导出为JSON文件，包含完整画板状态和AI对话记录
- 用户设置（主题、语言）自动保存和恢复

## 📦 构建部署

### 生产构建
```bash
npm run build
# 或
yarn build
```

### 启动生产服务器
```bash
npm start
# 或
yarn start
```

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进项目！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Fabric.js](https://fabricjs.com/) - 强大的Canvas库
- [Next.js](https://nextjs.org/) - React全栈框架
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的CSS框架
- [Lucide](https://lucide.dev/) - 精美的图标库

---

**Weiyuan AI** - 让创作更智能，让设计更简单 ✨