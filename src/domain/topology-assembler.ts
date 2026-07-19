import { REACTION_RULES } from "./phase-rules";
import type { PhaseCompositionRole, ReactionType } from "./schema";

export type ThermodynamicState = "liquid" | "solid";

export interface CompositionInterval {
  minBPercent: number;
  maxBPercent: number;
}

export interface TopologyPhaseNode {
  id: string;
  identityKey: string;
  state: ThermodynamicState;
  compositionRole: PhaseCompositionRole;
  compositionInterval: CompositionInterval;
  phaseFamilyId?: string;
  variantRole?: "parent" | "product";
  reachesTop: boolean;
  reachesBottom: boolean;
}

export interface TopologyInvariantNode {
  id: string;
  reactionType: ReactionType;
  /** Normalized temperature, 0 = diagram bottom and 1 = diagram top. */
  temperatureRank: number;
  reactantPhaseIds: string[];
  productPhaseIds: string[];
  /** Strictly increasing invariant compositions, one for each participant. */
  compositionByPhaseId: Record<string, number>;
  compositionOrder: string[];
  interiorPhaseId: string;
}

export type TopologyAdjacencyKind =
  | "invariant-coexistence"
  | "thermal-neighbor"
  | "miscibility-branch"
  | "bottom-neighbor";

export interface TopologyAdjacencyEdge {
  id: string;
  kind: TopologyAdjacencyKind;
  phaseAId: string;
  phaseBId: string;
  invariantId?: string;
}

export interface PhaseTopologyGraph {
  schemaVersion: "phase-topology-v1";
  seed: number;
  phases: TopologyPhaseNode[];
  invariants: TopologyInvariantNode[];
  adjacency: TopologyAdjacencyEdge[];
}

export interface WeightedInvariantTarget {
  type: ReactionType;
  /** Relative accepted-output target. Zero disables the motif. */
  weight: number;
  minCount?: 0 | 1;
  maxCount?: 0 | 1;
}

export interface TopologyFeatureRequirements {
  invariantCount?: { min: number; max: number };
  liquidImmiscibility?: boolean;
  intermediateSolid?: boolean;
  polymorphicSolidFamily?: boolean;
  maxPhaseCount?: number;
}

export interface TopologyFeatureContract {
  invariantTargets?: WeightedInvariantTarget[];
  required?: TopologyFeatureRequirements;
}

export type TopologyRejectionCode =
  | "invalid-contract"
  | "no-eligible-motif"
  | "combination-not-embeddable"
  | "duplicate-id"
  | "invalid-composition-interval"
  | "invalid-phase-identity"
  | "undefined-phase"
  | "invalid-invariant-archetype"
  | "invalid-reaction-ownership"
  | "invalid-lever-order"
  | "invalid-temperature-order"
  | "invalid-adjacency"
  | "liquid-top-component"
  | "liquid-at-bottom"
  | "solid-bottom-coverage"
  | "orphan-phase";

export interface TopologyRejection {
  code: TopologyRejectionCode;
  message: string;
  elementIds: string[];
}

export interface TopologyValidation {
  valid: boolean;
  rejections: TopologyRejection[];
}

export type TopologyAssemblyResult =
  | { accepted: true; graph: PhaseTopologyGraph; selectedInvariantTypes: ReactionType[] }
  | { accepted: false; rejections: TopologyRejection[] };

interface MotifDescriptor {
  type: ReactionType;
  liquidImmiscibility: boolean;
  intermediateSolid: boolean;
  polymorphicSolidFamily: boolean;
  phaseCount: number;
}

const REACTION_TYPES: ReactionType[] = [
  "eutectic",
  "eutectoid",
  "peritectic",
  "peritectoid",
  "monotectic",
  "monotectoid",
  "syntectic",
  "metatectic",
];

