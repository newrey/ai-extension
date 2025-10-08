/**
 * MCP客户端测试脚本
 * 用于测试MCP服务器的SSE连接和工具调用功能
 */

// 测试MCP服务器连接
async function testMCPServer() {
  console.log('开始测试MCP服务器...');
  
  try {
    // 测试SSE连接
    console.log('1. 测试SSE连接...');
    const eventSource = new EventSource('http://localhost:3001/mcp');
    
    eventSource.onopen = () => {
      console.log('✓ SSE连接已建立');
    };
    
    eventSource.onmessage = (event) => {
      console.log('收到消息:', event.data);
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE连接错误:', error);
    };
    
    // 等待连接建立
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试工具调用
    console.log('2. 测试工具调用...');
    
    // 测试添加形状
    const addShapeResponse = await fetch('http://localhost:3001/mcp/tools', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'drawio_add_shape',
        arguments: {
          shape_name: 'rectangle',
          x: 100,
          y: 100,
          width: 120,
          height: 60,
          text: '测试形状'
        }
      })
    });
    
    if (addShapeResponse.ok) {
      const result = await addShapeResponse.json();
      console.log('✓ 添加形状工具调用成功:', result);
    } else {
      console.error('✗ 添加形状工具调用失败:', addShapeResponse.status);
    }
    
    // 测试列出单元格
    const listCellsResponse = await fetch('http://localhost:3001/mcp/tools', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'drawio_list_cells',
        arguments: {
          page: 0,
          page_size: 10
        }
      })
    });
    
    if (listCellsResponse.ok) {
      const result = await listCellsResponse.json();
      console.log('✓ 列出单元格工具调用成功:', result);
    } else {
      console.error('✗ 列出单元格工具调用失败:', listCellsResponse.status);
    }
    
    // 测试无效工具
    const invalidToolResponse = await fetch('http://localhost:3001/mcp/tools', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'invalid_tool',
        arguments: {}
      })
    });
    
    if (!invalidToolResponse.ok) {
      console.log('✓ 无效工具调用正确返回错误');
    }
    
    // 保持连接一段时间以接收事件
    console.log('3. 等待事件接收（5秒）...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    eventSource.close();
    console.log('✓ 测试完成');
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 如果直接运行此脚本，则执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testMCPServer().catch(console.error);
}

export { testMCPServer };
