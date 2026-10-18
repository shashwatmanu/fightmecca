'use client';

import React, { useState } from 'react';
import { AnthropometricProfile, MeasurementProvenance } from '@/lib/motion/anthropometry';

interface AnthropometryDrawerProps {
  profile: AnthropometricProfile;
  onUpdateProfile: (updatedProfile: AnthropometricProfile) => void;
}

export function AnthropometryDrawer({ profile, onUpdateProfile }: AnthropometryDrawerProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleInputChange = (field: keyof Omit<AnthropometricProfile, 'athlete_id'>, rawVal: string) => {
    const val = rawVal.trim() === '' ? null : parseFloat(rawVal);
    const updated: AnthropometricProfile = {
      ...profile,
      [field]: {
        value: val,
        provenance: val !== null ? 'USER_ENTERED' : 'UNKNOWN',
        confidence: val !== null ? 1.0 : 0.0,
        source: val !== null ? 'User Input' : 'Unspecified',
      },
    };
    onUpdateProfile(updated);
  };

  const getProvenanceBadge = (prov: MeasurementProvenance) => {
    switch (prov) {
      case 'USER_ENTERED':
        return <span className="px-1.5 py-0.5 bg-blue-950 text-blue-300 border border-blue-800/60 rounded text-[9px]">USER</span>;
      case 'ESTIMATED_FROM_POSE':
        return <span className="px-1.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-800/60 rounded text-[9px]">ESTIMATED</span>;
      default:
        return <span className="px-1.5 py-0.5 bg-gray-900 text-gray-400 border border-gray-800 rounded text-[9px]">UNKNOWN</span>;
    }
  };

  return (
    <div className="bg-[var(--fm-bg-card)] border border-[var(--fm-border)] rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-xs text-[var(--fm-text-primary)] flex items-center gap-2">
            <span>📐</span> Anthropometric Body Profile
          </h4>
          <p className="text-[11px] text-[var(--fm-text-secondary)] mt-0.5">
            Physical measurements refine body-relative normalization. All measurements are optional.
          </p>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-1 bg-[var(--fm-bg-secondary)] border border-[var(--fm-border)] text-xs text-[var(--fm-text-primary)] rounded hover:bg-gray-800 transition-colors"
        >
          {isOpen ? 'Close Profile' : 'Edit Profile'}
        </button>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-[var(--fm-border)]">
          {/* Height */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <label className="text-[var(--fm-text-secondary)] font-medium">Height (cm):</label>
              {getProvenanceBadge(profile.height_cm.provenance)}
            </div>
            <input
              type="number"
              value={profile.height_cm.value ?? ''}
              onChange={(e) => handleInputChange('height_cm', e.target.value)}
              placeholder="e.g. 178"
              className="w-full bg-[var(--fm-bg-secondary)] border border-[var(--fm-border)] rounded px-2.5 py-1 text-xs text-[var(--fm-text-primary)] font-mono"
            />
          </div>

          {/* Weight */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <label className="text-[var(--fm-text-secondary)] font-medium">Weight (kg):</label>
              {getProvenanceBadge(profile.weight_kg.provenance)}
            </div>
            <input
              type="number"
              value={profile.weight_kg.value ?? ''}
              onChange={(e) => handleInputChange('weight_kg', e.target.value)}
              placeholder="e.g. 72"
              className="w-full bg-[var(--fm-bg-secondary)] border border-[var(--fm-border)] rounded px-2.5 py-1 text-xs text-[var(--fm-text-primary)] font-mono"
            />
          </div>

          {/* Arm Span */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <label className="text-[var(--fm-text-secondary)] font-medium">Arm Span (cm):</label>
              {getProvenanceBadge(profile.arm_span_cm.provenance)}
            </div>
            <input
              type="number"
              value={profile.arm_span_cm.value ?? ''}
              onChange={(e) => handleInputChange('arm_span_cm', e.target.value)}
              placeholder="e.g. 180"
              className="w-full bg-[var(--fm-bg-secondary)] border border-[var(--fm-border)] rounded px-2.5 py-1 text-xs text-[var(--fm-text-primary)] font-mono"
            />
          </div>

          {/* Shoulder Width */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <label className="text-[var(--fm-text-secondary)] font-medium">Shoulder Width (cm):</label>
              {getProvenanceBadge(profile.shoulder_width_cm.provenance)}
            </div>
            <input
              type="number"
              value={profile.shoulder_width_cm.value ?? ''}
              onChange={(e) => handleInputChange('shoulder_width_cm', e.target.value)}
              placeholder="e.g. 44"
              className="w-full bg-[var(--fm-bg-secondary)] border border-[var(--fm-border)] rounded px-2.5 py-1 text-xs text-[var(--fm-text-primary)] font-mono"
            />
          </div>

          {/* Torso Length */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <label className="text-[var(--fm-text-secondary)] font-medium">Torso Length (cm):</label>
              {getProvenanceBadge(profile.torso_length_cm.provenance)}
            </div>
            <input
              type="number"
              value={profile.torso_length_cm.value ?? ''}
              onChange={(e) => handleInputChange('torso_length_cm', e.target.value)}
              placeholder="e.g. 52"
              className="w-full bg-[var(--fm-bg-secondary)] border border-[var(--fm-border)] rounded px-2.5 py-1 text-xs text-[var(--fm-text-primary)] font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
}