export const MOTIF_ARCHETYPES: Readonly<Record<ReactionType, MotifDescriptor>> = {
  eutectic: { type: "eutectic", liquidImmiscibility: false, intermediateSolid: false, polymorphicSolidFamily: false, phaseCount: 3 },
  eutectoid: { type: "eutectoid", liquidImmiscibility: false, intermediateSolid: true, polymorphicSolidFamily: false, phaseCount: 4 },
  peritectic: { type: "peritectic", liquidImmiscibility: false, intermediateSolid: true, polymorphicSolidFamily: false, phaseCount: 4 },
  peritectoid: { type: "peritectoid", liquidImmiscibility: false, intermediateSolid: true, polymorphicSolidFamily: false, phaseCount: 4 },
  monotectic: { type: "monotectic", liquidImmiscibility: true, intermediateSolid: false, polymorphicSolidFamily: false, phaseCount: 5 },
  monotectoid: { type: "monotectoid", liquidImmiscibility: false, intermediateSolid: true, polymorphicSolidFamily: true, phaseCount: 4 },
  syntectic: { type: "syntectic", liquidImmiscibility: true, intermediateSolid: true, polymorphicSolidFamily: false, phaseCount: 6 },
  metatectic: { type: "metatectic", liquidImmiscibility: false, intermediateSolid: true, polymorphicSolidFamily: false, phaseCount: 4 },
};

const EPSILON = 1e-7;

function rejection(code: TopologyRejectionCode, message: string, elementIds: string[] = []): TopologyRejection {
  return { code, message, elementIds };
}

