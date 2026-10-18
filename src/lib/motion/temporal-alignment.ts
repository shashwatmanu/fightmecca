import { MotionParameterResult } from './parameters';
import { NormalizedLandmark, NormalizedMotionFrame } from './normalization';
import { Vector3D } from './geometry';

export const NORMALIZED_GRID_STEPS = 101; // 0.00 to 1.00 in 0.01 increments

export interface ResampledPoint {
  normalized_time: number; // 0.00 to 1.00
  value: number | null;
  observable: boolean;
}

export interface ResampledParameterTrajectory {
  parameter_id: string;
  grid_points: ResampledPoint[];
}

export interface ResampledLandmarkTrajectory {
  landmark_id: number;
  grid_points: Array<{
    normalized_time: number;
    point: Vector3D | null;
    confidence: number;
  }>;
}

/**
 * Linear interpolation helper.
 */
export function lerp(v0: number, v1: number, t: number): number {
  return v0 + (v1 - v0) * t;
}

/**
 * Resamples a single parameter time-series onto a 101-point normalized timeline (0.00 to 1.00).
 */
export function resampleParameterTrajectory(
  paramId: string,
  rawSeries: MotionParameterResult[]
): ResampledParameterTrajectory {
  const filtered = rawSeries
    .filter((p) => p.parameter_id === paramId && p.observable && p.value !== null)
    .sort((a, b) => a.timestamp_ms - b.timestamp_ms);

  const gridPoints: ResampledPoint[] = [];

  if (filtered.length === 0) {
    for (let step = 0; step < NORMALIZED_GRID_STEPS; step++) {
      gridPoints.push({
        normalized_time: Number((step / (NORMALIZED_GRID_STEPS - 1)).toFixed(2)),
        value: null,
        observable: false,
      });
    }
    return { parameter_id: paramId, grid_points: gridPoints };
  }

  const tStart = filtered[0].timestamp_ms;
  const tEnd = filtered[filtered.length - 1].timestamp_ms;
  const duration = tEnd - tStart;

  // Assign normalized time [0.0, 1.0] to raw data points
  const pointsWithNormTime = filtered.map((p) => ({
    normTime: duration > 0 ? (p.timestamp_ms - tStart) / duration : 0.0,
    val: p.value as number,
  }));

  for (let step = 0; step < NORMALIZED_GRID_STEPS; step++) {
    const targetNormTime = step / (NORMALIZED_GRID_STEPS - 1);

    if (duration === 0 || pointsWithNormTime.length === 1) {
      gridPoints.push({
        normalized_time: Number(targetNormTime.toFixed(2)),
        value: Number(pointsWithNormTime[0].val.toFixed(2)),
        observable: true,
      });
      continue;
    }

    // Find interpolation segment [idx, idx+1]
    let idx = 0;
    while (idx < pointsWithNormTime.length - 1 && pointsWithNormTime[idx + 1].normTime < targetNormTime) {
      idx++;
    }

    if (idx >= pointsWithNormTime.length - 1) {
      gridPoints.push({
        normalized_time: Number(targetNormTime.toFixed(2)),
        value: Number(pointsWithNormTime[pointsWithNormTime.length - 1].val.toFixed(2)),
        observable: true,
      });
    } else {
      const p1 = pointsWithNormTime[idx];
      const p2 = pointsWithNormTime[idx + 1];
      const dt = p2.normTime - p1.normTime;
      const frac = dt > 0 ? (targetNormTime - p1.normTime) / dt : 0;
      const interpVal = lerp(p1.val, p2.val, frac);

      gridPoints.push({
        normalized_time: Number(targetNormTime.toFixed(2)),
        value: Number(interpVal.toFixed(2)),
        observable: true,
      });
    }
  }

  return { parameter_id: paramId, grid_points: gridPoints };
}

/**
 * Resamples a 3D landmark trajectory across normalized frames onto a 101-point grid.
 */
export function resampleLandmarkTrajectory(
  landmarkId: number,
  normFrames: NormalizedMotionFrame[]
): ResampledLandmarkTrajectory {
  const points: Array<{ normTime: number; pos: Vector3D; conf: number }> = [];

  if (normFrames.length > 0) {
    const tStart = normFrames[0].timestamp_ms;
    const tEnd = normFrames[normFrames.length - 1].timestamp_ms;
    const duration = tEnd - tStart;

    for (const f of normFrames) {
      const lm = (f.normalized_landmarks || []).find((l) => l.landmark_id === landmarkId);
      if (lm && lm.confidence > 0.3) {
        const normTime = duration > 0 ? (f.timestamp_ms - tStart) / duration : 0.0;
        points.push({
          normTime,
          pos: { x: lm.x, y: lm.y, z: lm.z },
          conf: lm.confidence,
        });
      }
    }
  }

  const gridPoints: ResampledLandmarkTrajectory['grid_points'] = [];

  for (let step = 0; step < NORMALIZED_GRID_STEPS; step++) {
    const targetNormTime = step / (NORMALIZED_GRID_STEPS - 1);

    if (points.length === 0) {
      gridPoints.push({
        normalized_time: Number(targetNormTime.toFixed(2)),
        point: null,
        confidence: 0.0,
      });
      continue;
    }

    let idx = 0;
    while (idx < points.length - 1 && points[idx + 1].normTime < targetNormTime) {
      idx++;
    }

    if (idx >= points.length - 1) {
      gridPoints.push({
        normalized_time: Number(targetNormTime.toFixed(2)),
        point: points[points.length - 1].pos,
        confidence: points[points.length - 1].conf,
      });
    } else {
      const p1 = points[idx];
      const p2 = points[idx + 1];
      const dt = p2.normTime - p1.normTime;
      const frac = dt > 0 ? (targetNormTime - p1.normTime) / dt : 0;
      const interpPos: Vector3D = {
        x: Number(lerp(p1.pos.x, p2.pos.x, frac).toFixed(4)),
        y: Number(lerp(p1.pos.y, p2.pos.y, frac).toFixed(4)),
        z: Number(lerp(p1.pos.z, p2.pos.z, frac).toFixed(4)),
      };
      gridPoints.push({
        normalized_time: Number(targetNormTime.toFixed(2)),
        point: interpPos,
        confidence: Number(((p1.conf + p2.conf) / 2).toFixed(2)),
      });
    }
  }

  return { landmark_id: landmarkId, grid_points: gridPoints };
}
