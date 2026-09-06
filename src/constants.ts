/**
 * IUGG mean Earth radius in metres. Every distance in this package is a
 * spherical approximation using this radius; expect up to ~0.5% error versus
 * an ellipsoidal (Vincenty/geodesic) calculation.
 */
export const EARTH_RADIUS_M = 6371008.8;

export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;
