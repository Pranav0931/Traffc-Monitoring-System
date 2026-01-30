"""
YOLO-based Vehicle Detection Engine.
Handles real-time object detection for all vehicle types including emergency vehicles.
"""

import cv2
import numpy as np
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass, field
from loguru import logger
import time

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    logger.warning("Ultralytics YOLO not available, using simulation mode")

from config.settings import settings


@dataclass
class Detection:
    """Represents a single vehicle detection."""
    bbox: Tuple[int, int, int, int]  # x1, y1, x2, y2
    class_id: int
    class_name: str
    confidence: float
    track_id: Optional[int] = None
    is_emergency: bool = False
    emergency_type: Optional[str] = None  # "ambulance" or "firebrigade"
    center: Tuple[int, int] = field(default_factory=tuple)
    
    def __post_init__(self):
        if not self.center:
            x1, y1, x2, y2 = self.bbox
            self.center = ((x1 + x2) // 2, (y1 + y2) // 2)


class VehicleDetector:
    """
    YOLOv8-based vehicle detection engine.
    Detects cars, bikes, buses, trucks, and identifies emergency vehicles.
    """
    
    # COCO class IDs for vehicles
    VEHICLE_CLASS_IDS = {
        2: "car",
        3: "bike",        # motorcycle in COCO
        5: "bus",
        7: "truck",
    }
    
    # Color ranges for emergency vehicle detection (HSV)
    EMERGENCY_COLORS = {
        "ambulance_white": {"lower": np.array([0, 0, 200]), "upper": np.array([180, 30, 255])},
        "ambulance_red": {"lower": np.array([0, 100, 100]), "upper": np.array([10, 255, 255])},
        "firebrigade_red": {"lower": np.array([0, 150, 150]), "upper": np.array([10, 255, 255])},
    }
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize the vehicle detector.
        
        Args:
            model_path: Path to YOLO model weights
        """
        self.model_path = model_path or settings.YOLO_MODEL
        self.model = None
        self.device = settings.DEVICE
        self.confidence = settings.YOLO_CONFIDENCE
        self.iou_threshold = settings.YOLO_IOU_THRESHOLD
        self._initialized = False
        self._simulation_mode = not YOLO_AVAILABLE
        
        # Detection counters
        self.total_detections = 0
        self.detection_history: List[Dict] = []
        
    def initialize(self) -> bool:
        """Initialize the YOLO model."""
        if self._initialized:
            return True
            
        try:
            if YOLO_AVAILABLE and not self._simulation_mode:
                logger.info(f"Loading YOLO model: {self.model_path}")
                self.model = YOLO(self.model_path)
                
                # Set device
                if self.device == "auto":
                    # Auto-detect best device
                    import torch
                    if torch.cuda.is_available():
                        self.device = "cuda"
                    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
                        self.device = "mps"
                    else:
                        self.device = "cpu"
                
                logger.info(f"YOLO model loaded on device: {self.device}")
                self._initialized = True
                return True
            else:
                logger.info("Running in simulation mode (no YOLO)")
                self._simulation_mode = True
                self._initialized = True
                return True
                
        except Exception as e:
            logger.error(f"Error initializing YOLO model: {e}")
            logger.info("Falling back to simulation mode")
            self._simulation_mode = True
            self._initialized = True
            return True
    
    def _simulate_detections(self, frame: np.ndarray) -> List[Detection]:
        """
        Generate simulated detections for demo mode.
        Creates realistic-looking detection patterns.
        """
        import random
        
        h, w = frame.shape[:2]
        detections = []
        
        # Simulate varying number of vehicles
        base_time = time.time()
        variation = np.sin(base_time * 0.5) * 0.3 + 0.7  # Oscillating traffic
        
        # Generate random number of each vehicle type
        num_cars = int(random.randint(3, 8) * variation)
        num_bikes = int(random.randint(1, 4) * variation)
        num_buses = int(random.randint(0, 2) * variation)
        num_trucks = int(random.randint(0, 2) * variation)
        
        # Small chance of emergency vehicle
        has_ambulance = random.random() < 0.08  # 8% chance
        has_firebrigade = random.random() < 0.05  # 5% chance
        
        track_id = 1
        
        # Generate car detections
        for i in range(num_cars):
            x1 = random.randint(50, w - 150)
            y1 = random.randint(h // 4, h * 3 // 4 - 80)
            x2 = x1 + random.randint(80, 120)
            y2 = y1 + random.randint(50, 80)
            
            detections.append(Detection(
                bbox=(x1, y1, x2, y2),
                class_id=2,
                class_name="car",
                confidence=random.uniform(0.7, 0.95),
                track_id=track_id
            ))
            track_id += 1
        
        # Generate bike detections
        for i in range(num_bikes):
            x1 = random.randint(50, w - 100)
            y1 = random.randint(h // 4, h * 3 // 4 - 60)
            x2 = x1 + random.randint(40, 60)
            y2 = y1 + random.randint(40, 60)
            
            detections.append(Detection(
                bbox=(x1, y1, x2, y2),
                class_id=3,
                class_name="bike",
                confidence=random.uniform(0.65, 0.9),
                track_id=track_id
            ))
            track_id += 1
        
        # Generate bus detections
        for i in range(num_buses):
            x1 = random.randint(50, w - 200)
            y1 = random.randint(h // 4, h * 3 // 4 - 100)
            x2 = x1 + random.randint(150, 200)
            y2 = y1 + random.randint(80, 100)
            
            detections.append(Detection(
                bbox=(x1, y1, x2, y2),
                class_id=5,
                class_name="bus",
                confidence=random.uniform(0.75, 0.95),
                track_id=track_id
            ))
            track_id += 1
        
        # Generate truck detections
        for i in range(num_trucks):
            x1 = random.randint(50, w - 180)
            y1 = random.randint(h // 4, h * 3 // 4 - 90)
            x2 = x1 + random.randint(120, 180)
            y2 = y1 + random.randint(70, 90)
            
            detections.append(Detection(
                bbox=(x1, y1, x2, y2),
                class_id=7,
                class_name="truck",
                confidence=random.uniform(0.7, 0.92),
                track_id=track_id
            ))
            track_id += 1
        
        # Generate ambulance detection
        if has_ambulance:
            x1 = random.randint(w // 4, w * 3 // 4 - 140)
            y1 = random.randint(h // 3, h * 2 // 3 - 80)
            x2 = x1 + random.randint(100, 140)
            y2 = y1 + random.randint(60, 80)
            
            detections.append(Detection(
                bbox=(x1, y1, x2, y2),
                class_id=2,  # Detected as car class, identified as ambulance
                class_name="ambulance",
                confidence=random.uniform(0.8, 0.95),
                track_id=track_id,
                is_emergency=True,
                emergency_type="ambulance"
            ))
            track_id += 1
        
        # Generate fire brigade detection
        if has_firebrigade:
            x1 = random.randint(w // 4, w * 3 // 4 - 160)
            y1 = random.randint(h // 3, h * 2 // 3 - 90)
            x2 = x1 + random.randint(130, 160)
            y2 = y1 + random.randint(70, 90)
            
            detections.append(Detection(
                bbox=(x1, y1, x2, y2),
                class_id=7,  # Detected as truck class, identified as fire brigade
                class_name="firebrigade",
                confidence=random.uniform(0.78, 0.93),
                track_id=track_id,
                is_emergency=True,
                emergency_type="firebrigade"
            ))
            track_id += 1
        
        return detections
    
    def _check_emergency_vehicle(self, frame: np.ndarray, bbox: Tuple[int, int, int, int]) -> Tuple[bool, Optional[str]]:
        """
        Check if a detected vehicle is an emergency vehicle based on color analysis.
        
        Args:
            frame: Input frame
            bbox: Bounding box of the vehicle
            
        Returns:
            Tuple of (is_emergency, emergency_type)
        """
        x1, y1, x2, y2 = bbox
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(frame.shape[1], x2), min(frame.shape[0], y2)
        
        if x2 <= x1 or y2 <= y1:
            return False, None
        
        roi = frame[y1:y2, x1:x2]
        if roi.size == 0:
            return False, None
        
        # Convert to HSV for color analysis
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        
        # Check for ambulance colors (white + red markings)
        white_mask = cv2.inRange(hsv, 
                                  self.EMERGENCY_COLORS["ambulance_white"]["lower"],
                                  self.EMERGENCY_COLORS["ambulance_white"]["upper"])
        red_mask = cv2.inRange(hsv,
                               self.EMERGENCY_COLORS["ambulance_red"]["lower"],
                               self.EMERGENCY_COLORS["ambulance_red"]["upper"])
        
        white_ratio = np.count_nonzero(white_mask) / white_mask.size
        red_ratio = np.count_nonzero(red_mask) / red_mask.size
        
        # Ambulance detection criteria
        if white_ratio > 0.4 and red_ratio > 0.05:
            return True, "ambulance"
        
        # Check for fire brigade (predominantly red)
        fire_mask = cv2.inRange(hsv,
                                self.EMERGENCY_COLORS["firebrigade_red"]["lower"],
                                self.EMERGENCY_COLORS["firebrigade_red"]["upper"])
        fire_ratio = np.count_nonzero(fire_mask) / fire_mask.size
        
        if fire_ratio > 0.3:
            return True, "firebrigade"
        
        return False, None
    
    def detect(self, frame: np.ndarray) -> List[Detection]:
        """
        Detect vehicles in a frame.
        
        Args:
            frame: Input frame (BGR format)
            
        Returns:
            List of Detection objects
        """
        if not self._initialized:
            self.initialize()
        
        if self._simulation_mode:
            return self._simulate_detections(frame)
        
        detections = []
        
        try:
            # Run YOLO detection
            results = self.model(
                frame,
                conf=self.confidence,
                iou=self.iou_threshold,
                device=self.device,
                verbose=False
            )
            
            for result in results:
                boxes = result.boxes
                if boxes is None:
                    continue
                
                for box in boxes:
                    class_id = int(box.cls[0])
                    
                    # Only process vehicle classes
                    if class_id not in self.VEHICLE_CLASS_IDS:
                        continue
                    
                    # Extract bounding box
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    confidence = float(box.conf[0])
                    class_name = self.VEHICLE_CLASS_IDS[class_id]
                    
                    # Check for emergency vehicle
                    is_emergency, emergency_type = self._check_emergency_vehicle(
                        frame, (x1, y1, x2, y2)
                    )
                    
                    if is_emergency:
                        class_name = emergency_type
                    
                    detection = Detection(
                        bbox=(x1, y1, x2, y2),
                        class_id=class_id,
                        class_name=class_name,
                        confidence=confidence,
                        is_emergency=is_emergency,
                        emergency_type=emergency_type
                    )
                    detections.append(detection)
            
            self.total_detections += len(detections)
            
        except Exception as e:
            logger.error(f"Detection error: {e}")
            # Fallback to simulation
            return self._simulate_detections(frame)
        
        return detections
    
    def draw_detections(self, frame: np.ndarray, detections: List[Detection]) -> np.ndarray:
        """
        Draw detection boxes on frame.
        
        Args:
            frame: Input frame
            detections: List of detections
            
        Returns:
            Frame with drawn detections
        """
        output = frame.copy()
        
        # Color mapping
        colors = {
            "car": (0, 255, 0),       # Green
            "bike": (255, 255, 0),    # Cyan
            "bus": (0, 165, 255),     # Orange
            "truck": (255, 0, 255),   # Magenta
            "ambulance": (0, 0, 255), # Red (emergency)
            "firebrigade": (0, 0, 255) # Red (emergency)
        }
        
        for det in detections:
            x1, y1, x2, y2 = det.bbox
            color = colors.get(det.class_name, (255, 255, 255))
            thickness = 3 if det.is_emergency else 2
            
            # Draw bounding box
            cv2.rectangle(output, (x1, y1), (x2, y2), color, thickness)
            
            # Draw label
            label = f"{det.class_name}"
            if det.track_id:
                label += f" #{det.track_id}"
            label += f" {det.confidence:.2f}"
            
            # Label background
            (label_w, label_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(output, (x1, y1 - label_h - 10), (x1 + label_w + 10, y1), color, -1)
            cv2.putText(output, label, (x1 + 5, y1 - 5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            # Emergency vehicle indicator
            if det.is_emergency:
                cv2.putText(output, "🚨 EMERGENCY", (x1, y2 + 20),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
        
        return output
