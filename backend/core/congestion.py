"""
Congestion Computation Engine.
Dynamically calculates traffic congestion levels based on vehicle counts.
"""

from enum import Enum
from typing import Dict, Optional, Tuple
from dataclasses import dataclass
import time
from loguru import logger

from core.counting import VehicleCount
from config.settings import settings


class CongestionLevel(Enum):
    """Traffic congestion levels."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


@dataclass
class CongestionStatus:
    """Represents current congestion status."""
    level: CongestionLevel
    vehicle_count: int
    description: str
    color: str  # For UI display
    score: float  # 0-1 normalized score
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            "level": self.level.value,
            "vehicle_count": self.vehicle_count,
            "description": self.description,
            "color": self.color,
            "score": self.score
        }


class CongestionComputer:
    """
    Computes dynamic traffic congestion levels.
    Updates every few seconds based on current vehicle counts.
    """
    
    # Congestion thresholds
    LOW_THRESHOLD = settings.CONGESTION_LOW_THRESHOLD  # < 10 vehicles
    MEDIUM_THRESHOLD = settings.CONGESTION_MEDIUM_THRESHOLD  # < 20 vehicles
    
    # Color mapping for UI
    COLORS = {
        CongestionLevel.LOW: "#22c55e",      # Green
        CongestionLevel.MEDIUM: "#eab308",   # Yellow
        CongestionLevel.HIGH: "#ef4444"      # Red
    }
    
    # Descriptions
    DESCRIPTIONS = {
        CongestionLevel.LOW: "Traffic is flowing smoothly",
        CongestionLevel.MEDIUM: "Moderate traffic - some slowdowns expected",
        CongestionLevel.HIGH: "Heavy traffic - significant delays expected"
    }
    
    def __init__(self):
        """Initialize the congestion computer."""
        self.current_status: Optional[CongestionStatus] = None
        self.history: list = []
        self.last_update = time.time()
        self.update_interval = settings.CONGESTION_UPDATE_INTERVAL
        
    def _calculate_level(self, vehicle_count: int) -> CongestionLevel:
        """
        Calculate congestion level based on vehicle count.
        
        Args:
            vehicle_count: Total number of non-emergency vehicles
            
        Returns:
            CongestionLevel enum value
        """
        if vehicle_count < self.LOW_THRESHOLD:
            return CongestionLevel.LOW
        elif vehicle_count < self.MEDIUM_THRESHOLD:
            return CongestionLevel.MEDIUM
        else:
            return CongestionLevel.HIGH
    
    def _calculate_score(self, vehicle_count: int) -> float:
        """
        Calculate normalized congestion score (0-1).
        
        Args:
            vehicle_count: Total vehicle count
            
        Returns:
            Normalized score between 0 and 1
        """
        # Max expected vehicles for score calculation
        max_vehicles = 40
        score = min(vehicle_count / max_vehicles, 1.0)
        return round(score, 2)
    
    def compute(self, counts: VehicleCount) -> CongestionStatus:
        """
        Compute congestion status from vehicle counts.
        Emergency vehicles don't contribute to congestion.
        
        Args:
            counts: Current vehicle counts
            
        Returns:
            CongestionStatus object
        """
        # Calculate total excluding emergency vehicles
        total = counts.total  # Already excludes emergency vehicles
        
        level = self._calculate_level(total)
        score = self._calculate_score(total)
        
        status = CongestionStatus(
            level=level,
            vehicle_count=total,
            description=self.DESCRIPTIONS[level],
            color=self.COLORS[level],
            score=score
        )
        
        self.current_status = status
        self.last_update = time.time()
        
        # Store in history
        self.history.append({
            "timestamp": self.last_update,
            "level": level.value,
            "count": total,
            "score": score
        })
        
        # Keep history limited
        if len(self.history) > 100:
            self.history = self.history[-100:]
        
        return status
    
    def get_current_status(self) -> Optional[CongestionStatus]:
        """Get current congestion status."""
        return self.current_status
    
    def get_trend(self) -> str:
        """
        Analyze congestion trend over recent history.
        
        Returns:
            Trend indicator: "increasing", "decreasing", or "stable"
        """
        if len(self.history) < 5:
            return "stable"
        
        recent = self.history[-5:]
        scores = [h["score"] for h in recent]
        
        # Calculate average change
        changes = [scores[i+1] - scores[i] for i in range(len(scores)-1)]
        avg_change = sum(changes) / len(changes)
        
        if avg_change > 0.05:
            return "increasing"
        elif avg_change < -0.05:
            return "decreasing"
        else:
            return "stable"
    
    def should_update(self) -> bool:
        """Check if enough time has passed for an update."""
        return time.time() - self.last_update >= self.update_interval
    
    def get_statistics(self) -> Dict:
        """Get congestion statistics."""
        if not self.history:
            return {"average_level": "N/A", "trend": "stable"}
        
        # Calculate average score
        avg_score = sum(h["score"] for h in self.history) / len(self.history)
        
        # Determine average level
        if avg_score < 0.25:
            avg_level = "LOW"
        elif avg_score < 0.5:
            avg_level = "MEDIUM"
        else:
            avg_level = "HIGH"
        
        return {
            "current": self.current_status.to_dict() if self.current_status else None,
            "average_level": avg_level,
            "average_score": round(avg_score, 2),
            "trend": self.get_trend(),
            "samples": len(self.history)
        }
