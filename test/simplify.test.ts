import { describe, expect, it } from 'vitest';
import { destination, distanceToPath, simplifyPath } from '../src/index.js';
import type { LatLng } from '../src/index.js';

describe('simplifyPath', () => {
  it('rejects a negative or non-finite tolerance', () => {
    expect(() => simplifyPath([], -1)).toThrow(RangeError);
    expect(() => simplifyPath([], NaN)).toThrow(RangeError);
  });

  it('returns short paths untouched', () => {
    const points = [
      { lat: 0, lon: 0 },
      { lat: 1, lon: 1 },
    ];
    expect(simplifyPath(points, 100)).toEqual(points);
  });

  it('returns a copy, not the input array', () => {
    const points = [{ lat: 0, lon: 0 }];
    expect(simplifyPath(points, 100)).not.toBe(points);
  });

  it('keeps every point at zero tolerance', () => {
    const points = [
      { lat: 0, lon: 0 },
      { lat: 0, lon: 0.5 },
      { lat: 0, lon: 1 },
    ];
    expect(simplifyPath(points, 0)).toHaveLength(3);
  });

  it('drops collinear interior points', () => {
    const points = [
      { lat: 0, lon: 0 },
      { lat: 0, lon: 0.25 },
      { lat: 0, lon: 0.5 },
      { lat: 0, lon: 0.75 },
      { lat: 0, lon: 1 },
    ];
    expect(simplifyPath(points, 10)).toEqual([points[0], points[4]]);
  });

  it('always keeps the endpoints', () => {
    const points = [
      { lat: 0, lon: 0 },
      { lat: 0.0001, lon: 0.5 },
      { lat: 0, lon: 1 },
    ];
    const simplified = simplifyPath(points, 1000);
    expect(simplified[0]).toEqual(points[0]);
    expect(simplified[simplified.length - 1]).toEqual(points[2]);
  });

  it('keeps a spike that exceeds the tolerance', () => {
    const points = [
      { lat: 0, lon: 0 },
      { lat: 0.01, lon: 0.5 },
      { lat: 0, lon: 1 },
    ];
    expect(simplifyPath(points, 100)).toHaveLength(3);
  });

  it('keeps a detour that overshoots the retained segment', () => {
    // The middle vertex is collinear with the endpoints, so its distance to the
    // infinite line through them is zero and a line-based Douglas-Peucker drops
    // it. It sits 111 km past the end of the actual segment, so measuring
    // against the segment keeps it.
    const points = [
      { lat: 0, lon: 0 },
      { lat: 0, lon: 1 },
      { lat: 0, lon: 0.001 },
    ];
    expect(simplifyPath(points, 100)).toHaveLength(3);
  });

  it('never deviates from the original by more than the tolerance', () => {
    const tolerance = 250;
    const points: LatLng[] = [{ lat: 27.7, lon: 85.3 }];
    for (let i = 1; i < 400; i++) {
      const previous = points[i - 1];
      points.push(destination(previous, 45 + Math.sin(i / 5) * 60, 120));
    }

    const simplified = simplifyPath(points, tolerance);
    expect(simplified.length).toBeLessThan(points.length);
    for (const point of points) {
      expect(distanceToPath(point, simplified).distance).toBeLessThanOrEqual(tolerance);
    }
  });

  it('handles a long track without overflowing the call stack', () => {
    const points: LatLng[] = [{ lat: 0, lon: 0 }];
    for (let i = 1; i < 60_000; i++) {
      points.push({ lat: 0, lon: i * 1e-6 });
    }
    expect(simplifyPath(points, 1)).toHaveLength(2);
  });
});
