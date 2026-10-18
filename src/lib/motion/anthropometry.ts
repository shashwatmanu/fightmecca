import { Landmark } from '@/types/motion';
import { distance3D, Vector3D } from './geometry';
import { MEDIAPIPE_LANDMARKS } from './mediapipe-adapter';

export type MeasurementProvenance = 'USER_ENTERED' | 'ESTIMATED_FROM_POSE' | 'DERIVED' | 'UNKNOWN';

export interface AnthropometricValue {
  value: number | null; // Value in cm or ratio
  provenance: MeasurementProvenance;
  confidence: number; // 0.0 to 1.0
  source: string;
}

export interface AnthropometricProfile {
  athlete_id: string;
  height_cm: AnthropometricValue;
  weight_kg: AnthropometricValue;
  arm_span_cm: AnthropometricValue;
  shoulder_width_cm: AnthropometricValue;
  torso_length_cm: AnthropometricValue;
  upper_arm_length_cm: AnthropometricValue;
  forearm_length_cm: AnthropometricValue;
  thigh_length_cm: AnthropometricValue;
  lower_leg_length_cm: AnthropometricValue;
}

/**
 * Creates a default empty AnthropometricProfile with optional user overrides.
 */
export function createDefaultProfile(
  athleteId: string,
  userValues?: Partial<Record<keyof Omit<AnthropometricProfile, 'athlete_id'>, number>>
): AnthropometricProfile {
  const makeVal = (key: keyof Omit<AnthropometricProfile, 'athlete_id'>): AnthropometricValue => {
    const userVal = userValues?.[key];
    if (userVal !== undefined && userVal !== null) {
      return {
        value: userVal,
        provenance: 'USER_ENTERED',
        confidence: 1.0,
        source: 'User Profile Input',
      };
    }
    return {
      value: null,
      provenance: 'UNKNOWN',
      confidence: 0.0,
      source: 'Unspecified',
    };
  };

  return {
    athlete_id: athleteId,
    height_cm: makeVal('height_cm'),
    weight_kg: makeVal('weight_kg'),
    arm_span_cm: makeVal('arm_span_cm'),
    shoulder_width_cm: makeVal('shoulder_width_cm'),
    torso_length_cm: makeVal('torso_length_cm'),
    upper_arm_length_cm: makeVal('upper_arm_length_cm'),
    forearm_length_cm: makeVal('forearm_length_cm'),
    thigh_length_cm: makeVal('thigh_length_cm'),
    lower_leg_length_cm: makeVal('lower_leg_length_cm'),
  };
}

/**
 * Estimates body segment proportions from a calibrated neutral full-body pose.
 * NEVER overwrites user-entered physical measurements.
 */
export function estimateProportionsFromPose(
  landmarks: Landmark[],
  existingProfile: AnthropometricProfile
): AnthropometricProfile {
  if (!landmarks || landmarks.length === 0) return existingProfile;

  const lmMap = new Map(landmarks.map((l) => [l.landmark_id, l]));

  const getPt = (id: number): Vector3D | null => {
    const lm = lmMap.get(id);
    return lm && lm.confidence > 0.4 ? lm : null;
  };

  const leftShoulder = getPt(MEDIAPIPE_LANDMARKS.LEFT_SHOULDER);
  const rightShoulder = getPt(MEDIAPIPE_LANDMARKS.RIGHT_SHOULDER);
  const leftElbow = getPt(MEDIAPIPE_LANDMARKS.LEFT_ELBOW);
  const leftWrist = getPt(MEDIAPIPE_LANDMARKS.LEFT_WRIST);
  const leftHip = getPt(MEDIAPIPE_LANDMARKS.LEFT_HIP);
  const leftKnee = getPt(MEDIAPIPE_LANDMARKS.LEFT_KNEE);
  const leftAnkle = getPt(MEDIAPIPE_LANDMARKS.LEFT_ANKLE);

  const updatedProfile: AnthropometricProfile = { ...existingProfile };

  // Helper to update field if not user-entered
  const updateFieldIfAllowed = (
    field: keyof Omit<AnthropometricProfile, 'athlete_id'>,
    estimatedVal: number,
    confidence: number,
    sourceMethod: string
  ) => {
    if (updatedProfile[field].provenance !== 'USER_ENTERED') {
      updatedProfile[field] = {
        value: Number(estimatedVal.toFixed(2)),
        provenance: 'ESTIMATED_FROM_POSE',
        confidence: Number(confidence.toFixed(2)),
        source: sourceMethod,
      };
    }
  };

  // Shoulder width estimate
  if (leftShoulder && rightShoulder) {
    const widthDist = distance3D(leftShoulder, rightShoulder);
    updateFieldIfAllowed('shoulder_width_cm', widthDist, (leftShoulder.z + rightShoulder.z) / 2, 'Single-Camera Pose Ratio');
  }

  // Upper arm length estimate
  if (leftShoulder && leftElbow) {
    const upperArmDist = distance3D(leftShoulder, leftElbow);
    updateFieldIfAllowed('upper_arm_length_cm', upperArmDist, (leftShoulder.z + leftElbow.z) / 2, 'Single-Camera Pose Ratio');
  }

  // Forearm length estimate
  if (leftElbow && leftWrist) {
    const forearmDist = distance3D(leftElbow, leftWrist);
    updateFieldIfAllowed('forearm_length_cm', forearmDist, (leftElbow.z + leftWrist.z) / 2, 'Single-Camera Pose Ratio');
  }

  // Thigh length estimate
  if (leftHip && leftKnee) {
    const thighDist = distance3D(leftHip, leftKnee);
    updateFieldIfAllowed('thigh_length_cm', thighDist, (leftHip.z + leftKnee.z) / 2, 'Single-Camera Pose Ratio');
  }

  // Lower leg length estimate
  if (leftKnee && leftAnkle) {
    const lowerLegDist = distance3D(leftKnee, leftAnkle);
    updateFieldIfAllowed('lower_leg_length_cm', lowerLegDist, (leftKnee.z + leftAnkle.z) / 2, 'Single-Camera Pose Ratio');
  }

  return updatedProfile;
}
