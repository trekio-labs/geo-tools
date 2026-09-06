import { describe, expect, it } from 'vitest';
import {
  EARTH_RADIUS_M,
  alongTrackDistance,
  crossTrackDistance,
  destination,
  distance,
  distanceToPath,
  distanceToSegment,
  pathLength,
} from '../src/index.js';

/** One degree of latitude on the mean sphere. */
const DEGREE_M = (EARTH_RADIUS_M * Math.PI) / 180;

describe('distance', () => {
  it('is zero for a point against itself', () => {
    expect(distance({ lat: 27.7172, lon: 85.324 }, { lat: 27.7172, lon: 85.324 })).toBe(0);
  });

  it('measures one degree of latitude', () => {
    expect(distance({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(DEGREE_M, 3);
  });

  it('measures one degree of longitude at the equator', () => {
    expect(distance({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(DEGREE_M, 3);
  });

  it('shrinks a degree of longitude by cos(lat) away from the equator', () => {
    // The great circle between two points on a parallel cuts slightly poleward
    // of the parallel itself, so it is a hair shorter than DEGREE_M * cos(lat).
    const atSixty = distance({ lat: 60, lon: 0 }, { lat: 60, lon: 1 });
    const parallelArc = DEGREE_M * Math.cos((60 * Math.PI) / 180);
    expect(atSixty).toBeLessThan(parallelArc);
    expect(Math.abs(atSixty - parallelArc) / parallelArc).toBeLessThan(1e-4);
  });

  it('is symmetric', () => {
    const a = { lat: 27.9881, lon: 86.925 };
    const b = { lat: 28.2096, lon: 83.9856 };
    expect(distance(a, b)).toBeCloseTo(distance(b, a), 9);
  });

  it('matches a known long-haul pair within 0.1%', () => {
    // London Heathrow to JFK, ~5540 km great circle (shorter than the ~5555 km
    // usually quoted for the flight, which is a routed track, not a geodesic).
    const measured = distance({ lat: 51.47, lon: -0.4543 }, { lat: 40.6413, lon: -73.7781 });
    expect(measured).toBeGreaterThan(5_535_000);
    expect(measured).toBeLessThan(5_545_000);
  });

  it('handles antipodal points', () => {
    const measured = distance({ lat: 0, lon: 0 }, { lat: 0, lon: 180 });
    expect(measured).toBeCloseTo(Math.PI * EARTH_RADIUS_M, 3);
  });
});

describe('pathLength', () => {
  it('is zero for an empty or single-point path', () => {
    expect(pathLength([])).toBe(0);
    expect(pathLength([{ lat: 1, lon: 1 }])).toBe(0);
  });

  it('sums its segments', () => {
    const points = [
      { lat: 0, lon: 0 },
      { lat: 1, lon: 0 },
      { lat: 2, lon: 0 },
    ];
    expect(pathLength(points)).toBeCloseTo(2 * DEGREE_M, 3);
  });
});

describe('crossTrackDistance', () => {
  const start = { lat: 0, lon: 0 };
  const end = { lat: 0, lon: 1 };

  it('is negative to the left of the heading', () => {
    // Heading east; north of the path is the left-hand side.
    expect(crossTrackDistance({ lat: 0.001, lon: 0.5 }, start, end)).toBeLessThan(0);
  });

  it('is positive to the right of the heading', () => {
    expect(crossTrackDistance({ lat: -0.001, lon: 0.5 }, start, end)).toBeGreaterThan(0);
  });

  it('has a magnitude equal to the offset', () => {
    const offset = Math.abs(crossTrackDistance({ lat: 0.001, lon: 0.5 }, start, end));
    expect(offset).toBeCloseTo(DEGREE_M * 0.001, 1);
  });

  it('is zero on the path itself', () => {
    expect(crossTrackDistance({ lat: 0, lon: 0.5 }, start, end)).toBeCloseTo(0, 6);
  });
});

describe('alongTrackDistance', () => {
  const start = { lat: 0, lon: 0 };
  const end = { lat: 0, lon: 1 };

  it('measures progress along the segment', () => {
    expect(alongTrackDistance({ lat: 0, lon: 0.25 }, start, end)).toBeCloseTo(DEGREE_M * 0.25, 1);
  });

  it('is negative behind the start', () => {
    expect(alongTrackDistance({ lat: 0, lon: -0.25 }, start, end)).toBeLessThan(0);
  });
});

describe('distanceToSegment', () => {
  const start = { lat: 0, lon: 0 };
  const end = { lat: 0, lon: 1 };

  it('returns the perpendicular offset when the foot is inside the segment', () => {
    expect(distanceToSegment({ lat: 0.001, lon: 0.5 }, start, end)).toBeCloseTo(
      DEGREE_M * 0.001,
      1,
    );
  });

  it('clamps to the start endpoint', () => {
    const p = { lat: 0, lon: -0.5 };
    expect(distanceToSegment(p, start, end)).toBeCloseTo(distance(p, start), 6);
  });

  it('clamps to the end endpoint', () => {
    const p = { lat: 0, lon: 1.5 };
    expect(distanceToSegment(p, start, end)).toBeCloseTo(distance(p, end), 6);
  });

  it('degrades to point distance for a zero-length segment', () => {
    const p = { lat: 0.5, lon: 0 };
    expect(distanceToSegment(p, start, start)).toBeCloseTo(distance(p, start), 9);
  });
});

describe('distanceToPath', () => {
  const path = [
    { lat: 0, lon: 0 },
    { lat: 0, lon: 1 },
    { lat: 1, lon: 1 },
  ];

  it('throws on an empty path', () => {
    expect(() => distanceToPath({ lat: 0, lon: 0 }, [])).toThrow(RangeError);
  });

  it('handles a single-point path', () => {
    const result = distanceToPath({ lat: 1, lon: 0 }, [{ lat: 0, lon: 0 }]);
    expect(result.index).toBe(0);
    expect(result.distance).toBeCloseTo(DEGREE_M, 3);
  });

  it('reports the closest segment index', () => {
    expect(distanceToPath({ lat: 0.5, lon: 1.001 }, path).index).toBe(1);
    expect(distanceToPath({ lat: 0.001, lon: 0.5 }, path).index).toBe(0);
  });

  it('reports the shortest distance across all segments', () => {
    const result = distanceToPath({ lat: 0.5, lon: 1.001 }, path);
    expect(result.distance).toBeLessThan(200);
  });

  it('is zero for a point sitting on a vertex', () => {
    expect(distanceToPath({ lat: 0, lon: 1 }, path).distance).toBeCloseTo(0, 6);
  });

  it('agrees with a destination-offset point', () => {
    // Step 500 m due north off the middle of the first segment.
    const off = destination({ lat: 0, lon: 0.5 }, 0, 500);
    expect(distanceToPath(off, path).distance).toBeCloseTo(500, 0);
  });
});
