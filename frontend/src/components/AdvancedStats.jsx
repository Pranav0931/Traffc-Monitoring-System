import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Minus, Clock, Gauge, 
  Thermometer, Wind, AlertTriangle, BarChart3,
  ArrowUp, ArrowDown, Activity
} from 'lucide-react';

/**
 * Mini sparkline chart component
 */
function Sparkline({ data, color = '#3b82f6', height = 40 }) {
  const points = useMemo(() => {
    if (!data || data.length < 2) return '';
    
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const width = 100;
    
    return data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 4);
      return `${x},${y}`;
    }).join(' ');
  }, [data, height]);
  
  if (!data || data.length < 2) return null;
  
  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <polygon
        points={`0,${height} ${points} 100,${height}`}
        fill={`url(#gradient-${color})`}
      />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Metric card with trend indicator
 */
function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  unit = '', 
  trend = 'stable', 
  change = 0,
  color = 'blue',
  sparklineData = null
}) {
  const colorClasses = {
    blue: { bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', text: 'text-blue-400', line: '#3b82f6' },
    green: { bg: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/30', text: 'text-green-400', line: '#22c55e' },
    yellow: { bg: 'from-yellow-500/20 to-amber-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', line: '#eab308' },
    red: { bg: 'from-red-500/20 to-orange-500/20', border: 'border-red-500/30', text: 'text-red-400', line: '#ef4444' },
    purple: { bg: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30', text: 'text-purple-400', line: '#a855f7' },
  };
  
  const colors = colorClasses[color];
  
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400';
  
  return (
    <div className={`
      bg-gradient-to-br ${colors.bg} ${colors.border}
      border rounded-xl p-3 sm:p-4 transition-all duration-300
      hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]
    `}>
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className={`p-1.5 sm:p-2 rounded-lg bg-black/20`}>
          <Icon size={16} className={`${colors.text} sm:w-5 sm:h-5`} />
        </div>
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon size={12} className="sm:w-3.5 sm:h-3.5" />
          <span className="text-[10px] sm:text-xs font-medium">{Math.abs(change)}%</span>
        </div>
      </div>
      
      <div className="mb-1 sm:mb-2">
        <div className="text-lg sm:text-2xl font-bold text-white tabular-nums">
          {value}
          {unit && <span className="text-xs sm:text-sm text-gray-400 ml-1">{unit}</span>}
        </div>
        <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">{label}</div>
      </div>
      
      {sparklineData && (
        <div className="mt-2 sm:mt-3 hidden sm:block">
          <Sparkline data={sparklineData} color={colors.line} height={30} />
        </div>
      )}
    </div>
  );
}

/**
 * Traffic flow direction indicator
 */
function FlowIndicator({ direction, intensity }) {
  const arrows = {
    north: <ArrowUp />,
    south: <ArrowDown />,
    east: <ArrowUp className="rotate-90" />,
    west: <ArrowDown className="rotate-90" />
  };
  
  const intensityColor = intensity > 0.7 ? 'text-red-400' : intensity > 0.4 ? 'text-yellow-400' : 'text-green-400';
  
  return (
    <div className={`flex items-center gap-2 ${intensityColor}`}>
      {arrows[direction] || arrows.north}
      <span className="text-xs">{Math.round(intensity * 100)}%</span>
    </div>
  );
}

/**
 * Advanced Statistics Dashboard with real-time metrics.
 */
export default function AdvancedStats({ data }) {
  // Generate historical data for sparklines
  const [history, setHistory] = useState({
    vehicles: [],
    congestion: [],
    speed: [],
    flow: []
  });
  
  useEffect(() => {
    setHistory(prev => ({
      vehicles: [...prev.vehicles.slice(-19), data.total || 0],
      congestion: [...prev.congestion.slice(-19), data.density_score || 0],
      speed: [...prev.speed.slice(-19), data.avg_speed || 0],
      flow: [...prev.flow.slice(-19), data.flow_rate || 0]
    }));
  }, [data.total, data.density_score, data.avg_speed, data.flow_rate]);
  
  // Calculate trends
  const getTrend = (arr) => {
    if (arr.length < 2) return 'stable';
    const recent = arr.slice(-5);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const prev = arr.slice(-10, -5);
    const prevAvg = prev.length > 0 ? prev.reduce((a, b) => a + b, 0) / prev.length : avg;
    if (avg > prevAvg * 1.1) return 'up';
    if (avg < prevAvg * 0.9) return 'down';
    return 'stable';
  };
  
  const getChange = (arr) => {
    if (arr.length < 2) return 0;
    const current = arr[arr.length - 1];
    const previous = arr[arr.length - 2];
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };
  
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Primary metrics grid - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <MetricCard
          icon={Activity}
          label="Total Vehicles"
          value={data.total || 0}
          trend={getTrend(history.vehicles)}
          change={getChange(history.vehicles)}
          color="blue"
          sparklineData={history.vehicles}
        />
        <MetricCard
          icon={Gauge}
          label="Density Score"
          value={Math.round(data.density_score || 0)}
          unit="%"
          trend={getTrend(history.congestion)}
          change={getChange(history.congestion)}
          color={data.density_score > 70 ? 'red' : data.density_score > 40 ? 'yellow' : 'green'}
          sparklineData={history.congestion}
        />
        <MetricCard
          icon={Wind}
          label="Avg Speed"
          value={Math.round(data.avg_speed || 0)}
          unit="km/h"
          trend={getTrend(history.speed)}
          change={getChange(history.speed)}
          color="purple"
          sparklineData={history.speed}
        />
        <MetricCard
          icon={BarChart3}
          label="Flow Rate"
          value={(data.flow_rate || 0).toFixed(1)}
          unit="/min"
          trend={getTrend(history.flow)}
          change={getChange(history.flow)}
          color="green"
          sparklineData={history.flow}
        />
      </div>
      
      {/* Secondary info row - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {/* Peak hour indicator */}
        <div className={`
          rounded-xl p-2 sm:p-4 border
          ${data.peak_hour 
            ? 'bg-orange-500/20 border-orange-500/30' 
            : 'bg-gray-500/20 border-gray-500/30'}
        `}>
          <div className="flex items-center gap-1 sm:gap-2">
            <Clock size={14} className={`sm:w-[18px] sm:h-[18px] ${data.peak_hour ? 'text-orange-400' : 'text-gray-400'}`} />
            <span className="text-xs sm:text-sm font-medium">
              {data.peak_hour ? 'Peak' : 'Off-Peak'}
            </span>
          </div>
          <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">
            {data.peak_hour ? 'Heavy traffic expected' : 'Normal conditions'}
          </div>
        </div>
        
        {/* Processing info */}
        <div className="bg-gray-500/20 border border-gray-500/30 rounded-xl p-2 sm:p-4">
          <div className="flex items-center gap-1 sm:gap-2">
            <Activity size={14} className="sm:w-[18px] sm:h-[18px] text-blue-400" />
            <span className="text-xs sm:text-sm font-medium">{data.fps || 0} FPS</span>
          </div>
          <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">
            Frame: {(data.frame_count || 0).toLocaleString()}
          </div>
        </div>
        
        {/* Emergency count */}
        <div className={`
          rounded-xl p-2 sm:p-4 border
          ${(data.ambulances > 0 || data.firebrigade > 0) 
            ? 'bg-red-500/20 border-red-500/30' 
            : 'bg-gray-500/20 border-gray-500/30'}
        `}>
          <div className="flex items-center gap-1 sm:gap-2">
            <AlertTriangle 
              size={14} 
              className={`sm:w-[18px] sm:h-[18px] ${(data.ambulances > 0 || data.firebrigade > 0) 
                ? 'text-red-400 animate-pulse' 
                : 'text-gray-400'}`} 
            />
            <span className="text-xs sm:text-sm font-medium">
              <span className="hidden sm:inline">Emergency:</span> {(data.ambulances || 0) + (data.firebrigade || 0)}
            </span>
          </div>
          <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">
            🚑 {data.ambulances || 0} | 🚒 {data.firebrigade || 0}
          </div>
        </div>
        
        {/* Timestamp */}
        <div className="bg-gray-500/20 border border-gray-500/30 rounded-xl p-2 sm:p-4">
          <div className="flex items-center gap-1 sm:gap-2">
            <Clock size={14} className="sm:w-[18px] sm:h-[18px] text-gray-400" />
            <span className="text-xs sm:text-sm font-medium">Updated</span>
          </div>
          <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 font-mono">
            {data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '--:--:--'}
          </div>
        </div>
      </div>
    </div>
  );
}
