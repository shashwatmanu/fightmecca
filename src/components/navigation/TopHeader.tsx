'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, Sparkles } from 'lucide-react';
import { RoleSwitcher } from './RoleSwitcher';
import { useLMSStore } from '@/lib/store/useLMSStore';

export const TopHeader: React.FC = () => {
  const { userProfile } = useLMSStore();

  return (
    <header className="sticky top-0 z-40 bg-[#070709]/90 backdrop-blur-2xl border-b border-white/[0.06] px-4 sm:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Mobile Brand */}
        <Link href="/train" className="flex items-center gap-2 lg:hidden shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff1e42] to-[#b3001e] flex items-center justify-center shadow-lg shadow-[#ff1e42]/30 ring-1 ring-white/20">
            <Flame className="w-4 h-4 text-white stroke-[2.5]" />
          </div>
          <span className="font-heading font-black text-base sm:text-lg tracking-wider text-white">
            FIGHT<span className="text-[#ff1e42]">MECCA</span>
          </span>
        </Link>

        {/* Left Telemetry Pills (Desktop) */}
        <div className="hidden lg:flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.07] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400 neon-pulse" />
            <span className="text-slate-300">{userProfile.streakDays} Day Mat Streak</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.07] text-xs font-semibold text-slate-300">
            <span className="text-[#e5a93c] font-black tracking-wider uppercase">XP</span>
            <span className="font-bold text-white">{userProfile.totalXp.toLocaleString()}</span>
          </div>
        </div>

        {/* Center: Role Switcher (Visible on desktop & tablets, hidden on small mobile to prevent wrapping) */}
        <div className="hidden md:flex justify-center">
          <RoleSwitcher />
        </div>

        {/* Right CTA / Motion Lab / Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/train/technique"
            className="flex items-center gap-1.5 bg-[#ff1e42] hover:bg-[#e01435] text-white text-[11px] sm:text-xs font-bold py-1.5 sm:py-2 px-3 sm:px-4 rounded-full shadow-lg shadow-[#ff1e42]/25 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Motion Lab</span>
          </Link>

          <Link href="/profile" className="flex items-center group shrink-0">
            <div className="relative">
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.fullName}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-[#ff1e42] transition-all"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#070709]" />
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};
