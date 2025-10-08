// Draw.io UI注入模块 - 只负责UI对象初始化和提供
(function() {
    console.log('Draw.io UI注入模块加载中...');
    
    // 全局UI对象
    window.drawioUI = null;
    
    // UI就绪状态
    let isUIReady = false;
    let uiReadyCallbacks = [];
    
    // 初始化Draw.io UI
    function initializeDrawioUI() {
        if (isUIReady) {
            return;
        }
        
        if (window.Draw) {
            console.log('开始初始化Draw.io UI');
            
            window.Draw.loadPlugin(function(ui) {
                window.drawioUI = ui;
                isUIReady = true;
                console.log('Draw.io UI初始化完成');
                
                // 执行所有等待的回调
                uiReadyCallbacks.forEach(callback => callback(ui));
                uiReadyCallbacks = [];
                
                // 通知主页面UI就绪
                if (window.parent) {
                    window.parent.postMessage({ 
                        type: 'drawio_ui_ready',
                        uiAvailable: true
                    }, '*');
                }
            });
        } else {
            console.log('等待Draw.io对象加载...');
            setTimeout(initializeDrawioUI, 100);
        }
    }
    
    // 提供UI对象获取接口
    window.getDrawioUI = function() {
        return new Promise((resolve, reject) => {
            if (isUIReady && window.drawioUI) {
                resolve(window.drawioUI);
            } else {
                // 如果UI还未就绪，将回调加入队列
                uiReadyCallbacks.push(resolve);
                
                // 如果还没有开始初始化，则开始初始化
                if (!window.drawioUI && !isUIReady) {
                    initializeDrawioUI();
                }
            }
        });
    };
    
    
    // 立即开始初始化
    initializeDrawioUI();
    
    console.log('Draw.io UI注入模块加载完成');
})();
