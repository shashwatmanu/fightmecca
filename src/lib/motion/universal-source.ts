/**
 * Fight Mecca Universal Motion Source Discriminator
 * Unifies all motion inputs into canonical MotionSession format.
 */

export enum MotionSourceType {
  LIVE_CAMERA = 'LIVE_CAMERA',
  AUXILIARY_CAMERA = 'AUXILIARY_CAMERA',
  UPLOADED_VIDEO = 'UPLOADED_VIDEO',
  REFERENCE_CAPTURE = 'REFERENCE_CAPTURE',
  ATTEMPT_CAPTURE = 'ATTEMPT_CAPTURE',
  ALGORITHM_GENERATED = 'ALGORITHM_GENERATED',
}

export interface MotionSourceMetadata {
  sourceType: MotionSourceType;
  deviceId?: string;
  sourceUri?: string;
  filename?: string;
  durationSeconds?: number;
  fps?: number;
  timestamp: string;
}

export function createUniversalSourceMetadata(
  sourceType: MotionSourceType,
  details: Partial<Omit<MotionSourceMetadata, 'sourceType' | 'timestamp'>> = {}
): MotionSourceMetadata {
  return {
    sourceType,
    deviceId: details.deviceId,
    sourceUri: details.sourceUri,
    filename: details.filename,
    durationSeconds: details.durationSeconds,
    fps: details.fps ?? 30,
    timestamp: new Date().toISOString(),
  };
}
