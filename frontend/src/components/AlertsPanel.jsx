import React, { useState, useEffect } from 'react';
import { 
  Bell, AlertTriangle, Info, CheckCircle, XCircle, 
  ChevronDown, ChevronUp, Clock, MapPin, Volume2,
  X, Filter, Trash2
} from 'lucide-react';

// Sample alerts generator
const generateAlerts = () => {
  const types = ['emergency', 'warning', 'info', 'success'];
  const locations = ['Variety Square', 'Sitabuldi', 'Medical Square', 'Shankar Nagar', 'Dharampeth'];
  const messages = {
    emergency: [
      'Ambulance detected - Priority mode activated',
      'Fire brigade approaching - Clear route',
      'Accident reported - Traffic diversion needed',
      'VIP movement detected'
    ],
    warning: [
      'High congestion detected',
      'Traffic signal malfunction',
      'Road work in progress',
      'Unusual traffic pattern detected'
    ],
    info: [
      'Peak hour traffic expected',
      'Weather advisory - Light rain',
      'Event nearby - Increased traffic',
      'New camera online'
    ],
    success: [
      'Traffic flow normalized',
      'Emergency cleared',
      'Signal timing optimized',
      'Congestion reduced'
    ]
  };

  return Array.from({ length: 8 }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    return {
      id: i + 1,
      type,
      message: messages[type][Math.floor(Math.random() * messages[type].length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      read: Math.random() > 0.5
    };
  }).sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * Single alert item component
 */
function AlertItem({ alert, onDismiss, onMarkRead }) {
  const [expanded, setExpanded] = useState(false);

  const getAlertStyles = (type) => {
    switch (type) {
      case 'emergency':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          icon: AlertTriangle,
          iconColor: 'text-red-400',
          badge: 'bg-red-500'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          icon: AlertTriangle,
          iconColor: 'text-yellow-400',
          badge: 'bg-yellow-500'
        };
      case 'info':
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          icon: Info,
          iconColor: 'text-blue-400',
          badge: 'bg-blue-500'
        };
      case 'success':
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          icon: CheckCircle,
          iconColor: 'text-green-400',
          badge: 'bg-green-500'
        };
      default:
        return {
          bg: 'bg-gray-500/10',
          border: 'border-gray-500/30',
          icon: Info,
          iconColor: 'text-gray-400',
          badge: 'bg-gray-500'
        };
    }
  };

  const styles = getAlertStyles(alert.type);
  const Icon = styles.icon;

  const formatTime = (date) => {
    const now = new Date();
    const diff = (now - date) / 1000;
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div 
      className={`
        ${styles.bg} ${styles.border} border rounded-lg p-2 sm:p-3 
        transition-all duration-200 cursor-pointer
        ${!alert.read ? 'ring-1 ring-blue-500/50' : ''}
        hover:bg-opacity-20
      `}
      onClick={() => { setExpanded(!expanded); onMarkRead(alert.id); }}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <div className={`p-1 sm:p-1.5 rounded-lg ${styles.bg} flex-shrink-0`}>
          <Icon size={14} className={`${styles.iconColor} sm:w-4 sm:h-4`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
            <span className={`px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase rounded ${styles.badge} text-white`}>
              {alert.type}
            </span>
            {!alert.read && (
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></span>
            )}
          </div>
          
          <p className="text-xs sm:text-sm text-white font-medium truncate">
            {alert.message}
          </p>
          
          <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-gray-500">
            <span className="flex items-center gap-0.5 sm:gap-1 truncate">
              <MapPin size={10} className="flex-shrink-0" />
              <span className="truncate">{alert.location}</span>
            </span>
            <span className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
              <Clock size={10} />
              {formatTime(alert.timestamp)}
            </span>
          </div>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onDismiss(alert.id); }}
          className="p-0.5 sm:p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
        >
          <X size={12} className="text-gray-500 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-700">
          <p className="text-[10px] sm:text-xs text-gray-400 mb-2">
            Full details about this alert would appear here, including any recommended actions,
            related camera feeds, and historical context.
          </p>
          <div className="flex gap-1.5 sm:gap-2">
            <button className="px-2 sm:px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-[10px] sm:text-xs hover:bg-blue-500/30 transition-colors">
              View Camera
            </button>
            <button className="px-2 sm:px-3 py-1 bg-gray-500/20 text-gray-400 rounded text-[10px] sm:text-xs hover:bg-gray-500/30 transition-colors">
              Show on Map
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Alerts Panel - Shows real-time traffic alerts and notifications
 */
export default function AlertsPanel({ emergencyMode }) {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showPanel, setShowPanel] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Initialize alerts
  useEffect(() => {
    setAlerts(generateAlerts());
    
    // Add new alert periodically
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newAlert = generateAlerts()[0];
        newAlert.id = Date.now();
        newAlert.timestamp = new Date();
        newAlert.read = false;
        setAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Add emergency alert when mode changes
  useEffect(() => {
    if (emergencyMode) {
      const emergencyAlert = {
        id: Date.now(),
        type: 'emergency',
        message: 'Emergency vehicle detected - Priority mode activated',
        location: 'System Wide',
        timestamp: new Date(),
        read: false
      };
      setAlerts(prev => [emergencyAlert, ...prev]);
    }
  }, [emergencyMode]);

  const handleDismiss = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleMarkRead = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const handleClearAll = () => {
    setAlerts([]);
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.type === filter);

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <div className="card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Bell size={18} className="text-blue-400 flex-shrink-0 sm:w-5 sm:h-5" />
          <h3 className="font-semibold text-white text-sm sm:text-base truncate">Alerts</h3>
          {unreadCount > 0 && (
            <span className="px-1.5 sm:px-2 py-0.5 bg-blue-500 text-white text-[10px] sm:text-xs font-bold rounded-full flex-shrink-0">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1 sm:p-1.5 rounded-lg transition-colors ${soundEnabled ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-white'}`}
            title={soundEnabled ? 'Mute notifications' : 'Enable sound'}
          >
            <Volume2 size={14} className="sm:w-4 sm:h-4" />
          </button>
          <button 
            onClick={() => setShowPanel(!showPanel)}
            className="p-1 sm:p-1.5 hover:bg-gray-700 rounded-lg transition-colors text-gray-400"
          >
            {showPanel ? <ChevronUp size={14} className="sm:w-4 sm:h-4" /> : <ChevronDown size={14} className="sm:w-4 sm:h-4" />}
          </button>
        </div>
      </div>

      {showPanel && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 overflow-x-auto pb-2 scrollbar-thin">
            {['all', 'emergency', 'warning', 'info', 'success'].map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors ${
                  filter === type 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
            
            {alerts.length > 0 && (
              <button
                onClick={handleClearAll}
                className="ml-auto px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                <Trash2 size={10} className="sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}
          </div>

          {/* Alerts list */}
          <div className="flex-1 overflow-y-auto space-y-1.5 sm:space-y-2 pr-1">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map(alert => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onDismiss={handleDismiss}
                  onMarkRead={handleMarkRead}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-gray-500">
                <CheckCircle size={32} className="mb-2 text-green-400 sm:w-10 sm:h-10" />
                <p className="text-xs sm:text-sm">No alerts to display</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
