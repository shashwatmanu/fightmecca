'use client';

import React, { useState } from 'react';
import { X, Sparkles, Plus, Target } from 'lucide-react';
import { useLMSStore } from '@/lib/store/useLMSStore';

export const AssignmentModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addAssignment, courses } = useLMSStore();
  const [title, setTitle] = useState('');
  const [targetTechnique, setTargetTechnique] = useState('Triangle Choke Setup');
  const [instructions, setInstructions] = useState('');
  const [targetReps, setTargetReps] = useState(10);
  const [minScore, setMinScore] = useState(80);
  const [techniqueId, setTechniqueId] = useState('bjj_hook_clearance_v1');
  const [courseId, setCourseId] = useState(courses[0]?.id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !instructions) return;

    addAssignment({
      title,
      instructions,
      dueDate: 'Due next training session',
      targetTechnique,
      targetReps: Number(targetReps),
      minScore: Number(minScore),
      techniqueId,
      courseId,
      courseTitle: courses.find((c) => c.id === courseId)?.title || 'Curriculum Drill',
      aiMetricsJson: {
        keypoints: ['hip_elevation', 'arm_barrier_retraction'],
        targetReps,
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-lg p-6 rounded-3xl relative border border-white/20 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#ff2e4d]/20 text-[#ff2e4d] flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-heading">
              Create Motion Drill Assignment
            </h2>
            <p className="text-xs text-slate-400">
              Set target reps, technique landmarks & form criteria for your students
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
              Assignment Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Drill: Triangle Choke Angle Cut & Shin Pin"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                Target Technique
              </label>
              <input
                type="text"
                required
                value={targetTechnique}
                onChange={(e) => setTargetTechnique(e.target.value)}
                className="form-input text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                AI Technique Model
              </label>
              <select
                value={techniqueId}
                onChange={(e) => setTechniqueId(e.target.value)}
                className="form-select text-sm"
              >
                <option value="bjj_hook_clearance_v1">BJJ: Hook Clearance & Base</option>
                <option value="striking_muay_thai_lowkick">Muay Thai: Low Kick Torque</option>
                <option value="bjj_hq_base_stabilize">BJJ: Headquarters Balance</option>
                <option value="boxing_slip_counter">Boxing: Slip & Pivot</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                Target Repetitions
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={targetReps}
                onChange={(e) => setTargetReps(Number(e.target.value))}
                className="form-input text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                Min Accuracy Score (%)
              </label>
              <input
                type="number"
                min={50}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="form-input text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
              Instructions & Technique Cues
            </label>
            <textarea
              required
              rows={3}
              placeholder="Explain key posture checkpoints, weight placement, and common failure points..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="form-textarea text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-sm py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-sm py-2 px-5"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Drill to Dojo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
