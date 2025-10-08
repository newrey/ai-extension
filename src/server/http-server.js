import { createServer } from 'http';
import { createReadStream, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DrawioHttpServer {
    constructor(port = 3000, basePath = '../../ext/drawio') {
        this.port = port;
        this.basePath = join(__dirname, basePath);
        this.server = null;
        this.isRunning = false;
    }

    start() {
        return new Promise((resolve, reject) => {
            if (this.isRunning) {
                resolve(this.port);
                return;
            }

            this.server = createServer((req, res) => {
                this.handleRequest(req, res);
            });

            this.server.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    console.log(`端口 ${this.port} 被占用，尝试端口 ${this.port + 1}`);
                    this.port += 1;
                    this.start().then(resolve).catch(reject);
                    return;
                }
                reject(error);
            });

            this.server.listen(this.port, () => {
                this.isRunning = true;
                console.log(`Draw.io HTTP服务器启动成功，端口: ${this.port}`);
                console.log(`服务目录: ${this.basePath}`);
                resolve(this.port);
            });
        });
    }

    stop() {
        return new Promise((resolve) => {
            if (!this.isRunning || !this.server) {
                resolve();
                return;
            }

            this.server.close(() => {
                this.isRunning = false;
                this.server = null;
                console.log('Draw.io HTTP服务器已关闭');
                resolve();
            });
        });
    }

    handleRequest(req, res) {
        // 处理CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // 解析请求路径
        let filePath = req.url;
        
        // 默认页面
        if (filePath === '/' || filePath === '/index.html') {
            filePath = '/src/main/webapp/index.html';
        }
        
        // 构建完整文件路径
        const fullPath = join(this.basePath, filePath);

        try {
            // 检查文件是否存在
            const stats = statSync(fullPath);
            
            if (stats.isFile()) {
                // 设置正确的Content-Type
                const ext = extname(fullPath).toLowerCase();
                const contentType = this.getContentType(ext);
                res.setHeader('Content-Type', contentType);
                
                // 流式传输文件内容
                const stream = createReadStream(fullPath);
                stream.pipe(res);
                
                stream.on('error', (error) => {
                    console.error('文件读取错误:', error);
                    res.writeHead(500);
                    res.end('Internal Server Error');
                });
            } else {
                res.writeHead(404);
                res.end('File not found');
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                console.error('服务器错误:', error);
                res.writeHead(500);
                res.end('Internal Server Error');
            }
        }
    }

    getContentType(ext) {
        const contentTypes = {
            '.html': 'text/html; charset=utf-8',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.xml': 'application/xml',
            '.txt': 'text/plain'
        };
        
        return contentTypes[ext] || 'application/octet-stream';
    }

    getUrl() {
        return `http://localhost:${this.port}`;
    }
}

export default DrawioHttpServer;
