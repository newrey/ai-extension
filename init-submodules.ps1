# 子模块初始化脚本 (PowerShell版本)

Write-Host "=== Draw.io AI客户端项目子模块初始化 ===" -ForegroundColor Green

# 初始化并更新子模块
Write-Host "1. 初始化子模块..." -ForegroundColor Yellow
git submodule init

Write-Host "2. 更新子模块..." -ForegroundColor Yellow
git submodule update

Write-Host "3. 检查子模块状态..." -ForegroundColor Yellow
git submodule status

Write-Host "=== 子模块初始化完成 ===" -ForegroundColor Green
Write-Host ""
Write-Host "可用的子模块:" -ForegroundColor Cyan
Write-Host "- ext/drawio: Draw.io主仓库"
Write-Host "- ext/drawio-desktop: Draw.io桌面版" 
Write-Host "- ext/drawio-integration: Draw.io集成示例"
Write-Host "- ext/drawio-mcp-extension: MCP扩展（需要手动配置）"
Write-Host "- ext/drawio-mcp-server: MCP服务器（需要手动配置）"
Write-Host ""
Write-Host "对于MCP相关的子模块，请手动配置正确的Git仓库地址。" -ForegroundColor Yellow
