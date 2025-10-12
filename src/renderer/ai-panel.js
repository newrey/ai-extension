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
        let params = {};

        if (userMessage.includes('矩形') || userMessage.includes('长方形')) {
            response = '正在为您添加矩形...';
            command = 'add_cell_of_shape';
            params = { shape_name: 'rectangle' };
        } else if (userMessage.includes('圆形') || userMessage.includes('圆')) {
            response = '正在为您添加圆形...';
            command = 'add_cell_of_shape';
            params = { shape_name: 'circle' };
        } else if (userMessage.includes('三角形')) {
            response = '正在为您添加三角形...';
            command = 'add_cell_of_shape';
            params = { shape_name: 'triangle' };
        } else if (userMessage.includes('文本') || userMessage.includes('文字')) {
            response = '正在为您添加文本...';
            command = 'add_cell_of_shape';
            params = { shape_name: 'text' };
        } else {
            response = '我理解您想绘图，请告诉我具体要添加什么图形（如：矩形、圆形、三角形、文本）';
        }

        // 添加AI响应
        this.addMessage('AI助手', response, 'ai');

        // 如果有对应的命令，执行绘图操作
        if (command) {
            this.executeDrawioCommand(command, params);
        }
    }

    async executeDrawioCommand(command, params) {
        // 通过drawioAPI直接执行命令
        if (window.drawioAPI && window.drawioAPI[command]) {
            try {
                // 直接调用API函数
                const result = await window.drawioAPI[command](params);
                if (result && result.success) {
                    this.addMessage('AI助手', `命令执行成功！图形ID: ${result.id || 'N/A'}`, 'ai');
                    return result;
                } else {
                    const error = result ? result.error : '未知错误';
                    this.addMessage('AI助手', `命令执行失败: ${error}`, 'ai');
                    return { success: false, error };
                }
            } catch (error) {
                console.error('执行命令出错:', error);
                this.addMessage('AI助手', `命令执行出错: ${error.message}`, 'ai');
                return { success: false, error: error.message };
            }
        } else {
            console.log('执行命令:', command, '参数:', params);
            this.addMessage('AI助手', `命令未实现: ${command}`, 'ai');
            return { success: false, error: `Command ${command} not implemented` };
        }
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
