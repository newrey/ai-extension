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

// 简化的AI功能注入 - 仅用于调试和测试
const injectDebugFeatures = () => {
  console.log('注入调试功能...');
  
  // 添加一个简单的调试按钮到Draw.io界面
  const debugButton = document.createElement('button');
  debugButton.textContent = 'AI调试';
  debugButton.style.position = 'fixed';
  debugButton.style.top = '10px';
  debugButton.style.right = '10px';
  debugButton.style.zIndex = '1000';
  debugButton.style.padding = '5px 10px';
  debugButton.style.background = '#007bff';
  debugButton.style.color = 'white';
  debugButton.style.border = 'none';
  debugButton.style.borderRadius = '4px';
  debugButton.style.cursor = 'pointer';
  
  debugButton.addEventListener('click', () => {
    console.log('AI调试按钮被点击');
    // 发送消息给主窗口，表示Draw.io已准备好
    window.postMessage({ type: 'drawio_api_ready' }, '*');
  });
  
  document.body.appendChild(debugButton);
  console.log('调试功能注入完成');
};

// 等待页面加载完成后注入调试功能
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectDebugFeatures);
} else {
  injectDebugFeatures();
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
