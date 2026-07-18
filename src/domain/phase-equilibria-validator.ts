import { extractFaces } from "../canvas/face-extraction";
import {
  geometryPolyline,
  hasIllegalIntersection,
  pointInPolygon,
  polygonArea,
  sameLogicalPoint,
} from "./geometry";
import { BOUNDARY_RULES, REACTION_RULES, samePhaseFamily, thermodynamicKind } from "./phase-rules";
import type {
  ExtractedCell,
  HiddenSolution,
  PhaseDefinition,
  PlayerGeometry,
  PlayerPoint,
  PuzzleDefinition,
} from "./schema";

export type EquilibriumRuleCategory = "geometry" | "topology" | "phase-rule" | "reaction" | "phase-model";

export interface EquilibriumViolation {
  ruleId: string;
  category: EquilibriumRuleCategory;
  message: string;
  elementIds: string[];
}

export interface PhaseEquilibriaAudit {
  valid: boolean;
  violations: EquilibriumViolation[];
  cellCount: number;
  adjacencyCount: number;
}

interface GeneratedDiagram {
  points: PlayerPoint[];
  geometry: PlayerGeometry[];
}

const FRAME_IDS = new Set(["frame-left", "frame-right", "frame-top", "frame-bottom"]);
const EPSILON = 1e-5;

function generatedDiagram(solution: HiddenSolution): GeneratedDiagram {
  const points = solution.points.map((item, index) => ({
    id: `point:${item.roleId}`,
    roleId: item.roleId,
    point: item.point,
    createdAtOrdinal: index,
  }));
  const geometry: PlayerGeometry[] = [
    ...solution.curves.map((curve, index) => ({
      type: "curve" as const,
      id: `generated-curve:${index}`,
      startPointId: `point:${curve.startRoleId}`,
      endPointId: `point:${curve.endRoleId}`,
      control: curve.recommendedControl,
      createdBy: "generated" as const,
      semanticRole: curve.semanticRole,
      boundaryKind: curve.boundaryKind,
      compositionSiteId: curve.compositionSiteId,
      fieldBoundary: curve.fieldBoundary,
    })),
    ...solution.invariants.map((invariant, index) => ({
      type: "invariant-horizontal" as const,
      id: `generated-horizontal:${index}`,
      startPointId: `point:${invariant.startRoleId}`,
      endPointId: `point:${invariant.endRoleId}`,
      interiorPointIds: invariant.interiorRoleIds.map((role) => `point:${role}`),
      temperatureCelsius: invariant.temperatureCelsius,
      phaseOrder: [],
      createdBy: "generated" as const,
    })),
  ];
  return { points, geometry };
}

function add(
  violations: EquilibriumViolation[],
  ruleId: string,
  category: EquilibriumRuleCategory,
  message: string,
  elementIds: string[] = [],
): void {
  violations.push({ ruleId, category, message, elementIds });
}

function fieldForCell(cell: ExtractedCell, solution: HiddenSolution) {
  return solution.expectedFields.find((field) => sameLogicalPoint(field.witnessPoint, cell.labelPoint))
    ?? solution.expectedFields.find((field) => pointInPolygon(field.witnessPoint, cell.polygon));
}

function phaseKind(id: string, phaseById: Map<string, PhaseDefinition>) {
  return phaseById.get(id)?.kind;
}

