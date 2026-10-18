'use client';

import React, { useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle2, 
  Bookmark, 
  Sparkles, 
  Award, 
  ChevronDown, 
  ChevronUp, 
  Download 
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useLMSStore } from '@/lib/store/useLMSStore';
import { INITIAL_MODULES } from '@/lib/data/mockData';


function CoursePlayerContent() {
  const params = useParams();
  const { courses, toggleLessonComplete } = useLMSStore();

  const courseId = (params?.id as string) || 'crs-01';
  const course = courses.find((c) => c.id === courseId) || courses[0];
  const modules = INITIAL_MODULES[course?.id || 'crs-01'] || INITIAL_MODULES['crs-01'];

  const [currentLesson, setCurrentLesson] = useState(modules[0]?.lessons[0]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [openModuleId, setOpenModuleId] = useState<string>(modules[0]?.id || '');

  const toggleModule = (id: string) => {
    setOpenModuleId((prev) => (prev === id ? '' : id));
  };

  const handleMarkComplete = () => {
    if (currentLesson && course) {
      toggleLessonComplete(course.id, currentLesson.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Link
          href="/dojo"
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#ff2e4d]">
            Course Player • {course?.style?.toUpperCase()}
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white font-heading truncate">
            {course?.title}
          </h1>
        </div>
      </div>

      {/* Video Player + Curriculum Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Video & Details (Col 8) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl">
            <video
              key={currentLesson?.id}
              controls
              autoPlay
              poster={course?.thumbnailUrl}
              className="w-full h-full object-cover"
              src={currentLesson?.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
            />
          </div>

          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-[#ff6b35] uppercase">
                  Lesson {currentLesson?.orderIndex} • {currentLesson?.durationMinutes} Mins
                </span>
                <h2 className="text-xl font-bold text-white font-heading mt-0.5">
                  {currentLesson?.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isBookmarked
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <Bookmark className="w-4 h-4 fill-current" />
                </button>

                <button
                  onClick={handleMarkComplete}
                  className="btn-primary text-xs py-2 px-4 shadow-md shadow-[#ff2e4d]/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Complete</span>
                </button>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {currentLesson?.description}
            </p>

            <div className="pt-3 border-t border-white/5 flex flex-wrap items-center gap-3">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Downloading Fight Mecca Drill PDF Cheatsheet...');
                }}
                className="btn-secondary text-xs py-2 px-4"
              >
                <Download className="w-4 h-4 text-[#e5a93c]" />
                <span>Download Drill PDF Guide</span>
              </a>

              <Link
                href="/train/technique"
                className="btn-secondary text-xs py-2 px-4 border-[#ff2e4d]/30 text-white hover:border-[#ff2e4d]"
              >
                <Sparkles className="w-4 h-4 text-[#ff2e4d]" />
                <span>Practice Form in Motion Lab</span>
              </Link>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl space-y-3">
            <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
              <Award className="w-4 h-4 text-[#e5a93c]" />
              <span>Coach Key Takeaways & Checkpoints</span>
            </h3>
            <ul className="space-y-2">
              {currentLesson?.keyTakeaways.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-[#ff2e4d]/20 text-[#ff2e4d] font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-snug">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Module & Curriculum Drawer (Col 4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base font-heading">
                Curriculum Modules
              </h3>
              <span className="text-xs text-[#ff2e4d] font-bold">
                {course?.progressPercent || 0}% Finished
              </span>
            </div>

            <div className="space-y-3">
              {modules.map((mod) => {
                const isOpen = openModuleId === mod.id;
                return (
                  <div
                    key={mod.id}
                    className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{mod.title}</p>
                        <p className="text-[11px] text-slate-400">{mod.lessons.length} lessons</p>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="p-2 space-y-1 border-t border-white/5 bg-black/20">
                        {mod.lessons.map((lesson) => {
                          const isSelected = currentLesson?.id === lesson.id;
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => setCurrentLesson(lesson)}
                              className={`w-full p-2.5 rounded-xl text-left flex items-start gap-3 transition-all ${
                                isSelected
                                  ? 'bg-gradient-to-r from-[#ff2e4d]/20 to-transparent border border-[#ff2e4d]/40 text-white font-semibold'
                                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <Play className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isSelected ? 'text-[#ff2e4d] fill-[#ff2e4d]' : 'text-slate-500'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs truncate">{lesson.title}</p>
                                <span className="text-[10px] text-slate-500">
                                  {lesson.durationMinutes} mins
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CoursePlayerPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading course curriculum...</div>}>
        <CoursePlayerContent />
      </Suspense>
    </AppShell>
  );
}
