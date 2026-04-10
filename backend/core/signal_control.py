"""
Adaptive Traffic Signal Control Module.
Dynamically allocates green signal timing based on vehicle
accumulation inside defined lane ROI regions.
"""

from typing import Dict, Optional
from loguru import logger


# ====================================================================
# Signal Timing Constants
# ====================================================================
THRESHOLD = 15       # Vehicles above this count trigger extended timing
BASE_TIME = 20       # Minimum green signal time (seconds)
MAX_TIME = 60        # Maximum green signal time (seconds)
TOTAL_CYCLE = 120    # Total signal cycle budget (seconds)


def calculate_signal_times(lane_counts: Dict[str, int]) -> Dict[str, int]:
    """
    Calculate adaptive green signal times based on vehicle density per lane.

    Logic:
      - Compute total vehicles across all lanes.
      - Allocate signal time proportionally to vehicle density.
      - Higher vehicle density -> longer green time.
      - Ensure timing never drops below BASE_TIME or exceeds MAX_TIME.

    Args:
        lane_counts: Dictionary mapping lane_id -> vehicle count
                     e.g. {"lane_1": 18, "lane_2": 5, "lane_3": 22}

    Returns:
        Dictionary mapping lane_id -> green signal time in seconds
        e.g. {"lane_1": 40, "lane_2": 20, "lane_3": 50}
    """
    if not lane_counts:
        return {}

    total_vehicles = sum(lane_counts.values())
    signal_times: Dict[str, int] = {}

    # If no vehicles detected, assign base time to all lanes
    if total_vehicles == 0:
        for lane_id in lane_counts:
            signal_times[lane_id] = BASE_TIME
        return signal_times

    # Calculate proportional signal times
    for lane_id, count in lane_counts.items():
        # Proportion of traffic in this lane
        proportion = count / total_vehicles

        # Calculate raw signal time based on proportion
        raw_time = BASE_TIME + (TOTAL_CYCLE - BASE_TIME * len(lane_counts)) * proportion

        # Apply threshold bonus: lanes exceeding THRESHOLD get extra time
        if count >= THRESHOLD:
            bonus = min(10, (count - THRESHOLD) * 0.5)
            raw_time += bonus

        # Clamp between BASE_TIME and MAX_TIME
        signal_time = int(max(BASE_TIME, min(MAX_TIME, raw_time)))
        signal_times[lane_id] = signal_time

    return signal_times


def get_priority_lane(lane_counts: Dict[str, int]) -> Optional[str]:
    """
    Determine which lane has the highest vehicle accumulation.

    Args:
        lane_counts: Dictionary mapping lane_id -> vehicle count

    Returns:
        lane_id of the most congested lane, or None if no lanes
    """
    if not lane_counts:
        return None

    return max(lane_counts, key=lane_counts.get)


def get_signal_status(lane_counts: Dict[str, int]) -> Dict:
    """
    Get complete signal control status including times, priority, and metadata.

    Args:
        lane_counts: Dictionary mapping lane_id -> vehicle count

    Returns:
        Complete signal status dictionary for API/WebSocket output
    """
    signal_times = calculate_signal_times(lane_counts)
    priority_lane = get_priority_lane(lane_counts)
    total_vehicles = sum(lane_counts.values()) if lane_counts else 0

    # Determine overall signal mode
    overloaded_lanes = [
        lid for lid, count in lane_counts.items() if count >= THRESHOLD
    ] if lane_counts else []

    if len(overloaded_lanes) >= len(lane_counts):
        mode = "CRITICAL"
    elif len(overloaded_lanes) > 0:
        mode = "ADAPTIVE"
    else:
        mode = "NORMAL"

    return {
        "lane_counts": lane_counts,
        "signal_times": signal_times,
        "priority_lane": priority_lane,
        "total_in_rois": total_vehicles,
        "overloaded_lanes": overloaded_lanes,
        "signal_mode": mode,
        "threshold": THRESHOLD,
        "base_time": BASE_TIME,
        "max_time": MAX_TIME,
    }
