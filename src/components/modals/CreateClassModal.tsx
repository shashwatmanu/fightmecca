'use client';

import React, { useState } from 'react';
import { X, Users, Plus } from 'lucide-react';
import { useLMSStore } from '@/lib/store/useLMSStore';
import { MartialArtStyle } from '@/types';

export const CreateClassModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addClass } = useLMSStore();
  const [name, setName] = useState('');
  const [style, setStyle] = useState<MartialArtStyle>('bjj');
  const [schedule, setSchedule] = useState('Tue / Thu • 7:00 PM - 8:30 PM');
  const [room, setRoom] = useState('Mat 1 - Championship Arena');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    // Generate readable random invite code
    const randomCode = `MECCA-${Math.floor(1000 + Math.random() * 9000)}`;

    addClass({
      name,
      style,
      scheduleDescription: schedule,
      room,
      inviteCode: randomCode,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-md p-6 rounded-3xl relative border border-white/20 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#ff6b35]/20 text-[#ff6b35] flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-heading">
              Create New Dojo Class
            </h2>
            <p className="text-xs text-slate-400">
              Generate invite codes for students to join your mat roster
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
              Class Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Advanced No-Gi Leg Lock Lab"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                Discipline
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as MartialArtStyle)}
                className="form-select text-sm"
              >
                <option value="bjj">Brazilian Jiu-Jitsu</option>
                <option value="muay_thai">Muay Thai</option>
                <option value="boxing">Boxing</option>
                <option value="mma">MMA</option>
                <option value="wrestling">Wrestling</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                Mat Room / Ring
              </label>
              <input
                type="text"
                required
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="form-input text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
              Schedule Description
            </label>
            <input
              type="text"
              required
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="form-input text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-sm py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-sm py-2 px-5"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Class Code</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
