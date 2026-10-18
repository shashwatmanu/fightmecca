'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Award, 
  Flame, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  ChevronRight,
  TrendingUp,
  Star,
  Activity,
  MessageSquare
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useLMSStore } from '@/lib/store/useLMSStore';
import { GradeModal } from '@/components/modals/GradeModal';
import { Submission } from '@/types';

export default function ProgressPage() {
  const { currentRole, userProfile, submissions, assignments } = useLMSStore();
  const [selectedSubmissionToGrade, setSelectedSubmissionToGrade] = useState<Submission | null>(null);

  // Student specific filtered submissions
  const studentSubmissions = submissions.filter((s) => s.studentId === userProfile.id);
  const reviewQueue = submissions.filter((s) => s.status === 'pending_review');

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#e5a93c] bg-[#e5a93c]/10 px-2.5 py-0.5 rounded-full border border-[#e5a93c]/20">
              Progression & Telemetry
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading mt-1">
              Belt Ranks, Streak & Gradebook
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/40 border border-white/10">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
              <div>
                <span className="text-xs text-slate-400 font-semibold block leading-none">Mat Streak</span>
                <span className="text-sm font-extrabold text-white">{userProfile.streakDays} Consecutive Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Role-Specific Top Card */}
        {currentRole === 'coach' ? (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#ff5722] bg-[#ff5722]/10 px-2.5 py-1 rounded-full border border-[#ff5722]/20">
                  Sensei Command
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white font-heading mt-2">
                  Dojo Grading Queue
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Review student motion AI recordings, compare against your technique standards, and award promotions.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Pending Reviews</span>
                  <span className="text-xl font-black text-[#ff5722]">{reviewQueue.length}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-white/10">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#e5a93c]/15 to-transparent rounded-bl-full pointer-events-none blur-3xl" />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Belt Visual Indicator */}
              <div className="md:col-span-5 space-y-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Current Federation Rank
                </span>
                <div className="flex items-center gap-4">
                  {/* Belt bar simulation */}
                  <div className="relative w-36 h-10 rounded-lg shadow-xl overflow-hidden flex items-center border border-white/20 bg-blue-600">
                    <div className="absolute right-0 top-0 bottom-0 w-10 bg-black flex items-center justify-around px-1">
                      {/* Stripes */}
                      {[...Array(userProfile.stripes)].map((_, i) => (
                        <div key={i} className="w-1 h-7 bg-white rounded-sm shadow-sm" />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-white capitalize font-heading">
                      {userProfile.belt} Belt
                    </h3>
                    <p className="text-xs text-slate-400">
                      {userProfile.stripes} Degrees • {userProfile.martialArtStyle.toUpperCase()}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300">
                  Promoted by <strong>Sensei Renzo Vance</strong> at Fight Mecca HQ. Complete 3 more motion drill criteria to qualify for the next stripe test.
                </p>
              </div>

              {/* Metrics Breakdown */}
              <div className="md:col-span-7 grid grid-cols-3 gap-3">
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Mat XP</span>
                  <span className="text-xl font-extrabold text-white">{userProfile.totalXp.toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-400 block">+250 this week</span>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Avg AI Form</span>
                  <span className="text-xl font-extrabold text-[#e5a93c]">91.2%</span>
                  <span className="text-[10px] text-slate-400 block">Across 18 drills</span>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Completed</span>
                  <span className="text-xl font-extrabold text-cyan-400">{assignments.filter(a => a.completedByStudent).length}</span>
                  <span className="text-[10px] text-slate-400 block">Of {assignments.length} assigned</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Coach Review Queue (Shown prominently for Coach / Sensei) */}
        {currentRole !== 'student' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white font-heading flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#ff2e4d]" />
                  <span>Sensei Review & Grading Queue</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Student video submissions & AI motion telemetry awaiting your critique
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#ff2e4d]/20 text-[#ff2e4d] border border-[#ff2e4d]/30">
                {reviewQueue.length} Pending
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewQueue.map((sub) => (
                <div
                  key={sub.id}
                  className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-[#ff2e4d]/40 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                          {sub.studentBelt.toUpperCase()} BELT
                        </span>
                        <h4 className="text-base font-bold text-white mt-1">
                          {sub.studentName}
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-400">{sub.submittedAt}</span>
                    </div>

                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1.5 text-xs">
                      <p className="font-semibold text-white">{sub.assignmentTitle}</p>
                      <div className="flex justify-between text-slate-400">
                        <span>Mode: <strong className="text-slate-200">{sub.submissionMode === 'camera_motion_ai' ? 'Motion AI Camera' : 'Video Upload'}</strong></span>
                        <span>Reps: <strong className="text-white">{sub.recordedReps}</strong></span>
                        <span>Form: <strong className="text-[#e5a93c]">{sub.motionScore}%</strong></span>
                      </div>
                    </div>

                    {sub.aiMetricsJson?.notes && (
                      <div className="text-[11px] text-slate-300 bg-white/5 p-2.5 rounded-xl">
                        <strong className="text-amber-400">AI Notes:</strong> {sub.aiMetricsJson.notes.join(' • ')}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setSelectedSubmissionToGrade(sub)}
                      className="btn-primary text-xs py-2 px-4 shadow-md shadow-[#ff2e4d]/20"
                    >
                      <span>Grade & Leave Feedback</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Student Gradebook & Submission History */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white font-heading">
              Athlete Gradebook & Written Feedback
            </h2>
            <p className="text-xs text-slate-400">
              Historical logs of coach scores, technique critiques, and form evaluations
            </p>
          </div>

          <div className="space-y-3">
            {submissions.map((sub) => {
              const isGraded = sub.status === 'graded';
              return (
                <div
                  key={sub.id}
                  className={`glass-panel p-5 rounded-2xl border transition-all ${
                    isGraded ? 'border-emerald-500/20' : 'border-white/10'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          {sub.submittedAt}
                        </span>
                        {isGraded ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            Graded by Sensei
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                            Under Review
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white font-heading">
                        {sub.assignmentTitle}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Athlete: <strong className="text-slate-300">{sub.studentName}</strong> • {sub.recordedReps} Reps Completed • AI Score: <strong className="text-[#e5a93c]">{sub.motionScore}%</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {isGraded ? (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Final Mark</span>
                          <span className="text-2xl font-black text-emerald-400 font-heading">
                            {sub.coachGrade}/100
                          </span>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">AI Estimate</span>
                          <span className="text-xl font-extrabold text-[#e5a93c]">
                            {sub.motionScore}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Coach Written Critique */}
                  {sub.coachFeedback && (
                    <div className="mt-4 pt-3 border-t border-white/5 bg-white/5 p-3.5 rounded-xl">
                      <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                        <MessageSquare className="w-3.5 h-3.5 text-[#ff2e4d]" />
                        <span>Sensei Feedback:</span>
                      </div>
                      <p className="text-xs text-slate-300 italic leading-relaxed">
                        &ldquo;{sub.coachFeedback}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grade Modal for Sensei */}
      {selectedSubmissionToGrade && (
        <GradeModal
          submission={selectedSubmissionToGrade}
          onClose={() => setSelectedSubmissionToGrade(null)}
        />
      )}
    </AppShell>
  );
}
