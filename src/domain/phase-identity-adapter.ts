import { extractFaces } from "../canvas/face-extraction";
import { pointInPolygon, sameLogicalPoint } from "./geometry";
import {
  derivePhaseIdentity,
  type InferredPhaseFacts,
  type PhaseIdentityPlan,
  type SemanticPhaseRecord,
} from "./phase-identity";
import { boundaryKindForRole } from "./phase-rules";
import { applyDiagramNotation } from "./diagram-notation";
import type {
  ExpectedFieldSpec,
  ExtractedCell,
  HiddenInvariantSolution,
  HiddenSolution,
  PhaseDefinition,
  PhaseId,
  PlayerGeometry,
  PlayerPoint,
  PuzzleDefinition,
  RequiredInvariantSpec,
} from "./schema";

export interface InferredIdentityInputs {
  semanticPhases: SemanticPhaseRecord[];
  inferredFacts: InferredPhaseFacts[];
  cells: ExtractedCell[];
}

export interface AdaptedPhaseIdentity {
  puzzle: PuzzleDefinition;
  solution: HiddenSolution;
  identityPlan: PhaseIdentityPlan;
  inferredFacts: InferredPhaseFacts[];
}

interface PhaseEvidence {
  phase: PhaseDefinition;
  cells: ExtractedCell[];
  singlePhaseCells: ExtractedCell[];
  touchesA: boolean;
  touchesB: boolean;
  centroid: number;
  meanTemperature: number;
  compositionSiteId?: string;
  fixedCompositionBPercent?: number;
  temperatureRole?: "low-temperature" | "high-temperature";
  derivativeOf?: string;
  familyKey?: string;
}

function generatedDiagram(solution: HiddenSolution): { points: PlayerPoint[]; geometry: PlayerGeometry[] } {
  const points: PlayerPoint[] = solution.points.map((item, index) => ({
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
      boundaryKind: curve.boundaryKind ?? boundaryKindForRole(curve.semanticRole),
      compositionSiteId: curve.compositionSiteId,
      fieldBoundary: curve.fieldBoundary,
    })),
    ...solution.invariants.map((invariant, index) => ({
      type: "invariant-horizontal" as const,
      id: `generated-horizontal:${index}`,
      startPointId: `point:${invariant.startRoleId}`,
      endPointId: `point:${invariant.endRoleId}`,
      interiorPointIds: invariant.interiorRoleIds.map((roleId) => `point:${roleId}`),
      temperatureCelsius: invariant.temperatureCelsius,
      phaseOrder: [],
      createdBy: "generated" as const,
    })),
  ];
  return { points, geometry };
}

function fieldForCell(cell: ExtractedCell, solution: HiddenSolution): ExpectedFieldSpec | undefined {
  return solution.expectedFields.find((field) => sameLogicalPoint(field.witnessPoint, cell.labelPoint))
    ?? solution.expectedFields.find((field) => pointInPolygon(field.witnessPoint, cell.polygon));
}

const touches = (cell: ExtractedCell, frameId: "frame-left" | "frame-right") =>
  cell.boundary.some((boundary) => boundary.geometryId === frameId);

const mean = (values: number[], fallback: number): number => values.length
  ? values.reduce((sum, value) => sum + value, 0) / values.length
  : fallback;

function roleCellsFor(evidenceCells: ExtractedCell[]): ExtractedCell[] {
  const edgeSpecific = evidenceCells.filter((cell) => touches(cell, "frame-left") !== touches(cell, "frame-right"));
  return edgeSpecific.length ? edgeSpecific : evidenceCells;
}

function sameCompositionDomain(left: PhaseEvidence, right: PhaseEvidence): boolean {
  if (left.compositionSiteId || right.compositionSiteId) {
    return Boolean(left.compositionSiteId && left.compositionSiteId === right.compositionSiteId);
  }
  return left.touchesA === right.touchesA && left.touchesB === right.touchesB;
}

