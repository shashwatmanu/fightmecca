export type CaptureState = 
  | 'IDLE'           // Camera is stopped / initialized state
  | 'CAMERA_READY'   // Camera is active, live feed & pose tracking running, not recording
  | 'RECORDING'      // Actively recording MotionFrames
  | 'PROCESSING'     // Finalizing MotionSession on stop
  | 'COMPLETED'      // Session constructed & summary ready
  | 'ERROR';         // Camera or pose detection error

export interface CaptureStateTransition {
  from: CaptureState;
  to: CaptureState;
  action: string;
}

export function isValidStateTransition(from: CaptureState, to: CaptureState): boolean {
  const allowedTransitions: Record<CaptureState, CaptureState[]> = {
    IDLE: ['CAMERA_READY', 'ERROR'],
    CAMERA_READY: ['IDLE', 'RECORDING', 'ERROR'],
    RECORDING: ['PROCESSING', 'ERROR'],
    PROCESSING: ['COMPLETED', 'ERROR'],
    COMPLETED: ['CAMERA_READY', 'RECORDING', 'IDLE'],
    ERROR: ['IDLE', 'CAMERA_READY'],
  };

  return allowedTransitions[from]?.includes(to) ?? false;
}
