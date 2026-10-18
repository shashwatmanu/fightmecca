import { Landmark, MotionFrame } from '@/types/motion';
import { MEDIAPIPE_LANDMARKS } from './mediapipe-adapter';
import { midpoint3D, distance3D, Vector3D } from './geometry';

/**
 * Normalized Coordinate System Documentation:
 * 
 * 1. Origin (0.0, 0.0, 0.0): Centered at the athlete's pelvis/hip midpoint 
 *    (midpoint between LEFT_HIP landmark 23 and RIGHT_HIP landmark 24).
 * 
 * 2. Translation Normalization:
 *    P_trans = P_raw - P_pelvis_midpoint
 *    Removes dependency on where the athlete is standing in the camera frame.
 * 
 * 3. Scale Normalization:
 *    Reference Scale (S) = distance3D(shoulder_midpoint, hip_midpoint) [Torso length].
 *    P_norm = P_trans / S
 *    Expresses all spatial dimensions in body torso units (1.0 = 1 full torso length).
 *    Removes dependency on camera distance and athlete size.
 * 
 * 4. Coordinate Axis Semantics:
 *    - x_norm: Horizontal axis in torso units (Negative = Left, Positive = Right).
 *    - y_norm: Vertical axis in torso units (Negative = Above pelvis towards head, Positive = Below pelvis).
 *    - z_norm: Relative depth axis in torso units (Negative = In front of torso, Positive = Behind).
 */

export interface NormalizedLandmark extends Landmark {
  raw_x: number;
  raw_y: number;
  raw_z: number;
}

export interface NormalizedMotionFrame extends MotionFrame {
  normalized_landmarks: NormalizedLandmark[];
  scale_factor: number;
  origin_offset: Vector3D;
}

/**
 * Normalizes landmarks in a single frame using pelvis origin translation & torso length scaling.
 */
export function normalizeMotionFrame(frame: MotionFrame): NormalizedMotionFrame {
  const landmarks = frame.landmarks || [];
  if (landmarks.length === 0) {
    return {
      ...frame,
      normalized_landmarks: [],
      scale_factor: 1.0,
      origin_offset: { x: 0, y: 0, z: 0 },
    };
  }

  const lmMap = new Map(landmarks.map((l) => [l.landmark_id, l]));

  const leftHip = lmMap.get(MEDIAPIPE_LANDMARKS.LEFT_HIP);
  const rightHip = lmMap.get(MEDIAPIPE_LANDMARKS.RIGHT_HIP);
  const leftShoulder = lmMap.get(MEDIAPIPE_LANDMARKS.LEFT_SHOULDER);
  const rightShoulder = lmMap.get(MEDIAPIPE_LANDMARKS.RIGHT_SHOULDER);

  // Default origin fallback if hips missing
  let origin: Vector3D = { x: 0.5, y: 0.5, z: 0.0 };
  if (leftHip && rightHip) {
    origin = midpoint3D(leftHip, rightHip);
  }

  // Calculate reference scale factor (Torso length)
  let scale = 1.0;
  if (leftHip && rightHip && leftShoulder && rightShoulder) {
    const hipMid = midpoint3D(leftHip, rightHip);
    const shoulderMid = midpoint3D(leftShoulder, rightShoulder);
    const torsoLength = distance3D(shoulderMid, hipMid);
    if (torsoLength > 0.02) {
      scale = torsoLength;
    }
  }

  const normalizedLandmarks: NormalizedLandmark[] = landmarks.map((lm) => ({
    landmark_id: lm.landmark_id,
    x: Number(((lm.x - origin.x) / scale).toFixed(5)),
    y: Number(((lm.y - origin.y) / scale).toFixed(5)),
    z: Number(((lm.z - origin.z) / scale).toFixed(5)),
    confidence: lm.confidence,
    raw_x: lm.x,
    raw_y: lm.y,
    raw_z: lm.z,
  }));

  return {
    ...frame,
    normalized_landmarks: normalizedLandmarks,
    scale_factor: Number(scale.toFixed(5)),
    origin_offset: {
      x: Number(origin.x.toFixed(5)),
      y: Number(origin.y.toFixed(5)),
      z: Number(origin.z.toFixed(5)),
    },
  };
}

/**
 * Normalizes an entire MotionFrame sequence.
 */
export function normalizeMotionSequence(frames: MotionFrame[]): NormalizedMotionFrame[] {
  return (frames || []).map(normalizeMotionFrame);
}
