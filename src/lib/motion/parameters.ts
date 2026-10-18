import { Landmark, MotionFrame } from '@/types/motion';
import { MEDIAPIPE_LANDMARKS } from './mediapipe-adapter';
import { calculateJointAngle3D, distance3D, distance2D, midpoint3D, Vector3D } from './geometry';
import { normalizeMotionFrame, NormalizedMotionFrame } from './normalization';

export type ParameterCategory =
  | 'JOINT_ANGLE'
  | 'STANCE_BASE'
  | 'UPPER_BODY_GEOMETRY'
  | 'GUARD_HAND_POSITION'
  | 'MOVEMENT_KINEMATICS'
  | 'TEMPORAL_DERIVATIVES';

export type ParameterSourceCapability = 'CAMERA' | 'WEARABLE' | 'MULTI_CAMERA' | 'FUSED';

export interface ParameterDefinition {
  parameter_id: string;
  name: string;
  category: ParameterCategory;
  unit: string;
  required_landmarks: number[];
  source_capability: ParameterSourceCapability;
  calculation_version: string;
  min_confidence_threshold: number;
  description: string;
}

export interface MotionParameterResult {
  parameter_id: string;
  frame_index: number;
  timestamp_ms: number;
  value: number | null;
  unit: string;
  observable: boolean;
  confidence: number;
  source: ParameterSourceCapability;
  algorithm_version: string;
}

