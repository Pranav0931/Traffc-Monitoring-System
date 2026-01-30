"""
Video Frame Capture Pipeline.
Handles live video streams, RTSP feeds, or demo video sources.
"""

import cv2
import asyncio
import numpy as np
from typing import Optional, AsyncGenerator, Tuple
from loguru import logger
import time
from config.settings import settings


class VideoCapture:
    """
    Asynchronous video capture pipeline for real-time frame processing.
    Supports webcams, RTSP streams, video files, and demo mode.
    """
    
    def __init__(self, source: Optional[str] = None):
        """
        Initialize video capture.
        
        Args:
            source: Video source (webcam index, RTSP URL, file path, or "demo")
        """
        self.source = source or settings.VIDEO_SOURCE
        self.cap: Optional[cv2.VideoCapture] = None
        self.is_running = False
        self.frame_count = 0
        self.fps = settings.VIDEO_FPS
        self.width = settings.FRAME_WIDTH
        self.height = settings.FRAME_HEIGHT
        self._last_frame_time = 0
        
    def _init_capture(self) -> bool:
        """Initialize the video capture object."""
        try:
            if self.source == "demo":
                # Demo mode - will generate synthetic frames
                logger.info("Initializing demo mode video source")
                return True
            elif self.source.isdigit():
                # Webcam
                self.cap = cv2.VideoCapture(int(self.source))
            elif self.source.startswith(('rtsp://', 'http://', 'https://')):
                # Network stream
                self.cap = cv2.VideoCapture(self.source)
            else:
                # File path
                self.cap = cv2.VideoCapture(self.source)
            
            if self.cap and self.cap.isOpened():
                self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
                self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
                self.cap.set(cv2.CAP_PROP_FPS, self.fps)
                self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                logger.info(f"Video capture initialized: {self.source}")
                return True
            else:
                logger.warning(f"Failed to open video source: {self.source}, falling back to demo mode")
                self.source = "demo"
                return True
                
        except Exception as e:
            logger.error(f"Error initializing video capture: {e}")
            self.source = "demo"
            return True
    
    def _generate_demo_frame(self) -> np.ndarray:
        """
        Generate a synthetic demo frame simulating traffic.
        This creates a realistic-looking road scene for demonstration.
        """
        # Create base frame (road background)
        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)
        
        # Draw road (gray asphalt)
        frame[:, :] = (50, 50, 50)  # Dark gray background
        
        # Draw road lanes
        road_top = self.height // 4
        road_bottom = self.height * 3 // 4
        cv2.rectangle(frame, (0, road_top), (self.width, road_bottom), (80, 80, 80), -1)
        
        # Draw lane markings (dashed white lines)
        lane_y = self.height // 2
        for x in range(0, self.width, 60):
            cv2.rectangle(frame, (x, lane_y - 3), (x + 30, lane_y + 3), (255, 255, 255), -1)
        
        # Draw road edges
        cv2.line(frame, (0, road_top), (self.width, road_top), (200, 200, 200), 2)
        cv2.line(frame, (0, road_bottom), (self.width, road_bottom), (200, 200, 200), 2)
        
        # Add timestamp
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(frame, f"LIVE - {settings.LOCATION_NAME}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        cv2.putText(frame, timestamp, (10, 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        
        return frame
    
    async def start(self) -> bool:
        """Start the video capture pipeline."""
        if self.is_running:
            return True
            
        success = self._init_capture()
        if success:
            self.is_running = True
            logger.info("Video capture started")
        return success
    
    async def stop(self):
        """Stop the video capture pipeline."""
        self.is_running = False
        if self.cap:
            self.cap.release()
            self.cap = None
        logger.info("Video capture stopped")
    
    async def read_frame(self) -> Tuple[bool, Optional[np.ndarray]]:
        """
        Read a single frame from the video source.
        
        Returns:
            Tuple of (success, frame)
        """
        if not self.is_running:
            return False, None
        
        try:
            if self.source == "demo":
                # Generate demo frame
                frame = self._generate_demo_frame()
                self.frame_count += 1
                return True, frame
            elif self.cap and self.cap.isOpened():
                ret, frame = self.cap.read()
                if ret:
                    self.frame_count += 1
                    return True, frame
                else:
                    # Video file ended, loop back
                    self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    return False, None
            else:
                return False, None
        except Exception as e:
            logger.error(f"Error reading frame: {e}")
            return False, None
    
    async def frame_generator(self) -> AsyncGenerator[np.ndarray, None]:
        """
        Async generator that yields frames continuously.
        Controls frame rate for consistent processing.
        """
        target_interval = 1.0 / self.fps
        
        while self.is_running:
            current_time = time.time()
            elapsed = current_time - self._last_frame_time
            
            if elapsed < target_interval:
                await asyncio.sleep(target_interval - elapsed)
            
            success, frame = await self.read_frame()
            if success and frame is not None:
                self._last_frame_time = time.time()
                yield frame
            else:
                await asyncio.sleep(0.01)
    
    @property
    def frame_info(self) -> dict:
        """Get current frame information."""
        return {
            "frame_count": self.frame_count,
            "width": self.width,
            "height": self.height,
            "fps": self.fps,
            "source": self.source,
            "is_running": self.is_running
        }
