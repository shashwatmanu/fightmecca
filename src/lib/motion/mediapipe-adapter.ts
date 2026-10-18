import { Landmark } from '@/types/motion';

/**
 * Coordinate System Documentation for Fight Mecca Motion Model:
 * 
 * 1. Space: Right-handed 3D coordinate space relative to camera image frame.
 * 2. x-axis: Normalized [0.0, 1.0] left to right across the image frame.
 *    0.0 = Left edge of camera frame, 1.0 = Right edge.
 * 3. y-axis: Normalized [0.0, 1.0] top to bottom down the image frame.
 *    0.0 = Top edge of camera frame, 1.0 = Bottom edge.
 * 4. z-axis: Depth relative to the hip midpoint.
 *    Negative values = closer to camera, positive values = farther from camera.
 * 5. confidence: Float [0.0, 1.0] representing MediaPipe landmark visibility/presence.
 * 6. Mirroring: UI preview video is mirrored horizontally for intuitive user interaction,
 *    BUT canonical stored coordinates are ALWAYS kept in standard unmirrored camera frame space
 *    so spatial analytics remain invariant to UI display options.
 */

export const MEDIAPIPE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

export interface RawMediaPipeLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
  presence?: number;
}

/**
 * Converts raw MediaPipe Pose Landmarker output into canonical Fight Mecca Landmark array.
 */
export function convertMediaPipeToCanonicalLandmarks(
  rawLandmarks: RawMediaPipeLandmark[]
): Landmark[] {
  if (!rawLandmarks || !Array.isArray(rawLandmarks)) {
    return [];
  }

  return rawLandmarks.map((lm, idx) => {
    // Confidence is derived from visibility or presence (or default to 1.0 if not provided)
    const confidence = typeof lm.visibility === 'number' 
      ? lm.visibility 
      : typeof lm.presence === 'number' 
        ? lm.presence 
        : 1.0;

    return {
      landmark_id: idx,
      x: Number(lm.x.toFixed(5)),
      y: Number(lm.y.toFixed(5)),
      z: Number(lm.z.toFixed(5)),
      confidence: Number(confidence.toFixed(4)),
    };
  });
}
