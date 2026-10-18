'use client';

import React, { useState } from 'react';
import { TechniqueJudgement, DeviationSignificance, DeviationDirection } from '@/lib/motion/judgement-types';
import { ReferenceType } from '@/lib/motion/reference';

interface JudgementInspectorProps {
  judgement: TechniqueJudgement;
  referenceDisplayName: string;
}

export function JudgementInspector({ judgement, referenceDisplayName }: JudgementInspectorProps) {
  const [showJsonInspector, setShowJsonInspector] = useState<boolean>(false);

  const getReferenceTypeLabel = (type: ReferenceType) => {
    switch (type) {
      case 'COACH_REFERENCE':
        return '👨‍🏫 Coach Reference';
      case 'PERSONAL_BEST_REFERENCE':
        return '🏆 Personal Best Reference';
      case 'PLATFORM_REFERENCE':
        return '🌐 Platform Benchmark Reference';
      case 'ATHLETE_REFERENCE':
      default:
        return '👤 Athlete Self-Reference';
    }
  };

  const getSignificanceBadge = (sig: DeviationSignificance) => {
    switch (sig) {
      case 'MAJOR':
        return <span className="px-2 py-0.5 bg-red-950/80 border border-red-500/60 text-red-300 text-[10px] font-bold rounded">MAJOR DEVIATION</span>;
      case 'MODERATE':
        return <span className="px-2 py-0.5 bg-amber-950/80 border border-amber-500/60 text-amber-300 text-[10px] font-bold rounded">MODERATE DEVIATION</span>;
      case 'MINOR':
        return <span className="px-2 py-0.5 bg-blue-950/80 border border-blue-500/60 text-blue-300 text-[10px] font-bold rounded">MINOR DEVIATION</span>;
      case 'MATCH':
        return <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-[10px] font-bold rounded">MATCH</span>;
      case 'UNOBSERVABLE':
      default:
        return <span className="px-2 py-0.5 bg-gray-900 border border-gray-700 text-gray-400 text-[10px] rounded">UNOBSERVABLE</span>;
    }
  };

  const getDirectionBadge = (dir: DeviationDirection) => {
    return <span className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 text-gray-200 text-[10px] font-mono rounded uppercase">{dir}</span>;
  };

  return (
    <div className="bg-[var(--fm-bg-card)] border border-[var(--fm-border)] rounded-lg p-6 space-y-6 w-full shadow-xl">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--fm-border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <h3 className="text-lg font-bold text-[var(--fm-text-primary)]">
              Prompt 4 — Reference Technique Judgement
            </h3>
          </div>
          <p className="text-xs text-[var(--fm-text-secondary)] mt-0.5">
            Explainable reference comparison judgements derived from structured movement data.
          </p>
        </div>

        {/* Reference Type & Status Badges */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-blue-950/60 border border-blue-500/40 text-blue-300 text-xs font-semibold rounded">
            {getReferenceTypeLabel(judgement.reference_type)}
          </span>
          <span
            className={`px-2.5 py-1 text-xs font-bold rounded border ${
              judgement.status === 'COMPLETE'
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
            }`}
          >
            STATUS: {judgement.status}
          </span>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-[var(--fm-bg-secondary)] p-3.5 rounded border border-[var(--fm-border)]">
          <span className="text-[var(--fm-text-secondary)] block text-[10px] uppercase tracking-wider font-semibold">Reference Similarity</span>
          <span className="font-mono font-bold text-lg text-emerald-400 mt-1 block">
            {judgement.reference_similarity !== null ? `${judgement.reference_similarity}%` : 'N/A'}
          </span>
          <span className="text-[9px] text-[var(--fm-text-secondary)] block mt-0.5">Similarity to selected reference</span>
        </div>

        <div className="bg-[var(--fm-bg-secondary)] p-3.5 rounded border border-[var(--fm-border)]">
          <span className="text-[var(--fm-text-secondary)] block text-[10px] uppercase tracking-wider font-semibold">Judgement Confidence</span>
          <span className="font-mono font-bold text-lg text-blue-300 mt-1 block">
            {Math.round(judgement.confidence * 100)}%
          </span>
          <span className="text-[9px] text-[var(--fm-text-secondary)] block mt-0.5">Evidence quality index</span>
        </div>

        <div className="bg-[var(--fm-bg-secondary)] p-3.5 rounded border border-[var(--fm-border)]">
          <span className="text-[var(--fm-text-secondary)] block text-[10px] uppercase tracking-wider font-semibold">Comparison Coverage</span>
          <span className="font-mono font-bold text-lg text-amber-300 mt-1 block">
            {judgement.coverage}%
          </span>
          <span className="text-[9px] text-[var(--fm-text-secondary)] block mt-0.5">Observable parameter ratio</span>
        </div>

        <div className="bg-[var(--fm-bg-secondary)] p-3.5 rounded border border-[var(--fm-border)]">
          <span className="text-[var(--fm-text-secondary)] block text-[10px] uppercase tracking-wider font-semibold">Key Deviations</span>
          <span className="font-mono font-bold text-lg text-red-400 mt-1 block">
            {judgement.key_deviations.length}
          </span>
          <span className="text-[9px] text-[var(--fm-text-secondary)] block mt-0.5">Ranked significant differences</span>
        </div>
      </div>

      {/* Movement Group Breakdown */}
      <div className="space-y-3">
        <h4 className="font-semibold text-xs text-[var(--fm-text-primary)] flex items-center gap-2">
          <span>🧱</span> Movement Group Similarity Breakdown
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {judgement.group_judgements.map((grp) => (
            <div key={grp.group} className="bg-[var(--fm-bg-secondary)] p-3 rounded border border-[var(--fm-border)] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--fm-text-primary)] text-[11px]">{grp.label}</span>
                <span className="font-mono font-bold text-emerald-400 text-xs">
                  {grp.similarity !== null ? `${grp.similarity}%` : 'N/A'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${grp.similarity ?? 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-[var(--fm-text-secondary)] font-mono">
                <span>Observed: {grp.observable_parameter_count}/{grp.total_parameter_count}</span>
                <span className="uppercase">{grp.status}</span>
              </div>

              {grp.significant_deviations.length > 0 && (
                <div className="text-[10px] text-amber-300 font-sans border-t border-gray-800 pt-1 mt-1">
                  ⚠️ Diff: {grp.significant_deviations.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Key Deviations (Ranked) */}
      <div className="bg-[var(--fm-bg-card)] border border-[var(--fm-border)] rounded-lg p-4 space-y-3">
        <h4 className="font-semibold text-xs text-[var(--fm-text-primary)] flex items-center gap-2">
          <span>🚨</span> Key Detected Deviations (Ranked by Significance)
        </h4>

        {judgement.key_deviations.length === 0 ? (
          <p className="text-xs text-[var(--fm-text-secondary)] italic p-2 text-center">
            No moderate or major deviations detected. Attempt closely aligns with selected reference.
          </p>
        ) : (
          <div className="space-y-2.5">
            {judgement.key_deviations.map((dev, idx) => (
              <div key={idx} className="bg-[var(--fm-bg-secondary)] border border-[var(--fm-border)] p-3 rounded-md space-y-1.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-red-400 font-mono">#{idx + 1}</span>
                    <span className="font-bold text-[var(--fm-text-primary)]">{dev.parameter_name}</span>
                    {getDirectionBadge(dev.direction)}
                  </div>
                  <div className="flex items-center gap-2">
                    {getSignificanceBadge(dev.significance)}
                    <span className="text-[10px] font-mono text-[var(--fm-text-secondary)]">Conf: {Math.round(dev.confidence * 100)}%</span>
                  </div>
                </div>

                <p className="text-xs text-[var(--fm-text-primary)] font-medium">
                  {dev.explanation}
                </p>

                <div className="flex items-center gap-4 text-[11px] font-mono text-[var(--fm-text-secondary)] bg-black/40 p-2 rounded">
                  <span>Reference: <strong className="text-blue-300">{dev.reference_value}</strong></span>
                  <span>Attempt: <strong className="text-emerald-300">{dev.attempt_value}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Positive Matches & Insufficient Evidence */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Positive Matches */}
        <div className="bg-[var(--fm-bg-card)] border border-[var(--fm-border)] rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-xs text-emerald-400 flex items-center gap-1.5">
            <span>✅</span> Strongest Matches
          </h4>
          {judgement.positive_matches.length === 0 ? (
            <p className="text-xs text-[var(--fm-text-secondary)] italic">None identified.</p>
          ) : (
            <ul className="space-y-1.5 text-xs">
              {judgement.positive_matches.slice(0, 4).map((pm, idx) => (
                <li key={idx} className="bg-[var(--fm-bg-secondary)] p-2 rounded border border-[var(--fm-border)] flex items-center justify-between">
                  <span className="font-medium text-[var(--fm-text-primary)] text-[11px]">{pm.parameter_name}</span>
                  <span className="font-mono font-bold text-emerald-400 text-xs">{pm.similarity}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Insufficient Evidence */}
        <div className="bg-[var(--fm-bg-card)] border border-[var(--fm-border)] rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-xs text-gray-400 flex items-center gap-1.5">
            <span>❓</span> Insufficient Evidence
          </h4>
          {judgement.insufficient_evidence.length === 0 ? (
            <p className="text-xs text-[var(--fm-text-secondary)] italic">All registry features were observable.</p>
          ) : (
            <ul className="space-y-1.5 text-xs">
              {judgement.insufficient_evidence.slice(0, 4).map((ie, idx) => (
                <li key={idx} className="bg-[var(--fm-bg-secondary)] p-2 rounded border border-[var(--fm-border)] text-[11px] text-gray-300">
                  <strong className="text-gray-200">{ie.feature_name}:</strong> {ie.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Expandable JSON Inspector */}
      <div className="border border-[var(--fm-border)] rounded-md overflow-hidden space-y-0">
        <button
          onClick={() => setShowJsonInspector(!showJsonInspector)}
          className="w-full bg-[var(--fm-bg-secondary)] px-4 py-2.5 text-xs font-semibold flex items-center justify-between text-[var(--fm-text-primary)] hover:bg-white/5 transition-colors"
        >
          <span>🔍 Development Inspector: Complete TechniqueJudgement JSON</span>
          <span className="font-mono text-xs text-[var(--fm-accent-secondary)]">{showJsonInspector ? 'Hide ▲' : 'Show ▼'}</span>
        </button>

        {showJsonInspector && (
          <div className="p-4 bg-black/95 font-mono text-[11px] max-h-96 overflow-y-auto text-emerald-400 border-t border-gray-800">
            <pre>{JSON.stringify(judgement, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
