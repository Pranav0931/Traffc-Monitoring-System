import React from 'react';
import { BarChart3, Car, Timer, Zap } from 'lucide-react';

/**
 * Statistics card showing a single metric.
 */
function StatCard({ icon: Icon, label, value, subtext, color = 'blue' }) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400',
    orange: 'from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-400',
  };

  return (
    <div className={`
      bg-gradient-to-br ${colorClasses[color]}
      border rounded-xl p-4
      transition-all duration-300
      hover:scale-105
    `}>
      <div className="flex items-center gap-3">
        <Icon size={24} className={colorClasses[color].split(' ').pop()} />
        <div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {value}
          </div>
          <div className="text-xs text-gray-400">
            {label}
          </div>
          {subtext && (
            <div className="text-xs text-gray-500 mt-1">
              {subtext}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Statistics panel showing system metrics.
 */
export default function StatsPanel({ data }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={Car}
        label="Total Vehicles"
        value={data.total}
        subtext="In view"
        color="blue"
      />
      <StatCard
        icon={BarChart3}
        label="Congestion"
        value={data.congestion}
        subtext="Current level"
        color={
          data.congestion === 'LOW' ? 'green' :
          data.congestion === 'MEDIUM' ? 'orange' : 'orange'
        }
      />
      <StatCard
        icon={Timer}
        label="FPS"
        value={data.fps || '--'}
        subtext="Processing rate"
        color="purple"
      />
      <StatCard
        icon={Zap}
        label="Frames"
        value={data.frame_count?.toLocaleString() || '--'}
        subtext="Processed"
        color="green"
      />
    </div>
  );
}
