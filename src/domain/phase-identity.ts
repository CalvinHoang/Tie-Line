import type {
  PhaseCompositionRole,
  PhaseDefinition,
  PhaseId,
  PhaseKind,
  PhaseTemperatureRole,
} from "./schema";

export type CompositionContract = PhaseCompositionRole | "fixed-composition";

export interface SemanticPhaseRecord {
  /** Generator-local key. It is normalized into the stable phase id. */
  sourceKey: string;
  state: "liquid" | "solid-solution" | "line-compound";
  compositionContract?: CompositionContract;
  temperatureContract?: PhaseTemperatureRole;
  familyKey?: string;
  formulaLabel?: string;
  relationship?: {
    kind: "ordered-derivative" | "polymorph";
    baseSourceKey: string;
  };
  required?: boolean;
}

/**
 * Facts inferred from extracted cells and boundary incidence, independently of
 * the generator's semantic declaration.
 */
export interface InferredPhaseFacts {
  sourceKey: string;
  touchesA: boolean;
  touchesB: boolean;
  compositionCentroidBPercent: number;
  compositionSiteId?: string;
  fixedCompositionBPercent?: number;
  temperatureRole?: PhaseTemperatureRole;
  derivativeOf?: string;
  /** Liquid notation follows equilibrium role rather than composition order. */
  liquidRole?: "homogeneous-parent" | "immiscible-branch" | "monotectic-parent" | "monotectic-product";
  /** True when the diagram or instructions visibly identify this phase. */
  visibleNotationAnchor?: boolean;
}

export interface PhaseIdentityIssue {
  ruleId: string;
  phaseKeys: string[];
  message: string;
}

export class PhaseIdentityError extends Error {
  readonly issues: PhaseIdentityIssue[];

  constructor(issues: PhaseIdentityIssue[]) {
    super(issues.map((issue) => issue.message).join(" "));
    this.name = "PhaseIdentityError";
    this.issues = issues;
  }
}

export interface DerivedPhaseIdentity extends PhaseDefinition {
  sourceKey: string;
  inferredCompositionRole: CompositionContract | "liquid";
}

export interface PhaseIdentityPlan {
  phases: DerivedPhaseIdentity[];
  phaseIdBySourceKey: ReadonlyMap<string, PhaseId>;
  /** Full, bijective maps. The first entry is always the identity mapping. */
  answerAutomorphisms: ReadonlyMap<PhaseId, PhaseId>[];
}

interface WorkingPhase {
  semantic: SemanticPhaseRecord;
  facts: InferredPhaseFacts;
  id: string;
  compositionRole: CompositionContract | "liquid";
  familyId: string;
  domainKey: string;
  symbol?: string;
  equivalenceGroup?: string;
}

const INTERMEDIATE_SYMBOLS = [
  "γ", "δ", "ε", "ζ", "η", "θ", "ι", "κ", "λ", "μ", "ν", "ξ", "ο", "π", "ρ", "σ", "τ", "υ", "φ", "χ", "ψ", "ω",
] as const;

const slug = (value: string): string => value
  .normalize("NFKD")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const prime = (symbol: string, count = 1): string => `${symbol}${"′".repeat(count)}`;

const permutations = <T>(items: readonly T[]): T[][] => {
  if (items.length < 2) return [[...items]];
  return items.flatMap((item, index) => permutations(items.filter((_, candidate) => candidate !== index))
    .map((tail) => [item, ...tail]));
};

function inferredCompositionRole(
  semantic: SemanticPhaseRecord,
  facts: InferredPhaseFacts,
): CompositionContract | "liquid" {
  if (semantic.state === "liquid") return "liquid";
  if (facts.compositionSiteId || facts.fixedCompositionBPercent !== undefined) return "fixed-composition";
  if (facts.touchesA && facts.touchesB) return "complete-range";
  if (facts.touchesA) return "a-terminal";
  if (facts.touchesB) return "b-terminal";
  return "intermediate";
}

function derivedKind(phase: WorkingPhase): PhaseKind {
  if (phase.semantic.state === "liquid") return "liquid";
  if (phase.semantic.state === "line-compound") return "line-compound";
  return phase.compositionRole === "intermediate" ? "intermediate-solid-solution" : "terminal-solid";
}

