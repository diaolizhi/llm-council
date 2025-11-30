#!/bin/bash
# Build script for LLM Council desktop application

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "========================================="
echo "Building LLM Council Desktop Application"
echo "========================================="

# Detect platform
OS="$(uname -s)"
ARCH="$(uname -m)"

echo "Platform: $OS"
echo "Architecture: $ARCH"

# Install dependencies
echo ""
echo "Installing Python dependencies..."
if command -v uv &> /dev/null; then
    uv sync
    uv sync --extra dev
else
    echo "Error: uv is not installed. Please install it first:"
    echo "  curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# Build frontend
echo ""
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Clean previous builds
echo ""
echo "Cleaning previous builds..."
rm -rf build dist

# Build based on platform
echo ""
echo "Building application..."

if [[ "$OS" == "Darwin" ]]; then
    # macOS
    echo "Building for macOS ($ARCH)..."
    if [[ "$ARCH" == "arm64" ]]; then
        # Apple Silicon (M1/M2/M3)
        uv run pyinstaller llm-council.spec --noconfirm
        uv run pyinstaller llm-council-debug.spec --noconfirm
        echo "✓ Built: dist/LLM Council.app (Apple Silicon)"
        echo "✓ Built: dist/LLM Council Debug.app (Apple Silicon)"
    else
        # Intel Mac
        uv run pyinstaller llm-council.spec --noconfirm --target-arch=x86_64
        uv run pyinstaller llm-council-debug.spec --noconfirm --target-arch=x86_64
        echo "✓ Built: dist/LLM Council.app (Intel)"
        echo "✓ Built: dist/LLM Council Debug.app (Intel)"
    fi

    # Show sizes
    du -sh "dist/LLM Council.app"
    du -sh "dist/LLM Council Debug.app"

elif [[ "$OS" == "Linux" ]]; then
    # Linux
    echo "Building for Linux..."
    uv run pyinstaller llm-council.spec --noconfirm
    echo "✓ Built: dist/LLM Council/"
    du -sh "dist/LLM Council/"

elif [[ "$OS" =~ ^MINGW|MSYS|CYGWIN ]]; then
    # Windows (Git Bash / MSYS2)
    echo "Building for Windows..."
    uv run pyinstaller llm-council-windows.spec --noconfirm
    echo "✓ Built: dist/LLM Council/"
    du -sh "dist/LLM Council/"
else
    echo "Error: Unsupported platform: $OS"
    exit 1
fi

echo ""
echo "========================================="
echo "Build complete!"
echo "========================================="
echo ""
echo "Output directory: $PROJECT_ROOT/dist"
echo ""
echo "To run the application:"
if [[ "$OS" == "Darwin" ]]; then
    echo "  open \"dist/LLM Council.app\""
elif [[ "$OS" == "Linux" ]]; then
    echo "  cd dist/LLM Council && ./LLMCouncil"
else
    echo "  dist\\LLM Council\\LLMCouncil.exe"
fi