function auditInvariantReactions(
  puzzle: PuzzleDefinition,
  solution: HiddenSolution,
  phaseById: Map<string, PhaseDefinition>,
  violations: EquilibriumViolation[],
): void {
  const pointByRole = new Map(solution.points.map((item) => [item.roleId, item.point]));
  solution.invariants.forEach((invariant, index) => {
    const id = `generated-horizontal:${index}`;
    const orderedRoles = [invariant.startRoleId, ...invariant.interiorRoleIds, invariant.endRoleId];
    const orderedPoints = orderedRoles.map((role) => pointByRole.get(role));
    if (orderedPoints.some((point) => !point)) {
      add(violations, "invariant-points-exist", "geometry", `Invariant ${index + 1} references a missing point.`, [id]);
      return;
    }
    if (orderedPoints.some((point) => Math.abs(point!.temperatureCelsius - invariant.temperatureCelsius) > EPSILON)) {
      add(violations, "invariant-isothermal", "geometry", `Invariant ${index + 1} is not horizontal at one temperature.`, [id]);
    }
    for (let pointIndex = 1; pointIndex < orderedPoints.length; pointIndex += 1) {
      if (orderedPoints[pointIndex - 1]!.compositionBPercent >= orderedPoints[pointIndex]!.compositionBPercent - EPSILON) {
        add(violations, "invariant-composition-order", "reaction", `Invariant ${index + 1} does not have strictly ordered phase compositions.`, [id]);
        break;
      }
    }
    const uniquePhases = [...new Set(invariant.expectedAssemblage)];
    if (uniquePhases.length !== 3 || invariant.expectedAssemblage.length !== 3) {
      add(violations, "binary-invariant-three-phases", "phase-rule", `Invariant ${index + 1} must contain exactly three distinct phases.`, [id]);
    }
    if (uniquePhases.some((phaseId) => !phaseById.has(phaseId))) {
      add(violations, "invariant-phases-defined", "phase-model", `Invariant ${index + 1} references an undefined phase.`, [id]);
    }

    const rule = REACTION_RULES[invariant.reactionType];
    const reactants = invariant.reactantPhaseIds ?? [];
    const products = invariant.productPhaseIds ?? [];
    const partition = [...reactants, ...products];
    if (invariant.interiorRoleIds.length !== 1 || partition.length !== 3
      || new Set(partition).size !== 3 || !uniquePhases.every((phaseId) => partition.includes(phaseId))) {
      add(violations, "reaction-participants-explicit", "reaction", `Invariant ${index + 1} must explicitly partition its three phases into reactants and products.`, [id]);
      return;
    }
    const reactantKinds = reactants.map((phaseId) => thermodynamicKind(phaseById.get(phaseId))).sort();
    const productKinds = products.map((phaseId) => thermodynamicKind(phaseById.get(phaseId))).sort();
    if (reactantKinds.join() !== [...rule.reactantKinds].sort().join()
      || productKinds.join() !== [...rule.productKinds].sort().join()) {
      add(violations, "reaction-phase-kinds", "reaction", `${rule.title} participants do not match ${rule.coolingEquation}.`, [id]);
    }
    const interiorRoleId = invariant.interiorRoleIds[0];
    const interiorPhase = uniquePhases.find((phaseId) => invariant.phaseCompositionRoleIds?.[phaseId] === interiorRoleId);
    const onePhaseSide = rule.interiorCompositionSide === "reactants" ? reactants : products;
    if (onePhaseSide.length !== 1 || interiorPhase !== onePhaseSide[0]) {
      add(violations, "reaction-interior-composition", "reaction", `${rule.title} requires the one-phase-side composition strictly between the two-phase-side compositions.`, [id]);
    }
    const mappedRoles = uniquePhases.map((phaseId) => invariant.phaseCompositionRoleIds?.[phaseId]);
    if (mappedRoles.some((roleId) => !roleId) || new Set(mappedRoles).size !== 3
      || !mappedRoles.every((roleId) => orderedRoles.includes(roleId!))) {
      add(violations, "reaction-composition-ownership", "reaction", `Invariant ${index + 1} must assign one distinct composition role to every phase.`, [id]);
    }
    if (invariant.reactionType === "monotectoid") {
      const parent = phaseById.get(reactants[0]);
      if (!products.some((phaseId) => samePhaseFamily(parent, phaseById.get(phaseId)))) {
        add(violations, "monotectoid-same-solution-family", "phase-model", "A monotectoid must retain one product in the parent solid-solution family.", [id]);
      }
    }
  });

  if (puzzle.requiredInvariants.length !== solution.invariants.length) {
    add(violations, "invariant-contract-count", "topology", "The puzzle and hidden solution disagree on the invariant count.");
  }
  solution.invariants.forEach((invariant, index) => {
    const required = puzzle.requiredInvariants[index];
    if (!required) return;
    const sameList = (a: string[] | undefined, b: string[] | undefined) => JSON.stringify(a ?? []) === JSON.stringify(b ?? []);
    if (required.reactionType !== invariant.reactionType
      || !sameList(required.reactantPhaseIds, invariant.reactantPhaseIds)
      || !sameList(required.productPhaseIds, invariant.productPhaseIds)
      || JSON.stringify(required.phaseCompositionRoleIds ?? {}) !== JSON.stringify(invariant.phaseCompositionRoleIds ?? {})) {
      add(violations, "invariant-contract-meaning", "topology", `Puzzle invariant ${index + 1} disagrees with the hidden reaction definition.`, [`generated-horizontal:${index}`]);
    }
  });
}

