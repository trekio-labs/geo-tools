import { describe, expect, it } from 'vitest';
import { isValidLatLng } from '../src/index.js';

describe('isValidLatLng', () => {
  it('accepts in-range coordinates', () => {
    expect(isValidLatLng({ lat: 0, lon: 0 })).toBe(true);
    expect(isValidLatLng({ lat: -90, lon: 180 })).toBe(true);
  });

  it('rejects non-objects', () => {
    expect(isValidLatLng(null)).toBe(false);
    expect(isValidLatLng(undefined)).toBe(false);
    expect(isValidLatLng('27.7,85.3')).toBe(false);
  });

  it('rejects missing or non-numeric fields', () => {
    expect(isValidLatLng({ lat: 27.7 })).toBe(false);
    expect(isValidLatLng({ lat: '27.7', lon: '85.3' })).toBe(false);
  });

  it('rejects NaN and Infinity', () => {
    expect(isValidLatLng({ lat: NaN, lon: 0 })).toBe(false);
    expect(isValidLatLng({ lat: 0, lon: Infinity })).toBe(false);
  });

  it('rejects out-of-range values', () => {
    expect(isValidLatLng({ lat: 91, lon: 0 })).toBe(false);
    expect(isValidLatLng({ lat: 0, lon: -181 })).toBe(false);
  });
});
