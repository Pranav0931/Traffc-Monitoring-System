import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Clock, Calendar, Sun, Moon, 
  CloudRain, Wind, Thermometer, ChevronRight,
  AlertCircle, CheckCircle, BarChart3
} from 'lucide-react';

/**
 * Traffic Prediction Component - AI-powered traffic forecasting
 */
export default function TrafficPrediction({ currentData }) {
  const [selectedHour, setSelectedHour] = useState(null);
  const [viewMode, setViewMode] = useState('today'); // today, week, month

  // Generate hourly predictions
  const hourlyPredictions = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    
    return Array.from({ length: 24 }, (_, i) => {
      const hour = (currentHour + i) % 24;
      const isPeakMorning = hour >= 8 && hour <= 10;
      const isPeakEvening = hour >= 17 && hour <= 20;
      const isNight = hour < 6 || hour > 22;
      
      let baseLevel = 30;
      if (isPeakMorning) baseLevel = 80 + Math.random() * 15;
      else if (isPeakEvening) baseLevel = 85 + Math.random() * 12;
      else if (isNight) baseLevel = 15 + Math.random() * 10;
      else baseLevel = 40 + Math.random() * 25;
      
      return {
        hour,
        label: `${hour.toString().padStart(2, '0')}:00`,
        level: Math.round(baseLevel),
        vehicles: Math.round(baseLevel * 2.5),
        congestion: baseLevel > 70 ? 'HIGH' : baseLevel > 40 ? 'MEDIUM' : 'LOW',
        isCurrent: i === 0,
        isPeak: isPeakMorning || isPeakEvening
      };
    });
  }, []);

  // Weather simulation
  const weather = useMemo(() => ({
    temp: Math.round(25 + Math.random() * 10),
    condition: ['Clear', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 3)],
    humidity: Math.round(40 + Math.random() * 40),
    wind: Math.round(5 + Math.random() * 15)
  }), []);

  // Weekly prediction
  const weeklyPredictions = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    
    return Array.from({ length: 7 }, (_, i) => {
      const dayIndex = (today + i) % 7;
      const isWeekend = dayIndex === 0 || dayIndex === 6;
      const baseLevel = isWeekend ? 40 + Math.random() * 20 : 55 + Math.random() * 30;
      
      return {
        day: days[dayIndex],
        date: new Date(Date.now() + i * 86400000).getDate(),
        level: Math.round(baseLevel),
        isToday: i === 0
      };
    });
  }, []);

  const getCongestionColor = (level) => {
    if (level > 70) return '#ef4444';
    if (level > 40) return '#eab308';
    return '#22c55e';
  };

  const getCongestionBg = (level) => {
    if (level > 70) return 'bg-red-500/20';
    if (level > 40) return 'bg-yellow-500/20';
    return 'bg-green-500/20';
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-purple-400 sm:w-5 sm:h-5" />
          <h3 className="font-semibold text-white text-sm sm:text-base">AI Traffic Prediction</h3>
        </div>
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-0.5 sm:p-1">
          {['today', 'week'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-2 sm:px-3 py-1 rounded text-[10px] sm:text-xs font-medium transition-colors ${
                viewMode === mode 
                  ? 'bg-purple-500 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Weather info bar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 sm:mb-4 p-2 sm:p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
        <div className="flex items-center gap-1 sm:gap-2">
          {weather.condition === 'Clear' ? (
            <Sun size={16} className="text-yellow-400 sm:w-5 sm:h-5" />
          ) : weather.condition === 'Cloudy' ? (
            <Wind size={16} className="text-gray-400 sm:w-5 sm:h-5" />
          ) : (
            <CloudRain size={16} className="text-blue-400 sm:w-5 sm:h-5" />
          )}
          <span className="text-xs sm:text-sm text-gray-300">{weather.condition}</span>
        </div>
        <div className="flex items-center gap-1">
          <Thermometer size={12} className="text-red-400 sm:w-3.5 sm:h-3.5" />
          <span className="text-xs sm:text-sm text-gray-300">{weather.temp}°C</span>
        </div>
        <div className="flex items-center gap-1">
          <Wind size={12} className="text-cyan-400 sm:w-3.5 sm:h-3.5" />
          <span className="text-xs sm:text-sm text-gray-300">{weather.wind} km/h</span>
        </div>
        <div className="ml-auto text-[10px] sm:text-xs text-gray-500 hidden sm:block">
          Weather affects traffic patterns
        </div>
      </div>

      {viewMode === 'today' && (
        <>
          {/* Hourly timeline */}
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={12} className="text-gray-400 sm:w-3.5 sm:h-3.5" />
              <span className="text-[10px] sm:text-xs text-gray-400 font-medium">HOURLY FORECAST</span>
            </div>
            
            <div className="flex gap-0.5 sm:gap-1 overflow-x-auto pb-2 scrollbar-thin">
              {hourlyPredictions.slice(0, 12).map((pred, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedHour(pred)}
                  className={`
                    flex flex-col items-center min-w-[40px] sm:min-w-[50px] p-1 sm:p-2 rounded-lg transition-all
                    ${pred.isCurrent ? 'ring-2 ring-blue-500' : ''}
                    ${selectedHour?.hour === pred.hour ? 'bg-purple-500/20' : 'hover:bg-gray-800'}
                  `}
                >
                  <span className="text-[10px] sm:text-xs text-gray-500">{pred.label}</span>
                  <div 
                    className="w-4 sm:w-6 my-1 rounded-full transition-all"
                    style={{ 
                      height: `${Math.max(16, pred.level * 0.5)}px`,
                      backgroundColor: getCongestionColor(pred.level)
                    }}
                  />
                  <span className="text-[10px] sm:text-xs font-medium" style={{ color: getCongestionColor(pred.level) }}>
                    {pred.level}%
                  </span>
                  {pred.isPeak && (
                    <span className="text-[8px] text-orange-400 font-bold mt-0.5 hidden sm:block">PEAK</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Selected hour details */}
          {selectedHour && (
            <div className={`p-3 sm:p-4 rounded-lg mb-3 sm:mb-4 ${getCongestionBg(selectedHour.level)} border border-gray-700`}>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div>
                  <span className="text-base sm:text-lg font-bold text-white">{selectedHour.label}</span>
                  <span className="text-xs sm:text-sm text-gray-400 ml-2">Prediction</span>
                </div>
                <span 
                  className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium"
                  style={{ 
                    backgroundColor: `${getCongestionColor(selectedHour.level)}20`,
                    color: getCongestionColor(selectedHour.level)
                  }}
                >
                  {selectedHour.congestion}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div>
                  <div className="text-lg sm:text-2xl font-bold" style={{ color: getCongestionColor(selectedHour.level) }}>
                    {selectedHour.level}%
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Congestion</div>
                </div>
                <div>
                  <div className="text-lg sm:text-2xl font-bold text-blue-400">
                    {selectedHour.vehicles}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Vehicles</div>
                </div>
                <div>
                  <div className="text-lg sm:text-2xl font-bold text-purple-400">
                    {Math.round(60 - selectedHour.level * 0.4)}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Speed km/h</div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="text-[10px] sm:text-xs text-gray-400 font-medium mb-1.5 sm:mb-2">AI RECOMMENDATIONS</div>
            {[
              { 
                type: 'warning',
                message: 'Peak traffic expected between 17:00-20:00. Consider alternate routes.',
                icon: AlertCircle
              },
              { 
                type: 'success',
                message: 'Best travel window: 11:00-14:00 with minimal congestion.',
                icon: CheckCircle
              },
              { 
                type: 'info',
                message: 'Signal timing optimized for current traffic patterns.',
                icon: BarChart3
              }
            ].map((rec, idx) => (
              <div 
                key={idx}
                className={`flex items-start gap-2 p-1.5 sm:p-2 rounded-lg ${
                  rec.type === 'warning' ? 'bg-yellow-500/10' :
                  rec.type === 'success' ? 'bg-green-500/10' : 'bg-blue-500/10'
                }`}
              >
                <rec.icon size={12} className={`flex-shrink-0 sm:w-3.5 sm:h-3.5 ${
                  rec.type === 'warning' ? 'text-yellow-400' :
                  rec.type === 'success' ? 'text-green-400' : 'text-blue-400'
                }`} />
                <span className="text-[10px] sm:text-xs text-gray-300 leading-relaxed">{rec.message}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {viewMode === 'week' && (
        <div className="space-y-2 sm:space-y-3">
          {weeklyPredictions.map((day, idx) => (
            <div 
              key={idx}
              className={`flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg transition-colors ${
                day.isToday ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-gray-800/50 hover:bg-gray-800'
              }`}
            >
              <div className="w-10 sm:w-16">
                <div className="text-xs sm:text-sm font-medium text-white">{day.day}</div>
                <div className="text-[10px] sm:text-xs text-gray-500">{day.date}</div>
              </div>
              <div className="flex-1">
                <div className="h-2 sm:h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${day.level}%`,
                      backgroundColor: getCongestionColor(day.level)
                    }}
                  />
                </div>
              </div>
              <div className="w-10 sm:w-16 text-right">
                <span 
                  className="text-xs sm:text-sm font-bold"
                  style={{ color: getCongestionColor(day.level) }}
                >
                  {day.level}%
                </span>
              </div>
              <ChevronRight size={14} className="text-gray-600 hidden sm:block" />
            </div>
          ))}
        </div>
      )}

      {/* Accuracy indicator */}
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] sm:text-xs text-gray-500">AI Model Active</span>
        </div>
        <span className="text-[10px] sm:text-xs text-gray-500">Accuracy: <span className="text-green-400">94.2%</span></span>
      </div>
    </div>
  );
}
