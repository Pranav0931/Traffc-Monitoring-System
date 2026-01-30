# AI-Based Intelligent Traffic Monitoring & Emergency Vehicle Priority System

A real-time intelligent traffic monitoring system that continuously analyzes road video, detects and tracks every passing vehicle, identifies emergency vehicles (ambulance and fire brigade), computes dynamic congestion levels, and updates a live dashboard and city map in real time.

## 🎯 System Overview

This system demonstrates how AI, computer vision, and real-time systems can:
- Monitor all passing vehicles with detection and tracking
- Detect emergency vehicles (ambulances, fire brigades) instantly
- Prioritize emergency vehicle movement
- Visualize real-time road conditions for intelligent traffic control

## 🏗️ Architecture

```
Live Road Video Feed 
    → Frame Capture Pipeline 
    → YOLO Vehicle Detection + Emergency Vehicle Classification 
    → Multi-Object Tracking 
    → Vehicle Counting Engine 
    → Emergency Vehicle Priority Detection 
    → Real-Time Congestion Computation 
    → FastAPI Backend 
    → WebSocket Streaming API 
    → React Live Dashboard + City Map
```

## 📁 Project Structure

```
Traffic Monitoring System/
├── backend/
│   ├── api/
│   │   ├── __init__.py
│   │   └── app.py              # FastAPI application with WebSocket
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py         # Configuration management
│   ├── core/
│   │   ├── __init__.py
│   │   ├── video_capture.py    # Video frame capture pipeline
│   │   ├── detection.py        # YOLO vehicle detection
│   │   ├── tracking.py         # Multi-object tracking (ByteTrack)
│   │   ├── counting.py         # Vehicle counting engine
│   │   ├── congestion.py       # Congestion computation
│   │   ├── emergency.py        # Emergency vehicle priority system
│   │   └── pipeline.py         # Main processing pipeline
│   ├── models/                  # YOLO model weights
│   ├── logs/                    # Application logs
│   ├── main.py                  # Entry point
│   └── requirements.txt         # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Header.jsx           # Header with live indicator
    │   │   ├── VehicleCounters.jsx  # Vehicle count display
    │   │   ├── CongestionBadge.jsx  # Congestion status
    │   │   ├── EmergencyPanel.jsx   # Emergency alerts
    │   │   ├── TrafficMap.jsx       # Leaflet map integration
    │   │   ├── StatsPanel.jsx       # Statistics display
    │   │   └── index.js
    │   ├── hooks/
    │   │   └── useTrafficData.js    # WebSocket hook
    │   ├── App.jsx                  # Main application
    │   ├── main.jsx                 # Entry point
    │   └── index.css                # Tailwind styles
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── postcss.config.js
```

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Linux/Mac
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start the backend server:
```bash
python main.py
```

The backend will start at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will start at `http://localhost:3000`

## 🔌 API Reference

### WebSocket Endpoint

**`/ws/traffic`** - Real-time traffic updates

Connects to receive live traffic data every 2-5 seconds.

Example message:
```json
{
  "cars": 11,
  "bikes": 6,
  "buses": 2,
  "trucks": 3,
  "ambulances": 1,
  "firebrigade": 0,
  "total": 22,
  "congestion": "HIGH",
  "emergency_mode": true,
  "emergency_type": "ambulance",
  "area": "Main Road Signal, Agur",
  "lat": 12.7805,
  "lng": 77.6051,
  "timestamp": "2026-01-30T19:45:12"
}
```

### REST Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | System information |
| `/health` | GET | Health check |
| `/traffic-status` | GET | Current traffic status |
| `/stats` | GET | Detailed statistics |
| `/config` | GET | System configuration |

## 🚦 Congestion Levels

| Level | Vehicle Count | Color |
|-------|---------------|-------|
| LOW | < 10 | 🟢 Green |
| MEDIUM | 10-19 | 🟡 Yellow |
| HIGH | ≥ 20 | 🔴 Red |

## 🚨 Emergency Priority System

When an ambulance or fire brigade is detected:

1. **Emergency Priority Mode** is triggered
2. Real-time alert appears on dashboard
3. Map marker changes to flashing blue-red state
4. Alert message displayed: "🚨 Emergency Vehicle Detected – Priority Clearance Required"

## 🎨 Dashboard Features

- **Live Vehicle Counters**: Cars, Bikes, Buses, Trucks, Ambulances, Fire Brigade
- **Total Vehicle Count**: Real-time total
- **Congestion Status Badge**: Dynamic color-coded status
- **Emergency Alert Panel**: Animated priority alerts
- **Live Map**: Interactive Leaflet.js map with status markers
- **System Statistics**: FPS, frame count, connection status

## ⚙️ Configuration

Edit `backend/config/settings.py` to customize:

```python
# Video source (webcam, RTSP URL, file path, or "demo")
VIDEO_SOURCE = "demo"

# Location
LOCATION_NAME = "Main Road Signal, Agur"
LOCATION_LAT = 12.7805
LOCATION_LNG = 77.6051

# Congestion thresholds
CONGESTION_LOW_THRESHOLD = 10
CONGESTION_MEDIUM_THRESHOLD = 20

# Update intervals
WEBSOCKET_UPDATE_INTERVAL = 2.0
```

## 🎥 Video Sources

The system supports multiple video sources:

1. **Demo Mode** (default): Generates simulated traffic data
2. **Webcam**: Use `"0"` or `"1"` for camera index
3. **RTSP Stream**: Use full RTSP URL
4. **Video File**: Use absolute file path

## 🏙️ Defense-Ready Statement

> "Yes. The system continuously processes live road video, tracks every passing vehicle, detects ambulances and fire brigade vehicles in real time, dynamically computes congestion, and updates the dashboard and city map instantly. The same pipeline directly scales to real CCTV deployments for smart city traffic control."

## 📊 Technology Stack

### Backend
- **Python 3.9+**
- **FastAPI** - High-performance async web framework
- **OpenCV** - Video processing
- **YOLOv8** - Object detection (Ultralytics)
- **WebSockets** - Real-time streaming
- **Pydantic** - Data validation

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Leaflet.js** - Interactive maps
- **Lucide React** - Icons

## 📄 License

This project is for educational and demonstration purposes.

## 👥 Authors

AI-Based Intelligent Traffic Monitoring System - Real-time smart city traffic control prototype.