function derivedName(phase: WorkingPhase): string {
  const { semantic, compositionRole } = phase;
  const temperature = phase.facts.temperatureRole;
  const temperaturePrefix = temperature === "low-temperature" ? "Low-temperature "
    : temperature === "high-temperature" ? "High-temperature " : "";
  if (semantic.state === "liquid") {
    if (phase.symbol === "L") return "Homogeneous liquid";
    if (phase.facts.liquidRole === "homogeneous-parent" || phase.facts.liquidRole === "monotectic-parent") return "Parent liquid";
    return `Immiscible liquid ${phase.symbol?.replace("L", "") ?? ""}`.trim();
  }
  if (semantic.relationship?.kind === "ordered-derivative") return `Ordered ${semantic.formulaLabel ?? "solid solution"}`;
  if (semantic.relationship?.kind === "polymorph") return `${temperaturePrefix}${semantic.formulaLabel ?? "solid"} polymorph`.trim();
  if (compositionRole === "a-terminal") return `${temperaturePrefix}A-rich terminal solid solution`.trim();
  if (compositionRole === "b-terminal") return `${temperaturePrefix}B-rich terminal solid solution`.trim();
  if (compositionRole === "complete-range") return `${temperaturePrefix}complete-range solid solution`.trim();
  if (compositionRole === "fixed-composition") return `${temperaturePrefix}${semantic.formulaLabel ?? "Intermediate"} compound`.trim();
  return `${temperaturePrefix}Intermediate solid solution`.trim();
}

function domainKeyFor(role: CompositionContract | "liquid", facts: InferredPhaseFacts, id: string): string {
  if (role === "fixed-composition") {
    return `site:${slug(facts.compositionSiteId ?? String(facts.fixedCompositionBPercent))}`;
  }
  if (role === "intermediate") return `intermediate:${id}`;
  return role;
}

function sameDomain(a: WorkingPhase, b: WorkingPhase): boolean {
  return a.compositionRole === b.compositionRole && a.domainKey === b.domainKey;
}

function issue(ruleId: string, phaseKeys: string[], message: string): PhaseIdentityIssue {
  return { ruleId, phaseKeys, message };
}

/**
 * Derive all display notation from semantic contracts checked against facts
 * independently reconstructed from the diagram geometry.
 */
