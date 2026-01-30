import React from 'react';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Congestion status badge with dynamic styling.
 */
export default function CongestionBadge({ level, total }) {
  const getConfig = () => {
    switch (level) {
      case 'LOW':
        return {
          bgClass: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20',
          borderClass: 'border-green-500/50',
          textClass: 'text-green-400',
          glowClass: 'shadow-green-500/30',
          icon: TrendingDown,
          label: 'Low Traffic',
          description: 'Roads are clear - smooth flow'
        };
      case 'MEDIUM':
        return {
          bgClass: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20',
          borderClass: 'border-yellow-500/50',
          textClass: 'text-yellow-400',
          glowClass: 'shadow-yellow-500/30',
          icon: Minus,
          label: 'Moderate Traffic',
          description: 'Some slowdowns expected'
        };
      case 'HIGH':
        return {
          bgClass: 'bg-gradient-to-r from-red-500/20 to-orange-500/20',
          borderClass: 'border-red-500/50',
          textClass: 'text-red-400',
          glowClass: 'shadow-red-500/30',
          icon: TrendingUp,
          label: 'Heavy Traffic',
          description: 'Significant delays expected'
        };
      default:
        return {
          bgClass: 'bg-gray-500/20',
          borderClass: 'border-gray-500/50',
          textClass: 'text-gray-400',
          glowClass: 'shadow-gray-500/30',
          icon: Activity,
          label: 'Unknown',
          description: 'Status unavailable'
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div className={`
      ${config.bgClass} 
      ${config.borderClass} 
      border-2 rounded-xl sm:rounded-2xl p-3 sm:p-6
      shadow-lg ${config.glowClass}
      transition-all duration-500
    `}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`
            p-2 sm:p-3 rounded-lg sm:rounded-xl 
            ${config.bgClass} 
            ${config.borderClass} 
            border
          `}>
            <Activity size={18} className={`${config.textClass} sm:w-6 sm:h-6`} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white">
              Congestion Level
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">
              Real-time traffic density
            </p>
          </div>
        </div>
        <Icon size={20} className={`${config.textClass} sm:w-7 sm:h-7`} />
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className={`
            text-xl sm:text-4xl font-bold ${config.textClass}
            tracking-wide truncate
          `}>
            {config.label}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 truncate">
            {config.description}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-xl sm:text-3xl font-bold text-white tabular-nums">
            {total}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">
            vehicles
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 sm:mt-4 h-1.5 sm:h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            level === 'LOW' ? 'bg-green-500 w-1/3' :
            level === 'MEDIUM' ? 'bg-yellow-500 w-2/3' :
            'bg-red-500 w-full'
          }`}
        />
      </div>
    </div>
  );
}
