/**
 * Node.js环境下的MCP客户端测试脚本
 * 用于测试MCP服务器的连接和工具调用功能
 */

import http from 'http';

// Node.js版本的EventSource模拟
class NodeEventSource {
    constructor(url) {
        this.url = url;
        this.onopen = null;
        this.onmessage = null;
        this.onerror = null;
        this.connected = false;
        
        this.connect();
    }
    
    connect() {
        const req = http.request(this.url, {
            method: 'GET',
            headers: {
                'Accept': 'text/event-stream',
                'Cache-Control': 'no-cache'
            }
        });
        
        req.on('response', (res) => {
            if (res.statusCode === 200) {
                this.connected = true;
                if (this.onopen) this.onopen();
                
                let buffer = '';
                res.on('data', (chunk) => {
                    buffer += chunk.toString();
                    
                    // 解析SSE消息
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); // 保留未完成的行
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.substring(6);
                            if (this.onmessage) {
                                this.onmessage({ data });
                            }
                        }
                    }
                });
                
                res.on('end', () => {
                    this.connected = false;
                });
                
                res.on('error', (error) => {
                    if (this.onerror) this.onerror(error);
                });
            } else {
                if (this.onerror) this.onerror(new Error(`HTTP ${res.statusCode}`));
            }
        });
        
        req.on('error', (error) => {
            if (this.onerror) this.onerror(error);
        });
        
        req.end();
    }
    
    close() {
        // 在Node.js中，我们无法真正关闭HTTP连接，但可以标记为关闭
        this.connected = false;
    }
}

// Node.js版本的fetch模拟
async function nodeFetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const req = http.request({
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: options.method || 'GET',
            headers: options.headers || {}
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk.toString();
            });
            res.on('end', () => {
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    json: () => Promise.resolve(JSON.parse(data))
                });
            });
        });
        
        req.on('error', reject);
        
        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

// 测试MCP服务器连接
async function testMCPServer() {
    console.log('开始测试MCP服务器（Node.js版本）...');
    
    try {
        // 测试SSE连接
        console.log('1. 测试SSE连接...');
        const EventSource = NodeEventSource;
        const fetch = nodeFetch;
        
        const eventSource = new EventSource('http://localhost:3001/mcp');
        
        eventSource.onopen = () => {
            console.log('✓ SSE连接已建立');
        };
        
        eventSource.onmessage = (event) => {
            console.log('收到消息:', event.data);
        };
        
        eventSource.onerror = (error) => {
            console.error('SSE连接错误:', error);
        };
        
        // 等待连接建立
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 测试工具调用
        console.log('2. 测试工具调用...');
        
        // 测试添加形状
        const addShapeResponse = await fetch('http://localhost:3001/mcp/tools', {
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
                    text: '测试形状'
                }
            })
        });
        
        if (addShapeResponse.ok) {
            const result = await addShapeResponse.json();
            console.log('✓ 添加形状工具调用成功:', JSON.stringify(result, null, 2));
        } else {
            console.error('✗ 添加形状工具调用失败:', addShapeResponse.status);
        }
        
        // 测试列出单元格
        const listCellsResponse = await fetch('http://localhost:3001/mcp/tools', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: 'drawio_list_cells',
                arguments: {
                    page: 0,
                    page_size: 10
                }
            })
        });
        
        if (listCellsResponse.ok) {
            const result = await listCellsResponse.json();
            console.log('✓ 列出单元格工具调用成功:', JSON.stringify(result, null, 2));
        } else {
            console.error('✗ 列出单元格工具调用失败:', listCellsResponse.status);
        }
        
        // 测试无效工具
        const invalidToolResponse = await fetch('http://localhost:3001/mcp/tools', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: 'invalid_tool',
                arguments: {}
            })
        });
        
        if (!invalidToolResponse.ok) {
            console.log('✓ 无效工具调用正确返回错误');
        }
        
        // 保持连接一段时间以接收事件
        console.log('3. 等待事件接收（3秒）...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        eventSource.close();
        console.log('✓ 测试完成');
        
    } catch (error) {
        console.error('测试失败:', error);
    }
}

// 如果直接运行此脚本，则执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
    testMCPServer().catch(console.error);
}

export { testMCPServer };
