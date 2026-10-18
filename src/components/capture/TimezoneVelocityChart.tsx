'use client';

import React from 'react';
import { MotionParameterResult } from '@/lib/motion/parameters';
import { KeyMomentEvent } from '@/lib/motion/events';

interface TimezoneVelocityChartProps {
  parameterResults: MotionParameterResult[];
  keyEvents: KeyMomentEvent[];
}

export function TimezoneVelocityChart({ parameterResults, keyEvents }: TimezoneVelocityChartProps) {
  // Filter right wrist velocities (or left wrist if right absent)
  const velocities = parameterResults.filter(
    (p) => (p.parameter_id === 'wrist_right_velocity' || p.parameter_id === 'wrist_left_velocity') && p.observable && p.value !== null
  );

  if (velocities.length < 2) {
    return (
      <div className="p-4 bg-[var(--fm-bg-secondary)] border border-[var(--fm-border)] rounded-lg text-center text-xs text-[var(--fm-text-secondary)]">
        Insufficient velocity time-series data for chart rendering.
      </div>
    );
  }

  const maxVal = Math.max(...velocities.map((v) => v.value || 0), 1.0);
  const minTime = velocities[0].timestamp_ms;
  const maxTime = velocities[velocities.length - 1].timestamp_ms;
  const timeRange = maxTime - minTime || 1;

  const width = 600;
  const height = 180;
  const padding = 30;

  const getX = (timeMs: number) => padding + ((timeMs - minTime) / timeRange) * (width - 2 * padding);
  const getY = (val: number) => height - padding - (val / maxVal) * (height - 2 * padding);

  const points = velocities.map((v) => `${getX(v.timestamp_ms)},${getY(v.value || 0)}`).join(' ');

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'MOTION_START':
        return '#3b82f6'; // Blue
      case 'PEAK_WRIST_VELOCITY':
        return '#ef4444'; // Red
      case 'MAXIMUM_EXTENSION':
        return '#10b981'; // Green
      case 'RECOVERY':
        return '#f59e0b'; // Amber
      default:
        return '#8b5cf6'; // Purple
    }
  };

  return (
    <div className="bg-[var(--fm-bg-card)] border border-[var(--fm-border)] p-4 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-xs text-[var(--fm-text-primary)] flex items-center gap-2">
          <span>📈</span> Wrist Velocity Time-Series & Temporal Moments
        </h4>
        <span className="text-[10px] font-mono text-[var(--fm-text-secondary)]">Unit: torso_units/s</span>
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-52 bg-[var(--fm-bg-secondary)] rounded border border-[var(--fm-border)]">
          {/* Grid lines */}
          <line x1={padding} y1={getY(maxVal / 2)} x2={width - padding} y2={getY(maxVal / 2)} stroke="#333333" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#444444" />

          {/* Velocity Polyline */}
          <polyline fill="none" stroke="#2ecc71" strokeWidth="2.5" points={points} />

          {/* Key Moment Markers */}
          {keyEvents.map((evt, idx) => {
            const x = getX(evt.timestamp_ms);
            const color = getMarkerColor(evt.event_type);
            return (
              <g key={idx}>
                {/* Vertical Event Line */}
                <line x1={x} y1={padding} x2={x} y2={height - padding} stroke={color} strokeDasharray="4 2" strokeWidth="1.5" />
                {/* Dot */}
                <circle cx={x} cy={height - padding} r="5" fill={color} />
                {/* Label text */}
                <text x={x} y={padding - 6} fill={color} fontSize="9" fontWeight="bold" textAnchor="middle">
                  {evt.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend & Detected Events */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono pt-1">
        {keyEvents.map((evt, idx) => (
          <div key={idx} className="bg-[var(--fm-bg-secondary)] border border-[var(--fm-border)] p-2 rounded flex flex-col">
            <span className="font-bold" style={{ color: getMarkerColor(evt.event_type) }}>
              {evt.label}
            </span>
            <span className="text-[10px] text-[var(--fm-text-secondary)] mt-0.5">
              {Math.round(evt.timestamp_ms)} ms (Frame {evt.frame_index})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
