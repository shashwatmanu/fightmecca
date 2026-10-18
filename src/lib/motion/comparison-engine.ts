import { MotionTemplate, normalizeMotionTemplateFromApi } from './template';
import { Reference } from './reference';
import { CalibrationEvaluation } from './calibration';
import { createDefaultProfile } from './anthropometry';
import { PARAMETER_REGISTRY, MotionParameterResult } from './parameters';
import { resampleParameterTrajectory, resampleLandmarkTrajectory, NORMALIZED_GRID_STEPS } from './temporal-alignment';
import { compareKeyEvents, compareGenericPhases, EventComparisonResult, PhaseComparisonResult } from './phase-alignment';
import { MEDIAPIPE_LANDMARKS } from './mediapipe-adapter';
import { distance3D, Vector3D } from './geometry';

export type AnthropometricCompatibility = 'SAME_PROFILE' | 'NORMALIZED_CROSS_ATHLETE' | 'INSUFFICIENT_CONTEXT';

export interface ParameterComparisonResult {
  parameter_id: string;
  name: string;
  category: string;
  unit: string;
  reference_mean: number | null;
  attempt_mean: number | null;
  reference_peak: number | null;
  attempt_peak: number | null;
  mean_absolute_difference: number | null;
  root_mean_square_difference: number | null;
  peak_difference: number | null;
  trajectory_correlation: number | null; // Pearson r [-1.0, 1.0]
  confidence: number;
  observable: boolean;
}

export interface LandmarkTrajectoryComparisonResult {
  landmark_id: number;
  landmark_name: string;
  mean_euclidean_distance: number | null; // in torso units
  peak_euclidean_distance: number | null;
  confidence: number;
}

export interface ReferenceComparisonResult {
  comparison_id: string;
  reference_id: string;
  attempt_session_id: string;
  technique_id: string;
  same_athlete_reference: boolean;
  anthropometric_compatibility: AnthropometricCompatibility;
  reference_duration_ms: number;
  attempt_duration_ms: number;
  duration_ratio: number; // attempt_duration / ref_duration
  compared_parameter_count: number;
  total_reference_parameter_count: number;
  total_attempt_parameter_count: number;
  parameter_overlap_percentage: number;
  comparison_coverage: number; // Percentage of total global registry parameters compared
  comparison_confidence: number; // Overall comparison confidence score [0.0, 1.0]
  compatibility_warnings: string[];
  event_comparisons: EventComparisonResult[];
  phase_comparisons: PhaseComparisonResult[];
  parameter_comparisons: ParameterComparisonResult[];
  landmark_trajectory_comparisons: LandmarkTrajectoryComparisonResult[];
  metadata: {
    reference_template_version: string;
    attempt_template_version: string;
    parameter_algorithm_version: string;
    comparison_algorithm_version: string;
    pose_model_version: string;
    created_at: string;
  };
}

/**
 * Calculates Pearson Correlation Coefficient (r) between two equal-length numeric arrays.
 */
export function calculatePearsonCorrelation(x: number[], y: number[]): number | null {
  if (x.length !== y.length || x.length < 2) return null;
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  if (den === 0) return 1.0; // Identical flat signals
  return Number((num / den).toFixed(3));
}

/**
 * Compares an Attempt MotionTemplate against an Active Reference.
 * Generates canonical ReferenceComparisonResult with zero red/green technique scoring.
 */
