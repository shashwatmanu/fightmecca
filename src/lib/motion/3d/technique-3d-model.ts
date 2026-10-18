export interface JointRotation3D {
  x: number; // Pitch in radians
  y: number; // Yaw in radians
  z: number; // Roll in radians
}

export interface TechniquePose {
  head: JointRotation3D;
  torso: JointRotation3D;
  hips: JointRotation3D;
  shoulder_left: JointRotation3D;
  elbow_left: JointRotation3D;
  wrist_left: JointRotation3D;
  shoulder_right: JointRotation3D;
  elbow_right: JointRotation3D;
  wrist_right: JointRotation3D;
  hip_left: JointRotation3D;
  knee_left: JointRotation3D;
  hip_right: JointRotation3D;
  knee_right: JointRotation3D;
  position_offset: { x: number; y: number; z: number };
}

export interface TechniqueKeyframe {
  time_norm: number; // [0.0, 1.0]
  label: string;
  pose: TechniquePose;
}

export interface KeyPositionMarker {
  label: string;
  time_norm: number;
  description: string;
}

export interface Technique3DDefinition {
  technique_id: string;
  name: string;
  discipline: string;
  stance_assumption: string;
  description: string;
  cues: string[];
  key_positions: KeyPositionMarker[];
  keyframes: TechniqueKeyframe[];
}

export type AvatarPreset = 'MANNEQUIN_NEUTRAL' | 'GENERIC_MALE' | 'GENERIC_FEMALE';

