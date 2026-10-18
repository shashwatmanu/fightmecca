import { ReferenceComparisonResult, ParameterComparisonResult } from './comparison-engine';
import { Reference } from './reference';
import {
  TechniqueJudgement,
  ParameterJudgement,
  GroupJudgement,
  KeyDeviation,
  PositiveMatch,
  InsufficientEvidence,
  MovementGroup,
  DeviationDirection,
  DeviationSignificance,
  JudgementStatus,
} from './judgement-types';
import { JUDGEMENT_CONFIG, JUDGEMENT_ENGINE_VERSION, JUDGEMENT_CONFIG_VERSION } from './judgement-config';
import { generateParameterExplanation, generateTimingEventExplanation, generateGroupExplanation } from './explanation-generator';

const GROUP_LABELS: Record<MovementGroup, string> = {
  BASE: 'Base & Stance',
  LOWER_BODY: 'Lower Body (Knees/Legs)',
  HIPS: 'Hips & Pelvis Rotation',
  TORSO: 'Torso Alignment',
  SHOULDERS: 'Shoulder Line Rotation',
  ARMS: 'Arms & Elbow Extensions',
  HANDS: 'Hands & Guard Kinematics',
  TIMING: 'Movement Timing & Cadence',
  KINETIC_CHAIN: 'Kinetic Chain Twist Delta',
};

/**
 * Evaluates a ReferenceComparisonResult and produces a fully explainable TechniqueJudgement.
 */
