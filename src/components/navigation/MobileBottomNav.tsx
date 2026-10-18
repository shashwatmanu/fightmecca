'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dumbbell, BookOpen, BarChart3, MessageSquare, User } from 'lucide-react';
import { useLMSStore } from '@/lib/store/useLMSStore';

interface MobileNavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number | null;
}

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { currentRole, assignments, submissions } = useLMSStore();

  const pendingAssignmentsCount = assignments.filter((a) => !a.completedByStudent).length;
  const pendingReviewCount = submissions.filter((s) => s.status === 'pending_review').length;

  const studentNavItems: MobileNavItem[] = [
    { label: 'Train', icon: Dumbbell, href: '/train' },
    { label: 'Dojo', icon: BookOpen, href: '/dojo' },
    { 
      label: 'Progress', 
      icon: BarChart3, 
      href: '/progress', 
      badge: pendingAssignmentsCount > 0 ? pendingAssignmentsCount : null 
    },
    { label: 'Community', icon: MessageSquare, href: '/community' },
    { label: 'Profile', icon: User, href: '/profile' },
  ];

  const coachNavItems: MobileNavItem[] = [
    { label: 'Overview', icon: Dumbbell, href: '/train' },
    { label: 'Curriculum', icon: BookOpen, href: '/dojo' },
    { 
      label: 'Grading', 
      icon: BarChart3, 
      href: '/progress', 
      badge: pendingReviewCount > 0 ? pendingReviewCount : null 
    },
    { label: 'Broadcasts', icon: MessageSquare, href: '/community' },
    { label: 'Sensei', icon: User, href: '/profile' },
  ];

  const adminNavItems: MobileNavItem[] = [
    { label: 'Overview', icon: Dumbbell, href: '/train' },
    { label: 'Academy', icon: BookOpen, href: '/dojo' },
    { label: 'Analytics', icon: BarChart3, href: '/progress' },
    { label: 'Feed', icon: MessageSquare, href: '/community' },
    { label: 'Admin', icon: User, href: '/profile' },
  ];

  const navItems = currentRole === 'coach' 
    ? coachNavItems 
    : currentRole === 'admin' 
    ? adminNavItems 
    : studentNavItems;

  return (
    <nav className="pwa-nav lg:hidden px-3 pt-2">
      <div className="flex items-center justify-around relative">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/train' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300 relative ${
                isActive ? 'text-[#ff5722]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1.5 rounded-full transition-all duration-300 ${
                    isActive ? 'scale-110 bg-[#ff5722]/15 text-[#ff5722]' : ''
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[2]" />
                </div>
                {Boolean(item.badge) && (
                  <span className="absolute -top-1 -right-1 bg-[#ff5722] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#08080d]">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-black text-white' : 'font-semibold text-slate-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
