import { app, BrowserWindow, ipcMain, dialog, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';
import { server, app as mcpApp, setIpcBridge } from '../mcp/drawio-mcp-server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 初始化配置存储
const store = new Store();

let mainWindow;
let isClosing = false; // Prevent duplicate closing
let mcpServerInstance; // MCP server instance

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    icon: path.join(__dirname, '../../ext/drawio/src/main/webapp/images/drawlogo256.png')
  });

  // 设置内容安全策略
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data:; " +
          "frame-src 'self' file:; " +
          "connect-src 'self'"
        ]
      }
    });
  });

  // 加载新的主页面（包含Draw.io iframe和AI面板）
  const mainPagePath = path.join(__dirname, '../renderer/index.html');
  mainWindow.loadFile(mainPagePath);

  // 开发模式下打开开发者工具
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // 窗口关闭事件 - 添加页面清理和防重复机制
  mainWindow.on('close', (event) => {
    if (isClosing) {
      // 如果已经在关闭过程中，阻止重复处理
      event.preventDefault();
      return;
    }
    
    console.log('Window is closing, cleaning up...');
    isClosing = true;
    
    // 在关闭前清理页面内容，特别是Draw.io iframe
    mainWindow.webContents.executeJavaScript(`
      try {
        // 清理Draw.io iframe
        const iframe = document.getElementById('drawio-frame');
        if (iframe) {
          iframe.src = 'about:blank';
          iframe.remove();
        }
        
        // 清理全局对象
        window.aiPanel = null;
        window.drawioConnector = null;
        window.drawioAPI = null;
        
        // 清理事件监听器
        document.removeEventListener('DOMContentLoaded', null);
        window.removeEventListener('message', null);
        
        console.log('Page cleanup completed');
      } catch (error) {
        console.error('Page cleanup error:', error);
      }
    `).catch(error => {
      console.error('Failed to execute cleanup script:', error);
    });
    
    // 设置超时，确保即使清理失败也能关闭窗口
    setTimeout(() => {
      if (isClosing) {
        console.log('Forcing window close after timeout');
        mainWindow.destroy();
      }
    }, 2000); // 2秒后强制关闭
  });

  mainWindow.on('closed', () => {
    console.log('Window closed');
    mainWindow = null;
    isClosing = false; // 重置关闭状态
  });
}

// GPU配置 - 使用必要的开关确保应用能够启动
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('--disable-gpu');
app.commandLine.appendSwitch('--disable-gpu-sandbox');
app.commandLine.appendSwitch('--no-sandbox');

// Start MCP server
async function startMCPServer() {
  try {
    // Set IPC bridge for MCP server
    setIpcBridge({
      on: (channel, callback) => ipcMain.on(channel, callback),
      removeListener: (channel, callback) => ipcMain.removeListener(channel, callback),
      send: (channel, message) => {
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send(channel, message);
        }
      }
    });
    
    // Start MCP server
    const PORT = process.env.MCP_PORT || 3001;
    mcpServerInstance = mcpApp.listen(PORT, () => {
      console.log(`Draw.io MCP server running on http://localhost:${PORT}`);
      console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
      console.log(`Health check: http://localhost:${PORT}/mcp/health`);
    });
    
    console.log('MCP server started successfully');
  } catch (error) {
    console.error('Failed to start MCP server:', error);
  }
}

// Stop MCP server
async function stopMCPServer() {
  if (mcpServerInstance) {
    try {
      mcpServerInstance.close();
      console.log('MCP server stopped');
    } catch (error) {
      console.error('Failed to stop MCP server:', error);
    }
  }
}

// Handle MCP API calls from renderer process
ipcMain.handle('mcp-api-call', async (event, message) => {
  try {
    const { method, params, requestId } = message;
    
    // Check if Draw.io API is available in renderer
    if (!mainWindow || !mainWindow.webContents) {
      throw new Error('Renderer not available');
    }
    
    // Send API call to renderer process
    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('API call timeout'));
      }, 10000);
      
      const responseHandler = (event, response) => {
        if (response.requestId === requestId) {
          clearTimeout(timeout);
          ipcMain.removeListener('mcp-api-response', responseHandler);
          
          if (response.success) {
            resolve(response.result);
          } else {
            reject(new Error(response.error || 'API call failed'));
          }
        }
      };
      
      ipcMain.on('mcp-api-response', responseHandler);
      
      // Send API call to renderer
      mainWindow.webContents.send('execute-drawio-api', {
        method,
        params,
        requestId
      });
    });
    
    return { success: true, result, requestId };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: message.requestId 
    };
  }
});

// Application ready - create window and start MCP server
app.whenReady().then(async () => {
  createWindow();
  
  // Start MCP server
  await startMCPServer();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出应用（macOS除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用即将退出时清理资源
app.on('before-quit', async (event) => {
  console.log('Application is about to quit, cleaning up resources...');
  await stopMCPServer();
});

// 保留基本的IPC通信处理（如果需要扩展功能时使用）
ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});