function randomForSeed(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedChoice<T>(items: Array<{ item: T; weight: number }>, random: () => number): T | undefined {
  const total = items.reduce((sum, entry) => sum + entry.weight, 0);
  if (!(total > 0)) return undefined;
  let cursor = random() * total;
  for (const entry of items) {
    cursor -= entry.weight;
    if (cursor < 0) return entry.item;
  }
  return items.at(-1)?.item;
}

function phase(
  id: string,
  state: ThermodynamicState,
  compositionRole: PhaseCompositionRole,
  interval: [number, number],
  reachesTop: boolean,
  reachesBottom: boolean,
  options: Pick<TopologyPhaseNode, "phaseFamilyId" | "variantRole"> = {},
): TopologyPhaseNode {
  return {
    id,
    identityKey: id,
    state,
    compositionRole,
    compositionInterval: { minBPercent: interval[0], maxBPercent: interval[1] },
    reachesTop,
    reachesBottom,
    ...options,
  };
}

function invariant(
  reactionType: ReactionType,
  reactants: string[],
  products: string[],
  ordered: Array<[string, number]>,
  interiorPhaseId: string,
  temperatureRank = 0.5,
  ordinal = 0,
): TopologyInvariantNode {
  return {
    id: `invariant:${reactionType}:${ordinal}`,
    reactionType,
    temperatureRank,
    reactantPhaseIds: reactants,
    productPhaseIds: products,
    compositionByPhaseId: Object.fromEntries(ordered),
    compositionOrder: ordered.map(([id]) => id),
    interiorPhaseId,
  };
}

function edge(kind: TopologyAdjacencyKind, a: string, b: string, ordinal: number, invariantId?: string): TopologyAdjacencyEdge {
  return { id: `edge:${kind}:${ordinal}`, kind, phaseAId: a, phaseBId: b, invariantId };
}

function adjacencyFor(phases: TopologyPhaseNode[], invariants: TopologyInvariantNode[]): TopologyAdjacencyEdge[] {
  const adjacency: TopologyAdjacencyEdge[] = [];
  let ordinal = 0;
  const phaseIds = new Set(phases.map((item) => item.id));
  if (phaseIds.has("L") && phaseIds.has("alpha")) adjacency.push(edge("thermal-neighbor", "L", "alpha", ordinal++));
  if (phaseIds.has("L") && phaseIds.has("beta")) adjacency.push(edge("thermal-neighbor", "L", "beta", ordinal++));
  if (phaseIds.has("alpha") && phaseIds.has("beta")) adjacency.push(edge("bottom-neighbor", "alpha", "beta", ordinal++));
  for (const node of invariants) {
    const participants = [...node.reactantPhaseIds, ...node.productPhaseIds];
    for (let a = 0; a < participants.length; a += 1) {
      for (let b = a + 1; b < participants.length; b += 1) {
        adjacency.push(edge("invariant-coexistence", participants[a], participants[b], ordinal++, node.id));
      }
    }
  }
  for (const liquid of phases.filter((item) => item.state === "liquid" && item.id !== "L")) {
    adjacency.push(edge("miscibility-branch", "L", liquid.id, ordinal++));
  }
  for (const solidPhase of phases.filter((candidate) => candidate.state === "solid"
    && !adjacency.some((item) => item.phaseAId === candidate.id || item.phaseBId === candidate.id))) {
    adjacency.push(edge("thermal-neighbor", "L", solidPhase.id, ordinal++));
  }
  return adjacency;
}

function makeMotif(type: ReactionType, seed: number): PhaseTopologyGraph {
  const random = randomForSeed(seed ^ 0x9e3779b9);
  const left = 18 + random() * 12;
  const middle = 44 + random() * 12;
  const right = 70 + random() * 12;
  const split = middle;
  const phases: TopologyPhaseNode[] = [
    phase("L", "liquid", "complete-range", [0, 100], true, false),
    phase("alpha", "solid", "a-terminal", [0, split], false, true),
    phase("beta", "solid", "b-terminal", [split, 100], false, true),
  ];
  let node: TopologyInvariantNode;

  switch (type) {
    case "eutectic":
      node = invariant(type, ["L"], ["alpha", "beta"], [["alpha", left], ["L", middle], ["beta", right]], "L");
      break;
    case "eutectoid":
      phases.push(phase("gamma", "solid", "intermediate", [middle - 18, middle + 18], false, false));
      node = invariant(type, ["gamma"], ["alpha", "beta"], [["alpha", left], ["gamma", middle], ["beta", right]], "gamma");
      break;
    case "peritectic":
      phases.push(phase("gamma", "solid", "intermediate", [middle - 12, middle + 12], false, false));
      node = invariant(type, ["alpha", "L"], ["gamma"], [["alpha", left], ["gamma", middle], ["L", right]], "gamma");
      break;
    case "peritectoid":
      phases.push(phase("gamma", "solid", "intermediate", [middle - 14, middle + 14], false, true));
      node = invariant(type, ["alpha", "beta"], ["gamma"], [["alpha", left], ["gamma", middle], ["beta", right]], "gamma");
      break;
    case "monotectic":
      phases.push(
        phase("L1", "liquid", "intermediate", [middle - 12, middle + 12], false, false, { phaseFamilyId: "liquid-solution" }),
        phase("L2", "liquid", "a-terminal", [0, middle - 4], false, false, { phaseFamilyId: "liquid-solution" }),
      );
      node = invariant(type, ["L1"], ["L2", "beta"], [["L2", left], ["L1", middle], ["beta", right]], "L1");
      break;
    case "monotectoid":
      phases.push(phase("gamma", "solid", "intermediate", [middle - 16, middle + 16], false, false, { phaseFamilyId: "solid-solution-1", variantRole: "parent" }));
      phases.find((item) => item.id === "alpha")!.phaseFamilyId = "solid-solution-1";
      phases.find((item) => item.id === "alpha")!.variantRole = "product";
      node = invariant(type, ["gamma"], ["alpha", "beta"], [["alpha", left], ["gamma", middle], ["beta", right]], "gamma");
      break;
    case "syntectic":
      phases.push(
        phase("L1", "liquid", "a-terminal", [0, middle - 4], false, false, { phaseFamilyId: "liquid-solution" }),
        phase("L2", "liquid", "b-terminal", [middle + 4, 100], false, false, { phaseFamilyId: "liquid-solution" }),
        phase("gamma", "solid", "intermediate", [middle - 14, middle + 14], false, true),
      );
      node = invariant(type, ["L1", "L2"], ["gamma"], [["L1", left], ["gamma", middle], ["L2", right]], "gamma");
      break;
    case "metatectic":
      phases.push(phase("gamma", "solid", "intermediate", [middle - 14, middle + 14], false, false));
      node = invariant(type, ["gamma"], ["alpha", "L"], [["alpha", left], ["gamma", middle], ["L", right]], "gamma");
      break;
  }

  const invariants = [node];
  return { schemaVersion: "phase-topology-v1", seed, phases, invariants, adjacency: adjacencyFor(phases, invariants) };
}

function pairKey(a: ReactionType, b: ReactionType): string {
  return [a, b].sort().join("+");
}

export const EMBEDDABLE_INVARIANT_PAIRS: ReadonlyArray<readonly [ReactionType, ReactionType]> = [
  ["eutectic", "peritectic"],
  ["eutectic", "peritectoid"],
  ["eutectic", "eutectoid"],
  ["eutectic", "monotectoid"],
  ["eutectic", "metatectic"],
  ["monotectic", "eutectic"],
  ["syntectic", "eutectic"],
];

const EMBEDDABLE_PAIR_KEYS = new Set(EMBEDDABLE_INVARIANT_PAIRS.map(([a, b]) => pairKey(a, b)));

function combinedFeatures(types: readonly [ReactionType, ReactionType]): MotifDescriptor {
  const descriptors = types.map((type) => MOTIF_ARCHETYPES[type]);
  return {
    type: types[0],
    liquidImmiscibility: descriptors.some((item) => item.liquidImmiscibility),
    intermediateSolid: descriptors.some((item) => item.intermediateSolid),
    polymorphicSolidFamily: descriptors.some((item) => item.polymorphicSolidFamily),
    phaseCount: pairKey(...types) === pairKey("syntectic", "eutectic")
      ? 6
      : pairKey(...types) === pairKey("monotectic", "eutectic")
        ? 5
        : 4,
  };
}

function makeCombinedMotifs(types: readonly [ReactionType, ReactionType], seed: number): PhaseTopologyGraph {
  const key = pairKey(...types);
  if (!EMBEDDABLE_PAIR_KEYS.has(key)) throw new Error(`Unsupported invariant pair ${key}.`);
  const random = randomForSeed(seed ^ 0x27d4eb2f);
  const jitter = () => (random() - 0.5) * 3;
  const a = 20 + jitter();
  const leftMiddle = 37 + jitter();
  const middle = 52 + jitter();
  const rightMiddle = 67 + jitter();
  const b = 82 + jitter();
  const phases: TopologyPhaseNode[] = [
    phase("L", "liquid", "complete-range", [0, 100], true, false),
    phase("alpha", "solid", "a-terminal", [0, 60], false, true),
    phase("beta", "solid", "b-terminal", [40, 100], false, true),
  ];
  const invariants: TopologyInvariantNode[] = [];

  if (key === pairKey("eutectic", "peritectic")) {
    phases.push(phase("gamma", "solid", "intermediate", [32, 72], false, false));
    invariants.push(
      invariant("peritectic", ["L", "beta"], ["gamma"], [["L", leftMiddle], ["gamma", middle], ["beta", b]], "gamma", 0.7),
      invariant("eutectic", ["L"], ["alpha", "gamma"], [["alpha", a], ["L", leftMiddle + 5], ["gamma", middle + 2]], "L", 0.3),
    );
  } else if (key === pairKey("eutectic", "peritectoid")) {
    phases.push(phase("gamma", "solid", "intermediate", [34, 70], false, true));
    invariants.push(
      invariant("eutectic", ["L"], ["alpha", "beta"], [["alpha", a], ["L", middle], ["beta", b]], "L", 0.7),
      invariant("peritectoid", ["alpha", "beta"], ["gamma"], [["alpha", a + 3], ["gamma", middle], ["beta", b - 2]], "gamma", 0.3),
    );
  } else if (key === pairKey("eutectic", "eutectoid")) {
    phases.push(phase("gamma", "solid", "intermediate", [34, 72], false, false));
    invariants.push(
      invariant("eutectic", ["L"], ["alpha", "gamma"], [["alpha", a], ["L", leftMiddle], ["gamma", middle]], "L", 0.7),
      invariant("eutectoid", ["gamma"], ["alpha", "beta"], [["alpha", a + 3], ["gamma", middle], ["beta", b]], "gamma", 0.3),
    );
  } else if (key === pairKey("eutectic", "monotectoid")) {
    phases.push(phase("gamma", "solid", "intermediate", [34, 72], false, false, { phaseFamilyId: "solid-solution-1", variantRole: "parent" }));
    phases.find((item) => item.id === "alpha")!.phaseFamilyId = "solid-solution-1";
    phases.find((item) => item.id === "alpha")!.variantRole = "product";
    invariants.push(
      invariant("eutectic", ["L"], ["alpha", "gamma"], [["alpha", a], ["L", leftMiddle], ["gamma", middle]], "L", 0.7),
      invariant("monotectoid", ["gamma"], ["alpha", "beta"], [["alpha", a + 3], ["gamma", middle], ["beta", b]], "gamma", 0.3),
    );
  } else if (key === pairKey("eutectic", "metatectic")) {
    phases.push(phase("gamma", "solid", "intermediate", [30, 65], false, false));
    invariants.push(
      invariant("metatectic", ["gamma"], ["alpha", "L"], [["alpha", a], ["gamma", middle], ["L", rightMiddle]], "gamma", 0.7),
      invariant("eutectic", ["L"], ["alpha", "beta"], [["alpha", a], ["L", rightMiddle], ["beta", b]], "L", 0.3),
    );
  } else if (key === pairKey("monotectic", "eutectic")) {
    phases.push(
      phase("L1", "liquid", "intermediate", [30, 60], false, false, { phaseFamilyId: "liquid-solution" }),
      phase("L2", "liquid", "b-terminal", [55, 100], false, false, { phaseFamilyId: "liquid-solution" }),
    );
    invariants.push(
      invariant("monotectic", ["L1"], ["alpha", "L2"], [["alpha", a], ["L1", middle], ["L2", rightMiddle]], "L1", 0.7),
      invariant("eutectic", ["L2"], ["alpha", "beta"], [["alpha", a], ["L2", rightMiddle], ["beta", b]], "L2", 0.3),
    );
  } else {
    phases.push(
      phase("L1", "liquid", "a-terminal", [0, 48], false, false, { phaseFamilyId: "liquid-solution" }),
      phase("L2", "liquid", "b-terminal", [55, 100], false, false, { phaseFamilyId: "liquid-solution" }),
      phase("gamma", "solid", "intermediate", [34, 72], false, false),
    );
    invariants.push(
      invariant("syntectic", ["L1", "L2"], ["gamma"], [["L1", leftMiddle], ["gamma", middle], ["L2", rightMiddle]], "gamma", 0.7),
      invariant("eutectic", ["L2"], ["gamma", "beta"], [["gamma", middle], ["L2", rightMiddle], ["beta", b]], "L2", 0.3),
    );
  }

  return { schemaVersion: "phase-topology-v1", seed, phases, invariants, adjacency: adjacencyFor(phases, invariants) };
}

function matchesFeatures(descriptor: MotifDescriptor, required: TopologyFeatureRequirements): boolean {
  return (required.liquidImmiscibility === undefined || required.liquidImmiscibility === descriptor.liquidImmiscibility)
    && (required.intermediateSolid === undefined || required.intermediateSolid === descriptor.intermediateSolid)
    && (required.polymorphicSolidFamily === undefined || required.polymorphicSolidFamily === descriptor.polymorphicSolidFamily);
}

function targetMap(contract: TopologyFeatureContract): Map<ReactionType, WeightedInvariantTarget> {
  const map = new Map<ReactionType, WeightedInvariantTarget>();
  for (const type of REACTION_TYPES) map.set(type, { type, weight: 1, minCount: 0, maxCount: 1 });
  if (contract.invariantTargets) {
    map.clear();
    for (const target of contract.invariantTargets) map.set(target.type, target);
  }
  return map;
}

/** Builds one motif or one of the explicitly certified two-invariant chains. */
export function assemblePhaseTopology(contract: TopologyFeatureContract, seed: number): TopologyAssemblyResult {
  const required = contract.required ?? {};
  const duplicateTarget = contract.invariantTargets?.find((target, index, targets) => targets.findIndex((item) => item.type === target.type) !== index);
  if (duplicateTarget) {
    return { accepted: false, rejections: [rejection("invalid-contract", `Invariant target ${duplicateTarget.type} is declared more than once.`, [duplicateTarget.type])] };
  }
  const targets = targetMap(contract);
  const mandatory = [...targets.values()].filter((target) => (target.minCount ?? 0) > 0);
  const defaultInvariantCount = mandatory.length >= 2 ? 2 : 1;
  const count = required.invariantCount ?? { min: defaultInvariantCount, max: defaultInvariantCount };
  if (!Number.isInteger(count.min) || !Number.isInteger(count.max) || count.min < 0 || count.max < count.min) {
    return { accepted: false, rejections: [rejection("invalid-contract", "Invariant-count bounds must be non-negative ordered integers.")] };
  }
  if (count.max < 1) {
    return { accepted: false, rejections: [rejection("no-eligible-motif", "The bounded motif assembler requires one enabled invariant.")] };
  }
  if (count.min > 2 || mandatory.length > 2) {
    return { accepted: false, rejections: [rejection("combination-not-embeddable", "The bounded assembler currently certifies at most two linked invariants.")] };
  }
  if (mandatory.length > count.max) {
    return { accepted: false, rejections: [rejection("invalid-contract", "Mandatory invariant targets exceed the contract's invariant-count maximum.")] };
  }
  const malformed = [...targets.values()].find((target) => !Number.isFinite(target.weight) || target.weight < 0 || (target.minCount ?? 0) > (target.maxCount ?? 1));
  if (malformed) {
    return { accepted: false, rejections: [rejection("invalid-contract", `Invalid target bounds or weight for ${malformed.type}.`, [malformed.type])] };
  }

  const enabled = [...targets.values()].filter((target) => (target.maxCount ?? 1) > 0 && target.weight > 0);
  const wantsPair = count.min === 2 || mandatory.length === 2;
  const random = randomForSeed(seed ^ 0xa511e9b3);
  if (wantsPair) {
    if (mandatory.length === 2 && !EMBEDDABLE_PAIR_KEYS.has(pairKey(mandatory[0].type, mandatory[1].type))) {
      return { accepted: false, rejections: [rejection("combination-not-embeddable", `Required motif combination ${mandatory.map((item) => item.type).join(" + ")} has no certified topology embedding.`)] };
    }
    const pairCandidates = EMBEDDABLE_INVARIANT_PAIRS
      .filter(([a, b]) => enabled.some((item) => item.type === a) && enabled.some((item) => item.type === b))
      .filter(([a, b]) => mandatory.every((item) => item.type === a || item.type === b))
      .filter((types) => matchesFeatures(combinedFeatures(types), required))
      .filter((types) => required.maxPhaseCount === undefined || combinedFeatures(types).phaseCount <= required.maxPhaseCount)
      .map((types) => ({
        item: types,
        weight: targets.get(types[0])!.weight * targets.get(types[1])!.weight,
      }));
    const selectedPair = weightedChoice(pairCandidates, random);
    if (!selectedPair) {
      return { accepted: false, rejections: [rejection("combination-not-embeddable", "No enabled two-invariant combination has a certified shared-phase embedding.")] };
    }
    const graph = makeCombinedMotifs(selectedPair, seed);
    const validation = validatePhaseTopology(graph);
    return validation.valid
      ? { accepted: true, graph, selectedInvariantTypes: graph.invariants.map((item) => item.reactionType) }
      : { accepted: false, rejections: validation.rejections };
  }

  const candidates = enabled
    .filter((target) => mandatory.length === 0 || target.type === mandatory[0].type)
    .filter((target) => matchesFeatures(MOTIF_ARCHETYPES[target.type], required))
    .filter((target) => required.maxPhaseCount === undefined || MOTIF_ARCHETYPES[target.type].phaseCount <= required.maxPhaseCount)
    .map((target) => ({ item: target.type, weight: target.weight }));
  const selected = weightedChoice(candidates, random);
  if (!selected) {
    return { accepted: false, rejections: [rejection("no-eligible-motif", "No enabled invariant motif satisfies the feature contract.")] };
  }

  const graph = makeMotif(selected, seed);
  const validation = validatePhaseTopology(graph);
  return validation.valid
    ? { accepted: true, graph, selectedInvariantTypes: [selected] }
    : { accepted: false, rejections: validation.rejections };
}

function connected(start: string, targetIds: Set<string>, edges: TopologyAdjacencyEdge[]): Set<string> {
  const visited = new Set<string>();
  const queue = [start];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const item of edges) {
      const next = item.phaseAId === current ? item.phaseBId : item.phaseBId === current ? item.phaseAId : undefined;
      if (next && targetIds.has(next) && !visited.has(next)) queue.push(next);
    }
  }
  return visited;
}

