import { MotionParameterResult } from './parameters';
import { NormalizedMotionFrame } from './normalization';

export type KeyMomentType =
  | 'MOTION_START'
  | 'PEAK_WRIST_VELOCITY'
  | 'MAXIMUM_EXTENSION'
  | 'PEAK_PELVIS_MOVEMENT'
  | 'RECOVERY';

export interface KeyMomentEvent {
  event_type: KeyMomentType;
  label: string;
  frame_index: number;
  timestamp_ms: number;
  confidence: number;
  description: string;
}

/**
 * Extracts generic key motion moments from normalized frames and extracted parameter time-series.
 */
export function extractKeyMoments(
  normFrames: NormalizedMotionFrame[],
  parameterResults: MotionParameterResult[]
): KeyMomentEvent[] {
  const moments: KeyMomentEvent[] = [];
  if (normFrames.length === 0 || parameterResults.length === 0) return moments;

  // Filter right wrist velocities (or left if right unavailable)
  const wristVelocities = parameterResults.filter(
    (p) => p.parameter_id === 'wrist_right_velocity' && p.observable && p.value !== null
  );

  // 1. Motion Onset / Start
  const startParam = wristVelocities.find((p) => (p.value || 0) > 0.4);
  if (startParam) {
    moments.push({
      event_type: 'MOTION_START',
      label: 'Motion Onset',
      frame_index: startParam.frame_index,
      timestamp_ms: startParam.timestamp_ms,
      confidence: startParam.confidence,
      description: `Movement onset detected as wrist velocity exceeded noise threshold (>${startParam.value} torso_units/s).`,
    });
  }

  // 2. Peak Wrist Velocity
  let maxVelParam: MotionParameterResult | null = null;
  for (const p of wristVelocities) {
    if (!maxVelParam || (p.value || 0) > (maxVelParam.value || 0)) {
      maxVelParam = p;
    }
  }

  if (maxVelParam && (maxVelParam.value || 0) > 0.2) {
    moments.push({
      event_type: 'PEAK_WRIST_VELOCITY',
      label: 'Peak Wrist Velocity',
      frame_index: maxVelParam.frame_index,
      timestamp_ms: maxVelParam.timestamp_ms,
      confidence: maxVelParam.confidence,
      description: `Peak wrist velocity achieved at ${maxVelParam.value} torso_units/s.`,
    });
  }

  // 3. Maximum Extension Proxy
  const extParams = parameterResults.filter(
    (p) => p.parameter_id === 'wrist_right_to_shoulder_dist' && p.observable && p.value !== null
  );

  let maxExtParam: MotionParameterResult | null = null;
  for (const p of extParams) {
    if (!maxExtParam || (p.value || 0) > (maxExtParam.value || 0)) {
      maxExtParam = p;
    }
  }

  if (maxExtParam) {
    moments.push({
      event_type: 'MAXIMUM_EXTENSION',
      label: 'Maximum Extension Candidate',
      frame_index: maxExtParam.frame_index,
      timestamp_ms: maxExtParam.timestamp_ms,
      confidence: maxExtParam.confidence,
      description: `Maximum wrist-to-shoulder extension reached (${maxExtParam.value} torso_units).`,
    });
  }

  // 4. Recovery / Return Proxy
  if (maxExtParam) {
    const postExtParams = extParams.filter((p) => p.frame_index > maxExtParam!.frame_index);
    const recoveryParam = postExtParams.find((p) => (p.value || 0) < (maxExtParam!.value || 0) * 0.75);
    if (recoveryParam) {
      moments.push({
        event_type: 'RECOVERY',
        label: 'Recovery / Return',
        frame_index: recoveryParam.frame_index,
        timestamp_ms: recoveryParam.timestamp_ms,
        confidence: recoveryParam.confidence,
        description: `Hand returned to guard position after extension peak.`,
      });
    }
  }

  return moments;
}