export function evaluateTechniqueJudgement(
  compResult: ReferenceComparisonResult,
  reference: Reference
): TechniqueJudgement {
  const paramJudgements: ParameterJudgement[] = [];
  const keyDeviations: KeyDeviation[] = [];
  const positiveMatches: PositiveMatch[] = [];
  const insufficientEvidence: InsufficientEvidence[] = [];

  // 1. Process Parameter Comparisons
  for (const comp of compResult.parameter_comparisons) {
    const config = JUDGEMENT_CONFIG[comp.parameter_id] || {
      parameter_id: comp.parameter_id,
      group: 'ARMS' as MovementGroup,
      strategy: 'LINEAR_SCALAR',
      direction_type: 'HIGHER_LOWER',
      tolerance: 0.1,
      minor_threshold: 0.2,
      moderate_threshold: 0.4,
      major_threshold: 0.8,
      importance_weight: 1.0,
      description: comp.name,
    };

    if (!comp.observable || comp.confidence < 0.35 || comp.attempt_mean === null || comp.reference_mean === null) {
      paramJudgements.push({
        parameter_id: comp.parameter_id,
        parameter_name: comp.name,
        parameter_group: config.group,
        unit: comp.unit,
        reference_summary: { mean: comp.reference_mean, peak: comp.reference_peak },
        attempt_summary: { mean: comp.attempt_mean, peak: comp.attempt_peak },
        deviation_metrics: {
          mad: comp.mean_absolute_difference,
          rmsd: comp.root_mean_square_difference,
          peak_diff: comp.peak_difference,
          correlation: comp.trajectory_correlation,
        },
        deviation_direction: 'UNKNOWN',
        deviation_magnitude: 0.0,
        effective_deviation: 0.0,
        similarity: null,
        confidence: comp.confidence,
        observability: false,
        significance: 'UNOBSERVABLE',
        importance_weight: config.importance_weight,
        explanation: `Insufficient reliable landmark evidence was available to judge ${comp.name.toLowerCase()}.`,
        evidence: 'Landmark confidence below threshold (0.35).',
      });

      insufficientEvidence.push({
        feature_id: comp.parameter_id,
        feature_name: comp.name,
        category: config.group,
        reason: 'Low landmark observation confidence or occluded joint.',
      });
      continue;
    }

    // Determine Direction
    let direction: DeviationDirection = 'SIMILAR';
    const mad = comp.mean_absolute_difference ?? 0;
    const diff = comp.attempt_mean - comp.reference_mean;

    if (mad <= config.tolerance) {
      direction = 'SIMILAR';
    } else {
      switch (config.direction_type) {
        case 'WIDER_NARROWER':
          direction = diff > 0 ? 'WIDER' : 'NARROWER';
          break;
        case 'HIGHER_LOWER':
          direction = diff > 0 ? 'HIGHER' : 'LOWER';
          break;
        case 'MORE_LESS':
          direction = diff > 0 ? 'MORE' : 'LESS';
          break;
        case 'TRAJECTORY':
          direction = comp.trajectory_correlation !== null && comp.trajectory_correlation < 0.6 ? 'DIFFERENT_PATTERN' : (diff > 0 ? 'HIGHER' : 'LOWER');
          break;
        default:
          direction = diff > 0 ? 'HIGHER' : 'LOWER';
      }
    }

    // Calculate Normalized Deviation Magnitude [0.0, 1.0]
    let rawMag = mad / Math.max(0.001, config.major_threshold);
    if (config.strategy === 'TRAJECTORY' && comp.trajectory_correlation !== null) {
      const corrPenalty = Math.max(0, 1.0 - comp.trajectory_correlation);
      rawMag = Math.max(rawMag, corrPenalty);
    }
    const devMag = Number(Math.min(1.0, Math.max(0.0, rawMag)).toFixed(2));
    const effectiveDev = Number((devMag * comp.confidence).toFixed(2));

    // Determine Significance Level
    let sig: DeviationSignificance = 'MATCH';
    if (effectiveDev < 0.10) {
      sig = 'MATCH';
    } else if (effectiveDev < 0.30) {
      sig = 'MINOR';
    } else if (effectiveDev < 0.60) {
      sig = 'MODERATE';
    } else {
      sig = 'MAJOR';
    }

    const similarityVal = Number(Math.max(0, (1.0 - devMag) * 100).toFixed(1));
    const explanationStr = generateParameterExplanation(
      comp.name,
      direction,
      sig,
      comp.reference_mean,
      comp.attempt_mean,
      comp.unit
    );

    const paramJudgementObj: ParameterJudgement = {
      parameter_id: comp.parameter_id,
      parameter_name: comp.name,
      parameter_group: config.group,
      unit: comp.unit,
      reference_summary: { mean: comp.reference_mean, peak: comp.reference_peak },
      attempt_summary: { mean: comp.attempt_mean, peak: comp.attempt_peak },
      deviation_metrics: {
        mad: comp.mean_absolute_difference,
        rmsd: comp.root_mean_square_difference,
        peak_diff: comp.peak_difference,
        correlation: comp.trajectory_correlation,
      },
      deviation_direction: direction,
      deviation_magnitude: devMag,
      effective_deviation: effectiveDev,
      similarity: similarityVal,
      confidence: comp.confidence,
      observability: true,
      significance: sig,
      importance_weight: config.importance_weight,
      explanation: explanationStr,
      evidence: `MAD: ${mad} ${comp.unit}, Peak Diff: ${comp.peak_difference ?? 0} ${comp.unit}, Corr: ${comp.trajectory_correlation ?? 'N/A'}.`,
    };

    paramJudgements.push(paramJudgementObj);

    // Rank Key Deviations (MODERATE & MAJOR)
    if (sig === 'MODERATE' || sig === 'MAJOR') {
      const scoreRank = Number((devMag * comp.confidence * config.importance_weight).toFixed(3));
      keyDeviations.push({
        parameter_id: comp.parameter_id,
        parameter_name: comp.name,
        group: config.group,
        direction,
        significance: sig,
        confidence: comp.confidence,
        deviation_magnitude: devMag,
        reference_value: `${comp.reference_mean} ${comp.unit}`,
        attempt_value: `${comp.attempt_mean} ${comp.unit}`,
        explanation: explanationStr,
        score_rank: scoreRank,
      });
    }

    // Collect Positive Matches
    if (sig === 'MATCH' || similarityVal >= 85) {
      positiveMatches.push({
        parameter_id: comp.parameter_id,
        parameter_name: comp.name,
        group: config.group,
        similarity: similarityVal,
        confidence: comp.confidence,
        explanation: `${comp.name} closely matched reference trajectory (${similarityVal}% similarity).`,
      });
    }
  }

  // Sort Key Deviations descending by score_rank
  keyDeviations.sort((a, b) => b.score_rank - a.score_rank);
  // Sort Positive Matches descending by similarity
  positiveMatches.sort((a, b) => b.similarity - a.similarity);

  // 2. Process Group Judgements
  const allGroups: MovementGroup[] = ['BASE', 'LOWER_BODY', 'HIPS', 'TORSO', 'SHOULDERS', 'ARMS', 'HANDS', 'TIMING', 'KINETIC_CHAIN'];
  const groupJudgements: GroupJudgement[] = [];

  for (const groupKey of allGroups) {
    const paramsInGroup = paramJudgements.filter((p) => p.parameter_group === groupKey);
    const obsParams = paramsInGroup.filter((p) => p.observability && p.similarity !== null);

    if (groupKey === 'TIMING') {
      // Special handling for timing events
      const timingEvents = compResult.event_comparisons || [];
      const obsEvents = timingEvents.filter((e) => e.observable);
      const totalCount = Math.max(1, timingEvents.length);
      const obsCount = obsEvents.length;

      if (obsCount === 0) {
        groupJudgements.push({
          group: groupKey,
          label: GROUP_LABELS[groupKey],
          similarity: null,
          confidence: 0.0,
          observable_parameter_count: 0,
          total_parameter_count: totalCount,
          significant_deviations: [],
          status: 'UNOBSERVABLE',
        });
      } else {
        const avgNormDelta = obsEvents.reduce((acc, e) => acc + Math.abs(e.delta_normalized_time ?? 0), 0) / obsCount;
        const timingSim = Number(Math.max(0, (1.0 - avgNormDelta / 0.3) * 100).toFixed(1));
        const sigDevs = obsEvents
          .filter((e) => Math.abs(e.delta_normalized_time ?? 0) > 0.08)
          .map((e) => e.label);

        groupJudgements.push({
          group: groupKey,
          label: GROUP_LABELS[groupKey],
          similarity: timingSim,
          confidence: 0.85,
          observable_parameter_count: obsCount,
          total_parameter_count: totalCount,
          significant_deviations: sigDevs,
          status: obsCount === totalCount ? 'OBSERVABLE' : 'DEGRADED',
        });
      }
      continue;
    }

    if (obsParams.length === 0) {
      groupJudgements.push({
        group: groupKey,
        label: GROUP_LABELS[groupKey],
        similarity: null,
        confidence: 0.0,
        observable_parameter_count: 0,
        total_parameter_count: paramsInGroup.length,
        significant_deviations: [],
        status: 'UNOBSERVABLE',
      });
    } else {
      let weightedSimSum = 0;
      let weightSum = 0;
      let confSum = 0;

      for (const p of obsParams) {
        const w = p.importance_weight;
        weightedSimSum += (p.similarity ?? 0) * w;
        weightSum += w;
        confSum += p.confidence;
      }

      const groupSim = Number((weightedSimSum / Math.max(0.001, weightSum)).toFixed(1));
      const groupConf = Number((confSum / obsParams.length).toFixed(2));
      const sigDevs = obsParams
        .filter((p) => p.significance === 'MODERATE' || p.significance === 'MAJOR')
        .map((p) => p.parameter_name);

      groupJudgements.push({
        group: groupKey,
        label: GROUP_LABELS[groupKey],
        similarity: groupSim,
        confidence: groupConf,
        observable_parameter_count: obsParams.length,
        total_parameter_count: paramsInGroup.length,
        significant_deviations: sigDevs,
        status: obsParams.length === paramsInGroup.length ? 'OBSERVABLE' : 'DEGRADED',
      });
    }
  }

  // 3. Overall Reference Similarity & Status
  const obsParamsGlobal = paramJudgements.filter((p) => p.observability && p.similarity !== null);
  let overallSimilarity: number | null = null;

  if (obsParamsGlobal.length > 0) {
    const totalW = obsParamsGlobal.reduce((acc, p) => acc + p.importance_weight, 0);
    const sumSimW = obsParamsGlobal.reduce((acc, p) => acc + (p.similarity ?? 0) * p.importance_weight, 0);
    overallSimilarity = Number((sumSimW / Math.max(0.001, totalW)).toFixed(1));
  }

  const coveragePct = compResult.comparison_coverage;
  const overallConf = compResult.comparison_confidence;

  let status: JudgementStatus = 'COMPLETE';
  if (coveragePct < 30.0 || obsParamsGlobal.length === 0) {
    status = 'INSUFFICIENT_DATA';
  } else if (coveragePct < 70.0 || overallConf < 0.70) {
    status = 'DEGRADED';
  }

  return {
    judgement_id: `jdg_${crypto.randomUUID()}`,
    technique_id: compResult.technique_id,
    reference_id: compResult.reference_id,
    attempt_session_id: compResult.attempt_session_id,
    comparison_id: compResult.comparison_id,
    engine_version: JUDGEMENT_ENGINE_VERSION,
    reference_type: reference.reference_type,

    status,
    confidence: overallConf,
    coverage: coveragePct,
    reference_similarity: overallSimilarity,

    parameter_judgements: paramJudgements,
    group_judgements: groupJudgements,
    key_deviations: keyDeviations,
    positive_matches: positiveMatches,
    insufficient_evidence: insufficientEvidence,

    metadata: {
      judgement_config_version: JUDGEMENT_CONFIG_VERSION,
      parameter_registry_version: '1.0.0',
      comparison_engine_version: compResult.metadata.comparison_algorithm_version,
      pose_model_version: compResult.metadata.pose_model_version,
      created_at: new Date().toISOString(),
    },
  };
}
