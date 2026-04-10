"""
Main Traffic Processing Pipeline.
Orchestrates all processing components for real-time traffic analysis.
"""

import asyncio
import time
from typing import Dict, Optional, Callable, List
from dataclasses import dataclass
from datetime import datetime
from loguru import logger

from core.video_capture import VideoCapture
from core.detection import VehicleDetector, Detection
from core.tracking import MultiObjectTracker, Track
from core.counting import VehicleCounter, VehicleCount, count_vehicles_in_rois
from core.congestion import CongestionComputer, CongestionStatus
from core.emergency import EmergencyPrioritySystem, EmergencyStatus
from core.roi import draw_rois, LANE_ROIS
from core.signal_control import calculate_signal_times, get_priority_lane, get_signal_status
from config.settings import settings


@dataclass
class VehicleInfo:
    """Information about a detected vehicle."""
    id: int
    type: str
    x: int
    y: int
    width: int
    height: int
    speed: float = 0.0
    direction: str = "unknown"
    is_emergency: bool = False


@dataclass
class TrafficState:
    """Complete traffic state snapshot."""
    cars: int
    bikes: int
    buses: int
    trucks: int
    ambulances: int
    firebrigade: int
    total: int
    congestion: str
    congestion_color: str
    emergency_mode: bool
    emergency_type: Optional[str]
    emergency_message: str
    area: str
    lat: float
    lng: float
    timestamp: str
    frame_count: int
    fps: float
    # New advanced fields
    vehicles: List[Dict] = None
    avg_speed: float = 0.0
    flow_rate: float = 0.0
    peak_hour: bool = False
    monitoring_points: List[Dict] = None
    density_score: float = 0.0
    # ROI-based signal control fields
    lane_counts: Dict = None
    signal_times: Dict = None
    priority_lane: Optional[str] = None
    signal_mode: str = "NORMAL"
    # Base64 encoded frame for live video streaming
    frame: str = ""
    
    def __post_init__(self):
        if self.vehicles is None:
            self.vehicles = []
        if self.monitoring_points is None:
            self.monitoring_points = []
        if self.lane_counts is None:
            self.lane_counts = {}
        if self.signal_times is None:
            self.signal_times = {}
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "cars": self.cars,
            "bikes": self.bikes,
            "buses": self.buses,
            "trucks": self.trucks,
            "ambulances": self.ambulances,
            "firebrigade": self.firebrigade,
            "total": self.total,
            "congestion": self.congestion,
            "congestion_color": self.congestion_color,
            "emergency_mode": self.emergency_mode,
            "emergency_type": self.emergency_type,
            "emergency_message": self.emergency_message,
            "area": self.area,
            "lat": self.lat,
            "lng": self.lng,
            "timestamp": self.timestamp,
            "frame_count": self.frame_count,
            "fps": self.fps,
            "vehicles": self.vehicles,
            "avg_speed": self.avg_speed,
            "flow_rate": self.flow_rate,
            "peak_hour": self.peak_hour,
            "monitoring_points": self.monitoring_points,
            "density_score": self.density_score,
            # ROI-based signal control data
            "lane_counts": self.lane_counts,
            "signal_times": self.signal_times,
            "priority_lane": self.priority_lane,
            "signal_mode": self.signal_mode,
            "frame": self.frame,
        }


