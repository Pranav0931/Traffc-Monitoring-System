"""
Main entry point for the Traffic Monitoring System backend.
"""

import uvicorn
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

from config.settings import settings
from loguru import logger

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
    logger.info(f"""
    ╔══════════════════════════════════════════════════════════════╗
    ║     AI-Based Traffic Monitoring & Emergency Priority System  ║
    ║                                                              ║
    ║     Location: {settings.LOCATION_NAME:<43} ║
    ║     Server:   http://{settings.HOST}:{settings.PORT:<36} ║
    ╚══════════════════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(
        "api.app:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )


if __name__ == "__main__":
    main()
