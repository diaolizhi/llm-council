# 构建指南 - Build Guide

本文档说明如何为不同平台构建 LLM Council 桌面应用。

## 快速开始

### 自动构建（推荐）

使用提供的构建脚本：

**macOS / Linux:**
```bash
./scripts/build.sh
```

**Windows:**
```cmd
scripts\build.bat
```

构建产物在 `dist/` 目录。

---

## 手动构建

### 前置要求

所有平台都需要：
- Python 3.10+
- Node.js 20+
- [uv](https://docs.astral.sh/uv/) - Python 包管理器

**安装 uv:**

macOS/Linux:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Windows (PowerShell):
```powershell
irm https://astral.sh/uv/install.ps1 | iex
```

### 构建步骤

#### 1. 安装依赖

```bash
# Python 依赖
uv sync
uv sync --extra dev

# 前端依赖
cd frontend
npm install
cd ..
```

#### 2. 构建前端

```bash
cd frontend
npm run build
cd ..
```

这会将前端静态文件输出到 `backend/static/`。

#### 3. 打包应用

根据你的平台选择对应的命令：

**macOS (Apple Silicon - M1/M2/M3):**
```bash
uv run pyinstaller llm-council.spec --noconfirm
```
输出：`dist/LLM Council.app`

**macOS (Intel):**
```bash
uv run pyinstaller llm-council.spec --noconfirm --target-arch=x86_64
```
输出：`dist/LLM Council.app`

**Windows:**
```cmd
uv run pyinstaller llm-council-windows.spec --noconfirm
```
输出：`dist\LLM Council\LLMCouncil.exe`

**Linux:**
```bash
uv run pyinstaller llm-council.spec --noconfirm
```
输出：`dist/LLM Council/LLMCouncil`

#### 4. 调试版本

构建带控制台的调试版本（仅 macOS）：
```bash
uv run pyinstaller llm-council-debug.spec --noconfirm
```
输出：`dist/LLM Council Debug.app`

---

## 跨平台构建

**重要：** PyInstaller **不支持交叉编译**。你必须在目标平台上构建：

- **Windows 应用** → 在 Windows 机器上构建
- **macOS Intel 应用** → 在 Intel Mac 上构建
- **macOS ARM 应用** → 在 M 系列 Mac 上构建
- **Linux 应用** → 在 Linux 机器上构建

### 使用 GitHub Actions 自动构建

推荐使用 GitHub Actions 自动在所有平台上构建。

**触发构建：**

1. **自动触发**：推送版本标签
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

2. **手动触发**：在 GitHub 仓库的 Actions 标签页手动运行 workflow

**下载构建产物：**
- GitHub Releases 页面会自动创建发布，包含所有平台的安装包

---

## 构建产物

### macOS

- **Apple Silicon**: `LLM-Council-macOS-arm64.dmg` (~40MB)
- **Intel**: `LLM-Council-macOS-intel.dmg` (~40MB)

**安装方式：**
1. 打开 DMG 文件
2. 拖动应用到 Applications 文件夹
3. 双击运行

**首次运行：** 可能需要右键 → 打开（macOS 安全限制）

### Windows

- **可执行文件**: `LLM-Council-Windows.zip` (~50MB)

**安装方式：**
1. 解压 ZIP 文件
2. 进入 `LLM Council` 文件夹
3. 运行 `LLMCouncil.exe`

**可选：** 可以创建桌面快捷方式

### Linux

- **可执行文件**: `LLM-Council-Linux.tar.gz` (~45MB)

**安装方式：**
```bash
tar -xzf LLM-Council-Linux.tar.gz
cd "LLM Council"
./LLMCouncil
```

**依赖：** 需要 GTK3 和 WebKit2GTK
```bash
# Ubuntu/Debian
sudo apt-get install libgtk-3-0 libwebkit2gtk-4.0-37

# Fedora
sudo dnf install gtk3 webkit2gtk3
```

---

## 应用大小对比

| 平台 | 大小 | 包含内容 |
|------|------|----------|
| macOS (ARM/Intel) | ~40MB | Python 3.10 + 所有依赖 + 前端 |
| Windows | ~50MB | Python 3.10 + 所有依赖 + 前端 |
| Linux | ~45MB | Python 3.10 + 所有依赖 + 前端 |

所有构建都是**完全独立**的，用户无需安装 Python 或其他依赖。

---

## 调试

### 启用调试日志

设置环境变量 `DEBUG=1` 运行应用：

**macOS/Linux:**
```bash
DEBUG=1 ./LLMCouncil
```

**Windows:**
```cmd
set DEBUG=1
LLMCouncil.exe
```

### 日志文件位置

应用运行时会自动创建日志文件：

- **Windows**: `%APPDATA%\LLMCouncil\logs\llm-council.log`
- **macOS**: `~/Library/Application Support/LLMCouncil/logs/llm-council.log`
- **Linux**: `~/.config/LLMCouncil/logs/llm-council.log`

### 常见问题

**macOS: "无法打开，因为它来自身份不明的开发者"**
- 右键点击应用 → 选择"打开"
- 或在系统偏好设置中允许该应用

**Windows: "Windows 已保护你的电脑"**
- 点击"更多信息" → "仍要运行"

**Linux: libgtk 缺失**
- 安装 GTK3: `sudo apt-get install libgtk-3-0 libwebkit2gtk-4.0-37`

---

## 创建安装包（可选）

### macOS DMG

使用 `create-dmg`:
```bash
brew install create-dmg
create-dmg \
  --volname "LLM Council" \
  --window-pos 200 120 \
  --window-size 800 400 \
  --icon-size 100 \
  --app-drop-link 600 185 \
  "LLM-Council.dmg" \
  "dist/LLM Council.app"
```

### Windows Installer

使用 NSIS 或 Inno Setup 创建安装程序（配置文件待添加）。

### Linux AppImage

使用 `appimagetool` 创建 AppImage（配置文件待添加）。

---

## 优化构建大小

当前构建已经很精简，但可以进一步优化：

1. **移除不需要的依赖**
2. **使用 UPX 压缩** (已启用)
3. **排除测试文件和文档**

如需帮助优化，请查看 `llm-council.spec` 文件中的 `excludes` 部分。
