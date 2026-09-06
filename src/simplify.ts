import { distanceToSegment } from './distance.js';
import type { LatLng } from './types.js';

/**
 * Ramer-Douglas-Peucker simplification with a tolerance in metres. A vertex is
 * dropped only when it sits within `toleranceM` of the retained line, so the
 * simplified path never deviates from the original by more than the tolerance.
 *
 * Distances are measured against the segment (endpoints included), not the
 * infinite line, so sharp switchbacks survive. The implementation uses an
 * explicit stack, so very long tracks cannot blow the call stack.
 */
export function simplifyPath(points: readonly LatLng[], toleranceM: number): LatLng[] {
  if (!Number.isFinite(toleranceM) || toleranceM < 0) {
    throw new RangeError('simplifyPath requires a finite, non-negative tolerance');
  }

  const count = points.length;
  if (count <= 2 || toleranceM === 0) return points.slice();

  const keep = new Uint8Array(count);
  keep[0] = 1;
  keep[count - 1] = 1;

  const stack: number[] = [0, count - 1];
  while (stack.length > 0) {
    const end = stack.pop();
    const start = stack.pop();
    if (start === undefined || end === undefined) break;

    let maxDistance = -1;
    let maxIndex = -1;
    for (let i = start + 1; i < end; i++) {
      const d = distanceToSegment(points[i], points[start], points[end]);
      if (d > maxDistance) {
        maxDistance = d;
        maxIndex = i;
      }
    }

    if (maxIndex !== -1 && maxDistance > toleranceM) {
      keep[maxIndex] = 1;
      stack.push(start, maxIndex, maxIndex, end);
    }
  }

  const result: LatLng[] = [];
  for (let i = 0; i < count; i++) {
    if (keep[i] === 1) result.push(points[i]);
  }
  return result;
}
