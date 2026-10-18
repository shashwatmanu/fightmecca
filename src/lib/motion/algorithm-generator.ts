/**
 * Fight Mecca Algorithm-Generated Synthetic Motion Generator
 * Generates a canonical-compatible MotionSession for a Cross punch.
 */

import { MotionFrame, MotionSession } from './session-storage';
import { createUniversalSourceMetadata, MotionSourceType } from './universal-source';
import { CaptureMode } from '@/types/motion';

export function generateSyntheticCrossSession(numFrames: number = 60, fps: number = 30): MotionSession {
  const frames: MotionFrame[] = [];
  const frameDurationMs = 1000 / fps;

  // Base neutral 33 MediaPipe landmarks (T-Pose / Guard Stance baseline)
  const baseLandmarks = Array.from({ length: 33 }, (_, i) => ({
    x: 0.5,
    y: 0.5,
    z: 0.0,
    visibility: 0.95,
  }));

  // Assign rough anatomical reference positions
  // Nose (0)
  baseLandmarks[0] = { x: 0.5, y: 0.2, z: 0.0, visibility: 0.99 };
  // Left/Right Shoulders (11, 12)
  baseLandmarks[11] = { x: 0.4, y: 0.35, z: 0.0, visibility: 0.98 };
  baseLandmarks[12] = { x: 0.6, y: 0.35, z: 0.0, visibility: 0.98 };
  // Left/Right Elbows (13, 14)
  baseLandmarks[13] = { x: 0.38, y: 0.5, z: 0.05, visibility: 0.98 };
  baseLandmarks[14] = { x: 0.62, y: 0.5, z: 0.05, visibility: 0.98 };
  // Left/Right Wrists (15, 16)
  baseLandmarks[15] = { x: 0.42, y: 0.32, z: 0.1, visibility: 0.98 };
  baseLandmarks[16] = { x: 0.58, y: 0.32, z: 0.1, visibility: 0.98 };
  // Left/Right Hips (23, 24)
  baseLandmarks[23] = { x: 0.43, y: 0.65, z: 0.0, visibility: 0.98 };
  baseLandmarks[24] = { x: 0.57, y: 0.65, z: 0.0, visibility: 0.98 };
  // Left/Right Knees (25, 26)
  baseLandmarks[25] = { x: 0.42, y: 0.8, z: 0.05, visibility: 0.95 };
  baseLandmarks[26] = { x: 0.58, y: 0.8, z: -0.05, visibility: 0.95 };
  // Left/Right Ankles (27, 28)
  baseLandmarks[27] = { x: 0.42, y: 0.95, z: 0.1, visibility: 0.95 };
  baseLandmarks[28] = { x: 0.58, y: 0.95, z: -0.1, visibility: 0.95 };

  for (let i = 0; i < numFrames; i++) {
    const timestampMs = Math.round(i * frameDurationMs);
    const progress = i / (numFrames - 1); // 0.0 to 1.0

    // Cross trajectory curve:
    // Phase 1 (0 to 0.2): Guard setup
    // Phase 2 (0.2 to 0.5): Extension (Right hand extends forward, hip rotates)
    // Phase 3 (0.5 to 0.6): Peak extension
    // Phase 4 (0.6 to 1.0): Recovery back to guard
    let extensionFactor = 0;
    if (progress >= 0.2 && progress < 0.5) {
      extensionFactor = (progress - 0.2) / 0.3; // 0 -> 1
    } else if (progress >= 0.5 && progress <= 0.6) {
      extensionFactor = 1.0;
    } else if (progress > 0.6) {
      extensionFactor = 1.0 - (progress - 0.6) / 0.4; // 1 -> 0
    }

    // Smooth sinusoidal motion curve
    const smoothExt = Math.sin(extensionFactor * (Math.PI / 2));

    // Clone base landmarks and apply right punch extension
    const frameLandmarks = baseLandmarks.map((lm) => ({ ...lm }));

    // Right wrist (16) extends straight out towards camera (-Z) and slightly left
    frameLandmarks[16].x = 0.58 - 0.12 * smoothExt;
    frameLandmarks[16].y = 0.32 - 0.05 * smoothExt;
    frameLandmarks[16].z = 0.1 - 0.45 * smoothExt;

    // Right elbow (14) aligns with punch
    frameLandmarks[14].x = 0.62 - 0.08 * smoothExt;
    frameLandmarks[14].y = 0.42 - 0.08 * smoothExt;
    frameLandmarks[14].z = 0.05 - 0.22 * smoothExt;

    // Right shoulder (12) rotates forward
    frameLandmarks[12].z = -0.1 * smoothExt;
    // Left shoulder (11) pulls back slightly
    frameLandmarks[11].z = 0.05 * smoothExt;

    // Right hip (24) rotates
    frameLandmarks[24].z = -0.06 * smoothExt;

    const frame: MotionFrame = {
      frame_index: i,
      timestamp_ms: timestampMs,
      landmarks: frameLandmarks as any,
      frame_confidence: 0.98,
    };

    frames.push(frame);
  }

  const session: MotionSession = {
    session_id: `synthetic_cross_${Date.now()}`,
    athlete_id: 'default_athlete',
    technique_id: 'Cross',
    capture_mode: CaptureMode.SINGLE,
    started_at: new Date().toISOString(),
    completed_at: new Date(Date.now() + numFrames * frameDurationMs).toISOString(),
    calibration_id: null,
    anthropometric_profile_id: null,
    pose_model_version: 'synthetic_generator_v1',
    analysis_model_version: null,
    frames,
  };

  (session as any).metadata = createUniversalSourceMetadata(MotionSourceType.ALGORITHM_GENERATED, {
    durationSeconds: numFrames / fps,
    fps,
    filename: 'synthetic_cross.json',
  });

  return session;
}
