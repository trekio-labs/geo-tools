import { describe, expect, it } from 'vitest';
import {
  bboxCenter,
  bboxContains,
  bboxIntersects,
  boundingBox,
  distance,
  padBoundingBox,
} from '../src/index.js';

const points = [
  { lat: 27.7, lon: 85.3 },
  { lat: 28.2, lon: 83.9 },
  { lat: 27.9, lon: 86.9 },
];

describe('boundingBox', () => {
  it('throws on an empty list', () => {
    expect(() => boundingBox([])).toThrow(RangeError);
  });

  it('covers every point', () => {
    const box = boundingBox(points);
    expect(box).toEqual({ minLat: 27.7, minLon: 83.9, maxLat: 28.2, maxLon: 86.9 });
    for (const point of points) {
      expect(bboxContains(box, point)).toBe(true);
    }
  });

  it('collapses to a point for a single input', () => {
    const box = boundingBox([{ lat: 5, lon: 6 }]);
    expect(box).toEqual({ minLat: 5, minLon: 6, maxLat: 5, maxLon: 6 });
  });
});

describe('bboxContains', () => {
  const box = boundingBox(points);

  it('includes the edges', () => {
    expect(bboxContains(box, { lat: 27.7, lon: 83.9 })).toBe(true);
  });

  it('rejects outside points', () => {
    expect(bboxContains(box, { lat: 27.7, lon: 83.8 })).toBe(false);
    expect(bboxContains(box, { lat: 29, lon: 85 })).toBe(false);
  });
});

describe('bboxIntersects', () => {
  const a = { minLat: 0, minLon: 0, maxLat: 1, maxLon: 1 };

  it('detects overlap', () => {
    expect(bboxIntersects(a, { minLat: 0.5, minLon: 0.5, maxLat: 2, maxLon: 2 })).toBe(true);
  });

  it('counts a shared edge as intersecting', () => {
    expect(bboxIntersects(a, { minLat: 1, minLon: 1, maxLat: 2, maxLon: 2 })).toBe(true);
  });

  it('rejects disjoint boxes', () => {
    expect(bboxIntersects(a, { minLat: 2, minLon: 2, maxLat: 3, maxLon: 3 })).toBe(false);
  });
});

describe('bboxCenter', () => {
  it('averages the corners', () => {
    expect(bboxCenter({ minLat: 0, minLon: 0, maxLat: 2, maxLon: 4 })).toEqual({ lat: 1, lon: 2 });
  });
});

describe('padBoundingBox', () => {
  it('grows latitude by the requested distance', () => {
    const box = padBoundingBox({ minLat: 0, minLon: 0, maxLat: 0, maxLon: 0 }, 1000);
    const grown = distance({ lat: 0, lon: 0 }, { lat: box.maxLat, lon: 0 });
    expect(grown).toBeCloseTo(1000, 3);
  });

  it('pads longitude by the requested distance at that latitude', () => {
    const box = padBoundingBox({ minLat: 60, minLon: 0, maxLat: 60, maxLon: 0 }, 1000);
    const grown = distance({ lat: 60, lon: 0 }, { lat: 60, lon: box.maxLon });
    expect(grown).toBeCloseTo(1000, 3);
  });

  it('scales longitude padding at the box edge nearest a pole', () => {
    const atEquator = padBoundingBox({ minLat: 0, minLon: 0, maxLat: 0, maxLon: 0 }, 1000);
    const spanning = padBoundingBox({ minLat: 0, minLon: 0, maxLat: 60, maxLon: 0 }, 1000);
    expect(spanning.maxLon).toBeGreaterThan(atEquator.maxLon);
  });

  it('clamps at the poles and the antimeridian', () => {
    const box = padBoundingBox({ minLat: -89, minLon: -179, maxLat: 89, maxLon: 179 }, 5_000_000);
    expect(box.minLat).toBe(-90);
    expect(box.maxLat).toBe(90);
    expect(box.minLon).toBe(-180);
    expect(box.maxLon).toBe(180);
  });

  it('rejects a non-finite distance', () => {
    expect(() => padBoundingBox({ minLat: 0, minLon: 0, maxLat: 0, maxLon: 0 }, NaN)).toThrow(
      RangeError,
    );
  });
});
