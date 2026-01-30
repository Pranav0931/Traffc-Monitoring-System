import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Camera, Play, Pause, Maximize2, Volume2, VolumeX, RefreshCw } from 'lucide-react';

/**
 * Draw a vehicle detection box on canvas
 */
function drawDetection(ctx, vehicle, scale = 1) {
  const { x, y, width, height, type, id, is_emergency, speed } = vehicle;
  
  // Color based on vehicle type
  const colors = {
    car: '#22c55e',
    bike: '#eab308',
    bus: '#f97316',
    truck: '#a855f7',
    ambulance: '#ef4444',
    firebrigade: '#ef4444'
  };
  
  const color = colors[type] || '#3b82f6';
  const scaledX = x * scale;
  const scaledY = y * scale;
  const scaledW = width * scale;
  const scaledH = height * scale;
  
  // Draw bounding box
  ctx.strokeStyle = color;
  ctx.lineWidth = is_emergency ? 3 : 2;
  ctx.strokeRect(scaledX, scaledY, scaledW, scaledH);
  
  // Draw filled corner accents
  const cornerSize = 8;
  ctx.fillStyle = color;
  
  // Top-left corner
  ctx.fillRect(scaledX, scaledY, cornerSize, 3);
  ctx.fillRect(scaledX, scaledY, 3, cornerSize);
  
  // Top-right corner
  ctx.fillRect(scaledX + scaledW - cornerSize, scaledY, cornerSize, 3);
  ctx.fillRect(scaledX + scaledW - 3, scaledY, 3, cornerSize);
  
  // Bottom-left corner
  ctx.fillRect(scaledX, scaledY + scaledH - 3, cornerSize, 3);
  ctx.fillRect(scaledX, scaledY + scaledH - cornerSize, 3, cornerSize);
  
  // Bottom-right corner
  ctx.fillRect(scaledX + scaledW - cornerSize, scaledY + scaledH - 3, cornerSize, 3);
  ctx.fillRect(scaledX + scaledW - 3, scaledY + scaledH - cornerSize, 3, cornerSize);
  
  // Draw label background
  const label = `${type.toUpperCase()} #${id}`;
  ctx.font = 'bold 11px Arial';
  const textWidth = ctx.measureText(label).width;
  
  ctx.fillStyle = color;
  ctx.fillRect(scaledX, scaledY - 20, textWidth + 10, 18);
  
  // Draw label text
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, scaledX + 5, scaledY - 6);
  
  // Draw speed indicator if moving
  if (speed > 2) {
    const speedText = `${Math.round(speed * 3)}km/h`;
    ctx.font = '10px Arial';
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(scaledX, scaledY + scaledH + 2, 50, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(speedText, scaledX + 4, scaledY + scaledH + 12);
  }
  
  // Emergency indicator
  if (is_emergency) {
    ctx.save();
    ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 100) * 0.2;
    ctx.fillStyle = color;
    ctx.fillRect(scaledX, scaledY, scaledW, scaledH);
    ctx.restore();
  }
}

/**
 * Simulated road scene renderer
 */
