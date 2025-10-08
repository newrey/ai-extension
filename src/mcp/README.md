# Draw.io MCP 服务

基于SSE（Server-Sent Events）的Draw.io MCP服务，允许外部应用通过标准MCP协议与Draw.io交互。

## 功能特性

- **SSE事件流**：实时接收Draw.io图形变更事件
- **RESTful API**：通过HTTP POST调用绘图工具
- **标准MCP协议**：兼容Model Context Protocol规范
- **实时同步**：支持多客户端同时连接

## 快速开始

### 1. 启动应用

```bash
npm start
```

MCP服务器将在 `http://localhost:3001` 启动。

### 2. 连接MCP服务

#### SSE事件流连接

```javascript
const eventSource = new EventSource('http://localhost:3001/mcp');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('收到事件:', data);
};

eventSource.onerror = (error) => {
  console.error('连接错误:', error);
};
```

#### 工具调用

```javascript
// 添加形状
const response = await fetch('http://localhost:3001/mcp/tools', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'drawio_add_shape',
    arguments: {
      shape_name: 'rectangle',
      x: 100,
      y: 100,
      width: 120,
      height: 60,
      text: '示例文本'
    }
  })
});

const result = await response.json();
```

## 可用工具

### drawio_add_shape
在Draw.io中添加指定形状。

**参数：**
- `shape_name` (必需): 形状名称（rectangle, circle, text, diamond, triangle, ellipse）
- `x`: X坐标（默认: 100）
- `y`: Y坐标（默认: 100）
- `width`: 宽度（默认: 120）
- `height`: 高度（默认: 60）
- `text`: 文本内容（默认: ""）

### drawio_delete_cell
删除指定ID的单元格。

**参数：**
- `cell_id` (必需): 要删除的单元格ID

### drawio_add_edge
在两个形状之间添加连线。

**参数：**
- `source_id` (必需): 源单元格ID
- `target_id` (必需): 目标单元格ID
- `text`: 连线文本（默认: ""）

### drawio_list_cells
列出图形中的所有单元格。

**参数：**
- `page`: 页码（默认: 0）
- `page_size`: 每页大小（默认: 50）

## 事件类型

### graph_changed
图形内容发生变更时触发。

```json
{
  "event": "graph_changed",
  "data": {
    "operation": "add_shape",
    "cell_id": "cell_123",
    "timestamp": "2025-01-08T15:45:00Z"
  }
}
```

### selection_changed
选择状态变更时触发。

```json
{
  "event": "selection_changed",
  "data": {
    "selected_cells": ["cell_123", "cell_456"],
    "timestamp": "2025-01-08T15:45:01Z"
  }
}
```

## 错误处理

工具调用返回标准MCP格式的错误响应：

```json
{
  "content": [
    {
      "type": "text",
      "text": "错误: 缺少必需参数: shape_name"
    }
  ],
  "isError": true
}
```

## 开发测试

运行测试脚本验证MCP服务功能：

```bash
node src/mcp/test-mcp-client.js
```

## 配置选项

MCP服务器默认端口为3001，可在 `src/main/electron.js` 中修改：

```javascript
mcpServer = new MCPServer(3001); // 修改端口号
```

## 架构说明

- **MCP服务器** (`src/mcp/mcp-server.js`): 处理HTTP请求和SSE连接
- **适配器** (`src/mcp/drawio-mcp-adapter.js`): 桥接MCP工具和Draw.io API
- **主进程集成** (`src/main/electron.js`): 管理MCP服务器生命周期

## 注意事项

1. MCP服务仅在Electron应用运行时可用
2. 确保端口3001未被其他应用占用
3. 支持跨域请求（CORS已启用）
4. 事件流连接会自动重连
