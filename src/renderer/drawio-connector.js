// Draw.io连接器 - 简化版，只负责UI注入和状态管理
class DrawioConnector {
    constructor() {
        this.drawioFrame = document.getElementById('drawio-frame');
        this.isUIReady = false; // UI就绪状态
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
            this.injectDrawioUI();
        });
    }

    injectDrawioUI() {
        console.log('开始注入Draw.io UI模块');
        
        // 读取drawio-ui-injector.js文件内容并注入到iframe中
        fetch('./drawio-ui-injector.js')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(scriptContent => {
                console.log('成功获取Draw.io UI模块内容');
                
                // 创建script元素并注入内容
                const script = document.createElement('script');
                script.textContent = scriptContent;
                
                // 将script元素添加到iframe中
                try {
                    const iframeDocument = this.drawioFrame.contentDocument || this.drawioFrame.contentWindow.document;
                    iframeDocument.head.appendChild(script);
                    console.log('Draw.io UI模块注入成功');
                } catch (error) {
                    console.error('注入Draw.io UI模块失败:', error);
                }
            })
            .catch(error => {
                console.error('加载Draw.io UI模块失败:', error);
            });
    }

    handleDrawioMessage(data) {
        console.log('收到Draw.io消息:', data);
        
        if (data.type === 'drawio_ui_ready') {
            console.log('Draw.io UI已就绪');
            this.isUIReady = true;
            if (window.aiPanel) {
                window.aiPanel.addMessage('系统', 'Draw.io连接成功，可以开始绘图了！', 'ai');
            }
        }
    }

    // 获取Draw.io UI对象
    getDrawioUI() {
        return new Promise((resolve, reject) => {
            if (this.isUIReady) {
                // UI已经就绪，通过iframe直接获取UI对象
                try {
                    const iframeWindow = this.drawioFrame.contentWindow;
                    if (iframeWindow && iframeWindow.getDrawioUI) {
                        iframeWindow.getDrawioUI().then(ui => {
                            resolve(ui);
                        }).catch(error => {
                            reject(error);
                        });
                    } else {
                        reject(new Error('iframe中未找到getDrawioUI方法'));
                    }
                } catch (error) {
                    reject(new Error('无法访问iframe内容: ' + error.message));
                }
            } else {
                // 如果UI还未就绪，等待UI就绪消息
                const checkUIReady = () => {
                    if (this.isUIReady) {
                        this.getDrawioUI().then(resolve).catch(reject);
                    } else {
                        setTimeout(checkUIReady, 100);
                    }
                };
                checkUIReady();
                
                // 设置超时
                setTimeout(() => {
                    if (!this.isUIReady) {
                        reject(new Error('获取UI对象超时'));
                    }
                }, 10000); // 10秒超时
            }
        });
    }
}

// 初始化Draw.io连接器
document.addEventListener('DOMContentLoaded', () => {
    window.drawioConnector = new DrawioConnector();
});
