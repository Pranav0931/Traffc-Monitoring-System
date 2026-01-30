"""Core processing modules."""
from .video_capture import VideoCapture
from .detection import VehicleDetector, Detection
from .tracking import MultiObjectTracker, Track
from .counting import VehicleCounter, VehicleCount
from .congestion import CongestionComputer, CongestionLevel, CongestionStatus
from .emergency import EmergencyPrioritySystem, EmergencyStatus, EmergencyType
from .pipeline import TrafficPipeline, TrafficState, get_pipeline

__all__ = [
    "VideoCapture",
    "VehicleDetector",
    "Detection",
    "MultiObjectTracker", 
    "Track",
    "VehicleCounter",
    "VehicleCount",
    "CongestionComputer",
    "CongestionLevel",
    "CongestionStatus",
    "EmergencyPrioritySystem",
    "EmergencyStatus",
    "EmergencyType",
    "TrafficPipeline",
    "TrafficState",
    "get_pipeline"
]
