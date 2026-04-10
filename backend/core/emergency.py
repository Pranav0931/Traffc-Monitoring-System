"""
Emergency Vehicle Priority Detection System.
Handles detection and alerting for ambulance and fire brigade vehicles.
"""

from typing import Optional, Dict, List, Tuple
from dataclasses import dataclass, field
from enum import Enum
import time
from loguru import logger

from core.counting import VehicleCount
from core.tracking import Track
from config.settings import settings


class EmergencyType(Enum):
    """Types of emergency vehicles."""
    NONE = "none"
    AMBULANCE = "ambulance"
    FIREBRIGADE = "firebrigade"


class PriorityLevel(Enum):
    """Priority clearance levels."""
    NORMAL = "normal"
    ELEVATED = "elevated"
    CRITICAL = "critical"


@dataclass
class EmergencyAlert:
    """Represents an active emergency alert."""
    alert_id: str
    emergency_type: EmergencyType
    priority_level: PriorityLevel
    track_id: int
    detected_at: float
    last_seen: float
    position: Tuple[int, int]
    message: str
    is_active: bool = True
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            "alert_id": self.alert_id,
            "emergency_type": self.emergency_type.value,
            "priority_level": self.priority_level.value,
            "track_id": self.track_id,
            "detected_at": self.detected_at,
            "last_seen": self.last_seen,
            "position": self.position,
            "message": self.message,
            "is_active": self.is_active,
            "duration_seconds": time.time() - self.detected_at
        }


@dataclass
class EmergencyStatus:
    """Current emergency mode status."""
    emergency_mode: bool
    emergency_type: Optional[str]
    priority_level: str
    active_alerts: List[EmergencyAlert]
    message: str
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            "emergency_mode": self.emergency_mode,
            "emergency_type": self.emergency_type,
            "priority_level": self.priority_level,
            "active_alerts": [a.to_dict() for a in self.active_alerts],
            "alert_count": len(self.active_alerts),
            "message": self.message
        }


