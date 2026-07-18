import type { LogicalPoint, PlacementConstraint, PointRoleDefinition } from "./schema";

export const VIEWBOX = { width: 1000, height: 1000 } as const;
// The lower margin is deliberately generous: mobile palettes and controls float
// there without covering the phase-bearing frame.
export const FRAME = { left: 92, top: 64, right: 940, bottom: 800 } as const;

export function logicalToSvg(point: LogicalPoint): { x: number; y: number } {
  return {
    x: FRAME.left + (point.compositionBPercent / 100) * (FRAME.right - FRAME.left),
    y: FRAME.bottom - (point.temperatureCelsius / 1100) * (FRAME.bottom - FRAME.top),
  };
}

export function svgToLogical(x: number, y: number): LogicalPoint {
  return {
    compositionBPercent: ((x - FRAME.left) / (FRAME.right - FRAME.left)) * 100,
    temperatureCelsius: ((FRAME.bottom - y) / (FRAME.bottom - FRAME.top)) * 1100,
  };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const snap = (value: number, increment: number) => Math.round(value / increment) * increment;

export function constrainPoint(raw: LogicalPoint, constraint: PlacementConstraint): LogicalPoint {
  let compositionBPercent = clamp(snap(raw.compositionBPercent, 5), 0, 100);
  let temperatureCelsius = clamp(snap(raw.temperatureCelsius, 50), 0, 1100);
  if (constraint.kind === "left-edge") compositionBPercent = 0;
  if (constraint.kind === "right-edge") compositionBPercent = 100;
  if (constraint.kind === "bottom-edge") temperatureCelsius = 0;
  if (constraint.kind === "fixed-temperature") temperatureCelsius = constraint.temperatureCelsius;
  return { compositionBPercent, temperatureCelsius };
}

export function formatCoordinate(point: LogicalPoint): string {
  return `${Math.round(point.compositionBPercent)}%B · ${Math.round(point.temperatureCelsius)}°`;
}

export function roleById(roles: PointRoleDefinition[], roleId: string): PointRoleDefinition {
  const role = roles.find((candidate) => candidate.id === roleId);
  if (!role) throw new Error(`Unknown point role: ${roleId}`);
  return role;
}

export function distance(a: LogicalPoint, b: LogicalPoint): number {
  const dx = a.compositionBPercent - b.compositionBPercent;
  const dy = (a.temperatureCelsius - b.temperatureCelsius) / 11;
  return Math.hypot(dx, dy);
}
