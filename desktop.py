"""Desktop application entry point using PyWebView."""

import os
import sys
import threading
import time
import socket
import logging
import traceback
from pathlib import Path

# Set desktop mode environment variable before importing backend modules
os.environ["LLM_COUNCIL_DESKTOP"] = "1"

import webview
import uvicorn

from backend.main import app
from backend.platform_utils import get_user_data_dir


def setup_logging(debug: bool = False):
    """Setup logging to file and optionally console."""
    # Create logs directory
    log_dir = get_user_data_dir() / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)

    # Log file path
    log_file = log_dir / "llm-council.log"

    # Configure root logger
    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG if debug else logging.INFO)

    # Remove existing handlers
    logger.handlers.clear()

    # File handler (always enabled)
    file_handler = logging.FileHandler(log_file, mode='w', encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)

    # Console handler (only in debug mode or when frozen with DEBUG env var)
    if debug or os.environ.get("DEBUG", "").lower() in ("1", "true", "yes"):
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG)
        console_formatter = logging.Formatter('%(levelname)s: %(message)s')
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)

    logger.info("=" * 60)
    logger.info("LLM Council Desktop Application Starting")
    logger.info(f"Log file: {log_file}")
    logger.info(f"User data directory: {get_user_data_dir()}")
    logger.info(f"Python version: {sys.version}")
    logger.info(f"Frozen (packaged): {getattr(sys, 'frozen', False)}")
    if getattr(sys, 'frozen', False):
        logger.info(f"_MEIPASS: {sys._MEIPASS}")
    logger.info("=" * 60)

    return logger


def find_available_port(start_port: int = 8001, max_attempts: int = 100) -> int:
    """Find an available port starting from start_port."""
    logger = logging.getLogger(__name__)
    logger.info(f"Looking for available port starting from {start_port}")

    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                logger.info(f"Found available port: {port}")
                return port
            except OSError:
                logger.debug(f"Port {port} is occupied")
                continue

    error_msg = f"Could not find available port in range {start_port}-{start_port + max_attempts}"
    logger.error(error_msg)
    raise RuntimeError(error_msg)


def wait_for_server(host: str, port: int, timeout: float = 30.0) -> bool:
    """Wait for the server to become available."""
    logger = logging.getLogger(__name__)
    logger.info(f"Waiting for server at {host}:{port} (timeout: {timeout}s)")

    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                s.connect((host, port))
                elapsed = time.time() - start_time
                logger.info(f"Server is ready (took {elapsed:.2f}s)")
                return True
        except (ConnectionRefusedError, socket.timeout, OSError) as e:
            logger.debug(f"Server not ready yet: {e}")
            time.sleep(0.1)

    logger.error(f"Server failed to start within {timeout}s timeout")
    return False


def run_server(host: str, port: int):
    """Run the FastAPI server in a background thread."""
    logger = logging.getLogger(__name__)

    try:
        logger.info(f"Starting FastAPI server on {host}:{port}")
        config = uvicorn.Config(
            app,
            host=host,
            port=port,
            log_level="info",
            access_log=False,
        )
        server = uvicorn.Server(config)
        server.run()
    except Exception as e:
        logger.error(f"Server error: {e}")
        logger.error(traceback.format_exc())


def check_static_files():
    """Check if static files are accessible."""
    logger = logging.getLogger(__name__)

    if getattr(sys, 'frozen', False):
        base_path = sys._MEIPASS
        static_dir = Path(base_path) / "backend" / "static"
    else:
        base_path = Path(__file__).parent
        static_dir = base_path / "backend" / "static"

    logger.info(f"Checking static files at: {static_dir}")

    if not static_dir.exists():
        logger.error(f"Static directory does not exist: {static_dir}")
        return False

    index_html = static_dir / "index.html"
    if not index_html.exists():
        logger.error(f"index.html not found: {index_html}")
        return False

    logger.info(f"index.html found: {index_html} ({index_html.stat().st_size} bytes)")

    assets_dir = static_dir / "assets"
    if assets_dir.exists():
        asset_files = list(assets_dir.iterdir())
        logger.info(f"Found {len(asset_files)} asset files:")
        for f in asset_files:
            logger.info(f"  - {f.name} ({f.stat().st_size} bytes)")
    else:
        logger.warning(f"Assets directory not found: {assets_dir}")

    return True


def main():
    """Main entry point for the desktop application."""
    # Setup logging (debug mode if DEBUG env var is set)
    debug = os.environ.get("DEBUG", "").lower() in ("1", "true", "yes")
    logger = setup_logging(debug=debug)

    try:
        # Check static files
        if not check_static_files():
            logger.error("Static files check failed - frontend may not load properly")

        # Find available port
        host = "127.0.0.1"
        port = find_available_port()

        # Store port in environment for frontend API calls
        os.environ["LLM_COUNCIL_PORT"] = str(port)

        # Start the FastAPI server in a background thread
        logger.info("Starting server thread")
        server_thread = threading.Thread(
            target=run_server,
            args=(host, port),
            daemon=True,
            name="FastAPIServer"
        )
        server_thread.start()

        # Wait for server to be ready
        if not wait_for_server(host, port):
            logger.error("Server failed to start - exiting")
            sys.exit(1)

        # Create the webview window
        url = f"http://{host}:{port}"
        logger.info(f"Creating webview window with URL: {url}")

        window = webview.create_window(
            title="LLM Council",
            url=url,
            width=1200,
            height=800,
            min_size=(800, 600),
        )

        logger.info("Starting webview")
        # Start the webview (blocks until window is closed)
        webview.start()

        logger.info("Webview closed - application exiting")

    except Exception as e:
        logger.error(f"Fatal error: {e}")
        logger.error(traceback.format_exc())

        # Show error dialog in GUI if possible
        try:
            import tkinter as tk
            from tkinter import messagebox
            root = tk.Tk()
            root.withdraw()
            messagebox.showerror(
                "LLM Council - Error",
                f"Application failed to start:\n\n{e}\n\nCheck log file at:\n{get_user_data_dir() / 'logs' / 'llm-council.log'}"
            )
        except:
            pass

        sys.exit(1)


if __name__ == "__main__":
    main()
