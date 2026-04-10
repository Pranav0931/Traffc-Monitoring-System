"""
Vehicle Counting Engine.
Counts unique vehicles crossing the monitoring zone.
"""

from typing import Dict, List, Set, Optional
from dataclasses import dataclass, field
from collections import defaultdict
import time
from loguru import logger

from core.tracking import Track
from config.settings import settings


@dataclass
class VehicleCount:
    """Represents current vehicle counts."""
    cars: int = 0
    bikes: int = 0
    buses: int = 0
    trucks: int = 0
    ambulances: int = 0
    firebrigade: int = 0
    
    @property
    def total(self) -> int:
        """Total count excluding emergency vehicles."""
        return self.cars + self.bikes + self.buses + self.trucks
    
    @property
    def total_with_emergency(self) -> int:
        """Total count including emergency vehicles."""
        return self.total + self.ambulances + self.firebrigade
    
    @property
    def has_emergency(self) -> bool:
        """Check if any emergency vehicle is present."""
        return self.ambulances > 0 or self.firebrigade > 0
    
    @property
    def emergency_type(self) -> Optional[str]:
        """Get the type of emergency vehicle present."""
        if self.ambulances > 0:
            return "ambulance"
        elif self.firebrigade > 0:
            return "firebrigade"
        return None
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            "cars": self.cars,
            "bikes": self.bikes,
            "buses": self.buses,
            "trucks": self.trucks,
            "ambulances": self.ambulances,
            "firebrigade": self.firebrigade,
            "total": self.total_with_emergency
        }
    
    def reset(self):
        """Reset all counts to zero."""
        self.cars = 0
        self.bikes = 0
        self.buses = 0
        self.trucks = 0
        self.ambulances = 0
        self.firebrigade = 0


