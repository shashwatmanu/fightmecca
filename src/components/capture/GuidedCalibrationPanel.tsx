'use client';

import React from 'react';
import { CalibrationEvaluation } from '@/lib/motion/calibration';

interface GuidedCalibrationPanelProps {
  calibration: CalibrationEvaluation;
}

export function GuidedCalibrationPanel({ calibration }: GuidedCalibrationPanelProps) {
  const getBadgeStyle = () => {
    switch (calibration.status) {
      case 'READY':
        return 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300';
      case 'DEGRADED':
        return 'bg-amber-950/80 border-amber-500/60 text-amber-300';
      case 'FAILED':
        return 'bg-rose-950/80 border-rose-500/60 text-rose-300';
      default:
        return 'bg-[var(--fm-bg-secondary)] border-[var(--fm-border)] text-[var(--fm-text-secondary)]';
    }
  };

  return (
    <div className={`p-3 rounded-lg border text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-sm transition-all min-w-0 overflow-hidden ${getBadgeStyle()}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base shrink-0">
          {calibration.status === 'READY' ? '🎯' : calibration.status === 'DEGRADED' ? '⚠️' : '📐'}
        </span>
        <div className="min-w-0">
          <div className="font-semibold text-xs flex items-center gap-2 truncate">
            <span>Calibration Status: {calibration.status}</span>
            <span className="text-[10px] font-mono opacity-80 shrink-0 tabular-nums">({Math.round(calibration.confidence * 100)}% confidence)</span>
          </div>
          <p className="text-[11px] opacity-90 mt-0.5 font-medium truncate">{calibration.guidanceMessage}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px] font-mono opacity-80 pt-1 md:pt-0 border-t md:border-t-0 border-current/20 shrink-0 tabular-nums">
        <div>Scale: {Math.round(calibration.subjectScale * 100)}%</div>
        <div>Full Body: {calibration.fullBodyVisible ? 'YES' : 'NO'}</div>
      </div>
    </div>
  );
}