function auditPhaseModels(
  puzzle: PuzzleDefinition,
  solution: HiddenSolution,
  cells: ExtractedCell[],
  phaseById: Map<string, PhaseDefinition>,
  violations: EquilibriumViolation[],
): void {
  for (const phase of puzzle.phases) {
    const singlePhaseCells = cells.filter((cell) => fieldForCell(cell, solution)?.expectedAssemblage.length === 1
      && fieldForCell(cell, solution)?.expectedAssemblage[0] === phase.id);
    if (phase.kind === "line-compound" && singlePhaseCells.length > 0) {
      add(violations, "line-compound-zero-width", "phase-model", `Line compound ${phase.id} cannot occupy a finite-area single-phase field.`, singlePhaseCells.map((cell) => cell.id));
    }
    if (phase.kind === "intermediate-solid-solution" && singlePhaseCells.length === 0) {
      add(violations, "solid-solution-finite-width", "phase-model", `Intermediate solid solution ${phase.id} requires a finite-area single-phase field.`, [phase.id]);
    }
  }

  const phaseGroups = new Map<string, PhaseDefinition[]>();
  puzzle.phases.forEach((phase) => {
    if (!phase.phaseFamilyId) return;
    phaseGroups.set(phase.phaseFamilyId, [...(phaseGroups.get(phase.phaseFamilyId) ?? []), phase]);
  });
  for (const [groupId, group] of phaseGroups) {
    if (group.length < 2 || group.every((phase) => phase.kind === "line-compound" || phase.kind === "liquid")) continue;
    for (const phase of group) {
      const finiteSinglePhaseField = cells.some((cell) => {
        const field = fieldForCell(cell, solution);
        return field?.expectedAssemblage.length === 1 && field.expectedAssemblage[0] === phase.id;
      });
      if (!finiteSinglePhaseField) {
        add(violations, "phase-variant-finite-domain", "phase-model", `Phase variant ${phase.id} in ${groupId} requires its own finite single-phase domain.`, [phase.id]);
      }
    }
  }

  solution.curves.forEach((curve, index) => {
    if (curve.boundaryKind !== "line-compound") return;
    const start = solution.points.find((item) => item.roleId === curve.startRoleId)?.point;
    const end = solution.points.find((item) => item.roleId === curve.endRoleId)?.point;
    if (!start || !end || Math.abs(start.compositionBPercent - end.compositionBPercent) > EPSILON
      || Math.abs(curve.recommendedControl.compositionBPercent - start.compositionBPercent) > EPSILON) {
      add(violations, "line-compound-vertical", "phase-model", "A stoichiometric line-compound boundary must remain at one composition.", [`generated-curve:${index}`]);
    }
    const site = puzzle.intermediateCompositions.find((composition) => composition.id === curve.compositionSiteId);
    if (!site || !start || Math.abs(start.compositionBPercent - site.compositionBPercent) > EPSILON) {
      add(violations, "line-boundary-composition-ownership", "phase-model", "Every line-compound boundary must explicitly own and align with one fixed composition site.", [`generated-curve:${index}`]);
    }
  });

  for (const composition of puzzle.intermediateCompositions) {
    const groupPhases = composition.phaseIds.map((id) => phaseById.get(id)).filter(Boolean) as PhaseDefinition[];
    if (groupPhases.length !== composition.phaseIds.length) {
      add(violations, "intermediate-phases-defined", "phase-model", `${composition.id} contains an undefined phase.`);
    }
    if (groupPhases.some((phase) => phase.kind !== "line-compound"
      || phase.compositionSiteId !== composition.id
      || Math.abs((phase.fixedCompositionBPercent ?? Number.NaN) - composition.compositionBPercent) > EPSILON)) {
      add(violations, "line-compound-fixed-composition", "phase-model", `${composition.id} phases must explicitly share its one stoichiometric composition.`);
    }
  }
}

