'use client';

import React, { useState } from 'react';
import { MotionTemplate } from '@/lib/motion/template';
import { resampleParameterTrajectory, NORMALIZED_GRID_STEPS } from '@/lib/motion/temporal-alignment';
import { PARAMETER_REGISTRY } from '@/lib/motion/parameters';

interface TrajectoryComparisonChartProps {
  refTemplate: MotionTemplate;
  attTemplate: MotionTemplate;
}

export function TrajectoryComparisonChart({ refTemplate, attTemplate }: TrajectoryComparisonChartProps) {
  const [selectedParamId, setSelectedParamId] = useState<string>('wrist_right_velocity');

  const refResample = resampleParameterTrajectory(selectedParamId, refTemplate.parameter_time_series || []);
  const attResample = resampleParameterTrajectory(selectedParamId, attTemplate.parameter_time_series || []);

  const refGrid = refResample.grid_points;
  const attGrid = attResample.grid_points;

  const allVals = [
    ...refGrid.filter((g) => g.observable && g.value !== null).map((g) => g.value as number),
    ...attGrid.filter((g) => g.observable && g.value !== null).map((g) => g.value as number),
  ];

  if (allVals.length === 0) {
    return (
      <div className="p-4 bg-[var(--fm-bg-secondary)] border border-[var(--fm-border)] rounded-lg text-center text-xs text-[var(--fm-text-secondary)]">
        Selected parameter is not observable in reference or attempt.
      </div>
    );
  }

  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const valRange = maxVal - minVal || 1.0;

  const width = 600;
  const height = 200;
  const padding = 35;

  const getX = (normTime: number) => padding + normTime * (width - 2 * padding);
  const getY = (val: number) => height - padding - ((val - minVal) / valRange) * (height - 2 * padding);

  const refPoints = refGrid.map((g) => `${getX(g.normalized_time)},${getY(g.value ?? minVal)}`).join(' ');
  const attPoints = attGrid.map((g) => `${getX(g.normalized_time)},${getY(g.value ?? minVal)}`).join(' ');

  const paramDef = PARAMETER_REGISTRY[selectedParamId];

  return (
    <div className="bg-[var(--fm-bg-card)] border border-[var(--fm-border)] p-4 rounded-lg space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-xs text-[var(--fm-text-primary)]">
            📈 Normalized Timeline Trajectory Overlay (0–100% Movement Progress)
          </h4>
        </div>

        {/* Parameter Selector */}
        <div className="flex items-center gap-2 text-xs">
          <label className="text-[var(--fm-text-secondary)]">Parameter:</label>
          <select
            value={selectedParamId}
            onChange={(e) => setSelectedParamId(e.target.value)}
            className="bg-[var(--fm-bg-secondary)] border border-[var(--fm-border)] rounded px-2.5 py-1 text-xs text-[var(--fm-text-primary)] font-semibold"
          >
            <option value="wrist_right_velocity">Right Wrist Velocity (Kinematics)</option>
            <option value="wrist_left_velocity">Left Wrist Velocity (Kinematics)</option>
            <option value="joint_angle_left_elbow">Left Elbow Angle (Joint Angle)</option>
            <option value="joint_angle_right_elbow">Right Elbow Angle (Joint Angle)</option>
            <option value="joint_angle_left_knee">Left Knee Angle (Joint Angle)</option>
            <option value="joint_angle_right_knee">Right Knee Angle (Joint Angle)</option>
            <option value="joint_angle_left_shoulder">Left Shoulder Angle (Joint Angle)</option>
            <option value="joint_angle_right_shoulder">Right Shoulder Angle (Joint Angle)</option>
            <option value="stance_width_normalized">Normalized Stance Width (Stance/Base)</option>
            <option value="pelvis_displacement">Pelvis Displacement (Stance/Base)</option>
            <option value="shoulder_rotation_proxy">Shoulder Rotation Proxy (Upper Body Geometry)</option>
            <option value="hip_rotation_proxy">Hip Rotation Proxy (Upper Body Geometry)</option>
            <option value="shoulder_hip_twist_delta">Shoulder-Hip Twist Delta (Upper Body Geometry)</option>
            <option value="wrist_left_to_shoulder_dist">Left Wrist-to-Shoulder Distance (Guard/Hand)</option>
            <option value="wrist_right_to_shoulder_dist">Right Wrist-to-Shoulder Distance (Guard/Hand)</option>
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
          <span className="text-blue-300 font-semibold">REFERENCE ({refTemplate.session_id.slice(0, 6)})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
          <span className="text-emerald-300 font-semibold">ATTEMPT ({attTemplate.session_id.slice(0, 6)})</span>
        </div>
        <span className="text-[10px] text-[var(--fm-text-secondary)] ml-auto">Unit: {paramDef?.unit}</span>
      </div>

      {/* SVG Dual Trajectory Overlay */}
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-56 bg-[var(--fm-bg-secondary)] rounded border border-[var(--fm-border)]">
          {/* Grid lines */}
          <line x1={padding} y1={getY(minVal + valRange / 2)} x2={width - padding} y2={getY(minVal + valRange / 2)} stroke="#333333" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#444444" />

          {/* Reference Polyline */}
          <polyline fill="none" stroke="#3b82f6" strokeWidth="2.5" points={refPoints} strokeDasharray="6 2" />

          {/* Attempt Polyline */}
          <polyline fill="none" stroke="#2ecc71" strokeWidth="2.5" points={attPoints} />

          {/* X Axis Ticks (0%, 25%, 50%, 75%, 100%) */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((t, idx) => (
            <g key={idx}>
              <line x1={getX(t)} y1={height - padding} x2={getX(t)} y2={height - padding + 4} stroke="#666" />
              <text x={getX(t)} y={height - padding + 15} fill="#888" fontSize="9" textAnchor="middle" className="font-mono">
                {Math.round(t * 100)}%
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
