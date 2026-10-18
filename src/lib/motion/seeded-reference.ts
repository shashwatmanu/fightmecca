import { Reference, createReferenceFromTemplate } from './reference';
import { MotionSession, Landmark, CaptureMode } from '@/types/motion';
import { buildMotionTemplate } from './template';
import { evaluateSingleCameraCalibration } from './calibration';
import { createDefaultProfile } from './anthropometry';

/**
 * Generates a realistic synthetic 30-frame sequence of a standard Boxing Cross punch.
 * Landmarks follow the 33-keypoint MediaPipe Pose topology.
 */
function generateSeededCrossFrames(): { frame_index: number; timestamp_ms: number; landmarks: Landmark[]; frame_confidence: number }[] {
  const frames: { frame_index: number; timestamp_ms: number; landmarks: Landmark[]; frame_confidence: number }[] = [];
  const totalFrames = 30;

  for (let i = 0; i < totalFrames; i++) {
    const t = i / (totalFrames - 1); // 0.0 to 1.0 (Setup -> Extension -> Recovery)
    // Bell curve for extension of rear right punch
    const extension = Math.sin(t * Math.PI); // 0 -> 1 -> 0

    // Stance base positions (Orthodox fighter: left side slightly forward, right side rear)
    const nose = { x: 0.5, y: 0.25, z: 0.0 };
    const leftShoulder = { x: 0.42, y: 0.35, z: -0.05 };
    const rightShoulder = { x: 0.58, y: 0.35, z: 0.05 - extension * 0.1 }; // right shoulder rotates forward
    const leftElbow = { x: 0.38, y: 0.45, z: -0.1 };
    const leftWrist = { x: 0.43, y: 0.32, z: -0.15 }; // lead guard held high near chin

    // Rear arm punch trajectory
    const rightElbow = {
      x: 0.58 - extension * 0.08,
      y: 0.46 - extension * 0.08,
      z: 0.05 - extension * 0.25,
    };
    const rightWrist = {
      x: 0.54 - extension * 0.05,
      y: 0.35 - extension * 0.05,
      z: 0.0 - extension * 0.45, // drives forward toward opponent
    };

    // Hips & Legs (Orthodox stance)
    const leftHip = { x: 0.46, y: 0.60, z: -0.04 };
    const rightHip = { x: 0.54, y: 0.60, z: 0.04 - extension * 0.06 }; // hip pivot
    const leftKnee = { x: 0.45, y: 0.78, z: -0.05 };
    const rightKnee = { x: 0.55, y: 0.78, z: 0.03 };
    const leftAnkle = { x: 0.44, y: 0.94, z: -0.06 };
    const rightAnkle = { x: 0.57, y: 0.94, z: 0.04 };

    // Build standard 33 MediaPipe landmark array
    const landmarks: Landmark[] = [];
    for (let lmIdx = 0; lmIdx < 33; lmIdx++) {
      let pt = { x: 0.5, y: 0.5, z: 0.0 };
      if (lmIdx === 0) pt = nose;
      else if (lmIdx === 11) pt = leftShoulder;
      else if (lmIdx === 12) pt = rightShoulder;
      else if (lmIdx === 13) pt = leftElbow;
      else if (lmIdx === 14) pt = rightElbow;
      else if (lmIdx === 15) pt = leftWrist;
      else if (lmIdx === 16) pt = rightWrist;
      else if (lmIdx === 23) pt = leftHip;
      else if (lmIdx === 24) pt = rightHip;
      else if (lmIdx === 25) pt = leftKnee;
      else if (lmIdx === 26) pt = rightKnee;
      else if (lmIdx === 27) pt = leftAnkle;
      else if (lmIdx === 28) pt = rightAnkle;
      else {
        // Interpolate other facial / hand / foot points nearby
        pt = { x: 0.5 + (lmIdx % 2 === 0 ? 0.04 : -0.04), y: 0.2 + (lmIdx * 0.02), z: 0.0 };
      }

      landmarks.push({
        landmark_id: lmIdx,
        x: pt.x,
        y: pt.y,
        z: pt.z,
        confidence: 0.95,
      });
    }

    frames.push({
      frame_index: i,
      timestamp_ms: Math.round(i * 33.33),
      landmarks,
      frame_confidence: 0.95,
    });
  }

  return frames;
}

/**
 * Creates the canonical Seeded Platform Reference for Boxing Cross.
 */
export function getSeededPlatformReference(): Reference {
  const frames = generateSeededCrossFrames();
  const session: MotionSession = {
    session_id: 'seeded_session_cross_platform',
    athlete_id: 'platform_sensei_01',
    technique_id: '00000000-0000-0000-0000-000000000002',
    capture_mode: CaptureMode.SINGLE,
    started_at: new Date(Date.now() - 60000).toISOString(),
    completed_at: new Date().toISOString(),
    calibration_id: 'calib_seeded_01',
    anthropometric_profile_id: 'anthro_seeded_01',
    pose_model_version: 'mediapipe-pose-landmarker-lite-v1',
    analysis_model_version: null,
    frames,
  };

  const calib = evaluateSingleCameraCalibration(frames[0]?.landmarks || []);
  const anthro = createDefaultProfile('platform_sensei_01');
  const template = buildMotionTemplate(session, calib, anthro);

  const reference = createReferenceFromTemplate(
    template,
    'PLATFORM_REFERENCE',
    'Platform Standard Cross (Orthodox)',
    'platform_sensei_01',
    'Canonical Platform Reference for Orthodox Rear Straight Punch (Cross) with hip drive and chin tuck.'
  );

  reference.reference_id = '00000000-0000-0000-0000-000000000003';
  return reference;
}
