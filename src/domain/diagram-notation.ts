import type {
  DiagramLabelDefinition,
  DiagramLabelId,
  ExpectedFieldSpec,
  HiddenInvariantSolution,
  HiddenSolution,
  PhaseDefinition,
  PhaseId,
  PuzzleDefinition,
  ReactionType,
  RequiredInvariantSpec,
} from "./schema";

interface BranchFamily {
  familyId: string;
  phaseIds: Set<PhaseId>;
  globalLabelId: DiagramLabelId;
  globalSymbol: string;
  localSymbols: Map<PhaseId, string>;
}

const subscript = (value: number): string => String(value).replace(/1/g, "₁").replace(/2/g, "₂").replace(/3/g, "₃");

function localSymbolsForInvariant(
  invariant: HiddenInvariantSolution,
  phases: PhaseDefinition[],
): Record<PhaseId, string> {
  const byId = new Map(phases.map((phase) => [phase.id, phase]));
  const notation = Object.fromEntries(invariant.expectedAssemblage.map((id) => [id, byId.get(id)?.symbol ?? id]));
  const liquids = invariant.expectedAssemblage.filter((id) => byId.get(id)?.kind === "liquid");

  if (invariant.reactionType === "monotectic") {
    const parent = invariant.reactantPhaseIds?.find((id) => byId.get(id)?.kind === "liquid");
    const product = invariant.productPhaseIds?.find((id) => byId.get(id)?.kind === "liquid");
    if (parent) notation[parent] = "L₁";
    if (product) notation[product] = "L₂";
  } else if (invariant.reactionType === "syntectic") {
    liquids.forEach((id, index) => { notation[id] = `L${subscript(index + 1)}`; });
  } else if (invariant.reactionType === "monotectoid") {
    const familyCounts = new Map<string, PhaseId[]>();
    invariant.expectedAssemblage.forEach((id) => {
      const family = byId.get(id)?.phaseFamilyId;
      if (family) familyCounts.set(family, [...(familyCounts.get(family) ?? []), id]);
    });
    const branches = [...familyCounts.values()].find((ids) => ids.length > 1) ?? [];
    const parent = invariant.reactantPhaseIds?.find((id) => branches.includes(id));
    const product = invariant.productPhaseIds?.find((id) => branches.includes(id));
    if (parent) notation[parent] = "α₁";
    if (product) notation[product] = "α₂";
  }
  return notation;
}

function branchFamilies(
  invariants: HiddenInvariantSolution[],
  phases: PhaseDefinition[],
): BranchFamily[] {
  const byId = new Map(phases.map((phase) => [phase.id, phase]));
  const result = new Map<string, BranchFamily>();
  invariants.forEach((invariant) => {
    const notation = localSymbolsForInvariant(invariant, phases);
    const grouped = new Map<string, PhaseId[]>();
    invariant.expectedAssemblage.forEach((id) => {
      const familyId = byId.get(id)?.phaseFamilyId;
      if (familyId) grouped.set(familyId, [...(grouped.get(familyId) ?? []), id]);
    });
    grouped.forEach((ids, familyId) => {
      if (ids.length < 2) return;
      const existingGlobal = phases.find((phase) => phase.phaseFamilyId === familyId && !ids.includes(phase.id)
        && !/[₁₂₃]$/.test(phase.symbol));
      const globalSymbol = invariant.reactionType === "monotectoid" ? "α" : existingGlobal?.symbol ?? notation[ids[0]].replace(/[₁₂₃]$/, "");
      const family = result.get(familyId) ?? {
        familyId,
        phaseIds: new Set<PhaseId>(),
        globalLabelId: existingGlobal?.id ?? `family:${familyId}`,
        globalSymbol,
        localSymbols: new Map<PhaseId, string>(),
      };
      ids.forEach((id) => {
        family.phaseIds.add(id);
        family.localSymbols.set(id, notation[id]);
      });
      result.set(familyId, family);
    });
  });
  return [...result.values()];
}

function labelIdsForAssemblage(assemblage: PhaseId[], families: BranchFamily[]): DiagramLabelId[] {
  return assemblage.map((phaseId) => {
    const family = families.find((candidate) => candidate.phaseIds.has(phaseId));
    return family && assemblage.length === 1 ? family.globalLabelId : phaseId;
  });
}

