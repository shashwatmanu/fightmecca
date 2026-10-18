'use client';

import React, { useState } from 'react';
import { X, Award, CheckCircle2, MessageSquare } from 'lucide-react';
import { useLMSStore } from '@/lib/store/useLMSStore';
import { Submission } from '@/types';

export const GradeModal: React.FC<{ submission: Submission; onClose: () => void }> = ({
  submission,
  onClose,
}) => {
  const { gradeSubmission } = useLMSStore();
  const [grade, setGrade] = useState(submission.motionScore || 85);
  const [feedback, setFeedback] = useState(
    'Crisp posture! Notice how your hip angle stayed stabilized throughout the reps. Keep chin tucked and drive through your heels.'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    gradeSubmission(submission.id, Number(grade), feedback);
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
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-heading">
              Grade Student Drill
            </h2>
            <p className="text-xs text-slate-400">
              {submission.studentName} • {submission.assignmentTitle}
            </p>
          </div>
        </div>

        {/* Video / AI summary */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 mb-4 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Submission Mode</span>
            <span className="text-white font-semibold">
              {submission.submissionMode === 'camera_motion_ai' ? 'Motion AI Camera' : 'Video Upload'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Reps Logged</span>
            <span className="text-white font-semibold">{submission.recordedReps}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">AI Pose Form Score</span>
            <span className="text-[#e5a93c] font-bold">{submission.motionScore}%</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
              Official Coach Grade (0 - 100)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              required
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
              className="form-input text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
              Sensei Written Critique & Corrections
            </label>
            <textarea
              required
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
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
              className="btn-primary text-sm py-2 px-5 shadow-lg shadow-[#ff2e4d]/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Publish Grade & Feedback</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
