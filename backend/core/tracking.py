"""
Multi-Object Tracking Engine.
Implements ByteTrack-style tracking for consistent vehicle identification across frames.
"""

import numpy as np
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field
from collections import defaultdict
import time
from loguru import logger

from core.detection import Detection
from config.settings import settings


@dataclass
class Track:
    """Represents a tracked object across frames."""
    track_id: int
    class_name: str
    bbox: Tuple[int, int, int, int]
    confidence: float
    is_emergency: bool = False
    emergency_type: Optional[str] = None
    age: int = 0
    hits: int = 1
    time_since_update: int = 0
    counted: bool = False
    velocity: Tuple[float, float] = (0.0, 0.0)
    history: List[Tuple[int, int]] = field(default_factory=list)
    
    @property
    def center(self) -> Tuple[int, int]:
        x1, y1, x2, y2 = self.bbox
        return ((x1 + x2) // 2, (y1 + y2) // 2)
    
    @property
    def is_confirmed(self) -> bool:
        """Track is confirmed if it has enough hits."""
        return self.hits >= settings.MIN_TRACK_LENGTH


class MultiObjectTracker:
    """
    ByteTrack-inspired multi-object tracker.
    Maintains consistent IDs across frames for accurate counting.
    """
    
    def __init__(self):
        """Initialize the tracker."""
        self.tracks: Dict[int, Track] = {}
        self.next_track_id = 1
        self.max_age = settings.TRACK_BUFFER
        self.match_threshold = settings.MATCH_THRESHOLD
        
        # Tracking statistics
        self.total_tracks_created = 0
        self.active_tracks = 0
        
    def _iou(self, bbox1: Tuple, bbox2: Tuple) -> float:
        """
        Calculate Intersection over Union between two bounding boxes.
        
        Args:
            bbox1: First bounding box (x1, y1, x2, y2)
            bbox2: Second bounding box (x1, y1, x2, y2)
            
        Returns:
            IoU score between 0 and 1
        """
        x1_1, y1_1, x2_1, y2_1 = bbox1
        x1_2, y1_2, x2_2, y2_2 = bbox2
        
        # Calculate intersection
        xi1 = max(x1_1, x1_2)
        yi1 = max(y1_1, y1_2)
        xi2 = min(x2_1, x2_2)
        yi2 = min(y2_1, y2_2)
        
        if xi2 <= xi1 or yi2 <= yi1:
            return 0.0
        
        inter_area = (xi2 - xi1) * (yi2 - yi1)
        
        # Calculate union
        box1_area = (x2_1 - x1_1) * (y2_1 - y1_1)
        box2_area = (x2_2 - x1_2) * (y2_2 - y1_2)
        union_area = box1_area + box2_area - inter_area
        
        if union_area <= 0:
            return 0.0
        
        return inter_area / union_area
    
    def _distance(self, center1: Tuple[int, int], center2: Tuple[int, int]) -> float:
        """Calculate Euclidean distance between two centers."""
        return np.sqrt((center1[0] - center2[0])**2 + (center1[1] - center2[1])**2)
    
    def _compute_cost_matrix(self, detections: List[Detection]) -> np.ndarray:
        """
        Compute cost matrix for matching detections to tracks.
        Uses combination of IoU and center distance.
        
        Args:
            detections: List of current detections
            
        Returns:
            Cost matrix (tracks x detections)
        """
        track_list = list(self.tracks.values())
        n_tracks = len(track_list)
        n_detections = len(detections)
        
        if n_tracks == 0 or n_detections == 0:
            return np.array([])
        
        cost_matrix = np.zeros((n_tracks, n_detections))
        
        for i, track in enumerate(track_list):
            for j, det in enumerate(detections):
                # IoU-based cost
                iou = self._iou(track.bbox, det.bbox)
                
                # Distance-based cost (normalized)
                dist = self._distance(track.center, det.center)
                max_dist = 500  # Maximum expected distance
                dist_cost = min(dist / max_dist, 1.0)
                
                # Class matching penalty
                class_penalty = 0.0 if track.class_name == det.class_name else 0.3
                
                # Combined cost (lower is better)
                cost_matrix[i, j] = (1 - iou) * 0.5 + dist_cost * 0.3 + class_penalty * 0.2
        
        return cost_matrix
    
    def _hungarian_matching(self, cost_matrix: np.ndarray, threshold: float = 0.5) -> List[Tuple[int, int]]:
        """
        Simple greedy matching (can be replaced with Hungarian algorithm).
        
        Args:
            cost_matrix: Cost matrix
            threshold: Maximum cost threshold for matching
            
        Returns:
            List of (track_idx, detection_idx) matches
        """
        if cost_matrix.size == 0:
            return []
        
        matches = []
        used_detections = set()
        used_tracks = set()
        
        # Sort all costs
        n_tracks, n_detections = cost_matrix.shape
        costs = []
        for i in range(n_tracks):
            for j in range(n_detections):
                costs.append((cost_matrix[i, j], i, j))
        
        costs.sort(key=lambda x: x[0])
        
        # Greedy matching
        for cost, track_idx, det_idx in costs:
            if cost > threshold:
                break
            if track_idx not in used_tracks and det_idx not in used_detections:
                matches.append((track_idx, det_idx))
                used_tracks.add(track_idx)
                used_detections.add(det_idx)
        
        return matches
    
    def update(self, detections: List[Detection]) -> List[Track]:
        """
        Update tracks with new detections.
        
        Args:
            detections: List of current frame detections
            
        Returns:
            List of updated tracks
        """
        track_list = list(self.tracks.values())
        
        # Compute cost matrix
        cost_matrix = self._compute_cost_matrix(detections)
        
        # Match detections to tracks
        matches = self._hungarian_matching(cost_matrix, threshold=1 - self.match_threshold)
        
        matched_tracks = set()
        matched_detections = set()
        
        # Update matched tracks
        for track_idx, det_idx in matches:
            track = track_list[track_idx]
            det = detections[det_idx]
            
            # Calculate velocity
            old_center = track.center
            new_center = det.center
            track.velocity = (new_center[0] - old_center[0], new_center[1] - old_center[1])
            
            # Update track
            track.bbox = det.bbox
            track.confidence = det.confidence
            track.hits += 1
            track.time_since_update = 0
            track.age += 1
            track.history.append(new_center)
            
            # Keep history limited
            if len(track.history) > 50:
                track.history = track.history[-50:]
            
            # Update emergency status
            if det.is_emergency:
                track.is_emergency = True
                track.emergency_type = det.emergency_type
            
            matched_tracks.add(track.track_id)
            matched_detections.add(det_idx)
        
        # Create new tracks for unmatched detections
        for i, det in enumerate(detections):
            if i not in matched_detections:
                new_track = Track(
                    track_id=self.next_track_id,
                    class_name=det.class_name,
                    bbox=det.bbox,
                    confidence=det.confidence,
                    is_emergency=det.is_emergency,
                    emergency_type=det.emergency_type,
                    history=[det.center]
                )
                self.tracks[self.next_track_id] = new_track
                self.next_track_id += 1
                self.total_tracks_created += 1
        
        # Age unmatched tracks
        tracks_to_remove = []
        for track_id, track in self.tracks.items():
            if track_id not in matched_tracks:
                track.time_since_update += 1
                track.age += 1
                
                if track.time_since_update > self.max_age:
                    tracks_to_remove.append(track_id)
        
        # Remove dead tracks
        for track_id in tracks_to_remove:
            del self.tracks[track_id]
        
        self.active_tracks = len(self.tracks)
        
        # Return confirmed tracks
        return [t for t in self.tracks.values() if t.is_confirmed]
    
    def get_all_tracks(self) -> List[Track]:
        """Get all active tracks."""
        return list(self.tracks.values())
    
    def get_confirmed_tracks(self) -> List[Track]:
        """Get only confirmed tracks."""
        return [t for t in self.tracks.values() if t.is_confirmed]
    
    def reset(self):
        """Reset the tracker."""
        self.tracks.clear()
        self.next_track_id = 1
        self.total_tracks_created = 0
        self.active_tracks = 0
