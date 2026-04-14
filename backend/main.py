"""Main entry point for the Traffic Monitoring System backend."""

import io
import sys
from pathlib import Path

import uvicorn
from fastapi import FastAPI

# Fix Windows console encoding for Unicode characters
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
if sys.stderr.encoding != 'utf-8':
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

from api.app import app as api_app
from config.settings import settings
from loguru import logger

# ASGI app entrypoint used by: uvicorn backend.main:app --reload
app: FastAPI = api_app

# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO"
)
logger.add(
    settings.LOGS_DIR / "traffic_monitor.log",
    rotation="10 MB",
    retention="7 days",
    level="DEBUG"
)


def main():
    """Run the traffic monitoring server."""
    logger.info(
        "\n"
        "    =============================================================\n"
        "    |  AI-Based Traffic Monitoring & Emergency Priority System  |\n"
        "    |                                                           |\n"
        f"    |  Location: {settings.LOCATION_NAME:<48}|\n"
        f"    |  Server:   http://{settings.HOST}:{settings.PORT:<41}|\n"
        "    =============================================================\n"
    )
    
    uvicorn.run(
        "api.app:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,
        log_level="info"
    )


if __name__ == "__main__":
    main()