class TrafficPipeline:
    """
    Main traffic processing pipeline.
    Coordinates video capture, detection, tracking, counting, and analysis.
    """
    
    def __init__(self, video_source: Optional[str] = None):
        """
        Initialize the traffic pipeline.
        
        Args:
            video_source: Optional video source override
        """
        # Initialize components
        self.video_capture = VideoCapture(video_source)
        self.detector = VehicleDetector()
        self.tracker = MultiObjectTracker()
        self.counter = VehicleCounter(frame_height=settings.FRAME_HEIGHT)
        self.congestion = CongestionComputer()
        self.emergency_system = EmergencyPrioritySystem()
        
        # State
        self.is_running = False
        self.current_state: Optional[TrafficState] = None
        self.frame_count = 0
        self.start_time = 0
        self.last_state_update = 0
        
        # Callbacks for state updates
        self.on_state_update: Optional[Callable[[TrafficState], None]] = None
        
        # Processing metrics
        self.processing_times: List[float] = []
        self.avg_fps = 0
        
    async def initialize(self) -> bool:
        """Initialize all pipeline components."""
        try:
            # Initialize detector
            self.detector.initialize()
            
            # Start video capture
            await self.video_capture.start()
            
            logger.info("Traffic pipeline initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize pipeline: {e}")
            return False
    
    async def start(self):
        """Start the processing pipeline."""
        if self.is_running:
            return
        
        self.is_running = True
        self.start_time = time.time()
        logger.info("Traffic pipeline started")
        
        # Start processing loop
        asyncio.create_task(self._processing_loop())
    
    async def stop(self):
        """Stop the processing pipeline."""
        self.is_running = False
        await self.video_capture.stop()
        logger.info("Traffic pipeline stopped")
    
    async def _processing_loop(self):
        """Main processing loop."""
        while self.is_running:
            try:
                process_start = time.time()
                
                # Capture frame
                success, frame = await self.video_capture.read_frame()
                if not success or frame is None:
                    await asyncio.sleep(0.01)
                    continue
                
                self.frame_count += 1
                
                # Run detection
                detections = self.detector.detect(frame)
                
                # Update tracking
                tracks = self.tracker.update(detections)
                
                # Update counts
                counts = self.counter.update(tracks)
                
                # Compute congestion
                congestion_status = self.congestion.compute(counts)
                
                # Update emergency system
                emergency_status = self.emergency_system.update(tracks, counts)
                
                # --- ROI-based lane counting and signal control ---
                lane_counts = count_vehicles_in_rois(detections)
                signal_times = calculate_signal_times(lane_counts)
                priority_lane = get_priority_lane(lane_counts)
                
                # Draw ROIs and encode frame to base64
                drawn_frame = draw_rois(frame.copy(), lane_counts, signal_times, priority_lane)
                import cv2, base64
                # Downscale slightly for performance if needed, or compress
                # We'll stick to original size but use higher compression
                encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 70]
                _, buffer = cv2.imencode('.jpg', drawn_frame, encode_param)
                frame_b64 = base64.b64encode(buffer).decode('utf-8')
                logger.info(f"Encoded frame length: {len(frame_b64)}")
                
                # Create state snapshot (with lane data and base64 frame)
                self.current_state = self._create_state(
                    counts, congestion_status, emergency_status,
                    lane_counts=lane_counts,
                    signal_times=signal_times,
                    priority_lane=priority_lane,
                    frame_b64=frame_b64,
                )
                
                # Trigger callback if set
                if self.on_state_update:
                    self.on_state_update(self.current_state)
                
                # Calculate processing metrics
                process_time = time.time() - process_start
                self.processing_times.append(process_time)
                if len(self.processing_times) > 100:
                    self.processing_times = self.processing_times[-100:]
                self.avg_fps = 1.0 / (sum(self.processing_times) / len(self.processing_times))
                
                self.last_state_update = time.time()
                
                # Control frame rate
                target_interval = 1.0 / settings.VIDEO_FPS
                elapsed = time.time() - process_start
                if elapsed < target_interval:
                    await asyncio.sleep(target_interval - elapsed)
                    
            except Exception as e:
                logger.error(f"Processing error: {e}")
                await asyncio.sleep(0.1)
    
    def _create_state(self, counts: VehicleCount, 
                      congestion: CongestionStatus,
                      emergency: EmergencyStatus,
                      lane_counts: Dict = None,
                      signal_times: Dict = None,
                      priority_lane: str = None,
                      frame_b64: str = "") -> TrafficState:
        """
        Create a complete traffic state snapshot.
        
        Args:
            counts: Current vehicle counts
            congestion: Current congestion status
            emergency: Current emergency status
            lane_counts: Vehicle counts per ROI lane
            signal_times: Calculated signal times per lane
            priority_lane: Lane with highest vehicle count
            frame_b64: Base64 encoded JPEG frame
            
        Returns:
            TrafficState object
        """
        # Get vehicle positions for visualization
        vehicles = []
        for track in self.tracker.get_confirmed_tracks():
            x1, y1, x2, y2 = track.bbox
            vehicles.append({
                "id": track.track_id,
                "type": track.class_name,
                "x": x1,
                "y": y1,
                "width": x2 - x1,
                "height": y2 - y1,
                "speed": abs(track.velocity[0]) + abs(track.velocity[1]),
                "direction": self._get_direction(track.velocity),
                "is_emergency": track.is_emergency
            })
        
        # Calculate advanced metrics
        avg_speed = sum(v["speed"] for v in vehicles) / len(vehicles) if vehicles else 0
        flow_rate = counts.total_with_emergency / max(1, (time.time() - self.start_time) / 60)
        
        # Check if peak hour (8-10 AM or 5-8 PM)
        current_hour = datetime.now().hour
        peak_hour = (8 <= current_hour <= 10) or (17 <= current_hour <= 20)
        
        # Generate monitoring points status
        import random
        monitoring_points = []
        for point in settings.MONITORING_POINTS:
            monitoring_points.append({
                **point,
                "congestion": random.choice(["LOW", "MEDIUM", "HIGH"]),
                "vehicles": random.randint(5, 30),
                "emergency": random.random() < 0.05
            })
        
        # Calculate density score (0-100)
        density_score = min(100, (counts.total_with_emergency / 40) * 100)
        
        # Determine signal mode from lane counts
        from core.signal_control import THRESHOLD
        signal_mode = "NORMAL"
        if lane_counts:
            overloaded = sum(1 for c in lane_counts.values() if c >= THRESHOLD)
            if overloaded >= len(lane_counts):
                signal_mode = "CRITICAL"
            elif overloaded > 0:
                signal_mode = "ADAPTIVE"
        
        return TrafficState(
            cars=counts.cars,
            bikes=counts.bikes,
            buses=counts.buses,
            trucks=counts.trucks,
            ambulances=counts.ambulances,
            firebrigade=counts.firebrigade,
            total=counts.total_with_emergency,
            congestion=congestion.level.value,
            congestion_color=congestion.color,
            emergency_mode=emergency.emergency_mode,
            emergency_type=emergency.emergency_type,
            emergency_message=emergency.message,
            area=settings.LOCATION_NAME,
            lat=settings.LOCATION_LAT,
            lng=settings.LOCATION_LNG,
            timestamp=datetime.now().isoformat(),
            frame_count=self.frame_count,
            fps=round(self.avg_fps, 1),
            vehicles=vehicles,
            avg_speed=round(avg_speed, 1),
            flow_rate=round(flow_rate, 1),
            peak_hour=peak_hour,
            monitoring_points=monitoring_points,
            density_score=round(density_score, 1),
            # ROI-based signal control data
            lane_counts=lane_counts or {},
            signal_times=signal_times or {},
            priority_lane=priority_lane,
            signal_mode=signal_mode,
            frame=frame_b64,
        )
    
    def _get_direction(self, velocity: tuple) -> str:
        """Determine direction from velocity vector."""
        vx, vy = velocity
        if abs(vx) < 1 and abs(vy) < 1:
            return "stationary"
        if abs(vx) > abs(vy):
            return "east" if vx > 0 else "west"
        else:
            return "south" if vy > 0 else "north"
    
    def get_current_state(self) -> Optional[TrafficState]:
        """Get the current traffic state."""
        return self.current_state
    
    def get_statistics(self) -> Dict:
        """Get pipeline statistics."""
        elapsed = time.time() - self.start_time if self.start_time else 0
        return {
            "is_running": self.is_running,
            "frame_count": self.frame_count,
            "uptime_seconds": elapsed,
            "average_fps": round(self.avg_fps, 1),
            "detector": {
                "total_detections": self.detector.total_detections
            },
            "tracker": {
                "active_tracks": self.tracker.active_tracks,
                "total_tracks_created": self.tracker.total_tracks_created
            },
            "counter": self.counter.get_statistics(),
            "congestion": self.congestion.get_statistics(),
            "emergency": self.emergency_system.get_statistics()
        }


# Global pipeline instance
_pipeline: Optional[TrafficPipeline] = None


def get_pipeline() -> TrafficPipeline:
    """Get or create the global pipeline instance."""
    global _pipeline
    if _pipeline is None:
        _pipeline = TrafficPipeline()
    return _pipeline


async def initialize_pipeline() -> bool:
    """Initialize the global pipeline."""
    pipeline = get_pipeline()
    return await pipeline.initialize()


async def start_pipeline():
    """Start the global pipeline."""
    pipeline = get_pipeline()
    await pipeline.start()


async def stop_pipeline():
    """Stop the global pipeline."""
    pipeline = get_pipeline()
    await pipeline.stop()
