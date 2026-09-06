# @trekio-labs/geo-tools

Small geodesic helpers for GPS tracks and route math. Zero runtime dependencies, pure functions, ESM + CJS, TypeScript types included.

Built at [Trekio Labs](https://github.com/Trekio-Labs) for [TrekGuard](https://trekguard.app), where the same handful of calculations kept getting re-implemented — slightly differently each time — across an app, a website and a batch of build scripts.

## Install

```bash
npm install @trekio-labs/geo-tools
```

```ts
import { distance } from '@trekio-labs/geo-tools';
```

## Use

```ts
import { distance, bearing, destination, distanceToPath, simplifyPath } from '@trekio-labs/geo-tools';

const lukla = { lat: 27.6869, lon: 86.7314 };
const namche = { lat: 27.8069, lon: 86.7140 };

distance(lukla, namche);        // 13452.8 (metres)
bearing(lukla, namche);         // 352.69 (degrees from true north)
destination(lukla, 0, 1000);    // { lat: 27.6959, lon: 86.7314 }

// How far off-route is this fix, and which segment is it nearest?
distanceToPath(fix, routePoints); // { distance: 42.6, index: 118 }

// Thin a 40k-point track to something a map can draw.
simplifyPath(routePoints, 15);
```

Every distance is in **metres**, every angle in **degrees**. Coordinates are `{ lat, lon }` in decimal degrees (WGS84).

## API

### Distance

| Function | Returns |
| --- | --- |
| `distance(a, b)` | Great-circle (haversine) distance in metres. |
| `pathLength(points)` | Total length of a polyline. `0` for fewer than two points. |
| `crossTrackDistance(p, a, b)` | Signed perpendicular offset from the **infinite** great circle through `a` and `b`. Negative = left of the a→b heading, positive = right. |
| `alongTrackDistance(p, a, b)` | Signed distance from `a` to the closest point on the a→b great circle. Negative = behind `a`. |
| `distanceToSegment(p, a, b)` | Shortest distance to the **segment**. Clamps to the nearer endpoint when the perpendicular foot falls outside. |
| `distanceToPath(p, points)` | `{ distance, index }` — shortest distance to a polyline plus the index of the closest segment's first vertex. Throws on an empty path. |

Use `distanceToSegment`, not `crossTrackDistance`, for off-route checks. Cross-track measures against a line that extends forever in both directions, so a point far past the end of a segment reports a small offset.

### Bearing and projection

| Function | Returns |
| --- | --- |
| `bearing(a, b)` | Initial bearing, `0..360` degrees clockwise from true north. |
| `finalBearing(a, b)` | Bearing on arrival at `b`. Differs from `bearing` on long east–west legs. |
| `destination(from, bearingDeg, distanceM)` | The point reached by travelling that far on that heading. |
| `midpoint(a, b)` | Great-circle midpoint. |

### Bounding boxes

| Function | Returns |
| --- | --- |
| `boundingBox(points)` | `{ minLat, minLon, maxLat, maxLon }`. Throws on an empty list. |
| `bboxContains(box, point)` | Edge-inclusive containment test. |
| `bboxIntersects(a, b)` | Edge-inclusive overlap test. |
| `bboxCenter(box)` | Centre of the box. |
| `padBoundingBox(box, metres)` | Grows the box on every side. Longitude padding is scaled at the box edge nearest a pole, so the box is at least as wide as scaling at any latitude inside it would give. Clamps to ±90 / ±180. |

### Simplification

`simplifyPath(points, toleranceM)` — Ramer–Douglas–Peucker. A vertex is dropped only when it sits within `toleranceM` of the retained line, so the output never deviates from the input by more than the tolerance.

Two things it does differently from most implementations:

- Vertices are measured against the **segment**, not the infinite line. A detour that overshoots the retained endpoints is collinear with them, so a line-based implementation scores it at zero and drops it; measuring to the segment keeps it. (Douglas–Peucker still cannot represent a path that doubles back *between* two retained vertices — no polyline simplification can.)
- The recursion runs on an explicit stack, so a 100k-point track cannot blow the call stack.

### Validation

`isValidLatLng(value)` — type guard rejecting `NaN`, `Infinity` and out-of-range values, which is what GPS payloads and hand-edited JSON actually produce.

The math functions deliberately do **not** validate their inputs; checking on every call in a hot loop is wasteful. Validate once at the boundary where data enters your system.

### Constants

`EARTH_RADIUS_M` (6371008.8), `DEG_TO_RAD`, `RAD_TO_DEG`, plus `toRadians`, `toDegrees`, `normalizeBearing`, `normalizeLongitude`.

## Accuracy and limits

- **Spherical, not ellipsoidal.** All calculations use a sphere of mean radius 6371008.8 m. Expect up to ~0.5% error against a Vincenty/Karney geodesic — worst on long east–west paths at high latitude, negligible on the scale of a hiking track. If you need survey-grade distances, use a geodesic library.
- **No antimeridian wrapping in bounding boxes.** Points straddling ±180° produce a box spanning nearly the whole globe rather than a narrow band. `destination` does wrap longitude correctly.
- **No elevation.** Distances are along the surface. A 3-D track length needs the elevation delta folded in separately.
- **Poles.** Bearing is undefined exactly at a pole; longitude padding is clamped at 89.9° to keep `padBoundingBox` finite.

## Development

```bash
npm install
npm test          # vitest
npm run typecheck # tsc --noEmit
npm run build     # ESM + CJS + .d.ts into dist/
```

## License

MIT © Trekio Labs
