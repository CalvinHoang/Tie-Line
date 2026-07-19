import type { BoundaryKind, PhaseDefinition, PhaseId, ReactionType } from "./schema";

export interface ReactionRule {
  type: ReactionType;
  title: string;
  coolingEquation: string;
  reactantKinds: ReadonlyArray<"liquid" | "solid">;
  productKinds: ReadonlyArray<"liquid" | "solid">;
  /** In every supported binary invariant, the one-phase side owns the interior composition. */
  interiorCompositionSide: "reactants" | "products";
  interiorPhaseSelection: "only-liquid" | "only-solid" | "assemblage-middle";
}

export const REACTION_RULES: Record<ReactionType, ReactionRule> = {
  eutectic: { type: "eutectic", title: "Eutectic", coolingEquation: "L → α + β", reactantKinds: ["liquid"], productKinds: ["solid", "solid"], interiorCompositionSide: "reactants", interiorPhaseSelection: "only-liquid" },
  eutectoid: { type: "eutectoid", title: "Eutectoid", coolingEquation: "γ → α + β", reactantKinds: ["solid"], productKinds: ["solid", "solid"], interiorCompositionSide: "reactants", interiorPhaseSelection: "assemblage-middle" },
  peritectic: { type: "peritectic", title: "Peritectic", coolingEquation: "L + α → β", reactantKinds: ["liquid", "solid"], productKinds: ["solid"], interiorCompositionSide: "products", interiorPhaseSelection: "assemblage-middle" },
  peritectoid: { type: "peritectoid", title: "Peritectoid", coolingEquation: "α + β → γ", reactantKinds: ["solid", "solid"], productKinds: ["solid"], interiorCompositionSide: "products", interiorPhaseSelection: "assemblage-middle" },
  monotectic: { type: "monotectic", title: "Monotectic", coolingEquation: "L₁ → L₂ + α", reactantKinds: ["liquid"], productKinds: ["liquid", "solid"], interiorCompositionSide: "reactants", interiorPhaseSelection: "assemblage-middle" },
  monotectoid: { type: "monotectoid", title: "Monotectoid", coolingEquation: "α₁ → α₂ + β", reactantKinds: ["solid"], productKinds: ["solid", "solid"], interiorCompositionSide: "reactants", interiorPhaseSelection: "assemblage-middle" },
  syntectic: { type: "syntectic", title: "Syntectic", coolingEquation: "L₁ + L₂ → α", reactantKinds: ["liquid", "liquid"], productKinds: ["solid"], interiorCompositionSide: "products", interiorPhaseSelection: "only-solid" },
  catatectic: { type: "catatectic", title: "Catatectic (metatectic)", coolingEquation: "β → α + L", reactantKinds: ["solid"], productKinds: ["solid", "liquid"], interiorCompositionSide: "reactants", interiorPhaseSelection: "assemblage-middle" },
  metatectic: { type: "metatectic", title: "Metatectic (catatectic)", coolingEquation: "β → α + L", reactantKinds: ["solid"], productKinds: ["solid", "liquid"], interiorCompositionSide: "reactants", interiorPhaseSelection: "assemblage-middle" },
};

export function thermodynamicKind(phase: PhaseDefinition | undefined): "liquid" | "solid" | undefined {
  if (!phase) return undefined;
  return phase.kind === "liquid" ? "liquid" : "solid";
}

export function samePhaseFamily(a: PhaseDefinition | undefined, b: PhaseDefinition | undefined): boolean {
  if (!a || !b) return false;
  return Boolean(a.phaseFamilyId && a.phaseFamilyId === b.phaseFamilyId);
}

export function isFixedCompositionPhase(phase: PhaseDefinition | undefined): boolean {
  return phase?.kind === "line-compound" && Boolean(phase.compositionSiteId);
}

export const BOUNDARY_RULES: Record<BoundaryKind, { equilibriumBoundary: boolean; permitsSameFamilyTransition: boolean }> = {
  liquidus: { equilibriumBoundary: true, permitsSameFamilyTransition: false },
  solidus: { equilibriumBoundary: true, permitsSameFamilyTransition: false },
  solvus: { equilibriumBoundary: true, permitsSameFamilyTransition: false },
  "miscibility-gap": { equilibriumBoundary: true, permitsSameFamilyTransition: true },
  "line-compound": { equilibriumBoundary: true, permitsSameFamilyTransition: false },
  "polymorph-boundary": { equilibriumBoundary: true, permitsSameFamilyTransition: true },
  "ordering-boundary": { equilibriumBoundary: true, permitsSameFamilyTransition: true },
  "stability-guide": { equilibriumBoundary: false, permitsSameFamilyTransition: true },
  "phase-boundary": { equilibriumBoundary: true, permitsSameFamilyTransition: false },
};

const BOUNDARY_ROLES: ReadonlyArray<readonly [BoundaryKind, ReadonlySet<string>]> = [
  ["liquidus", new Set(["complete-solution-liquidus", "liquidus-alpha", "liquidus-beta", "liquidus-delta-left", "liquidus-delta-right", "liquidus-gamma", "liquidus-gamma-left", "liquidus-gamma-right", "liquidus-left", "liquidus-right"])],
  ["solidus", new Set(["alpha-solidus", "beta-solidus", "complete-solution-solidus", "gamma-solidus", "solidus-left", "solidus-right"])],
  ["solvus", new Set(["alpha-solvus", "beta-solvus", "gamma-solvus-left", "gamma-solvus-right", "solvus-left", "solvus-right"])],
  ["miscibility-gap", new Set(["immiscibility-left", "immiscibility-right", "liquid-immiscibility-left", "liquid-immiscibility-right"])],
  ["line-compound", new Set(["compound-line-high", "compound-line-low", "compound-line-mid", "delta-line-high", "delta-line-low", "delta-line-mid", "gamma-line-high", "gamma-line-low", "gamma-line-mid", "gamma-product-line"])],
  ["polymorph-boundary", new Set(["polymorph-solvus-lower", "polymorph-solvus-upper"])],
  ["ordering-boundary", new Set(["superlattice-left", "superlattice-right"])],
  ["stability-guide", new Set(["spinodal-left", "spinodal-right"])],
];

/** Exact drawing labels are translated once here; physics consumers use BoundaryKind only. */
export function boundaryKindForRole(role?: string): BoundaryKind {
  if (!role) return "phase-boundary";
  return BOUNDARY_ROLES.find(([, roles]) => roles.has(role))?.[0] ?? "phase-boundary";
}

export function phaseSetKinds(ids: PhaseId[], phaseById: Map<PhaseId, PhaseDefinition>): Array<"liquid" | "solid" | undefined> {
  return ids.map((id) => thermodynamicKind(phaseById.get(id)));
}
