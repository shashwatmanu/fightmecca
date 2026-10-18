/**
 * Fight Mecca Athlete Body Profile & Camera Ratio Estimation
 * Permanently separates Skeletal Structure, Muscular Morphology, and Fat Morphology.
 */

export interface SkeletonProfile {
  heightCm: number;          // e.g. 178 cm
  wingspanCm?: number;        // e.g. 182 cm
  shoulderWidthRatio?: number;// relative to height or torso
  hipWidthRatio?: number;     // relative to height or torso
  torsoLengthRatio?: number;
  upperArmLengthRatio?: number;
  forearmLengthRatio?: number;
  femurLengthRatio?: number;
  tibiaLengthRatio?: number;
}

export interface CompositionProfile {
  bodyWeightKg: number;       // e.g. 75 kg
  bodyFatPercent?: number;    // e.g. 15%
  leanMassKg?: number;        // derived or supplied
  fatMassKg?: number;         // derived or supplied
}

export interface RegionalMorphology {
  shoulders: number; // Scale factor 0.5 to 2.0 (1.0 = neutral)
  chest: number;
  upperArms: number;
  forearms: number;
  waist: number;
  hips: number;
  thighs: number;
  calves: number;
  neck?: number;
}

export interface MeasurementConfidence {
  manualMeasurementConfidence: number; // 0.0 to 1.0
  cameraMeasurementConfidence: number; // 0.0 to 1.0
  source: 'MANUAL' | 'CAMERA_DERIVED' | 'HYBRID' | 'PRESET';
  timestamp: string;
}

export interface AthleteBodyProfile {
  id: string;
  athleteId: string;
  skeleton: SkeletonProfile;
  composition: CompositionProfile;
  regional: RegionalMorphology;
  confidence: MeasurementConfidence;
}

/**
 * Predefined anatomical morphology presets for physical UI testing.
 * NOT medical classifications.
 */
export type ProfilePresetName = 'NEUTRAL' | 'LEAN' | 'MUSCULAR' | 'HIGHER_BODY_FAT' | 'MUSCULAR_HIGHER_BODY_FAT';

export const ATHLETE_BODY_PRESETS: Record<ProfilePresetName, AthleteBodyProfile> = {
  NEUTRAL: {
    id: 'preset_neutral',
    athleteId: 'default_athlete',
    skeleton: {
      heightCm: 175,
      wingspanCm: 175,
      shoulderWidthRatio: 1.0,
      hipWidthRatio: 1.0,
      torsoLengthRatio: 1.0,
      upperArmLengthRatio: 1.0,
      forearmLengthRatio: 1.0,
      femurLengthRatio: 1.0,
      tibiaLengthRatio: 1.0,
    },
    composition: {
      bodyWeightKg: 72,
      bodyFatPercent: 15,
      leanMassKg: 61.2,
      fatMassKg: 10.8,
    },
    regional: {
      shoulders: 1.0,
      chest: 1.0,
      upperArms: 1.0,
      forearms: 1.0,
      waist: 1.0,
      hips: 1.0,
      thighs: 1.0,
      calves: 1.0,
      neck: 1.0,
    },
    confidence: {
      manualMeasurementConfidence: 1.0,
      cameraMeasurementConfidence: 0.0,
      source: 'PRESET',
      timestamp: new Date().toISOString(),
    },
  },

  LEAN: {
    id: 'preset_lean',
    athleteId: 'default_athlete',
    skeleton: {
      heightCm: 180,
      wingspanCm: 184,
      shoulderWidthRatio: 1.05,
      hipWidthRatio: 0.95,
      torsoLengthRatio: 1.0,
      upperArmLengthRatio: 1.0,
      forearmLengthRatio: 1.05,
      femurLengthRatio: 1.05,
      tibiaLengthRatio: 1.05,
    },
    composition: {
      bodyWeightKg: 68,
      bodyFatPercent: 8,
      leanMassKg: 62.5,
      fatMassKg: 5.5,
    },
    regional: {
      shoulders: 1.05,
      chest: 0.95,
      upperArms: 0.95,
      forearms: 0.95,
      waist: 0.85,
      hips: 0.9,
      thighs: 0.95,
      calves: 0.95,
      neck: 0.95,
    },
    confidence: {
      manualMeasurementConfidence: 1.0,
      cameraMeasurementConfidence: 0.0,
      source: 'PRESET',
      timestamp: new Date().toISOString(),
    },
  },

  MUSCULAR: {
    id: 'preset_muscular',
    athleteId: 'default_athlete',
    skeleton: {
      heightCm: 178,
      wingspanCm: 180,
      shoulderWidthRatio: 1.15,
      hipWidthRatio: 0.98,
      torsoLengthRatio: 1.0,
      upperArmLengthRatio: 1.0,
      forearmLengthRatio: 1.0,
      femurLengthRatio: 1.0,
      tibiaLengthRatio: 1.0,
    },
    composition: {
      bodyWeightKg: 85,
      bodyFatPercent: 12,
      leanMassKg: 74.8,
      fatMassKg: 10.2,
    },
    regional: {
      shoulders: 1.35,
      chest: 1.3,
      upperArms: 1.35,
      forearms: 1.25,
      waist: 0.95,
      hips: 1.05,
      thighs: 1.3,
      calves: 1.2,
      neck: 1.2,
    },
    confidence: {
      manualMeasurementConfidence: 1.0,
      cameraMeasurementConfidence: 0.0,
      source: 'PRESET',
      timestamp: new Date().toISOString(),
    },
  },

  HIGHER_BODY_FAT: {
    id: 'preset_higher_fat',
    athleteId: 'default_athlete',
    skeleton: {
      heightCm: 172,
      wingspanCm: 172,
      shoulderWidthRatio: 1.0,
      hipWidthRatio: 1.08,
      torsoLengthRatio: 1.0,
      upperArmLengthRatio: 1.0,
      forearmLengthRatio: 1.0,
      femurLengthRatio: 1.0,
      tibiaLengthRatio: 1.0,
    },
    composition: {
      bodyWeightKg: 92,
      bodyFatPercent: 28,
      leanMassKg: 66.2,
      fatMassKg: 25.8,
    },
    regional: {
      shoulders: 1.1,
      chest: 1.2,
      upperArms: 1.15,
      forearms: 1.1,
      waist: 1.35,
      hips: 1.3,
      thighs: 1.25,
      calves: 1.15,
      neck: 1.15,
    },
    confidence: {
      manualMeasurementConfidence: 1.0,
      cameraMeasurementConfidence: 0.0,
      source: 'PRESET',
      timestamp: new Date().toISOString(),
    },
  },

  MUSCULAR_HIGHER_BODY_FAT: {
    id: 'preset_muscular_higher_fat',
    athleteId: 'default_athlete',
    skeleton: {
      heightCm: 185,
      wingspanCm: 188,
      shoulderWidthRatio: 1.2,
      hipWidthRatio: 1.1,
      torsoLengthRatio: 1.0,
      upperArmLengthRatio: 1.0,
      forearmLengthRatio: 1.0,
      femurLengthRatio: 1.0,
      tibiaLengthRatio: 1.0,
    },
    composition: {
      bodyWeightKg: 105,
      bodyFatPercent: 24,
      leanMassKg: 79.8,
      fatMassKg: 25.2,
    },
    regional: {
      shoulders: 1.4,
      chest: 1.4,
      upperArms: 1.4,
      forearms: 1.3,
      waist: 1.3,
      hips: 1.25,
      thighs: 1.35,
      calves: 1.25,
      neck: 1.3,
    },
    confidence: {
      manualMeasurementConfidence: 1.0,
      cameraMeasurementConfidence: 0.0,
      source: 'PRESET',
      timestamp: new Date().toISOString(),
    },
  },
};

