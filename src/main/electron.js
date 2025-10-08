import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';
import DrawioHttpServer from '../server/http-server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 初始化配置存储
const store = new Store();

let mainWindow;
let httpServer;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../../ext/drawio/src/main/webapp/images/drawlogo256.png')
  });

  // 加载新的主页面（包含Draw.io iframe和AI面板）
  const mainPagePath = path.join(__dirname, '../renderer/index.html');
  mainWindow.loadFile(mainPagePath);

  // 开发模式下打开开发者工具
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // 窗口关闭事件
  mainWindow.on('close', (event) => {
    // 在窗口关闭前进行清理
    console.log('窗口正在关闭，进行清理...');
  });

  mainWindow.on('closed', () => {
    console.log('窗口已关闭');
    mainWindow = null;
  });
}

// GPU配置 - 使用必要的开关确保应用能够启动
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('--disable-gpu');
app.commandLine.appendSwitch('--disable-gpu-sandbox');
app.commandLine.appendSwitch('--no-sandbox');

// 应用准备就绪时创建窗口
app.whenReady().then(async () => {
  // 启动HTTP服务器
  try {
    httpServer = new DrawioHttpServer();
    const port = await httpServer.start();
    console.log(`Draw.io HTTP服务器运行在端口: ${port}`);
  } catch (error) {
    console.error('HTTP服务器启动失败:', error);
    // 即使服务器启动失败，也继续启动应用
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出应用（macOS除外）
app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    // 关闭HTTP服务器
    if (httpServer) {
      await httpServer.stop();
    }
    app.quit();
  }
});

// 应用即将退出时清理资源
app.on('before-quit', async (event) => {
  console.log('应用即将退出，清理资源...');
  // 关闭HTTP服务器
  if (httpServer) {
    await httpServer.stop();
  }
});

// 保留基本的IPC通信处理（如果需要扩展功能时使用）
ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});
