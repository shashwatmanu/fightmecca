'use client';

import React from 'react';
import { useLMSStore } from '@/lib/store/useLMSStore';
import { UserRole } from '@/types';
import { Shield, Award, Users } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { currentRole, setRole } = useLMSStore();

  const roles: { role: UserRole; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { role: 'student', label: 'Athlete', icon: Award },
    { role: 'coach', label: 'Sensei', icon: Shield },
    { role: 'admin', label: 'Director', icon: Users },
  ];

  return (
    <div className="flex items-center p-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-inner">
      {roles.map((r) => {
        const isActive = currentRole === r.role;
        const Icon = r.icon;
        return (
          <button
            key={r.role}
            onClick={() => setRole(r.role)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all duration-300 ${
              isActive
                ? 'bg-[#ff5722] text-white shadow-lg shadow-[#ff5722]/30 scale-100'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{r.label}</span>
          </button>
        );
      })}
    </div>
  );
};
