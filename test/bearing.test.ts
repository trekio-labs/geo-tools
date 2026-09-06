import { describe, expect, it } from 'vitest';
import {
  bearing,
  destination,
  distance,
  finalBearing,
  midpoint,
  normalizeBearing,
} from '../src/index.js';

describe('bearing', () => {
  it('points north', () => {
    expect(bearing({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(0, 6);
  });

  it('points east along the equator', () => {
    expect(bearing({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(90, 6);
  });

  it('points south', () => {
    expect(bearing({ lat: 0, lon: 0 }, { lat: -1, lon: 0 })).toBeCloseTo(180, 6);
  });

  it('points west as 270, never -90', () => {
    expect(bearing({ lat: 0, lon: 0 }, { lat: 0, lon: -1 })).toBeCloseTo(270, 6);
  });

  it('stays within 0..360', () => {
    const b = bearing({ lat: 27.7, lon: 85.3 }, { lat: -33.9, lon: -70.6 });
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(360);
  });
});

describe('finalBearing', () => {
  it('equals the initial bearing on a meridian', () => {
    const a = { lat: 0, lon: 0 };
    const b = { lat: 10, lon: 0 };
    expect(finalBearing(a, b)).toBeCloseTo(bearing(a, b), 6);
  });

  it('drifts from the initial bearing on a long east-west leg', () => {
    const a = { lat: 60, lon: 0 };
    const b = { lat: 60, lon: 90 };
    expect(Math.abs(finalBearing(a, b) - bearing(a, b))).toBeGreaterThan(1);
  });
});

describe('destination', () => {
  it('round-trips with distance', () => {
    const from = { lat: 27.7172, lon: 85.324 };
    const to = destination(from, 42, 12_345);
    expect(distance(from, to)).toBeCloseTo(12_345, 3);
  });

  it('round-trips with bearing', () => {
    const from = { lat: 27.7172, lon: 85.324 };
    const to = destination(from, 42, 12_345);
    expect(bearing(from, to)).toBeCloseTo(42, 6);
  });

  it('returns the origin for a zero distance', () => {
    const from = { lat: 12.5, lon: -3.25 };
    const to = destination(from, 123, 0);
    expect(to.lat).toBeCloseTo(from.lat, 9);
    expect(to.lon).toBeCloseTo(from.lon, 9);
  });

  it('wraps longitude across the antimeridian', () => {
    const to = destination({ lat: 0, lon: 179.9 }, 90, 50_000);
    expect(to.lon).toBeLessThan(0);
    expect(to.lon).toBeGreaterThan(-180);
  });
});

describe('midpoint', () => {
  it('sits halfway along the path', () => {
    const a = { lat: 0, lon: 0 };
    const b = { lat: 0, lon: 10 };
    const m = midpoint(a, b);
    expect(distance(a, m)).toBeCloseTo(distance(m, b), 3);
    expect(m.lon).toBeCloseTo(5, 6);
  });
});

describe('normalizeBearing', () => {
  it('wraps negatives and overflow', () => {
    expect(normalizeBearing(-90)).toBe(270);
    expect(normalizeBearing(450)).toBe(90);
    expect(normalizeBearing(360)).toBe(0);
  });
});
