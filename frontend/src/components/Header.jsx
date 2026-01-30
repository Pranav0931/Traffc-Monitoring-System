import React from 'react';
import { Activity, Wifi, WifiOff, Clock, MapPin, Gauge } from 'lucide-react';
import { useCurrentTime } from '../hooks/useTrafficData';

/**
 * Header component with system status and live indicator - Fully Responsive
 */
export default function Header({ isConnected, lastUpdate, area }) {
  const currentTime = useCurrentTime();

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const timeSinceUpdate = Math.floor((Date.now() - lastUpdate) / 1000);

  return (
    <header className="bg-traffic-card border-b border-traffic-border">
      <div className="container mx-auto px-3 sm:px-6 py-2 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          {/* Left - Title and location */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 hidden sm:block">
              <Activity size={24} className="text-blue-400 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h1 className="text-sm sm:text-xl lg:text-2xl font-bold text-white">
                <span className="sm:hidden">Traffic AI Monitor</span>
                <span className="hidden sm:inline">AI-Based Real-Time Traffic Monitoring</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                <span className="text-blue-400 hidden sm:inline">& Emergency Priority</span>
                <MapPin size={12} className="text-gray-500 sm:w-3.5 sm:h-3.5" />
                <span className="truncate max-w-[150px] sm:max-w-none">{area}</span>
              </p>
            </div>
          </div>

          {/* Right - Status indicators */}
          <div className="flex items-center gap-2 sm:gap-6 justify-between sm:justify-end">
            {/* Connection status */}
            <div className="flex items-center gap-1 sm:gap-2">
              {isConnected ? (
                <>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500 animate-pulse" />
                  <Wifi size={14} className="text-green-400 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-green-400 font-medium">LIVE</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500" />
                  <WifiOff size={14} className="text-red-400 sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm text-red-400 font-medium">OFFLINE</span>
                </>
              )}
            </div>

            {/* Divider - hidden on mobile */}
            <div className="hidden sm:block h-8 w-px bg-traffic-border" />

            {/* Time display */}
            <div className="text-right">
              <div className="flex items-center gap-1 sm:gap-2 text-white font-mono text-sm sm:text-lg">
                <Clock size={14} className="text-gray-500 sm:w-[18px] sm:h-[18px]" />
                {formatTime(currentTime)}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">
                {formatDate(currentTime)}
              </div>
            </div>

            {/* Update indicator - hidden on mobile */}
            <div className="hidden lg:block text-right">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Gauge size={16} />
                <span>Updated: {timeSinceUpdate}s ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
