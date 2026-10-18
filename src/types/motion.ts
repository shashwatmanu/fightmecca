export enum CaptureMode {
  SINGLE = 'SINGLE',
  DUAL = 'DUAL',
  TRIANGLE = 'TRIANGLE',
  SQUARE = 'SQUARE',
  HEXAGON = 'HEXAGON',
  OCTAGON = 'OCTAGON',
  OCTAGON_OVERHEAD = 'OCTAGON_OVERHEAD',
}

export enum ParameterSource {
  CAMERA = 'CAMERA',
  MULTI_CAMERA = 'MULTI_CAMERA',
  WEARABLE = 'WEARABLE',
  FUSED = 'FUSED',
  DERIVED = 'DERIVED',
}

export enum ReferenceType {
  PLATFORM_REFERENCE = 'PLATFORM_REFERENCE',
  COACH_REFERENCE = 'COACH_REFERENCE',
  ATHLETE_REFERENCE = 'ATHLETE_REFERENCE',
}

export interface Landmark {
  landmark_id: number;
  x: number;
  y: number;
  z: number;
  confidence: number;
}

export interface MotionFrame {
  timestamp_ms: number;
  frame_index: number;
  landmarks: Landmark[];
  frame_confidence: number;
}

export interface MotionParameterResult {
  parameter_id: string;
  value: number | null;  // null when not observable, NEVER zero
  unit: string;
  confidence: number;
  observable: boolean;
  source: ParameterSource;
  phase: string | null;
}

export interface AnalysisResult {
  technique_score: number | null;
  analysis_coverage: number;
  measurement_confidence: number;
  parameter_results: MotionParameterResult[];
  detected_weaknesses: string[];
  recommendations: string[];
}

export interface MotionSession {
  session_id: string;
  athlete_id: string;
  technique_id: string | null;
  capture_mode: CaptureMode;
  started_at: string;
  completed_at: string | null;
  calibration_id: string | null;
  anthropometric_profile_id: string | null;
  pose_model_version: string;
  analysis_model_version: string | null;
  frames?: MotionFrame[];
}

export interface ParameterDefinition {
  parameter_id: string;
  name: string;
  description: string;
  technique_family: string;
  technique_phase: string | null;
  unit: string;
  source: ParameterSource;
  formula_version: string;
  normalization_method: string | null;
  personalization_variables: string[];
  expected_range: [number, number] | null;
  hard_constraint: Record<string, unknown> | null;
  soft_constraint: Record<string, unknown> | null;
  importance_weight: number;
  measurement_reliability: number;
  minimum_confidence: number;
  coach_adjustable: boolean;
  validation_status: string;
}
