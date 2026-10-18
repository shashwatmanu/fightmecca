import { Landmark, MotionFrame, MotionSession, CaptureMode } from '@/types/motion';
import { calculateFrameConfidence } from './quality';

export interface MotionSessionConfig {
  athleteId: string;
  techniqueId: string | null;
  captureMode?: CaptureMode;
  poseModelVersion?: string;
}

/**
 * Construct a canonical MotionFrame from landmarks and relative timestamp.
 */
export function createMotionFrame(
  frameIndex: number,
  timestampMs: number,
  landmarks: Landmark[]
): MotionFrame {
  const frameConfidence = calculateFrameConfidence(landmarks);

  return {
    timestamp_ms: Number(timestampMs.toFixed(2)),
    frame_index: frameIndex,
    landmarks,
    frame_confidence: frameConfidence,
  };
}

/**
 * Construct a canonical MotionSession from a sequence of recorded MotionFrames.
 */
export function buildMotionSession(
  config: MotionSessionConfig,
  frames: MotionFrame[],
  startedAtIso: string,
  completedAtIso: string,
  sessionId = crypto.randomUUID()
): MotionSession {
  return {
    session_id: sessionId,
    athlete_id: config.athleteId,
    technique_id: config.techniqueId,
    capture_mode: config.captureMode || CaptureMode.SINGLE,
    started_at: startedAtIso,
    completed_at: completedAtIso,
    calibration_id: null,
    anthropometric_profile_id: null,
    pose_model_version: config.poseModelVersion || 'mediapipe-tasks-vision-v0.10.14',
    analysis_model_version: null,
    frames,
  };
}
