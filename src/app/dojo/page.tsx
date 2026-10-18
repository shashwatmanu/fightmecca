'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Play, 
  Users, 
  Sparkles, 
  Plus, 
  Clock, 
  Award, 
  Filter, 
  ChevronRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useLMSStore } from '@/lib/store/useLMSStore';
import { CreateClassModal } from '@/components/modals/CreateClassModal';

export default function DojoCurriculumPage() {
  const { currentRole, courses, classes, joinClassByCode } = useLMSStore();
  const [activeTab, setActiveTab] = useState<'courses' | 'classes'>('courses');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joinStatus, setJoinStatus] = useState<string | null>(null);
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);

  const filteredCourses = selectedStyle === 'all'
    ? courses
    : courses.filter((c) => c.style === selectedStyle);

  const handleJoinClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;
    const res = joinClassByCode(inviteCodeInput);
    setJoinStatus(res.message);
    setInviteCodeInput('');
    setTimeout(() => setJoinStatus(null), 4000);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header with Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#ff6b35] bg-[#ff6b35]/10 px-2.5 py-0.5 rounded-full border border-[#ff6b35]/20">
              Dojo Academy
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading mt-1">
              Curriculum, Courses & Classes
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-[#14141e] p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('courses')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'courses'
                  ? 'bg-gradient-to-r from-[#ff2e4d] to-[#dd2c00] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Video Curriculum ({courses.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('classes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'classes'
                  ? 'bg-gradient-to-r from-[#ff6b35] to-[#dd2c00] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Dojo Classes & Rosters ({classes.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: Video Courses & Curriculum */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            {/* Style Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              <span className="text-xs text-slate-400 font-semibold mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Style:
              </span>
              {[
                { id: 'all', label: 'All Disciplines' },
                { id: 'bjj', label: 'Brazilian Jiu-Jitsu' },
                { id: 'muay_thai', label: 'Muay Thai' },
                { id: 'boxing', label: 'Boxing' },
                { id: 'mma', label: 'MMA Cage Control' },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                    selectedStyle === style.id
                      ? 'bg-white/15 text-white ring-1 ring-white/30'
                      : 'bg-black/40 text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="glass-panel overflow-hidden rounded-3xl flex flex-col justify-between group border border-white/10 hover:border-[#ff2e4d]/40"
                >
                  <div>
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-white border border-white/10">
                          {course.style.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#ff2e4d]/80 text-white">
                          {course.level}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-black/80 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {course.durationHours} hrs
                        </span>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-5 space-y-3">
                      <h3 className="font-bold text-white text-base leading-snug group-hover:text-[#ff2e4d] transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {course.description}
                      </p>

                      <div className="flex items-center gap-2 pt-1 text-xs text-slate-300">
                        <span className="font-semibold text-white">{course.modulesCount} Modules</span>
                        <span>•</span>
                        <span>{course.lessonsCount} Video Lessons</span>
                      </div>

                      {/* Progress bar if student enrolled */}
                      {course.progressPercent !== undefined && (
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">Curriculum Progress</span>
                            <span className="text-[#ff2e4d] font-bold">{course.progressPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#ff2e4d] to-[#ff6b35]"
                              style={{ width: `${course.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer & Action */}
                  <div className="p-5 pt-0">
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold text-slate-300">{course.instructorName}</p>
                        <p className="text-[10px] text-slate-500">{course.instructorBelt}</p>
                      </div>
                      <Link
                        href={`/dojo/course/${course.id}`}
                        className="btn-primary text-xs py-2 px-4 shadow-md shadow-[#ff2e4d]/20"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Enter Dojo</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Classroom Management & Rosters */}
        {activeTab === 'classes' && (
          <div className="space-y-6">
            {/* Class Actions Bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Join Class via Code */}
              <form onSubmit={handleJoinClass} className="md:col-span-7 glass-panel p-4 rounded-2xl flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Enter Dojo Invite Code (e.g. MECCA-9921)..."
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                  className="form-input text-xs py-2 uppercase tracking-wider"
                />
                <button type="submit" className="btn-secondary text-xs py-2 px-4 whitespace-nowrap">
                  <span>Join Class</span>
                </button>
              </form>

              {/* Coach / Admin Add Class */}
              <div className="md:col-span-5 flex justify-end">
                {currentRole !== 'student' ? (
                  <button
                    onClick={() => setIsCreateClassOpen(true)}
                    className="btn-primary text-xs py-2.5 px-5 w-full sm:w-auto shadow-lg shadow-[#ff2e4d]/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Dojo Class</span>
                  </button>
                ) : (
                  <div className="text-xs text-slate-400 italic">
                    Ask your Sensei for the 6-digit class access code.
                  </div>
                )}
              </div>
            </div>

            {joinStatus && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-bold flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                <span>{joinStatus}</span>
              </div>
            )}

            {/* Classes List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {classes.map((c) => (
                <div key={c.id} className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#ff6b35]/20 text-[#ff6b35] border border-[#ff6b35]/30">
                        {c.style.toUpperCase()}
                      </span>
                      <div className="text-xs font-mono font-bold bg-white/5 px-2.5 py-1 rounded-lg text-amber-300 border border-white/10">
                        {c.inviteCode}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-base font-heading">
                        {c.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {c.scheduleDescription}
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>Lead Sensei</span>
                        <strong className="text-white">{c.coachName}</strong>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Facility / Mat</span>
                        <span className="text-slate-400">{c.room}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Active Roster</span>
                        <span className="text-emerald-400 font-bold">{c.enrolledStudentsCount} Athletes</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button className="btn-secondary w-full text-xs py-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>View Class Roster</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isCreateClassOpen && (
        <CreateClassModal onClose={() => setIsCreateClassOpen(false)} />
      )}
    </AppShell>
  );
}
