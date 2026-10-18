import { MovementGroup } from './judgement-types';

export type DeviationStrategy =
  | 'LINEAR_SCALAR'
  | 'ANGLE'
  | 'NORMALIZED_DISTANCE'
  | 'TIMING'
  | 'TRAJECTORY'
  | 'ROTATION_PROXY';

export type DirectionType = 'WIDER_NARROWER' | 'TIMING' | 'HIGHER_LOWER' | 'MORE_LESS' | 'TRAJECTORY';

export interface ParameterJudgementRule {
  parameter_id: string;
  group: MovementGroup;
  strategy: DeviationStrategy;
  direction_type: DirectionType;
  tolerance: number; // Values below tolerance = MATCH
  minor_threshold: number;
  moderate_threshold: number;
  major_threshold: number;
  importance_weight: number; // Provisional importance weight
  description: string;
}

export const JUDGEMENT_ENGINE_VERSION = '1.0.0';
export const JUDGEMENT_CONFIG_VERSION = '1.0.0-provisional';

// Centralized Judgement Configurations for all registered parameters
export const JUDGEMENT_CONFIG: Record<string, ParameterJudgementRule> = {
  // BASE & STANCE
  'stance_width_normalized': {
    parameter_id: 'stance_width_normalized',
    group: 'BASE',
    strategy: 'NORMALIZED_DISTANCE',
    direction_type: 'WIDER_NARROWER',
    tolerance: 0.05,
    minor_threshold: 0.10,
    moderate_threshold: 0.20,
    major_threshold: 0.35,
    importance_weight: 1.2,
    description: 'Stance width normalized by torso length.',
  },
  'pelvis_displacement': {
    parameter_id: 'pelvis_displacement',
    group: 'BASE',
    strategy: 'NORMALIZED_DISTANCE',
    direction_type: 'MORE_LESS',
    tolerance: 0.05,
    minor_threshold: 0.12,
    moderate_threshold: 0.25,
    major_threshold: 0.40,
    importance_weight: 0.9,
    description: 'Pelvis displacement relative to frame reference center.',
  },

  // LOWER BODY
  'joint_angle_left_knee': {
    parameter_id: 'joint_angle_left_knee',
    group: 'LOWER_BODY',
    strategy: 'ANGLE',
    direction_type: 'HIGHER_LOWER',
    tolerance: 4.0,
    minor_threshold: 8.0,
    moderate_threshold: 18.0,
    major_threshold: 32.0,
    importance_weight: 1.0,
    description: 'Left knee extension/flexion joint angle.',
  },
  'joint_angle_right_knee': {
    parameter_id: 'joint_angle_right_knee',
    group: 'LOWER_BODY',
    strategy: 'ANGLE',
    direction_type: 'HIGHER_LOWER',
    tolerance: 4.0,
    minor_threshold: 8.0,
    moderate_threshold: 18.0,
    major_threshold: 32.0,
    importance_weight: 1.0,
    description: 'Right knee extension/flexion joint angle.',
  },

  // HIPS & TORSO
  'hip_rotation_proxy': {
    parameter_id: 'hip_rotation_proxy',
    group: 'HIPS',
    strategy: 'ROTATION_PROXY',
    direction_type: 'MORE_LESS',
    tolerance: 5.0,
    minor_threshold: 10.0,
    moderate_threshold: 20.0,
    major_threshold: 35.0,
    importance_weight: 1.3,
    description: 'Hip rotational orientation proxy in camera frame.',
  },
  'shoulder_rotation_proxy': {
    parameter_id: 'shoulder_rotation_proxy',
    group: 'SHOULDERS',
    strategy: 'ROTATION_PROXY',
    direction_type: 'MORE_LESS',
    tolerance: 5.0,
    minor_threshold: 10.0,
    moderate_threshold: 20.0,
    major_threshold: 35.0,
    importance_weight: 1.2,
    description: 'Shoulder line rotational orientation proxy.',
  },
  'shoulder_hip_twist_delta': {
    parameter_id: 'shoulder_hip_twist_delta',
    group: 'KINETIC_CHAIN',
    strategy: 'ROTATION_PROXY',
    direction_type: 'MORE_LESS',
    tolerance: 4.0,
    minor_threshold: 8.0,
    moderate_threshold: 16.0,
    major_threshold: 30.0,
    importance_weight: 1.4,
    description: 'Kinetic chain twist difference between shoulders and hips.',
  },

  // ARMS
  'joint_angle_left_elbow': {
    parameter_id: 'joint_angle_left_elbow',
    group: 'ARMS',
    strategy: 'ANGLE',
    direction_type: 'HIGHER_LOWER',
    tolerance: 5.0,
    minor_threshold: 10.0,
    moderate_threshold: 22.0,
    major_threshold: 38.0,
    importance_weight: 1.1,
    description: 'Left elbow joint angle.',
  },
  'joint_angle_right_elbow': {
    parameter_id: 'joint_angle_right_elbow',
    group: 'ARMS',
    strategy: 'ANGLE',
    direction_type: 'HIGHER_LOWER',
    tolerance: 5.0,
    minor_threshold: 10.0,
    moderate_threshold: 22.0,
    major_threshold: 38.0,
    importance_weight: 1.5,
    description: 'Right elbow joint extension/flexion angle.',
  },
  'joint_angle_left_shoulder': {
    parameter_id: 'joint_angle_left_shoulder',
    group: 'ARMS',
    strategy: 'ANGLE',
    direction_type: 'HIGHER_LOWER',
    tolerance: 5.0,
    minor_threshold: 10.0,
    moderate_threshold: 20.0,
    major_threshold: 35.0,
    importance_weight: 1.0,
    description: 'Left shoulder joint angle.',
  },
  'joint_angle_right_shoulder': {
    parameter_id: 'joint_angle_right_shoulder',
    group: 'ARMS',
    strategy: 'ANGLE',
    direction_type: 'HIGHER_LOWER',
    tolerance: 5.0,
    minor_threshold: 10.0,
    moderate_threshold: 20.0,
    major_threshold: 35.0,
    importance_weight: 1.1,
    description: 'Right shoulder joint angle.',
  },

  // HANDS
  'wrist_left_to_shoulder_dist': {
    parameter_id: 'wrist_left_to_shoulder_dist',
    group: 'HANDS',
    strategy: 'NORMALIZED_DISTANCE',
    direction_type: 'WIDER_NARROWER',
    tolerance: 0.05,
    minor_threshold: 0.10,
    moderate_threshold: 0.22,
    major_threshold: 0.38,
    importance_weight: 1.0,
    description: '3D distance from left wrist to left shoulder.',
  },
  'wrist_right_to_shoulder_dist': {
    parameter_id: 'wrist_right_to_shoulder_dist',
    group: 'HANDS',
    strategy: 'NORMALIZED_DISTANCE',
    direction_type: 'WIDER_NARROWER',
    tolerance: 0.05,
    minor_threshold: 0.10,
    moderate_threshold: 0.22,
    major_threshold: 0.38,
    importance_weight: 1.3,
    description: '3D distance from right wrist to right shoulder.',
  },
  'wrist_right_velocity': {
    parameter_id: 'wrist_right_velocity',
    group: 'HANDS',
    strategy: 'TRAJECTORY',
    direction_type: 'MORE_LESS',
    tolerance: 0.10,
    minor_threshold: 0.25,
    moderate_threshold: 0.50,
    major_threshold: 0.85,
    importance_weight: 1.4,
    description: 'Right wrist velocity trajectory profile.',
  },
  'wrist_left_velocity': {
    parameter_id: 'wrist_left_velocity',
    group: 'HANDS',
    strategy: 'TRAJECTORY',
    direction_type: 'MORE_LESS',
    tolerance: 0.10,
    minor_threshold: 0.25,
    moderate_threshold: 0.50,
    major_threshold: 0.85,
    importance_weight: 1.0,
    description: 'Left wrist velocity trajectory profile.',
  },
};
