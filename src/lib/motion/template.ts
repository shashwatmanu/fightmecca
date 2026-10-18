import { MotionSession, CaptureMode } from '@/types/motion';
import { CalibrationEvaluation } from './calibration';
import { AnthropometricProfile, createDefaultProfile } from './anthropometry';
import { NormalizedMotionFrame, normalizeMotionSequence } from './normalization';
import { MotionParameterResult, extractSequenceParameters } from './parameters';
import { KeyMomentEvent, extractKeyMoments } from './events';

export interface MotionTemplate {
  template_id: string;
  session_id: string;
  athlete_id: string;
  technique_id: string;
  capture_mode: CaptureMode;
  created_at: string;
  duration_ms: number;
  total_frames: number;
  usable_frames: number;
  normalized_frames: NormalizedMotionFrame[];
  parameter_time_series: MotionParameterResult[];
  key_temporal_events: KeyMomentEvent[];
  calibration_metadata: CalibrationEvaluation;
  anthropometric_context: AnthropometricProfile;
  confidence_info: {
    avg_confidence: number;
    usable_ratio: number;
  };
  pose_model_version: string;
  parameter_algorithm_version: string;
  template_schema_version: string;
}

/**
 * Builds a canonical MotionTemplate from a recorded MotionSession, calibration metadata, and anthropometric context.
 * DOES NOT CONTAIN RAW VIDEO DATA.
 */
export function buildMotionTemplate(
  session: MotionSession,
  calibration: CalibrationEvaluation,
  anthropometry: AnthropometricProfile
): MotionTemplate {
  const rawFrames = session.frames || [];
  const normalizedFrames = normalizeMotionSequence(rawFrames);
  const parameterTimeSeries = extractSequenceParameters(normalizedFrames);
  const keyEvents = extractKeyMoments(normalizedFrames, parameterTimeSeries);

  const usableFrames = rawFrames.filter((f) => f.landmarks && f.landmarks.length > 0).length;
  const usableRatio = rawFrames.length > 0 ? usableFrames / rawFrames.length : 0;
  
  const avgConf = rawFrames.length > 0
    ? rawFrames.reduce((acc, f) => acc + f.frame_confidence, 0) / rawFrames.length
    : 0;

  const lastFrame = rawFrames.length > 0 ? rawFrames[rawFrames.length - 1] : null;
  const firstFrame = rawFrames.length > 0 ? rawFrames[0] : null;
  const frameDurationMs = lastFrame && firstFrame ? lastFrame.timestamp_ms - firstFrame.timestamp_ms : 0;
  const isoDurationMs = session.completed_at && session.started_at
    ? new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()
    : 0;
  const durationMs = frameDurationMs > 0 ? frameDurationMs : isoDurationMs;

  return {
    template_id: `tmpl_${crypto.randomUUID()}`,
    session_id: session.session_id,
    athlete_id: session.athlete_id,
    technique_id: session.technique_id || '',
    capture_mode: session.capture_mode,
    created_at: new Date().toISOString(),
    duration_ms: Math.max(0, durationMs),
    total_frames: rawFrames.length,
    usable_frames: usableFrames,
    normalized_frames: normalizedFrames,
    parameter_time_series: parameterTimeSeries,
    key_temporal_events: keyEvents,
    calibration_metadata: calibration,
    anthropometric_context: anthropometry,
    confidence_info: {
      avg_confidence: Number(avgConf.toFixed(2)),
      usable_ratio: Number(usableRatio.toFixed(2)),
    },
    pose_model_version: session.pose_model_version,
    parameter_algorithm_version: 'v1.0.0',
    template_schema_version: '1.0.0',
  };
}

/**
 * Normalizes any raw API/DB MotionTemplate payload into the canonical frontend MotionTemplate schema.
 * Guarantees parameter_time_series is ALWAYS a canonical MotionParameterResult[] array.
 */
