'use client';

import React, { useState } from 'react';
import { MotionSession } from '@/types/motion';
import { calculateSessionCaptureStats } from '@/lib/motion/quality';
import { MotionTemplate } from '@/lib/motion/template';
import { Reference, createReferenceFromTemplate } from '@/lib/motion/reference';
import { ReferenceComparisonResult } from '@/lib/motion/comparison-engine';
import { evaluateTechniqueJudgement } from '@/lib/motion/judgement-engine';
import { JudgementInspector } from './JudgementInspector';
import { TimezoneVelocityChart } from './TimezoneVelocityChart';
import { TrajectoryComparisonChart } from './TrajectoryComparisonChart';

interface PostCaptureSummaryProps {
  session: MotionSession;
  template?: MotionTemplate;
  reference?: Reference | null;
  activeReference?: Reference | null;
  comparisonResult?: ReferenceComparisonResult | null;
  techniqueName: string;
  persistedToBackend: boolean;
  persistenceError?: string;
  onSetAsReference?: (ref: Reference) => void;
  onReset: () => void;
}

export function PostCaptureSummary({
  session,
  template,
  reference,
  activeReference: activeRefProp,
  comparisonResult,
  techniqueName,
  persistedToBackend,
  persistenceError,
  onSetAsReference,
  onReset,
}: PostCaptureSummaryProps) {
  const activeReference = activeRefProp || reference;
  const [activeDebugTab, setActiveDebugTab] = useState<'NONE' | 'RAW' | 'NORM' | 'PARAMS' | 'TEMPLATE' | 'COMPARISON' | 'JUDGEMENT'>('NONE');
  const stats = calculateSessionCaptureStats(session.frames || []);
  
  const firstFrame = session.frames?.[0] || null;

  const handleSetReferenceClick = () => {
    if (template && onSetAsReference) {
      const newRef = createReferenceFromTemplate(template, 'ATHLETE_REFERENCE', `Personal Cross Reference (${new Date().toLocaleTimeString()})`);
      onSetAsReference(newRef);
    }
  };

  const currentJudgement = (activeReference && comparisonResult) ? evaluateTechniqueJudgement(comparisonResult, activeReference) : null;

  return (
    <div className="bg-[var(--fm-bg-card)] border border-[var(--fm-border)] rounded-lg p-6 space-y-6 w-full max-w-5xl mx-auto shadow-xl">
      {/* Header & Control Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--fm-border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{comparisonResult ? '📊' : '✅'}</span>
            <h3 className="text-lg font-bold text-[var(--fm-text-primary)]">
              {comparisonResult ? 'Prompt 3 — Reference vs Attempt Motion Comparison' : 'Prompt 2 — Single Capture Analysis'}
            </h3>
          </div>
          <p className="text-xs text-[var(--fm-text-secondary)] mt-0.5">
            {comparisonResult
              ? `Comparing Attempt (${session.session_id.slice(0, 8)}) against Active Reference (${comparisonResult.reference_id.slice(0, 8)})`
              : 'Canonical motion parameters extracted & MotionTemplate generated.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {template && onSetAsReference && (
            <button
              onClick={handleSetReferenceClick}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5"
            >
              <span>⭐</span> Set as Active Reference
            </button>
          )}

          <button
            onClick={onReset}
            className="px-4 py-2 bg-[var(--fm-accent-primary)] hover:bg-red-700 text-white text-xs font-semibold rounded-md transition-colors"
          >
            New Capture Attempt
          </button>
        </div>
      </div>

      {/* Persistence Banner */}
      {!persistedToBackend ? (
        <div className="bg-amber-950/40 border border-amber-500/50 rounded-md p-3 text-amber-200 text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>
            <strong>Development Fallback:</strong> Session & templates stored locally in browser memory. {persistenceError ? `(${persistenceError})` : 'Backend API unreachable.'}
          </span>
        </div>
      ) : (
        <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-md p-3 text-emerald-200 text-xs flex items-center gap-2">
          <span>🟢</span>
          <span>MotionSession, MotionTemplate & comparison results persisted to backend database.</span>
        </div>
      )}

      {/* PROMPT 3 COMPARISON INSPECTOR (Displayed when active reference exists) */}
      {comparisonResult && activeReference ? (
        <div className="space-y-6">
          {/* Comparison Header Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-[var(--fm-bg-secondary)] p-3 rounded border border-[var(--fm-border)]">
              <span className="text-[var(--fm-text-secondary)] block text-[10px] uppercase tracking-wider">Active Reference</span>
              <span className="font-bold text-xs text-blue-400 mt-1 block truncate">{activeReference.display_name}</span>
            </div>

            <div className="bg-[var(--fm-bg-secondary)] p-3 rounded border border-[var(--fm-border)]">
              <span className="text-[var(--fm-text-secondary)] block text-[10px] uppercase tracking-wider">Duration Ratio</span>
              <span className="font-mono font-bold text-sm text-[var(--fm-text-primary)] mt-1 block">
                {comparisonResult.duration_ratio}x (Ref: {(comparisonResult.reference_duration_ms / 1000).toFixed(2)}s / Att: {(comparisonResult.attempt_duration_ms / 1000).toFixed(2)}s)
              </span>
            </div>

            <div className="bg-[var(--fm-bg-secondary)] p-3 rounded border border-[var(--fm-border)]">
              <span className="text-[var(--fm-text-secondary)] block text-[10px] uppercase tracking-wider">Comparison Coverage</span>
              <span className="font-mono font-bold text-sm text-[var(--fm-accent-secondary)] mt-1 block">
                {comparisonResult.comparison_coverage}% ({comparisonResult.compared_parameter_count} params)
              </span>
            </div>

            <div className="bg-[var(--fm-bg-secondary)] p-3 rounded border border-[var(--fm-border)]">
              <span className="text-[var(--fm-text-secondary)] block text-[10px] uppercase tracking-wider">Comparison Confidence</span>
              <span className="font-mono font-bold text-sm text-emerald-400 mt-1 block">
                {Math.round(comparisonResult.comparison_confidence * 100)}%
              </span>
            </div>
          </div>

          {/* Compatibility Warnings */}
          {comparisonResult.compatibility_warnings.length > 0 && (
            <div className="bg-amber-950/30 border border-amber-500/40 rounded-md p-3 text-amber-300 text-xs space-y-1">
              <span className="font-bold block text-[11px]">Compatibility Warnings:</span>
              <ul className="list-disc list-inside text-[11px] space-y-0.5 opacity-90">
                {comparisonResult.compatibility_warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Dual Trajectory Overlay Chart */}
          {template && activeReference?.motion_template && (
            <TrajectoryComparisonChart
              refTemplate={activeReference.motion_template}
              attTemplate={template}
            />
          )}

          {/* Event Timing Comparison Table */}
          <div className="bg-[var(--fm-bg-card)] border border-[var(--fm-border)] rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-xs text-[var(--fm-text-primary)] flex items-center gap-2">
              <span>⏱️</span> Key Event Timing Comparison
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[var(--fm-border)] text-[10px] uppercase text-[var(--fm-text-secondary)]">
                    <th className="py-2">Event Label</th>
                    <th className="py-2">Ref Time (ms / norm)</th>
                    <th className="py-2">Attempt Time (ms / norm)</th>
                    <th className="py-2">Time Delta (ms)</th>
                    <th className="py-2">Norm Delta (t)</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--fm-border)]/50">
                  {comparisonResult.event_comparisons.map((evt, idx) => (
                    <tr key={idx} className="hover:bg-white/5">
                      <td className="py-2.5 font-bold text-[var(--fm-text-primary)]">{evt.label}</td>
                      <td className="py-2.5 text-blue-300">
                        {evt.reference_timestamp_ms !== null ? `${Math.round(evt.reference_timestamp_ms)} ms (${evt.reference_normalized_time})` : '--'}
                      </td>
                      <td className="py-2.5 text-emerald-300">
                        {evt.attempt_timestamp_ms !== null ? `${Math.round(evt.attempt_timestamp_ms)} ms (${evt.attempt_normalized_time})` : '--'}
                      </td>
                      <td className="py-2.5">
                        {evt.delta_ms !== null ? `${evt.delta_ms > 0 ? '+' : ''}${Math.round(evt.delta_ms)} ms` : '--'}
                      </td>
                      <td className="py-2.5">
                        {evt.delta_normalized_time !== null ? `${evt.delta_normalized_time > 0 ? '+' : ''}${evt.delta_normalized_time}` : '--'}
                      </td>
                      <td className="py-2.5">
                        {evt.observable ? (
                          <span className="text-emerald-400 font-bold">Observed</span>
                        ) : (
                          <span className="text-gray-500">Unobservable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Parameter Trajectory Comparison Table */}
          <div className="bg-[var(--fm-bg-card)] border border-[var(--fm-border)] rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-xs text-[var(--fm-text-primary)] flex items-center gap-2">
              <span>📐</span> Parameter Trajectory Differences & Correlation
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[var(--fm-border)] text-[10px] uppercase text-[var(--fm-text-secondary)]">
                    <th className="py-2">Parameter</th>
                    <th className="py-2">Ref Mean</th>
                    <th className="py-2">Attempt Mean</th>
                    <th className="py-2">Mean Abs Diff (MAD)</th>
                    <th className="py-2">Peak Diff</th>
                    <th className="py-2">Correlation (r)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--fm-border)]/50">
                  {comparisonResult.parameter_comparisons.map((p, idx) => (
                    <tr key={idx} className="hover:bg-white/5">
                      <td className="py-2.5 font-bold text-[var(--fm-text-primary)]">
                        {p.name} <span className="text-[10px] opacity-60">({p.unit})</span>
                      </td>
                      <td className="py-2.5 text-blue-300">
                        {p.observable && p.reference_mean !== null ? p.reference_mean : <span className="text-gray-500 italic">Unobservable</span>}
                      </td>
                      <td className="py-2.5 text-emerald-300">
                        {p.observable && p.attempt_mean !== null ? p.attempt_mean : <span className="text-gray-500 italic">Unobservable</span>}
                      </td>
                      <td className="py-2.5 font-bold">
                        {p.observable && p.mean_absolute_difference !== null ? `${p.mean_absolute_difference} ${p.unit}` : '--'}
                      </td>
                      <td className="py-2.5">
                        {p.observable && p.peak_difference !== null ? `${p.peak_difference > 0 ? '+' : ''}${p.peak_difference}` : '--'}
                      </td>
                      <td className="py-2.5 font-bold text-amber-300">
                        {p.observable && p.trajectory_correlation !== null ? p.trajectory_correlation : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PROMPT 4 EXPLAINABLE TECHNIQUE JUDGEMENT INSPECTOR */}
          {comparisonResult && activeReference && (
            <JudgementInspector
              judgement={evaluateTechniqueJudgement(comparisonResult, activeReference)}
              referenceDisplayName={activeReference.display_name}
            />
          )}
        </div>
      ) : (
        /* PROMPT 2 SINGLE CAPTURE VIEW (No active reference) */
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-[var(--fm-bg-secondary)] p-3 rounded border border-[var(--fm-border)]">
              <span className="text-[var(--fm-text-secondary)] block text-[10px] uppercase tracking-wider">Technique</span>
              <span className="font-bold text-sm text-[var(--fm-text-primary)] mt-1 block">{techniqueName}</span>
            </div>

            <div className="bg-[var(--fm-bg-secondary)] p-3 rounded border border-[var(--fm-border)]">
              <span className="text-[var(--fm-text-secondary)] block text-[10px] uppercase tracking-wider">Calibration Status</span>
              <span className="font-semibold text-sm text-emerald-400 mt-1 block">
                {template?.calibration_metadata.status || 'READY'}
              </span>
            </div>

            <div className="bg-[var(--fm-bg-secondary)] p-3 rounded border border-[var(--fm-border)]">
              <span className="text-[var(--fm-text-secondary)] block text-[10px] uppercase tracking-wider">Duration</span>
              <span className="font-mono font-semibold text-sm text-[var(--fm-text-primary)] mt-1 block">
                {(stats.durationMs / 1000).toFixed(2)}s
              </span>
            </div>

            <div className="bg-[var(--fm-bg-secondary)] p-3 rounded border border-[var(--fm-border)]">
              <span className="text-[var(--fm-text-secondary)] block text-[10px] uppercase tracking-wider">Usable Pose Frames</span>
              <span className="font-mono font-semibold text-sm text-[var(--fm-success)] mt-1 block">
                {stats.usableFrames} / {stats.totalFrames}
              </span>
            </div>
          </div>

          {template && (
            <TimezoneVelocityChart
              parameterResults={template.parameter_time_series}
              keyEvents={template.key_temporal_events}
            />
          )}
        </div>
      )}

      {/* Expandable Debug Inspector Tabs */}
      <div className="border border-[var(--fm-border)] rounded-md overflow-hidden space-y-0">
        <div className="bg-[var(--fm-bg-secondary)] px-3 py-2 text-xs font-semibold flex flex-wrap items-center justify-between gap-2 border-b border-[var(--fm-border)]">
          <span className="text-[var(--fm-text-primary)] font-bold">🔍 Development Inspector (Expandable Raw Views)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveDebugTab(activeDebugTab === 'RAW' ? 'NONE' : 'RAW')}
              className={`px-2 py-1 text-[10px] font-mono rounded border ${activeDebugTab === 'RAW' ? 'bg-red-900/60 border-red-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
            >
              1. Raw MotionFrame
            </button>
            <button
              onClick={() => setActiveDebugTab(activeDebugTab === 'NORM' ? 'NONE' : 'NORM')}
              className={`px-2 py-1 text-[10px] font-mono rounded border ${activeDebugTab === 'NORM' ? 'bg-red-900/60 border-red-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
            >
              2. Normalized Frame
            </button>
            <button
              onClick={() => setActiveDebugTab(activeDebugTab === 'PARAMS' ? 'NONE' : 'PARAMS')}
              className={`px-2 py-1 text-[10px] font-mono rounded border ${activeDebugTab === 'PARAMS' ? 'bg-red-900/60 border-red-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
            >
              3. Parameter Results
            </button>
            {comparisonResult && (
              <button
                onClick={() => setActiveDebugTab(activeDebugTab === 'COMPARISON' ? 'NONE' : 'COMPARISON')}
                className={`px-2 py-1 text-[10px] font-mono rounded border ${activeDebugTab === 'COMPARISON' ? 'bg-red-900/60 border-red-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
              >
                4. ReferenceComparisonResult JSON
              </button>
            )}
            {currentJudgement && (
              <button
                onClick={() => setActiveDebugTab(activeDebugTab === 'JUDGEMENT' ? 'NONE' : 'JUDGEMENT')}
                className={`px-2 py-1 text-[10px] font-mono rounded border ${activeDebugTab === 'JUDGEMENT' ? 'bg-red-900/60 border-red-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
              >
                5. TechniqueJudgement JSON
              </button>
            )}
          </div>
        </div>

        {activeDebugTab !== 'NONE' && (
          <div className="p-4 bg-black/90 font-mono text-[11px] max-h-80 overflow-y-auto text-green-400 border-t border-gray-800">
            {activeDebugTab === 'RAW' && (
              <div>
                <p className="text-gray-400 mb-1 font-sans text-xs">/* 1. Raw Canonical MotionFrame Sample */</p>
                <pre>{JSON.stringify(firstFrame, null, 2)}</pre>
              </div>
            )}

            {activeDebugTab === 'NORM' && (
              <div>
                <p className="text-gray-400 mb-1 font-sans text-xs">/* 2. Body-Relative Normalized Frame Sample */</p>
                <pre>{JSON.stringify(template?.normalized_frames?.[0] || null, null, 2)}</pre>
              </div>
            )}

            {activeDebugTab === 'PARAMS' && (
              <div>
                <p className="text-gray-400 mb-1 font-sans text-xs">/* 3. Derived Motion Parameter Results Sample */</p>
                <pre>{JSON.stringify(template?.parameter_time_series?.slice(0, 8) || [], null, 2)}</pre>
              </div>
            )}

            {activeDebugTab === 'COMPARISON' && comparisonResult && (
              <div>
                <p className="text-gray-400 mb-1 font-sans text-xs">/* 4. Complete ReferenceComparisonResult Payload JSON */</p>
                <pre>{JSON.stringify(comparisonResult, null, 2)}</pre>
              </div>
            )}

            {activeDebugTab === 'JUDGEMENT' && currentJudgement && (
              <div>
                <p className="text-gray-400 mb-1 font-sans text-xs">/* 5. Complete TechniqueJudgement Payload JSON */</p>
                <pre>{JSON.stringify(currentJudgement, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
