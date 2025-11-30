# Design: 跨平台桌面客户端架构

## Context
LLM Council 当前是一个 Web 应用，需要用户手动启动后端（FastAPI）和前端（Vite）服务。目标是将其转换为一键启动的桌面应用，同时保持现有功能不变。

**约束条件：**
- 最小化代码改动，复用现有 React 前端
- 支持 Windows、macOS、Linux 三个平台
- API Key 需要安全存储，不再依赖 `.env` 文件

## Goals / Non-Goals

**Goals:**
- 提供一键启动的桌面应用体验
- 通过 UI 界面管理 API Key
- 支持三大桌面平台打包分发
- 保持现有功能完整性

**Non-Goals:**
- 不支持移动端（iOS/Android）
- 不使用系统级 keychain（简化实现）
- 不改变核心业务逻辑

## Decisions

### 1. 使用 PyWebView 作为桌面容器
**决定：** 使用 pywebview 库将 Web 应用嵌入原生窗口

**理由：**
- 与现有 Python 后端无缝集成
- 代码改动最小，复用现有 React 前端
- 打包体积相对较小（依赖系统 WebView）
- 支持 Windows（Edge WebView2）、macOS（WebKit）、Linux（WebKitGTK）

**替代方案：**
- Tauri：需要学习 Rust，改动较大
- Electron：打包体积大（~150MB）
- Flutter：需要完全重写前端

### 2. API Key 存储方案
**决定：** 使用 JSON 配置文件存储在用户数据目录

**存储位置：**
- Windows: `%APPDATA%/LLMCouncil/config.json`
- macOS: `~/Library/Application Support/LLMCouncil/config.json`
- Linux: `~/.config/LLMCouncil/config.json`

**理由：**
- 实现简单，跨平台一致
- 用户可手动备份/迁移配置
- 避免系统 keychain 的复杂性

**安全措施：**
- 配置文件权限设为仅用户可读（600）
- 可选：使用 cryptography 库加密存储

### 3. 应用架构
```
┌─────────────────────────────────────┐
│           PyWebView Window          │
│  ┌───────────────────────────────┐  │
│  │      React Frontend           │  │
│  │   (Built static files)        │  │
│  └───────────────────────────────┘  │
│              ↕ HTTP                 │
│  ┌───────────────────────────────┐  │
│  │      FastAPI Backend          │  │
│  │   (Embedded in same process)  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**启动流程：**
1. 主进程启动 FastAPI 服务（后台线程）
2. 等待服务就绪
3. 创建 PyWebView 窗口加载前端
4. 窗口关闭时优雅退出

### 4. 打包方案
**决定：** 使用 PyInstaller 打包

**理由：**
- 成熟稳定，社区支持好
- 支持三大平台
- 可生成单文件可执行程序

**产物：**
- Windows: `LLMCouncil.exe`（或 NSIS 安装包）
- macOS: `LLMCouncil.app`（或 DMG）
- Linux: `LLMCouncil`（或 AppImage）

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| WebView 兼容性差异 | 不同平台渲染可能有细微差异 | 使用标准 CSS，测试三平台 |
| 打包体积较大 | Python 运行时约 30-50MB | 使用 UPX 压缩，排除不必要依赖 |
| 首次启动慢 | PyInstaller 解压需要时间 | 添加启动画面 |
| API Key 明文存储 | 配置文件可被读取 | 设置文件权限，可选加密 |

## Migration Plan

1. **阶段一：核心改造**
   - 添加 pywebview 依赖
   - 创建桌面启动入口
   - 实现 API Key 配置管理

2. **阶段二：前端适配**
   - 添加设置页面
   - 构建静态文件
   - 调整 API 基础路径

3. **阶段三：打包分发**
   - 配置 PyInstaller
   - 测试三平台打包
   - 创建发布流程

**回滚方案：** 保留原有 `start.sh` 脚本，用户仍可选择 Web 方式运行

## Open Questions

1. 是否需要自动更新功能？（建议后续迭代添加）
2. 是否需要系统托盘支持？（建议后续迭代添加）
3. 打包时是否包含 Python 运行时？（建议包含，避免用户安装依赖）