// Global Parameter Registry Catalogue
export const PARAMETER_REGISTRY: Record<string, ParameterDefinition> = {
  // JOINT ANGLES
  'joint_angle_left_elbow': {
    parameter_id: 'joint_angle_left_elbow',
    name: 'Left Elbow Angle',
    category: 'JOINT_ANGLE',
    unit: 'deg',
    required_landmarks: [MEDIAPIPE_LANDMARKS.LEFT_SHOULDER, MEDIAPIPE_LANDMARKS.LEFT_ELBOW, MEDIAPIPE_LANDMARKS.LEFT_WRIST],
    source_capability: 'CAMERA',
    calculation_version: 'v1.0.0',
    min_confidence_threshold: 0.4,
    description: 'Angle formed at the left elbow vertex between shoulder and wrist.',
  },
  'joint_angle_right_elbow': {
    parameter_id: 'joint_angle_right_elbow',
    name: 'Right Elbow Angle',
    category: 'JOINT_ANGLE',
    unit: 'deg',
    required_landmarks: [MEDIAPIPE_LANDMARKS.RIGHT_SHOULDER, MEDIAPIPE_LANDMARKS.RIGHT_ELBOW, MEDIAPIPE_LANDMARKS.RIGHT_WRIST],
    source_capability: 'CAMERA',
    calculation_version: 'v1.0.0',
    min_confidence_threshold: 0.4,
    description: 'Angle formed at the right elbow vertex between shoulder and wrist.',
  },
  'joint_angle_left_knee': {
    parameter_id: 'joint_angle_left_knee',
    name: 'Left Knee Angle',
    category: 'JOINT_ANGLE',
    unit: 'deg',
    required_landmarks: [MEDIAPIPE_LANDMARKS.LEFT_HIP, MEDIAPIPE_LANDMARKS.LEFT_KNEE, MEDIAPIPE_LANDMARKS.LEFT_ANKLE],
    source_capability: 'CAMERA',
    calculation_version: 'v1.0.0',
    min_confidence_threshold: 0.4,
    description: 'Angle formed at the left knee vertex between hip and ankle.',
  },
  'joint_angle_right_knee': {
    parameter_id: 'joint_angle_right_knee',
    name: 'Right Knee Angle',
    category: 'JOINT_ANGLE',
    unit: 'deg',
    required_landmarks: [MEDIAPIPE_LANDMARKS.RIGHT_HIP, MEDIAPIPE_LANDMARKS.RIGHT_KNEE, MEDIAPIPE_LANDMARKS.RIGHT_ANKLE],
    source_capability: 'CAMERA',
    calculation_version: 'v1.0.0',
    min_confidence_threshold: 0.4,
    description: 'Angle formed at the right knee vertex between hip and ankle.',
  },
  'joint_angle_left_shoulder': {
    parameter_id: 'joint_angle_left_shoulder',
    name: 'Left Shoulder Angle',
    category: 'JOINT_ANGLE',
    unit: 'deg',
    required_landmarks: [MEDIAPIPE_LANDMARKS.LEFT_HIP, MEDIAPIPE_LANDMARKS.LEFT_SHOULDER, MEDIAPIPE_LANDMARKS.LEFT_ELBOW],
    source_capability: 'CAMERA',
    calculation_version: 'v1.0.0',
    min_confidence_threshold: 0.4,
    description: 'Angle formed at left shoulder between hip and elbow.',
  },
  'joint_angle_right_shoulder': {
    parameter_id: 'joint_angle_right_shoulder',
    name: 'Right Shoulder Angle',
    category: 'JOINT_ANGLE',
    unit: 'deg',
    required_landmarks: [MEDIAPIPE_LANDMARKS.RIGHT_HIP, MEDIAPIPE_LANDMARKS.RIGHT_SHOULDER, MEDIAPIPE_LANDMARKS.RIGHT_ELBOW],
    source_capability: 'CAMERA',
    calculation_version: 'v1.0.0',
    min_confidence_threshold: 0.4,
    description: 'Angle formed at right shoulder between hip and elbow.',
  },

  // STANCE / BASE
  'stance_width_normalized': {
    parameter_id: 'stance_width_normalized',
    name: 'Normalized Stance Width',
    category: 'STANCE_BASE',
    unit: 'torso_units',
    required_landmarks: [MEDIAPIPE_LANDMARKS.LEFT_ANKLE, MEDIAPIPE_LANDMARKS.RIGHT_ANKLE],
    source_capability: 'CAMERA',
    calculation_version: 'v1.0.0',
    min_confidence_threshold: 0.4,
    description: 'Horizontal distance between ankles normalized by torso length.',
  },
  'pelvis_displacement': {
    parameter_id: 'pelvis_displacement',
    name: 'Pelvis Displacement',
    category: 'STANCE_BASE',
    unit: 'torso_units',
    required_landmarks: [MEDIAPIPE_LANDMARKS.LEFT_HIP, MEDIAPIPE_LANDMARKS.RIGHT_HIP],
    source_capability: 'CAMERA',
    calculation_version: 'v1.0.0',
    min_confidence_threshold: 0.4,
    description: 'Distance of pelvis midpoint from reference camera center.',
  },

  // UPPER-BODY GEOMETRY
  'shoulder_rotation_proxy': {
    parameter_id: 'shoulder_rotation_proxy',
    name: 'Shoulder Rotation Proxy',
    category: 'UPPER_BODY_GEOMETRY',
    unit: 'deg',
    required_landmarks: [MEDIAPIPE_LANDMARKS.LEFT_SHOULDER, MEDIAPIPE_LANDMARKS.RIGHT_SHOULDER],
    source_capability: 'CAMERA',
    calculation_version: 'v1.0.0',
    min_confidence_threshold: 0.4,
    description: 'Apparent rotation angle of shoulder line in camera frame.',
  },
  'hip_rotation_proxy': {
    parameter_id: 'hip_rotation_proxy',
    name: 'Hip Rotation Proxy',
    category: 'UPPER_BODY_GEOMETRY',
    unit: 'deg',
    required_landmarks: [MEDIAPIPE_LANDMARKS.LEFT_HIP, MEDIAPIPE_LANDMARKS.RIGHT_HIP],
    source_capability: 'CAMERA',
    calculation_version: 'v1.0.0',
    min_confidence_threshold: 0.4,
    description: 'Apparent rotation angle of hip line in camera frame.',
  },
  'shoulder_hip_twist_delta': {
    parameter_id: 'shoulder_hip_twist_delta',
    name: 'Shoulder-Hip Twist Delta',
    category: 'UPPER_BODY_GEOMETRY',
    unit: 'deg',
    required_landmarks: [MEDIAPIPE_LANDMARKS.LEFT_SHOULDER, MEDIAPIPE_LANDMARKS.RIGHT_SHOULDER, MEDIAPIPE_LANDMARKS.LEFT_HIP, MEDIAPIPE_LANDMARKS.RIGHT_HIP],
    source_capability: 'CAMERA',
    calculation_version: 'v1.0.0',
    min_confidence_threshold: 0.4,
    description: 'Rotational difference between shoulder line angle and hip line angle.',
  },

  // GUARD / HAND POSITION
  'wrist_left_to_shoulder_dist': {
    parameter_id: 'wrist_left_to_shoulder_dist',
    name: 'Left Wrist-to-Shoulder Distance',
    category: 'GUARD_HAND_POSITION',
    unit: 'torso_units',
    required_landmarks: [MEDIAPIPE_LANDMARKS.LEFT_WRIST, MEDIAPIPE_LANDMARKS.LEFT_SHOULDER],
    source_capability: 'CAMERA',
    calculation_version: 'v1.0.0',
    min_confidence_threshold: 0.4,
    description: '3D distance from left wrist to left shoulder in torso units.',
  },
  'wrist_right_to_shoulder_dist': {
    parameter_id: 'wrist_right_to_shoulder_dist',
    name: 'Right Wrist-to-Shoulder Distance',
    category: 'GUARD_HAND_POSITION',
    unit: 'torso_units',
    required_landmarks: [MEDIAPIPE_LANDMARKS.RIGHT_WRIST, MEDIAPIPE_LANDMARKS.RIGHT_SHOULDER],
    source_capability: 'CAMERA',
    calculation_version: 'v1.0.0',
    min_confidence_threshold: 0.4,
    description: '3D distance from right wrist to right shoulder in torso units.',
  },

  // MOVEMENT & KINEMATICS
  'wrist_right_velocity': {
    parameter_id: 'wrist_right_velocity',
    name: 'Right Wrist Velocity',
    category: 'MOVEMENT_KINEMATICS',
    unit: 'torso_units/s',
    required_landmarks: [MEDIAPIPE_LANDMARKS.RIGHT_WRIST],
    source_capability: 'CAMERA',
    calculation_version: 'v1.0.0',
    min_confidence_threshold: 0.4,
    description: 'Frame-to-frame velocity of right wrist in body torso units per second.',
  },
  'wrist_left_velocity': {
    parameter_id: 'wrist_left_velocity',
    name: 'Left Wrist Velocity',
    category: 'MOVEMENT_KINEMATICS',
    unit: 'torso_units/s',
    required_landmarks: [MEDIAPIPE_LANDMARKS.LEFT_WRIST],
    source_capability: 'CAMERA',
    calculation_version: 'v1.0.0',
    min_confidence_threshold: 0.4,
    description: 'Frame-to-frame velocity of left wrist in body torso units per second.',
  },
};