export function derivePhaseIdentity(
  semanticPhases: readonly SemanticPhaseRecord[],
  inferredFacts: readonly InferredPhaseFacts[],
): PhaseIdentityPlan {
  const issues: PhaseIdentityIssue[] = [];
  const factsByKey = new Map(inferredFacts.map((facts) => [facts.sourceKey, facts]));
  const semanticByKey = new Map(semanticPhases.map((phase) => [phase.sourceKey, phase]));

  if (semanticByKey.size !== semanticPhases.length) {
    issues.push(issue("duplicate-semantic-key", [], "Every semantic phase must have a unique source key."));
  }
  if (factsByKey.size !== inferredFacts.length) {
    issues.push(issue("duplicate-inferred-key", [], "Every inferred phase record must have a unique source key."));
  }

  const idOwners = new Map<string, string>();
  const working: WorkingPhase[] = [];
  for (const semantic of semanticPhases) {
    const facts = factsByKey.get(semantic.sourceKey);
    if (!facts) {
      issues.push(issue("missing-inferred-facts", [semantic.sourceKey], `No independently inferred facts exist for ${semantic.sourceKey}.`));
      continue;
    }
    if (!Number.isFinite(facts.compositionCentroidBPercent)
      || facts.compositionCentroidBPercent < 0 || facts.compositionCentroidBPercent > 100) {
      issues.push(issue("invalid-composition-centroid", [semantic.sourceKey], `${semantic.sourceKey} has an invalid inferred composition centroid.`));
    }
    const id = slug(semantic.sourceKey);
    if (!id) issues.push(issue("invalid-stable-id", [semantic.sourceKey], `${semantic.sourceKey} cannot form a stable phase id.`));
    const priorOwner = idOwners.get(id);
    if (priorOwner) {
      issues.push(issue("stable-id-collision", [priorOwner, semantic.sourceKey], `${priorOwner} and ${semantic.sourceKey} normalize to the same stable id.`));
    }
    idOwners.set(id, semantic.sourceKey);

    const compositionRole = inferredCompositionRole(semantic, facts);
    if (semantic.state !== "liquid" && !semantic.compositionContract) {
      issues.push(issue("missing-composition-contract", [semantic.sourceKey], `${semantic.sourceKey} must declare a composition contract.`));
    } else if (semantic.state !== "liquid" && semantic.compositionContract !== compositionRole) {
      issues.push(issue("composition-contract-mismatch", [semantic.sourceKey], `${semantic.sourceKey} declares ${semantic.compositionContract} but geometry implies ${compositionRole}.`));
    }
    if (semantic.state === "line-compound" && compositionRole !== "fixed-composition") {
      issues.push(issue("line-compound-not-fixed", [semantic.sourceKey], `${semantic.sourceKey} is a line compound without one fixed composition site.`));
    }
    if (compositionRole === "fixed-composition"
      && (!facts.compositionSiteId || facts.fixedCompositionBPercent === undefined)) {
      issues.push(issue("incomplete-fixed-site", [semantic.sourceKey], `${semantic.sourceKey} needs both a site id and a fixed composition.`));
    }
    if (semantic.temperatureContract !== facts.temperatureRole) {
      issues.push(issue("temperature-contract-mismatch", [semantic.sourceKey], `${semantic.sourceKey}'s declared and inferred temperature roles disagree.`));
    }
    const declaredBase = semantic.relationship?.baseSourceKey;
    if (declaredBase !== facts.derivativeOf) {
      issues.push(issue("derivative-contract-mismatch", [semantic.sourceKey], `${semantic.sourceKey}'s declared and inferred derivative relationships disagree.`));
    }

    const familySeed = semantic.familyKey ?? declaredBase ?? semantic.sourceKey;
    working.push({
      semantic,
      facts,
      id,
      compositionRole,
      familyId: `family-${slug(familySeed)}`,
      domainKey: domainKeyFor(compositionRole, facts, id),
    });
  }

  for (const key of factsByKey.keys()) {
    if (!semanticByKey.has(key)) issues.push(issue("orphan-inferred-facts", [key], `Inferred facts for ${key} have no semantic phase record.`));
  }

  const bySource = new Map(working.map((phase) => [phase.semantic.sourceKey, phase]));
  for (const phase of working) {
    const relationship = phase.semantic.relationship;
    if (!relationship) continue;
    const base = bySource.get(relationship.baseSourceKey);
    if (!base) {
      issues.push(issue("missing-derivative-base", [phase.semantic.sourceKey], `${phase.semantic.sourceKey}'s base phase does not exist.`));
      continue;
    }
    if (!sameDomain(phase, base)) {
      issues.push(issue("derivative-domain-mismatch", [base.semantic.sourceKey, phase.semantic.sourceKey], `${phase.semantic.sourceKey} must occupy the same composition domain as ${base.semantic.sourceKey}.`));
    }
    if (phase.semantic.familyKey && base.semantic.familyKey && phase.semantic.familyKey !== base.semantic.familyKey) {
      issues.push(issue("derivative-family-mismatch", [base.semantic.sourceKey, phase.semantic.sourceKey], `${phase.semantic.sourceKey} and its base must share one phase family.`));
    }
    phase.familyId = base.familyId;
  }

  const fixedSiteGroups = new Map<string, WorkingPhase[]>();
  working.filter((phase) => phase.compositionRole === "fixed-composition").forEach((phase) => {
    fixedSiteGroups.set(phase.domainKey, [...(fixedSiteGroups.get(phase.domainKey) ?? []), phase]);
  });
  for (const group of fixedSiteGroups.values()) {
    const compositions = new Set(group.map((phase) => phase.facts.fixedCompositionBPercent));
    if (compositions.size !== 1) {
      issues.push(issue("fixed-site-misalignment", group.map((phase) => phase.semantic.sourceKey), "All fixed-composition polymorphs at one site must align at exactly one composition."));
    }
  }

  if (issues.length) throw new PhaseIdentityError(issues);

  const liquids = working.filter((phase) => phase.compositionRole === "liquid");
  const parentLiquids = liquids.filter((phase) => phase.facts.liquidRole === "homogeneous-parent");
  if (liquids.length > 1 && parentLiquids.length !== 1) {
    throw new PhaseIdentityError([issue(
      "ambiguous-liquid-parent",
      liquids.map((phase) => phase.semantic.sourceKey),
      "A multi-liquid diagram must identify exactly one homogeneous parent liquid from the top field.",
    )]);
  }
  const branchLiquids = liquids
    .filter((phase) => phase.facts.liquidRole !== "homogeneous-parent")
    .sort((a, b) => a.facts.compositionCentroidBPercent - b.facts.compositionCentroidBPercent);
  if (liquids.length === 0) {
    // Solid-only identity derivations have no liquid notation to assign.
  } else if (liquids.length === 1) {
    liquids[0].symbol = "L";
  } else if (liquids.length === 2) {
    parentLiquids[0].symbol = "L₁";
    branchLiquids[0].symbol = "L₂";
  } else {
    parentLiquids[0].symbol = "L";
    const monotecticParent = branchLiquids.find((phase) => phase.facts.liquidRole === "monotectic-parent");
    const monotecticProduct = branchLiquids.find((phase) => phase.facts.liquidRole === "monotectic-product");
    if (Boolean(monotecticParent) !== Boolean(monotecticProduct)) {
      throw new PhaseIdentityError([issue(
        "incomplete-monotectic-liquid-pair",
        branchLiquids.map((phase) => phase.semantic.sourceKey),
        "Monotectic liquid notation requires both a parent and a product liquid.",
      )]);
    }
    monotecticParent && (monotecticParent.symbol = "L₁");
    monotecticProduct && (monotecticProduct.symbol = "L₂");
    const remaining = branchLiquids.filter((phase) => !phase.symbol);
    const availableSymbols = ["L₁", "L₂", "L₃"].filter((symbol) => !branchLiquids.some((phase) => phase.symbol === symbol));
    remaining.forEach((phase, index) => { phase.symbol = availableSymbols[index]; });
  }

  const nonDerivatives = working.filter((phase) => phase.compositionRole !== "liquid" && !phase.semantic.relationship);
  const domainGroups = new Map<string, WorkingPhase[]>();
  nonDerivatives.forEach((phase) => {
    domainGroups.set(phase.domainKey, [...(domainGroups.get(phase.domainKey) ?? []), phase]);
  });

  const hasTerminalDomains = [...domainGroups.values()].some((group) =>
    group[0].compositionRole === "a-terminal" || group[0].compositionRole === "b-terminal");
  const intermediateDomains = [...domainGroups.entries()]
    .filter(([, group]) => group[0].compositionRole === "intermediate"
      || group[0].compositionRole === "fixed-composition"
      || (hasTerminalDomains && group[0].compositionRole === "complete-range"))
    .sort(([, a], [, b]) => a[0].facts.compositionCentroidBPercent - b[0].facts.compositionCentroidBPercent);
  const intermediateBaseSymbol = new Map(intermediateDomains.map(([key], index) => [key, INTERMEDIATE_SYMBOLS[index]]));
  if (intermediateDomains.length > INTERMEDIATE_SYMBOLS.length) {
    throw new PhaseIdentityError([issue("notation-space-exhausted", [], "There are more intermediate phase sites than available Greek symbols.")]);
  }

  for (const [domain, group] of domainGroups) {
    const role = group[0].compositionRole;
    const baseSymbol = role === "a-terminal" ? "α" : role === "b-terminal" ? "β"
      : role === "complete-range" && !hasTerminalDomains ? "α" : intermediateBaseSymbol.get(domain)!;
    if (role === "complete-range" && group.length === 2) {
      const low = group.find((phase) => phase.facts.temperatureRole === "low-temperature");
      const high = group.find((phase) => phase.facts.temperatureRole === "high-temperature");
      if (!low || !high || low.familyId !== high.familyId) {
        throw new PhaseIdentityError([issue("ambiguous-complete-range-variants", group.map((phase) => phase.semantic.sourceKey), "Two complete-range phases must be low/high polymorphs of one family.")]);
      }
      low.symbol = baseSymbol;
      high.symbol = hasTerminalDomains ? prime(baseSymbol) : "β";
      continue;
    }
    if (group.length > 1) {
      const low = group.find((phase) => phase.facts.temperatureRole === "low-temperature");
      const high = group.find((phase) => phase.facts.temperatureRole === "high-temperature");
      if (group.length !== 2 || !low || !high || low.familyId !== high.familyId
        || !group.every((phase) => phase.compositionRole === "fixed-composition")) {
        throw new PhaseIdentityError([issue("ambiguous-domain-identities", group.map((phase) => phase.semantic.sourceKey), `Multiple unrelated phases claim composition domain ${domain}.`)]);
      }
      low.symbol = baseSymbol;
      high.symbol = prime(baseSymbol);
      continue;
    }
    group[0].symbol = baseSymbol;
  }

  const derivatives = working.filter((phase) => phase.semantic.relationship);
  const childrenByBase = new Map<string, WorkingPhase[]>();
  derivatives.forEach((phase) => {
    const baseKey = phase.semantic.relationship!.baseSourceKey;
    childrenByBase.set(baseKey, [...(childrenByBase.get(baseKey) ?? []), phase]);
  });
  for (const [baseKey, children] of childrenByBase) {
    const base = bySource.get(baseKey)!;
    if (!base.symbol || children.length > 1) {
      throw new PhaseIdentityError([issue("ambiguous-derivative-notation", [baseKey, ...children.map((phase) => phase.semantic.sourceKey)], "A base phase may have only one directly derived notation variant.")]);
    }
    children[0].symbol = prime(base.symbol);
  }

  const interchangeableGroups: WorkingPhase[][] = [];
  const familyDomains = new Map<string, WorkingPhase[]>();
  working.forEach((phase) => {
    const key = `${phase.familyId}|${phase.domainKey}`;
    familyDomains.set(key, [...(familyDomains.get(key) ?? []), phase]);
  });
  for (const group of familyDomains.values()) {
    const role = group[0].compositionRole;
    const interchangeable = group.length > 1
      && (role === "complete-range" || role === "fixed-composition")
      && group.every((phase) => !phase.semantic.relationship
        && !phase.facts.derivativeOf
        && !phase.facts.visibleNotationAnchor
        && phase.facts.temperatureRole)
      && new Set(group.map((phase) => phase.facts.temperatureRole)).size === group.length;
    if (!interchangeable) continue;
    const groupId = `unanchored-${slug(group[0].familyId)}-${slug(group[0].domainKey)}`;
    group.forEach((phase) => { phase.equivalenceGroup = groupId; });
    interchangeableGroups.push(group);
  }

  const phaseIdBySourceKey = new Map(working.map((phase) => [phase.semantic.sourceKey, phase.id]));
  const definitions: DerivedPhaseIdentity[] = working.map((phase) => ({
    id: phase.id,
    sourceKey: phase.semantic.sourceKey,
    symbol: phase.symbol!,
    name: derivedName(phase),
    kind: derivedKind(phase),
    required: phase.semantic.required ?? true,
    phaseFamilyId: phase.familyId,
    compositionRole: phase.compositionRole === "liquid" || phase.compositionRole === "fixed-composition"
      ? phase.compositionRole === "fixed-composition" ? "intermediate" : undefined
      : phase.compositionRole,
    temperatureRole: phase.facts.temperatureRole,
    labelEquivalenceGroup: phase.equivalenceGroup,
    compositionSiteId: phase.facts.compositionSiteId,
    fixedCompositionBPercent: phase.facts.fixedCompositionBPercent,
    inferredCompositionRole: phase.compositionRole,
  }));

  let automorphisms: Map<PhaseId, PhaseId>[] = [new Map(definitions.map((phase) => [phase.id, phase.id]))];
  for (const group of interchangeableGroups) {
    const ids = group.map((phase) => phase.id);
    automorphisms = automorphisms.flatMap((base) => permutations(ids).map((permutation) => {
      const mapping = new Map(base);
      ids.forEach((id, index) => mapping.set(id, permutation[index]));
      return mapping;
    }));
  }

  return { phases: definitions, phaseIdBySourceKey, answerAutomorphisms: automorphisms };
}
