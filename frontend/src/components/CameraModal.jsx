import React, { useRef, useEffect, useState } from 'react';
import { 
  X, Maximize2, Minimize2, Camera, MapPin, 
  AlertTriangle, Clock, Activity, Volume2, VolumeX,
  RotateCcw, Download, Share2, Settings, Zap
} from 'lucide-react';

/**
 * Camera Modal - Shows live camera feed for selected location
 */
export default function CameraModal({ 
  isOpen, 
  onClose, 
  location,
  trafficData 
}) {
  const canvasRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const animationRef = useRef(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Draw camera feed simulation
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const resize = () => {
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let frameCount = 0;
    const vehicles = generateVehicles(location?.name);

    function generateVehicles(locationName) {
      const count = Math.floor(Math.random() * 8) + 5;
      const types = ['car', 'bike', 'bus', 'truck', 'auto'];
      const colors = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#a855f7', '#f97316'];
      
      return Array.from({ length: count }, (_, i) => ({
        id: i,
        type: types[Math.floor(Math.random() * types.length)],
        x: Math.random() * 0.8 + 0.1,
        y: Math.random() * 0.5 + 0.3,
        speed: Math.random() * 40 + 20,
        direction: Math.random() > 0.5 ? 1 : -1,
        color: colors[Math.floor(Math.random() * colors.length)],
        width: Math.random() * 40 + 30,
        height: Math.random() * 20 + 15
      }));
    }

    function drawFrame() {
      frameCount++;
      const { width, height } = canvas;

      // Sky gradient (time-based)
      const hour = currentTime.getHours();
      const isNight = hour < 6 || hour > 19;
      const gradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
      
      if (isNight) {
        gradient.addColorStop(0, '#0a1628');
        gradient.addColorStop(1, '#1a2744');
      } else {
        gradient.addColorStop(0, '#1e3a5f');
        gradient.addColorStop(1, '#2d4a6f');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw road
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, height * 0.5, width, height * 0.5);

      // Road markings
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.setLineDash([30, 20]);
      ctx.beginPath();
      ctx.moveTo(0, height * 0.65);
      ctx.lineTo(width, height * 0.65);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw lane dividers
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.5);
      ctx.lineTo(width, height * 0.5);
      ctx.stroke();

      // Draw buildings in background
      for (let i = 0; i < 8; i++) {
        const bx = i * (width / 7) - 20;
        const bw = width / 10 + Math.random() * 20;
        const bh = height * 0.15 + Math.random() * height * 0.2;
        
        ctx.fillStyle = `rgba(30, 41, 59, ${0.8 + Math.random() * 0.2})`;
        ctx.fillRect(bx, height * 0.5 - bh, bw, bh);
        
        // Windows
        ctx.fillStyle = isNight ? '#fbbf24' : '#64748b';
        for (let wy = 0; wy < bh - 20; wy += 15) {
          for (let wx = 5; wx < bw - 10; wx += 12) {
            if (Math.random() > 0.3) {
              ctx.fillRect(bx + wx, height * 0.5 - bh + wy + 5, 8, 10);
            }
          }
        }
      }

      // Draw traffic signal
      const signalX = width * 0.85;
      const signalY = height * 0.25;
      
      // Signal pole
      ctx.fillStyle = '#374151';
      ctx.fillRect(signalX - 3, signalY, 6, height * 0.35);
      
      // Signal box
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(signalX - 15, signalY - 60, 30, 55);
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 2;
      ctx.strokeRect(signalX - 15, signalY - 60, 30, 55);
      
      // Signal lights
      const signalPhase = Math.floor(frameCount / 60) % 3;
      const lights = [
        { y: signalY - 50, color: signalPhase === 0 ? '#ef4444' : '#450a0a' },
        { y: signalY - 35, color: signalPhase === 1 ? '#eab308' : '#422006' },
        { y: signalY - 20, color: signalPhase === 2 ? '#22c55e' : '#052e16' }
      ];
      
      lights.forEach(light => {
        ctx.beginPath();
        ctx.arc(signalX, light.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = light.color;
        ctx.fill();
        if (light.color !== '#450a0a' && light.color !== '#422006' && light.color !== '#052e16') {
          ctx.shadowBlur = 15;
          ctx.shadowColor = light.color;
        }
      });
      ctx.shadowBlur = 0;

      // Draw and animate vehicles
      vehicles.forEach((vehicle, idx) => {
        // Update position
        vehicle.x += vehicle.direction * 0.002 * (vehicle.speed / 30);
        if (vehicle.x > 1.1) vehicle.x = -0.1;
        if (vehicle.x < -0.1) vehicle.x = 1.1;

        const vx = vehicle.x * width;
        const vy = vehicle.y * height;

        // Vehicle shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(vx + 5, vy + vehicle.height + 3, vehicle.width / 2, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Vehicle body
        ctx.fillStyle = vehicle.color;
        ctx.beginPath();
        ctx.roundRect(vx - vehicle.width / 2, vy, vehicle.width, vehicle.height, 4);
        ctx.fill();

        // Vehicle highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(vx - vehicle.width / 2 + 2, vy + 2, vehicle.width - 4, 4);

        // Detection bounding box
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.strokeRect(vx - vehicle.width / 2 - 5, vy - 5, vehicle.width + 10, vehicle.height + 10);

        // Label
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 10px Arial';
        const label = `${vehicle.type} ${Math.round(vehicle.speed)}km/h`;
        ctx.fillText(label, vx - vehicle.width / 2 - 5, vy - 10);

        // Tracking ID
        ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
        ctx.fillRect(vx + vehicle.width / 2 - 15, vy - 5, 20, 12);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 8px Arial';
        ctx.fillText(`#${idx + 1}`, vx + vehicle.width / 2 - 13, vy + 4);
      });

      // Camera overlay - timestamp
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 250, 70);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, 250, 70);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`📍 ${location?.name || 'Camera Feed'}`, 20, 30);
      ctx.font = '11px monospace';
      ctx.fillText(`📅 ${currentTime.toLocaleDateString()}`, 20, 48);
      ctx.fillText(`🕐 ${currentTime.toLocaleTimeString()}`, 140, 48);
      ctx.fillText(`📹 CAM-${location?.id || '001'} | REC`, 20, 66);

      // Recording indicator
      if (isRecording) {
        ctx.fillStyle = frameCount % 60 < 30 ? '#ef4444' : 'transparent';
        ctx.beginPath();
        ctx.arc(240, 60, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stats overlay - bottom right
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(width - 180, height - 80, 170, 70);
      ctx.strokeStyle = '#22c55e';
      ctx.strokeRect(width - 180, height - 80, 170, 70);

      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`🚗 Vehicles: ${vehicles.length}`, width - 170, height - 60);
      ctx.fillText(`⚡ Avg Speed: ${Math.round(vehicles.reduce((a, v) => a + v.speed, 0) / vehicles.length)} km/h`, width - 170, height - 42);
      ctx.fillText(`📊 Flow: ${(vehicles.length * 2.5).toFixed(1)}/min`, width - 170, height - 24);

      // FPS counter
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(width - 60, 10, 50, 20);
      ctx.fillStyle = '#22c55e';
      ctx.font = '10px monospace';
      ctx.fillText(`30 FPS`, width - 55, 24);

      animationRef.current = requestAnimationFrame(drawFrame);
    }

    drawFrame();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isOpen, location, currentTime, isRecording]);

  const [showSidePanel, setShowSidePanel] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4">
      <div className={`
        bg-gray-900 border border-gray-700 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl
        transition-all duration-300 flex flex-col
        ${isFullscreen ? 'w-full h-full m-0 rounded-none' : 'w-full max-w-5xl h-full sm:h-[85vh] md:h-[80vh]'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <Camera className="text-blue-400 flex-shrink-0" size={18} />
              <span className="font-semibold text-white text-sm sm:text-base truncate">{location?.name || 'Camera Feed'}</span>
            </div>
            <span className="px-1.5 sm:px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] sm:text-xs font-medium rounded-full flex items-center gap-1 flex-shrink-0">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse"></span>
              LIVE
            </span>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={() => setIsRecording(!isRecording)}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors ${isRecording ? 'bg-red-500/20 text-red-400' : 'hover:bg-gray-700 text-gray-400'}`}
              title={isRecording ? 'Stop Recording' : 'Start Recording'}
            >
              <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
            </button>
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 sm:p-2 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors hidden sm:block"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button 
              onClick={() => setShowSidePanel(!showSidePanel)}
              className="p-1.5 sm:p-2 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors md:hidden"
              title="Toggle Info Panel"
            >
              <Activity size={16} />
            </button>
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 sm:p-2 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors hidden sm:block"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
            >
              <X size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          {/* Camera feed */}
          <div className="flex-1 relative bg-black min-h-[200px] sm:min-h-[300px]">
            <canvas ref={canvasRef} className="w-full h-full" />
            
            {/* Emergency overlay */}
            {trafficData?.emergency_mode && (
              <div className="absolute inset-0 border-2 sm:border-4 border-red-500 animate-pulse pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500/90 px-3 sm:px-6 py-2 sm:py-3 rounded-lg">
                  <span className="text-white font-bold text-sm sm:text-xl flex items-center gap-2">
                    <AlertTriangle className="animate-bounce" size={16} />
                    EMERGENCY VEHICLE
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Side panel - collapsible on mobile */}
          <div className={`
            ${showSidePanel ? 'block' : 'hidden md:block'}
            w-full md:w-64 lg:w-72 bg-gray-800 border-t md:border-t-0 md:border-l border-gray-700 
            overflow-y-auto max-h-[40vh] md:max-h-none
          `}>
            {/* Location info */}
            <div className="p-3 sm:p-4 border-b border-gray-700">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3 flex items-center gap-2">
                <MapPin size={12} className="sm:w-3.5 sm:h-3.5" />
                Location Details
              </h3>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Area</span>
                  <span className="text-white truncate ml-2">{location?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Coordinates</span>
                  <span className="text-gray-300 font-mono text-[10px] sm:text-xs">
                    {location?.lat?.toFixed(4)}, {location?.lng?.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Camera ID</span>
                  <span className="text-blue-400">CAM-{location?.id || '001'}</span>
                </div>
              </div>
            </div>

            {/* Traffic stats */}
            <div className="p-3 sm:p-4 border-b border-gray-700">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3 flex items-center gap-2">
                <Activity size={12} className="sm:w-3.5 sm:h-3.5" />
                Traffic Statistics
              </h3>
              <div className="grid grid-cols-4 md:grid-cols-2 gap-2 sm:gap-3">
                <div className="bg-gray-900 rounded-lg p-2 sm:p-3 text-center">
                  <div className="text-lg sm:text-2xl font-bold text-blue-400">{trafficData?.total || 0}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Vehicles</div>
                </div>
                <div className="bg-gray-900 rounded-lg p-2 sm:p-3 text-center">
                  <div className="text-lg sm:text-2xl font-bold text-green-400">{trafficData?.avg_speed || 0}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Avg Speed</div>
                </div>
                <div className="bg-gray-900 rounded-lg p-2 sm:p-3 text-center">
                  <div className="text-lg sm:text-2xl font-bold text-yellow-400">{trafficData?.flow_rate?.toFixed(1) || 0}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Flow/min</div>
                </div>
                <div className="bg-gray-900 rounded-lg p-2 sm:p-3 text-center">
                  <div className={`text-lg sm:text-2xl font-bold ${
                    trafficData?.congestion === 'HIGH' ? 'text-red-400' : 
                    trafficData?.congestion === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {trafficData?.congestion || 'LOW'}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Congestion</div>
                </div>
              </div>
            </div>

            {/* Signal timing - hidden on very small screens */}
            <div className="p-3 sm:p-4 border-b border-gray-700 hidden sm:block">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3 flex items-center gap-2">
                <Zap size={12} className="sm:w-3.5 sm:h-3.5" />
                Signal Timing
              </h3>
              <div className="flex md:flex-col gap-3 md:gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                  <span className="text-xs sm:text-sm text-gray-400">Red: 45s</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                  <span className="text-xs sm:text-sm text-gray-400">Yellow: 5s</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                  <span className="text-xs sm:text-sm text-gray-400">Green: 40s</span>
                </div>
              </div>
              <div className="mt-2 sm:mt-3 p-1.5 sm:p-2 bg-green-500/20 rounded-lg text-center">
                <span className="text-green-400 font-bold text-xs sm:text-sm">Current: GREEN</span>
                <span className="text-gray-400 ml-1 sm:ml-2 text-xs sm:text-sm">32s remaining</span>
              </div>
            </div>

            {/* Quick actions */}
            <div className="p-3 sm:p-4">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3">Quick Actions</h3>
              <div className="grid grid-cols-4 md:grid-cols-2 gap-1.5 sm:gap-2">
                <button className="flex items-center justify-center gap-1 p-1.5 sm:p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-xs sm:text-sm">
                  <Download size={12} className="sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button className="flex items-center justify-center gap-1 p-1.5 sm:p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-xs sm:text-sm">
                  <Share2 size={12} className="sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Share</span>
                </button>
                <button className="flex items-center justify-center gap-1 p-1.5 sm:p-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors text-xs sm:text-sm">
                  <RotateCcw size={12} className="sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button className="flex items-center justify-center gap-1 p-1.5 sm:p-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors text-xs sm:text-sm">
                  <Settings size={12} className="sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
