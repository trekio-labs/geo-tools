/** A geographic position in decimal degrees (WGS84). */
export interface LatLng {
  /** Latitude in degrees, -90..90. */
  readonly lat: number;
  /** Longitude in degrees, -180..180. */
  readonly lon: number;
}

/** An axis-aligned latitude/longitude rectangle. */
export interface BoundingBox {
  readonly minLat: number;
  readonly minLon: number;
  readonly maxLat: number;
  readonly maxLon: number;
}

/** Result of measuring a point against a multi-segment path. */
export interface PathDistance {
  /** Shortest distance from the point to the path, in metres. */
  readonly distance: number;
  /**
   * Index of the closest segment's first vertex. For a single-vertex path
   * this is always 0.
   */
  readonly index: number;
}