/**
 * Section 10: Camera-Derived Body Ratios
 * Derives approximate anthropometric ratios from observable MediaPipe pose landmarks.
 * Does NOT pretend to infer body fat or hidden muscle mass.
 */
export function deriveCameraBodyRatios(landmarks: { x: number; y: number; z: number; visibility?: number }[]) {
  if (!landmarks || landmarks.length < 33) return null;

  const getDist = (i1: number, i2: number) => {
    const p1 = landmarks[i1];
    const p2 = landmarks[i2];
    if (!p1 || !p2) return 0;
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = (p1.z || 0) - (p2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  // Landmark indices
  const L_SHOULDER = 11, R_SHOULDER = 12;
  const L_HIP = 23, R_HIP = 24;
  const L_ELBOW = 13, L_WRIST = 15;
  const L_KNEE = 25, L_ANKLE = 27;

  const shoulderWidth = getDist(L_SHOULDER, R_SHOULDER);
  const hipWidth = getDist(L_HIP, R_HIP);

  const shoulderCenterY = (landmarks[L_SHOULDER].y + landmarks[R_SHOULDER].y) / 2;
  const hipCenterY = (landmarks[L_HIP].y + landmarks[R_HIP].y) / 2;
  const torsoLength = Math.abs(hipCenterY - shoulderCenterY);

  const upperArmLength = getDist(L_SHOULDER, L_ELBOW);
  const forearmLength = getDist(L_ELBOW, L_WRIST);
  const femurLength = getDist(L_HIP, L_KNEE);
  const tibiaLength = getDist(L_KNEE, L_ANKLE);

  if (torsoLength === 0) return null;

  return {
    shoulderToTorsoRatio: shoulderWidth / torsoLength,
    hipToTorsoRatio: hipWidth / torsoLength,
    shoulderToHipRatio: hipWidth > 0 ? shoulderWidth / hipWidth : 1.0,
    upperArmToForearmRatio: forearmLength > 0 ? upperArmLength / forearmLength : 1.0,
    femurToTibiaRatio: tibiaLength > 0 ? femurLength / tibiaLength : 1.0,
    confidence: 0.8,
  };
}
