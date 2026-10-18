import { FilesetResolver, PoseLandmarker, PoseLandmarkerResult } from '@mediapipe/tasks-vision';

let instance: PoseLandmarker | null = null;
let initPromise: Promise<PoseLandmarker> | null = null;

export const POSE_MODEL_VERSION = 'mediapipe-pose-landmarker-lite-v1';

/**
 * Initializes or returns the singleton PoseLandmarker instance.
 * Uses MediaPipe Tasks Vision WASM assets hosted on jsDelivr / Google Cloud Storage.
 */
export async function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (instance) {
    return instance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      instance = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      return instance;
    } catch (err) {
      initPromise = null;
      console.error('Failed to initialize MediaPipe PoseLandmarker:', err);
      throw err;
    }
  })();

  return initPromise;
}

export type { PoseLandmarkerResult };