function auditSpinodal(
  solution: HiddenSolution,
  diagram: GeneratedDiagram,
  cells: ExtractedCell[],
  violations: EquilibriumViolation[],
): void {
  const spinodalCurves = solution.curves.map((curve, index) => ({ curve, index }))
    .filter(({ curve }) => curve.boundaryKind === "stability-guide");
  if (spinodalCurves.length === 0) return;
  if (spinodalCurves.length !== 2 || spinodalCurves.some(({ curve }) => curve.fieldBoundary !== false)) {
    add(violations, "spinodal-is-stability-guide", "phase-model", "A spinodal must be a paired, non-equilibrium stability guide inside a miscibility gap.", spinodalCurves.map(({ index }) => `generated-curve:${index}`));
    return;
  }
  const peakRoles = spinodalCurves.flatMap(({ curve }) => [curve.startRoleId, curve.endRoleId])
    .filter((role) => role.includes("peak"));
  if (peakRoles.length !== 2 || peakRoles[0] !== peakRoles[1]) {
    add(violations, "spinodal-critical-tangency", "geometry", "Both spinodal branches must terminate at the binodal critical point.");
  }
  for (const { index } of spinodalCurves) {
    const geometry = diagram.geometry.find((item) => item.id === `generated-curve:${index}`)!;
    const line = geometryPolyline(geometry, diagram.points);
    const midpoint = line[Math.floor(line.length / 2)];
    const containingCell = cells.find((cell) => pointInPolygon(midpoint, cell.polygon));
    const field = containingCell && fieldForCell(containingCell, solution);
    if (!field || field.expectedAssemblage.length !== 2
      || !field.expectedAssemblage.every((phaseId) => phaseId.startsWith("L"))) {
      add(violations, "spinodal-inside-two-liquid-field", "phase-model", "Spinodal branches must lie inside the equilibrium two-liquid field.", [geometry.id]);
    }
  }
}

