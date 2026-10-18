'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Play, 
  Sparkles, 
  ChevronRight, 
  Clock, 
  Award, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  ArrowUpRight,
  Flame,
  Target
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useLMSStore } from '@/lib/store/useLMSStore';
import { AssignmentModal } from '@/components/modals/AssignmentModal';

export default function TrainDashboardPage() {
  const { currentRole, userProfile, courses, assignments } = useLMSStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const activeCourse = courses[0];

  return (
    <AppShell>
      <div className="space-y-10">
        {/* Welcome Editorial Strip */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black tracking-widest uppercase text-[#ff1e42] bg-[#ff1e42]/10 px-2.5 py-0.5 rounded-full border border-[#ff1e42]/20">
                {currentRole === 'student' && 'Athlete Training Ground'}
                {currentRole === 'coach' && 'Sensei Command Center'}
                {currentRole === 'admin' && 'Federation Director'}
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                {userProfile.gymAffiliation}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
              {currentRole === 'coach' ? 'Curriculum & Athlete Evaluations' : `Welcome Back, ${userProfile.fullName.split(' ')[0]}`}
            </h1>
          </div>

          <div>
            {currentRole === 'coach' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-combat text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create Drill Assignment</span>
              </button>
            )}
          </div>
        </div>

        {/* Hero Section: Editorial Continue Lesson Card */}
        <div className="card-hero p-6 sm:p-10 relative overflow-hidden group">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#ff1e42]/15 via-transparent to-transparent rounded-full pointer-events-none -mr-20 -mt-20 blur-3xl" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-white/[0.07] border border-white/10 text-white">
                  IN PROGRESS
                </span>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Module 1 of {activeCourse.modulesCount}
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-[#ff1e42] transition-colors font-heading leading-tight">
                  {activeCourse.title}
                </h2>
                <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                  Next Up: <span className="text-white font-semibold">01. The Centerline Headquarters Base & Knee Shield Clearance</span>
                </p>
              </div>

              {/* Progress Slider */}
              <div className="space-y-2 max-w-md pt-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Curriculum Progress</span>
                  <span className="text-[#ff1e42] font-black">{activeCourse.progressPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden p-0">
                  <div
                    className="h-full bg-gradient-to-r from-[#ff1e42] to-[#ff5722] rounded-full transition-all duration-700"
                    style={{ width: `${activeCourse.progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 flex flex-wrap items-center gap-3">
                <Link
                  href={`/dojo/course/${activeCourse.id}`}
                  className="btn-combat text-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Resume Lesson</span>
                </Link>
                <Link
                  href="/train/technique"
                  className="btn-ghost-combat text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Interactive AI Drill</span>
                </Link>
              </div>
            </div>

            {/* Right Media Preview */}
            <div className="lg:col-span-5 relative rounded-2xl overflow-hidden aspect-video shadow-2xl border border-white/10">
              <img
                src={activeCourse.thumbnailUrl}
                alt={activeCourse.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#ff1e42] flex items-center justify-center shadow-xl shadow-[#ff1e42]/50 group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                </div>
              </div>
              <div className="absolute bottom-3 left-3 right-3 px-3 py-1.5 bg-black/70 backdrop-blur-md rounded-xl text-[11px] font-semibold text-slate-300 flex justify-between items-center border border-white/10">
                <span>{activeCourse.instructorName}</span>
                <span className="text-[#e5a93c] font-black">{activeCourse.durationHours} hrs total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Motion Drills & Criteria */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-heading">
                {currentRole === 'coach' ? 'Assigned Curriculum Drills' : 'Upcoming Technique Drills'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentRole === 'coach'
                  ? 'Criteria-based motion tasks configured for student evaluation'
                  : 'AI-evaluated assignments verified by your Sensei'}
              </p>
            </div>
            <Link
              href="/progress"
              className="text-xs font-bold text-[#ff1e42] hover:underline flex items-center gap-1 uppercase tracking-wider"
            >
              <span>View Gradebook</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {assignments.map((assignment) => {
              const isCompleted = assignment.completedByStudent;
              return (
                <div
                  key={assignment.id}
                  className={`card-glass p-6 rounded-3xl flex flex-col justify-between border transition-all duration-300 ${
                    isCompleted ? 'border-emerald-500/20' : 'border-white/[0.08] hover:border-[#ff1e42]/40'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-300">
                        {assignment.targetTechnique}
                      </span>
                      {isCompleted ? (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Graded
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                          <AlertCircle className="w-3 h-3" /> {assignment.dueDate}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-base leading-snug group-hover:text-[#ff1e42] transition-colors">
                        {assignment.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {assignment.instructions}
                      </p>
                    </div>

                    {/* Criteria telemetry pills */}
                    <div className="grid grid-cols-2 gap-2.5 pt-2 text-xs">
                      <div className="bg-black/40 p-2.5 rounded-2xl border border-white/[0.05]">
                        <span className="text-[9px] text-slate-400 font-black block uppercase tracking-wider">Target Reps</span>
                        <span className="font-extrabold text-white text-sm">{assignment.targetReps} Reps</span>
                      </div>
                      <div className="bg-black/40 p-2.5 rounded-2xl border border-white/[0.05]">
                        <span className="text-[9px] text-slate-400 font-black block uppercase tracking-wider">Min Form Accuracy</span>
                        <span className="font-extrabold text-[#e5a93c] text-sm">{assignment.minScore}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      By {assignment.coachName}
                    </span>
                    <Link
                      href={`/train/submit/${assignment.id}`}
                      className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                        isCompleted
                          ? 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.08]'
                          : 'bg-[#ff1e42] text-white shadow-md shadow-[#ff1e42]/20 hover:scale-102'
                      }`}
                    >
                      <span>{isCompleted ? 'View Result' : 'Start Drill'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Curated Technique Library */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-heading">
                Technique Vault
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                High-definition curriculum instructionals from world-class masters
              </p>
            </div>
            <Link
              href="/dojo"
              className="text-xs font-bold text-[#ff5722] hover:underline flex items-center gap-1 uppercase tracking-wider"
            >
              <span>Explore all {courses.length} courses</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="card-glass rounded-3xl overflow-hidden flex flex-col group border border-white/[0.08]">
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-white border border-white/10">
                      {course.style.toUpperCase()} • {course.level}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-lg bg-black/80 text-[#e5a93c] border border-[#e5a93c]/30">
                      {course.durationHours} hrs
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-white text-base leading-snug group-hover:text-[#ff1e42] transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-200">{course.instructorName}</p>
                      <p className="text-[10px] font-semibold text-slate-400">{course.instructorBelt}</p>
                    </div>
                    <Link
                      href={`/dojo/course/${course.id}`}
                      className="btn-ghost-combat text-xs py-1.5 px-3.5"
                    >
                      <span>Study</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isCreateModalOpen && (
        <AssignmentModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </AppShell>
  );
}
