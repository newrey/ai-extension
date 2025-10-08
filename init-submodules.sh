#!/bin/bash
# 子模块初始化脚本

echo "=== Draw.io AI客户端项目子模块初始化 ==="

# 初始化并更新子模块
echo "1. 初始化子模块..."
git submodule init

echo "2. 更新子模块..."
git submodule update

echo "3. 检查子模块状态..."
git submodule status

echo "=== 子模块初始化完成 ==="
echo ""
echo "可用的子模块:"
echo "- ext/drawio: Draw.io主仓库"
echo "- ext/drawio-desktop: Draw.io桌面版"
echo "- ext/drawio-integration: Draw.io集成示例"
echo "- ext/drawio-mcp-extension: MCP扩展（需要手动配置）"
echo "- ext/drawio-mcp-server: MCP服务器（需要手动配置）"
echo ""
echo "对于MCP相关的子模块，请手动配置正确的Git仓库地址。"