/**
 * Extracts derived parameters for a single normalized MotionFrame.
 */
export function extractFrameParameters(
  normFrame: NormalizedMotionFrame,
  prevNormFrame?: NormalizedMotionFrame
): MotionParameterResult[] {
  const results: MotionParameterResult[] = [];
  const landmarks = normFrame.normalized_landmarks || [];
  const lmMap = new Map(landmarks.map((l) => [l.landmark_id, l]));

  // Helper to compute landmark group confidence
  const getGroupConfidence = (ids: number[], minThreshold: number): { confidence: number; valid: boolean } => {
    let sum = 0;
    for (const id of ids) {
      const lm = lmMap.get(id);
      if (!lm || lm.confidence < minThreshold) {
        return { confidence: lm ? lm.confidence : 0, valid: false };
      }
      sum += lm.confidence;
    }
    return { confidence: sum / ids.length, valid: true };
  };

  for (const def of Object.values(PARAMETER_REGISTRY)) {
    const { confidence: groupConf, valid: isValid } = getGroupConfidence(def.required_landmarks, def.min_confidence_threshold);

    // If required landmarks are missing, invalid, or low confidence, return observable = false, value = null
    if (!isValid || groupConf < def.min_confidence_threshold) {
      results.push({
        parameter_id: def.parameter_id,
        frame_index: normFrame.frame_index,
        timestamp_ms: normFrame.timestamp_ms,
        value: null,
        unit: def.unit,
        observable: false,
        confidence: Number(groupConf.toFixed(2)),
        source: 'CAMERA',
        algorithm_version: def.calculation_version,
      });
      continue;
    }

    let calculatedValue: number | null = null;

    try {
      if (def.parameter_id === 'joint_angle_left_elbow') {
        const p1 = lmMap.get(MEDIAPIPE_LANDMARKS.LEFT_SHOULDER)!;
        const v = lmMap.get(MEDIAPIPE_LANDMARKS.LEFT_ELBOW)!;
        const p3 = lmMap.get(MEDIAPIPE_LANDMARKS.LEFT_WRIST)!;
        calculatedValue = calculateJointAngle3D(p1, v, p3);
      } else if (def.parameter_id === 'joint_angle_right_elbow') {
        const p1 = lmMap.get(MEDIAPIPE_LANDMARKS.RIGHT_SHOULDER)!;
        const v = lmMap.get(MEDIAPIPE_LANDMARKS.RIGHT_ELBOW)!;
        const p3 = lmMap.get(MEDIAPIPE_LANDMARKS.RIGHT_WRIST)!;
        calculatedValue = calculateJointAngle3D(p1, v, p3);
      } else if (def.parameter_id === 'joint_angle_left_knee') {
        const p1 = lmMap.get(MEDIAPIPE_LANDMARKS.LEFT_HIP)!;
        const v = lmMap.get(MEDIAPIPE_LANDMARKS.LEFT_KNEE)!;
        const p3 = lmMap.get(MEDIAPIPE_LANDMARKS.LEFT_ANKLE)!;
        calculatedValue = calculateJointAngle3D(p1, v, p3);
      } else if (def.parameter_id === 'joint_angle_right_knee') {
        const p1 = lmMap.get(MEDIAPIPE_LANDMARKS.RIGHT_HIP)!;
        const v = lmMap.get(MEDIAPIPE_LANDMARKS.RIGHT_KNEE)!;
        const p3 = lmMap.get(MEDIAPIPE_LANDMARKS.RIGHT_ANKLE)!;
        calculatedValue = calculateJointAngle3D(p1, v, p3);
      } else if (def.parameter_id === 'joint_angle_left_shoulder') {
        const p1 = lmMap.get(MEDIAPIPE_LANDMARKS.LEFT_HIP)!;
        const v = lmMap.get(MEDIAPIPE_LANDMARKS.LEFT_SHOULDER)!;
        const p3 = lmMap.get(MEDIAPIPE_LANDMARKS.LEFT_ELBOW)!;
        calculatedValue = calculateJointAngle3D(p1, v, p3);
      } else if (def.parameter_id === 'joint_angle_right_shoulder') {
        const p1 = lmMap.get(MEDIAPIPE_LANDMARKS.RIGHT_HIP)!;
        const v = lmMap.get(MEDIAPIPE_LANDMARKS.RIGHT_SHOULDER)!;
        const p3 = lmMap.get(MEDIAPIPE_LANDMARKS.RIGHT_ELBOW)!;
        calculatedValue = calculateJointAngle3D(p1, v, p3);
      } else if (def.parameter_id === 'stance_width_normalized') {
        const lAnkle = lmMap.get(MEDIAPIPE_LANDMARKS.LEFT_ANKLE)!;
        const rAnkle = lmMap.get(MEDIAPIPE_LANDMARKS.RIGHT_ANKLE)!;
        calculatedValue = Number(distance3D(lAnkle, rAnkle).toFixed(3));
      } else if (def.parameter_id === 'pelvis_displacement') {
        const lHip = lmMap.get(MEDIAPIPE_LANDMARKS.LEFT_HIP)!;
        const rHip = lmMap.get(MEDIAPIPE_LANDMARKS.RIGHT_HIP)!;
        const pelvisMid = midpoint3D(lHip, rHip);
        calculatedValue = Number(distance3D(pelvisMid, { x: 0, y: 0, z: 0 }).toFixed(3));
      } else if (def.parameter_id === 'shoulder_rotation_proxy') {
        const lSh = lmMap.get(MEDIAPIPE_LANDMARKS.LEFT_SHOULDER)!;
        const rSh = lmMap.get(MEDIAPIPE_LANDMARKS.RIGHT_SHOULDER)!;
        const dx = rSh.x - lSh.x;
        const dy = rSh.y - lSh.y;
        calculatedValue = Number(((Math.atan2(dy, dx) * 180) / Math.PI).toFixed(2));
      } else if (def.parameter_id === 'hip_rotation_proxy') {
        const lH = lmMap.get(MEDIAPIPE_LANDMARKS.LEFT_HIP)!;
        const rH = lmMap.get(MEDIAPIPE_LANDMARKS.RIGHT_HIP)!;
        const dx = rH.x - lH.x;
        const dy = rH.y - lH.y;
        calculatedValue = Number(((Math.atan2(dy, dx) * 180) / Math.PI).toFixed(2));
      } else if (def.parameter_id === 'shoulder_hip_twist_delta') {
        const lSh = lmMap.get(MEDIAPIPE_LANDMARKS.LEFT_SHOULDER)!;
        const rSh = lmMap.get(MEDIAPIPE_LANDMARKS.RIGHT_SHOULDER)!;
        const lH = lmMap.get(MEDIAPIPE_LANDMARKS.LEFT_HIP)!;
        const rH = lmMap.get(MEDIAPIPE_LANDMARKS.RIGHT_HIP)!;
        const shDeg = (Math.atan2(rSh.y - lSh.y, rSh.x - lSh.x) * 180) / Math.PI;
        const hDeg = (Math.atan2(rH.y - lH.y, rH.x - lH.x) * 180) / Math.PI;
        calculatedValue = Number(Math.abs(shDeg - hDeg).toFixed(2));
      } else if (def.parameter_id === 'wrist_left_to_shoulder_dist') {
        const w = lmMap.get(MEDIAPIPE_LANDMARKS.LEFT_WRIST)!;
        const s = lmMap.get(MEDIAPIPE_LANDMARKS.LEFT_SHOULDER)!;
        calculatedValue = Number(distance3D(w, s).toFixed(3));
      } else if (def.parameter_id === 'wrist_right_to_shoulder_dist') {
        const w = lmMap.get(MEDIAPIPE_LANDMARKS.RIGHT_WRIST)!;
        const s = lmMap.get(MEDIAPIPE_LANDMARKS.RIGHT_SHOULDER)!;
        calculatedValue = Number(distance3D(w, s).toFixed(3));
      } else if (def.parameter_id === 'wrist_right_velocity' || def.parameter_id === 'wrist_left_velocity') {
        const wristId = def.parameter_id === 'wrist_right_velocity' ? MEDIAPIPE_LANDMARKS.RIGHT_WRIST : MEDIAPIPE_LANDMARKS.LEFT_WRIST;
        const currWrist = lmMap.get(wristId);

        if (prevNormFrame && prevNormFrame.normalized_landmarks && currWrist) {
          const prevMap = new Map(prevNormFrame.normalized_landmarks.map((l) => [l.landmark_id, l]));
          const prevWrist = prevMap.get(wristId);

          if (prevWrist) {
            const dtSec = (normFrame.timestamp_ms - prevNormFrame.timestamp_ms) / 1000;
            if (dtSec > 0.001) {
              const dist = distance3D(currWrist, prevWrist);
              calculatedValue = Number((dist / dtSec).toFixed(3));
            }
          }
        }
        if (calculatedValue === null) calculatedValue = 0.0;
      }
    } catch (e) {
      calculatedValue = null;
    }

    results.push({
      parameter_id: def.parameter_id,
      frame_index: normFrame.frame_index,
      timestamp_ms: normFrame.timestamp_ms,
      value: calculatedValue,
      unit: def.unit,
      observable: calculatedValue !== null,
      confidence: Number(groupConf.toFixed(2)),
      source: 'CAMERA',
      algorithm_version: def.calculation_version,
    });
  }

  return results;
}

/**
 * Extracts derived parameters across an entire normalized frame sequence.
 */
export function extractSequenceParameters(normFrames: NormalizedMotionFrame[]): MotionParameterResult[] {
  const allResults: MotionParameterResult[] = [];
  for (let i = 0; i < normFrames.length; i++) {
    const prev = i > 0 ? normFrames[i - 1] : undefined;
    const frameParams = extractFrameParameters(normFrames[i], prev);
    allResults.push(...frameParams);
  }
  return allResults;
}
