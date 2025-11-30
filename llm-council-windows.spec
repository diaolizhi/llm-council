# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec file for LLM Council - Windows."""

import os
from pathlib import Path

block_cipher = None
project_root = Path(SPECPATH)

# Collect ALL data files needed
datas = [
    # Frontend static files
    (str(project_root / 'backend' / 'static'), 'backend/static'),
    # Data directory
    (str(project_root / 'data'), 'data'),
]

# Hidden imports for all dependencies
hiddenimports = [
    # Uvicorn
    'uvicorn',
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.loops.asyncio',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.http.h11_impl',
    'uvicorn.protocols.http.httptools_impl',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.protocols.websockets.websockets_impl',
    'uvicorn.lifespan',
    'uvicorn.lifespan.on',
    'uvicorn.lifespan.off',
    # HTTP
    'httptools',
    'httpx',
    'h11',
    'anyio',
    'sniffio',
    # FastAPI & Starlette
    'fastapi',
    'starlette',
    'starlette.responses',
    'starlette.staticfiles',
    'starlette.routing',
    'starlette.middleware',
    'starlette.middleware.cors',
    # Pydantic
    'pydantic',
    'pydantic_core',
    # Others
    'dotenv',
    'email_validator',
    'websockets',
    'watchfiles',
    # Backend modules
    'backend',
    'backend.main',
    'backend.config',
    'backend.storage',
    'backend.optimizer',
    'backend.openrouter',
    'backend.settings',
    'backend.platform_utils',
]

a = Analysis(
    ['desktop.py'],
    pathex=[str(project_root)],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

# Windows: Use onedir mode
exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='LLMCouncil',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,  # No console window
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,  # Add icon path here: 'assets/icon.ico'
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='LLM Council',
)
