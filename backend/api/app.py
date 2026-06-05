"""
FastAPI Application for Traffic Monitoring System.
Provides REST API and WebSocket endpoints for real-time traffic data.
Extended with endpoints for intersections, solar power, environmental sensors, and alerts.
"""

import asyncio
import json
from typing import List, Set
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from config.settings import settings
from core.pipeline import get_pipeline, initialize_pipeline, start_pipeline, stop_pipeline


# Connection manager for WebSocket clients
class ConnectionManager:
    """Manages WebSocket connections for real-time updates."""
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._broadcast_task = None
        
    async def connect(self, websocket: WebSocket):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket connected. Active connections: {len(self.active_connections)}")
        
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket disconnected. Active connections: {len(self.active_connections)}")
        
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients."""
        if not self.active_connections:
            return
            
        disconnected = set()
        message_json = json.dumps(message)
        
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message_json)
            except Exception as e:
                logger.debug(f"Failed to send to client: {e}")
                disconnected.add(connection)
        
        # Clean up disconnected clients
        for conn in disconnected:
            self.active_connections.discard(conn)
    
    async def start_broadcast_loop(self):
        """Start the broadcast loop for traffic updates."""
        pipeline = get_pipeline()
        
        while True:
            try:
                if pipeline.current_state and self.active_connections:
                    await self.broadcast(pipeline.current_state.to_dict())
                
                await asyncio.sleep(settings.WEBSOCKET_UPDATE_INTERVAL)
                
            except Exception as e:
                logger.error(f"Broadcast error: {e}")
                await asyncio.sleep(1)


# Create connection manager
manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info("[START] Starting Traffic Monitoring System...")
    
    # Initialize pipeline
    success = await initialize_pipeline()
    if not success:
        logger.error("Failed to initialize pipeline")
        
    # Start pipeline
    await start_pipeline()
    
    # Start broadcast loop
    broadcast_task = asyncio.create_task(manager.start_broadcast_loop())
    
    logger.info("[OK] Traffic Monitoring System started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Traffic Monitoring System...")
    broadcast_task.cancel()
    await stop_pipeline()
    logger.info("Traffic Monitoring System stopped")


# Create FastAPI app
app = FastAPI(
    title="AI Smart Traffic Management System",
    description="Real-time intelligent traffic monitoring, emergency vehicle priority, solar power management, and environmental monitoring",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# REST API Endpoints
# =============================================================================

@app.get("/")
async def root():
    """Root endpoint with system info."""
    return {
        "name": settings.APP_NAME,
        "version": "2.0.0",
        "status": "running",
        "location": settings.LOCATION_NAME,
        "endpoints": {
            "traffic_status": "/traffic-status",
            "websocket": "/ws/traffic",
            "health": "/health",
            "stats": "/stats",
            "intersections": "/intersections",
            "solar_status": "/solar-status",
            "environmental": "/environmental",
            "alerts": "/alerts",
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    pipeline = get_pipeline()
    return {
        "status": "healthy" if pipeline.is_running else "starting",
        "timestamp": datetime.now().isoformat(),
        "uptime_seconds": pipeline.get_statistics().get("uptime_seconds", 0)
    }


@app.get("/traffic-status")
async def get_traffic_status():
    """
    Get current traffic status.
    
    Returns complete traffic state including:
    - Vehicle counts by type
    - Congestion level
    - Emergency status
    - Intersection network data
    - Solar power data
    - Environmental data
    - Active alerts
    """
    pipeline = get_pipeline()
    state = pipeline.get_current_state()
    
    if state is None:
        # Return default state if pipeline hasn't produced data yet
        return {
            "cars": 0,
            "bikes": 0,
            "buses": 0,
            "trucks": 0,
            "ambulances": 0,
            "firebrigade": 0,
            "total": 0,
            "congestion": "LOW",
            "emergency_mode": False,
            "emergency_type": None,
            "area": settings.LOCATION_NAME,
            "lat": settings.LOCATION_LAT,
            "lng": settings.LOCATION_LNG,
            "timestamp": datetime.now().isoformat(),
            "intersections": [],
            "green_corridor": [],
            "solar_data": {},
            "environmental_data": {},
            "alerts": [],
            "alert_summary": {},
        }
    
    return state.to_dict()


@app.get("/stats")
async def get_statistics():
    """Get detailed system statistics."""
    pipeline = get_pipeline()
    return pipeline.get_statistics()


@app.get("/config")
async def get_config():
    """Get current system configuration."""
    return {
        "location": {
            "name": settings.LOCATION_NAME,
            "lat": settings.LOCATION_LAT,
            "lng": settings.LOCATION_LNG
        },
        "thresholds": {
            "congestion_low": settings.CONGESTION_LOW_THRESHOLD,
            "congestion_medium": settings.CONGESTION_MEDIUM_THRESHOLD,
            "congestion_alert": settings.CONGESTION_ALERT_THRESHOLD,
            "aqi_alert": settings.AQI_ALERT_THRESHOLD,
            "noise_alert": settings.NOISE_ALERT_THRESHOLD,
        },
        "update_intervals": {
            "websocket": settings.WEBSOCKET_UPDATE_INTERVAL,
            "congestion": settings.CONGESTION_UPDATE_INTERVAL,
            "environmental": settings.ENVIRONMENTAL_UPDATE_INTERVAL,
        },
        "video": {
            "source": settings.VIDEO_SOURCE,
            "fps": settings.VIDEO_FPS,
            "resolution": f"{settings.FRAME_WIDTH}x{settings.FRAME_HEIGHT}"
        },
        "solar": {
            "panel_capacity_w": settings.SOLAR_PANEL_CAPACITY_W,
            "battery_capacity_wh": settings.BATTERY_CAPACITY_WH,
            "low_battery_threshold": settings.LOW_BATTERY_THRESHOLD,
        },
        "intersections": len(settings.INTERSECTIONS),
    }


# =============================================================================
# Intersection Network Endpoints
# =============================================================================

@app.get("/intersections")
async def list_intersections():
    """Get all intersections with current status."""
    pipeline = get_pipeline()
    if pipeline.current_state:
        return {
            "intersections": pipeline.current_state.intersections,
            "green_corridor": pipeline.current_state.green_corridor,
        }
    return {"intersections": [], "green_corridor": []}


@app.get("/intersections/{intersection_id}")
async def get_intersection(intersection_id: str):
    """Get detailed status for a single intersection."""
    pipeline = get_pipeline()
    result = pipeline.intersection_network.get_intersection(intersection_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Intersection '{intersection_id}' not found")
    return result


# =============================================================================
# Solar Power Endpoints
# =============================================================================

@app.get("/solar-status")
async def get_solar_status():
    """Get solar power status for all intersections."""
    pipeline = get_pipeline()
    if pipeline.current_state:
        return {
            "solar_data": pipeline.current_state.solar_data,
            "total_intersections": len(pipeline.current_state.solar_data),
        }
    return {"solar_data": {}, "total_intersections": 0}


# =============================================================================
# Environmental Sensor Endpoints
# =============================================================================

@app.get("/environmental")
async def get_environmental_data():
    """Get environmental sensor data for all zones."""
    pipeline = get_pipeline()
    if pipeline.current_state:
        return {
            "environmental_data": pipeline.current_state.environmental_data,
            "zones": len(pipeline.current_state.environmental_data),
        }
    return {"environmental_data": {}, "zones": 0}


# =============================================================================
# Alert Endpoints
# =============================================================================

@app.get("/alerts")
async def get_alerts():
    """Get recent system alerts."""
    pipeline = get_pipeline()
    return {
        "alerts": pipeline.alert_system.get_active_alerts(limit=50),
        "summary": pipeline.alert_system.get_alert_summary(),
    }


# =============================================================================
# Emergency Green Corridor (Test Trigger)
# =============================================================================

@app.post("/emergency/green-corridor")
async def trigger_green_corridor(start_id: str = "variety_square", emergency_type: str = "ambulance"):
    """Trigger a green corridor for testing purposes."""
    pipeline = get_pipeline()
    result = pipeline.intersection_network.trigger_green_corridor(start_id, emergency_type)
    if result:
        pipeline.alert_system.add_alert(
            alert_type="GREEN_CORRIDOR_ACTIVE",
            severity="CRITICAL",
            message=f"Green corridor triggered from {start_id} for {emergency_type}",
            source="manual_trigger",
        )
        return {"status": "activated", "corridor": result}
    return {"status": "failed", "message": "Could not create green corridor"}


# =============================================================================
# WebSocket Endpoints
# =============================================================================

@app.websocket("/ws/traffic")
async def websocket_traffic(websocket: WebSocket):
    """
    WebSocket endpoint for real-time traffic updates.
    
    Sends traffic state updates every 2-5 seconds including:
    - Vehicle counts
    - Congestion level
    - Emergency status
    - Intersection network data
    - Solar power data
    - Environmental data
    - Active alerts
    """
    await manager.connect(websocket)
    
    try:
        # Send initial state
        pipeline = get_pipeline()
        if pipeline.current_state:
            await websocket.send_json(pipeline.current_state.to_dict())
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for any incoming message (ping/pong or commands)
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                
                # Handle ping
                if data == "ping":
                    await websocket.send_text("pong")
                    
                # Handle status request
                elif data == "status":
                    if pipeline.current_state:
                        await websocket.send_json(pipeline.current_state.to_dict())
                        
            except asyncio.TimeoutError:
                # Send ping to keep connection alive
                try:
                    await websocket.send_text("ping")
                except:
                    break
                    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


@app.websocket("/ws/stats")
async def websocket_stats(websocket: WebSocket):
    """WebSocket endpoint for system statistics."""
    await websocket.accept()
    
    try:
        pipeline = get_pipeline()
        
        while True:
            stats = pipeline.get_statistics()
            await websocket.send_json(stats)
            await asyncio.sleep(5)
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Stats WebSocket error: {e}")


# =============================================================================
# Error Handlers
# =============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )
