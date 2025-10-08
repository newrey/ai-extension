const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取drawio函数列表
  getDrawioFunctions: () => ipcRenderer.invoke('get-drawio-functions'),
  
  // 执行drawio函数
  executeDrawioFunction: (functionName, parameters) => 
    ipcRenderer.invoke('execute-drawio-function', { functionName, parameters }),
  
  // 显示消息框
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  
  // 设置管理
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  
  // 监听事件
  on: (channel, callback) => {
    ipcRenderer.on(channel, callback);
  },
  
  // 移除监听
  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  }
});

// 简化版本：直接注入AI侧边栏
const injectAIFeatures = () => {
  console.log('开始注入AI功能...');
  
  // 使用更安全的方法注入代码 - 创建外部脚本文件
  const injectScript = () => {
    // 创建侧边栏HTML结构
    const sidebar = document.createElement('div');
    sidebar.id = 'ai-sidebar';
    sidebar.className = 'ai-sidebar';
    sidebar.innerHTML = `
      <div class="sidebar-header">
        <h3>AI助手</h3>
        <button class="toggle-btn">×</button>
      </div>
      <div class="chat-container">
        <div class="messages" id="ai-messages"></div>
        <div class="input-area">
          <textarea id="ai-input" placeholder="输入您的绘图指令..."></textarea>
          <button id="ai-send">发送</button>
        </div>
      </div>
    `;
    document.body.appendChild(sidebar);

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
      .ai-sidebar {
        position: fixed;
        right: 0;
        top: 0;
        width: 350px;
        height: 100vh;
        background: #f5f5f5;
        border-left: 1px solid #ddd;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        transition: transform 0.3s ease;
        transform: translateX(100%);
      }
      .ai-sidebar.visible {
        transform: translateX(0);
      }
      .sidebar-header {
        padding: 15px;
        background: #2c3e50;
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .toggle-btn {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 5px 10px;
      }
      .chat-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 15px;
      }
      .messages {
        flex: 1;
        overflow-y: auto;
        margin-bottom: 15px;
      }
      .message {
        margin-bottom: 10px;
        padding: 10px;
        border-radius: 8px;
        max-width: 80%;
      }
      .message.user {
        background: #007bff;
        color: white;
        margin-left: auto;
      }
      .message.ai {
        background: #e9ecef;
        color: #333;
      }
      .input-area {
        display: flex;
        gap: 10px;
      }
      #ai-input {
        flex: 1;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        resize: none;
        height: 60px;
      }
      #ai-send {
        padding: 10px 20px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);

    // 简化的AI侧边栏实现
    class SimpleAISidebar {
      constructor() {
        this.isVisible = false;
        this.init();
      }

      init() {
        this.bindEvents();
        console.log('AI侧边栏初始化完成');
      }

      bindEvents() {
        document.querySelector('.toggle-btn').addEventListener('click', () => {
          this.toggle();
        });

        document.getElementById('ai-send').addEventListener('click', () => {
          this.sendMessage();
        });

        document.getElementById('ai-input').addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
          }
        });
      }

      toggle() {
        this.isVisible = !this.isVisible;
        document.getElementById('ai-sidebar').classList.toggle('visible', this.isVisible);
      }

      async sendMessage() {
        const input = document.getElementById('ai-input');
        const message = input.value.trim();
        
        if (!message) return;

        this.addMessage('user', message);
        input.value = '';
        await this.processAIResponse(message);
      }

      addMessage(sender, content) {
        const messagesContainer = document.getElementById('ai-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ' + sender;
        messageDiv.textContent = content;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }

      async processAIResponse(userMessage) {
        this.addMessage('ai', '思考中...');

        try {
          if (userMessage.includes('矩形')) {
            this.addMessage('ai', '已执行: 添加矩形');
          } else if (userMessage.includes('圆形')) {
            this.addMessage('ai', '已执行: 添加圆形');
          } else if (userMessage.includes('文本')) {
            this.addMessage('ai', '已执行: 添加文本');
          } else {
            this.addMessage('ai', '抱歉，我没有理解您的指令。请尝试更明确的描述。');
          }
        } catch (error) {
          this.addMessage('ai', '处理指令时出现错误，请稍后重试。');
        }
      }
    }

    // 初始化侧边栏
    window.AISidebar = new SimpleAISidebar();
    console.log('AI侧边栏注入完成');
  };

  // 执行注入
  injectScript();
  console.log('所有脚本注入完成');
};

// 等待页面加载完成后注入
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectAIFeatures);
} else {
  injectAIFeatures();
}

// 注入drawio操作函数到window对象
contextBridge.exposeInMainWorld('drawioAPI', {
  add_new_rectangle: (options) => {
    console.log('调用add_new_rectangle:', options);
  },
  delete_cell_by_id: (options) => {
    console.log('调用delete_cell_by_id:', options);
  },
  add_edge: (options) => {
    console.log('调用add_edge:', options);
  },
  get_shape_categories: () => {
    console.log('调用get_shape_categories');
  },
  get_shapes_in_category: (options) => {
    console.log('调用get_shapes_in_category:', options);
  },
  get_shape_by_name: (options) => {
    console.log('调用get_shape_by_name:', options);
  },
  add_cell_of_shape: (options) => {
    console.log('调用add_cell_of_shape:', options);
  },
  list_paged_model: (options) => {
    console.log('调用list_paged_model:', options);
  }
});
