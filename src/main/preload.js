const { contextBridge, ipcRenderer } = require('electron');

// 保留基本的API接口，用于未来功能扩展
contextBridge.exposeInMainWorld('electronAPI', {
  // 显示消息框（保留基本功能）
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
});
