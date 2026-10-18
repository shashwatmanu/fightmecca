/**
 * Fight Mecca Motion AI Engine Interface
 * 
 * This module defines the architecture contracts for plugging in Google MediaPipe
 * or TensorFlow.js Pose landmark detection without altering database or UI schemas.
 */

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface MotionMetrics {
  repCount: number;
  currentPhase: 'eccentric' | 'concentric' | 'lockout' | 'idle';
  postureScore: number; // 0 - 100
  hipRotationDegrees: number;
  kneeAlignmentDegrees: number;
  stabilityIndex: number; // 0 - 100
  feedbackAlerts: string[];
}

export interface TechniqueProfile {
  techniqueId: string;
  name: string;
  discipline: 'bjj' | 'muay_thai' | 'boxing' | 'wrestling';
  expectedKeypoints: string[];
  minDurationPerRepSeconds: number;
  maxDurationPerRepSeconds: number;
  postureThreshold: number;
}

export const SUPPORTED_TECHNIQUES: Record<string, TechniqueProfile> = {
  'bjj_hook_clearance_v1': {
    techniqueId: 'bjj_hook_clearance_v1',
    name: 'Butterfly Hook Clearance & Centerline Base',
    discipline: 'bjj',
    expectedKeypoints: ['left_hip', 'right_hip', 'left_knee', 'right_knee', 'neck'],
    minDurationPerRepSeconds: 1.2,
    maxDurationPerRepSeconds: 3.5,
    postureThreshold: 80,
  },
  'striking_muay_thai_lowkick': {
    techniqueId: 'striking_muay_thai_lowkick',
    name: 'Rear Roundhouse Low Kick & 90° Torque',
    discipline: 'muay_thai',
    expectedKeypoints: ['right_ankle', 'right_hip', 'left_shoulder', 'right_shoulder'],
    minDurationPerRepSeconds: 0.8,
    maxDurationPerRepSeconds: 2.0,
    postureThreshold: 85,
  },
  'bjj_hq_base_stabilize': {
    techniqueId: 'bjj_hq_base_stabilize',
    name: 'Headquarters Base Balance Stabilization',
    discipline: 'bjj',
    expectedKeypoints: ['left_ankle', 'right_ankle', 'torso_center', 'head'],
    minDurationPerRepSeconds: 5.0,
    maxDurationPerRepSeconds: 45.0,
    postureThreshold: 78,
  },
};

/**
 * Mock simulator generator to provide real-time pose metrics in the preview
 * while hardware MediaPipe camera loads or in browsers without webcam permissions.
 */
export function simulatePoseFrame(repsTarget: number, currentReps: number): MotionMetrics {
  const isMoving = Math.random() > 0.3;
  const postureBase = 84 + Math.sin(Date.now() / 600) * 8;
  const hipAngle = 88 + Math.cos(Date.now() / 400) * 12;

  const alerts: string[] = [];
  if (hipAngle < 82) alerts.push('Keep hips square and engaged');
  if (postureBase < 80) alerts.push('Elevate chin slightly; avoid rounding upper back');

  return {
    repCount: currentReps,
    currentPhase: isMoving ? (Math.random() > 0.5 ? 'concentric' : 'eccentric') : 'lockout',
    postureScore: Math.round(Math.min(100, Math.max(60, postureBase))),
    hipRotationDegrees: Math.round(hipAngle),
    kneeAlignmentDegrees: Math.round(112 + Math.random() * 6),
    stabilityIndex: Math.round(88 + Math.random() * 8),
    feedbackAlerts: alerts.length > 0 ? alerts : ['Form is crisp! Hold tension throughout the transition.'],
  };
}
