// Draw.io连接器 - 基于MCP扩展机制的简化实现
class DrawioConnector {
    constructor() {
        this.drawioFrame = document.getElementById('drawio-frame');
        this.pendingRequests = new Map(); // 存储待处理的请求
        this.requestCounter = 0; // 请求ID计数器
        this.init();
    }

    init() {
        this.bindEvents();
        this.waitForDrawioLoad();
    }

    bindEvents() {
        // 监听来自Draw.io iframe的消息
        window.addEventListener('message', (event) => {
            // 确保消息来自Draw.io iframe
            if (event.source === this.drawioFrame.contentWindow) {
                this.handleDrawioMessage(event.data);
            }
        });
    }

    waitForDrawioLoad() {
        this.drawioFrame.addEventListener('load', () => {
            console.log('Draw.io iframe加载完成');
        });
    }



    handleDrawioMessage(data) {
        console.log('收到Draw.io消息:', data);
        
        if (data.type === 'drawio_api_ready') {
            console.log('Draw.io API已就绪');
            if (window.aiPanel) {
                window.aiPanel.addMessage('系统', 'Draw.io连接成功，可以开始绘图了！', 'ai');
            }
        } else if (data.type === 'drawio_response') {
            // 处理来自Draw.io的响应
            this.handleDrawioResponse(data);
        }
    }

    handleDrawioResponse(response) {
        const { requestId, success, result, error } = response;
        
        // 查找对应的请求处理器
        const requestHandler = this.pendingRequests.get(requestId);
        if (requestHandler) {
            // 从待处理列表中移除
            this.pendingRequests.delete(requestId);
            
            // 调用处理器
            requestHandler(success, result, error);
        } else {
            console.warn('收到未知请求ID的响应:', requestId);
        }
    }

    executeCommand(command, userMessage) {
        console.log('执行命令:', command, '用户消息:', userMessage);
        
        // 解析用户消息中的参数
        const params = this.parseUserMessage(userMessage);
        
        // 生成唯一请求ID
        const requestId = `req_${Date.now()}_${++this.requestCounter}`;
        
        // 向Draw.io iframe发送命令
        const message = {
            type: 'drawio_command',
            command: command,
            parameters: params,
            requestId: requestId
        };

        return new Promise((resolve, reject) => {
            // 存储请求处理器
            this.pendingRequests.set(requestId, (success, result, error) => {
                if (success) {
                    resolve(result);
                } else {
                    reject(new Error(error || '命令执行失败'));
                }
            });

            // 发送命令
            this.drawioFrame.contentWindow.postMessage(message, '*');
            
            // 在主页面显示执行状态
            if (window.aiPanel) {
                window.aiPanel.addMessage('系统', `执行命令: ${command}`, 'ai');
            }
        });
    }

    parseUserMessage(userMessage) {
        // 简单的参数解析
        const params = {};
        
        // 解析位置信息
        if (userMessage.includes('左上')) {
            params.x = 50;
            params.y = 50;
        } else if (userMessage.includes('右上')) {
            params.x = 300;
            params.y = 50;
        } else if (userMessage.includes('左下')) {
            params.x = 50;
            params.y = 300;
        } else if (userMessage.includes('右下')) {
            params.x = 300;
            params.y = 300;
        } else {
            params.x = 100;
            params.y = 100;
        }

        // 解析尺寸信息
        if (userMessage.includes('大')) {
            params.width = 120;
            params.height = 120;
        } else if (userMessage.includes('小')) {
            params.width = 40;
            params.height = 40;
        } else {
            params.width = 80;
            params.height = 80;
        }

        // 解析文本内容
        if (userMessage.includes('文本') && userMessage.length > 2) {
            // 提取文本内容（简单的文本提取逻辑）
            const textMatch = userMessage.match(/文本[：:]\s*([^，。！？]+)/);
            if (textMatch) {
                params.text = textMatch[1];
            } else {
                params.text = '文本内容';
            }
        }

        // 解析形状名称（优先从"形状:"格式解析）
        const shapeMatch = userMessage.match(/形状[：:]\s*(\w+)/);
        if (shapeMatch) {
            params.shape_name = shapeMatch[1];
        } else {
            // 如果没有显式指定，根据关键词推断
            if (userMessage.includes('矩形')) {
                params.shape_name = 'rectangle';
            } else if (userMessage.includes('圆形')) {
                params.shape_name = 'circle';
            } else if (userMessage.includes('三角形')) {
                params.shape_name = 'triangle';
            } else if (userMessage.includes('菱形')) {
                params.shape_name = 'diamond';
            }
        }

        return params;
    }
}

// 初始化Draw.io连接器
document.addEventListener('DOMContentLoaded', () => {
    window.drawioConnector = new DrawioConnector();
});
