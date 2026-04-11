import React, { useState, useMemo } from 'react';
import { Camera, ChevronLeft, ChevronRight, Maximize2, Grid, RotateCw } from 'lucide-react';

/**
 * 360° Surveillance Module.
 * Multi-angle camera grid per intersection with view switching.
 */
export default function SurveillanceModule({ trafficData = {}, intersections = [] }) {
  const [selectedIntersection, setSelectedIntersection] = useState(0);
  const [activeView, setActiveView] = useState('grid'); // 'grid' or 'single'
  const [activeAngle, setActiveAngle] = useState(0);

  const cameraAngles = ['North', 'South', 'East', 'West'];
  const intersectionList = useMemo(() => {
    if (intersections.length > 0) return intersections;
    // Fallback
    return [
      { id: 'variety_square', name: 'Variety Square' },
      { id: 'sitabuldi', name: 'Sitabuldi' },
      { id: 'dharampeth', name: 'Dharampeth' },
      { id: 'sadar', name: 'Sadar' },
      { id: 'medical_square', name: 'Medical Square' },
      { id: 'shankar_nagar', name: 'Shankar Nagar' },
    ];
  }, [intersections]);

  const currentIntersection = intersectionList[selectedIntersection] || intersectionList[0];
  const rawFrame = trafficData?.frame || trafficData?.frame_b64 || trafficData?.image || '';
  const frameSrc = rawFrame
    ? (rawFrame.startsWith('data:image') ? rawFrame : `data:image/jpeg;base64,${rawFrame}`)
    : '';

  const getRotation = (index) => {
    // Simulate different angles by applying CSS transforms
    const transforms = [
      'rotate(0deg)',       // North
      'rotate(180deg)',     // South
      'rotate(90deg)',      // East
      'rotate(-90deg)',     // West
    ];
    return transforms[index] || 'rotate(0deg)';
  };

  const getFilter = (index) => {
    // Slightly different visual filters to differentiate angles
    const filters = [
      'brightness(1)',
      'brightness(0.9) contrast(1.1)',
      'brightness(1.05) saturate(0.9)',
      'brightness(0.95) hue-rotate(5deg)',
    ];
    return filters[index] || 'brightness(1)';
  };

  return (
    <div className="card">
      <div className="card-header flex-wrap gap-2">
        <Camera size={18} className="text-cyan-400" />
        <span>360° Surveillance Module</span>
        
        {/* View toggle */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setActiveView('grid')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeView === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title="Grid View"
          >
            <Grid size={14} />
          </button>
          <button
            onClick={() => setActiveView('single')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeView === 'single' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title="Single View"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Intersection Selector */}
      <div className="flex items-center gap-2 mt-3 mb-4 overflow-x-auto pb-2">
        {intersectionList.map((intersection, idx) => (
          <button
            key={intersection.id}
            onClick={() => setSelectedIntersection(idx)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedIntersection === idx
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {intersection.name}
          </button>
        ))}
      </div>

      {/* Grid View - All 4 angles */}
      {activeView === 'grid' && (
        <div className="grid grid-cols-2 gap-2">
          {cameraAngles.map((angle, idx) => (
            <div
              key={angle}
              className="relative rounded-lg overflow-hidden bg-gray-900 border border-gray-700/50 cursor-pointer hover:border-cyan-500/50 transition-colors group"
              onClick={() => { setActiveView('single'); setActiveAngle(idx); }}
            >
              {/* Camera Feed */}
              <div className="aspect-video relative overflow-hidden">
                {frameSrc ? (
                  <img
                    src={frameSrc}
                    alt={`${angle} view`}
                    className="w-full h-full object-cover transition-transform duration-300"
                    style={{
                      transform: getRotation(idx),
                      filter: getFilter(idx),
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600">
                    <Camera size={24} />
                  </div>
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white">{angle}</span>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-[10px] text-red-400">LIVE</span>
                    </div>
                  </div>
                </div>
                {/* Hover expand icon */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 size={14} className="text-white/80" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Single View - One angle expanded */}
      {activeView === 'single' && (
        <div className="relative">
          {/* Angle Navigation */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <button
              onClick={() => setActiveAngle((activeAngle - 1 + 4) % 4)}
              className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {cameraAngles.map((angle, idx) => (
              <button
                key={angle}
                onClick={() => setActiveAngle(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeAngle === idx
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {angle}
              </button>
            ))}
            <button
              onClick={() => setActiveAngle((activeAngle + 1) % 4)}
              className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Expanded Feed */}
          <div className="relative rounded-xl overflow-hidden bg-gray-900 border border-gray-700/50">
            <div className="aspect-video relative">
              {frameSrc ? (
                <img
                  src={frameSrc}
                  alt={`${cameraAngles[activeAngle]} view`}
                  className="w-full h-full object-cover transition-transform duration-500"
                  style={{
                    transform: getRotation(activeAngle),
                    filter: getFilter(activeAngle),
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <Camera size={48} />
                </div>
              )}
              {/* Overlay info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{currentIntersection.name}</p>
                    <p className="text-xs text-gray-400">{cameraAngles[activeAngle]} Camera — CAM-{(selectedIntersection * 4 + activeAngle + 1).toString().padStart(3, '0')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-red-400">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      LIVE
                    </span>
                    <button
                      onClick={() => setActiveView('grid')}
                      className="p-1.5 rounded-lg bg-gray-800/80 text-gray-300 hover:text-white transition-colors"
                    >
                      <Grid size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info bar */}
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>{currentIntersection.lat?.toFixed(4)}, {currentIntersection.lng?.toFixed(4)}</span>
            <span className="flex items-center gap-1">
              <RotateCw size={10} />
              Auto-refresh active
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
