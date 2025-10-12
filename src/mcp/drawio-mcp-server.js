// Draw.io MCP Server - JavaScript version (Streamable HTTP optimized)
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { z } from 'zod';

// Create Draw.io MCP Server
const server = new McpServer({
    name: 'drawio-mcp-server',
    version: '1.0.0'
});


// 主进程窗口对象
let mainWindow = null;

// 设置主窗口对象
function setMainWindow(win) {
    mainWindow = win;
}

// 直接通过 mainWindow 执行渲染进程方法
async function callDrawioAPI(method, params) {
    if (!mainWindow) throw new Error('mainWindow not set');
    // // 直接调用主进程暴露的 executeDrawioCommand
    // if (typeof mainWindow.executeDrawioCommand === 'function') {
    //     return await mainWindow.executeDrawioCommand(method, params);
    // }
    // 或通过 webContents 执行
    if (mainWindow.webContents) {
        const code = `
            (async function() {
                try {
                    if (!window.aiPanel) {
                        console.error('[MCP] aiPanel 未初始化');
                        throw new Error('aiPanel not initialized');
                    }
                    const result = await window.aiPanel.executeDrawioCommand(${JSON.stringify(method)}, ${JSON.stringify(params)});
                    console.log('[MCP] 执行结果:', result);
                    if (!result) {
                        console.warn('[MCP] 执行结果为空，返回默认成功');
                    }
                    return result || { success: true };
                } catch (error) {
                    console.error('[MCP] 执行出错:', error.message);
                    return { success: false, error: error.message };
                }
            })();
        `;
        // console.log('[MCP] 执行渲染进程代码:', code);
        const result = await mainWindow.webContents.executeJavaScript(code);
        console.log('[MCP] executeDrawioCommand result:', result);
        return result;
    }
    throw new Error('mainWindow does not support command execution');
}

// Register add shape tool
server.registerTool(
    'add_shape',
    {
        title: 'Add Shape',
        description: 'Add specified shape to Draw.io',
        inputSchema: {
            shape_type: z.enum(['rectangle', 'circle', 'triangle', 'text', 'diamond', 'ellipse', 'square', 'process', 'cloud', 'document', 'note']),
            x: z.number().optional().default(100),
            y: z.number().optional().default(100),
            width: z.number().optional().default(80),
            height: z.number().optional().default(80),
            text: z.string().optional().default('')
        },
        outputSchema: {
            success: z.boolean(),
            shape_id: z.string().optional(),
            error: z.string().optional()
        }
    },
    async ({ shape_type, x, y, width, height, text }) => {
        try {
            const result = await callDrawioAPI('add_cell_of_shape', {
                shape_name: shape_type,
                x,
                y,
                width,
                height,
                text
            });
            
            // 转换结果以匹配输出schema
            const structuredContent = {
                success: result.success,
                shape_id: result.id,  // 注意这里使用 id 而不是 shape_id
            };
            
            if (!result.success && result.error) {
                structuredContent.error = result.error;
            }
            
            return {
                content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
                structuredContent
            };
        } catch (error) {
            const structuredContent = {
                success: false, 
                error: error.message || 'Unknown error'
            };
            
            return {
                content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
                structuredContent
            };
        }
    }
);

// Register add rectangle tool
server.registerTool(
    'add_rectangle',
    {
        title: 'Add Rectangle',
        description: 'Add rectangle to Draw.io',
        inputSchema: {
            x: z.number().optional().default(100),
            y: z.number().optional().default(100),
            width: z.number().optional().default(120),
            height: z.number().optional().default(60),
            text: z.string().optional().default('')
        },
        outputSchema: {
            success: z.boolean(),
            shape_id: z.string().optional(),
            error: z.string().optional()
        }
    },
    async ({ x, y, width, height, text }) => {
        try {
            const result = await callDrawioAPI('add_new_rectangle', {
                x,
                y,
                width,
                height,
                text
            });
            
            // 转换结果以匹配输出schema
            const structuredContent = {
                success: result.success,
                shape_id: result.id  // 使用返回的 id 作为 shape_id
            };
            
            if (!result.success && result.error) {
                structuredContent.error = result.error;
            }
            
            return {
                content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
                structuredContent
            };
        } catch (error) {
            const structuredContent = {
                success: false,
                error: error.message || 'Unknown error'
            };
            
            return {
                content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
                structuredContent
            };
        }
    }
);

// Register add connection tool
server.registerTool(
    'add_connection',
    {
        title: 'Add Connection',
        description: 'Add connection between two shapes in Draw.io',
        inputSchema: {
            source_id: z.string().describe('Source shape ID'),
            target_id: z.string().describe('Target shape ID'),
            text: z.string().optional().default(''),
            style: z.string().optional().default('endArrow=classic;html=1;rounded=0;')
        },
        outputSchema: {
            success: z.boolean(),
            connection_id: z.string().optional(),
            error: z.string().optional()
        }
    },
    async ({ source_id, target_id, text, style }) => {
        try {
            const result = await callDrawioAPI('add_edge', {
                source_id,
                target_id,
                text,
                style
            });
            
            // 转换结果以匹配输出schema
            const structuredContent = {
                success: result.success,
                connection_id: result.id, // 使用返回的 id 作为 connection_id
            };
            
            if (!result.success && result.error) {
                structuredContent.error = result.error;
            }
            
            return {
                content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
                structuredContent
            };
        } catch (error) {
            const structuredContent = {
                success: false,
                error: error.message || 'Unknown error'
            };
            
            return {
                content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
                structuredContent
            };
        }
    }
);

