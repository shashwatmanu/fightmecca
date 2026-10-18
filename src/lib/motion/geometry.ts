import { Landmark } from '@/types/motion';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Calculates Euclidean distance between two 3D points.
 */
export function distance3D(p1: Vector3D, p2: Vector3D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculates 2D Euclidean distance (in X-Y plane).
 */
export function distance2D(p1: Vector3D, p2: Vector3D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates 3D vector subtraction: (p1 - p2)
 */
export function subtract3D(p1: Vector3D, p2: Vector3D): Vector3D {
  return {
    x: p1.x - p2.x,
    y: p1.y - p2.y,
    z: p1.z - p2.z,
  };
}

/**
 * Calculates 3D vector addition: (p1 + p2)
 */
export function add3D(p1: Vector3D, p2: Vector3D): Vector3D {
  return {
    x: p1.x + p2.x,
    y: p1.y + p2.y,
    z: p1.z + p2.z,
  };
}

/**
 * Calculates midpoint between two 3D points.
 */
export function midpoint3D(p1: Vector3D, p2: Vector3D): Vector3D {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
    z: (p1.z + p2.z) / 2,
  };
}

/**
 * Calculates dot product of two 3D vectors.
 */
export function dotProduct3D(u: Vector3D, v: Vector3D): number {
  return u.x * v.x + u.y * v.y + u.z * v.z;
}

/**
 * Calculates magnitude (length) of a 3D vector.
 */
export function vectorMagnitude3D(v: Vector3D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/**
 * Calculates 3D joint angle in degrees formed by three points: (p1 -> p2 -> p3),
 * with p2 as the vertex joint (e.g., Shoulder -> Elbow -> Wrist).
 * Returns angle in degrees [0.0, 180.0].
 */
export function calculateJointAngle3D(
  p1: Vector3D,
  vertex: Vector3D,
  p3: Vector3D
): number {
  const u = subtract3D(p1, vertex);
  const v = subtract3D(p3, vertex);

  const uMag = vectorMagnitude3D(u);
  const vMag = vectorMagnitude3D(v);

  if (uMag === 0 || vMag === 0) return 0;

  let cosTheta = dotProduct3D(u, v) / (uMag * vMag);
  // Clamp cosTheta to [-1.0, 1.0] to prevent floating point NaN from acos
  cosTheta = Math.max(-1.0, Math.min(1.0, cosTheta));

  const angleRad = Math.acos(cosTheta);
  return Number(((angleRad * 180) / Math.PI).toFixed(2));
}

/**
 * Calculates horizontal orientation angle (in degrees relative to X-axis)
 * between two points (e.g. left shoulder to right shoulder).
 */
export function calculateOrientationAngle(p1: Vector3D, p2: Vector3D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const angleRad = Math.atan2(dy, dx);
  return Number(((angleRad * 180) / Math.PI).toFixed(2));
}
