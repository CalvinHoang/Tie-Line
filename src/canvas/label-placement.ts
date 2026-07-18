import { logicalToSvg } from "../domain/coordinates";
import type { LogicalPoint } from "../domain/schema";

interface SvgPoint { x: number; y: number }

export interface FieldLabelPlacement extends SvgPoint {
  scale: number;
  fits: boolean;
  orientation: "horizontal" | "vertical";
}

const EPSILON = 0.001;

function pointInPolygon(point: SvgPoint, polygon: SvgPoint[]): boolean {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const a = polygon[index];
    const b = polygon[previous];
    const crosses = (a.y > point.y) !== (b.y > point.y)
      && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y || EPSILON) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

function orientation(a: SvgPoint, b: SvgPoint, c: SvgPoint): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function segmentsIntersect(a: SvgPoint, b: SvgPoint, c: SvgPoint, d: SvgPoint): boolean {
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);
  return ((abC > EPSILON && abD < -EPSILON) || (abC < -EPSILON && abD > EPSILON))
    && ((cdA > EPSILON && cdB < -EPSILON) || (cdA < -EPSILON && cdB > EPSILON));
}

function distanceToSegment(point: SvgPoint, a: SvgPoint, b: SvgPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

function boundaryClearance(point: SvgPoint, polygon: SvgPoint[]): number {
  return Math.min(...polygon.map((start, index) => distanceToSegment(point, start, polygon[(index + 1) % polygon.length])));
}

function rectangleFits(point: SvgPoint, halfWidth: number, halfHeight: number, polygon: SvgPoint[]): boolean {
  const corners = [
    { x: point.x - halfWidth, y: point.y - halfHeight },
    { x: point.x + halfWidth, y: point.y - halfHeight },
    { x: point.x + halfWidth, y: point.y + halfHeight },
    { x: point.x - halfWidth, y: point.y + halfHeight },
  ];
  if (!corners.every((corner) => pointInPolygon(corner, polygon))) return false;
  for (let edge = 0; edge < 4; edge += 1) {
    const a = corners[edge];
    const b = corners[(edge + 1) % 4];
    for (let index = 0; index < polygon.length; index += 1) {
      if (segmentsIntersect(a, b, polygon[index], polygon[(index + 1) % polygon.length])) return false;
    }
  }
  return true;
}

function bestCandidate(polygon: SvgPoint[], halfWidth: number, halfHeight: number): SvgPoint | undefined {
  const minX = Math.min(...polygon.map((point) => point.x)) + halfWidth;
  const maxX = Math.max(...polygon.map((point) => point.x)) - halfWidth;
  const minY = Math.min(...polygon.map((point) => point.y)) + halfHeight;
  const maxY = Math.max(...polygon.map((point) => point.y)) - halfHeight;
  if (minX > maxX || minY > maxY) return undefined;

  let best: SvgPoint | undefined;
  let bestClearance = -1;
  const consider = (point: SvgPoint) => {
    if (!rectangleFits(point, halfWidth, halfHeight, polygon)) return;
    const clearance = boundaryClearance(point, polygon);
    if (clearance > bestClearance) {
      best = point;
      bestClearance = clearance;
    }
  };

  const coarseStep = 10;
  for (let y = minY; y <= maxY + EPSILON; y += coarseStep) {
    for (let x = minX; x <= maxX + EPSILON; x += coarseStep) consider({ x, y });
  }
  consider({ x: (minX + maxX) / 2, y: (minY + maxY) / 2 });
  if (!best) {
    for (let y = minY; y <= maxY + EPSILON; y += 2) {
      for (let x = minX; x <= maxX + EPSILON; x += 2) consider({ x, y });
    }
  }
  if (!best) return undefined;

  const coarseBest = best;
  for (let y = Math.max(minY, coarseBest.y - coarseStep); y <= Math.min(maxY, coarseBest.y + coarseStep); y += 2) {
    for (let x = Math.max(minX, coarseBest.x - coarseStep); x <= Math.min(maxX, coarseBest.x + coarseStep); x += 2) consider({ x, y });
  }
  return best;
}

/** Finds a screen-space anchor whose complete label rectangle stays inside the extracted field. */
export function fieldLabelPlacement(polygon: LogicalPoint[], phaseCount: number): FieldLabelPlacement {
  const svgPolygon = polygon.map(logicalToSvg);
  const attempts: Array<{ orientation: "horizontal" | "vertical"; scales: number[] }> = [
    { orientation: "horizontal", scales: [1, 0.9, 0.8, 0.7, 0.6] },
    ...(phaseCount > 1 ? [{ orientation: "vertical" as const, scales: [1, 0.9, 0.8, 0.7, 0.6] }] : []),
    { orientation: "horizontal", scales: [0.5, 0.45] },
    ...(phaseCount > 1 ? [{ orientation: "vertical" as const, scales: [0.5, 0.45] }] : []),
  ];
  for (const attempt of attempts) {
    const baseHalfWidth = attempt.orientation === "horizontal" ? (phaseCount <= 1 ? 22 : 43) : 22;
    const baseHalfHeight = attempt.orientation === "horizontal" ? 22 : 37;
    for (const scale of attempt.scales) {
      const candidate = bestCandidate(svgPolygon, baseHalfWidth * scale + 5, baseHalfHeight * scale + 4);
      if (candidate) return { ...candidate, scale, fits: true, orientation: attempt.orientation };
    }
  }

  // A malformed or intentionally over-labelled sliver may not hold even the
  // compact label. Keep its anchor at the safest interior point and report the
  // failed fit so generator tests can reject such layouts for correct answers.
  const bounds = {
    minX: Math.min(...svgPolygon.map((point) => point.x)), maxX: Math.max(...svgPolygon.map((point) => point.x)),
    minY: Math.min(...svgPolygon.map((point) => point.y)), maxY: Math.max(...svgPolygon.map((point) => point.y)),
  };
  let safest = svgPolygon[0];
  let clearance = -1;
  for (let y = bounds.minY; y <= bounds.maxY; y += 6) {
    for (let x = bounds.minX; x <= bounds.maxX; x += 6) {
      const point = { x, y };
      if (!pointInPolygon(point, svgPolygon)) continue;
      const nextClearance = boundaryClearance(point, svgPolygon);
      if (nextClearance > clearance) { safest = point; clearance = nextClearance; }
    }
  }
  return { ...safest, scale: 0.45, fits: false, orientation: "horizontal" };
}
