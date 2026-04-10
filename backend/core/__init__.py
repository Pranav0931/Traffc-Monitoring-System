"""Core processing modules."""
from .video_capture import VideoCapture
from .detection import VehicleDetector, Detection
from .tracking import MultiObjectTracker, Track
from .counting import VehicleCounter, VehicleCount, count_vehicles_in_rois
from .congestion import CongestionComputer, CongestionLevel, CongestionStatus
from .emergency import EmergencyPrioritySystem, EmergencyStatus, EmergencyType
from .pipeline import TrafficPipeline, TrafficState, get_pipeline
from .roi import LANE_ROIS, draw_rois, is_point_in_roi, get_lane_rois
from .signal_control import calculate_signal_times, get_priority_lane, get_signal_status

__all__ = [
    "VideoCapture",
    "VehicleDetector",
    "Detection",
    "MultiObjectTracker", 
    "Track",
    "VehicleCounter",
    "VehicleCount",
    "count_vehicles_in_rois",
    "CongestionComputer",
    "CongestionLevel",
    "CongestionStatus",
    "EmergencyPrioritySystem",
    "EmergencyStatus",
    "EmergencyType",
    "TrafficPipeline",
    "TrafficState",
    "get_pipeline",
    "LANE_ROIS",
    "draw_rois",
    "is_point_in_roi",
    "get_lane_rois",
    "calculate_signal_times",
    "get_priority_lane",
    "get_signal_status",
]