function drawRoadScene(ctx, width, height, vehicles, frameCount) {
  // Clear canvas
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);
  
  // Draw sky gradient
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.4);
  skyGradient.addColorStop(0, '#0f0f23');
  skyGradient.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height * 0.4);
  
  // Draw road
  const roadTop = height * 0.35;
  const roadBottom = height * 0.85;
  
  // Road surface
  ctx.fillStyle = '#2d2d3d';
  ctx.beginPath();
  ctx.moveTo(0, roadTop);
  ctx.lineTo(width, roadTop);
  ctx.lineTo(width, roadBottom);
  ctx.lineTo(0, roadBottom);
  ctx.closePath();
  ctx.fill();
  
  // Road markings - center dashed line
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.setLineDash([30, 20]);
  const centerY = (roadTop + roadBottom) / 2;
  ctx.beginPath();
  ctx.moveTo(-((frameCount * 2) % 50), centerY);
  ctx.lineTo(width + 50, centerY);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Road edge lines
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, roadTop + 5);
  ctx.lineTo(width, roadTop + 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, roadBottom - 5);
  ctx.lineTo(width, roadBottom - 5);
  ctx.stroke();
  
  // Draw timestamp and location
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 14px monospace';
  const now = new Date();
  ctx.fillText(`● LIVE | ${now.toLocaleTimeString()}`, 10, 25);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px monospace';
  ctx.fillText('Variety Square, Nagpur | Camera 01', 10, 45);
  
  // Draw detection info overlay
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(width - 180, 10, 170, 60);
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1;
  ctx.strokeRect(width - 180, 10, 170, 60);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px Arial';
  ctx.fillText('DETECTION ENGINE', width - 170, 28);
  ctx.font = '11px Arial';
  ctx.fillStyle = '#22c55e';
  ctx.fillText(`Objects: ${vehicles.length}`, width - 170, 45);
  ctx.fillStyle = '#3b82f6';
  ctx.fillText(`Model: YOLOv8-Traffic`, width - 170, 60);
  
  // Draw vehicle detections
  vehicles.forEach(vehicle => {
    drawDetection(ctx, vehicle, 1);
  });
}

/**
 * Live Camera Feed component with simulated detection visualization.
 */
export default function LiveCameraFeed({ vehicles = [], emergencyMode = false, fps = 0 }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const frameCountRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Generate simulated vehicle positions if none provided
  const displayVehicles = useMemo(() => {
    if (vehicles.length > 0) return vehicles;
    
    // Generate demo vehicles
    const types = ['car', 'car', 'car', 'bike', 'bus', 'truck'];
    const count = 5 + Math.floor(Math.sin(Date.now() / 2000) * 3);
    
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      type: types[i % types.length],
      x: 100 + (i * 150) % 600,
      y: 180 + (i % 2) * 120,
      width: types[i % types.length] === 'bike' ? 40 : 80,
      height: types[i % types.length] === 'bike' ? 40 : 60,
      speed: Math.random() * 10 + 2,
      direction: i % 2 === 0 ? 'east' : 'west',
      is_emergency: false
    }));
  }, [vehicles]);
  
  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const animate = () => {
      if (!isPlaying) return;
      
      frameCountRef.current++;
      drawRoadScene(ctx, width, height, displayVehicles, frameCountRef.current);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, displayVehicles]);
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    const container = canvasRef.current?.parentElement;
    if (!container) return;
    
    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  return (
    <div className={`
      relative rounded-xl overflow-hidden
      border-2 ${emergencyMode ? 'border-red-500 emergency-border' : 'border-traffic-border'}
      bg-black
    `}>
      {/* Canvas for rendering */}
      <canvas
        ref={canvasRef}
        width={800}
        height={450}
        className="w-full h-auto"
        style={{ imageRendering: 'crisp-edges' }}
      />
      
      {/* Control bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
        <div className="flex items-center justify-between">
          {/* Left controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button
              onClick={() => frameCountRef.current = 0}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="Reset view"
            >
              <RefreshCw size={18} />
            </button>
          </div>
          
          {/* Center - Live indicator */}
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-red-500" />
            <span className="text-sm font-medium">
              {fps > 0 ? `${fps} FPS` : 'Processing...'}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400 font-bold">REC</span>
            </div>
          </div>
          
          {/* Right controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Maximize2 size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Emergency overlay */}
      {emergencyMode && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border-4 border-red-500 animate-pulse" />
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg font-bold animate-pulse">
            🚨 EMERGENCY VEHICLE DETECTED
          </div>
        </div>
      )}
      
      {/* Detection stats overlay */}
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
        <div className="flex items-center gap-2 mb-2">
          <Camera size={16} className="text-blue-400" />
          <span className="font-semibold">Live Detection</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-gray-400">Vehicles:</span>
          <span className="font-mono">{displayVehicles.length}</span>
          <span className="text-gray-400">Emergency:</span>
          <span className={emergencyMode ? 'text-red-400 font-bold' : 'text-green-400'}>
            {emergencyMode ? 'DETECTED' : 'None'}
          </span>
        </div>
      </div>
    </div>
  );
}
