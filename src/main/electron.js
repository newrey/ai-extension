import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 初始化配置存储
const store = new Store();

let mainWindow;

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
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 禁用GPU加速以解决Windows上的图形问题
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('--disable-gpu');
app.commandLine.appendSwitch('--disable-gpu-compositing');
app.commandLine.appendSwitch('--disable-software-rasterizer');
app.commandLine.appendSwitch('--no-sandbox');
app.commandLine.appendSwitch('--disable-features=VizDisplayCompositor');

// 应用准备就绪时创建窗口
app.whenReady().then(() => {
  createWindow();

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

// IPC通信处理
ipcMain.handle('get-drawio-functions', () => {
  // 返回可用的drawio操作函数列表
  return {
    functions: [
      'add_new_rectangle',
      'delete_cell_by_id', 
      'add_edge',
      'get_shape_categories',
      'get_shapes_in_category',
      'get_shape_by_name',
      'add_cell_of_shape',
      'list_paged_model'
    ]
  };
});

ipcMain.handle('execute-drawio-function', async (event, { functionName, parameters }) => {
  try {
    // 这里将通过preload脚本调用drawio函数
    const result = await mainWindow.webContents.executeJavaScript(`
      window.drawioAPI?.${functionName}?.(${JSON.stringify(parameters)});
    `);
    return { success: true, result };
  } catch (error) {
    console.error('执行drawio函数错误:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

// 保存和加载用户设置
ipcMain.handle('save-settings', async (event, settings) => {
  store.set('userSettings', settings);
  return { success: true };
});

ipcMain.handle('load-settings', async () => {
  return store.get('userSettings', {});
});
