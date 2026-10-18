'use client';

import React, { useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  UploadCloud, 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  FileVideo
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useLMSStore } from '@/lib/store/useLMSStore';
import confetti from 'canvas-confetti';


function SubmitDrillContent() {
  const params = useParams();
  const router = useRouter();
  const { assignments, submitDrill, userProfile } = useLMSStore();

  const assignmentId = (params?.id as string) || '';
  const assignment = assignments.find((a) => a.id === assignmentId) || assignments[0];

  const [mode, setMode] = useState<'camera_motion_ai' | 'video_upload'>('camera_motion_ai');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [recordedReps, setRecordedReps] = useState(assignment ? assignment.targetReps : 10);
  const [motionScore, setMotionScore] = useState(89);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      submitDrill({
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        studentId: userProfile.id,
        studentName: userProfile.fullName,
        studentBelt: userProfile.belt,
        submissionMode: mode,
        videoUrl: mode === 'video_upload' ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' : undefined,
        recordedReps: Number(recordedReps),
        motionScore: Number(motionScore),
        aiMetricsJson: {
          averageFormScore: motionScore,
          hipRotationAngle: 91.5,
          guardStabilityPercent: 94,
          notes: ['Smooth transition sequence', 'Centerline remained intact'],
        },
      });

      setIsSubmitting(false);
      setSubmitted(true);
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.6 },
      });
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Link
          href="/train"
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#ff2e4d]">
            Assignment Verification
          </span>
          <h1 className="text-2xl font-extrabold text-white font-heading">
            Submit Technique Drill
          </h1>
        </div>
      </div>

      {/* Assignment Brief */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
              {assignment.targetTechnique}
            </span>
            <h2 className="text-lg font-bold text-white font-heading mt-2">
              {assignment.title}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              {assignment.instructions}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
          <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Target Reps</span>
            <span className="font-extrabold text-white text-base">{assignment.targetReps}</span>
          </div>
          <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Min Form Score</span>
            <span className="font-extrabold text-[#e5a93c] text-base">{assignment.minScore}%</span>
          </div>
          <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Reviewer</span>
            <span className="font-extrabold text-slate-200 text-xs block truncate mt-0.5">{assignment.coachName}</span>
          </div>
        </div>
      </div>

      {submitted ? (
        <div className="glass-panel-crimson p-8 rounded-3xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white font-heading">
              Drill Successfully Submitted!
            </h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
              Your AI-evaluated telemetry and rep breakdown has been sent to <strong>{assignment.coachName}</strong> for final grading and belt progression credit.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Link href="/progress" className="btn-primary text-xs py-2 px-5">
              View in Gradebook
            </Link>
            <Link href="/train" className="btn-secondary text-xs py-2 px-5">
              Back to Training
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-3xl space-y-6">
          <div>
            <label className="text-xs font-bold uppercase text-slate-400 block mb-2">
              Choose Submission Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('camera_motion_ai')}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                  mode === 'camera_motion_ai'
                    ? 'border-[#ff2e4d] bg-[#ff2e4d]/10 text-white shadow-lg shadow-[#ff2e4d]/20'
                    : 'border-white/10 bg-black/30 text-slate-400 hover:bg-white/5'
                }`}
              >
                <Sparkles className="w-6 h-6 text-[#ff2e4d]" />
                <span className="text-xs font-bold">Interactive Motion AI</span>
                <span className="text-[10px] text-slate-400 text-center">
                  Real-time MediaPipe pose scoring & live rep counting
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode('video_upload')}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                  mode === 'video_upload'
                    ? 'border-[#ff6b35] bg-[#ff6b35]/10 text-white shadow-lg shadow-[#ff6b35]/20'
                    : 'border-white/10 bg-black/30 text-slate-400 hover:bg-white/5'
                }`}
              >
                <UploadCloud className="w-6 h-6 text-[#ff6b35]" />
                <span className="text-xs font-bold">Upload Recorded Video</span>
                <span className="text-[10px] text-slate-400 text-center">
                  Select .mp4 or .mov file from your camera roll
                </span>
              </button>
            </div>
          </div>

          {mode === 'camera_motion_ai' && (
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#ff2e4d]" />
                  <span className="text-xs font-bold text-white">Motion Camera Tracker</span>
                </div>
                <Link
                  href="/train/technique"
                  className="text-xs text-[#ff2e4d] hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Open Full Screen Vision</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Logged Reps
                  </label>
                  <input
                    type="number"
                    value={recordedReps}
                    onChange={(e) => setRecordedReps(Number(e.target.value))}
                    className="form-input text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    AI Form Score (%)
                  </label>
                  <input
                    type="number"
                    value={motionScore}
                    onChange={(e) => setMotionScore(Number(e.target.value))}
                    className="form-input text-sm"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                ✨ The AI tracker detects hip velocity, knee alignment, and posture stability automatically during your camera session.
              </p>
            </div>
          )}

          {mode === 'video_upload' && (
            <div className="border-2 border-dashed border-white/20 hover:border-[#ff6b35] rounded-2xl p-8 text-center transition-colors bg-black/30">
              <FileVideo className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-white">
                Drag and drop your sparring or drill clip here
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supported formats: MP4, MOV up to 250MB
              </p>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="mt-4 text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#ff6b35] file:text-white hover:file:opacity-90"
              />
            </div>
          )}

          <div className="pt-2 flex justify-end gap-3">
            <Link href="/train" className="btn-secondary text-xs py-2 px-4">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary text-xs py-2.5 px-6 shadow-xl shadow-[#ff2e4d]/30"
            >
              {isSubmitting ? 'Verifying AI Telemetry...' : 'Submit Drill for Sensei Review'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function SubmitDrillPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading drill parameters...</div>}>
        <SubmitDrillContent />
      </Suspense>
    </AppShell>
  );
}