export function validatePhaseTopology(graph: PhaseTopologyGraph): TopologyValidation {
  const rejections: TopologyRejection[] = [];
  const phaseById = new Map<string, TopologyPhaseNode>();
  const identityKeys = new Set<string>();
  for (const item of graph.phases) {
    if (phaseById.has(item.id)) rejections.push(rejection("duplicate-id", `Duplicate phase id ${item.id}.`, [item.id]));
    phaseById.set(item.id, item);
    if (!item.identityKey || identityKeys.has(item.identityKey)) rejections.push(rejection("invalid-phase-identity", `Phase identity ${item.identityKey || "<empty>"} is not unique.`, [item.id]));
    identityKeys.add(item.identityKey);
    const { minBPercent, maxBPercent } = item.compositionInterval;
    if (!Number.isFinite(minBPercent) || !Number.isFinite(maxBPercent) || minBPercent < 0 || maxBPercent > 100 || maxBPercent - minBPercent <= EPSILON) {
      rejections.push(rejection("invalid-composition-interval", `${item.id} requires a nonzero composition interval within 0-100% B.`, [item.id]));
    }
    if (item.state === "liquid" && item.reachesBottom) rejections.push(rejection("liquid-at-bottom", `${item.id} cannot be stable on the entire low-temperature boundary.`, [item.id]));
  }

  const invariantIds = new Set<string>();
  for (let invariantIndex = 0; invariantIndex < graph.invariants.length; invariantIndex += 1) {
    const item = graph.invariants[invariantIndex];
    if (invariantIds.has(item.id)) rejections.push(rejection("duplicate-id", `Duplicate invariant id ${item.id}.`, [item.id]));
    invariantIds.add(item.id);
    if (!Number.isFinite(item.temperatureRank) || item.temperatureRank <= 0 || item.temperatureRank >= 1
      || (invariantIndex > 0 && graph.invariants[invariantIndex - 1].temperatureRank <= item.temperatureRank + EPSILON)) {
      rejections.push(rejection("invalid-temperature-order", "Invariant temperatures must be finite, distinct, and listed from high to low temperature.", [item.id]));
    }
    const participants = [...item.reactantPhaseIds, ...item.productPhaseIds];
    const unique = new Set(participants);
    if (participants.length !== 3 || unique.size !== 3 || !REACTION_RULES[item.reactionType]) {
      rejections.push(rejection("invalid-invariant-archetype", `${item.id} is not a three-phase binary invariant.`, [item.id]));
      continue;
    }
    const missing = participants.filter((id) => !phaseById.has(id));
    if (missing.length > 0) {
      rejections.push(rejection("undefined-phase", `${item.id} references undefined phases: ${missing.join(", ")}.`, [item.id, ...missing]));
      continue;
    }
    const rule = REACTION_RULES[item.reactionType];
    const kinds = (ids: string[]) => ids.map((id) => phaseById.get(id)!.state).sort().join(",");
    if (kinds(item.reactantPhaseIds) !== [...rule.reactantKinds].sort().join(",")
      || kinds(item.productPhaseIds) !== [...rule.productKinds].sort().join(",")) {
      rejections.push(rejection("invalid-reaction-ownership", `${item.reactionType} reactants/products do not match its cooling archetype.`, [item.id]));
    }
    const onePhaseSide = rule.interiorCompositionSide === "reactants" ? item.reactantPhaseIds : item.productPhaseIds;
    if (onePhaseSide.length !== 1 || onePhaseSide[0] !== item.interiorPhaseId) {
      rejections.push(rejection("invalid-reaction-ownership", `${item.reactionType} assigns the interior composition to the wrong reaction side.`, [item.id, item.interiorPhaseId]));
    }
    if (item.compositionOrder.length !== 3 || new Set(item.compositionOrder).size !== 3
      || !item.compositionOrder.every((id) => unique.has(id)) || item.compositionOrder[1] !== item.interiorPhaseId) {
      rejections.push(rejection("invalid-lever-order", `${item.id} must place the one-phase-side composition strictly between the other phases.`, [item.id]));
    } else {
      const values = item.compositionOrder.map((id) => item.compositionByPhaseId[id]);
      if (values.some((value) => !Number.isFinite(value)) || !(values[0] < values[1] - EPSILON && values[1] < values[2] - EPSILON)) {
        rejections.push(rejection("invalid-lever-order", `${item.id} has zero or reversed lever-rule intervals.`, [item.id]));
      }
      for (const id of participants) {
        const value = item.compositionByPhaseId[id];
        const interval = phaseById.get(id)!.compositionInterval;
        if (value < interval.minBPercent - EPSILON || value > interval.maxBPercent + EPSILON) {
          rejections.push(rejection("invalid-phase-identity", `${id}'s invariant composition lies outside its declared stability domain.`, [item.id, id]));
        }
      }
    }
    if (item.reactionType === "monotectoid") {
      const parent = phaseById.get(item.reactantPhaseIds[0])!;
      if (!item.productPhaseIds.some((id) => parent.phaseFamilyId && phaseById.get(id)?.phaseFamilyId === parent.phaseFamilyId)) {
        rejections.push(rejection("invalid-phase-identity", "A monotectoid must retain one product in the parent solid-solution family.", [item.id]));
      }
    }
  }

  const adjacencyIds = new Set<string>();
  const degree = new Map(graph.phases.map((item) => [item.id, 0]));
  for (const item of graph.adjacency) {
    if (adjacencyIds.has(item.id)) rejections.push(rejection("duplicate-id", `Duplicate adjacency id ${item.id}.`, [item.id]));
    adjacencyIds.add(item.id);
    if (item.phaseAId === item.phaseBId || !phaseById.has(item.phaseAId) || !phaseById.has(item.phaseBId)) {
      rejections.push(rejection("invalid-adjacency", `${item.id} has invalid phase endpoints.`, [item.id]));
      continue;
    }
    degree.set(item.phaseAId, degree.get(item.phaseAId)! + 1);
    degree.set(item.phaseBId, degree.get(item.phaseBId)! + 1);
    if (item.kind === "invariant-coexistence") {
      const owner = graph.invariants.find((candidate) => candidate.id === item.invariantId);
      const participants = owner ? new Set([...owner.reactantPhaseIds, ...owner.productPhaseIds]) : undefined;
      if (!owner || !participants!.has(item.phaseAId) || !participants!.has(item.phaseBId)) {
        rejections.push(rejection("invalid-adjacency", `${item.id} does not belong to its declared invariant.`, [item.id]));
      }
    }
  }
  for (const item of graph.invariants) {
    const participants = new Set([...item.reactantPhaseIds, ...item.productPhaseIds]);
    const coexistence = graph.adjacency.filter((candidate) => candidate.kind === "invariant-coexistence" && candidate.invariantId === item.id);
    if (connected([...participants][0], participants, coexistence).size !== 3) {
      rejections.push(rejection("invalid-adjacency", `${item.id} participants are not connected by coexistence adjacency.`, [item.id]));
    }
  }
  for (const [id, count] of degree) {
    if (count === 0) rejections.push(rejection("orphan-phase", `${id} is not connected to any equilibrium field or invariant.`, [id]));
  }

  const liquids = graph.phases.filter((item) => item.state === "liquid");
  const topLiquids = liquids.filter((item) => item.reachesTop);
  const liquidIds = new Set(liquids.map((item) => item.id));
  const liquidEdges = graph.adjacency.filter((item) => liquidIds.has(item.phaseAId) && liquidIds.has(item.phaseBId));
  if (topLiquids.length !== 1 || liquids.length === 0 || connected(topLiquids[0]?.id ?? "", liquidIds, liquidEdges).size !== liquids.length) {
    rejections.push(rejection("liquid-top-component", "The graph must have exactly one connected top liquid component.", liquids.map((item) => item.id)));
  }

  const bottomIntervals = graph.phases
    .filter((item) => item.state === "solid" && item.reachesBottom)
    .map((item) => item.compositionInterval)
    .sort((a, b) => a.minBPercent - b.minBPercent);
  let coveredTo = 0;
  if (bottomIntervals.length === 0 || bottomIntervals[0].minBPercent > EPSILON) {
    coveredTo = -1;
  } else {
    for (const interval of bottomIntervals) {
      if (interval.minBPercent > coveredTo + EPSILON) break;
      coveredTo = Math.max(coveredTo, interval.maxBPercent);
    }
  }
  if (coveredTo < 100 - EPSILON) {
    rejections.push(rejection("solid-bottom-coverage", "Stable solid intervals must cover the complete 0-100% B bottom boundary."));
  }

  return { valid: rejections.length === 0, rejections };
}
