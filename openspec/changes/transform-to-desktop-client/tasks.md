# Tasks: 转换为跨平台桌面客户端

## 1. 基础设施
- [x] 1.1 添加 pywebview 和 pyinstaller 依赖到 pyproject.toml
- [x] 1.2 创建跨平台用户数据目录工具模块 `backend/platform_utils.py`
- [x] 1.3 修改 `backend/settings.py` 使用跨平台用户数据目录（桌面模式）

## 2. API Key 管理
- [x] 2.1 API Key 配置存储和读取逻辑（已存在于 `backend/settings.py`）
- [x] 2.2 API 端点 GET/POST `/api/settings`（已存在于 `backend/main.py`）
- [ ] 2.3 添加 API Key 验证端点（可选，后续迭代）

## 3. 前端设置页面
- [x] 3.1 设置页面组件（已存在 `frontend/src/components/SettingsView.jsx`）
- [x] 3.2 API Key 输入表单（已存在）
- [x] 3.3 保存按钮（已存在）
- [x] 3.4 主界面设置入口（已存在于 Sidebar）
- [ ] 3.5 添加首次启动引导（可选，后续迭代）

## 4. 桌面应用入口
- [x] 4.1 创建桌面启动入口 `desktop.py`
- [x] 4.2 实现后台线程启动 FastAPI 服务
- [x] 4.3 实现 PyWebView 窗口创建和生命周期管理
- [x] 4.4 处理端口冲突（自动查找可用端口）
- [x] 4.5 处理窗口关闭时的优雅退出（daemon 线程）

## 5. 前端构建适配
- [x] 5.1 修改 `frontend/vite.config.js` 配置 base 路径和输出目录
- [x] 5.2 修改 `frontend/src/api.js` 支持相对路径 API 调用
- [x] 5.3 配置构建输出到 `backend/static/`

## 6. 后端静态文件服务
- [x] 6.1 修改 `backend/main.py` 支持静态文件服务
- [x] 6.2 实现 SPA 路由回退到 index.html

## 7. 打包配置
- [x] 7.1 创建 PyInstaller spec 文件 `llm-council.spec`
- [x] 7.2 配置包含前端静态文件
- [x] 7.3 配置 macOS app bundle
- [ ] 7.4 添加应用图标（可选，后续迭代）
- [ ] 7.5 测试 macOS 打包
- [ ] 7.6 测试 Windows 打包（需 Windows 环境）
- [ ] 7.7 测试 Linux 打包（需 Linux 环境）

## 8. 文档和清理
- [x] 8.1 更新 README.md 添加桌面版使用说明
- [x] 8.2 保留 start.sh 作为开发模式启动脚本（已存在）
