@echo off
REM Build script for LLM Council desktop application (Windows)

setlocal enabledelayedexpansion

echo =========================================
echo Building LLM Council Desktop Application
echo =========================================
echo Platform: Windows
echo.

REM Check if uv is installed
where uv >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: uv is not installed. Please install it first:
    echo   powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
    exit /b 1
)

REM Install dependencies
echo Installing Python dependencies...
call uv sync
call uv sync --extra dev
if %errorlevel% neq 0 exit /b %errorlevel%

REM Build frontend
echo.
echo Building frontend...
cd frontend
call npm install
if %errorlevel% neq 0 exit /b %errorlevel%
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%
cd ..

REM Clean previous builds
echo.
echo Cleaning previous builds...
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist

REM Build application
echo.
echo Building application for Windows...
call uv run pyinstaller llm-council-windows.spec --noconfirm
if %errorlevel% neq 0 exit /b %errorlevel%

echo.
echo =========================================
echo Build complete!
echo =========================================
echo.
echo Output directory: dist\LLM Council\
echo.
echo To run the application:
echo   dist\LLM Council\LLMCouncil.exe
echo.

endlocal