// Register delete shape tool
server.registerTool(
    'delete_shape',
    {
        title: 'Delete Shape',
        description: 'Delete specified shape from Draw.io',
        inputSchema: {
            shape_id: z.string().describe('Shape ID to delete')
        },
        outputSchema: {
            success: z.boolean(),
            error: z.string().optional()
        }
    },
    async ({ shape_id }) => {
        try {
            const result = await callDrawioAPI('delete_cell_by_id', {
                cell_id: shape_id
            });
            
            return {
                content: [{ type: 'text', text: JSON.stringify(result) }],
                structuredContent: result
            };
        } catch (error) {
            return {
                content: [{ type: 'text', text: JSON.stringify({ 
                    success: false, 
                    error: error.message || 'Unknown error' 
                }) }],
                structuredContent: { 
                    success: false, 
                    error: error.message || 'Unknown error' 
                }
            };
        }
    }
);

// Register list shapes tool
server.registerTool(
    'list_shapes',
    {
        title: 'List Shapes',
        description: 'List all shapes in Draw.io',
        inputSchema: {
            page: z.number().optional().default(0),
            page_size: z.number().optional().default(50),
            filter: z.object({
                cell_type: z.enum(['edge', 'vertex', 'object', 'group', 'layer']).optional()
            }).optional()
        },
        outputSchema: {
            shapes: z.array(z.any()),
            total_count: z.number(),
            page: z.number(),
            page_size: z.number()
        }
    },
    async ({ page = 0, page_size = 50, filter }) => {
        try {
            const result = await callDrawioAPI('list_paged_model', {
                page,
                page_size,
                filter
            });
            
            // 使用API返回的shapes，如果失败则使用空数组
            const shapes = result && result.success && Array.isArray(result.shapes) ? result.shapes : [];
            
            // 构造符合schema的返回数据
            const response = {
                shapes: shapes,
                total_count: shapes.length,
                page: page,
                page_size: page_size
            };
            
            return {
                content: [{ type: 'text', text: JSON.stringify(response) }],
                structuredContent: response
            };
        } catch (error) {
            const errorResponse = {
                shapes: [],
                total_count: 0,
                page: page,
                page_size: page_size
            };
            
            return {
                content: [{ type: 'text', text: JSON.stringify({ 
                    ...errorResponse,
                    error: error.message || 'Unknown error' 
                }) }],
                structuredContent: errorResponse,
                isError: true
            };
        }
    }
);

// Register get shape categories tool
server.registerTool(
    'get_shape_categories',
    {
        title: 'Get Shape Categories',
        description: 'Get available shape categories in Draw.io',
        inputSchema: {},
        outputSchema: {
            categories: z.array(z.string())
        }
    },
    async () => {
        try {
            const result = await callDrawioAPI('get_shape_categories', {});
            // 兼容 result 为数组或对象
            let categories = Array.isArray(result) ? result : (result && Array.isArray(result.categories) ? result.categories : []);
            return {
                content: [{ type: 'text', text: JSON.stringify(categories) }],
                structuredContent: {
                    categories: categories
                }
            };
        } catch (error) {
            return {
                content: [{ type: 'text', text: JSON.stringify({ 
                    categories: [],
                    error: error.message || 'Unknown error' 
                }) }],
                structuredContent: { 
                    categories: []
                },
                isError: true
            };
        }
    }
);

// Register get shapes in category tool
server.registerTool(
    'get_shapes_in_category',
    {
        title: 'Get Shapes in Category',
        description: 'Get all shapes in specified category',
        inputSchema: {
            category_id: z.string().describe('Category ID')
        },
        outputSchema: {
            shapes: z.array(z.object({
                id: z.string(),
                title: z.string()
            }))
        }
    },
    async ({ category_id }) => {
        try {
            const result = await callDrawioAPI('get_shapes_in_category', {
                category_id
            });
            
            // 确保返回的 shapes 是一个数组
            const shapes = result && result.success ? result.shapes : [];
            return {
                content: [{ type: 'text', text: JSON.stringify({ shapes }) }],
                structuredContent: {
                    shapes: shapes
                }
            };
        } catch (error) {
            return {
                content: [{ type: 'text', text: JSON.stringify({ 
                    shapes: [],
                    error: error.message || 'Unknown error' 
                }) }],
                structuredContent: { 
                    shapes: []
                },
                isError: true
            };
        }
    }
);

// Create Express application
const app = express();
app.use(express.json());

// Unified MCP endpoint using Streamable HTTP transport
app.post('/mcp', async (req, res) => {
    console.log('Received MCP request via Streamable HTTP');
    
    try {
        // Create a new transport for each request to prevent request ID collisions
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
            enableJsonResponse: true
        });

        // Cleanup on connection close
        res.on('close', () => {
            transport.close();
        });

        // Connect MCP server to transport
        await server.connect(transport);
        
        // Handle the request
        await transport.handleRequest(req, res, req.body);
    } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal server error'
                },
                id: null
            });
        }
    }
});

// Health check endpoint
app.get('/mcp/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        server: 'drawio-mcp-server',
        version: '1.0.0',
        transport: 'streamable-http'
    });
});

// Export app for external server management
export { app, setMainWindow };
