'use client';

import React, { useState } from 'react';
import { 
  MessageSquare, 
  Heart, 
  Sparkles, 
  Plus, 
  Megaphone, 
  Send, 
  Calendar, 
  Award, 
  Flame,
  ShieldAlert
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useLMSStore } from '@/lib/store/useLMSStore';

export default function CommunityPage() {
  const { currentRole, userProfile, announcements, addAnnouncement, likeAnnouncement } = useLMSStore();
  const [activeTab, setActiveTab] = useState<'announcements' | 'discussions'>('announcements');
  const [isPosting, setIsPosting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'Seminar' | 'Grading' | 'Tournament' | 'General'>('General');

  // Discussions feed state
  const [discussions, setDiscussions] = useState([
    {
      id: 'disc-01',
      author: 'Carlos Mendes',
      belt: 'Purple Belt',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      time: '3 hours ago',
      technique: 'Bodylock Pass Counter',
      question: 'When fighting the bodylock pass from butterfly, what is your primary trigger to pummel the underhook before they flatten your hips?',
      replies: [
        {
          author: 'Sensei Renzo Vance',
          role: 'Coach',
          text: 'Never stay flat on your back! The moment their hands clasp, frame your elbow into their clavicle to create space for the hip-escape.',
        },
      ],
      likes: 19,
    },
    {
      id: 'disc-02',
      author: 'Aiko Tanaka',
      belt: 'Blue Belt',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      time: '6 hours ago',
      technique: 'Muay Thai Switch Kick',
      question: 'In the Motion AI drill for switch kicks, my guard stability drops to 68%. Any advice on keeping the lead hand pinned?',
      replies: [
        {
          author: 'Kru Samart Nolan',
          role: 'Coach',
          text: 'Glue your lead glove thumb to your eyebrow during the step switch. Only swing the rear arm for momentum.',
        },
      ],
      likes: 31,
    },
  ]);

  const [newQuestion, setNewQuestion] = useState('');
  const [newTechTag, setNewTechTag] = useState('');

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    addAnnouncement({
      title,
      content,
      category,
      authorName: userProfile.fullName,
      authorRole: currentRole,
    });
    setTitle('');
    setContent('');
    setIsPosting(false);
  };

  const handlePostDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion) return;
    setDiscussions([
      {
        id: `disc-${Date.now()}`,
        author: userProfile.fullName,
        belt: `${userProfile.belt.toUpperCase()} BELT`,
        avatar: userProfile.avatarUrl,
        time: 'Just now',
        technique: newTechTag || 'General Combat Strategy',
        question: newQuestion,
        replies: [],
        likes: 0,
      },
      ...discussions,
    ]);
    setNewQuestion('');
    setNewTechTag('');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Federation Community
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading mt-1">
              Dojo Announcements & Mat Q&A
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-[#14141e] p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('announcements')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'announcements'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Dojo Bulletins</span>
            </button>
            <button
              onClick={() => setActiveTab('discussions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'discussions'
                  ? 'bg-gradient-to-r from-[#ff2e4d] to-[#dd2c00] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Mat Q&A ({discussions.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: Dojo Announcements & Seminars */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            {/* Admin / Coach Create Announcement Bar */}
            {currentRole !== 'student' && (
              <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white font-heading">
                      Publish Official Bulletin to Dojo
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsPosting(!isPosting)}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    {isPosting ? 'Cancel' : '+ New Bulletin'}
                  </button>
                </div>

                {isPosting && (
                  <form onSubmit={handlePostAnnouncement} className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          required
                          placeholder="Headline (e.g. ADCC Champ Seminar / Grading Date)..."
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="form-input text-xs"
                        />
                      </div>
                      <div>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as any)}
                          className="form-select text-xs"
                        >
                          <option value="Seminar">Seminar</option>
                          <option value="Grading">Grading / Promotion</option>
                          <option value="Tournament">Tournament</option>
                          <option value="General">General Bulletin</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <textarea
                        required
                        rows={3}
                        placeholder="Details of the announcement, required equipment, schedule..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="form-textarea text-xs"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button type="submit" className="btn-primary text-xs py-2 px-5">
                        <Send className="w-3.5 h-3.5" />
                        <span>Broadcast Announcement</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Announcements Feed */}
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          {ann.category}
                        </span>
                        <span className="text-xs text-slate-400">{ann.createdAt}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white font-heading mt-1">
                        {ann.title}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Posted by <strong className="text-slate-200">{ann.authorName}</strong> ({ann.authorRole})
                      </p>
                    </div>

                    <button
                      onClick={() => likeAnnouncement(ann.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-rose-400 border border-white/10 transition-colors"
                    >
                      <Heart className="w-3.5 h-3.5 fill-rose-500/30 text-rose-500" />
                      <span>{ann.likesCount}</span>
                    </button>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Discussions & Technique Q&A */}
        {activeTab === 'discussions' && (
          <div className="space-y-6">
            {/* Ask Question Card */}
            <form onSubmit={handlePostDiscussion} className="glass-panel p-5 rounded-3xl border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white font-heading">
                <Sparkles className="w-4 h-4 text-[#ff2e4d]" />
                <span>Ask Sensei or Dojo Peers a Technique Question</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Technique Tag (e.g. Heel Hook Escape, Jab Counters)..."
                  value={newTechTag}
                  onChange={(e) => setNewTechTag(e.target.value)}
                  className="form-input text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="What is your question on posture, timing, or grips?..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="form-input text-xs sm:col-span-2"
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn-primary text-xs py-2 px-5">
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Question</span>
                </button>
              </div>
            </form>

            {/* Discussions Threads */}
            <div className="space-y-4">
              {discussions.map((d) => (
                <div key={d.id} className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={d.avatar}
                        alt={d.author}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{d.author}</h4>
                          <span className="text-[10px] font-semibold text-slate-400">• {d.time}</span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                          {d.belt}
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                      {d.technique}
                    </span>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    {d.question}
                  </p>

                  {/* Replies */}
                  {d.replies.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                      {d.replies.map((reply, i) => (
                        <div key={i} className="bg-black/40 p-3.5 rounded-2xl border border-white/5 space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-white">{reply.author}</span>
                            <span className="text-[10px] bg-[#ff2e4d]/20 text-[#ff2e4d] font-bold px-2 py-0.5 rounded-full">
                              {reply.role}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {reply.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
