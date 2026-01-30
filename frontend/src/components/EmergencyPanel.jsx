import React from 'react';
import { AlertTriangle, Siren, Flame, Radio } from 'lucide-react';

/**
 * Emergency alert panel with visual priority indicators.
 */
export default function EmergencyPanel({ isActive, emergencyType, message }) {
  if (!isActive) {
    return (
      <div className="card border-gray-700/50">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="p-1.5 sm:p-2 rounded-lg bg-gray-700/30">
            <Radio size={16} className="text-gray-500 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-400">
              Emergency Priority System
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              Monitoring for emergency vehicles...
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center py-6 sm:py-8 border border-gray-700/50 rounded-xl bg-gray-800/30">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gray-700/30 flex items-center justify-center">
              <Radio size={24} className="text-gray-500 sm:w-8 sm:h-8" />
            </div>
            <p className="text-gray-500 font-medium text-sm sm:text-base">
              No Emergency Detected
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              System is actively monitoring
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getEmergencyConfig = () => {
    switch (emergencyType) {
      case 'ambulance':
        return {
          icon: Siren,
          title: 'AMBULANCE DETECTED',
          color: 'from-red-500 to-blue-500',
          iconBg: 'bg-red-500/30',
          iconColor: 'text-red-400'
        };
      case 'firebrigade':
        return {
          icon: Flame,
          title: 'FIRE BRIGADE DETECTED',
          color: 'from-red-500 to-orange-500',
          iconBg: 'bg-orange-500/30',
          iconColor: 'text-orange-400'
        };
      default:
        return {
          icon: AlertTriangle,
          title: 'EMERGENCY VEHICLE DETECTED',
          color: 'from-red-500 to-yellow-500',
          iconBg: 'bg-yellow-500/30',
          iconColor: 'text-yellow-400'
        };
    }
  };

  const config = getEmergencyConfig();
  const Icon = config.icon;

  return (
    <div className={`
      emergency-panel active
      border-red-500
    `}>
      {/* Flashing header */}
      <div className="emergency-flash rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className={`p-2 sm:p-3 rounded-xl ${config.iconBg} flex-shrink-0`}>
              <Icon size={20} className={`${config.iconColor} sm:w-7 sm:h-7`} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-xl font-bold text-white truncate">
                🚨 {config.title}
              </h3>
              <p className="text-xs sm:text-sm text-white/80">
                Priority Clearance Required
              </p>
            </div>
          </div>
          <div className="animate-pulse flex-shrink-0 ml-2">
            <AlertTriangle size={24} className="text-white sm:w-8 sm:h-8" />
          </div>
        </div>
      </div>

      {/* Alert message */}
      <div className="bg-black/30 rounded-xl p-3 sm:p-4 border border-red-500/30">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="mt-0.5 sm:mt-1 flex-shrink-0">
            <Siren size={16} className="text-red-400 animate-pulse sm:w-5 sm:h-5" />
          </div>
          <div>
            <p className="text-red-300 font-medium text-sm sm:text-base">
              {message || '🚨 Emergency Vehicle Detected – Priority Clearance Required'}
            </p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1.5 sm:mt-2">
              Traffic signals should provide priority passage. 
              All vehicles clear the path immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Priority indicator */}
      <div className="mt-3 sm:mt-4 flex items-center justify-between text-xs sm:text-sm">
        <span className="text-gray-400">Priority Level:</span>
        <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-red-500/20 text-red-400 font-bold animate-pulse">
          CRITICAL
        </span>
      </div>
    </div>
  );
}
