import { canonicalPhaseKey, pointInPolygon, sameLogicalPoint, unorderedPairKey } from "../domain/geometry";
import type {
  ConstructionState,
  HiddenSolution,
  PuzzleDefinition,
  RuleViolation,
  ValidationResult,
} from "../domain/schema";

const violation = (
  ruleId: string,
  category: RuleViolation["category"],
  message: string,
  elementIds: string[] = [],
): RuleViolation => ({ ruleId, category, severity: "error", message, elementIds });

export function validateSubmit(
  state: ConstructionState,
  puzzle: PuzzleDefinition,
  solution: HiddenSolution,
): ValidationResult {
  const requiredRoles = puzzle.pointRoles.filter((role) => role.required);
  if (requiredRoles.some((role) => !state.points.some((point) => point.roleId === role.id))) {
    return { status: "incomplete", violations: [violation("M-P1", "puzzle", "Place every required anchor before submitting.")] };
  }

  for (const expected of solution.points) {
    const actual = state.points.find((point) => point.roleId === expected.roleId);
    if (actual && !sameLogicalPoint(actual.point, expected.point)) {
      return { status: "incorrect", violations: [violation("M-P4", "instruction", "One or more anchors do not match the instructions.", [actual.id])] };
    }
  }

  const curves = state.geometry.filter((geometry) => geometry.type === "curve");
  const invariant = state.geometry.filter((geometry) => geometry.type === "invariant-horizontal");
  if (curves.length < puzzle.requiredCurves.length || invariant.length < puzzle.requiredInvariants.length) {
    return { status: "incomplete", violations: [violation("M-G1", "puzzle", "The construction is missing required geometry.")] };
  }
  if (curves.length > puzzle.requiredCurves.length || invariant.length > puzzle.requiredInvariants.length) {
    return { status: "incorrect", violations: [violation("M-G5", "puzzle", "The construction contains extra geometry.")] };
  }

  const roleForPointId = (pointId: string) => state.points.find((point) => point.id === pointId)?.roleId ?? "";
  const actualCurvePairs = new Set(curves.map((curve) => unorderedPairKey(roleForPointId(curve.startPointId), roleForPointId(curve.endPointId))));
  const missingPair = puzzle.requiredCurves.find((curve) => !actualCurvePairs.has(unorderedPairKey(curve.startRoleId, curve.endRoleId)));
  if (missingPair) {
    return { status: "incorrect", violations: [violation("M-G2", "scientific", "The boundary incidence does not match the required topology.")] };
  }

  for (const required of puzzle.requiredInvariants) {
    const horizontal = invariant.find((candidate) => unorderedPairKey(roleForPointId(candidate.startPointId), roleForPointId(candidate.endPointId))
      === unorderedPairKey(required.startRoleId, required.endRoleId));
    const horizontalRoles = horizontal?.interiorPointIds.map(roleForPointId) ?? [];
    if (!horizontal || !required.interiorRoleIds.every((role) => horizontalRoles.includes(role))) {
      return { status: "incorrect", violations: [violation("M-G4", "scientific", "An invariant does not include the required anchors.", horizontal ? [horizontal.id] : [])] };
    }
  }

  if (state.cells.length < puzzle.expectedFieldCount) {
    return { status: "incomplete", violations: [violation("M-C1", "puzzle", "The diagram does not yet contain all required fields.")] };
  }
  if (state.cells.length > puzzle.expectedFieldCount) {
    return { status: "incorrect", violations: [violation("M-C1", "puzzle", "The diagram contains an unexpected field.")] };
  }
  if (state.cells.some((cell) => cell.phaseOrder.length === 0)) {
    return { status: "incomplete", violations: [violation("M-C2", "puzzle", "Every field needs a phase assemblage.")] };
  }
  if (state.cells.some((cell) => cell.phaseOrder.length > 2)) {
    return { status: "incorrect", violations: [violation("M-C3", "scientific", "A two-dimensional field may contain at most two phases.")] };
  }

  for (const cell of state.cells) {
    const expected = solution.expectedFields.find((candidate) => sameLogicalPoint(candidate.witnessPoint, cell.labelPoint))
      ?? solution.expectedFields.find((candidate) => pointInPolygon(candidate.witnessPoint, cell.polygon));
    if (!expected || canonicalPhaseKey(cell.phaseOrder) !== canonicalPhaseKey(expected.expectedAssemblage)) {
      return { status: "incorrect", violations: [violation("M-C5", "scientific", "One or more field assemblages are incorrect.", [cell.id])] };
    }
  }
  for (const expected of solution.invariants) {
    const horizontal = invariant.find((candidate) => unorderedPairKey(roleForPointId(candidate.startPointId), roleForPointId(candidate.endPointId))
      === unorderedPairKey(expected.startRoleId, expected.endRoleId));
    if (!horizontal || canonicalPhaseKey(horizontal.phaseOrder) !== canonicalPhaseKey(expected.expectedAssemblage)) {
      return { status: !horizontal || horizontal.phaseOrder.length === 0 ? "incomplete" : "incorrect", violations: [violation("M-I2", "scientific", "An invariant assemblage is incomplete or incorrect.", horizontal ? [horizontal.id] : [])] };
    }
  }

  return { status: "solved", violations: [] };
}

export function localPointViolations(state: ConstructionState, solution: HiddenSolution): Set<string> {
  if (!state.metrics.localInvalidityCheckingEnabled) return new Set();
  return new Set(state.points.filter((point) => {
    const expected = solution.points.find((candidate) => candidate.roleId === point.roleId);
    return expected && !sameLogicalPoint(point.point, expected.point);
  }).map((point) => point.id));
}
