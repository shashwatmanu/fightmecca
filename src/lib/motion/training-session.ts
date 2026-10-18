import { MotionSession, CaptureMode } from '@/types/motion';
import { CalibrationEvaluation } from './calibration';
import { TechniqueJudgement } from './judgement-types';

export type TrainingMode = 'TECHNIQUE' | 'SHADOWBOXING' | 'PUNCH_BAG';

export type TrainingDrillType = 'FREE_SHADOWBOXING' | 'CROSS_DRILL' | 'FREE_BAG';

export type TrainingSessionStatus =
  | 'SETUP'
  | 'CALIBRATING'
  | 'COUNTDOWN'
  | 'RECORDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'ERROR';

export type BagDistance = 'CLOSE' | 'MEDIUM' | 'FAR';

export interface TargetRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BagContext {
  target_region: TargetRegion;
  bag_distance_estimate: BagDistance;
  calibration_timestamp: string;
}

export interface TrainingSessionSummary {
  duration_actual_sec: number;
  total_frames: number;
  usable_frames: number;
  avg_confidence: number;
  calibration_quality: string;
  reference_similarity?: number | null;
  key_deviations_count?: number;
}

export interface TrainingSession {
  training_session_id: string;
  mode: TrainingMode;
  drill_type: TrainingDrillType;
  athlete_id: string;
  technique_id?: string;
  reference_id?: string;
  capture_session_id?: string;
  comparison_id?: string;
  judgement_id?: string;
  duration_target_sec: number;
  started_at: string;
  completed_at?: string;
  motion_session_id?: string;
  motion_session?: MotionSession;
  calibration?: CalibrationEvaluation;
  bag_context?: BagContext;
  judgement?: TechniqueJudgement;
  summary_stats?: TrainingSessionSummary;
  created_at: string;
}

/**
 * Fetches recent training sessions from backend API (PostgreSQL database).
 */
export async function fetchRecentTrainingSessions(mode?: string): Promise<TrainingSession[]> {
  try {
    const url = mode ? `http://localhost:8000/api/training/sessions?mode=${mode}` : 'http://localhost:8000/api/training/sessions';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return data.map(mapDbRecordToTrainingSession);
    }
  } catch (err) {
    console.warn('Failed to fetch training sessions from backend API:', err);
  }
  return [];
}

export function mapDbRecordToTrainingSession(data: any): TrainingSession {
  return {
    training_session_id: data.id || data.training_session_id,
    mode: data.mode || 'TECHNIQUE',
    drill_type: data.drill_type || 'CROSS_DRILL',
    athlete_id: data.athlete_id || '00000000-0000-0000-0000-000000000001',
    technique_id: data.technique_id,
    reference_id: data.reference_id,
    capture_session_id: data.capture_session_id,
    comparison_id: data.comparison_id,
    judgement_id: data.judgement_id,
    duration_target_sec: data.duration_target_sec || 60,
    started_at: data.started_at || new Date().toISOString(),
    summary_stats: data.summary_stats,
    created_at: data.created_at || new Date().toISOString(),
  };
}

export const getRecentTrainingSessions = fetchRecentTrainingSessions;
export const saveTrainingSession = async (session: TrainingSession): Promise<void> => {
  try {
    await fetch('http://localhost:8000/api/training/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    });
  } catch (err) {
    console.warn('Failed to save training session:', err);
  }
};


