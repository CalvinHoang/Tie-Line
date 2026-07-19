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
  const legacyComposed = puzzle.id.includes("rule-composed") || puzzle.id.includes("composable-");
  const symbolOwners = new Map<string, string[]>();
  puzzle.phases.filter((phase) => phase.kind === "line-compound" || phase.kind === "intermediate-solid-solution")
    .forEach((phase) => symbolOwners.set(phase.symbol, [...(symbolOwners.get(phase.symbol) ?? []), phase.id]));
  for (const [symbol, phaseIds] of symbolOwners) {
    if (phaseIds.length > 1) {
      add(violations, "intermediate-phase-symbol-unique", "phase-model", `Intermediate symbol ${symbol} is assigned to unrelated phases ${phaseIds.join(", ")}.`, phaseIds);
    }
  }
  for (const phase of puzzle.phases) {
    const singlePhaseCells = cells.filter((cell) => fieldForCell(cell, solution)?.expectedAssemblage.length === 1
      && fieldForCell(cell, solution)?.expectedAssemblage[0] === phase.id);
    if (phase.kind === "line-compound" && singlePhaseCells.length > 0) {
      add(violations, "line-compound-zero-width", "phase-model", `Line compound ${phase.id} cannot occupy a finite-area single-phase field.`, singlePhaseCells.map((cell) => cell.id));
    }
    if (!legacyComposed && phase.kind === "intermediate-solid-solution" && singlePhaseCells.length === 0) {
      add(violations, "solid-solution-finite-width", "phase-model", `Intermediate solid solution ${phase.id} requires a finite-area single-phase field.`, [phase.id]);
    }

    const touchesLeft = singlePhaseCells.some((cell) => cell.boundary.some((edge) => edge.geometryId === "frame-left"));
    const touchesRight = singlePhaseCells.some((cell) => cell.boundary.some((edge) => edge.geometryId === "frame-right"));
    if (!legacyComposed && phase.compositionRole === "a-terminal" && (!touchesLeft || touchesRight)) {
      add(violations, "a-terminal-domain", "phase-model", `${phase.id} is declared A-terminal but does not occupy only the A-side composition edge.`, [phase.id]);
    }
    if (!legacyComposed && phase.compositionRole === "b-terminal" && (!touchesRight || touchesLeft)) {
      add(violations, "b-terminal-domain", "phase-model", `${phase.id} is declared B-terminal but does not occupy only the B-side composition edge.`, [phase.id]);
    }
    if (!legacyComposed && phase.compositionRole === "intermediate" && (touchesLeft || touchesRight)) {
      add(violations, "intermediate-domain", "phase-model", `${phase.id} is declared intermediate but reaches an end-member composition edge.`, [phase.id]);
    }
    if (!legacyComposed && phase.compositionRole === "complete-range" && (!touchesLeft || !touchesRight)) {
      add(violations, "complete-range-domain", "phase-model", `${phase.id} is declared a complete-range solution but does not reach both end-member composition edges.`, [phase.id]);
    }

    const canonicalSymbol = phase.compositionRole === "a-terminal"
      ? "α"
      : phase.compositionRole === "b-terminal"
        ? "β"
        : phase.compositionRole === "complete-range" && phase.temperatureRole === "low-temperature"
          ? "α"
          : phase.compositionRole === "complete-range" && phase.temperatureRole === "high-temperature"
            ? "β"
            : undefined;
    if (!legacyComposed && canonicalSymbol && phase.symbol !== canonicalSymbol) {
      add(violations, "phase-notation-role", "phase-model", `${phase.id} must use ${canonicalSymbol} for its declared composition/temperature role.`, [phase.id]);
    }
  }

  const liquidPhases = puzzle.phases.filter((phase) => phase.kind === "liquid");
  const topLiquidIds = new Set(cells
    .filter((cell) => cell.boundary.some((edge) => edge.geometryId === "frame-top"))
    .flatMap((cell) => {
      const field = fieldForCell(cell, solution);
      return field?.expectedAssemblage.length === 1 ? field.expectedAssemblage : [];
    }));
  const topLiquid = liquidPhases.find((phase) => topLiquidIds.has(phase.id));
  if (liquidPhases.length === 1) {
    if (liquidPhases[0].symbol !== "L") {
      add(violations, "liquid-notation-role", "phase-model", "A single homogeneous liquid must use L.", [liquidPhases[0].id]);
    }
  } else if (liquidPhases.length === 2) {
    const branchLiquid = liquidPhases.find((phase) => phase.id !== topLiquid?.id);
    if (!topLiquid || topLiquid.symbol !== "L₁" || branchLiquid?.symbol !== "L₂") {
      add(violations, "liquid-notation-role", "phase-model", "A monotectic parent liquid must be L₁ and its separated liquid product must be L₂.", liquidPhases.map((phase) => phase.id));
    }
  } else if (liquidPhases.length > 2) {
    const branchSymbols = liquidPhases.filter((phase) => phase.id !== topLiquid?.id).map((phase) => phase.symbol);
    const expectedBranchSymbols = liquidPhases.slice(1).map((_, index) => `L${String(index + 1).replace("1", "₁").replace("2", "₂").replace("3", "₃")}`);
    if (!topLiquid || topLiquid.symbol !== "L"
      || branchSymbols.length !== new Set(branchSymbols).size
      || !expectedBranchSymbols.every((symbol) => branchSymbols.includes(symbol))) {
      add(violations, "liquid-notation-role", "phase-model", "A homogeneous parent liquid must use L; immiscible branches must use distinct L₁, L₂, … notation.", liquidPhases.map((phase) => phase.id));
    }
  }

  for (const invariant of solution.invariants.filter((item) => item.reactionType === "monotectic")) {
    const parent = phaseById.get(invariant.reactantPhaseIds?.find((id) => phaseById.get(id)?.kind === "liquid") ?? "");
    const product = phaseById.get(invariant.productPhaseIds?.find((id) => phaseById.get(id)?.kind === "liquid") ?? "");
    if (parent?.symbol !== "L₁" || product?.symbol !== "L₂") {
      add(violations, "monotectic-liquid-identity", "reaction", "Monotectic notation must follow L₁ → L₂ + solid on cooling.", [parent?.id, product?.id].filter((id): id is string => Boolean(id)));
    }
  }

  const equivalenceGroups = new Map<string, PhaseDefinition[]>();
  puzzle.phases.forEach((phase) => {
    if (!phase.labelEquivalenceGroup) return;
    equivalenceGroups.set(phase.labelEquivalenceGroup, [...(equivalenceGroups.get(phase.labelEquivalenceGroup) ?? []), phase]);
  });
  for (const [groupId, group] of equivalenceGroups) {
    const familyIds = new Set(group.map((phase) => phase.phaseFamilyId));
    const temperatureRoles = new Set(group.map((phase) => phase.temperatureRole));
    if (group.length < 2 || familyIds.size !== 1 || familyIds.has(undefined)
      || group.some((phase) => phase.compositionRole !== "complete-range")
      || temperatureRoles.size !== group.length || temperatureRoles.has(undefined)) {
      add(violations, "label-equivalence-unanchored", "phase-model", `Label-equivalence group ${groupId} must contain distinct temperature variants of one complete-range phase family.`, group.map((phase) => phase.id));
    }
  }

  const phaseGroups = new Map<string, PhaseDefinition[]>();
  puzzle.phases.forEach((phase) => {
    if (!phase.phaseFamilyId) return;
    phaseGroups.set(phase.phaseFamilyId, [...(phaseGroups.get(phase.phaseFamilyId) ?? []), phase]);
  });
  for (const [groupId, group] of phaseGroups) {
    if (group.length < 2 || group.some((phase) => phase.compositionGroupId || phase.kind === "line-compound")
      || group.every((phase) => phase.kind === "line-compound" || phase.kind === "liquid")) continue;
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
      add(violations, "line-boundary-composition-ownership", "phase-model", `Every line-compound boundary must explicitly own and align with one fixed composition site (curve ${curve.compositionSiteId ?? "unowned"} at ${start?.compositionBPercent ?? "missing"}; site ${site?.compositionBPercent ?? "missing"}).`, [`generated-curve:${index}`]);
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

  for (const phase of puzzle.phases.filter((candidate) => candidate.intermediateThermalMode)) {
    const mode = phase.intermediateThermalMode!;
    const expectedReaction = mode === "incongruent" ? "peritectic" : mode;
    const matchingInvariant = solution.invariants.find((invariant) =>
      invariant.reactionType === expectedReaction && invariant.expectedAssemblage.includes(phase.id));
    if (mode === "congruent" && !solution.points.some((item) => item.roleId === `${phase.id}-peak-composed`)) {
      add(violations, "congruent-intermediate-peak", "phase-model", `${phase.id} must terminate at its own liquidus peak.`, [phase.id]);
    }
    if (mode === "incongruent" && (!matchingInvariant || !matchingInvariant.productPhaseIds?.includes(phase.id))) {
      add(violations, "incongruent-intermediate-peritectic", "reaction", `${phase.id} must terminate as the solid product of a peritectic.`, [phase.id]);
    }
    if (mode === "eutectoid" || mode === "peritectoid") {
      if (!matchingInvariant || matchingInvariant.expectedAssemblage.some((phaseId) => phaseById.get(phaseId)?.kind === "liquid")) {
        add(violations, "subsolidus-intermediate-invariant", "reaction", `${phase.id} must be realized by its liquid-free ${mode} invariant.`, [phase.id]);
      }
    }
    const finitePartialField = solution.expectedFields.some((field) => field.expectedAssemblage.length === 1
      && field.expectedAssemblage[0] === phase.id && field.texture === "partial-solubility");
    if (phase.partialSolubility && (phase.kind !== "intermediate-solid-solution" || !finitePartialField)) {
      add(violations, "intermediate-partial-solubility-field", "phase-model", `${phase.id} is marked partially soluble but has no finite-width single-phase field.`, [phase.id]);
    }
    if (phase.partialSolubility === false && phase.kind !== "line-compound") {
      add(violations, "intermediate-fixed-composition-kind", "phase-model", `${phase.id} is fixed-composition and must remain a line compound.`, [phase.id]);
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

function auditDiagramNotation(
  puzzle: PuzzleDefinition,
  solution: HiddenSolution,
  violations: EquilibriumViolation[],
): void {
  const labels = new Map(puzzle.diagramLabels.map((label) => [label.id, label]));
  if (labels.size !== puzzle.diagramLabels.length) {
    add(violations, "diagram-label-id-unique", "phase-model", "Every diagram label token must have a unique id.");
  }
  for (const field of solution.expectedFields) {
    const labelIds = field.expectedLabelIds ?? [];
    if (labelIds.length !== field.expectedAssemblage.length) {
      add(violations, "field-label-projection-cardinality", "phase-model", `Field ${field.role} must project every thermodynamic phase to one diagram label.`);
      continue;
    }
    const remaining = [...field.expectedAssemblage];
    for (const labelId of labelIds) {
      const label = labels.get(labelId);
      if (!label) {
        add(violations, "field-label-defined", "phase-model", `Field ${field.role} references undefined diagram label ${labelId}.`);
        continue;
      }
      const index = remaining.findIndex((phaseId) => label.phaseIds.includes(phaseId));
      if (index < 0) {
        add(violations, "field-label-projects-assemblage", "phase-model", `Label ${label.symbol} does not represent any remaining phase in field ${field.role}.`);
      } else {
        remaining.splice(index, 1);
      }
      if (field.expectedAssemblage.length === 1 && label.scope !== "global-phase") {
        add(violations, "single-phase-uses-global-notation", "phase-model", `Single-phase field ${field.role} must use global phase notation, not an invariant branch subscript.`);
      }
    }
  }
  for (const [index, invariant] of solution.invariants.entries()) {
    const notation = invariant.participantNotation ?? {};
    if (invariant.expectedAssemblage.some((phaseId) => !notation[phaseId])) {
      add(violations, "invariant-local-notation-complete", "phase-model", `Invariant ${index + 1} must define local notation for every participant.`, [`generated-horizontal:${index}`]);
    }
  }
}

export function auditPhaseEquilibria(puzzle: PuzzleDefinition, solution: HiddenSolution): PhaseEquilibriaAudit {
  const violations: EquilibriumViolation[] = [];
  const legacyComposed = puzzle.id.includes("rule-composed") || puzzle.id.includes("composable-");
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
  solution.invariants.forEach((invariant, invariantIndex) => {
    if (!invariant.incidence && invariant.reactionType !== "catatectic") return;
    const adjacent = cells
      .map((cell, cellIndex) => ({ cell, field: mappedFields[cellIndex] }))
      .filter(({ cell, field }) => field && cell.boundary.some((edge) => edge.geometryId === `generated-horizontal:${invariantIndex}`));
    const keys = (side: "above" | "below") => new Set(adjacent
      .filter(({ cell }) => side === "above"
        ? cell.labelPoint.temperatureCelsius > invariant.temperatureCelsius
        : cell.labelPoint.temperatureCelsius < invariant.temperatureCelsius)
      .map(({ field }) => [...field!.expectedAssemblage].sort().join("+")));
    const above = keys("above");
    const below = keys("below");
    const assemblageKey = (phases: string[]) => [...phases].sort().join("+");
    const [leftProduct, parent, rightProduct] = invariant.expectedAssemblage;
    const expectedAbove = new Set((invariant.incidence?.above ?? [
      [leftProduct, parent],
      [parent, rightProduct],
    ]).map(assemblageKey));
    const expectedBelow = new Set((invariant.incidence?.below ?? [
      [leftProduct, rightProduct],
    ]).map(assemblageKey));
    const matches = (actual: Set<string>, expected: Set<string>) => actual.size === expected.size
      && [...actual].every((key) => expected.has(key));
    if (!matches(above, expectedAbove) || !matches(below, expectedBelow)) {
      const ruleId = invariant.reactionType === "catatectic" ? "catatectic-decomposition-incidence" : "invariant-local-incidence";
      add(violations, ruleId, "reaction", `${invariant.reactionType} incidence is above [${[...above].join(" | ")}] / below [${[...below].join(" | ")}], expected above [${[...expectedAbove].join(" | ")}] / below [${[...expectedBelow].join(" | ")}].`, [`generated-horizontal:${invariantIndex}`]);
    }
  });
  const smallCells = cells.filter((cell) => Math.abs(polygonArea(cell.polygon)) < 35);
  if (smallCells.length > 0) add(violations, "finite-field-area", "geometry", "A phase field is degenerate or too small to represent a stable finite region.", smallCells.map((cell) => cell.id));

  const topCells = cells.filter((cell) => cell.boundary.some((edge) => edge.geometryId === "frame-top"));
  const topField = topCells.length === 1 ? fieldForCell(topCells[0], solution) : undefined;
  if (topCells.length !== 1 || !topField || topField.expectedAssemblage.length !== 1
    || phaseKind(topField.expectedAssemblage[0], phaseById) !== "liquid") {
    add(violations, "complete-diagram-liquid-top", "phase-rule", "A complete binary T-X diagram must have one connected homogeneous-liquid field across the high-temperature edge.");
  } else {
    const topPhaseId = topField.expectedAssemblage[0];
    const topPhase = phaseById.get(topPhaseId);
    if (topPhaseId !== "L" || topPhase?.symbol !== "L") {
      add(violations, "homogeneous-liquid-notation", "phase-model", "The complete high-temperature field must use phase id and symbol L; L₁ and L₂ are reserved for coexisting liquid compositions and their invariant reaction.", [topPhaseId]);
    }
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
    if (!legacyComposed && geometry.type === "curve" && shared.length === 0 && !(sameFamily && familyTransitionAllowed)) {
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
      && !geometry.semanticRole?.includes("-composed-line-")
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
  auditDiagramNotation(puzzle, solution, violations);

  return { valid: violations.length === 0, violations, cellCount: cells.length, adjacencyCount };
}

export function assertPhaseEquilibria(puzzle: PuzzleDefinition, solution: HiddenSolution): void {
  const audit = auditPhaseEquilibria(puzzle, solution);
  if (!audit.valid) {
    const detail = audit.violations.map((violation) => `${violation.ruleId}: ${violation.message}`).join("\n");
    throw new Error(`${solution.puzzleId} failed phase-equilibria validation:\n${detail}`);
  }
}
