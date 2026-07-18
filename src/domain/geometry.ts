import type { LogicalPoint, PlayerGeometry, PlayerPoint, QuadraticCurveGeometry } from "./schema";

const EPSILON = 1e-6;

export function sameLogicalPoint(a: LogicalPoint, b: LogicalPoint): boolean {
  return Math.abs(a.compositionBPercent - b.compositionBPercent) < EPSILON
    && Math.abs(a.temperatureCelsius - b.temperatureCelsius) < EPSILON;
}

export function sampleQuadratic(
  start: LogicalPoint,
  control: LogicalPoint,
  end: LogicalPoint,
  segments = 24,
): LogicalPoint[] {
  return Array.from({ length: segments + 1 }, (_, index) => {
    const t = index / segments;
    const inverse = 1 - t;
    return {
      compositionBPercent:
        inverse * inverse * start.compositionBPercent
        + 2 * inverse * t * control.compositionBPercent
        + t * t * end.compositionBPercent,
      temperatureCelsius:
        inverse * inverse * start.temperatureCelsius
        + 2 * inverse * t * control.temperatureCelsius
        + t * t * end.temperatureCelsius,
    };
  });
}

export function geometryPolyline(geometry: PlayerGeometry, points: PlayerPoint[]): LogicalPoint[] {
  const start = points.find((point) => point.id === geometry.startPointId)?.point;
  const end = points.find((point) => point.id === geometry.endPointId)?.point;
  if (!start || !end) return [];
  if (geometry.type === "curve") return sampleQuadratic(start, geometry.control, end);
  const interior = geometry.interiorPointIds
    .map((id) => points.find((point) => point.id === id)?.point)
    .filter((point): point is LogicalPoint => Boolean(point));
  return [start, ...interior, end].sort((a, b) => a.compositionBPercent - b.compositionBPercent);
}

function orientation(a: LogicalPoint, b: LogicalPoint, c: LogicalPoint): number {
  return (b.compositionBPercent - a.compositionBPercent) * (c.temperatureCelsius - a.temperatureCelsius)
    - (b.temperatureCelsius - a.temperatureCelsius) * (c.compositionBPercent - a.compositionBPercent);
}

function onSegment(a: LogicalPoint, b: LogicalPoint, point: LogicalPoint): boolean {
  return point.compositionBPercent <= Math.max(a.compositionBPercent, b.compositionBPercent) + EPSILON
    && point.compositionBPercent >= Math.min(a.compositionBPercent, b.compositionBPercent) - EPSILON
    && point.temperatureCelsius <= Math.max(a.temperatureCelsius, b.temperatureCelsius) + EPSILON
    && point.temperatureCelsius >= Math.min(a.temperatureCelsius, b.temperatureCelsius) - EPSILON;
}

export function segmentsIntersect(
  a: LogicalPoint,
  b: LogicalPoint,
  c: LogicalPoint,
  d: LogicalPoint,
): boolean {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  if (((o1 > EPSILON && o2 < -EPSILON) || (o1 < -EPSILON && o2 > EPSILON))
    && ((o3 > EPSILON && o4 < -EPSILON) || (o3 < -EPSILON && o4 > EPSILON))) return true;
  if (Math.abs(o1) <= EPSILON && onSegment(a, b, c)) return true;
  if (Math.abs(o2) <= EPSILON && onSegment(a, b, d)) return true;
  if (Math.abs(o3) <= EPSILON && onSegment(c, d, a)) return true;
  if (Math.abs(o4) <= EPSILON && onSegment(c, d, b)) return true;
  return false;
}

export function hasIllegalIntersection(
  candidate: PlayerGeometry,
  existingGeometry: PlayerGeometry[],
  points: PlayerPoint[],
): boolean {
  const candidateLine = geometryPolyline(candidate, points);
  for (const geometry of existingGeometry) {
    const existingLine = geometryPolyline(geometry, points);
    for (let i = 0; i < candidateLine.length - 1; i += 1) {
      for (let j = 0; j < existingLine.length - 1; j += 1) {
        if (!segmentsIntersect(candidateLine[i], candidateLine[i + 1], existingLine[j], existingLine[j + 1])) continue;
        const intersectionAtDeclaredNode = [candidateLine[i], candidateLine[i + 1]].some((point) =>
          [existingLine[j], existingLine[j + 1]].some((other) => sameLogicalPoint(point, other)
            && points.some((committed) => sameLogicalPoint(committed.point, point))),
        );
        if (!intersectionAtDeclaredNode) return true;
      }
    }
  }
  return false;
}

export function curvePathData(curve: QuadraticCurveGeometry, points: PlayerPoint[]): string {
  const start = points.find((point) => point.id === curve.startPointId)?.point;
  const end = points.find((point) => point.id === curve.endPointId)?.point;
  if (!start || !end) return "";
  return `${start.compositionBPercent},${start.temperatureCelsius} ${curve.control.compositionBPercent},${curve.control.temperatureCelsius} ${end.compositionBPercent},${end.temperatureCelsius}`;
}

export function pointInPolygon(point: LogicalPoint, polygon: LogicalPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].compositionBPercent;
    const yi = polygon[i].temperatureCelsius;
    const xj = polygon[j].compositionBPercent;
    const yj = polygon[j].temperatureCelsius;
    const intersects = ((yi > point.temperatureCelsius) !== (yj > point.temperatureCelsius))
      && point.compositionBPercent < ((xj - xi) * (point.temperatureCelsius - yi)) / (yj - yi || EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function polygonArea(polygon: LogicalPoint[]): number {
  return polygon.reduce((area, point, index) => {
    const next = polygon[(index + 1) % polygon.length];
    return area + point.compositionBPercent * next.temperatureCelsius
      - next.compositionBPercent * point.temperatureCelsius;
  }, 0) / 2;
}

export function polygonLabelPoint(polygon: LogicalPoint[]): LogicalPoint {
  const signedArea = polygonArea(polygon);
  let x = 0;
  let y = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    const cross = current.compositionBPercent * next.temperatureCelsius
      - next.compositionBPercent * current.temperatureCelsius;
    x += (current.compositionBPercent + next.compositionBPercent) * cross;
    y += (current.temperatureCelsius + next.temperatureCelsius) * cross;
  }
  if (Math.abs(signedArea) < EPSILON) return polygon[0];
  const centroid = {
    compositionBPercent: x / (6 * signedArea),
    temperatureCelsius: y / (6 * signedArea),
  };
  if (pointInPolygon(centroid, polygon)) return centroid;
  return {
    compositionBPercent: polygon.reduce((sum, point) => sum + point.compositionBPercent, 0) / polygon.length,
    temperatureCelsius: polygon.reduce((sum, point) => sum + point.temperatureCelsius, 0) / polygon.length,
  };
}

export function unorderedPairKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

export function canonicalPhaseKey(phases: string[]): string {
  return [...new Set(phases)].sort().join("|");
}
