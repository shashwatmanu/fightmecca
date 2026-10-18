'use client';

/**
 * Fight Mecca SynchronizedAvatarComparisonViewport Component
 * Synchronized 3D comparison viewer displaying Reference vs Attempt anatomical avatars side-by-side or ghost overlay.
 */

import React, { useEffect, useRef, useState } from 'react';
import { AthleteAvatarViewport } from './AthleteAvatarViewport';
import { MotionSession, MotionFrame } from '@/lib/motion/session-storage';
import { AthleteBodyProfile, ATHLETE_BODY_PRESETS } from '@/lib/motion/avatar/body-profile';
import { Reference } from '@/lib/motion/reference';
import { hydrateReferenceMotionSession } from '@/lib/motion/session-hydration';

interface SynchronizedAvatarComparisonViewportProps {
  referenceSession?: MotionSession | null;
  reference?: Reference | null;
  attemptSession: MotionSession | null;
  athleteBodyProfile?: AthleteBodyProfile;
  referenceBodyProfile?: AthleteBodyProfile;
}

export const SynchronizedAvatarComparisonViewport: React.FC<SynchronizedAvatarComparisonViewportProps> = ({
  referenceSession: initialReferenceSession = null,
  reference = null,
  attemptSession,
  athleteBodyProfile = ATHLETE_BODY_PRESETS.NEUTRAL,
  referenceBodyProfile = ATHLETE_BODY_PRESETS.MUSCULAR,
}) => {
  const [activeReferenceSession, setActiveReferenceSession] = useState<MotionSession | null>(initialReferenceSession);
  const [isPlaying, setIsPlaying] = useState(false);
  const [normalizedProgress, setNormalizedProgress] = useState(0); // 0.0 to 1.0
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    let isSubscribed = true;
    if (reference) {
      hydrateReferenceMotionSession(reference)
        .then((hydrated) => {
          if (isSubscribed && hydrated) setActiveReferenceSession(hydrated);
        })
        .catch((err) => console.warn('[SYNC-HYDRATE-ERROR]', err));
    } else {
      setActiveReferenceSession(initialReferenceSession);
    }
    return () => {
      isSubscribed = false;
    };
  }, [reference, initialReferenceSession]);

  const refFrames: MotionFrame[] = activeReferenceSession?.frames || [];
  const attFrames: MotionFrame[] = attemptSession?.frames || [];

  const maxDurationMs = Math.max(
    refFrames[refFrames.length - 1]?.timestamp_ms || 1000,
    attFrames[attFrames.length - 1]?.timestamp_ms || 1000
  );

  // Compute current interpolated frames based on normalized progress
  const getFrameAtProgress = (frames: MotionFrame[]) => {
    if (frames.length === 0) return null;
    const targetIdx = Math.min(
      frames.length - 1,
      Math.floor(normalizedProgress * frames.length)
    );
    return frames[targetIdx] || null;
  };

  const refCurrentFrame = getFrameAtProgress(refFrames);
  const attCurrentFrame = getFrameAtProgress(attFrames);

  useEffect(() => {
    if (!isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    let lastTime = performance.now();
    const durationSec = maxDurationMs / 1000;

    const tick = (now: number) => {
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      setNormalizedProgress((prev) => {
        const next = prev + (deltaSec * playbackSpeed) / durationSec;
        if (next >= 1.0) {
          return 0; // loop playback
        }
        return next;
      });

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, maxDurationMs, playbackSpeed]);

  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl flex flex-col">
      {/* Viewport Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
          <span className="font-bold text-slate-100 text-sm tracking-wide">3D SYNCHRONIZED COMPARISON</span>
        </div>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2.5 py-0.5 rounded">
          TEMPORAL ALIGNMENT ACTIVE
        </span>
      </div>

      {/* Side-by-Side Avatar Viewports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-950">
        {/* Left: Reference Avatar */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-medium text-amber-400 bg-amber-950/40 border border-amber-900/60 px-3 py-1.5 rounded">
            <span>REFERENCE MODEL ({activeReferenceSession?.technique_id || 'Cross'})</span>
            <span>PLATFORM REF</span>
          </div>
          <AthleteAvatarViewport
            currentFrame={refCurrentFrame}
            bodyProfile={referenceBodyProfile}
            height="360px"
          />
        </div>

        {/* Right: Athlete Attempt Avatar */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-medium text-cyan-400 bg-cyan-950/40 border border-cyan-900/60 px-3 py-1.5 rounded">
            <span>ATHLETE ATTEMPT ({attemptSession?.technique_id || 'Live Attempt'})</span>
            <span>PERSONALIZED AVATAR</span>
          </div>
          <AthleteAvatarViewport
            currentFrame={attCurrentFrame}
            bodyProfile={athleteBodyProfile}
            height="360px"
          />
        </div>
      </div>

      {/* Synchronized Timeline & Controls */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono w-14">
            {(normalizedProgress * 100).toFixed(0)}%
          </span>
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(normalizedProgress * 1000)}
            onChange={(e) => {
              setIsPlaying(false);
              setNormalizedProgress(parseInt(e.target.value, 10) / 1000);
            }}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <span className="text-xs text-slate-400 font-mono w-16 text-right">
            {((normalizedProgress * maxDurationMs) / 1000).toFixed(2)}s
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-5 py-1.5 rounded text-xs font-bold tracking-wider transition ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              {isPlaying ? 'PAUSE SYNCHRONIZED' : 'PLAY SYNCHRONIZED'}
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setNormalizedProgress(0);
              }}
              className="px-3.5 py-1.5 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              RESET
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium mr-1">Speed:</span>
            {[0.25, 0.5, 1.0, 1.5].map((spd) => (
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
