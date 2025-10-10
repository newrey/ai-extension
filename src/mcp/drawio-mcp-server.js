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

// IPC communication bridge for calling Draw.io API
let ipcBridge = null;

// Set IPC bridge function
function setIpcBridge(bridge) {
    ipcBridge = bridge;
}

// Helper function to call Draw.io API through IPC
async function callDrawioAPI(method, params) {
    if (!ipcBridge) {
        throw new Error('IPC bridge not available');
    }
    
    return new Promise((resolve, reject) => {
        const requestId = Math.random().toString(36).substring(2, 15);
        
        const message = {
            type: 'mcp_api_call',
            requestId,
            method,
            params
        };
        
        const timeout = setTimeout(() => {
            reject(new Error('API call timeout'));
        }, 10000);
        
        const messageHandler = (event, response) => {
            if (response.requestId === requestId) {
                clearTimeout(timeout);
                ipcBridge.removeListener('mcp-api-response', messageHandler);
                
                if (response.success) {
                    resolve(response.result);
                } else {
                    reject(new Error(response.error || 'API call failed'));
                }
            }
        };
        
        ipcBridge.on('mcp-api-response', messageHandler);
        ipcBridge.send('mcp-api-call', message);
    });
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
    async ({ page, page_size, filter }) => {
        try {
            const result = await callDrawioAPI('list_paged_model', {
                page,
                page_size,
                filter
            });
            
            return {
                content: [{ type: 'text', text: JSON.stringify(result) }],
                structuredContent: {
                    shapes: result,
                    total_count: result.length,
                    page,
                    page_size
                }
            };
        } catch (error) {
            return {
                content: [{ type: 'text', text: JSON.stringify({ 
                    shapes: [],
                    total_count: 0,
                    page,
                    page_size,
                    error: error.message || 'Unknown error' 
                }) }],
                structuredContent: { 
                    shapes: [],
                    total_count: 0,
                    page,
                    page_size
                },
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
            
            return {
                content: [{ type: 'text', text: JSON.stringify(result) }],
                structuredContent: {
                    categories: result
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
            
            return {
                content: [{ type: 'text', text: JSON.stringify(result) }],
                structuredContent: {
                    shapes: result
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
export { server, app, setIpcBridge };