export function compareMotionTemplates(
  reference: Reference,
  attTemplate: MotionTemplate
): ReferenceComparisonResult {
  const refTemplate: MotionTemplate = reference.motion_template
    ? normalizeMotionTemplateFromApi(reference.motion_template, reference)
    : normalizeMotionTemplateFromApi({}, reference);

  const normalizedAttemptTemplate: MotionTemplate = normalizeMotionTemplateFromApi(attTemplate);
  attTemplate = normalizedAttemptTemplate;

  console.log('[P5-TEMPLATE-SHAPE]', {
    reference: {
      id: reference.reference_id,
      parameterTimeSeriesType: typeof refTemplate.parameter_time_series,
      isArray: Array.isArray(refTemplate.parameter_time_series),
      keys: refTemplate.parameter_time_series && typeof refTemplate.parameter_time_series === 'object' ? Object.keys(refTemplate.parameter_time_series) : [],
      sample: Array.isArray(refTemplate.parameter_time_series) ? refTemplate.parameter_time_series.slice(0, 2) : refTemplate.parameter_time_series,
    },
    attempt: {
      id: normalizedAttemptTemplate.template_id,
      parameterTimeSeriesType: typeof normalizedAttemptTemplate.parameter_time_series,
      isArray: Array.isArray(normalizedAttemptTemplate.parameter_time_series),
      keys: normalizedAttemptTemplate.parameter_time_series && typeof normalizedAttemptTemplate.parameter_time_series === 'object' ? Object.keys(normalizedAttemptTemplate.parameter_time_series) : [],
      sample: Array.isArray(normalizedAttemptTemplate.parameter_time_series) ? normalizedAttemptTemplate.parameter_time_series.slice(0, 2) : normalizedAttemptTemplate.parameter_time_series,
    },
  });

  const warnings: string[] = [];

  // 1. Compatibility & Warning Checks
  if (refTemplate.technique_id !== attTemplate.technique_id) {
    warnings.push(`Technique mismatch: Reference (${refTemplate.technique_id}) vs Attempt (${attTemplate.technique_id})`);
  }

  if (refTemplate.calibration_metadata.status !== attTemplate.calibration_metadata.status) {
    warnings.push(`Calibration status difference: Reference is ${refTemplate.calibration_metadata.status}, Attempt is ${attTemplate.calibration_metadata.status}`);
  }

  const sameAthlete = refTemplate.athlete_id === attTemplate.athlete_id;
  let anthroCompat: AnthropometricCompatibility = 'SAME_PROFILE';

  if (!sameAthlete) {
    const refHasHeight = refTemplate.anthropometric_context?.height_cm?.value !== null;
    const attHasHeight = attTemplate.anthropometric_context?.height_cm?.value !== null;
    anthroCompat = refHasHeight && attHasHeight ? 'NORMALIZED_CROSS_ATHLETE' : 'INSUFFICIENT_CONTEXT';
    if (anthroCompat === 'INSUFFICIENT_CONTEXT') {
      warnings.push('Cross-athlete comparison performed using default torso scale; missing explicit height profile.');
    }
  }

  // 2. Temporal & Event Alignment
  const eventComparisons = compareKeyEvents(refTemplate, attTemplate);
  const phaseComparisons = compareGenericPhases(refTemplate, attTemplate, eventComparisons);

  // 3. Parameter Trajectory Comparison
  const totalRegistryCount = Object.keys(PARAMETER_REGISTRY).length;
  const refParams = refTemplate.parameter_time_series || [];
  const attParams = attTemplate.parameter_time_series || [];

  const refParamIds = new Set(refParams.filter((p) => p.observable).map((p) => p.parameter_id));
  const attParamIds = new Set(attParams.filter((p) => p.observable).map((p) => p.parameter_id));

  // Find overlapping parameter IDs
  const overlappingIds = Array.from(refParamIds).filter((id) => attParamIds.has(id));

  const paramComparisons: ParameterComparisonResult[] = [];

  for (const paramId of Object.keys(PARAMETER_REGISTRY)) {
    const def = PARAMETER_REGISTRY[paramId];
    const isOverlapping = refParamIds.has(paramId) && attParamIds.has(paramId);

    if (!isOverlapping) {
      paramComparisons.push({
        parameter_id: paramId,
        name: def.name,
        category: def.category,
        unit: def.unit,
        reference_mean: null,
        attempt_mean: null,
        reference_peak: null,
        attempt_peak: null,
        mean_absolute_difference: null,
        root_mean_square_difference: null,
        peak_difference: null,
        trajectory_correlation: null,
        confidence: 0.0,
        observable: false,
      });
      continue;
    }

    // Resample both reference and attempt parameter time-series onto 101-point grid
    const refResampled = resampleParameterTrajectory(paramId, refParams);
    const attResampled = resampleParameterTrajectory(paramId, attParams);

    const refVals = refResampled.grid_points.map((g) => g.value as number);
    const attVals = attResampled.grid_points.map((g) => g.value as number);

    const refMean = refVals.reduce((a, b) => a + b, 0) / refVals.length;
    const attMean = attVals.reduce((a, b) => a + b, 0) / attVals.length;

    const refPeak = Math.max(...refVals);
    const attPeak = Math.max(...attVals);

    // Calculate Mean Absolute Difference (MAD)
    let sumAbsDiff = 0;
    let sumSqDiff = 0;

    for (let i = 0; i < NORMALIZED_GRID_STEPS; i++) {
      const diff = Math.abs(attVals[i] - refVals[i]);
      sumAbsDiff += diff;
      sumSqDiff += diff * diff;
    }

    const mad = Number((sumAbsDiff / NORMALIZED_GRID_STEPS).toFixed(2));
    const rmsd = Number((Math.sqrt(sumSqDiff / NORMALIZED_GRID_STEPS)).toFixed(2));
    const peakDiff = Number((attPeak - refPeak).toFixed(2));
    const corr = calculatePearsonCorrelation(refVals, attVals);

    paramComparisons.push({
      parameter_id: paramId,
      name: def.name,
      category: def.category,
      unit: def.unit,
      reference_mean: Number(refMean.toFixed(2)),
      attempt_mean: Number(attMean.toFixed(2)),
      reference_peak: Number(refPeak.toFixed(2)),
      attempt_peak: Number(attPeak.toFixed(2)),
      mean_absolute_difference: mad,
      root_mean_square_difference: rmsd,
      peak_difference: peakDiff,
      trajectory_correlation: corr,
      confidence: 0.9,
      observable: true,
    });
  }

  // 4. Landmark Trajectory Comparison
  const keyLandmarksToCompare = [
    { id: MEDIAPIPE_LANDMARKS.LEFT_WRIST, name: 'Left Wrist' },
    { id: MEDIAPIPE_LANDMARKS.RIGHT_WRIST, name: 'Right Wrist' },
    { id: MEDIAPIPE_LANDMARKS.LEFT_SHOULDER, name: 'Left Shoulder' },
    { id: MEDIAPIPE_LANDMARKS.RIGHT_SHOULDER, name: 'Right Shoulder' },
    { id: MEDIAPIPE_LANDMARKS.LEFT_HIP, name: 'Pelvis (Left Hip)' },
  ];

  const landmarkComparisons: LandmarkTrajectoryComparisonResult[] = [];

  for (const { id, name } of keyLandmarksToCompare) {
    const refLmResampled = resampleLandmarkTrajectory(id, refTemplate.normalized_frames || []);
    const attLmResampled = resampleLandmarkTrajectory(id, attTemplate.normalized_frames || []);

    let sumDist = 0;
    let maxDist = 0;
    let validCount = 0;

    for (let i = 0; i < NORMALIZED_GRID_STEPS; i++) {
      const pRef = refLmResampled.grid_points[i].point;
      const pAtt = attLmResampled.grid_points[i].point;

      if (pRef && pAtt) {
        const d = distance3D(pAtt, pRef);
        sumDist += d;
        if (d > maxDist) maxDist = d;
        validCount++;
      }
    }

    if (validCount > 0) {
      landmarkComparisons.push({
        landmark_id: id,
        landmark_name: name,
        mean_euclidean_distance: Number((sumDist / validCount).toFixed(3)),
        peak_euclidean_distance: Number(maxDist.toFixed(3)),
        confidence: 0.9,
      });
    } else {
      landmarkComparisons.push({
        landmark_id: id,
        landmark_name: name,
        mean_euclidean_distance: null,
        peak_euclidean_distance: null,
        confidence: 0.0,
      });
    }
  }

  // 5. Coverage & Confidence Calculations
  const comparedCount = paramComparisons.filter((p) => p.observable).length;
  const overlapPct = Number(((comparedCount / Math.max(1, refParamIds.size)) * 100).toFixed(1));
  const coveragePct = Number(((comparedCount / totalRegistryCount) * 100).toFixed(1));

  const refCalConf = refTemplate.calibration_metadata.confidence || 0.8;
  const attCalConf = attTemplate.calibration_metadata.confidence || 0.8;

  const eventAvailCount = eventComparisons.filter((e) => e.observable).length;
  const eventFactor = eventAvailCount / eventComparisons.length;

  const compConfidence = Number((refCalConf * attCalConf * (comparedCount > 0 ? 0.9 : 0.4) * (0.7 + 0.3 * eventFactor)).toFixed(2));

  const refDur = refTemplate.duration_ms || 1;
  const attDur = attTemplate.duration_ms || 1;
  const durRatio = Number((attDur / refDur).toFixed(2));

  return {
    comparison_id: `cmp_${crypto.randomUUID()}`,
    reference_id: reference.reference_id,
    attempt_session_id: attTemplate.session_id,
    technique_id: refTemplate.technique_id,
    same_athlete_reference: sameAthlete,
    anthropometric_compatibility: anthroCompat,
    reference_duration_ms: refDur,
    attempt_duration_ms: attDur,
    duration_ratio: durRatio,
    compared_parameter_count: comparedCount,
    total_reference_parameter_count: refParamIds.size,
    total_attempt_parameter_count: attParamIds.size,
    parameter_overlap_percentage: overlapPct,
    comparison_coverage: coveragePct,
    comparison_confidence: compConfidence,
    compatibility_warnings: warnings,
    event_comparisons: eventComparisons,
    phase_comparisons: phaseComparisons,
    parameter_comparisons: paramComparisons,
    landmark_trajectory_comparisons: landmarkComparisons,
    metadata: {
      reference_template_version: refTemplate.template_schema_version,
      attempt_template_version: attTemplate.template_schema_version,
      parameter_algorithm_version: attTemplate.parameter_algorithm_version,
      comparison_algorithm_version: '1.0.0',
      pose_model_version: attTemplate.pose_model_version,
      created_at: new Date().toISOString(),
    },
  };
}
