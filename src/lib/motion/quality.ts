import { Landmark, MotionFrame } from '@/types/motion';
import { MEDIAPIPE_LANDMARKS } from './mediapipe-adapter';

// Default major landmarks required for full-body visibility check
export const DEFAULT_REQUIRED_BODY_LANDMARKS = [
  MEDIAPIPE_LANDMARKS.LEFT_SHOULDER,
  MEDIAPIPE_LANDMARKS.RIGHT_SHOULDER,
  MEDIAPIPE_LANDMARKS.LEFT_HIP,
  MEDIAPIPE_LANDMARKS.RIGHT_HIP,
  MEDIAPIPE_LANDMARKS.LEFT_KNEE,
  MEDIAPIPE_LANDMARKS.RIGHT_KNEE,
  MEDIAPIPE_LANDMARKS.LEFT_ANKLE,
  MEDIAPIPE_LANDMARKS.RIGHT_ANKLE,
];

export interface CaptureQualityMetrics {
  personDetected: boolean;
  fullBodyVisible: boolean;
  landmarkConfidence: number; // 0.0 to 1.0
  fps: number;
  recordedFrameCount: number;
  usableFrameCount: number;
}

/**
 * Evaluates whether key body landmarks are sufficiently visible in the detected pose.
 */
export function checkFullBodyVisibility(
  landmarks: Landmark[],
  requiredLandmarkIds: number[] = DEFAULT_REQUIRED_BODY_LANDMARKS,
  minConfidenceThreshold = 0.4
): boolean {
  if (!landmarks || landmarks.length === 0) return false;
  
  const landmarkMap = new Map(landmarks.map((lm) => [lm.landmark_id, lm]));
  
  for (const reqId of requiredLandmarkIds) {
    const lm = landmarkMap.get(reqId);
    if (!lm || lm.confidence < minConfidenceThreshold) {
      return false;
    }
  }
  return true;
}

/**
 * Calculates aggregate mean confidence for a frame's landmarks.
 */
export function calculateFrameConfidence(landmarks: Landmark[]): number {
  if (!landmarks || landmarks.length === 0) return 0;
  const sum = landmarks.reduce((acc, lm) => acc + lm.confidence, 0);
  return Number((sum / landmarks.length).toFixed(4));
}

/**
 * Calculates aggregate capture statistics for a collection of recorded MotionFrames.
 */
export function calculateSessionCaptureStats(frames: MotionFrame[]) {
  if (!frames || frames.length === 0) {
    return {
      totalFrames: 0,
      usableFrames: 0,
      avgConfidence: 0,
      fullBodyVisibilityPercentage: 0,
      durationMs: 0,
    };
  }

  const totalFrames = frames.length;
  let usableFrames = 0;
  let fullBodyCount = 0;
  let totalConfidence = 0;

  for (const frame of frames) {
    if (frame.landmarks && frame.landmarks.length > 0) {
      usableFrames++;
      totalConfidence += frame.frame_confidence;
      if (checkFullBodyVisibility(frame.landmarks)) {
        fullBodyCount++;
      }
    }
  }

  const firstTimestamp = frames[0].timestamp_ms;
  const lastTimestamp = frames[frames.length - 1].timestamp_ms;
  const durationMs = Math.max(0, lastTimestamp - firstTimestamp);

  return {
    totalFrames,
    usableFrames,
    avgConfidence: usableFrames > 0 ? Number((totalConfidence / usableFrames).toFixed(4)) : 0,
    fullBodyVisibilityPercentage: usableFrames > 0 ? Number(((fullBodyCount / usableFrames) * 100).toFixed(1)) : 0,
    durationMs: Number(durationMs.toFixed(0)),
  };
}

/**
 * Calculates stable FPS from processed frame count over elapsed wall-clock milliseconds.
 * Safe against Infinity, NaN, and microsecond division artifacts.
 */
export function calculateFpsFromWindow(processedFrameCount: number, elapsedMs: number): number {
  if (!elapsedMs || elapsedMs <= 50 || processedFrameCount <= 0) {
    return 0.0;
  }
  const elapsedSeconds = elapsedMs / 1000;
  return Number((processedFrameCount / elapsedSeconds).toFixed(1));
}
