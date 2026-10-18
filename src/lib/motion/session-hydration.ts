/**
 * Fight Mecca Motion Session Hydrator
 * Canonical hydration function resolving persisted motion from Reference -> CaptureSession / MotionTemplate -> MotionSession.
 */

import { MotionSession, MotionFrame } from '@/types/motion';
import { Reference } from './reference';
import { captureApi } from '@/lib/api-client';

export function normalizeMotionFrame(f: any, idx: number): MotionFrame {
  const frameIndex = f.frame_index ?? f.frameIndex ?? idx;
  const timestampMs = f.timestamp_ms ?? f.timestampMs ?? (idx * 33.33);

  const rawLandmarks =
    f.landmarks ||
    f.normalized_landmarks ||
    f.normalizedLandmarks ||
    (Array.isArray(f) ? f : []);

  const landmarks = Array.isArray(rawLandmarks)
    ? rawLandmarks.map((lm: any, lmIdx: number) => ({
        landmark_id: lm.landmark_id ?? lm.landmarkId ?? lmIdx,
        x: Number(lm.x || 0),
        y: Number(lm.y || 0),
        z: Number(lm.z || 0),
        confidence: Number(lm.confidence ?? lm.visibility ?? 1.0),
        visibility: Number(lm.visibility ?? lm.confidence ?? 1.0),
        presence: Number(lm.presence ?? 1.0),
      }))
    : [];

  const frameConfidence = Number(
    f.frame_confidence ?? f.frameConfidence ?? f.confidence ?? 1.0
  );

  return {
    frame_index: frameIndex,
    timestamp_ms: timestampMs,
    landmarks,
    frame_confidence: frameConfidence,
  };
}

export function parseMotionSessionFromApiSession(apiSess: any): MotionSession {
  const rawFrames = apiSess.motion_data?.frames || apiSess.frames || [];
  const frames = rawFrames.map((f: any, idx: number) => normalizeMotionFrame(f, idx));

  return {
    session_id: apiSess.id || apiSess.session_id || `sess_${Date.now()}`,
    athlete_id: apiSess.athlete_id || apiSess.athleteId || 'dev_athlete',
    technique_id: apiSess.technique_id || apiSess.techniqueId || 'Cross',
    capture_mode: apiSess.capture_mode || apiSess.captureMode || 'SINGLE',
    started_at: apiSess.started_at || apiSess.startedAt || new Date().toISOString(),
    completed_at: apiSess.completed_at || apiSess.completedAt || new Date().toISOString(),
    calibration_id: apiSess.calibration_id || null,
    anthropometric_profile_id: apiSess.anthropometric_profile_id || null,
    pose_model_version: apiSess.pose_model_version || 'v1',
    analysis_model_version: apiSess.analysis_model_version || null,
    frames,
  };
}

export function parseMotionSessionFromTemplate(tmpl: any, ref?: Reference): MotionSession {
  const rawFrames = tmpl.normalized_frames || tmpl.normalizedFrames || [];
  const frames = rawFrames.map((f: any, idx: number) => normalizeMotionFrame(f, idx));

  return {
    session_id: tmpl.session_id || ref?.source_session_id || `sess_${Date.now()}`,
    athlete_id: tmpl.athlete_id || ref?.owner_id || 'dev_athlete',
    technique_id: tmpl.technique_id || ref?.technique_id || 'Cross',
    capture_mode: tmpl.capture_mode || ref?.capture_mode || 'SINGLE',
    started_at: ref?.created_at || new Date().toISOString(),
    completed_at: ref?.created_at || new Date().toISOString(),
    calibration_id: null,
    anthropometric_profile_id: null,
    pose_model_version: tmpl.pose_model_version || 'v1',
    analysis_model_version: null,
    frames,
  };
}

/**
 * Hydrates a canonical MotionSession from a Reference by querying backend APIs.
 * Order of Resolution:
 * 1. source_session_id -> GET /api/capture/sessions/{id} (CaptureSession.motion_data.frames)
 * 2. motion_template_id -> GET /api/capture/templates/{id} (MotionTemplate.normalized_frames)
 * 3. Reference.landmark_data / Reference.motion_template embedded frames
 */
export async function hydrateReferenceMotionSession(
  ref: Reference | null
): Promise<MotionSession | null> {
  if (!ref) return null;

  // 1. Primary Resolution: Persisted source CaptureSession
  if (ref.source_session_id && ref.source_session_id !== 'session_default') {
    try {
      const sessionData = await captureApi.getSession(ref.source_session_id);
      if (
        sessionData &&
        sessionData.motion_data &&
        Array.isArray(sessionData.motion_data.frames) &&
        sessionData.motion_data.frames.length > 0
      ) {
        const session = parseMotionSessionFromApiSession(sessionData);
        if (session.frames && session.frames.length > 0) return session;
      }
    } catch (err) {
      console.warn(
        `[HYDRATE] Could not load source CaptureSession ${ref.source_session_id}:`,
        err
      );
    }
  }

  // 2. Secondary Resolution: Persisted MotionTemplate
  if (ref.motion_template_id && ref.motion_template_id !== 'template_default') {
    try {
      const templateData = await captureApi.getTemplate(ref.motion_template_id);
      if (
        templateData &&
        Array.isArray(templateData.normalized_frames) &&
        templateData.normalized_frames.length > 0
      ) {
        const session = parseMotionSessionFromTemplate(templateData, ref);
        if (session.frames && session.frames.length > 0) return session;
      }
    } catch (err) {
      console.warn(
        `[HYDRATE] Could not load linked MotionTemplate ${ref.motion_template_id}:`,
        err
      );
    }
  }

  // 3. Fallback Resolution: Embedded landmark_data or motion_template on Reference object
  const embeddedFrames = ref.landmark_data || ref.motion_template?.normalized_frames;
  if (Array.isArray(embeddedFrames) && embeddedFrames.length > 0) {
    const frames = embeddedFrames.map((f: any, idx: number) => normalizeMotionFrame(f, idx));
    if (frames.length > 0) {
      return {
        session_id: ref.source_session_id || ref.reference_id,
        athlete_id: ref.owner_id || 'dev_athlete',
        technique_id: ref.technique_id,
        capture_mode: ref.capture_mode,
        started_at: ref.created_at,
        completed_at: ref.created_at,
        calibration_id: null,
        anthropometric_profile_id: null,
        pose_model_version: 'v1',
        analysis_model_version: null,
        frames,
      };
    }
  }

  return null;
}
