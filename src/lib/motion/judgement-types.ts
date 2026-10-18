import { ReferenceType } from './reference';

export type JudgementStatus = 'COMPLETE' | 'DEGRADED' | 'INSUFFICIENT_DATA';

export type MovementGroup =
  | 'BASE'
  | 'LOWER_BODY'
  | 'HIPS'
  | 'TORSO'
  | 'SHOULDERS'
  | 'ARMS'
  | 'HANDS'
  | 'TIMING'
  | 'KINETIC_CHAIN';

export type DeviationDirection =
  | 'HIGHER'
  | 'LOWER'
  | 'EARLIER'
  | 'LATER'
  | 'WIDER'
  | 'NARROWER'
  | 'MORE'
  | 'LESS'
  | 'DIFFERENT_PATTERN'
  | 'SIMILAR'
  | 'UNKNOWN';

export type DeviationSignificance = 'MATCH' | 'MINOR' | 'MODERATE' | 'MAJOR' | 'UNOBSERVABLE';

export interface ParameterJudgement {
  parameter_id: string;
  parameter_name: string;
  parameter_group: MovementGroup;
  unit: string;
  reference_summary: {
    mean: number | null;
    peak: number | null;
  };
  attempt_summary: {
    mean: number | null;
    peak: number | null;
  };
  deviation_metrics: {
    mad: number | null;
    rmsd: number | null;
    peak_diff: number | null;
    correlation: number | null;
  };
  deviation_direction: DeviationDirection;
  deviation_magnitude: number; // [0.0, 1.0]
  effective_deviation: number; // deviation_magnitude * confidence
  similarity: number | null; // [0.0, 100.0] %
  confidence: number; // [0.0, 1.0]
  observability: boolean;
  significance: DeviationSignificance;
  importance_weight: number;
  explanation: string;
  evidence: string;
}

export interface GroupJudgement {
  group: MovementGroup;
  label: string;
  similarity: number | null; // [0.0, 100.0] %
  confidence: number; // [0.0, 1.0]
  observable_parameter_count: number;
  total_parameter_count: number;
  significant_deviations: string[]; // Parameter names with MODERATE or MAJOR deviation
  status: 'OBSERVABLE' | 'DEGRADED' | 'UNOBSERVABLE';
}

export interface KeyDeviation {
  parameter_id: string;
  parameter_name: string;
  group: MovementGroup;
  direction: DeviationDirection;
  significance: DeviationSignificance;
  confidence: number;
  deviation_magnitude: number;
  reference_value: string;
  attempt_value: string;
  explanation: string;
  score_rank: number;
}

export interface PositiveMatch {
  parameter_id: string;
  parameter_name: string;
  group: MovementGroup;
  similarity: number;
  confidence: number;
  explanation: string;
}

export interface InsufficientEvidence {
  feature_id: string;
  feature_name: string;
  category: string;
  reason: string;
}

export interface TechniqueJudgement {
  judgement_id: string;
  technique_id: string;
  reference_id: string;
  attempt_session_id: string;
  comparison_id: string;
  engine_version: string;
  reference_type: ReferenceType;

  status: JudgementStatus;
  confidence: number; // [0.0, 1.0]
  coverage: number; // [0.0, 100.0] %
  reference_similarity: number | null; // [0.0, 100.0] %

  parameter_judgements: ParameterJudgement[];
  group_judgements: GroupJudgement[];
  key_deviations: KeyDeviation[];
  positive_matches: PositiveMatch[];
  insufficient_evidence: InsufficientEvidence[];

  metadata: {
    judgement_config_version: string;
    parameter_registry_version: string;
    comparison_engine_version: string;
    pose_model_version: string;
    created_at: string;
  };
}