export function auditPhaseEquilibria(puzzle: PuzzleDefinition, solution: HiddenSolution): PhaseEquilibriaAudit {
  const violations: EquilibriumViolation[] = [];
  const phaseById = new Map(puzzle.phases.map((phase) => [phase.id, phase]));
  const diagram = generatedDiagram(solution);
  const fieldGeometry = diagram.geometry.filter((item) => item.type !== "curve"
    || (item.fieldBoundary !== false && BOUNDARY_RULES[item.boundaryKind ?? "phase-boundary"].equilibriumBoundary));
  const cells = extractFaces(diagram.points, diagram.geometry);

  const roles = new Set<string>();
  solution.points.forEach((item) => {
    if (roles.has(item.roleId)) add(violations, "point-role-unique", "geometry", `Point role ${item.roleId} is duplicated.`, [`point:${item.roleId}`]);
    roles.add(item.roleId);
    if (!Number.isFinite(item.point.compositionBPercent) || !Number.isFinite(item.point.temperatureCelsius)
      || item.point.compositionBPercent < 0 || item.point.compositionBPercent > 100
      || item.point.temperatureCelsius < 0 || item.point.temperatureCelsius > 1100) {
      add(violations, "point-inside-domain", "geometry", `Point ${item.roleId} lies outside the T-X domain.`, [`point:${item.roleId}`]);
    }
  });
  fieldGeometry.forEach((item, index) => {
    if (hasIllegalIntersection(item, fieldGeometry.slice(0, index), diagram.points)) {
      add(violations, "boundaries-do-not-cross", "geometry", `Boundary ${item.id} crosses another boundary away from a declared node.`, [item.id]);
    }
    const line = geometryPolyline(item, diagram.points);
    if (line.length < 2 || sameLogicalPoint(line[0], line[line.length - 1])) {
      add(violations, "boundary-nonzero", "geometry", `Boundary ${item.id} has zero extent.`, [item.id]);
    }
  });

  if (cells.length !== puzzle.expectedFieldCount || cells.length !== solution.expectedFields.length) {
    add(violations, "field-count-contract", "topology", `Extracted ${cells.length} fields, but the puzzle declares ${puzzle.expectedFieldCount} and maps ${solution.expectedFields.length}.`);
  }
  const mappedFields = cells.map((cell) => fieldForCell(cell, solution));
  if (mappedFields.some((field) => !field) || new Set(mappedFields.filter(Boolean)).size !== cells.length) {
    add(violations, "field-map-bijective", "topology", "Every extracted face must map to exactly one independent field witness.");
  }
  solution.expectedFields.forEach((field) => {
    const unique = [...new Set(field.expectedAssemblage)];
    if (unique.length !== field.expectedAssemblage.length || unique.length < 1 || unique.length > 2) {
      add(violations, "binary-field-phase-count", "phase-rule", `Field ${field.role} must contain one or two distinct phases.`);
    }
    if (unique.some((phaseId) => !phaseById.has(phaseId))) {
      add(violations, "field-phases-defined", "phase-model", `Field ${field.role} references an undefined phase.`);
    }
  });
  const smallCells = cells.filter((cell) => Math.abs(polygonArea(cell.polygon)) < 35);
  if (smallCells.length > 0) add(violations, "finite-field-area", "geometry", "A phase field is degenerate or too small to represent a stable finite region.", smallCells.map((cell) => cell.id));

  const topCells = cells.filter((cell) => cell.boundary.some((edge) => edge.geometryId === "frame-top"));
  const topField = topCells.length === 1 ? fieldForCell(topCells[0], solution) : undefined;
  if (topCells.length !== 1 || !topField || topField.expectedAssemblage.length !== 1
    || phaseKind(topField.expectedAssemblage[0], phaseById) !== "liquid") {
    add(violations, "complete-diagram-liquid-top", "phase-rule", "A complete binary T-X diagram must have one connected homogeneous-liquid field across the high-temperature edge.");
  }

  const bottomCells = cells.filter((cell) => cell.boundary.some((edge) => edge.geometryId === "frame-bottom"));
  const liquidBottomCells = bottomCells.filter((cell) => {
    const field = fieldForCell(cell, solution);
    return field?.expectedAssemblage.some((phaseId) => phaseKind(phaseId, phaseById) === "liquid");
  });
  if (bottomCells.length === 0 || liquidBottomCells.length > 0) {
    add(violations, "complete-diagram-solid-bottom", "phase-rule", "A complete condensed binary T-X diagram cannot retain an equilibrium liquid phase on its low-temperature edge.", liquidBottomCells.map((cell) => cell.id));
  }

  const segmentCells = new Map<string, number[]>();
  cells.forEach((cell, cellIndex) => cell.boundary.forEach((edge) => {
    if (!edge.segmentId) return;
    segmentCells.set(edge.segmentId, [...(segmentCells.get(edge.segmentId) ?? []), cellIndex]);
  }));
  let adjacencyCount = 0;
  const reportedAdjacencyRules = new Set<string>();
  for (const [segmentId, adjacent] of segmentCells) {
    const sourceId = cells[adjacent[0]].boundary.find((edge) => edge.segmentId === segmentId)!.geometryId;
    const expectedIncidence = FRAME_IDS.has(sourceId) ? 1 : 2;
    if (adjacent.length !== expectedIncidence) {
      add(violations, "manifold-boundary-incidence", "topology", `Segment ${segmentId} has ${adjacent.length} adjacent fields; expected ${expectedIncidence}.`, [String(sourceId)]);
      continue;
    }
    if (adjacent.length !== 2) continue;
    adjacencyCount += 1;
    const leftField = mappedFields[adjacent[0]];
    const rightField = mappedFields[adjacent[1]];
    if (!leftField || !rightField) continue;
    const geometry = diagram.geometry.find((item) => item.id === sourceId);
    if (!geometry) continue;
    const left = new Set(leftField.expectedAssemblage);
    const right = new Set(rightField.expectedAssemblage);
    const shared = [...left].filter((phase) => right.has(phase));
    const sameFamily = [...left].some((a) => [...right].some((b) => samePhaseFamily(phaseById.get(a), phaseById.get(b))));
    const familyTransitionAllowed = geometry.type === "curve"
      && BOUNDARY_RULES[geometry.boundaryKind ?? "phase-boundary"].permitsSameFamilyTransition;
    if (geometry.type === "curve" && shared.length === 0 && !(sameFamily && familyTransitionAllowed)) {
      const key = `curve-field-adjacency:${sourceId}`;
      if (!reportedAdjacencyRules.has(key)) add(violations, "curve-field-adjacency", "phase-rule", `Crossing ${sourceId} replaces every phase at once, which is not a valid binary equilibrium boundary.`, [sourceId]);
      reportedAdjacencyRules.add(key);
    }
    if (geometry.type === "curve" && geometry.boundaryKind === "ordering-boundary") {
      const leftPhase = left.size === 1 ? phaseById.get([...left][0]) : undefined;
      const rightPhase = right.size === 1 ? phaseById.get([...right][0]) : undefined;
      if (!samePhaseFamily(leftPhase, rightPhase)) {
        const key = `ordering-inside-one-solution:${sourceId}`;
        if (!reportedAdjacencyRules.has(key)) add(violations, "ordering-inside-one-solution", "phase-model", `Ordering boundary ${sourceId} must separate two single-phase variants of the same solid solution.`, [sourceId]);
        reportedAdjacencyRules.add(key);
      }
    }
    if (geometry.type === "curve" && left.size === right.size && shared.length === left.size
      && !(geometry.boundaryKind === "line-compound" && [...left].some((phase) => phaseKind(phase, phaseById) === "line-compound"))) {
      const key = `boundary-changes-assemblage:${sourceId}`;
      if (!reportedAdjacencyRules.has(key)) add(violations, "boundary-changes-assemblage", "topology", `Boundary ${sourceId} separates identical phase assemblages.`, [sourceId]);
      reportedAdjacencyRules.add(key);
    }
    if (geometry.type === "invariant-horizontal") {
      const invariantIndex = Number(sourceId.split(":").at(-1));
      const invariant = solution.invariants[invariantIndex];
      if (!invariant) continue;
      const identity = (phaseId: string) => phaseById.get(phaseId)?.phaseFamilyId ?? phaseId;
      const union = new Set([...left, ...right].map(identity));
      const declared = new Set(invariant.expectedAssemblage.map(identity));
      const exactUnion = union.size === declared.size && [...union].every((phase) => declared.has(phase));
      if (!exactUnion) {
        const key = `invariant-adjacent-phases:${sourceId}`;
        if (!reportedAdjacencyRules.has(key)) add(violations, "invariant-adjacent-phases", "reaction", `Fields adjoining ${sourceId} do not realize its declared three-phase reaction.`, [sourceId]);
        reportedAdjacencyRules.add(key);
      }
    }
  }

  auditInvariantReactions(puzzle, solution, phaseById, violations);
  auditPhaseModels(puzzle, solution, cells, phaseById, violations);
  auditSpinodal(solution, diagram, cells, violations);

  return { valid: violations.length === 0, violations, cellCount: cells.length, adjacencyCount };
}

export function assertPhaseEquilibria(puzzle: PuzzleDefinition, solution: HiddenSolution): void {
  const audit = auditPhaseEquilibria(puzzle, solution);
  if (!audit.valid) {
    const detail = audit.violations.map((violation) => `${violation.ruleId}: ${violation.message}`).join("\n");
    throw new Error(`${solution.puzzleId} failed phase-equilibria validation:\n${detail}`);
  }
}
