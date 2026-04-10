"""
ROI (Region of Interest) module for traffic lane definitions.
Defines rectangular lane regions on video frames and provides
visualization functions for drawing ROI boxes with labels.
"""

import cv2
import numpy as np
from typing import Dict, Tuple, Optional
from config.settings import settings


# ====================================================================
# Lane ROI Definitions
# Each ROI is a tuple: (x1, y1, x2, y2) representing the bounding box
# These are calibrated for the default 1280x720 resolution
# ====================================================================
LANE_ROIS: Dict[str, Tuple[int, int, int, int]] = {
    "lane_1": (100, 300, 400, 600),
    "lane_2": (450, 300, 750, 600),
    "lane_3": (800, 300, 1100, 600),
}

# Lane display names for UI
LANE_LABELS: Dict[str, str] = {
    "lane_1": "Lane 1 (Left)",
    "lane_2": "Lane 2 (Center)",
    "lane_3": "Lane 3 (Right)",
}

# Lane colors for visualization (BGR format)
LANE_COLORS: Dict[str, Tuple[int, int, int]] = {
    "lane_1": (0, 255, 255),    # Yellow
    "lane_2": (255, 165, 0),    # Blue-ish
    "lane_3": (0, 255, 0),      # Green
}


def is_point_in_roi(point: Tuple[int, int], roi: Tuple[int, int, int, int]) -> bool:
    """
    Check if a point (cx, cy) is inside a rectangular ROI.

    Args:
        point: (x, y) center point of a detection
        roi: (x1, y1, x2, y2) bounding box of the ROI

    Returns:
        True if the point is inside the ROI
    """
    x, y = point
    x1, y1, x2, y2 = roi
    return x1 <= x <= x2 and y1 <= y <= y2


def draw_rois(
    frame: np.ndarray,
    lane_counts: Optional[Dict[str, int]] = None,
    signal_times: Optional[Dict[str, int]] = None,
    priority_lane: Optional[str] = None,
) -> np.ndarray:
    """
    Draw ROI lane boxes on the video frame with labels, counts, and signal info.

    Args:
        frame: Input BGR video frame
        lane_counts: Optional dict of vehicle counts per lane
        signal_times: Optional dict of signal time allocations per lane
        priority_lane: Optional name of the priority (most congested) lane

    Returns:
        Frame with ROI boxes drawn
    """
    output = frame.copy()

    for lane_id, (x1, y1, x2, y2) in LANE_ROIS.items():
        is_priority = (lane_id == priority_lane)
        
        # Priority lane is GREEN, others are RED
        color = (0, 255, 0) if is_priority else (0, 0, 255)
        thickness = 3 if is_priority else 2

        # Draw the rectangle
        cv2.rectangle(output, (x1, y1), (x2, y2), color, thickness)

        # Draw semi-transparent overlay for priority lane
        if is_priority:
            overlay = output.copy()
            cv2.rectangle(overlay, (x1, y1), (x2, y2), color, -1)
            cv2.addWeighted(overlay, 0.15, output, 0.85, 0, output)

        # Build label text
        label = LANE_LABELS.get(lane_id, lane_id)
        count_text = ""
        signal_text = ""

        if lane_counts and lane_id in lane_counts:
            count_text = f" | Vehicles: {lane_counts[lane_id]}"

        if signal_times and lane_id in signal_times:
            signal_text = f" | Signal: {signal_times[lane_id]}s"

        # Draw label background
        full_label = f"{label}{count_text}{signal_text}"
        (label_w, label_h), _ = cv2.getTextSize(
            full_label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
        )
        cv2.rectangle(
            output,
            (x1, y1 - label_h - 10),
            (x1 + label_w + 10, y1),
            color,
            -1,
        )
        cv2.putText(
            output,
            full_label,
            (x1 + 5, y1 - 5),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (255, 255, 255),  # White text for contrast
            1,
        )

        # If priority, add a special indicator
        if is_priority:
            cv2.putText(
                output,
                "ACTIVE",
                (x1 + 5, y2 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2,
            )

    return output


def get_lane_rois() -> Dict[str, Tuple[int, int, int, int]]:
    """Return the lane ROI definitions."""
    return LANE_ROIS.copy()


def get_lane_names() -> Dict[str, str]:
    """Return the human-readable lane labels."""
    return LANE_LABELS.copy()
