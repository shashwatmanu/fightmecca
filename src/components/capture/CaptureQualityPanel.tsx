'use client';

import React from 'react';
import { CaptureQualityMetrics } from '@/lib/motion/quality';

interface CaptureQualityPanelProps {
  metrics: CaptureQualityMetrics;
  isRecording: boolean;
  recordingDurationMs: number;
}

export function CaptureQualityPanel({
  metrics,
  isRecording,
  recordingDurationMs,
}: CaptureQualityPanelProps) {
  const durationSec = (recordingDurationMs / 1000).toFixed(1);
  const displayFps = typeof metrics.fps === 'number' ? metrics.fps.toFixed(1) : '0.0';

  return (
    <div className="bg-[var(--fm-bg-card)] border border-[var(--fm-border)] rounded-lg p-4 text-xs space-y-3 w-full min-w-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--fm-border)] pb-2 min-w-0">
        <h4 className="font-semibold text-sm text-[var(--fm-text-primary)] flex items-center gap-1.5 truncate">
          <span>📊</span> Live Capture Quality
        </h4>
        {isRecording && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--fm-accent-primary)] animate-ping"></span>
            <span className="font-mono text-xs text-[var(--fm-accent-primary)] font-bold">
              REC {durationSec}s
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-0">
        {/* Person Detected */}
        <div className="bg-[var(--fm-bg-secondary)] p-2.5 rounded border border-[var(--fm-border)] flex flex-col justify-between min-w-0 overflow-hidden">
          <span className="text-[var(--fm-text-secondary)] text-[10px] uppercase font-semibold tracking-wider truncate">
            Person Detected
          </span>
          <div className="flex items-center gap-1.5 mt-1 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${metrics.personDetected ? 'bg-[var(--fm-success)]' : 'bg-gray-600'}`}></span>
            <span className="font-medium text-xs truncate">
              {metrics.personDetected ? 'Detected' : 'No Pose'}
            </span>
          </div>
        </div>

        {/* Full Body Visible */}
        <div className="bg-[var(--fm-bg-secondary)] p-2.5 rounded border border-[var(--fm-border)] flex flex-col justify-between min-w-0 overflow-hidden">
          <span className="text-[var(--fm-text-secondary)] text-[10px] uppercase font-semibold tracking-wider truncate">
            Full Body Visible
          </span>
          <div className="flex items-center gap-1.5 mt-1 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${metrics.fullBodyVisible ? 'bg-[var(--fm-success)]' : 'bg-[var(--fm-warning)]'}`}></span>
            <span className="font-medium text-xs truncate">
              {metrics.fullBodyVisible ? 'Sufficient' : 'Partial / Out'}
            </span>
          </div>
        </div>

        {/* Pose Confidence */}
        <div className="bg-[var(--fm-bg-secondary)] p-2.5 rounded border border-[var(--fm-border)] flex flex-col justify-between min-w-0 overflow-hidden">
          <span className="text-[var(--fm-text-secondary)] text-[10px] uppercase font-semibold tracking-wider truncate">
            Confidence
          </span>
          <div className="mt-1 min-w-0">
            <span className="font-mono text-xs font-bold text-[var(--fm-text-primary)] truncate tabular-nums">
              {(metrics.landmarkConfidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* FPS & Frame Count */}
        <div className="bg-[var(--fm-bg-secondary)] p-2.5 rounded border border-[var(--fm-border)] flex flex-col justify-between min-w-0 overflow-hidden">
          <span className="text-[var(--fm-text-secondary)] text-[10px] uppercase font-semibold tracking-wider truncate">
            Rate / Frames
          </span>
          <div className="flex items-center justify-between gap-1 mt-1 font-mono text-xs min-w-0 tabular-nums">
            <span className="truncate">{displayFps} FPS</span>
            <span className="text-[var(--fm-accent-secondary)] font-semibold truncate shrink-0">{metrics.recordedFrameCount}f</span>
          </div>
        </div>
      </div>
    </div>
  );
}
