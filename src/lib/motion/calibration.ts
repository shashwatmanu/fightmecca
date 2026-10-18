import { Landmark } from '@/types/motion';
import { checkFullBodyVisibility, calculateFrameConfidence } from './quality';
import { calculateOrientationAngle, midpoint3D } from './geometry';
import { MEDIAPIPE_LANDMARKS } from './mediapipe-adapter';

export type CalibrationStatus = 'NOT_STARTED' | 'CALIBRATING' | 'READY' | 'DEGRADED' | 'FAILED';

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  area: number;
}

export interface CalibrationEvaluation {
  status: CalibrationStatus;
  confidence: number; // 0.0 to 1.0
  personDetected: boolean;
  fullBodyVisible: boolean;
  guidanceMessage: string;
  boundingBox: BoundingBox | null;
  subjectCenter: { x: number; y: number } | null;
  subjectScale: number; // Fraction of frame height
  shoulderOrientationDeg: number;
  hipOrientationDeg: number;
}

/**
 * Calculates bounding box of detected landmarks.
 */
export function calculateBoundingBox(landmarks: Landmark[]): BoundingBox | null {
  if (!landmarks || landmarks.length === 0) return null;

  let minX = 1.0;
  let minY = 1.0;
  let maxX = 0.0;
  let maxY = 0.0;

  for (const lm of landmarks) {
    if (lm.confidence > 0.2) {
      if (lm.x < minX) minX = lm.x;
      if (lm.y < minY) minY = lm.y;
      if (lm.x > maxX) maxX = lm.x;
      if (lm.y > maxY) maxY = lm.y;
    }
  }

  if (minX >= maxX || minY >= maxY) return null;

  const width = maxX - minX;
  const height = maxY - minY;

  return {
    minX: Number(minX.toFixed(4)),
    minY: Number(minY.toFixed(4)),
    maxX: Number(maxX.toFixed(4)),
    maxY: Number(maxY.toFixed(4)),
    width: Number(width.toFixed(4)),
    height: Number(height.toFixed(4)),
    area: Number((width * height).toFixed(4)),
  };
}

/**
 * Evaluates real single-camera calibration status and produces live user guidance.
 */
export function evaluateSingleCameraCalibration(landmarks: Landmark[]): CalibrationEvaluation {
  if (!landmarks || landmarks.length === 0) {
    return {
      status: 'NOT_STARTED',
      confidence: 0.0,
      personDetected: false,
      fullBodyVisible: false,
      guidanceMessage: 'Step into camera view',
      boundingBox: null,
      subjectCenter: null,
      subjectScale: 0.0,
      shoulderOrientationDeg: 0,
      hipOrientationDeg: 0,
    };
  }

  const lmMap = new Map(landmarks.map((l) => [l.landmark_id, l]));
  const bbox = calculateBoundingBox(landmarks);
  const frameConfidence = calculateFrameConfidence(landmarks);
  const fullBodyVisible = checkFullBodyVisibility(landmarks);

  const leftShoulder = lmMap.get(MEDIAPIPE_LANDMARKS.LEFT_SHOULDER);
  const rightShoulder = lmMap.get(MEDIAPIPE_LANDMARKS.RIGHT_SHOULDER);
  const leftHip = lmMap.get(MEDIAPIPE_LANDMARKS.LEFT_HIP);
  const rightHip = lmMap.get(MEDIAPIPE_LANDMARKS.RIGHT_HIP);
  const leftAnkle = lmMap.get(MEDIAPIPE_LANDMARKS.LEFT_ANKLE);
  const rightAnkle = lmMap.get(MEDIAPIPE_LANDMARKS.RIGHT_ANKLE);

  const shoulderDeg = leftShoulder && rightShoulder ? calculateOrientationAngle(leftShoulder, rightShoulder) : 0;
  const hipDeg = leftHip && rightHip ? calculateOrientationAngle(leftHip, rightHip) : 0;

  const center = bbox ? { x: Number(((bbox.minX + bbox.maxX) / 2).toFixed(3)), y: Number(((bbox.minY + bbox.maxY) / 2).toFixed(3)) } : null;
  const scale = bbox ? bbox.height : 0.0;

  // Determine calibration guidance and status
  let status: CalibrationStatus = 'CALIBRATING';
  let guidanceMessage = 'Calibrating position...';
  let calibrationConfidence = frameConfidence;

  if (scale < 0.40) {
    guidanceMessage = 'Step forward towards camera';
    status = 'DEGRADED';
    calibrationConfidence *= 0.7;
  } else if (scale > 0.95) {
    guidanceMessage = 'Step backward away from camera';
    status = 'DEGRADED';
    calibrationConfidence *= 0.8;
  } else if (center && center.x < 0.3) {
    guidanceMessage = 'Move right towards center';
    status = 'DEGRADED';
  } else if (center && center.x > 0.7) {
    guidanceMessage = 'Move left towards center';
    status = 'DEGRADED';
  } else if (!leftAnkle || !rightAnkle || leftAnkle.confidence < 0.3 || rightAnkle.confidence < 0.3) {
    guidanceMessage = 'Adjust camera to show feet';
    status = 'DEGRADED';
    calibrationConfidence *= 0.8;
  } else if (frameConfidence < 0.5) {
    guidanceMessage = 'Improve room lighting';
    status = 'DEGRADED';
  } else if (fullBodyVisible) {
    guidanceMessage = 'Calibration Ready';
    status = 'READY';
    calibrationConfidence = Number(Math.min(1.0, calibrationConfidence * 1.1).toFixed(2));
  }

  return {
    status,
    confidence: Number(calibrationConfidence.toFixed(2)),
    personDetected: true,
    fullBodyVisible,
    guidanceMessage,
    boundingBox: bbox,
    subjectCenter: center,
    subjectScale: scale,
    shoulderOrientationDeg: shoulderDeg,
    hipOrientationDeg: hipDeg,
  };
}
