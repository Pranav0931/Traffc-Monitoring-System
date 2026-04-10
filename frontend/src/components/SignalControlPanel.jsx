import React, { useMemo } from 'react';
import { 
  TrafficCone, Timer, AlertTriangle, TrendingUp,
  ArrowRight, Zap, Shield
} from 'lucide-react';

/**
 * Format lane ID for display.
 * "lane_1" -> "Lane 1"
 */
function formatLaneName(laneId) {
  if (!laneId) return '';
  return laneId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Single lane card showing vehicle count, signal time, and status bar.
 */
function LaneCard({ laneId, count, signalTime, isPriority, maxCount, threshold = 15 }) {
  const isOverloaded = count >= threshold;
  const barPercent = maxCount > 0 ? Math.min(100, (count / maxCount) * 100) : 0;
  const signalBarPercent = signalTime ? Math.min(100, (signalTime / 60) * 100) : 0;

  return (
    <div className={`
      rounded-xl border p-3 sm:p-4 transition-all duration-300
      ${isPriority 
        ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/50 shadow-lg shadow-red-500/10' 
        : isOverloaded
          ? 'bg-gradient-to-br from-yellow-500/15 to-orange-500/15 border-yellow-500/40'
          : 'bg-gradient-to-br from-gray-500/10 to-gray-600/10 border-gray-700/50'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <TrafficCone size={16} className={`
            ${isPriority ? 'text-red-400 animate-pulse' : isOverloaded ? 'text-yellow-400' : 'text-gray-400'}
            sm:w-[18px] sm:h-[18px]
          `} />
          <span className="text-xs sm:text-sm font-semibold text-white">
            {formatLaneName(laneId)}
          </span>
        </div>
        {isPriority && (
          <span className="text-[10px] sm:text-xs bg-red-500/30 text-red-300 px-2 py-0.5 rounded-full font-medium animate-pulse">
            PRIORITY
          </span>
        )}
        {!isPriority && isOverloaded && (
          <span className="text-[10px] sm:text-xs bg-yellow-500/30 text-yellow-300 px-2 py-0.5 rounded-full font-medium">
            HEAVY
          </span>
        )}
      </div>

      {/* Vehicle count */}
      <div className="mb-2 sm:mb-3">
        <div className="flex items-end gap-1">
          <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">{count}</span>
          <span className="text-[10px] sm:text-xs text-gray-400 pb-1">vehicles</span>
        </div>
        {/* Vehicle density bar */}
        <div className="mt-1.5 h-1.5 sm:h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 ease-out
              ${isPriority ? 'bg-gradient-to-r from-red-500 to-orange-400' 
                : isOverloaded ? 'bg-gradient-to-r from-yellow-500 to-orange-400' 
                : 'bg-gradient-to-r from-green-500 to-emerald-400'}`}
            style={{ width: `${barPercent}%` }}
          />
        </div>
      </div>

      {/* Signal time */}
      <div className="flex items-center gap-2">
        <Timer size={13} className="text-blue-400 sm:w-[15px] sm:h-[15px]" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-gray-400">Signal Time</span>
            <span className="text-xs sm:text-sm font-bold text-blue-300 tabular-nums">{signalTime || 20}s</span>
          </div>
          <div className="mt-1 h-1 sm:h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700 ease-out"
              style={{ width: `${signalBarPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Signal Control Panel — displays lane-wise vehicle counts,
 * adaptive signal timing allocations, and priority lane info.
 */
export default function SignalControlPanel({ data }) {
  const laneCounts = data.lane_counts || {};
  const signalTimes = data.signal_times || {};
  const priorityLane = data.priority_lane || null;
  const signalMode = data.signal_mode || 'NORMAL';

  const laneIds = useMemo(() => Object.keys(laneCounts), [laneCounts]);
  const maxCount = useMemo(() => Math.max(...Object.values(laneCounts), 1), [laneCounts]);
  const totalInRois = useMemo(() => Object.values(laneCounts).reduce((a, b) => a + b, 0), [laneCounts]);

  // Mode color mapping
  const modeConfig = {
    NORMAL:   { color: 'text-green-400',  bg: 'bg-green-500/20', border: 'border-green-500/30', icon: Shield,         label: 'Normal' },
    ADAPTIVE: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', icon: Zap,            label: 'Adaptive' },
    CRITICAL: { color: 'text-red-400',    bg: 'bg-red-500/20',    border: 'border-red-500/30',    icon: AlertTriangle,  label: 'Critical' },
  };
  const mode = modeConfig[signalMode] || modeConfig.NORMAL;
  const ModeIcon = mode.icon;

  // If no lane data yet, show placeholder
  if (laneIds.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="text-lg sm:text-xl">🚦</span>
          <span className="text-sm sm:text-base">Signal Control</span>
        </div>
        <div className="flex items-center justify-center h-32 sm:h-48 text-gray-500">
          <p className="text-xs sm:text-sm">Waiting for ROI lane data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header flex-wrap gap-2">
        <span className="text-lg sm:text-xl">🚦</span>
        <span className="text-sm sm:text-base font-semibold">Adaptive Signal Control</span>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* Mode badge */}
          <div className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full ${mode.bg} ${mode.border} border`}>
            <ModeIcon size={12} className={`${mode.color} sm:w-[14px] sm:h-[14px]`} />
            <span className={`text-[10px] sm:text-xs font-medium ${mode.color}`}>{mode.label}</span>
          </div>
          {/* Total count */}
          <div className="text-xs sm:text-sm text-gray-400">
            <span className="font-bold text-white">{totalInRois}</span> in ROI
          </div>
        </div>
      </div>

      {/* Lane cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mt-3 sm:mt-4">
        {laneIds.map(laneId => (
          <LaneCard
            key={laneId}
            laneId={laneId}
            count={laneCounts[laneId] || 0}
            signalTime={signalTimes[laneId]}
            isPriority={laneId === priorityLane}
            maxCount={maxCount}
          />
        ))}
      </div>

      {/* Priority lane footer */}
      {priorityLane && (
        <div className="mt-3 sm:mt-4 flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
          <AlertTriangle size={16} className="text-red-400 flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] sm:text-xs text-gray-400">Priority Clearance</span>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-white">{formatLaneName(priorityLane)}</span>
              <ArrowRight size={12} className="text-gray-500 hidden sm:inline" />
              <span className="text-[10px] sm:text-xs text-red-300">
                {laneCounts[priorityLane]} vehicles → {signalTimes[priorityLane]}s green
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