// Helper for lerping rotations
function lerpRot(a: JointRotation3D, b: JointRotation3D, t: number): JointRotation3D {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

/**
 * Interpolates between keyframes to compute precise pose at normalized time t in [0.0, 1.0].
 */
export function interpolateTechniquePose(keyframes: TechniqueKeyframe[], timeNorm: number): TechniquePose {
  const t = Math.max(0.0, Math.min(1.0, timeNorm));
  if (keyframes.length === 0) {
    throw new Error('Keyframes array cannot be empty');
  }

  if (keyframes.length === 1) return keyframes[0].pose;

  let idx = 0;
  while (idx < keyframes.length - 1 && keyframes[idx + 1].time_norm < t) {
    idx++;
  }

  if (idx >= keyframes.length - 1) {
    return keyframes[keyframes.length - 1].pose;
  }

  const k1 = keyframes[idx];
  const k2 = keyframes[idx + 1];
  const dt = k2.time_norm - k1.time_norm;
  const frac = dt > 0 ? (t - k1.time_norm) / dt : 0;

  const p1 = k1.pose;
  const p2 = k2.pose;

  return {
    head: lerpRot(p1.head, p2.head, frac),
    torso: lerpRot(p1.torso, p2.torso, frac),
    hips: lerpRot(p1.hips, p2.hips, frac),
    shoulder_left: lerpRot(p1.shoulder_left, p2.shoulder_left, frac),
    elbow_left: lerpRot(p1.elbow_left, p2.elbow_left, frac),
    wrist_left: lerpRot(p1.wrist_left, p2.wrist_left, frac),
    shoulder_right: lerpRot(p1.shoulder_right, p2.shoulder_right, frac),
    elbow_right: lerpRot(p1.elbow_right, p2.elbow_right, frac),
    wrist_right: lerpRot(p1.wrist_right, p2.wrist_right, frac),
    hip_left: lerpRot(p1.hip_left, p2.hip_left, frac),
    knee_left: lerpRot(p1.knee_left, p2.knee_left, frac),
    hip_right: lerpRot(p1.hip_right, p2.hip_right, frac),
    knee_right: lerpRot(p1.knee_right, p2.knee_right, frac),
    position_offset: {
      x: p1.position_offset.x + (p2.position_offset.x - p1.position_offset.x) * frac,
      y: p1.position_offset.y + (p2.position_offset.y - p1.position_offset.y) * frac,
      z: p1.position_offset.z + (p2.position_offset.z - p1.position_offset.z) * frac,
    },
  };
}

const defaultZeroRot: JointRotation3D = { x: 0, y: 0, z: 0 };

// Canonical 3D Keyframe Definition for Boxing Cross Technique
export const CROSS_3D_DEFINITION: Technique3DDefinition = {
  technique_id: '11111111-1111-1111-1111-111111111111',
  name: 'Cross',
  discipline: 'Boxing',
  stance_assumption: 'Orthodox (Left Foot Forward, Right Hand Rear)',
  description: 'A powerful straight rear-hand strike driven by heel rotation, hip turn, and full arm extension.',
  cues: [
    'Pivot rear foot on ball of foot and rotate hips forward.',
    'Extend right hand straight towards target line.',
    'Keep left hand high guarding chin and cheek.',
    'Retract right hand quickly along same path back to guard.',
  ],
  key_positions: [
    { label: 'Guard / Start', time_norm: 0.0, description: 'High guard stance, knees slightly bent, weight balanced.' },
    { label: 'Initiation', time_norm: 0.2, description: 'Rear heel lifts, right hip begins rotating forward.' },
    { label: 'Full Extension', time_norm: 0.65, description: 'Right arm fully extended, rear shoulder forward, chin tucked.' },
    { label: 'Recovery / Return', time_norm: 1.0, description: 'Hand snaps back to guard position.' },
  ],
  keyframes: [
    // 1. Guard / Start (t = 0.0)
    {
      time_norm: 0.0,
      label: 'Guard / Start',
      pose: {
        head: { x: 0, y: -0.2, z: 0 },
        torso: { x: 0.1, y: -0.3, z: 0 },
        hips: { x: 0, y: -0.3, z: 0 },
        shoulder_left: { x: 0.8, y: 0.2, z: 0.3 },
        elbow_left: { x: 1.6, y: 0, z: 0 },
        wrist_left: defaultZeroRot,
        shoulder_right: { x: 0.8, y: -0.2, z: -0.3 },
        elbow_right: { x: 1.7, y: 0, z: 0 },
        wrist_right: defaultZeroRot,
        hip_left: { x: 0.2, y: 0, z: 0 },
        knee_left: { x: 0.3, y: 0, z: 0 },
        hip_right: { x: 0.2, y: 0, z: 0 },
        knee_right: { x: 0.3, y: 0, z: 0 },
        position_offset: { x: 0, y: 0, z: 0 },
      },
    },
    // 2. Initiation (t = 0.2)
    {
      time_norm: 0.2,
      label: 'Initiation',
      pose: {
        head: { x: 0, y: -0.1, z: 0 },
        torso: { x: 0.1, y: -0.15, z: 0 },
        hips: { x: 0, y: -0.15, z: 0 },
        shoulder_left: { x: 0.85, y: 0.2, z: 0.3 },
        elbow_left: { x: 1.65, y: 0, z: 0 },
        wrist_left: defaultZeroRot,
        shoulder_right: { x: 1.1, y: -0.1, z: -0.2 },
        elbow_right: { x: 1.3, y: 0, z: 0 },
        wrist_right: defaultZeroRot,
        hip_left: { x: 0.2, y: 0, z: 0 },
        knee_left: { x: 0.35, y: 0, z: 0 },
        hip_right: { x: 0.3, y: 0.3, z: 0 }, // Rear foot pivoting
        knee_right: { x: 0.4, y: 0, z: 0 },
        position_offset: { x: 0.05, y: 0, z: 0.05 },
      },
    },
    // 3. Hip & Torso Rotation (t = 0.45)
    {
      time_norm: 0.45,
      label: 'Hip Rotation',
      pose: {
        head: { x: 0, y: 0, z: 0 },
        torso: { x: 0.1, y: 0.2, z: 0 },
        hips: { x: 0, y: 0.2, z: 0 },
        shoulder_left: { x: 0.9, y: 0.3, z: 0.3 },
        elbow_left: { x: 1.7, y: 0, z: 0 },
        wrist_left: defaultZeroRot,
        shoulder_right: { x: 1.4, y: 0.2, z: 0 },
        elbow_right: { x: 0.6, y: 0, z: 0 },
        wrist_right: defaultZeroRot,
        hip_left: { x: 0.2, y: 0, z: 0 },
        knee_left: { x: 0.4, y: 0, z: 0 },
        hip_right: { x: 0.4, y: 0.5, z: 0 },
        knee_right: { x: 0.5, y: 0, z: 0 },
        position_offset: { x: 0.1, y: 0, z: 0.1 },
      },
    },
    // 4. Full Extension (t = 0.65)
    {
      time_norm: 0.65,
      label: 'Full Extension',
      pose: {
        head: { x: 0.1, y: 0, z: 0 },
        torso: { x: 0.15, y: 0.45, z: 0 },
        hips: { x: 0.05, y: 0.4, z: 0 },
        shoulder_left: { x: 0.95, y: 0.4, z: 0.35 },
        elbow_left: { x: 1.75, y: 0, z: 0 },
        wrist_left: defaultZeroRot,
        shoulder_right: { x: 1.55, y: 0.45, z: 0.1 },
        elbow_right: { x: 0.05, y: 0, z: 0 }, // Fully extended arm
        wrist_right: { x: 0, y: 0, z: -1.57 }, // Pronated fist
        hip_left: { x: 0.2, y: 0, z: 0 },
        knee_left: { x: 0.4, y: 0, z: 0 },
        hip_right: { x: 0.45, y: 0.6, z: 0 },
        knee_right: { x: 0.5, y: 0, z: 0 },
        position_offset: { x: 0.15, y: 0, z: 0.15 },
      },
    },
    // 5. Recovery (t = 0.85)
    {
      time_norm: 0.85,
      label: 'Recovery',
      pose: {
        head: { x: 0, y: -0.1, z: 0 },
        torso: { x: 0.1, y: 0.0, z: 0 },
        hips: { x: 0, y: 0.0, z: 0 },
        shoulder_left: { x: 0.85, y: 0.2, z: 0.3 },
        elbow_left: { x: 1.65, y: 0, z: 0 },
        wrist_left: defaultZeroRot,
        shoulder_right: { x: 1.1, y: -0.1, z: -0.2 },
        elbow_right: { x: 1.2, y: 0, z: 0 },
        wrist_right: defaultZeroRot,
        hip_left: { x: 0.2, y: 0, z: 0 },
        knee_left: { x: 0.35, y: 0, z: 0 },
        hip_right: { x: 0.3, y: 0.2, z: 0 },
        knee_right: { x: 0.4, y: 0, z: 0 },
        position_offset: { x: 0.05, y: 0, z: 0.05 },
      },
    },
    // 6. Guard Return (t = 1.0)
    {
      time_norm: 1.0,
      label: 'Guard Return',
      pose: {
        head: { x: 0, y: -0.2, z: 0 },
        torso: { x: 0.1, y: -0.3, z: 0 },
        hips: { x: 0, y: -0.3, z: 0 },
        shoulder_left: { x: 0.8, y: 0.2, z: 0.3 },
        elbow_left: { x: 1.6, y: 0, z: 0 },
        wrist_left: defaultZeroRot,
        shoulder_right: { x: 0.8, y: -0.2, z: -0.3 },
        elbow_right: { x: 1.7, y: 0, z: 0 },
        wrist_right: defaultZeroRot,
        hip_left: { x: 0.2, y: 0, z: 0 },
        knee_left: { x: 0.3, y: 0, z: 0 },
        hip_right: { x: 0.2, y: 0, z: 0 },
        knee_right: { x: 0.3, y: 0, z: 0 },
        position_offset: { x: 0, y: 0, z: 0 },
      },
    },
  ],
};