function compositionContract(evidence: PhaseEvidence): SemanticPhaseRecord["compositionContract"] {
  if (evidence.phase.kind === "liquid") return undefined;
  if (evidence.compositionSiteId) return "fixed-composition";
  if (evidence.touchesA && evidence.touchesB) return "complete-range";
  if (evidence.touchesA) return "a-terminal";
  if (evidence.touchesB) return "b-terminal";
  return "intermediate";
}

function phaseState(phase: PhaseDefinition): SemanticPhaseRecord["state"] {
  if (phase.kind === "liquid") return "liquid";
  if (phase.kind === "line-compound") return "line-compound";
  return "solid-solution";
}

/** Infer identity evidence from cells and boundaries, without reading symbols or names. */
export function inferPhaseIdentityInputs(
  puzzle: PuzzleDefinition,
  solution: HiddenSolution,
): InferredIdentityInputs {
  const { points, geometry } = generatedDiagram(solution);
  const cells = extractFaces(points, geometry);
  const fieldByCell = new Map(cells.map((cell) => [cell.id, fieldForCell(cell, solution)]));
  const topLiquidSourceKey = cells
    .filter((cell) => cell.boundary.some((edge) => edge.geometryId === "frame-top"))
    .map((cell) => fieldByCell.get(cell.id)?.expectedAssemblage)
    .find((assemblage) => assemblage?.length === 1)?.[0];
  const pointByRole = new Map(solution.points.map((item) => [item.roleId, item.point]));
  const monotecticInvariant = solution.invariants.find((invariant) => invariant.reactionType === "monotectic");
  const monotecticParentSourceKey = monotecticInvariant?.reactantPhaseIds?.find((phaseId) =>
    puzzle.phases.find((phase) => phase.id === phaseId)?.kind === "liquid");
  const monotecticProductSourceKey = monotecticInvariant?.productPhaseIds?.find((phaseId) =>
    puzzle.phases.find((phase) => phase.id === phaseId)?.kind === "liquid");
  const invariantCompositionsFor = (phaseId: string): number[] => solution.invariants.flatMap((invariant) => {
    const roleId = invariant.phaseCompositionRoleIds?.[phaseId];
    const composition = roleId ? pointByRole.get(roleId)?.compositionBPercent : undefined;
    return composition === undefined ? [] : [composition];
  });
  const siteByPhase = new Map(puzzle.intermediateCompositions.flatMap((site) =>
    site.phaseIds.map((phaseId) => [phaseId, site] as const)));

  const evidence = new Map<string, PhaseEvidence>();
  for (const phase of puzzle.phases) {
    const phaseCells = cells.filter((cell) => fieldByCell.get(cell.id)?.expectedAssemblage.includes(phase.id));
    const singlePhaseCells = phaseCells.filter((cell) => {
      const assemblage = fieldByCell.get(cell.id)?.expectedAssemblage;
      return assemblage?.length === 1 && assemblage[0] === phase.id;
    });
    const preferredCells = singlePhaseCells.length ? singlePhaseCells : roleCellsFor(phaseCells);
    const site = siteByPhase.get(phase.id);
    evidence.set(phase.id, {
      phase,
      cells: phaseCells,
      singlePhaseCells,
      touchesA: phase.kind !== "line-compound" && preferredCells.some((cell) => touches(cell, "frame-left")),
      touchesB: phase.kind !== "line-compound" && preferredCells.some((cell) => touches(cell, "frame-right")),
      centroid: site?.compositionBPercent
        ?? mean(invariantCompositionsFor(phase.id), mean(preferredCells.map((cell) => cell.labelPoint.compositionBPercent), 50)),
      meanTemperature: mean(singlePhaseCells.map((cell) => cell.labelPoint.temperatureCelsius),
        mean(phaseCells.map((cell) => cell.labelPoint.temperatureCelsius), 550)),
      compositionSiteId: site?.id ?? phase.compositionSiteId,
      fixedCompositionBPercent: site?.compositionBPercent ?? phase.fixedCompositionBPercent,
      familyKey: phase.phaseFamilyId,
    });
  }

  const curveKind = (index: number) => solution.curves[index].boundaryKind
    ?? boundaryKindForRole(solution.curves[index].semanticRole);
  const incidentCells = (index: number) => cells.filter((cell) =>
    cell.boundary.some((boundary) => boundary.geometryId === `generated-curve:${index}`));

  // A polymorph lens directly identifies a same-domain family. Temperature
  // ordering comes from the independently reconstructed single-phase fields.
  const polymorphGroups: string[][] = [];
  solution.curves.forEach((_curve, index) => {
    if (curveKind(index) !== "polymorph-boundary") return;
    for (const cell of incidentCells(index)) {
      const phases = (fieldByCell.get(cell.id)?.expectedAssemblage ?? [])
        .filter((phaseId) => puzzle.phases.find((phase) => phase.id === phaseId)?.kind !== "liquid");
      if (phases.length === 2) polymorphGroups.push([...phases].sort());
    }
  });
  for (const ids of polymorphGroups.filter((group, index, groups) =>
    groups.findIndex((candidate) => candidate.join("|") === group.join("|")) === index)) {
    const members = ids.map((id) => evidence.get(id)).filter((item): item is PhaseEvidence => Boolean(item));
    if (members.length !== 2 || !sameCompositionDomain(members[0], members[1])) continue;
    const familyKey = `inferred-polymorph-${ids.join("-")}`;
    const ordered = [...members].sort((a, b) => a.meanTemperature - b.meanTemperature);
    ordered[0].temperatureRole = "low-temperature";
    ordered[1].temperatureRole = "high-temperature";
    members.forEach((member) => { member.familyKey = familyKey; });
  }

  // Ordering boundaries identify an ordered derivative, even when its stable
  // field spans only the middle of its underlying complete solution domain.
  const orderingCurveIndexes = solution.curves.map((_curve, index) => index)
    .filter((index) => curveKind(index) === "ordering-boundary");
  if (orderingCurveIndexes.length) {
    const orderingCells = [...new Set(orderingCurveIndexes.flatMap(incidentCells))];
    const orderedIds = new Set(orderingCells.flatMap((cell) => {
      const field = fieldByCell.get(cell.id);
      return field?.texture === "ordered-solid-solution" ? field.expectedAssemblage : [];
    }));
    for (const orderedId of orderedIds) {
      const ordered = evidence.get(orderedId);
      if (!ordered) continue;
      const baseCandidates = orderingCells.flatMap((cell) => fieldByCell.get(cell.id)?.expectedAssemblage ?? [])
        .filter((phaseId) => phaseId !== orderedId && evidence.get(phaseId)?.phase.kind !== "liquid");
      const baseId = baseCandidates.find((phaseId) => !orderedIds.has(phaseId));
      const base = baseId ? evidence.get(baseId) : undefined;
      if (!base) continue;
      const familyKey = `inferred-ordering-${baseId}`;
      base.familyKey = familyKey;
      ordered.familyKey = familyKey;
      ordered.derivativeOf = baseId;
      // The ordered stability field may be a dome inside a complete-range
      // solution; inherit the underlying compositional scope for notation.
      ordered.touchesA = base.touchesA;
      ordered.touchesB = base.touchesB;
      ordered.centroid = base.centroid;
    }
  }

  // Same-domain, non-derivative family members without an explicit boundary
  // still receive an independently measured low/high ordering.
  const familyGroups = new Map<string, PhaseEvidence[]>();
  for (const item of evidence.values()) {
    if (!item.familyKey || item.derivativeOf || item.phase.kind === "liquid") continue;
    familyGroups.set(item.familyKey, [...(familyGroups.get(item.familyKey) ?? []), item]);
  }
  for (const group of familyGroups.values()) {
    if (group.length !== 2 || !sameCompositionDomain(group[0], group[1])
      || group.some((item) => item.temperatureRole)) continue;
    const ordered = [...group].sort((a, b) => a.meanTemperature - b.meanTemperature);
    ordered[0].temperatureRole = "low-temperature";
    ordered[1].temperatureRole = "high-temperature";
  }

  const semanticPhases: SemanticPhaseRecord[] = [...evidence.values()].map((item) => ({
    sourceKey: item.phase.id,
    state: phaseState(item.phase),
    compositionContract: compositionContract(item),
    temperatureContract: item.temperatureRole,
    familyKey: item.familyKey,
    formulaLabel: siteByPhase.get(item.phase.id)?.label,
    relationship: item.derivativeOf
      ? { kind: "ordered-derivative", baseSourceKey: item.derivativeOf }
      : undefined,
    required: item.phase.required,
  }));
  const inferredFacts: InferredPhaseFacts[] = [...evidence.values()].map((item) => ({
    sourceKey: item.phase.id,
    touchesA: item.touchesA,
    touchesB: item.touchesB,
    compositionCentroidBPercent: item.centroid,
    compositionSiteId: item.compositionSiteId,
    fixedCompositionBPercent: item.fixedCompositionBPercent,
    temperatureRole: item.temperatureRole,
    derivativeOf: item.derivativeOf,
    liquidRole: item.phase.kind !== "liquid" ? undefined
      : item.phase.id === monotecticParentSourceKey ? "monotectic-parent"
        : item.phase.id === monotecticProductSourceKey ? "monotectic-product"
          : item.phase.id === topLiquidSourceKey ? "homogeneous-parent"
            : "immiscible-branch",
    visibleNotationAnchor: false,
  }));
  return { semanticPhases, inferredFacts, cells };
}

