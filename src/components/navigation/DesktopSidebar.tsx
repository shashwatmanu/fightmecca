'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Dumbbell, 
  BookOpen, 
  BarChart3, 
  MessageSquare, 
  User, 
  Flame, 
  Sparkles
} from 'lucide-react';
import { useLMSStore } from '@/lib/store/useLMSStore';

interface SidebarNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  count?: number | null;
}

export const DesktopSidebar: React.FC = () => {
  const pathname = usePathname();
  const { currentRole, userProfile, assignments, submissions } = useLMSStore();

  const pendingAssignmentsCount = assignments.filter((a) => !a.completedByStudent).length;
  const pendingReviewCount = submissions.filter((s) => s.status === 'pending_review').length;

  const studentNavItems: SidebarNavItem[] = [
    { label: 'Train & Drills', href: '/train', icon: Dumbbell },
    { label: 'AI Motion Lab', href: '/train/technique', icon: Sparkles, badge: 'LIVE' },
    { label: 'Dojo Curriculum', href: '/dojo', icon: BookOpen },
    { 
      label: 'Rank & Gradebook', 
      href: '/progress', 
      icon: BarChart3, 
      count: pendingAssignmentsCount > 0 ? pendingAssignmentsCount : null 
    },
    { label: 'Mat Community', href: '/community', icon: MessageSquare },
    { label: 'Fighter Profile', href: '/profile', icon: User },
  ];

  const coachNavItems: SidebarNavItem[] = [
    { label: 'Dojo Overview', href: '/train', icon: Dumbbell },
    { label: 'Record Reference', href: '/train/technique', icon: Sparkles, badge: 'COACH' },
    { label: 'Curriculum Builder', href: '/dojo', icon: BookOpen },
    { 
      label: 'Grading Queue', 
      href: '/progress', 
      icon: BarChart3, 
      count: pendingReviewCount > 0 ? pendingReviewCount : null 
    },
    { label: 'Dojo Broadcasts', href: '/community', icon: MessageSquare },
    { label: 'Sensei Settings', href: '/profile', icon: User },
  ];

  const adminNavItems: SidebarNavItem[] = [
    { label: 'Federation Hub', href: '/train', icon: Dumbbell },
    { label: 'Motion Lab', href: '/train/technique', icon: Sparkles },
    { label: 'Academy Courses', href: '/dojo', icon: BookOpen },
    { label: 'Analytics & Audits', href: '/progress', icon: BarChart3 },
    { label: 'Community Feed', href: '/community', icon: MessageSquare },
    { label: 'Dojo Management', href: '/profile', icon: User },
  ];

  const navItems = currentRole === 'coach' 
    ? coachNavItems 
    : currentRole === 'admin' 
    ? adminNavItems 
    : studentNavItems;

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-[#08080d]/80 backdrop-blur-2xl border-r border-white/[0.06] p-6 z-40 select-none">
      {/* Brand Header */}
      <Link href="/train" className="flex items-center gap-3 mb-10 group">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ff5722] via-[#f4511e] to-[#d84315] flex items-center justify-center shadow-lg shadow-[#ff5722]/30 ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-300">
          <Flame className="w-5 h-5 text-white stroke-[2.5]" />
        </div>
        <div>
          <span className="font-heading font-black text-xl tracking-wider text-white flex items-center">
            FIGHT<span className="text-[#ff5722]">MECCA</span>
          </span>
          <p className="text-[9px] tracking-widest text-slate-400 font-extrabold uppercase">
            Combat Sports LMS
          </p>
        </div>
      </Link>

      {/* Nav List */}
      <div className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/train' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-3 rounded-2xl font-semibold text-xs tracking-wide transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-white/[0.08] to-transparent text-white border-l-2 border-[#ff5722] pl-4 shadow-inner'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#ff5722]' : 'text-slate-400 group-hover:text-white'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded-full bg-[#ff5722]/20 text-[#ff5722] border border-[#ff5722]/30">
                  {item.badge}
                </span>
              )}
              {item.count && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#ff5722] text-white">
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Belt Profile Footer */}
      <div className="pt-4 border-t border-white/[0.06]">
        <Link
          href="/profile"
          className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] transition-all"
        >
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.fullName}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-[#ff5722]/40"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{userProfile.fullName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <p className="text-[10px] font-semibold text-slate-400 capitalize truncate">
                {userProfile.belt} Belt • {userProfile.stripes} Stripes
              </p>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
};
