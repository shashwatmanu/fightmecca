'use client';

import React from 'react';
import { DesktopSidebar } from '@/components/navigation/DesktopSidebar';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { TopHeader } from '@/components/navigation/TopHeader';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#08080c]">
      {/* Desktop Persistent Sidebar */}
      <DesktopSidebar />

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader />
        
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Floating Bottom Bar with Safe-Area */}
      <MobileBottomNav />
    </div>
  );
};
