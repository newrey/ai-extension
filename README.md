# Draw.io AI Client

基于Electron构建的现代化Draw.io客户端，支持AI对话功能。

## 功能特性

- 🎨 完整的Draw.io绘图功能（通过iframe嵌入）
- 🤖 AI助手侧边栏，支持自然语言绘图指令
- 💬 智能对话界面，理解中文绘图命令
- 🔄 基于iframe和postMessage的通信机制
- 🎯 快捷操作按钮，常用命令一键执行

## 新架构说明

本项目采用全新的iframe架构，在src目录下创建独立的index.html页面，通过iframe嵌入Draw.io，避免了修改ext目录的限制。

## 项目结构

```
drawio-ai-client/
├── src/
│   ├── main/
│   │   ├── electron.js          # Electron主进程
│   │   └── preload.js           # 预加载脚本（已简化）
│   └── renderer/
│       ├── index.html           # 主页面（包含iframe和AI面板）
│       ├── ai-panel.js          # AI聊天面板
│       └── drawio-connector.js  # Draw.io通信桥梁
├── ext/                         # 第三方库（不允许修改）
│   ├── drawio/                  # Draw.io源码
│   ├── drawio-desktop/          # Draw.io桌面版
│   └── drawio-mcp-extension/    # MCP扩展（参考）
└── package.json
```

## 安装和运行

### 前置要求

- Node.js 16+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式运行

```bash
npm run dev
```

### 生产模式运行

```bash
npm start
```

### 打包应用

```bash
npm run build
```

## 使用说明

### AI助手功能

1. 启动应用后，右侧会显示AI助手面板
2. 在输入框中输入绘图指令，例如：
   - "添加一个矩形"
   - "创建一个圆形"
   - "添加文本'Hello World'"
   - "在左上角添加一个大矩形"
3. AI助手会解析指令并执行相应的绘图操作

### 支持的指令类型

- **添加形状**: 矩形、圆形、三角形、文本等
- **位置控制**: 左上、右上、左下、右下
- **尺寸控制**: 大、小、中等
- **文本内容**: 支持自定义文本

### 快捷操作

侧边栏底部提供常用命令的快捷按钮：
- 添加矩形
- 添加圆形  
- 添加三角形
- 添加文本

## 技术架构

### 新架构特点

1. **iframe嵌入**: 通过iframe加载Draw.io，保持ext目录完整性
2. **postMessage通信**: 主页面与iframe之间的安全通信
3. **模块化设计**: AI面板和通信器分离，便于维护
4. **响应式布局**: 自适应窗口大小

### 通信流程

```
用户输入 → AI解析 → postMessage → Draw.io iframe → 绘图操作
```

## 开发指南

### 添加新的绘图函数

1. 在 `src/renderer/drawio-connector.js` 的 `injectDrawioAPI()` 中添加函数实现
2. 在 `src/renderer/ai-panel.js` 的 `processAIResponse()` 中添加命令解析逻辑
3. 在 `src/renderer/index.html` 中添加对应的快捷按钮

### 自定义样式

修改 `src/renderer/index.html` 中的CSS样式来自定义界面外观。

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。