export function normalizeMotionTemplateFromApi(raw: any, fallbackRef?: any): MotionTemplate {
  if (!raw && !fallbackRef) {
    return {
      template_id: `tmpl_${crypto.randomUUID()}`,
      session_id: 'session_default',
      athlete_id: '00000000-0000-0000-0000-000000000001',
      technique_id: '00000000-0000-0000-0000-000000000002',
      capture_mode: CaptureMode.SINGLE,
      created_at: new Date().toISOString(),
      duration_ms: 1000,
      total_frames: 30,
      usable_frames: 30,
      normalized_frames: [],
      parameter_time_series: [],
      key_temporal_events: [],
      calibration_metadata: {
        status: 'READY',
        confidence: 1.0,
        personDetected: true,
        fullBodyVisible: true,
        guidanceMessage: 'Ready',
        boundingBox: null,
        subjectCenter: null,
        subjectScale: 1.0,
        shoulderOrientationDeg: 0,
        hipOrientationDeg: 0,
      },
      anthropometric_context: createDefaultProfile('00000000-0000-0000-0000-000000000001'),
      confidence_info: { avg_confidence: 1.0, usable_ratio: 1.0 },
      pose_model_version: 'v1.0.0',
      parameter_algorithm_version: 'v1.0.0',
      template_schema_version: '1.0.0',
    };
  }

  const templateId = raw?.template_id || raw?.id || fallbackRef?.motion_template_id || `tmpl_${crypto.randomUUID()}`;
  const sessionId = raw?.session_id || fallbackRef?.source_session_id || 'session_default';
  const athleteId = raw?.athlete_id || fallbackRef?.owner_id || '00000000-0000-0000-0000-000000000001';
  const techniqueId = raw?.technique_id || fallbackRef?.technique_id || '00000000-0000-0000-0000-000000000002';
  const captureMode = raw?.capture_mode || fallbackRef?.capture_mode || CaptureMode.SINGLE;
  const createdAt = raw?.created_at || fallbackRef?.created_at || new Date().toISOString();
  const durationMs = typeof raw?.duration_ms === 'number' ? raw.duration_ms : (fallbackRef?.duration_ms || 1000);
  const totalFrames = typeof raw?.total_frames === 'number' ? raw.total_frames : (fallbackRef?.total_frames || 30);
  const usableFrames = typeof raw?.usable_frames === 'number' ? raw.usable_frames : (fallbackRef?.usable_frames || 30);

  // 1. Normalize parameter_time_series to canonical Array
  let rawParams = raw?.parameter_time_series || raw?.parameter_data || fallbackRef?.parameter_data || [];
  let canonicalParams: MotionParameterResult[] = [];

  if (Array.isArray(rawParams)) {
    canonicalParams = rawParams.map((p: any) => ({
      parameter_id: p.parameter_id || p.id || 'unknown_param',
      frame_index: typeof p.frame_index === 'number' ? p.frame_index : 0,
      timestamp_ms: typeof p.timestamp_ms === 'number' ? p.timestamp_ms : 0,
      value: typeof p.value === 'number' ? p.value : null,
      unit: p.unit || '',
      observable: typeof p.observable === 'boolean' ? p.observable : (p.value !== null && p.value !== undefined),
      confidence: typeof p.confidence === 'number' ? p.confidence : 1.0,
      source: p.source || 'CAMERA',
      algorithm_version: p.algorithm_version || 'v1.0.0',
    }));
  } else if (rawParams && typeof rawParams === 'object') {
    const entries = Object.entries(rawParams);
    for (const [key, val] of entries) {
      if (Array.isArray(val)) {
        for (const item of val) {
          canonicalParams.push({
            parameter_id: item.parameter_id || key,
            frame_index: typeof item.frame_index === 'number' ? item.frame_index : 0,
            timestamp_ms: typeof item.timestamp_ms === 'number' ? item.timestamp_ms : 0,
            value: typeof item.value === 'number' ? item.value : null,
            unit: item.unit || '',
            observable: typeof item.observable === 'boolean' ? item.observable : (item.value !== null && item.value !== undefined),
            confidence: typeof item.confidence === 'number' ? item.confidence : 1.0,
            source: item.source || 'CAMERA',
            algorithm_version: item.algorithm_version || 'v1.0.0',
          });
        }
      } else if (val && typeof val === 'object') {
        const pObj = val as any;
        canonicalParams.push({
          parameter_id: pObj.parameter_id || key,
          frame_index: typeof pObj.frame_index === 'number' ? pObj.frame_index : 0,
          timestamp_ms: typeof pObj.timestamp_ms === 'number' ? pObj.timestamp_ms : 0,
          value: typeof pObj.value === 'number' ? pObj.value : null,
          unit: pObj.unit || '',
          observable: typeof pObj.observable === 'boolean' ? pObj.observable : (pObj.value !== null && pObj.value !== undefined),
          confidence: typeof pObj.confidence === 'number' ? pObj.confidence : 1.0,
          source: pObj.source || 'CAMERA',
          algorithm_version: pObj.algorithm_version || 'v1.0.0',
        });
      }
    }
  }

  // 2. Normalize normalized_frames
  let rawFrames = raw?.normalized_frames || raw?.landmark_data || fallbackRef?.landmark_data || [];
  let canonicalFrames: any[] = Array.isArray(rawFrames) ? rawFrames : [];

  // 3. Normalize key_temporal_events
  let rawEvents = raw?.key_temporal_events || [];
  let canonicalEvents: any[] = Array.isArray(rawEvents) ? rawEvents : [];

  // 4. Normalize calibration_metadata
  const calMeta = raw?.calibration_metadata || fallbackRef?.calibration_quality || {
    status: 'READY',
    confidence: 1.0,
    personDetected: true,
    fullBodyVisible: true,
    guidanceMessage: 'Ready',
    boundingBox: null,
    subjectCenter: null,
    subjectScale: 1.0,
    shoulderOrientationDeg: 0,
    hipOrientationDeg: 0,
  };

  // 5. Normalize anthropometric_context
  const anthroCtx = raw?.anthropometric_context || fallbackRef?.anthropometric_context || createDefaultProfile(athleteId);

  // 6. Normalize confidence_info
  const confInfo = raw?.confidence_info || {
    avg_confidence: typeof raw?.confidence === 'number' ? raw.confidence : 1.0,
    usable_ratio: 1.0,
  };

  return {
    template_id: templateId,
    session_id: sessionId,
    athlete_id: athleteId,
    technique_id: techniqueId,
    capture_mode: captureMode,
    created_at: createdAt,
    duration_ms: durationMs,
    total_frames: totalFrames,
    usable_frames: usableFrames,
    normalized_frames: canonicalFrames,
    parameter_time_series: canonicalParams,
    key_temporal_events: canonicalEvents,
    calibration_metadata: calMeta,
    anthropometric_context: anthroCtx,
    confidence_info: confInfo,
    pose_model_version: raw?.pose_model_version || fallbackRef?.pose_model_version || 'v1.0.0',
    parameter_algorithm_version: raw?.parameter_algorithm_version || fallbackRef?.parameter_algorithm_version || 'v1.0.0',
    template_schema_version: raw?.template_schema_version || fallbackRef?.template_schema_version || '1.0.0',
  };
}
