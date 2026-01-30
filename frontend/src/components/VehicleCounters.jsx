import React from 'react';
import { Car, Bike, Bus, Truck, Siren, Flame } from 'lucide-react';

/**
 * Individual vehicle counter card - Responsive design
 */
function VehicleCounterCard({ type, count, icon: Icon, color, isEmergency = false }) {
  const bgClass = isEmergency 
    ? 'bg-gradient-to-br from-red-500/20 to-blue-500/20 border-red-500/50' 
    : 'bg-traffic-card border-traffic-border';
    
  return (
    <div className={`
      ${bgClass} 
      border rounded-lg sm:rounded-xl p-2 sm:p-4 
      transition-all duration-300 
      hover:border-traffic-accent/50 
      hover:shadow-lg hover:shadow-traffic-accent/10
      active:scale-[0.98]
      ${isEmergency && count > 0 ? 'emergency-active' : ''}
    `}>
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <div className={`
          w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-md sm:rounded-lg
          ${isEmergency ? 'bg-red-500/20' : 'bg-traffic-accent/20'}
        `}>
          <Icon 
            size={14} 
            className={`sm:w-5 sm:h-5 ${isEmergency ? 'text-red-400' : 'text-traffic-accent'}`} 
          />
        </div>
        {isEmergency && count > 0 && (
          <span className="text-[10px] sm:text-xs font-bold text-red-400 animate-pulse">
            PRIORITY
          </span>
        )}
      </div>
      <div className="mt-1 sm:mt-2">
        <div 
          className="text-xl sm:text-4xl font-bold tabular-nums"
          style={{ color }}
        >
          {count}
        </div>
        <div className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1 capitalize truncate">
          {type}
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of all vehicle counters - Responsive
 */
export default function VehicleCounters({ data }) {
  const vehicles = [
    { type: 'cars', count: data.cars, icon: Car, color: '#22c55e' },
    { type: 'bikes', count: data.bikes, icon: Bike, color: '#eab308' },
    { type: 'buses', count: data.buses, icon: Bus, color: '#f97316' },
    { type: 'trucks', count: data.trucks, icon: Truck, color: '#a855f7' },
  ];

  const emergencyVehicles = [
    { type: 'ambulance', count: data.ambulances, icon: Siren, color: '#ef4444', isEmergency: true },
    { type: 'fire', count: data.firebrigade, icon: Flame, color: '#ef4444', isEmergency: true },
  ];

  return (
    <div className="space-y-2 sm:space-y-4">
      {/* Regular Vehicles - 2 cols always, 4 on large screens */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {vehicles.map((vehicle) => (
          <VehicleCounterCard
            key={vehicle.type}
            type={vehicle.type}
            count={vehicle.count}
            icon={vehicle.icon}
            color={vehicle.color}
          />
        ))}
      </div>

      {/* Emergency Vehicles */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {emergencyVehicles.map((vehicle) => (
          <VehicleCounterCard
            key={vehicle.type}
            type={vehicle.type}
            count={vehicle.count}
            icon={vehicle.icon}
            color={vehicle.color}
            isEmergency={vehicle.isEmergency}
          />
        ))}
      </div>
    </div>
  );
}