class VehicleCounter:
    """
    Counts unique vehicles passing through the monitoring zone.
    Uses track IDs to ensure each vehicle is counted only once.
    """
    
    def __init__(self, frame_height: int = 720):
        """
        Initialize the vehicle counter.
        
        Args:
            frame_height: Height of video frame for counting line placement
        """
        self.frame_height = frame_height
        self.count_line_y = int(frame_height * settings.COUNT_LINE_POSITION)
        
        # Current window counts (vehicles in view)
        self.current_counts = VehicleCount()
        
        # Total accumulated counts (all vehicles that passed)
        self.total_counts = VehicleCount()
        
        # Track IDs that have been counted
        self.counted_track_ids: Set[int] = set()
        
        # Track IDs currently in view
        self.active_track_ids: Set[int] = set()
        
        # History for smoothing
        self.count_history: List[VehicleCount] = []
        self.history_window = 10
        
        # Timestamps
        self.last_update = time.time()
        self.start_time = time.time()
    
    def _has_crossed_line(self, track: Track) -> bool:
        """
        Check if a track has crossed the counting line.
        
        Args:
            track: Track to check
            
        Returns:
            True if track crossed the line
        """
        if len(track.history) < 2:
            return False
        
        prev_y = track.history[-2][1]
        curr_y = track.history[-1][1]
        
        # Check if crossed line in either direction
        crossed = (prev_y < self.count_line_y <= curr_y) or \
                  (prev_y > self.count_line_y >= curr_y)
        
        return crossed
    
    def _increment_count(self, class_name: str, counts: VehicleCount):
        """
        Increment the count for a vehicle class.
        
        Args:
            class_name: Class name of the vehicle
            counts: VehicleCount object to update
        """
        if class_name == "car":
            counts.cars += 1
        elif class_name == "bike":
            counts.bikes += 1
        elif class_name == "bus":
            counts.buses += 1
        elif class_name == "truck":
            counts.trucks += 1
        elif class_name == "ambulance":
            counts.ambulances += 1
        elif class_name == "firebrigade":
            counts.firebrigade += 1
    
    def _set_count(self, class_name: str, value: int, counts: VehicleCount):
        """Set the count for a vehicle class."""
        if class_name == "car":
            counts.cars = value
        elif class_name == "bike":
            counts.bikes = value
        elif class_name == "bus":
            counts.buses = value
        elif class_name == "truck":
            counts.trucks = value
        elif class_name == "ambulance":
            counts.ambulances = value
        elif class_name == "firebrigade":
            counts.firebrigade = value
    
    def update(self, tracks: List[Track]) -> VehicleCount:
        """
        Update counts based on current tracks.
        
        Args:
            tracks: List of confirmed tracks
            
        Returns:
            Current vehicle counts
        """
        # Count vehicles currently in view by class
        current_class_counts: Dict[str, int] = defaultdict(int)
        current_active_ids: Set[int] = set()
        
        for track in tracks:
            if track.is_confirmed:
                current_class_counts[track.class_name] += 1
                current_active_ids.add(track.track_id)
                
                # Check if this track should be counted for total
                if track.track_id not in self.counted_track_ids:
                    if self._has_crossed_line(track) or track.hits > settings.MIN_TRACK_LENGTH:
                        self._increment_count(track.class_name, self.total_counts)
                        self.counted_track_ids.add(track.track_id)
        
        # Update current counts (vehicles in view)
        self.current_counts = VehicleCount()
        for class_name, count in current_class_counts.items():
            self._set_count(class_name, count, self.current_counts)
        
        # Update active track IDs
        self.active_track_ids = current_active_ids
        
        # Store in history for smoothing
        self.count_history.append(VehicleCount(
            cars=self.current_counts.cars,
            bikes=self.current_counts.bikes,
            buses=self.current_counts.buses,
            trucks=self.current_counts.trucks,
            ambulances=self.current_counts.ambulances,
            firebrigade=self.current_counts.firebrigade
        ))
        
        # Keep history limited
        if len(self.count_history) > self.history_window:
            self.count_history = self.count_history[-self.history_window:]
        
        self.last_update = time.time()
        
        return self.current_counts
    
    def get_smoothed_counts(self) -> VehicleCount:
        """
        Get smoothed counts averaged over recent history.
        Helps reduce flickering in display.
        
        Returns:
            Smoothed vehicle counts
        """
        if not self.count_history:
            return self.current_counts
        
        # Calculate average over history
        avg_counts = VehicleCount()
        n = len(self.count_history)
        
        avg_counts.cars = round(sum(h.cars for h in self.count_history) / n)
        avg_counts.bikes = round(sum(h.bikes for h in self.count_history) / n)
        avg_counts.buses = round(sum(h.buses for h in self.count_history) / n)
        avg_counts.trucks = round(sum(h.trucks for h in self.count_history) / n)
        avg_counts.ambulances = max(h.ambulances for h in self.count_history)  # Don't average emergency
        avg_counts.firebrigade = max(h.firebrigade for h in self.count_history)
        
        return avg_counts
    
    def get_current_counts(self) -> VehicleCount:
        """Get current instantaneous counts."""
        return self.current_counts
    
    def get_total_counts(self) -> VehicleCount:
        """Get total accumulated counts."""
        return self.total_counts
    
    def get_statistics(self) -> Dict:
        """Get counting statistics."""
        elapsed = time.time() - self.start_time
        return {
            "current": self.current_counts.to_dict(),
            "total": self.total_counts.to_dict(),
            "unique_vehicles_tracked": len(self.counted_track_ids),
            "active_tracks": len(self.active_track_ids),
            "uptime_seconds": elapsed,
            "vehicles_per_minute": self.total_counts.total_with_emergency / (elapsed / 60) if elapsed > 0 else 0
        }
    
    def reset(self):
        """Reset all counts."""
        self.current_counts.reset()
        self.total_counts.reset()
        self.counted_track_ids.clear()
        self.active_track_ids.clear()
        self.count_history.clear()
        self.start_time = time.time()


# ====================================================================
# ROI-Based Vehicle Counting (Additive — does not affect existing logic)
# ====================================================================

def count_vehicles_in_rois(detections, lane_rois: Dict = None) -> Dict[str, int]:
    """
    Count how many detected vehicles fall inside each lane ROI.

    For each detection bounding box:
      - Compute center point
      - Check which ROI box contains the center
      - Increment count for that lane

    Args:
        detections: List of Detection objects (from detection.py)
        lane_rois: Dict mapping lane_id -> (x1, y1, x2, y2).
                   If None, uses default LANE_ROIS from roi module.

    Returns:
        Dictionary mapping lane_id -> vehicle count inside that lane
        e.g. {"lane_1": 5, "lane_2": 3, "lane_3": 8}
    """
    from core.roi import LANE_ROIS, is_point_in_roi

    if lane_rois is None:
        lane_rois = LANE_ROIS

    # Initialize counts to zero for every lane
    lane_counts: Dict[str, int] = {lane_id: 0 for lane_id in lane_rois}

    for det in detections:
        # Compute center of the detection bounding box
        x1, y1, x2, y2 = det.bbox
        cx = (x1 + x2) // 2
        cy = (y1 + y2) // 2

        # Check which ROI contains this center point
        for lane_id, roi in lane_rois.items():
            if is_point_in_roi((cx, cy), roi):
                lane_counts[lane_id] += 1
                break  # A vehicle belongs to at most one lane

    return lane_counts
