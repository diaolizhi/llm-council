# Prompt Optimizer (提示词优化器)

**通过多 LLM 反馈和建议，迭代优化你的提示词。**

Prompt Optimizer 是一个本地 Web 应用，帮助你通过系统化的测试和改进来打造更好的提示词。告别反复试错，使用结构化的工作流程：

1. **生成或提供**初始提示词
2. **同时测试**多个 LLM 的响应
3. **评分并反馈**每个输出结果
4. **生成改进建议**来自所有测试过的 LLM
5. **接受建议**并创建新版本的提示词
6. **迭代优化**直到满意为止

本工具使用 OpenRouter 访问数十种 LLM，让你可以看到不同模型对同一提示词的响应，并基于它们的集体洞察协作改进。

[English](README.md)

## 工作原理

### 优化循环

1. **初始化**：描述你的目标（例如"创建一个代码审查提示词"）让 LLM 生成初始提示词，或者直接粘贴现有提示词进行优化。

2. **测试**：你的提示词会并行发送给多个 LLM。提供测试输入（例如代码片段、问题或场景）来查看提示词在实际场景中的表现。可以同时测试多个模型。

3. **收集反馈**：为每个输出评分（1-5 星），并可选择提供详细反馈，说明哪些有效、哪些需要改进。

4. **改进建议**：基于你的反馈，所有测试过的 LLM 会分析提示词并提出具体的改进建议。每个模型都会带来不同的视角。

5. **合并与迭代**：查看各个建议或将它们合并成一个改进后的提示词。接受更改以创建新版本，继续优化循环。

6. **版本历史**：跟踪所有迭代，包括差异对比、修改原因和性能指标。可以比较版本并在需要时回滚。

## 主要功能

- **多 LLM 测试**：使用任何 OpenRouter 支持的模型并行测试提示词
- **结构化反馈**：星级评分 + 文字反馈，进行定量和定性分析
- **协作改进**：从多个 LLM 获取建议，每个模型都能发现不同的问题
- **版本控制**：完整的历史记录，包括差异对比、修改原因和性能追踪
- **迭代工作流**：无限次优化循环，直到满意为止
- **测试样本**：创建和管理可重用的测试输入，确保测试一致性
- **可定制提示词**：配置内置提示词，用于标题生成、初始提示词生成和改进建议
- **多语言支持**：界面支持多种语言
- **导出功能**：将优化后的提示词保存为文本、Markdown 或 JSON 格式，包含完整元数据

## 安装配置

### 1. 安装依赖

项目使用 [uv](https://docs.astral.sh/uv/) 进行 Python 包管理。

**后端：**
```bash
uv sync
```

**前端：**
```bash
cd frontend
npm install
cd ..
```

### 2. 配置 API Key

有两种方式配置 OpenRouter API Key：

**方式一：通过设置界面（推荐）**

启动应用后，点击设置图标，直接在界面中配置 API Key。

**方式二：通过环境变量**

在项目根目录创建 `.env` 文件：

```bash
OPENROUTER_API_KEY=sk-or-v1-...
```

在 [openrouter.ai](https://openrouter.ai/) 获取你的 API Key。

### 3. 配置模型（可选）

可以通过设置界面配置模型，或编辑 `backend/config.py`：

```python
# 用于测试提示词的模型
TEST_MODELS = [
    "x-ai/grok-4.1-fast:free",
    "tngtech/deepseek-r1t2-chimera:free",
    "kwaipilot/kat-coder-pro:free",
]

# 用于合并改进建议的模型
SYNTHESIZER_MODEL = "x-ai/grok-4.1-fast:free"

# 用于从目标生成初始提示词的模型
GENERATOR_MODEL = "x-ai/grok-4.1-fast:free"
```

## 运行应用

### 桌面模式（推荐）

作为独立桌面应用运行：

```bash
# 首次运行需要先构建前端
cd frontend && npm run build && cd ..

# 启动桌面应用
uv run python desktop.py
```

桌面应用特点：
- 在原生窗口中打开（无需浏览器）
- 自动查找可用端口
- 设置存储在平台对应的位置：
  - Windows: `%APPDATA%/LLMCouncil/`
  - macOS: `~/Library/Application Support/LLMCouncil/`
  - Linux: `~/.config/LLMCouncil/`

### 开发模式

支持热重载的开发模式：

**方式一：使用启动脚本**
```bash
./start.sh
```

**方式二：手动运行**

终端 1（后端）：
```bash
uv run python -m backend.main
```

终端 2（前端）：
```bash
cd frontend
npm run dev
```

然后在浏览器中打开 http://localhost:5173。

### 构建独立可执行文件

要创建可分发的应用程序，请参阅 **[BUILD.md](BUILD.md)** 获取详细说明。

**快速构建：**
```bash
# macOS/Linux
./scripts/build.sh

# Windows
scripts\build.bat
```

## 技术栈

- **后端：** FastAPI (Python 3.10+)、async httpx、OpenRouter API
- **前端：** React + Vite、react-markdown 渲染
- **存储：** JSON 文件存储在 `data/sessions/`
- **包管理：** Python 使用 uv，JavaScript 使用 npm

## 使用技巧

1. **从简单开始**：先用基础提示词获取基准反馈，然后迭代改进
2. **提供具体反馈**：评分和评论越具体，建议就越好
3. **测试多种模型**：不同架构的模型能发现不同的问题
4. **创建测试样本**：建立测试输入库，确保评估一致性
5. **比较版本**：使用版本历史查看哪些更改提升了性能
6. **导出最终提示词**：保存优化后的提示词以便在生产环境中复用

## 项目结构

```
backend/
  ├── optimizer.py      # 核心优化逻辑
  ├── storage.py        # 会话和迭代数据模型
  ├── settings.py       # 应用设置管理
  ├── config.py         # 默认模型配置
  ├── openrouter.py     # OpenRouter API 集成
  └── main.py           # FastAPI 端点

frontend/src/
  ├── components/
  │   ├── PromptEditor.jsx          # 提示词编辑
  │   ├── TestResults.jsx           # 输出查看和评分
  │   ├── OutputRating.jsx          # 星级评分 + 反馈
  │   ├── SuggestionAggregator.jsx  # 改进建议
  │   ├── SettingsView.jsx          # 设置配置
  │   └── IterationView.jsx         # 主工作流编排
  ├── i18n/                         # 国际化
  └── App.jsx                       # 会话管理
```

## 许可证

MIT
