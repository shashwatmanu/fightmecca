'use client';

/**
 * Fight Mecca AvatarReplayViewport Component
 * Provides complete 3D replay controls (play, pause, scrub, speed, orbit view) for any MotionSession.
 */

import React, { useEffect, useRef, useState } from 'react';
import { AthleteAvatarViewport } from './AthleteAvatarViewport';
import { MotionSession, MotionFrame } from '@/lib/motion/session-storage';
import { AthleteBodyProfile, ATHLETE_BODY_PRESETS } from '@/lib/motion/avatar/body-profile';
import { Reference } from '@/lib/motion/reference';
import { hydrateReferenceMotionSession } from '@/lib/motion/session-hydration';

interface AvatarReplayViewportProps {
  session?: MotionSession | null;
  reference?: Reference | null;
  bodyProfile?: AthleteBodyProfile;
  title?: string;
  autoPlay?: boolean;
}

export const AvatarReplayViewport: React.FC<AvatarReplayViewportProps> = ({
  session: initialSession = null,
  reference = null,
  bodyProfile = ATHLETE_BODY_PRESETS.NEUTRAL,
  title = 'Motion Replay',
  autoPlay = false,
}) => {
  const [activeSession, setActiveSession] = useState<MotionSession | null>(initialSession);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(reference && !initialSession));
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const animRef = useRef<number | null>(null);

  // Auto-hydrate motion session if reference prop is supplied
  useEffect(() => {
    let isSubscribed = true;
    if (reference) {
      setIsLoading(true);
      setFetchError(null);
      hydrateReferenceMotionSession(reference)
        .then((hydrated) => {
          if (!isSubscribed) return;
          setActiveSession(hydrated);
          setIsLoading(false);
        })
        .catch((err) => {
          if (!isSubscribed) return;
          console.error('[REPLAY-HYDRATION-ERROR]', err);
          setFetchError('Could not load saved reference motion.');
          setIsLoading(false);
        });
    } else {
      setActiveSession(initialSession);
      setIsLoading(false);
    }
    return () => {
      isSubscribed = false;
    };
  }, [reference, initialSession]);

  const frames: MotionFrame[] = activeSession?.frames || [];
  const totalFrames = frames.length;
  const currentFrame = frames[currentFrameIndex] || null;

  useEffect(() => {
    if (currentFrame) {
      const lm = currentFrame.landmarks || (currentFrame as any).normalized_landmarks || [];
      const getLm = (id: number) => lm.find((l: any) => l.landmark_id === id) || lm[id] || { x: 0, y: 0, z: 0 };
      console.log("[REPLAY-DIAG]", {
        totalFrames,
        currentFrameIndex,
        timestampMs: currentFrame.timestamp_ms,
        leftWrist: { x: getLm(15).x, y: getLm(15).y, z: getLm(15).z },
        rightWrist: { x: getLm(16).x, y: getLm(16).y, z: getLm(16).z },
        leftElbow: { x: getLm(13).x, y: getLm(13).y, z: getLm(13).z },
        rightElbow: { x: getLm(14).x, y: getLm(14).y, z: getLm(14).z },
      });
    }
  }, [currentFrameIndex, currentFrame, totalFrames]);

  useEffect(() => {
    if (!isPlaying || totalFrames === 0) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    let lastTime = performance.now();
    const targetFps = 30;
    const intervalMs = (1000 / targetFps) / playbackSpeed;

    const tick = (now: number) => {
      if (now - lastTime >= intervalMs) {
        setCurrentFrameIndex((prev) => (prev + 1) % totalFrames);
        lastTime = now;
      }
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, totalFrames, playbackSpeed]);

  if (isLoading) {
    return (
      <div className="w-full h-80 rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center text-slate-300 p-6 text-center">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="font-semibold text-sm">Loading saved motion...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="w-full h-80 rounded-xl border border-red-900/60 bg-red-950/40 flex flex-col items-center justify-center text-red-300 p-6 text-center">
        <p className="font-bold text-base mb-1">Could not load saved reference motion.</p>
        <p className="text-xs text-red-400">Database or network connection failed while loading motion frames.</p>
      </div>
    );
  }

  if (!activeSession || totalFrames === 0) {
    const isReferenceMissingMotion = Boolean(reference);
    return (
      <div className="w-full h-80 rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
        <p className="font-semibold text-lg mb-1">
          {isReferenceMissingMotion
            ? 'Saved reference has no linked motion session.'
            : 'No Motion Session Loaded'}
        </p>
        <p className="text-sm text-slate-500">
          {isReferenceMissingMotion
            ? 'The selected reference does not contain recorded capture session frames.'
            : 'Record a session or select a reference to preview replay.'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl flex flex-col">
      {/* Top Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
          <span className="font-semibold text-slate-200 text-sm">{title}: {activeSession.technique_id || 'Technique'}</span>
        </div>
        <div className="text-xs text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
          {totalFrames} Frames ({(((activeSession.frames?.[totalFrames - 1]?.timestamp_ms || 0)) / 1000).toFixed(1)}s)
        </div>
      </div>

      {/* 3D Anatomical Avatar Canvas */}
      <div className="relative w-full">
        <AthleteAvatarViewport
          currentFrame={currentFrame}
          bodyProfile={bodyProfile}
          height="400px"
        />
      </div>

      {/* Replay Controls & Timeline Bar */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col gap-3">
        {/* Timeline Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono w-10">
            {currentFrameIndex + 1}/{totalFrames}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(0, totalFrames - 1)}
            value={currentFrameIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentFrameIndex(parseInt(e.target.value, 10));
            }}
            className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <span className="text-xs text-slate-400 font-mono w-12 text-right">
            {(((currentFrame?.timestamp_ms || 0)) / 1000).toFixed(2)}s
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-1.5 rounded text-xs font-semibold tracking-wide transition ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentFrameIndex(0);
              }}
              className="px-3 py-1.5 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              RESTART
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium mr-1">Speed:</span>
            {[0.25, 0.5, 1.0, 1.5, 2.0].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-1.5 py-0.5 rounded font-mono ${
                  playbackSpeed === spd
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
