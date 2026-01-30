"""
Configuration settings for the Traffic Monitoring System.
All system parameters are centralized here for easy tuning.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application configuration settings."""
    
    # Application Info
    APP_NAME: str = "AI Traffic Monitoring System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Video Source Configuration
    # Can be: webcam index (0, 1), RTSP URL, or video file path
    VIDEO_SOURCE: str = "demo"  # "demo" uses built-in demo mode
    VIDEO_FPS: int = 30
    FRAME_WIDTH: int = 1280
    FRAME_HEIGHT: int = 720
    
    # YOLO Model Configuration
    YOLO_MODEL: str = "yolov8n.pt"  # Use nano model for speed, can upgrade to yolov8s/m/l
    YOLO_CONFIDENCE: float = 0.5
    YOLO_IOU_THRESHOLD: float = 0.45
    DEVICE: str = "auto"  # "auto", "cpu", "cuda", "mps"
    
    # Vehicle Classes (COCO dataset IDs)
    # Standard COCO classes for vehicles
    VEHICLE_CLASSES: dict = {
        2: "car",
        3: "motorcycle",  # mapped to bike
        5: "bus",
        7: "truck",
    }
    
    # Emergency Vehicle Detection
    # These will be detected via custom classification or color/marking detection
    EMERGENCY_COLORS: dict = {
        "ambulance": [(255, 255, 255), (255, 0, 0)],  # White with red
        "firebrigade": [(255, 0, 0), (255, 165, 0)]   # Red with orange
    }
    
    # Tracking Configuration
    TRACKER_TYPE: str = "bytetrack"  # "bytetrack" or "botsort"
    TRACK_BUFFER: int = 30
    MATCH_THRESHOLD: float = 0.8
    
    # Counting Configuration
    COUNT_LINE_POSITION: float = 0.6  # Vertical position (0-1) for counting line
    MIN_TRACK_LENGTH: int = 5  # Minimum frames to count as valid vehicle
    
    # Congestion Thresholds
    CONGESTION_LOW_THRESHOLD: int = 10
    CONGESTION_MEDIUM_THRESHOLD: int = 20
    
    # Update Intervals (seconds)
    WEBSOCKET_UPDATE_INTERVAL: float = 2.0
    CONGESTION_UPDATE_INTERVAL: float = 3.0
    
    # Location Configuration (Nagpur, Maharashtra)
    LOCATION_NAME: str = "Variety Square, Nagpur"
    LOCATION_LAT: float = 21.1458
    LOCATION_LNG: float = 79.0882
    
    # Additional Monitoring Points in Nagpur
    MONITORING_POINTS: list = [
        {"name": "Variety Square", "lat": 21.1458, "lng": 79.0882},
        {"name": "Sitabuldi", "lat": 21.1433, "lng": 79.0849},
        {"name": "Dharampeth", "lat": 21.1391, "lng": 79.0567},
        {"name": "Sadar", "lat": 21.1550, "lng": 79.0880},
    ]
    
    # Demo Mode Configuration
    DEMO_MODE: bool = True
    DEMO_VIDEO_URL: str = ""  # Optional demo video URL
    
    # Advanced Features
    ENABLE_SPEED_ESTIMATION: bool = True
    ENABLE_FLOW_ANALYSIS: bool = True
    ENABLE_HEATMAP: bool = True
    STREAM_VIDEO_FEED: bool = True
    VIDEO_QUALITY: str = "high"  # low, medium, high
    
    # Paths
    BASE_DIR: Path = Path(__file__).parent.parent
    MODELS_DIR: Path = BASE_DIR / "models"
    LOGS_DIR: Path = BASE_DIR / "logs"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()

# Ensure directories exist
settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
settings.LOGS_DIR.mkdir(parents=True, exist_ok=True)
