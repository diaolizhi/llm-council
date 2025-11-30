# Change: 转换为跨平台桌面客户端

## Why
当前项目需要分别启动后端和前端服务，用户需要在终端执行命令并在浏览器中访问。这种方式对非技术用户不友好，且 API Key 存储在 `.env` 文件中存在安全隐患。转换为桌面客户端可以提供一键启动体验，并通过界面安全管理 API Key。

## What Changes
- 集成 PyWebView 将现有 Web 应用打包为桌面客户端
- 添加 API Key 管理界面，支持通过 UI 配置和持久化存储
- 移除对 `.env` 文件中 API Key 的依赖
- 添加应用打包配置，支持 Windows、macOS、Linux
- 前端添加设置页面用于 API Key 管理

## Impact
- Affected specs: 新增 `desktop-client`、`api-key-management` 能力
- Affected code:
  - `main.py` - 改为 PyWebView 启动入口
  - `backend/config.py` - 从配置文件读取 API Key
  - `backend/main.py` - 调整 CORS 和启动逻辑
  - `frontend/src/` - 添加设置页面
  - 新增 `pyproject.toml` 打包配置
