import { createServer } from 'http';
import { EventEmitter } from 'events';
import { drawioMCPAdapter } from './drawio-mcp-adapter.js';

/**
 * MCP服务器类，提供SSE形式的MCP服务
 */
export class MCPServer extends EventEmitter {
  constructor(port = 3001) {
    super();
    this.port = port;
    this.server = null;
    this.clients = new Set();
    this.adapter = new drawioMCPAdapter();
    
    // 监听drawio事件并转发给MCP客户端
    this.setupEventForwarding();
  }

  /**
   * 设置事件转发，将drawio事件转发给MCP客户端
   */
  setupEventForwarding() {
    // 监听drawio适配器的事件
    this.adapter.on('graph_changed', (data) => {
      this.broadcastEvent('graph_changed', data);
    });

    this.adapter.on('selection_changed', (data) => {
      this.broadcastEvent('selection_changed', data);
    });

    this.adapter.on('undo_redo', (data) => {
      this.broadcastEvent('undo_redo', data);
    });

    this.adapter.on('tool_activated', (data) => {
      this.broadcastEvent('tool_activated', data);
    });
  }

  /**
   * 启动MCP服务器
   */
  async start() {
    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.listen(this.port, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        console.log(`MCP server started successfully, port: ${this.port}`);
        console.log(`MCP service address: http://localhost:${this.port}/mcp`);
        resolve();
      });

      this.server.on('error', (err) => {
        console.error('MCP server error:', err);
        reject(err);
      });
    });
  }

  /**
   * 停止MCP服务器
   */
  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        // 关闭所有客户端连接
        this.clients.forEach(client => {
          client.res.write('data: [DONE]\n\n');
          client.res.end();
        });
        this.clients.clear();

        this.server.close(() => {
          console.log('MCP server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * 处理HTTP请求
   */
  handleRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    if (url.pathname === '/mcp' && req.method === 'GET') {
      this.handleMCPConnection(req, res);
    } else if (url.pathname === '/mcp/tools' && req.method === 'POST') {
      this.handleToolCall(req, res);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  }

  /**
   * 处理MCP SSE连接
   */
  handleMCPConnection(req, res) {
    // 设置SSE响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // 发送初始化事件
    res.write('event: initialized\n');
    res.write('data: ' + JSON.stringify({
      protocolVersion: '2024-11-05',
      capabilities: {
        roots: true,
        sampling: true
      }
    }) + '\n\n');

    // 注册客户端
    const client = { id: Date.now(), res };
    this.clients.add(client);

    // 客户端断开连接时清理
    req.on('close', () => {
      this.clients.delete(client);
      console.log(`MCP client disconnected: ${client.id}`);
    });

    console.log(`MCP client connected: ${client.id}`);
  }

  /**
   * 处理工具调用请求
   */
  async handleToolCall(req, res) {
    try {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          console.log('Tool call request received, body:', body);
          const request = JSON.parse(body);
          console.log('Parsed request:', request);
          
          const result = await this.adapter.callTool(request.name, request.arguments);
          
          res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify(result));
        } catch (error) {
          console.error('Tool call error:', error);
          res.writeHead(400, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({ 
            error: error.message 
          }));
        }
      });
    } catch (error) {
      console.error('Server error:', error);
      res.writeHead(500, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ 
        error: 'Internal server error' 
      }));
    }
  }

  /**
   * 广播事件给所有连接的客户端
   */
  broadcastEvent(eventType, data) {
    const eventData = JSON.stringify({
      event: eventType,
      data: data,
      timestamp: new Date().toISOString()
    });

    this.clients.forEach(client => {
      try {
        client.res.write(`event: ${eventType}\n`);
        client.res.write(`data: ${eventData}\n\n`);
      } catch (error) {
        console.error('Failed to send event:', error);
        // 移除失效的客户端
        this.clients.delete(client);
      }
    });
  }

  /**
   * 获取服务器信息
   */
  getServerInfo() {
    return {
      port: this.port,
      clients: this.clients.size,
      tools: this.adapter.getAvailableTools()
    };
  }
}
