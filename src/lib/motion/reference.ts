import { CaptureMode } from '@/types/motion';
import { CalibrationEvaluation } from './calibration';
import { AnthropometricProfile } from './anthropometry';
import { MotionTemplate, normalizeMotionTemplateFromApi } from './template';

export type ReferenceType =
  | 'PLATFORM_REFERENCE'
  | 'COACH_REFERENCE'
  | 'ATHLETE_REFERENCE'
  | 'PERSONAL_BEST_REFERENCE';

export interface Reference {
  reference_id: string;
  reference_type: ReferenceType;
  technique_id: string;
  owner_id: string | null;
  source_session_id: string;
  motion_template_id: string;
  capture_mode: CaptureMode;
  created_at: string;
  display_name: string;
  description?: string;
  pose_model_version: string;
  parameter_algorithm_version: string;
  template_schema_version: string;
  calibration_quality?: CalibrationEvaluation;
  anthropometric_context?: AnthropometricProfile;
  motion_template?: MotionTemplate;
  landmark_data?: any;
  parameter_data?: any;
}

const ACTIVE_REF_ID_KEY = 'fightmecca_active_reference_id';

export function setActiveReferenceId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (id) {
    localStorage.setItem(ACTIVE_REF_ID_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_REF_ID_KEY);
  }
}

export function getActiveReferenceId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_REF_ID_KEY);
}

/**
 * Fetches the active Reference from backend Postgres by activeReferenceId.
 */
export async function loadActiveReference(): Promise<Reference | null> {
  const activeId = getActiveReferenceId();

  try {
    if (activeId && !activeId.startsWith('00000000-0000-0000-0000-000000000003')) {
      const res = await fetch(`http://localhost:8000/api/references/${activeId}`);
      if (res.ok) {
        const data = await res.json();
        return mapDbRecordToReference(data);
      }
    }
  } catch (err) {
    console.warn('Failed to load active reference from backend:', err);
  }

  // Pure client-side default fallback
  const { getSeededPlatformReference } = await import('./seeded-reference');
  return getSeededPlatformReference();
}

export function mapDbRecordToReference(data: any): Reference {
  const rawTemplate = data.motion_template || data.constraint_data || {};
  const normalizedTemplate = normalizeMotionTemplateFromApi(rawTemplate, data);

  const calibQuality = (data.calibration_quality && data.calibration_quality.status)
    ? data.calibration_quality
    : normalizedTemplate.calibration_metadata;

  const anthroCtx = (data.anthropometric_context && data.anthropometric_context.height_cm)
    ? data.anthropometric_context
    : normalizedTemplate.anthropometric_context;

  return {
    reference_id: data.id || data.reference_id,
    reference_type: data.reference_type || 'PLATFORM_REFERENCE',
    technique_id: data.technique_id || 'Cross',
    owner_id: data.created_by || data.owner_id || null,
    source_session_id: data.source_session_id || 'session_default',
    motion_template_id: data.motion_template_id || 'template_default',
    capture_mode: data.capture_mode || CaptureMode.SINGLE,
    created_at: data.created_at || new Date().toISOString(),
    display_name: data.name || data.display_name || 'Persisted Reference',
    description: data.description,
    pose_model_version: data.pose_model_version || 'v1',
    parameter_algorithm_version: data.parameter_algorithm_version || 'v1',
    template_schema_version: data.template_schema_version || 'v1',
    landmark_data: data.landmark_data,
    parameter_data: data.parameter_data,
    calibration_quality: calibQuality,
    anthropometric_context: anthroCtx,
    motion_template: normalizedTemplate,
  };
}

/**
 * Creates a canonical Reference object from a MotionTemplate.
 */
export function createReferenceFromTemplate(
  template: MotionTemplate,
  referenceType: ReferenceType = 'ATHLETE_REFERENCE',
  displayName: string = 'Personal Recorded Reference',
  ownerId: string | null = template.athlete_id,
  description?: string
): Reference {
  return {
    reference_id: `ref_${crypto.randomUUID()}`,
    reference_type: referenceType,
    technique_id: template.technique_id,
    owner_id: ownerId,
    source_session_id: template.session_id,
    motion_template_id: template.template_id,
    capture_mode: template.capture_mode,
    created_at: new Date().toISOString(),
    display_name: displayName,
    description: description || `Reference created from session ${template.session_id.slice(0, 8)}`,
    pose_model_version: template.pose_model_version,
    parameter_algorithm_version: template.parameter_algorithm_version,
    template_schema_version: template.template_schema_version,
    calibration_quality: template.calibration_metadata,
    anthropometric_context: template.anthropometric_context,
    motion_template: template,
  };
}

export const getActiveReference = loadActiveReference;
export const saveReference = async (ref: Reference): Promise<void> => {
  setActiveReferenceId(ref.reference_id);
};