function labelsFor(phases: PhaseDefinition[], families: BranchFamily[]): DiagramLabelDefinition[] {
  const branchPhaseIds = new Set(families.flatMap((family) => [...family.phaseIds]));
  const hiddenGlobalPhaseIds = new Set(families.map((family) => family.globalLabelId));
  const labels: DiagramLabelDefinition[] = phases
    .filter((phase) => !hiddenGlobalPhaseIds.has(phase.id) || !branchPhaseIds.has(phase.id))
    .map((phase) => {
      const family = families.find((candidate) => candidate.phaseIds.has(phase.id));
      return {
        id: phase.id,
        symbol: family?.localSymbols.get(phase.id) ?? phase.symbol,
        name: phase.name,
        phaseIds: [phase.id],
        scope: family ? "invariant-branch" as const : "global-phase" as const,
        colorPhaseId: phase.id,
        labelEquivalenceGroup: phase.labelEquivalenceGroup,
      };
    });
  families.forEach((family) => {
    const existing = labels.find((label) => label.id === family.globalLabelId);
    const members = [...family.phaseIds];
    if (existing) {
      existing.symbol = family.globalSymbol;
      existing.phaseIds = [...new Set([...existing.phaseIds, ...members])];
      existing.scope = "global-phase";
      return;
    }
    labels.push({
      id: family.globalLabelId,
      symbol: family.globalSymbol,
      name: `${family.globalSymbol} solid-solution field`,
      phaseIds: members,
      scope: "global-phase",
      colorPhaseId: members[0],
    });
  });
  return labels;
}

const withLabels = (fields: ExpectedFieldSpec[], families: BranchFamily[]): ExpectedFieldSpec[] => fields.map((field) => ({
  ...field,
  expectedLabelIds: labelIdsForAssemblage(field.expectedAssemblage, families),
}));

function withInvariantNotation<T extends HiddenInvariantSolution | RequiredInvariantSpec>(
  invariant: T,
  phases: PhaseDefinition[],
): T {
  return { ...invariant, participantNotation: localSymbolsForInvariant(invariant as HiddenInvariantSolution, phases) };
}

export function formatInvariantEquation(
  invariant: HiddenInvariantSolution,
  phases: PhaseDefinition[],
): string {
  const notation = invariant.participantNotation ?? localSymbolsForInvariant(invariant, phases);
  const side = (ids: PhaseId[] | undefined) => (ids ?? []).map((id) => notation[id] ?? id).join(" + ");
  return `${side(invariant.reactantPhaseIds)} → ${side(invariant.productPhaseIds)}`;
}

/** Build the player notation as a projection of, never a replacement for, the physics model. */
export function applyDiagramNotation(
  puzzle: PuzzleDefinition,
  solution: HiddenSolution,
): { puzzle: PuzzleDefinition; solution: HiddenSolution } {
  const families = branchFamilies(solution.invariants, puzzle.phases);
  const invariants = solution.invariants.map((invariant) => withInvariantNotation(invariant, puzzle.phases));
  const expectedFields = withLabels(solution.expectedFields, families);
  const diagramLabels = labelsFor(puzzle.phases, families);
  const primary = invariants.find((invariant) => invariant.reactionType !== "eutectic") ?? invariants[0];
  const titleBase = puzzle.title.split(" · ")[0];
  return {
    solution: { ...solution, invariants, expectedFields },
    puzzle: {
      ...puzzle,
      title: primary ? `${titleBase} · ${formatInvariantEquation(primary, puzzle.phases)}` : titleBase,
      diagramLabels,
      expectedFields,
      requiredInvariants: puzzle.requiredInvariants.map((invariant) => withInvariantNotation(invariant, puzzle.phases)),
    },
  };
}

export function expectedLabels(field: ExpectedFieldSpec): DiagramLabelId[] {
  return field.expectedLabelIds ?? field.expectedAssemblage;
}

export const reactionUsesLocalBranches = (type: ReactionType): boolean =>
  type === "monotectic" || type === "monotectoid" || type === "syntectic";
