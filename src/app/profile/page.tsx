'use client';

import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  Award, 
  Users, 
  Settings, 
  Flame, 
  Sparkles, 
  Smartphone, 
  Bell, 
  ChevronRight,
  Camera,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useLMSStore } from '@/lib/store/useLMSStore';
import { UserRole } from '@/types';

export default function ProfilePage() {
  const { currentRole, setRole, userProfile, updateProfile } = useLMSStore();
  const [notificationState, setNotificationState] = useState(true);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile.fullName);
  const [gymInput, setGymInput] = useState(userProfile.gymAffiliation);

  const roles: { role: UserRole; title: string; subtitle: string; icon: React.ReactNode }[] = [
    {
      role: 'student',
      title: 'Student / Athlete Mode',
      subtitle: 'Submit drill video assignments, review coach scores, track belt advancement',
      icon: <Award className="w-5 h-5 text-cyan-400" />,
    },
    {
      role: 'coach',
      title: 'Sensei / Coach Mode',
      subtitle: 'Create video modules, publish drill criteria, grade submissions in the review queue',
      icon: <Shield className="w-5 h-5 text-[#ff2e4d]" />,
    },
    {
      role: 'admin',
      title: 'Dojo Admin Mode',
      subtitle: 'Facility overview, manage coach & student rosters, broadcast federation bulletins',
      icon: <Users className="w-5 h-5 text-[#e5a93c]" />,
    },
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      fullName: nameInput,
      gymAffiliation: gymInput,
    });
    setIsEditing(false);
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
            Fighter Profile & Settings
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading mt-1">
            Account, Role & App Preferences
          </h1>
        </div>

        {/* User Profile Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.fullName}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-[#ff2e4d]/40 shadow-xl"
                />
                <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#ff2e4d] text-white">
                  <Camera className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-white font-heading">
                    {userProfile.fullName}
                  </h2>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {userProfile.role}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{userProfile.email}</p>
                <p className="text-xs text-slate-300 mt-1 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  {userProfile.belt.toUpperCase()} BELT • {userProfile.stripes} STRIPES • {userProfile.gymAffiliation}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-secondary text-xs py-2 px-4 self-start sm:self-center"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Fighter Card'}
            </button>
          </div>

          {isEditing && (
            <form onSubmit={handleSaveProfile} className="pt-4 border-t border-white/5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Full Name / Ring Alias
                  </label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="form-input text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Dojo / Academy Affiliation
                  </label>
                  <input
                    type="text"
                    required
                    value={gymInput}
                    onChange={(e) => setGymInput(e.target.value)}
                    className="form-input text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn-primary text-xs py-2 px-5">
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Section 2: Role Switcher Control */}
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-bold text-white font-heading">
              Select LMS Role Experience
            </h3>
            <p className="text-xs text-slate-400">
              Instantly toggle UI view to preview student, coach, or administrator workflows
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roles.map((r) => {
              const isCurrent = currentRole === r.role;
              return (
                <button
                  key={r.role}
                  onClick={() => setRole(r.role)}
                  className={`glass-panel p-5 rounded-2xl text-left border flex flex-col justify-between transition-all ${
                    isCurrent
                      ? 'border-[#ff2e4d] bg-[#ff2e4d]/10 ring-1 ring-[#ff2e4d]'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-white/5">{r.icon}</div>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-[#ff2e4d] bg-[#ff2e4d]/20 px-2 py-0.5 rounded-full">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white font-heading mt-2">
                      {r.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {r.subtitle}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>{isCurrent ? 'Viewing' : 'Switch to role'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Mobile & Capacitor Device Readiness */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#ff6b35]" />
            <h3 className="text-base font-bold text-white font-heading">
              Mobile WebView & Sensor Calibration
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Optimized for iOS and Android native containers (Capacitor / Cordova WebView). Safe-area insets active.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/5 text-xs">
              <div>
                <span className="font-bold text-white block">Camera Pose Tracking Permission</span>
                <span className="text-[11px] text-slate-400">Allows MediaPipe 33-point real-time skeletal analysis</span>
              </div>
              <button
                onClick={() => setCameraPermissionGranted(!cameraPermissionGranted)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  cameraPermissionGranted ? 'bg-[#ff2e4d]' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    cameraPermissionGranted ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/5 text-xs">
              <div>
                <span className="font-bold text-white block">Dojo Assignment Notifications</span>
                <span className="text-[11px] text-slate-400">Alerts when Sensei publishes drill grades or critiques</span>
              </div>
              <button
                onClick={() => setNotificationState(!notificationState)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  notificationState ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    notificationState ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/5 text-xs">
              <div>
                <span className="font-bold text-white block">Haptic Rep Lockout Pulse</span>
                <span className="text-[11px] text-slate-400">Vibrate mobile phone when a repetition reaches apex criteria</span>
              </div>
              <button
                onClick={() => setHapticFeedback(!hapticFeedback)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  hapticFeedback ? 'bg-[#e5a93c]' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    hapticFeedback ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
