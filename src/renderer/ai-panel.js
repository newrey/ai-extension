// AI面板功能实现
class AIPanel {
    constructor() {
        this.messages = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.addMessage('AI助手', '欢迎使用AI绘图助手！我可以帮您创建各种图形。', 'ai');
    }

    bindEvents() {
        // 绑定发送按钮事件
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();
        
        if (!message) return;

        // 添加用户消息
        this.addMessage('用户', message, 'user');
        input.value = '';

        // 处理AI响应
        this.processAIResponse(message);
    }

    addMessage(sender, content, type) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.innerHTML = `<strong>${sender}:</strong> ${content}`;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    processAIResponse(userMessage) {
        // 简单的命令解析
        let response = '';
        let command = '';
        let shapeName = '';

        if (userMessage.includes('矩形') || userMessage.includes('长方形')) {
            response = '正在为您添加矩形...';
            command = 'add_cell_of_shape';
            shapeName = 'rectangle';
        } else if (userMessage.includes('圆形') || userMessage.includes('圆')) {
            response = '正在为您添加圆形...';
            command = 'add_cell_of_shape';
            shapeName = 'circle';
        } else if (userMessage.includes('三角形')) {
            response = '正在为您添加三角形...';
            command = 'add_cell_of_shape';
            shapeName = 'triangle';
        } else if (userMessage.includes('文本') || userMessage.includes('文字')) {
            response = '正在为您添加文本...';
            command = 'add_cell_of_shape';
            shapeName = 'text';
        } else {
            response = '我理解您想绘图，请告诉我具体要添加什么图形（如：矩形、圆形、三角形、文本）';
        }

        // 添加AI响应
        this.addMessage('AI助手', response, 'ai');

        // 如果有对应的命令，执行绘图操作
        if (command) {
            // 为add_cell_of_shape命令添加shape_name参数
            const enhancedMessage = userMessage + (shapeName ? ` 形状:${shapeName}` : '');
            this.executeDrawioCommand(command, enhancedMessage);
        }
    }

    async executeDrawioCommand(command, userMessage) {
        // 通过drawioAPI直接执行命令（API现在在主页面运行）
        if (window.drawioAPI && window.drawioAPI[command]) {
            try {
                // 解析用户消息中的参数
                const params = this.parseUserMessage(userMessage);
                
                // 直接调用API函数
                const result = await window.drawioAPI[command](params);
                if (result && result.success) {
                    this.addMessage('AI助手', `命令执行成功！图形ID: ${result.id || 'N/A'}`, 'ai');
                } else {
                    this.addMessage('AI助手', `命令执行失败: ${result.error || '未知错误'}`, 'ai');
                }
            } catch (error) {
                console.error('执行命令出错:', error);
                this.addMessage('AI助手', `命令执行出错: ${error.message}`, 'ai');
            }
        } else {
            console.log('执行命令:', command, '参数:', userMessage);
            this.addMessage('AI助手', `命令已发送: ${command}`, 'ai');
        }
    }

    // 解析用户消息中的参数（与drawio-connector.js中的逻辑保持一致）
    parseUserMessage(userMessage) {
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
            const textMatch = userMessage.match(/文本[：:]\s*([^，。！？]+)/);
            if (textMatch) {
                params.text = textMatch[1];
            } else {
                params.text = '文本内容';
            }
        }

        // 解析形状名称
        const shapeMatch = userMessage.match(/形状[：:]\s*(\w+)/);
        if (shapeMatch) {
            params.shape_name = shapeMatch[1];
        } else {
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

// 全局函数供HTML调用
function sendMessage() {
    if (!window.aiPanel) {
        window.aiPanel = new AIPanel();
    }
    window.aiPanel.sendMessage();
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function executeCommand(command) {
    if (!window.aiPanel) {
        window.aiPanel = new AIPanel();
    }
    
    const input = document.getElementById('message-input');
    input.value = command;
    window.aiPanel.sendMessage();
}

// 初始化AI面板
document.addEventListener('DOMContentLoaded', () => {
    window.aiPanel = new AIPanel();
});