function remapIds(ids: PhaseId[] | undefined, idMap: ReadonlyMap<PhaseId, PhaseId>): PhaseId[] | undefined {
  return ids?.map((id) => idMap.get(id) ?? id);
}

function remapRoleRecord(
  record: Record<PhaseId, string> | undefined,
  idMap: ReadonlyMap<PhaseId, PhaseId>,
): Record<PhaseId, string> | undefined {
  return record && Object.fromEntries(Object.entries(record).map(([phaseId, roleId]) => [idMap.get(phaseId) ?? phaseId, roleId]));
}

function remapInvariant<T extends HiddenInvariantSolution | RequiredInvariantSpec>(
  invariant: T,
  idMap: ReadonlyMap<PhaseId, PhaseId>,
): T {
  return {
    ...invariant,
    expectedAssemblage: remapIds(invariant.expectedAssemblage, idMap)!,
    reactantPhaseIds: remapIds(invariant.reactantPhaseIds, idMap),
    productPhaseIds: remapIds(invariant.productPhaseIds, idMap),
    phaseCompositionRoleIds: remapRoleRecord(invariant.phaseCompositionRoleIds, idMap),
  };
}

/** Apply the independently inferred identity plan to every phase reference. */
export function adaptPhaseIdentities(
  puzzle: PuzzleDefinition,
  solution: HiddenSolution,
): AdaptedPhaseIdentity {
  const inferred = inferPhaseIdentityInputs(puzzle, solution);
  const rawIdentityPlan = derivePhaseIdentity(inferred.semanticPhases, inferred.inferredFacts);
  const liquidIdForSymbol = (symbol: string): string => symbol
    .replace("L₁", "L1")
    .replace("L₂", "L2")
    .replace("L₃", "L3");
  const rawPhaseBySource = new Map(rawIdentityPlan.phases.map((phase) => [phase.sourceKey, phase]));
  // Liquid ids follow the derived equilibrium notation so all field and
  // invariant references stay aligned when source-local names were reversed.
  const finalIdBySource = new Map(puzzle.phases.map((phase) => [
    phase.id,
    phase.kind === "liquid"
      ? liquidIdForSymbol(rawPhaseBySource.get(phase.id)?.symbol ?? phase.symbol)
      : rawIdentityPlan.phaseIdBySourceKey.get(phase.id) ?? phase.id,
  ]));
  const rawToFinal = new Map(puzzle.phases.map((phase) => [
    rawIdentityPlan.phaseIdBySourceKey.get(phase.id) ?? phase.id,
    finalIdBySource.get(phase.id)!,
  ]));
  const identityPlan: PhaseIdentityPlan = {
    phases: rawIdentityPlan.phases.map((phase) => ({ ...phase, id: finalIdBySource.get(phase.sourceKey) ?? phase.id })),
    phaseIdBySourceKey: finalIdBySource,
    answerAutomorphisms: rawIdentityPlan.answerAutomorphisms.map((mapping) => new Map(
      [...mapping].map(([from, to]) => [rawToFinal.get(from) ?? from, rawToFinal.get(to) ?? to]),
    )),
  };
  const idMap = new Map(puzzle.phases.map((phase) => [phase.id, finalIdBySource.get(phase.id) ?? phase.id]));
  const derivativeKeys = new Set(inferred.semanticPhases
    .filter((phase) => phase.relationship)
    .map((phase) => phase.sourceKey));
  const stableDomainRole = (sourceKey: string): PhaseDefinition["compositionRole"] => {
    const singleCells = inferred.cells.filter((cell) => {
      const field = fieldForCell(cell, solution);
      return field?.expectedAssemblage.length === 1 && field.expectedAssemblage[0] === sourceKey;
    });
    const reachesA = singleCells.some((cell) => touches(cell, "frame-left"));
    const reachesB = singleCells.some((cell) => touches(cell, "frame-right"));
    return reachesA && reachesB ? "complete-range" : reachesA ? "a-terminal" : reachesB ? "b-terminal" : "intermediate";
  };
  const hasFiniteSinglePhaseField = (sourceKey: string) => inferred.cells.some((cell) => {
    const field = fieldForCell(cell, solution);
    return field?.expectedAssemblage.length === 1 && field.expectedAssemblage[0] === sourceKey;
  });
  const remapFields = (fields: ExpectedFieldSpec[]): ExpectedFieldSpec[] => fields.map((field) => ({
    ...field,
    expectedAssemblage: remapIds(field.expectedAssemblage, idMap)!,
  }));

  const remappedSolution: HiddenSolution = {
    ...solution,
    invariants: solution.invariants.map((invariant) => remapInvariant(invariant, idMap)),
    expectedFields: remapFields(solution.expectedFields),
  };
  const remappedPuzzle: PuzzleDefinition = {
    ...puzzle,
    phases: identityPlan.phases.map(({ sourceKey, inferredCompositionRole: _inferredRole, ...phase }) => ({
      ...phase,
      // PhaseCompositionRole describes the stable field checked by the legacy
      // validator. An ordered derivative inherits its base scope for notation,
      // but its own stability dome can remain composition-intermediate.
      compositionRole: derivativeKeys.has(sourceKey)
        ? stableDomainRole(sourceKey)
        : phase.kind !== "line-compound" && phase.kind !== "liquid" && !hasFiniteSinglePhaseField(sourceKey)
          ? undefined
          : phase.compositionRole,
    })),
    intermediateCompositions: puzzle.intermediateCompositions.map((site) => ({
      ...site,
      phaseIds: remapIds(site.phaseIds, idMap)!,
    })),
    requiredInvariants: puzzle.requiredInvariants.map((invariant) => remapInvariant(invariant, idMap)),
    expectedFields: remapFields(puzzle.expectedFields),
  };
  const notated = applyDiagramNotation(remappedPuzzle, remappedSolution);
  return { puzzle: notated.puzzle, solution: notated.solution, identityPlan, inferredFacts: inferred.inferredFacts };
}