class EmergencyPrioritySystem:
    """
    Emergency Vehicle Priority Detection and Alert System.
    Monitors for ambulances and fire brigade vehicles and triggers priority mode.
    """
    
    # Alert messages
    ALERT_MESSAGES = {
        EmergencyType.AMBULANCE: "[ALERT] Emergency Vehicle Detected - Ambulance - Priority Clearance Required",
        EmergencyType.FIREBRIGADE: "[ALERT] Emergency Vehicle Detected - Fire Brigade - Priority Clearance Required"
    }
    
    # Priority levels based on emergency type
    PRIORITY_LEVELS = {
        EmergencyType.AMBULANCE: PriorityLevel.CRITICAL,
        EmergencyType.FIREBRIGADE: PriorityLevel.CRITICAL
    }
    
    # Time before alert expires (seconds)
    ALERT_TIMEOUT = 5.0
    
    def __init__(self):
        """Initialize the emergency priority system."""
        self.emergency_mode = False
        self.active_alerts: Dict[int, EmergencyAlert] = {}  # keyed by track_id
        self.alert_history: List[EmergencyAlert] = []
        self.alert_counter = 0
        self.last_update = time.time()
        
        # Callback for external integrations
        self.on_emergency_detected = None
        self.on_emergency_cleared = None
        
    def _create_alert(self, track: Track) -> EmergencyAlert:
        """
        Create a new emergency alert.
        
        Args:
            track: Emergency vehicle track
            
        Returns:
            New EmergencyAlert object
        """
        self.alert_counter += 1
        
        emergency_type = EmergencyType.AMBULANCE if track.emergency_type == "ambulance" else EmergencyType.FIREBRIGADE
        priority_level = self.PRIORITY_LEVELS.get(emergency_type, PriorityLevel.ELEVATED)
        
        alert = EmergencyAlert(
            alert_id=f"EMRG-{self.alert_counter:04d}",
            emergency_type=emergency_type,
            priority_level=priority_level,
            track_id=track.track_id,
            detected_at=time.time(),
            last_seen=time.time(),
            position=track.center,
            message=self.ALERT_MESSAGES.get(emergency_type, "Emergency Vehicle Detected")
        )
        
        return alert
    
    def update(self, tracks: List[Track], counts: VehicleCount) -> EmergencyStatus:
        """
        Update emergency status based on current tracks.
        
        Args:
            tracks: List of current tracks
            counts: Current vehicle counts
            
        Returns:
            EmergencyStatus object
        """
        current_time = time.time()
        current_emergency_track_ids = set()
        
        # Process emergency vehicles in tracks
        for track in tracks:
            if track.is_emergency and track.is_confirmed:
                current_emergency_track_ids.add(track.track_id)
                
                if track.track_id in self.active_alerts:
                    # Update existing alert
                    self.active_alerts[track.track_id].last_seen = current_time
                    self.active_alerts[track.track_id].position = track.center
                else:
                    # Create new alert
                    alert = self._create_alert(track)
                    self.active_alerts[track.track_id] = alert
                    logger.warning(f"[EMERGENCY] DETECTED: {alert.message}")
                    
                    # Trigger callback if set
                    if self.on_emergency_detected:
                        self.on_emergency_detected(alert)
        
        # Also check counts for emergency vehicles
        if counts.ambulances > 0 or counts.firebrigade > 0:
            if not current_emergency_track_ids:
                # Emergency detected in counts but not in tracks - create synthetic alert
                if counts.ambulances > 0:
                    synthetic_alert = EmergencyAlert(
                        alert_id=f"EMRG-{self.alert_counter + 1:04d}",
                        emergency_type=EmergencyType.AMBULANCE,
                        priority_level=PriorityLevel.CRITICAL,
                        track_id=-1,
                        detected_at=current_time,
                        last_seen=current_time,
                        position=(0, 0),
                        message=self.ALERT_MESSAGES[EmergencyType.AMBULANCE]
                    )
                    self.active_alerts[-1] = synthetic_alert
                    current_emergency_track_ids.add(-1)
                    
                if counts.firebrigade > 0:
                    synthetic_alert = EmergencyAlert(
                        alert_id=f"EMRG-{self.alert_counter + 2:04d}",
                        emergency_type=EmergencyType.FIREBRIGADE,
                        priority_level=PriorityLevel.CRITICAL,
                        track_id=-2,
                        detected_at=current_time,
                        last_seen=current_time,
                        position=(0, 0),
                        message=self.ALERT_MESSAGES[EmergencyType.FIREBRIGADE]
                    )
                    self.active_alerts[-2] = synthetic_alert
                    current_emergency_track_ids.add(-2)
        
        # Expire old alerts
        alerts_to_remove = []
        for track_id, alert in self.active_alerts.items():
            if track_id not in current_emergency_track_ids:
                time_since_seen = current_time - alert.last_seen
                if time_since_seen > self.ALERT_TIMEOUT:
                    alert.is_active = False
                    alerts_to_remove.append(track_id)
                    self.alert_history.append(alert)
                    logger.info(f"Emergency cleared: {alert.alert_id}")
                    
                    if self.on_emergency_cleared:
                        self.on_emergency_cleared(alert)
        
        # Remove expired alerts
        for track_id in alerts_to_remove:
            del self.active_alerts[track_id]
        
        # Keep history limited
        if len(self.alert_history) > 100:
            self.alert_history = self.alert_history[-100:]
        
        # Determine overall emergency mode
        self.emergency_mode = len(self.active_alerts) > 0
        
        # Get highest priority active emergency type
        emergency_type = None
        priority_level = PriorityLevel.NORMAL
        message = "No active emergencies"
        
        if self.active_alerts:
            # Get the most critical alert
            critical_alerts = [a for a in self.active_alerts.values() if a.priority_level == PriorityLevel.CRITICAL]
            if critical_alerts:
                alert = critical_alerts[0]
                emergency_type = alert.emergency_type.value
                priority_level = alert.priority_level
                message = alert.message
            else:
                alert = list(self.active_alerts.values())[0]
                emergency_type = alert.emergency_type.value
                priority_level = alert.priority_level
                message = alert.message
        
        self.last_update = current_time
        
        return EmergencyStatus(
            emergency_mode=self.emergency_mode,
            emergency_type=emergency_type,
            priority_level=priority_level.value,
            active_alerts=list(self.active_alerts.values()),
            message=message
        )
    
    def get_current_status(self) -> EmergencyStatus:
        """Get current emergency status."""
        return EmergencyStatus(
            emergency_mode=self.emergency_mode,
            emergency_type=list(self.active_alerts.values())[0].emergency_type.value if self.active_alerts else None,
            priority_level=list(self.active_alerts.values())[0].priority_level.value if self.active_alerts else "normal",
            active_alerts=list(self.active_alerts.values()),
            message=list(self.active_alerts.values())[0].message if self.active_alerts else "No active emergencies"
        )
    
    def is_emergency_active(self) -> bool:
        """Check if emergency mode is active."""
        return self.emergency_mode
    
    def get_statistics(self) -> Dict:
        """Get emergency system statistics."""
        return {
            "emergency_mode": self.emergency_mode,
            "active_alerts": len(self.active_alerts),
            "total_alerts": self.alert_counter,
            "alerts_in_history": len(self.alert_history),
            "last_update": self.last_update
        }
    
    def clear_all_alerts(self):
        """Clear all active alerts (for testing/reset)."""
        for alert in self.active_alerts.values():
            alert.is_active = False
            self.alert_history.append(alert)
        self.active_alerts.clear()
        self.emergency_mode = False
        logger.info("All emergency alerts cleared")
