import React, { useRef, useState } from 'react';
import { Camera, Play, Pause, Maximize2, RefreshCw } from 'lucide-react';

/**
 * Live Camera Feed component
 * Displays base64 encoded live video stream from backend
 */
export default function LiveCameraFeed({ frame, vehicles = [], emergencyMode = false, fps = 0 }) {
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    const container = containerRef.current;
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
    <div 
      ref={containerRef}
      className={`
      relative rounded-xl overflow-hidden
      border-2 ${emergencyMode ? 'border-red-500 emergency-border' : 'border-traffic-border'}
      bg-black h-full min-h-[450px]
    `}>
      
      {/* Live Stream Image */}
      {frame && isPlaying ? (
        <img 
          src={`data:image/jpeg;base64,${frame}`} 
          alt="Live Traffic Feed"
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full text-gray-500 font-mono flex-col gap-4">
          <Camera size={48} className="opacity-20" />
          <span>{isPlaying ? 'Connecting to live stream...' : 'Stream paused'}</span>
        </div>
      )}
      
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
              <span className="text-xs text-red-400 font-bold">LIVE</span>
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
    </div>
  );
}
