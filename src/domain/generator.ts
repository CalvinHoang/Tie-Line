import { extractFaces } from "../canvas/face-extraction";
import { polygonArea, sameLogicalPoint } from "./geometry";
import { assertPhaseEquilibria } from "./phase-equilibria-validator";
import { adaptPhaseIdentities } from "./phase-identity-adapter";
import { boundaryKindForRole, REACTION_RULES } from "./phase-rules";
import { auditRoundThermodynamicRealizability } from "./round-thermodynamic-audit";
import { assemblePhaseTopology } from "./topology-assembler";
import type {
  ExpectedFieldSpec,
  HiddenSolution,
  LogicalPoint,
  PhaseDefinition,
  PlayerGeometry,
  PlayerPoint,
  PuzzleDefinition,
  RequiredInvariantSpec,
  ReactionType,
  SolutionCurve,
} from "./schema";

export type Difficulty = "easy" | "normal" | "hard";

export type DiagramFamily =
  | "simple-eutectic"
  | "limited-eutectic"
  | "compound-double-eutectic"
  | "monotectic"
  | "liquid-spinodal"
  | "peritectic"
  | "peritectoid"
  | "eutectoid"
  | "monotectoid"
  | "metatectic"
  | "syntectic"
  | "subsolidus-polymorph"
  | "coupled-eutectic-peritectic"
  | "superlattice"
  | "triple-eutectic"
  | "liquid-immiscibility";

export interface GeneratedRound {
  seed: number;
  difficulty: Difficulty;
  family: DiagramFamily;
  puzzle: PuzzleDefinition;
  solution: HiddenSolution;
  reactionTypes?: string[];
  intermediatePhaseCount?: number;
  criticalPointCount?: number;
  layoutQualityScore?: number;
  thermodynamicCertificate?: {
    scope: "local-invariant-realizability";
    certifiedInvariantCount: number;
  };
  topologyCertificate?: {
    schemaVersion: "phase-topology-v1";
    certifiedInvariantTypes: string[];
    certifiedInvariantCount: number;
    scope: "generated-diagram";
  };
  generationContract?: {
    ruleId: string;
    weight: number;
    targetPercent: number;
    requiredInvariantTypes: ReactionType[];
    requiredInvariantCounts: Partial<Record<ReactionType, number>>;
    requiredFeatures: GenerationFeature[];
  };
}

export type GenerationFeature =
  | "compound"
  | "partial-solubility"
  | "polymorphism"
  | "ordering"
  | "liquid-immiscibility"
  | "spinodal"
  | "intermediate-phase";

const point = (compositionBPercent: number, temperatureCelsius: number): LogicalPoint => ({ compositionBPercent, temperatureCelsius });

// Boundary curvature follows the reference notes: liquidus and solidus branches
// leave a melting point or dome apex almost flat and steepen into the invariant
// they terminate on. `low` is the invariant-side end, `high` the hot end; `sag`
// raises the control toward the hot end, `lean` slides it across the chord.
// A sag of exactly 1 puts the control at the hot end's temperature, which makes
// the tangent there horizontal — required where two branches meet at a dome
// apex or consolute point so the junction is smooth rather than a corner.
const bowedControl = (low: LogicalPoint, high: LogicalPoint, sag = 0.78, lean = 0.5): LogicalPoint => point(
  low.compositionBPercent + (high.compositionBPercent - low.compositionBPercent) * lean,
  low.temperatureCelsius + (high.temperatureCelsius - low.temperatureCelsius) * sag,
);

function randomForSeed(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function integer(random: () => number, min: number, max: number, step = 1): number {
  const slots = Math.floor((max - min) / step) + 1;
  return min + Math.floor(random() * slots) * step;
}

function generatedGeometry(solution: HiddenSolution): { points: PlayerPoint[]; geometry: PlayerGeometry[] } {
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
      boundaryKind: curve.boundaryKind ?? boundaryKindForRole(curve.semanticRole),
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

function deriveExpectedFields(
  solution: HiddenSolution,
  classify: (label: LogicalPoint, boundaryIds: Set<string>) => { role: string; phases: string[]; texture?: ExpectedFieldSpec["texture"] },
  expectedCount: number,
): ExpectedFieldSpec[] {
  const { points, geometry } = generatedGeometry(solution);
  const fields = extractFaces(points, geometry).map((cell) => {
    const match = classify(cell.labelPoint, new Set(cell.boundary.map((item) => item.geometryId)));
    return { role: match.role, expectedAssemblage: match.phases, witnessPoint: cell.labelPoint, texture: match.texture };
  });
  if (fields.length !== expectedCount) throw new Error(`${solution.puzzleId} produced ${fields.length} fields (${fields.map((field) => field.role).join(", ")}); expected ${expectedCount}.`);
  return fields;
}

const phases = (compound = false): PhaseDefinition[] => [
  { id: "L", symbol: "L", name: "Liquid", kind: "liquid", required: true },
  { id: "alpha", symbol: "α", name: "Alpha", kind: "terminal-solid", required: true },
  ...(compound ? [{ id: "gamma", symbol: "γ", name: "Intermediate compound", kind: "line-compound" as const, required: true, compositionSiteId: "gamma", fixedCompositionBPercent: 50 }] : []),
  { id: "beta", symbol: "β", name: "Beta", kind: "terminal-solid", required: true },
];

const GREEK_INTERMEDIATE_SYMBOLS = ["γ", "δ", "ε", "ζ", "η", "θ", "κ", "λ"] as const;
const SUBSCRIPT_DIGITS: Record<string, string> = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉" };

function formulaTerms(formula: string): Array<{ element: string; count: number }> {
  const terms = [...formula.matchAll(/([A-Z][a-z]?)(\d*)/g)].map((match) => ({
    element: match[1],
    count: match[2] ? Number(match[2]) : 1,
  }));
  if (terms.length === 0 || terms.map((term) => `${term.element}${term.count === 1 ? "" : term.count}`).join("") !== formula) {
    throw new Error(`End-member label ${formula} is not a chemical formula.`);
  }
  return terms;
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

function subscript(value: number): string {
  return value === 1 ? "" : String(value).split("").map((digit) => SUBSCRIPT_DIGITS[digit]).join("");
}

export function intermediateFormula(leftFormula: string, rightFormula: string, index: number, total: number): string {
  if (total < 1 || index < 0 || index >= total) throw new Error("Intermediate formula index is outside its composition sequence.");
  const orderedElements: string[] = [];
  const counts = new Map<string, number>();
  const addTerms = (formula: string, multiplier: number) => formulaTerms(formula).forEach(({ element, count }) => {
    if (!counts.has(element)) orderedElements.push(element);
    counts.set(element, (counts.get(element) ?? 0) + count * multiplier);
  });
  addTerms(leftFormula, total - index);
  addTerms(rightFormula, index + 1);
  const divisor = [...counts.values()].reduce(greatestCommonDivisor);
  return orderedElements.map((element) => `${element}${subscript((counts.get(element) ?? 0) / divisor)}`).join("");
}

function intermediateRules(
  seed: number,
  solution: HiddenSolution,
  inventory: PhaseDefinition[],
  endMemberLabels: PuzzleDefinition["endMemberLabels"],
): { phases: PhaseDefinition[]; intermediateCompositions: PuzzleDefinition["intermediateCompositions"] } {
  const groupedPhases = new Map<string, PhaseDefinition[]>();
  inventory.filter((phase) => phase.kind === "line-compound").forEach((phase) => {
    const groupId = phase.compositionSiteId ?? phase.id;
    groupedPhases.set(groupId, [...(groupedPhases.get(groupId) ?? []), phase]);
  });
  const groups = [...groupedPhases].map(([id, groupPhases]) => {
    const compositions = [...new Set(groupPhases.map((phase) => phase.fixedCompositionBPercent))];
    if (compositions.length !== 1 || compositions[0] === undefined) throw new Error(`${solution.puzzleId} has no unique fixed composition for intermediate site ${id}.`);
    const compositionBPercent = compositions[0];
    return { id, phases: groupPhases, compositionBPercent };
  }).sort((a, b) => a.compositionBPercent - b.compositionBPercent);

  const greekOffset = seed % GREEK_INTERMEDIATE_SYMBOLS.length;
  const intermediateCompositions = groups.map((group, index) => ({
    id: group.id,
    label: intermediateFormula(endMemberLabels.left, endMemberLabels.right, index, groups.length),
    compositionBPercent: group.compositionBPercent,
    phaseIds: group.phases.map((phase) => phase.id),
  }));
  const compositionByPhase = new Map(intermediateCompositions.flatMap((composition) => composition.phaseIds.map((phaseId) => [phaseId, composition] as const)));
  const phasesWithRules = inventory.map((phase) => {
    const composition = compositionByPhase.get(phase.id);
    if (!composition) return phase;
    const groupIndex = intermediateCompositions.findIndex((candidate) => candidate.id === composition.id);
    const variantIndex = composition.phaseIds.indexOf(phase.id);
    const baseSymbol = GREEK_INTERMEDIATE_SYMBOLS[(greekOffset + groupIndex) % GREEK_INTERMEDIATE_SYMBOLS.length];
    return {
      ...phase,
      symbol: `${baseSymbol}${"′".repeat(variantIndex)}`,
      name: variantIndex === 0 ? `${composition.label} intermediate` : `${composition.label} intermediate polymorph ${variantIndex + 1}`,
      compositionSiteId: composition.id,
      fixedCompositionBPercent: composition.compositionBPercent,
    };
  });
  return { phases: phasesWithRules, intermediateCompositions };
}

function puzzleFrom(
  seed: number,
  difficulty: Difficulty,
  familyLabel: string,
  solution: HiddenSolution,
  requiredInvariants: RequiredInvariantSpec[],
  phaseInventory?: PhaseDefinition[],
  endMemberLabels: PuzzleDefinition["endMemberLabels"] = { left: "A", right: "B" },
): PuzzleDefinition {
  solution.curves.forEach((curve) => { curve.boundaryKind ??= boundaryKindForRole(curve.semanticRole); });
  solution.invariants.forEach((invariant) => {
    const orderedRoles = [invariant.startRoleId, ...invariant.interiorRoleIds, invariant.endRoleId];
    if (orderedRoles.length !== invariant.expectedAssemblage.length) {
      throw new Error(`${solution.puzzleId} cannot assign phase compositions to ${invariant.reactionType}.`);
    }
    const rule = REACTION_RULES[invariant.reactionType];
    const inventory = phaseInventory ?? phases(solution.points.some((item) => item.roleId === "gamma" || item.roleId.startsWith("gamma-")));
    const phaseById = new Map(inventory.map((phase) => [phase.id, phase]));
    const interiorPhaseId = rule.interiorPhaseSelection === "only-liquid"
      ? invariant.expectedAssemblage.find((phaseId) => phaseById.get(phaseId)?.kind === "liquid")
      : rule.interiorPhaseSelection === "only-solid"
        ? invariant.expectedAssemblage.find((phaseId) => phaseById.get(phaseId)?.kind !== "liquid")
        : invariant.expectedAssemblage[1];
    if (!interiorPhaseId) throw new Error(`${solution.puzzleId} cannot identify the interior phase for ${invariant.reactionType}.`);
    const outerPhaseIds = invariant.expectedAssemblage.filter((phaseId) => phaseId !== interiorPhaseId);
    invariant.phaseCompositionRoleIds = {
      [outerPhaseIds[0]]: orderedRoles[0],
      [interiorPhaseId]: invariant.interiorRoleIds[0],
      [outerPhaseIds[1]]: orderedRoles.at(-1)!,
    };
    if (rule.interiorCompositionSide === "reactants") {
      invariant.reactantPhaseIds = [interiorPhaseId];
      invariant.productPhaseIds = invariant.expectedAssemblage.filter((phaseId) => phaseId !== interiorPhaseId);
    } else {
      invariant.productPhaseIds = [interiorPhaseId];
      invariant.reactantPhaseIds = invariant.expectedAssemblage.filter((phaseId) => phaseId !== interiorPhaseId);
    }
  });
  const compound = solution.points.some((item) => item.roleId === "gamma" || item.roleId.startsWith("gamma-"));
  const ruledInventory = intermediateRules(seed, solution, phaseInventory ?? phases(compound), endMemberLabels);
  return {
    schemaVersion: "tie-line-labels-3",
    id: solution.puzzleId,
    title: familyLabel,
    compositionMinPercentB: 0,
    compositionMaxPercentB: 100,
    temperatureMinCelsius: 0,
    temperatureMaxCelsius: 1100,
    endMemberLabels,
    intermediateCompositions: ruledInventory.intermediateCompositions,
    phases: ruledInventory.phases,
    diagramLabels: ruledInventory.phases.map((phase) => ({
      id: phase.id,
      symbol: phase.symbol,
      name: phase.name,
      phaseIds: [phase.id],
      scope: "global-phase" as const,
      colorPhaseId: phase.id,
      labelEquivalenceGroup: phase.labelEquivalenceGroup,
    })),
    pointRoles: solution.points.map(({ roleId, point: anchor }) => ({
      id: roleId,
      symbol: roleId,
      instructionLabel: "Generated anchor",
      constraint: anchor.compositionBPercent === 0 ? { kind: "left-edge" as const }
        : anchor.compositionBPercent === 100 ? { kind: "right-edge" as const }
          : anchor.temperatureCelsius === 0 ? { kind: "bottom-edge" as const }
            : { kind: "fixed-temperature" as const, temperatureCelsius: anchor.temperatureCelsius },
      required: true,
    })),
    instructions: [
      { id: "instruction-fields", compactText: `Label all ${solution.expectedFields.length} phase fields` },
      { id: "instruction-mode", compactText: `${difficulty[0].toUpperCase()}${difficulty.slice(1)} · Seed ${seed}` },
    ],
    permittedTools: ["label", "erase"],
    requiredCurves: solution.curves.map((curve) => ({
      startRoleId: curve.startRoleId,
      endRoleId: curve.endRoleId,
      semanticRole: curve.semanticRole ?? "phase-boundary",
      boundaryKind: curve.boundaryKind ?? boundaryKindForRole(curve.semanticRole),
      compositionSiteId: curve.compositionSiteId,
    })),
    requiredInvariants: requiredInvariants.map((required, index) => ({ ...required, ...solution.invariants[index] })),
    expectedFieldCount: solution.expectedFields.length,
    expectedFields: solution.expectedFields,
    allowExtraGeometryOnSubmit: false,
  };
}

function generateSimple(seed: number, difficulty: Difficulty = "easy"): GeneratedRound {
  const random = randomForSeed(seed);
  const ex = integer(random, 34, 66);
  const et = integer(random, 470, 640, 10);
  const leftMelt = integer(random, et + 250, 1050, 10);
  const rightMelt = integer(random, et + 220, 1030, 10);
  const solution: HiddenSolution = {
    puzzleId: `easy-simple-eutectic-v2-${seed}`,
    points: [
      { roleId: "a-melt", point: point(0, leftMelt) },
      { roleId: "b-melt", point: point(100, rightMelt) },
      { roleId: "left-eut", point: point(0, et) },
      { roleId: "eutectic", point: point(ex, et) },
      { roleId: "right-eut", point: point(100, et) },
    ],
    curves: [
      { type: "curve", startRoleId: "a-melt", endRoleId: "eutectic", recommendedControl: bowedControl(point(ex, et), point(0, leftMelt)), semanticRole: "liquidus-left" },
      { type: "curve", startRoleId: "b-melt", endRoleId: "eutectic", recommendedControl: bowedControl(point(ex, et), point(100, rightMelt)), semanticRole: "liquidus-right" },
    ],
    invariants: [{ type: "invariant-horizontal", startRoleId: "left-eut", endRoleId: "right-eut", interiorRoleIds: ["eutectic"], temperatureCelsius: et, expectedAssemblage: ["L", "alpha", "beta"], reactionType: "eutectic" }],
    expectedFields: [],
  };
  solution.expectedFields = deriveExpectedFields(solution, (_label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
    if (boundaries.has("frame-bottom")) return { role: "alpha-beta", phases: ["alpha", "beta"] };
    if (boundaries.has("frame-left")) return { role: "liquid-alpha", phases: ["L", "alpha"] };
    return { role: "liquid-beta", phases: ["L", "beta"] };
  }, 4);
  const requiredInvariants = requiredInvariantsFor(solution);
  return { seed, difficulty, family: "simple-eutectic", solution, puzzle: puzzleFrom(seed, difficulty, "Simple eutectic", solution, requiredInvariants) };
}

function generateLimited(seed: number, difficulty: Difficulty = "normal"): GeneratedRound {
  const random = randomForSeed(seed);
  const ex = integer(random, 34, 66);
  const et = integer(random, 480, 650, 10);
  const ax = integer(random, 7, Math.min(22, ex - 18));
  const bx = integer(random, Math.max(78, ex + 18), 93);
  const leftMelt = integer(random, et + 260, 1060, 10);
  const rightMelt = integer(random, et + 210, 1030, 10);
  const curves: SolutionCurve[] = [
    { type: "curve", startRoleId: "a-melt", endRoleId: "eutectic", recommendedControl: bowedControl(point(ex, et), point(0, leftMelt)), semanticRole: "liquidus-left" },
    { type: "curve", startRoleId: "b-melt", endRoleId: "eutectic", recommendedControl: bowedControl(point(ex, et), point(100, rightMelt)), semanticRole: "liquidus-right" },
    { type: "curve", startRoleId: "a-melt", endRoleId: "alpha-eut", recommendedControl: bowedControl(point(ax, et), point(0, leftMelt), .7), semanticRole: "solidus-left" },
    { type: "curve", startRoleId: "b-melt", endRoleId: "beta-eut", recommendedControl: bowedControl(point(bx, et), point(100, rightMelt), .7), semanticRole: "solidus-right" },
    { type: "curve", startRoleId: "alpha-low", endRoleId: "alpha-eut", recommendedControl: point(ax * .18, et * .54), semanticRole: "solvus-left" },
    { type: "curve", startRoleId: "beta-low", endRoleId: "beta-eut", recommendedControl: point(bx + (100 - bx) * .82, et * .54), semanticRole: "solvus-right" },
  ];
  const solution: HiddenSolution = {
    puzzleId: `${difficulty}-limited-eutectic-v3-${seed}`,
    points: [
      { roleId: "a-melt", point: point(0, leftMelt) }, { roleId: "b-melt", point: point(100, rightMelt) },
      { roleId: "alpha-eut", point: point(ax, et) }, { roleId: "eutectic", point: point(ex, et) }, { roleId: "beta-eut", point: point(bx, et) },
      { roleId: "alpha-low", point: point(0, 0) }, { roleId: "beta-low", point: point(100, 0) },
    ],
    curves,
    invariants: [{ type: "invariant-horizontal", startRoleId: "alpha-eut", endRoleId: "beta-eut", interiorRoleIds: ["eutectic"], temperatureCelsius: et, expectedAssemblage: ["L", "alpha", "beta"], reactionType: "eutectic" }],
    expectedFields: [],
  };
  const rules = [
    { role: "liquid", boundaries: [0, 1], phases: ["L"] }, { role: "liquid-alpha", boundaries: [0, 2], phases: ["L", "alpha"] },
    { role: "liquid-beta", boundaries: [1, 3], phases: ["L", "beta"] }, { role: "alpha", boundaries: [2, 4], phases: ["alpha"], texture: "partial-solubility" as const },
    { role: "beta", boundaries: [3, 5], phases: ["beta"], texture: "partial-solubility" as const }, { role: "alpha-beta", boundaries: [4, 5], phases: ["alpha", "beta"] },
  ];
  solution.expectedFields = deriveExpectedFields(solution, (_label, boundaries) => {
    const match = rules.find((rule) => rule.boundaries.every((index) => boundaries.has(`generated-curve:${index}`)));
    if (!match) throw new Error("Limited eutectic field could not be classified.");
    return match;
  }, 6);
  const requiredInvariants = requiredInvariantsFor(solution);
  return { seed, difficulty, family: "limited-eutectic", solution, puzzle: puzzleFrom(seed, difficulty, "Limited-solubility eutectic", solution, requiredInvariants) };
}

function generateCompound(seed: number, difficulty: Difficulty = "hard"): GeneratedRound {
  const random = randomForSeed(seed);
  const gx = 50;
  const e1x = integer(random, 20, gx - 13);
  const e2x = integer(random, gx + 13, 82);
  const e1t = integer(random, 430, 520, 10);
  const e2t = e1t + integer(random, 50, 100, 10);
  const leftMelt = integer(random, e1t + 330, 1050, 10);
  const rightMelt = integer(random, e2t + 250, 1040, 10);
  const peak = integer(random, Math.max(leftMelt, rightMelt) - 60, 1070, 10);
  const solution: HiddenSolution = {
    puzzleId: `${difficulty}-compound-eutectic-v3-${seed}`,
    points: [
      { roleId: "a-melt", point: point(0, leftMelt) }, { roleId: "b-melt", point: point(100, rightMelt) },
      { roleId: "gamma-peak", point: point(gx, peak) }, { roleId: "gamma-low", point: point(gx, 0) },
      { roleId: "left-e1", point: point(0, e1t) }, { roleId: "e1", point: point(e1x, e1t) }, { roleId: "gamma-e1", point: point(gx, e1t) },
      { roleId: "gamma-e2", point: point(gx, e2t) }, { roleId: "e2", point: point(e2x, e2t) }, { roleId: "right-e2", point: point(100, e2t) },
    ],
    curves: [
      { type: "curve", startRoleId: "a-melt", endRoleId: "e1", recommendedControl: bowedControl(point(e1x, e1t), point(0, leftMelt)), semanticRole: "liquidus-alpha" },
      { type: "curve", startRoleId: "gamma-peak", endRoleId: "e1", recommendedControl: bowedControl(point(e1x, e1t), point(gx, peak), 1), semanticRole: "liquidus-gamma-left" },
      { type: "curve", startRoleId: "gamma-peak", endRoleId: "e2", recommendedControl: bowedControl(point(e2x, e2t), point(gx, peak), 1), semanticRole: "liquidus-gamma-right" },
      { type: "curve", startRoleId: "b-melt", endRoleId: "e2", recommendedControl: bowedControl(point(e2x, e2t), point(100, rightMelt)), semanticRole: "liquidus-beta" },
      { type: "curve", startRoleId: "gamma-low", endRoleId: "gamma-e1", recommendedControl: point(gx, e1t * .5), semanticRole: "compound-line-low", compositionSiteId: "gamma" },
      { type: "curve", startRoleId: "gamma-e1", endRoleId: "gamma-e2", recommendedControl: point(gx, (e1t + e2t) / 2), semanticRole: "compound-line-mid", compositionSiteId: "gamma" },
      { type: "curve", startRoleId: "gamma-e2", endRoleId: "gamma-peak", recommendedControl: point(gx, (e2t + peak) / 2), semanticRole: "compound-line-high", compositionSiteId: "gamma" },
    ],
    invariants: [
      { type: "invariant-horizontal", startRoleId: "left-e1", endRoleId: "gamma-e1", interiorRoleIds: ["e1"], temperatureCelsius: e1t, expectedAssemblage: ["L", "alpha", "gamma"], reactionType: "eutectic" },
      { type: "invariant-horizontal", startRoleId: "gamma-e2", endRoleId: "right-e2", interiorRoleIds: ["e2"], temperatureCelsius: e2t, expectedAssemblage: ["L", "gamma", "beta"], reactionType: "eutectic" },
    ],
    expectedFields: [],
  };
  solution.expectedFields = deriveExpectedFields(solution, (label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
    if (label.compositionBPercent < gx && label.temperatureCelsius < e1t) return { role: "alpha-gamma", phases: ["alpha", "gamma"] };
    if (label.compositionBPercent > gx && label.temperatureCelsius < e2t) return { role: "gamma-beta", phases: ["gamma", "beta"] };
    if (label.compositionBPercent < gx) return label.compositionBPercent < e1x
      ? { role: "liquid-alpha", phases: ["L", "alpha"] }
      : { role: "liquid-gamma-left", phases: ["L", "gamma"] };
    return label.compositionBPercent < e2x
      ? { role: "liquid-gamma-right", phases: ["L", "gamma"] }
      : { role: "liquid-beta", phases: ["L", "beta"] };
  }, 7);
  const requiredInvariants = solution.invariants.map((item) => ({ startRoleId: item.startRoleId, endRoleId: item.endRoleId, interiorRoleIds: item.interiorRoleIds, expectedAssemblage: item.expectedAssemblage, reactionType: item.reactionType }));
  return { seed, difficulty, family: "compound-double-eutectic", solution, puzzle: puzzleFrom(seed, difficulty, "Congruently melting compound with two eutectics", solution, requiredInvariants) };
}

function generateIncongruentCompound(seed: number, difficulty: Difficulty = "easy"): GeneratedRound {
  const random = randomForSeed(seed ^ 0x7f4a11);
  const gx = 50;
  const ex = integer(random, 16, gx - 14);
  const px = integer(random, ex + 7, gx - 6);
  const eutecticT = integer(random, 390, 480, 10);
  const peritecticT = eutecticT + integer(random, 150, 240, 10);
  const leftMelt = integer(random, peritecticT + 210, 1040, 10);
  const rightMelt = integer(random, peritecticT + 170, 1020, 10);
  const reactionType = "peritectic";
  const solution: HiddenSolution = {
    puzzleId: `${difficulty}-${reactionType}-compound-v3-${seed}`,
    points: [
      { roleId: "a-melt", point: point(0, leftMelt) },
      { roleId: "b-melt", point: point(100, rightMelt) },
      { roleId: "left-eut", point: point(0, eutecticT) },
      { roleId: "eutectic", point: point(ex, eutecticT) },
      { roleId: "gamma-eut", point: point(gx, eutecticT) },
      { roleId: "gamma-low", point: point(gx, 0) },
      { roleId: "gamma-peritectic", point: point(gx, peritecticT) },
      { roleId: "peritectic", point: point(px, peritecticT) },
      { roleId: "right-peritectic", point: point(100, peritecticT) },
    ],
    curves: [
      { type: "curve", startRoleId: "a-melt", endRoleId: "eutectic", recommendedControl: bowedControl(point(ex, eutecticT), point(0, leftMelt)), semanticRole: "liquidus-alpha" },
      { type: "curve", startRoleId: "eutectic", endRoleId: "peritectic", recommendedControl: bowedControl(point(ex, eutecticT), point(px, peritecticT), .72), semanticRole: "liquidus-gamma" },
      { type: "curve", startRoleId: "peritectic", endRoleId: "b-melt", recommendedControl: bowedControl(point(px, peritecticT), point(100, rightMelt)), semanticRole: "liquidus-beta" },
      { type: "curve", startRoleId: "gamma-low", endRoleId: "gamma-eut", recommendedControl: point(gx, eutecticT * .5), semanticRole: "compound-line-low", compositionSiteId: "gamma" },
      { type: "curve", startRoleId: "gamma-eut", endRoleId: "gamma-peritectic", recommendedControl: point(gx, (eutecticT + peritecticT) / 2), semanticRole: "compound-line-high", compositionSiteId: "gamma" },
    ],
    invariants: [
      { type: "invariant-horizontal", startRoleId: "left-eut", endRoleId: "gamma-eut", interiorRoleIds: ["eutectic"], temperatureCelsius: eutecticT, expectedAssemblage: ["L", "alpha", "gamma"], reactionType: "eutectic" },
      { type: "invariant-horizontal", startRoleId: "peritectic", endRoleId: "right-peritectic", interiorRoleIds: ["gamma-peritectic"], temperatureCelsius: peritecticT, expectedAssemblage: ["L", "gamma", "beta"], reactionType },
    ],
    expectedFields: [],
  };
  solution.expectedFields = deriveExpectedFields(solution, (label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
    if (label.compositionBPercent < gx) {
      if (label.temperatureCelsius < eutecticT) return { role: "alpha-gamma", phases: ["alpha", "gamma"] };
      return label.compositionBPercent < ex ? { role: "liquid-alpha", phases: ["L", "alpha"] } : { role: "liquid-gamma-left", phases: ["L", "gamma"] };
    }
    if (label.temperatureCelsius < peritecticT) return { role: "gamma-beta", phases: ["gamma", "beta"] };
    return label.compositionBPercent < px ? { role: "liquid-gamma-right", phases: ["L", "gamma"] } : { role: "liquid-beta", phases: ["L", "beta"] };
  }, 6);
  const requiredInvariants = solution.invariants.map((item) => ({ startRoleId: item.startRoleId, endRoleId: item.endRoleId, interiorRoleIds: item.interiorRoleIds, expectedAssemblage: item.expectedAssemblage, reactionType: item.reactionType }));
  const title = "Incongruent compound with peritectic";
  return { seed, difficulty, family: "peritectic", solution, puzzle: puzzleFrom(seed, difficulty, title, solution, requiredInvariants) };
}

function generateTripleEutectic(seed: number): GeneratedRound {
  const random = randomForSeed(seed ^ 0x3ea9c7);
  const g1x = 33;
  const g2x = 67;
  const e1x = integer(random, 12, g1x - 10);
  const e2x = integer(random, g1x + 10, g2x - 10);
  const e3x = integer(random, g2x + 10, 88);
  const e1t = integer(random, 360, 430, 10);
  const e2t = e1t + integer(random, 50, 90, 10);
  const e3t = e2t + integer(random, 50, 90, 10);
  const aMelt = integer(random, e3t + 250, 1030, 10);
  const bMelt = integer(random, e3t + 210, 1020, 10);
  const g1Peak = integer(random, Math.max(aMelt - 40, e3t + 230), 1060, 10);
  const g2Peak = integer(random, Math.max(bMelt - 40, e3t + 210), 1050, 10);
  const solution: HiddenSolution = {
    puzzleId: `hard-triple-eutectic-v3-${seed}`,
    points: [
      { roleId: "a-melt", point: point(0, aMelt) }, { roleId: "b-melt", point: point(100, bMelt) },
      { roleId: "gamma-peak", point: point(g1x, g1Peak) }, { roleId: "delta-peak", point: point(g2x, g2Peak) },
      { roleId: "gamma-low", point: point(g1x, 0) }, { roleId: "delta-low", point: point(g2x, 0) },
      { roleId: "left-e1", point: point(0, e1t) }, { roleId: "e1", point: point(e1x, e1t) }, { roleId: "gamma-e1", point: point(g1x, e1t) },
      { roleId: "gamma-e2", point: point(g1x, e2t) }, { roleId: "e2", point: point(e2x, e2t) }, { roleId: "delta-e2", point: point(g2x, e2t) },
      { roleId: "delta-e3", point: point(g2x, e3t) }, { roleId: "e3", point: point(e3x, e3t) }, { roleId: "right-e3", point: point(100, e3t) },
    ],
    curves: [
      { type: "curve", startRoleId: "a-melt", endRoleId: "e1", recommendedControl: bowedControl(point(e1x, e1t), point(0, aMelt)), semanticRole: "liquidus-alpha" },
      { type: "curve", startRoleId: "gamma-peak", endRoleId: "e1", recommendedControl: bowedControl(point(e1x, e1t), point(g1x, g1Peak), 1), semanticRole: "liquidus-gamma-left" },
      { type: "curve", startRoleId: "gamma-peak", endRoleId: "e2", recommendedControl: bowedControl(point(e2x, e2t), point(g1x, g1Peak), 1), semanticRole: "liquidus-gamma-right" },
      { type: "curve", startRoleId: "delta-peak", endRoleId: "e2", recommendedControl: bowedControl(point(e2x, e2t), point(g2x, g2Peak), 1), semanticRole: "liquidus-delta-left" },
      { type: "curve", startRoleId: "delta-peak", endRoleId: "e3", recommendedControl: bowedControl(point(e3x, e3t), point(g2x, g2Peak), 1), semanticRole: "liquidus-delta-right" },
      { type: "curve", startRoleId: "b-melt", endRoleId: "e3", recommendedControl: bowedControl(point(e3x, e3t), point(100, bMelt)), semanticRole: "liquidus-beta" },
      { type: "curve", startRoleId: "gamma-low", endRoleId: "gamma-e1", recommendedControl: point(g1x, e1t / 2), semanticRole: "gamma-line-low", compositionSiteId: "gamma" },
      { type: "curve", startRoleId: "gamma-e1", endRoleId: "gamma-e2", recommendedControl: point(g1x, (e1t + e2t) / 2), semanticRole: "gamma-line-mid", compositionSiteId: "gamma" },
      { type: "curve", startRoleId: "gamma-e2", endRoleId: "gamma-peak", recommendedControl: point(g1x, (e2t + g1Peak) / 2), semanticRole: "gamma-line-high", compositionSiteId: "gamma" },
      { type: "curve", startRoleId: "delta-low", endRoleId: "delta-e2", recommendedControl: point(g2x, e2t / 2), semanticRole: "delta-line-low", compositionSiteId: "delta" },
      { type: "curve", startRoleId: "delta-e2", endRoleId: "delta-e3", recommendedControl: point(g2x, (e2t + e3t) / 2), semanticRole: "delta-line-mid", compositionSiteId: "delta" },
      { type: "curve", startRoleId: "delta-e3", endRoleId: "delta-peak", recommendedControl: point(g2x, (e3t + g2Peak) / 2), semanticRole: "delta-line-high", compositionSiteId: "delta" },
    ],
    invariants: [
      { type: "invariant-horizontal", startRoleId: "left-e1", endRoleId: "gamma-e1", interiorRoleIds: ["e1"], temperatureCelsius: e1t, expectedAssemblage: ["L", "alpha", "gamma"], reactionType: "eutectic" },
      { type: "invariant-horizontal", startRoleId: "gamma-e2", endRoleId: "delta-e2", interiorRoleIds: ["e2"], temperatureCelsius: e2t, expectedAssemblage: ["L", "gamma", "delta"], reactionType: "eutectic" },
      { type: "invariant-horizontal", startRoleId: "delta-e3", endRoleId: "right-e3", interiorRoleIds: ["e3"], temperatureCelsius: e3t, expectedAssemblage: ["L", "delta", "beta"], reactionType: "eutectic" },
    ],
    expectedFields: [],
  };
  solution.expectedFields = deriveExpectedFields(solution, (label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
    if (label.compositionBPercent < g1x) {
      if (label.temperatureCelsius < e1t) return { role: "alpha-gamma", phases: ["alpha", "gamma"] };
      return label.compositionBPercent < e1x ? { role: "liquid-alpha", phases: ["L", "alpha"] } : { role: "liquid-gamma-left", phases: ["L", "gamma"] };
    }
    if (label.compositionBPercent < g2x) {
      if (label.temperatureCelsius < e2t) return { role: "gamma-delta", phases: ["gamma", "delta"] };
      return label.compositionBPercent < e2x ? { role: "liquid-gamma-right", phases: ["L", "gamma"] } : { role: "liquid-delta-left", phases: ["L", "delta"] };
    }
    if (label.temperatureCelsius < e3t) return { role: "delta-beta", phases: ["delta", "beta"] };
    return label.compositionBPercent < e3x ? { role: "liquid-delta-right", phases: ["L", "delta"] } : { role: "liquid-beta", phases: ["L", "beta"] };
  }, 10);
  const inventory: PhaseDefinition[] = [
    { id: "L", symbol: "L", name: "Liquid", kind: "liquid", required: true },
    { id: "alpha", symbol: "α", name: "Alpha", kind: "terminal-solid", required: true },
    { id: "gamma", symbol: "γ", name: "First intermediate", kind: "line-compound", required: true, compositionSiteId: "gamma", fixedCompositionBPercent: g1x },
    { id: "delta", symbol: "δ", name: "Second intermediate", kind: "line-compound", required: true, compositionSiteId: "delta", fixedCompositionBPercent: g2x },
    { id: "beta", symbol: "β", name: "Beta", kind: "terminal-solid", required: true },
  ];
  const requiredInvariants = solution.invariants.map((item) => ({ startRoleId: item.startRoleId, endRoleId: item.endRoleId, interiorRoleIds: item.interiorRoleIds, expectedAssemblage: item.expectedAssemblage, reactionType: item.reactionType }));
  return { seed, difficulty: "hard", family: "triple-eutectic", solution, puzzle: puzzleFrom(seed, "hard", "Two intermediate compounds with three eutectics", solution, requiredInvariants, inventory) };
}

function generateImmiscibleHard(seed: number, variant: "syntectic" | "liquid-spinodal"): GeneratedRound {
  const spinodal = variant === "liquid-spinodal";
  const random = randomForSeed(seed ^ 0x1a2b7f);
  const gx = 50;
  const e1x = integer(random, 16, 28);
  const e2x = integer(random, 74, 86);
  const domeLeftX = integer(random, 31, 38);
  const domeRightX = integer(random, 62, 69);
  const rightT = integer(random, 360, 420, 10);
  const leftT = rightT + integer(random, 50, 90, 10);
  const synT = leftT + integer(random, 160, 220, 10);
  const domePeakT = integer(random, synT + 150, 950, 10);
  const aMelt = integer(random, Math.max(domePeakT - 20, 900), 1040, 10);
  const bMelt = integer(random, Math.max(domePeakT - 40, 880), 1030, 10);
  const solution: HiddenSolution = {
    puzzleId: `hard-${variant}-immiscibility-v3-${seed}`,
    points: [
      { roleId: "a-melt", point: point(0, aMelt) }, { roleId: "b-melt", point: point(100, bMelt) },
      { roleId: "left-eut-end", point: point(0, leftT) }, { roleId: "left-eutectic", point: point(e1x, leftT) }, { roleId: "gamma-left", point: point(gx, leftT) },
      { roleId: "gamma-low", point: point(gx, 0) }, { roleId: "gamma-right", point: point(gx, rightT) },
      { roleId: "right-eutectic", point: point(e2x, rightT) }, { roleId: "right-eut-end", point: point(100, rightT) },
      { roleId: "dome-left", point: point(domeLeftX, synT) }, { roleId: "dome-peak", point: point(gx, domePeakT) }, { roleId: "dome-right", point: point(domeRightX, synT) },
      { roleId: "gamma-syntectic", point: point(gx, synT) },
    ],
    curves: [
      { type: "curve", startRoleId: "a-melt", endRoleId: "left-eutectic", recommendedControl: bowedControl(point(e1x, leftT), point(0, aMelt)), semanticRole: "liquidus-alpha" },
      { type: "curve", startRoleId: "left-eutectic", endRoleId: "dome-left", recommendedControl: bowedControl(point(e1x, leftT), point(domeLeftX, synT), .72), semanticRole: "liquidus-gamma-left" },
      { type: "curve", startRoleId: "dome-right", endRoleId: "right-eutectic", recommendedControl: bowedControl(point(e2x, rightT), point(domeRightX, synT), .72), semanticRole: "liquidus-gamma-right" },
      { type: "curve", startRoleId: "right-eutectic", endRoleId: "b-melt", recommendedControl: bowedControl(point(e2x, rightT), point(100, bMelt)), semanticRole: "liquidus-beta" },
      { type: "curve", startRoleId: "dome-left", endRoleId: "dome-peak", recommendedControl: bowedControl(point(domeLeftX, synT), point(gx, domePeakT), 1, .32), semanticRole: "immiscibility-left" },
      { type: "curve", startRoleId: "dome-peak", endRoleId: "dome-right", recommendedControl: bowedControl(point(domeRightX, synT), point(gx, domePeakT), 1, .32), semanticRole: "immiscibility-right" },
      { type: "curve", startRoleId: "gamma-low", endRoleId: "gamma-right", recommendedControl: point(gx, rightT / 2), semanticRole: "compound-line-low", compositionSiteId: "gamma" },
      { type: "curve", startRoleId: "gamma-right", endRoleId: "gamma-left", recommendedControl: point(gx, (rightT + leftT) / 2), semanticRole: "compound-line-mid", compositionSiteId: "gamma" },
      { type: "curve", startRoleId: "gamma-left", endRoleId: "gamma-syntectic", recommendedControl: point(gx, (leftT + synT) / 2), semanticRole: "compound-line-high", compositionSiteId: "gamma" },
    ],
    invariants: [
      { type: "invariant-horizontal", startRoleId: "left-eut-end", endRoleId: "gamma-left", interiorRoleIds: ["left-eutectic"], temperatureCelsius: leftT, expectedAssemblage: ["L", "alpha", "gamma"], reactionType: "eutectic" },
      { type: "invariant-horizontal", startRoleId: "gamma-right", endRoleId: "right-eut-end", interiorRoleIds: ["right-eutectic"], temperatureCelsius: rightT, expectedAssemblage: ["L", "gamma", "beta"], reactionType: "eutectic" },
      { type: "invariant-horizontal", startRoleId: "dome-left", endRoleId: "dome-right", interiorRoleIds: ["gamma-syntectic"], temperatureCelsius: synT, expectedAssemblage: ["L1", "L2", "gamma"], reactionType: spinodal ? "syntectic" : variant },
    ],
    expectedFields: [],
  };
  if (spinodal) {
    // The spinodal is a stability limit inside the equilibrium two-liquid
    // field. It is rendered as a guide/texture overlay and must not create
    // additional phase-label cells.
    const innerLeftX = gx - Math.max(2, Math.round((gx - domeLeftX) * .3));
    const innerRightX = gx + Math.max(2, Math.round((domeRightX - gx) * .3));
    // The spinodal is tangent to the binodal at the critical point, so both
    // inner curves terminate on the dome-peak node with horizontal tangents.
    solution.points.push(
      { roleId: "spinodal-left", point: point(innerLeftX, synT) },
      { roleId: "spinodal-right", point: point(innerRightX, synT) },
    );
    solution.curves.push(
      { type: "curve", startRoleId: "spinodal-left", endRoleId: "dome-peak", recommendedControl: bowedControl(point(innerLeftX, synT), point(gx, domePeakT), 1, .32), semanticRole: "spinodal-left", fieldBoundary: false },
      { type: "curve", startRoleId: "dome-peak", endRoleId: "spinodal-right", recommendedControl: bowedControl(point(innerRightX, synT), point(gx, domePeakT), 1, .32), semanticRole: "spinodal-right", fieldBoundary: false },
    );
  }
  const domeLeftIndex = 4;
  solution.expectedFields = deriveExpectedFields(solution, (label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
    if (boundaries.has(`generated-curve:${domeLeftIndex}`) || boundaries.has(`generated-curve:${domeLeftIndex + 1}`)) return { role: "two-liquid", phases: ["L1", "L2"] };
    if (label.compositionBPercent < gx) {
      if (label.temperatureCelsius < leftT) return { role: "alpha-gamma", phases: ["alpha", "gamma"] };
      return label.compositionBPercent < e1x ? { role: "liquid-alpha", phases: ["L", "alpha"] } : { role: "liquid-gamma-left", phases: ["L", "gamma"] };
    }
    if (label.temperatureCelsius < rightT) return { role: "gamma-beta", phases: ["gamma", "beta"] };
    return label.compositionBPercent < e2x ? { role: "liquid-gamma-right", phases: ["L", "gamma"] } : { role: "liquid-beta", phases: ["L", "beta"] };
  }, 8);
  const inventory: PhaseDefinition[] = [
    { id: "L", symbol: "L", name: "Homogeneous liquid", kind: "liquid", required: true, phaseFamilyId: "liquid-solution" },
    { id: "L1", symbol: "L₁", name: "Liquid 1", kind: "liquid", required: true, phaseFamilyId: "liquid-solution" },
    { id: "L2", symbol: "L₂", name: "Liquid 2", kind: "liquid", required: true, phaseFamilyId: "liquid-solution" },
    { id: "alpha", symbol: "α", name: "Alpha", kind: "terminal-solid", required: true },
    { id: "gamma", symbol: "γ", name: "Intermediate compound", kind: "line-compound", required: true, compositionSiteId: "gamma", fixedCompositionBPercent: gx },
    { id: "beta", symbol: "β", name: "Beta", kind: "terminal-solid", required: true },
  ];
  const requiredInvariants = solution.invariants.map((item) => ({ startRoleId: item.startRoleId, endRoleId: item.endRoleId, interiorRoleIds: item.interiorRoleIds, expectedAssemblage: item.expectedAssemblage, reactionType: item.reactionType }));
  const title = spinodal ? "Liquid immiscibility with spinodal decomposition"
    : "Liquid immiscibility with syntectic reaction";
  return { seed, difficulty: "hard", family: variant, solution, puzzle: puzzleFrom(seed, "hard", title, solution, requiredInvariants, inventory) };
}

function generateMonotectic(seed: number, difficulty: Difficulty = "hard"): GeneratedRound {
  const random = randomForSeed(seed ^ 0x4d0e7c);
  const domeLeftX = 0;
  const parentLiquidX = integer(random, 62, 72);
  const domePeakX = integer(random, 30, parentLiquidX - 14);
  const invariantT = integer(random, 460, 590, 10);
  const eutecticT = invariantT - integer(random, 170, 230, 10);
  const eutecticX = integer(random, 28, 42);
  const betaMeltT = integer(random, eutecticT + 70, invariantT - 60, 10);
  const domePeakT = invariantT + integer(random, 170, 250, 10);
  const alphaMeltT = integer(random, Math.max(domePeakT + 80, 880), 1050, 10);
  const solution: HiddenSolution = {
    puzzleId: `${difficulty}-monotectic-v4-${seed}`,
    points: [
      { roleId: "dome-left", point: point(domeLeftX, invariantT) },
      { roleId: "dome-peak", point: point(domePeakX, domePeakT) },
      { roleId: "monotectic", point: point(parentLiquidX, invariantT) },
      { roleId: "alpha-invariant", point: point(100, invariantT) },
      { roleId: "alpha-melt", point: point(100, alphaMeltT) },
      { roleId: "beta-melt", point: point(0, betaMeltT) },
      { roleId: "beta-eutectic", point: point(0, eutecticT) },
      { roleId: "lower-eutectic", point: point(eutecticX, eutecticT) },
      { roleId: "alpha-eutectic", point: point(100, eutecticT) },
    ],
    curves: [
      { type: "curve", startRoleId: "dome-left", endRoleId: "dome-peak", recommendedControl: bowedControl(point(domeLeftX, invariantT), point(domePeakX, domePeakT), 1, .32), semanticRole: "liquid-immiscibility-left" },
      { type: "curve", startRoleId: "dome-peak", endRoleId: "monotectic", recommendedControl: bowedControl(point(parentLiquidX, invariantT), point(domePeakX, domePeakT), 1, .32), semanticRole: "liquid-immiscibility-right" },
      { type: "curve", startRoleId: "monotectic", endRoleId: "alpha-melt", recommendedControl: bowedControl(point(parentLiquidX, invariantT), point(100, alphaMeltT)), semanticRole: "liquidus-alpha" },
      { type: "curve", startRoleId: "beta-melt", endRoleId: "lower-eutectic", recommendedControl: bowedControl(point(eutecticX, eutecticT), point(0, betaMeltT), .72), semanticRole: "liquidus-beta" },
    ],
    invariants: [{
      type: "invariant-horizontal",
      startRoleId: "dome-left",
      endRoleId: "alpha-invariant",
      interiorRoleIds: ["monotectic"],
      temperatureCelsius: invariantT,
      expectedAssemblage: ["L2", "L1", "alpha"],
      reactionType: "monotectic",
    }, {
      type: "invariant-horizontal",
      startRoleId: "beta-eutectic",
      endRoleId: "alpha-eutectic",
      interiorRoleIds: ["lower-eutectic"],
      temperatureCelsius: eutecticT,
      expectedAssemblage: ["L2", "beta", "alpha"],
      reactionType: "eutectic",
    }],
    expectedFields: [],
  };
  solution.expectedFields = deriveExpectedFields(solution, (label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
    if (boundaries.has("generated-curve:0") && boundaries.has("generated-curve:1")) return { role: "L1-L2", phases: ["L1", "L2"] };
    if (boundaries.has("frame-bottom")) return { role: "beta-alpha", phases: ["beta", "alpha"] };
    if (boundaries.has("generated-curve:3") && label.compositionBPercent < eutecticX) return { role: "L2-beta", phases: ["L2", "beta"] };
    if (label.temperatureCelsius < invariantT) return { role: "L2-alpha", phases: ["L2", "alpha"] };
    return { role: "L-alpha", phases: ["L", "alpha"] };
  }, 6);
  const inventory: PhaseDefinition[] = [
    { id: "L", symbol: "L", name: "Homogeneous liquid", kind: "liquid", required: true, phaseFamilyId: "liquid-solution" },
    { id: "L1", symbol: "L₁", name: "Parent liquid", kind: "liquid", required: true, phaseFamilyId: "liquid-solution" },
    { id: "L2", symbol: "L₂", name: "Second liquid", kind: "liquid", required: true, phaseFamilyId: "liquid-solution" },
    { id: "beta", symbol: "β", name: "Beta", kind: "terminal-solid", required: true },
    { id: "alpha", symbol: "α", name: "Alpha", kind: "terminal-solid", required: true },
  ];
  return {
    seed,
    difficulty,
    family: "monotectic",
    solution,
    puzzle: puzzleFrom(seed, difficulty, "Liquid immiscibility with monotectic reaction", solution, requiredInvariantsFor(solution), inventory),
  };
}

function requiredInvariantsFor(solution: HiddenSolution): RequiredInvariantSpec[] {
  return solution.invariants.map((item) => ({
    startRoleId: item.startRoleId,
    endRoleId: item.endRoleId,
    interiorRoleIds: item.interiorRoleIds,
    expectedAssemblage: item.expectedAssemblage,
    reactionType: item.reactionType,
  }));
}

function generateSubsolidusPolymorph(seed: number, difficulty: Difficulty = "normal"): GeneratedRound {
  const random = randomForSeed(seed ^ 0x51b50d);
  const aMelt = integer(random, 930, 1040, 10);
  const bMelt = integer(random, 900, 1020, 10);
  const liquidusControl = point(50, Math.min(1080, Math.max(aMelt, bMelt) + 70));
  const solidusControl = point(50, Math.min(aMelt, bMelt) - 190);
  const leftTransition = integer(random, 300, 400, 10);
  const rightTransition = leftTransition + integer(random, -40, 60, 10);
  const meanTransition = (leftTransition + rightTransition) / 2;
  const solution: HiddenSolution = {
    puzzleId: `${difficulty}-subsolidus-polymorph-solution-v1-${seed}`,
    points: [
      { roleId: "a-melt", point: point(0, aMelt) },
      { roleId: "b-melt", point: point(100, bMelt) },
      { roleId: "polymorph-left", point: point(0, leftTransition) },
      { roleId: "polymorph-right", point: point(100, rightTransition) },
    ],
    curves: [
      { type: "curve", startRoleId: "a-melt", endRoleId: "b-melt", recommendedControl: liquidusControl, semanticRole: "complete-solution-liquidus" },
      { type: "curve", startRoleId: "a-melt", endRoleId: "b-melt", recommendedControl: solidusControl, semanticRole: "complete-solution-solidus" },
      { type: "curve", startRoleId: "polymorph-left", endRoleId: "polymorph-right", recommendedControl: point(50, meanTransition + 85), semanticRole: "polymorph-solvus-upper" },
      { type: "curve", startRoleId: "polymorph-left", endRoleId: "polymorph-right", recommendedControl: point(50, meanTransition - 85), semanticRole: "polymorph-solvus-lower" },
    ],
    invariants: [],
    expectedFields: [],
  };
  solution.expectedFields = deriveExpectedFields(solution, (label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
    if (boundaries.has("generated-curve:0") && boundaries.has("generated-curve:1")) return { role: "liquid-parent", phases: ["L", "gamma"] };
    if (boundaries.has("generated-curve:2") && boundaries.has("generated-curve:3")) return { role: "polymorph-coexistence", phases: ["gamma", "delta"] };
    if (boundaries.has("frame-bottom")) return { role: "low-temperature-polymorph", phases: ["delta"], texture: "complete-solid-solution" };
    return { role: "high-temperature-polymorph", phases: ["gamma"], texture: "complete-solid-solution" };
  }, 5);
  const inventory: PhaseDefinition[] = [
    { id: "L", symbol: "L", name: "Liquid", kind: "liquid", required: true },
    { id: "gamma", symbol: "β", name: "High-temperature solid solution", kind: "terminal-solid", required: true, phaseFamilyId: "polymorph", compositionRole: "complete-range", temperatureRole: "high-temperature", labelEquivalenceGroup: "unanchored-complete-solution-polymorphs" },
    { id: "delta", symbol: "α", name: "Low-temperature solid solution", kind: "terminal-solid", required: true, phaseFamilyId: "polymorph", compositionRole: "complete-range", temperatureRole: "low-temperature", labelEquivalenceGroup: "unanchored-complete-solution-polymorphs" },
  ];
  return { seed, difficulty, family: "subsolidus-polymorph", solution, puzzle: puzzleFrom(seed, difficulty, "Subsolidus polymorphism in a complete solid solution", solution, [], inventory) };
}

function generateCoupledEutecticPeritectic(seed: number, difficulty: Difficulty = "normal"): GeneratedRound {
  const random = randomForSeed(seed ^ 0x73a1f9);
  const eutecticT = integer(random, 380, 470, 10);
  const peritecticT = eutecticT + integer(random, 150, 220, 10);
  const alphaEutX = integer(random, 10, 18);
  const eutecticX = integer(random, alphaEutX + 8, 32);
  const gammaEutX = integer(random, eutecticX + 10, 46);
  const liquidPeritecticX = integer(random, gammaEutX + 2, 52);
  const gammaPeritecticX = integer(random, liquidPeritecticX + 8, 64);
  const betaPeritecticX = integer(random, gammaPeritecticX + 18, 88);
  const aMelt = integer(random, peritecticT + 270, 1050, 10);
  const bMelt = integer(random, peritecticT + 210, 1020, 10);
  const solution: HiddenSolution = {
    puzzleId: `${difficulty}-coupled-eutectic-peritectic-v1-${seed}`,
    points: [
      { roleId: "a-melt", point: point(0, aMelt) }, { roleId: "b-melt", point: point(100, bMelt) },
      { roleId: "alpha-eutectic", point: point(alphaEutX, eutecticT) },
      { roleId: "eutectic", point: point(eutecticX, eutecticT) },
      { roleId: "gamma-eutectic", point: point(gammaEutX, eutecticT) },
      { roleId: "liquid-peritectic", point: point(liquidPeritecticX, peritecticT) },
      { roleId: "gamma-peritectic", point: point(gammaPeritecticX, peritecticT) },
      { roleId: "beta-peritectic", point: point(betaPeritecticX, peritecticT) },
      { roleId: "alpha-low", point: point(Math.max(2, alphaEutX - 8), 0) },
      { roleId: "gamma-left-low", point: point(gammaEutX - 6, 0) },
      { roleId: "gamma-right-low", point: point(gammaPeritecticX + 6, 0) },
      { roleId: "beta-low", point: point(Math.min(96, betaPeritecticX + 7), 0) },
    ],
    curves: [
      { type: "curve", startRoleId: "a-melt", endRoleId: "eutectic", recommendedControl: bowedControl(point(eutecticX, eutecticT), point(0, aMelt)), semanticRole: "liquidus-alpha" },
      { type: "curve", startRoleId: "eutectic", endRoleId: "liquid-peritectic", recommendedControl: bowedControl(point(eutecticX, eutecticT), point(liquidPeritecticX, peritecticT), .72), semanticRole: "liquidus-gamma" },
      { type: "curve", startRoleId: "liquid-peritectic", endRoleId: "b-melt", recommendedControl: bowedControl(point(liquidPeritecticX, peritecticT), point(100, bMelt)), semanticRole: "liquidus-beta" },
      { type: "curve", startRoleId: "a-melt", endRoleId: "alpha-eutectic", recommendedControl: bowedControl(point(alphaEutX, eutecticT), point(0, aMelt), .7), semanticRole: "alpha-solidus" },
      { type: "curve", startRoleId: "gamma-eutectic", endRoleId: "gamma-peritectic", recommendedControl: point((gammaEutX + gammaPeritecticX) / 2, (eutecticT + peritecticT) / 2), semanticRole: "gamma-solidus" },
      { type: "curve", startRoleId: "b-melt", endRoleId: "beta-peritectic", recommendedControl: bowedControl(point(betaPeritecticX, peritecticT), point(100, bMelt), .7), semanticRole: "beta-solidus" },
      { type: "curve", startRoleId: "alpha-low", endRoleId: "alpha-eutectic", recommendedControl: point(alphaEutX * .5, eutecticT * .5), semanticRole: "alpha-solvus" },
      { type: "curve", startRoleId: "gamma-left-low", endRoleId: "gamma-eutectic", recommendedControl: point(gammaEutX - 3, eutecticT * .5), semanticRole: "gamma-solvus-left" },
      { type: "curve", startRoleId: "gamma-peritectic", endRoleId: "gamma-right-low", recommendedControl: point(gammaPeritecticX + 3, peritecticT * .5), semanticRole: "gamma-solvus-right" },
      { type: "curve", startRoleId: "beta-peritectic", endRoleId: "beta-low", recommendedControl: point((betaPeritecticX + Math.min(96, betaPeritecticX + 7)) / 2, peritecticT * .5), semanticRole: "beta-solvus" },
    ],
    invariants: [
      { type: "invariant-horizontal", startRoleId: "alpha-eutectic", endRoleId: "gamma-eutectic", interiorRoleIds: ["eutectic"], temperatureCelsius: eutecticT, expectedAssemblage: ["L", "alpha", "gamma"], reactionType: "eutectic" },
      { type: "invariant-horizontal", startRoleId: "liquid-peritectic", endRoleId: "beta-peritectic", interiorRoleIds: ["gamma-peritectic"], temperatureCelsius: peritecticT, expectedAssemblage: ["L", "gamma", "delta"], reactionType: "peritectic" },
    ],
    expectedFields: [],
  };
  solution.expectedFields = deriveExpectedFields(solution, (_label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
    if (boundaries.has("generated-curve:0") && boundaries.has("generated-curve:3")) return { role: "liquid-alpha", phases: ["L", "alpha"] };
    if (boundaries.has("generated-curve:1") && boundaries.has("generated-curve:4")) return { role: "liquid-intermediate", phases: ["L", "gamma"] };
    if (boundaries.has("generated-curve:2") && boundaries.has("generated-curve:5")) return { role: "liquid-beta", phases: ["L", "delta"] };
    if (boundaries.has("generated-curve:3") && boundaries.has("generated-curve:6")) return { role: "alpha", phases: ["alpha"], texture: "partial-solubility" };
    if (boundaries.has("generated-curve:6") && boundaries.has("generated-curve:7")) return { role: "alpha-gamma", phases: ["alpha", "gamma"] };
    if (boundaries.has("generated-curve:7") && boundaries.has("generated-curve:8")) return { role: "gamma", phases: ["gamma"], texture: "partial-solubility" };
    if (boundaries.has("generated-curve:8") && boundaries.has("generated-curve:9")) return { role: "gamma-beta", phases: ["gamma", "delta"] };
    return { role: "beta", phases: ["delta"], texture: "partial-solubility" };
  }, 9);
  const inventory: PhaseDefinition[] = [
    { id: "L", symbol: "L", name: "Liquid", kind: "liquid", required: true },
    { id: "alpha", symbol: "α", name: "A-rich terminal solid solution", kind: "terminal-solid", required: true, compositionRole: "a-terminal" },
    { id: "gamma", symbol: "γ", name: "Intermediate solid solution", kind: "intermediate-solid-solution", required: true, compositionRole: "intermediate" },
    { id: "delta", symbol: "β", name: "B-rich terminal solid solution", kind: "terminal-solid", required: true, compositionRole: "b-terminal" },
  ];
  return { seed, difficulty, family: "coupled-eutectic-peritectic", solution, puzzle: puzzleFrom(seed, difficulty, "Coupled eutectic-peritectic system", solution, requiredInvariantsFor(solution), inventory) };
}

function generateSuperlatticeSolution(seed: number, difficulty: Difficulty = "normal"): GeneratedRound {
  const random = randomForSeed(seed ^ 0x29c6e3);
  const aMelt = integer(random, 930, 1040, 10);
  const bMelt = integer(random, 900, 1020, 10);
  const leftOrderX = integer(random, 20, 32);
  const rightOrderX = integer(random, 68, 80);
  const criticalX = integer(random, leftOrderX + 14, rightOrderX - 14);
  const orderT = integer(random, 300, 440, 10);
  const solution: HiddenSolution = {
    puzzleId: `${difficulty}-superlattice-complete-solution-v1-${seed}`,
    points: [
      { roleId: "a-melt", point: point(0, aMelt) }, { roleId: "b-melt", point: point(100, bMelt) },
      { roleId: "order-left", point: point(leftOrderX, 0) },
      { roleId: "order-critical", point: point(criticalX, orderT) },
      { roleId: "order-right", point: point(rightOrderX, 0) },
    ],
    curves: [
      { type: "curve", startRoleId: "a-melt", endRoleId: "b-melt", recommendedControl: point(50, Math.min(1080, Math.max(aMelt, bMelt) + 70)), semanticRole: "complete-solution-liquidus" },
      { type: "curve", startRoleId: "a-melt", endRoleId: "b-melt", recommendedControl: point(50, Math.min(aMelt, bMelt) - 190), semanticRole: "complete-solution-solidus" },
      { type: "curve", startRoleId: "order-left", endRoleId: "order-critical", recommendedControl: bowedControl(point(leftOrderX, 0), point(criticalX, orderT), 1, .32), semanticRole: "superlattice-left" },
      { type: "curve", startRoleId: "order-critical", endRoleId: "order-right", recommendedControl: bowedControl(point(rightOrderX, 0), point(criticalX, orderT), 1, .32), semanticRole: "superlattice-right" },
    ],
    invariants: [],
    expectedFields: [],
  };
  solution.expectedFields = deriveExpectedFields(solution, (label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
    if (boundaries.has("generated-curve:0") && boundaries.has("generated-curve:1")) return { role: "liquid-disordered-solution", phases: ["L", "gamma"] };
    if (boundaries.has("generated-curve:2") && boundaries.has("generated-curve:3") && label.temperatureCelsius < orderT) return { role: "ordered-superlattice", phases: ["delta"], texture: "ordered-solid-solution" };
    return { role: "disordered-solid-solution", phases: ["gamma"], texture: "complete-solid-solution" };
  }, 4);
  const inventory: PhaseDefinition[] = [
    { id: "L", symbol: "L", name: "Liquid", kind: "liquid", required: true },
    { id: "gamma", symbol: "α", name: "Disordered solid solution", kind: "terminal-solid", required: true, phaseFamilyId: "ordered-solution" },
    { id: "delta", symbol: "α′", name: "Ordered superlattice", kind: "terminal-solid", required: true, phaseFamilyId: "ordered-solution" },
  ];
  return { seed, difficulty, family: "superlattice", solution, puzzle: puzzleFrom(seed, difficulty, "Superlattice ordering in a complete solid solution", solution, [], inventory) };
}

function generatePeritectoidSystem(seed: number, difficulty: Difficulty = "normal"): GeneratedRound {
  const random = randomForSeed(seed ^ 0xa9137d);
  const eutecticX = integer(random, 38, 62);
  const gammaX = 50;
  const peritectoidT = integer(random, 330, 470, 10);
  const eutecticT = integer(random, peritectoidT + 180, 760, 10);
  const leftMelt = integer(random, eutecticT + 210, 1040, 10);
  const rightMelt = integer(random, eutecticT + 190, 1020, 10);
  const solution: HiddenSolution = {
    puzzleId: `${difficulty}-peritectoid-system-v4-${seed}`,
    points: [
      { roleId: "a-melt", point: point(0, leftMelt) },
      { roleId: "b-melt", point: point(100, rightMelt) },
      { roleId: "left-eutectic", point: point(0, eutecticT) },
      { roleId: "eutectic", point: point(eutecticX, eutecticT) },
      { roleId: "right-eutectic", point: point(100, eutecticT) },
      { roleId: "left-peritectoid", point: point(0, peritectoidT) },
      { roleId: "gamma-peritectoid", point: point(gammaX, peritectoidT) },
      { roleId: "right-peritectoid", point: point(100, peritectoidT) },
      { roleId: "gamma-low", point: point(gammaX, 0) },
    ],
    curves: [
      { type: "curve", startRoleId: "a-melt", endRoleId: "eutectic", recommendedControl: bowedControl(point(eutecticX, eutecticT), point(0, leftMelt)), semanticRole: "liquidus-alpha" },
      { type: "curve", startRoleId: "b-melt", endRoleId: "eutectic", recommendedControl: bowedControl(point(eutecticX, eutecticT), point(100, rightMelt)), semanticRole: "liquidus-beta" },
      { type: "curve", startRoleId: "gamma-low", endRoleId: "gamma-peritectoid", recommendedControl: point(gammaX, peritectoidT * .5), semanticRole: "gamma-product-line", compositionSiteId: "gamma" },
    ],
    invariants: [
      { type: "invariant-horizontal", startRoleId: "left-eutectic", endRoleId: "right-eutectic", interiorRoleIds: ["eutectic"], temperatureCelsius: eutecticT, expectedAssemblage: ["L", "alpha", "beta"], reactionType: "eutectic" },
      { type: "invariant-horizontal", startRoleId: "left-peritectoid", endRoleId: "right-peritectoid", interiorRoleIds: ["gamma-peritectoid"], temperatureCelsius: peritectoidT, expectedAssemblage: ["alpha", "gamma", "beta"], reactionType: "peritectoid" },
    ],
    expectedFields: [],
  };
  solution.expectedFields = deriveExpectedFields(solution, (label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
    if (label.temperatureCelsius > eutecticT) return label.compositionBPercent < eutecticX
      ? { role: "liquid-alpha", phases: ["L", "alpha"] }
      : { role: "liquid-beta", phases: ["L", "beta"] };
    if (label.temperatureCelsius > peritectoidT) return { role: "alpha-beta", phases: ["alpha", "beta"] };
    return label.compositionBPercent < gammaX
      ? { role: "alpha-gamma", phases: ["alpha", "gamma"] }
      : { role: "gamma-beta", phases: ["gamma", "beta"] };
  }, 6);
  const inventory: PhaseDefinition[] = [
    { id: "L", symbol: "L", name: "Liquid", kind: "liquid", required: true },
    { id: "alpha", symbol: "α", name: "Alpha", kind: "terminal-solid", required: true },
    { id: "gamma", symbol: "γ", name: "Intermediate product", kind: "line-compound", required: true, compositionSiteId: "gamma", fixedCompositionBPercent: gammaX },
    { id: "beta", symbol: "β", name: "Beta", kind: "terminal-solid", required: true },
  ];
  return { seed, difficulty, family: "peritectoid", solution, puzzle: puzzleFrom(seed, difficulty, "Complete eutectic system with peritectoid · α + β → γ", solution, requiredInvariantsFor(solution), inventory) };
}

function generateSolidDecompositionSystem(
  seed: number,
  difficulty: Difficulty,
  reactionType: "eutectoid" | "monotectoid" | "metatectic",
): GeneratedRound {
  const random = randomForSeed(seed ^ ({ eutectoid: 0x319bb1, monotectoid: 0x61ac43, metatectic: 0x7e21d9 }[reactionType]));
  const parentX = integer(random, 44, 56);
  const leftProductX = integer(random, 16, parentX - 18);
  const rightProductX = integer(random, parentX + 18, 84);
  const invariantT = integer(random, 300, 430, 10);
  const transusT = invariantT + integer(random, 180, 250, 10);
  const aMelt = integer(random, transusT + 260, 1040, 10);
  const bMelt = integer(random, transusT + 240, 1020, 10);
  const liquidusControl = point(50, Math.min(1080, Math.max(aMelt, bMelt) + 60));
  const solidusControl = point(50, Math.max(transusT + 80, Math.min(aMelt, bMelt) - 180));
  const leftProduct = reactionType === "monotectoid" ? "delta" : "alpha";
  const rightProduct = reactionType === "metatectic" ? "L" : "beta";
  let metatecticEutecticT: number | undefined;
  let metatecticEutecticX: number | undefined;
  let metatecticAlphaX: number | undefined;
  const solution: HiddenSolution = {
    puzzleId: `${difficulty}-${reactionType}-complete-v1-${seed}`,
    points: [
      { roleId: "a-melt", point: point(0, aMelt) },
      { roleId: "b-melt", point: point(100, bMelt) },
      { roleId: "parent-left", point: point(0, transusT) },
      { roleId: "parent-right", point: point(100, transusT) },
      { roleId: "left-product-invariant", point: point(leftProductX, invariantT) },
      { roleId: "parent-invariant", point: point(parentX, invariantT) },
      { roleId: "right-product-invariant", point: point(rightProductX, invariantT) },
      { roleId: "left-product-low", point: point(0, 0) },
      { roleId: "right-product-low", point: point(100, 0) },
    ],
    curves: [
      { type: "curve", startRoleId: "a-melt", endRoleId: "b-melt", recommendedControl: liquidusControl, semanticRole: "complete-solution-liquidus", boundaryKind: "liquidus" },
      { type: "curve", startRoleId: "a-melt", endRoleId: "b-melt", recommendedControl: solidusControl, semanticRole: "complete-solution-solidus", boundaryKind: "solidus" },
      { type: "curve", startRoleId: "parent-left", endRoleId: "parent-invariant", recommendedControl: point(parentX * .42, transusT - 40), semanticRole: `${reactionType}-parent-left`, boundaryKind: "solvus" },
      { type: "curve", startRoleId: "parent-invariant", endRoleId: "parent-right", recommendedControl: point(parentX + (100 - parentX) * .58, transusT - 40), semanticRole: `${reactionType}-parent-right`, boundaryKind: "solvus" },
      { type: "curve", startRoleId: "parent-left", endRoleId: "left-product-invariant", recommendedControl: point(leftProductX * .5, transusT - 75), semanticRole: `${reactionType}-left-product-upper`, boundaryKind: "solvus" },
      { type: "curve", startRoleId: "right-product-invariant", endRoleId: "parent-right", recommendedControl: point(rightProductX + (100 - rightProductX) * .5, transusT - 75), semanticRole: `${reactionType}-right-product-upper`, boundaryKind: "solvus" },
      { type: "curve", startRoleId: "left-product-low", endRoleId: "left-product-invariant", recommendedControl: point(leftProductX * .25, invariantT * .5), semanticRole: `${reactionType}-product-left`, boundaryKind: "solvus" },
      { type: "curve", startRoleId: "right-product-invariant", endRoleId: "right-product-low", recommendedControl: point(rightProductX + (100 - rightProductX) * .75, invariantT * .5), semanticRole: `${reactionType}-product-right`, boundaryKind: "solvus" },
    ],
    invariants: [{
      type: "invariant-horizontal",
      startRoleId: "left-product-invariant",
      endRoleId: "right-product-invariant",
      interiorRoleIds: ["parent-invariant"],
      temperatureCelsius: invariantT,
      expectedAssemblage: [leftProduct, "gamma", rightProduct],
      reactionType,
    }],
    expectedFields: [],
  };
  if (reactionType === "metatectic") {
    metatecticEutecticT = invariantT - integer(random, 120, 180, 10);
    metatecticEutecticX = integer(random, parentX + 8, rightProductX - 6);
    metatecticAlphaX = Math.max(4, leftProductX - 6);
    const betaMeltT = integer(random, metatecticEutecticT + 50, invariantT - 40, 10);
    solution.points = solution.points.filter((item) => item.roleId !== "right-product-low");
    solution.points.push(
      { roleId: "alpha-lower-eutectic", point: point(metatecticAlphaX, metatecticEutecticT) },
      { roleId: "lower-eutectic", point: point(metatecticEutecticX, metatecticEutecticT) },
      { roleId: "beta-lower-eutectic", point: point(100, metatecticEutecticT) },
      { roleId: "beta-melt", point: point(100, betaMeltT) },
    );
    solution.curves = [
      ...solution.curves.slice(0, 6),
      { type: "curve", startRoleId: "left-product-low", endRoleId: "alpha-lower-eutectic", recommendedControl: point(metatecticAlphaX * .25, metatecticEutecticT * .5), semanticRole: "metatectic-alpha-solvus-low", boundaryKind: "solvus" },
      { type: "curve", startRoleId: "alpha-lower-eutectic", endRoleId: "left-product-invariant", recommendedControl: point((metatecticAlphaX + leftProductX) / 2, (metatecticEutecticT + invariantT) / 2), semanticRole: "metatectic-alpha-solvus-high", boundaryKind: "solvus" },
      { type: "curve", startRoleId: "right-product-invariant", endRoleId: "lower-eutectic", recommendedControl: bowedControl(point(metatecticEutecticX, metatecticEutecticT), point(rightProductX, invariantT), .72), semanticRole: "metatectic-liquidus-alpha", boundaryKind: "liquidus" },
      { type: "curve", startRoleId: "beta-melt", endRoleId: "lower-eutectic", recommendedControl: bowedControl(point(metatecticEutecticX, metatecticEutecticT), point(100, betaMeltT), .72), semanticRole: "metatectic-liquidus-beta", boundaryKind: "liquidus" },
    ];
    solution.invariants.push({
      type: "invariant-horizontal",
      startRoleId: "alpha-lower-eutectic",
      endRoleId: "beta-lower-eutectic",
      interiorRoleIds: ["lower-eutectic"],
      temperatureCelsius: metatecticEutecticT,
      expectedAssemblage: ["L", "alpha", "beta"],
      reactionType: "eutectic",
    });
  }
  solution.expectedFields = deriveExpectedFields(solution, (_label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
    if (boundaries.has("generated-curve:0") && boundaries.has("generated-curve:1")) return { role: "liquid-parent", phases: ["L", "gamma"] };
    if (boundaries.has("generated-curve:2") && boundaries.has("generated-curve:3")) return { role: "parent", phases: ["gamma"], texture: "partial-solubility" };
    if (reactionType === "metatectic") {
      if (boundaries.has("generated-curve:4") && boundaries.has("generated-curve:7")) return { role: "left-product", phases: ["alpha"], texture: "partial-solubility" };
      if (boundaries.has("generated-curve:7") && boundaries.has("generated-curve:8")) return { role: "metatectic-products", phases: ["alpha", "L"] };
      if (boundaries.has("generated-curve:5") && boundaries.has("generated-curve:8")) return { role: "reentrant-liquid", phases: ["L"] };
      if (boundaries.has("generated-curve:9") && boundaries.has("frame-right")) return { role: "liquid-beta", phases: ["L", "beta"] };
      if (boundaries.has("generated-curve:6") && boundaries.has("frame-bottom")) return { role: "alpha-beta", phases: ["alpha", "beta"] };
      if (boundaries.has("generated-curve:2") && boundaries.has("generated-curve:4")) return { role: "left-product-parent", phases: ["alpha", "gamma"] };
      if (boundaries.has("generated-curve:3") && boundaries.has("generated-curve:5")) return { role: "parent-right-product", phases: ["gamma", "L"] };
      throw new Error("Metatectic field could not be classified.");
    }
    if (boundaries.has("generated-curve:4") && boundaries.has("generated-curve:6")) return { role: "left-product", phases: [leftProduct], texture: "partial-solubility" };
    if (boundaries.has("generated-curve:5") && boundaries.has("generated-curve:7")) return { role: "right-product", phases: [rightProduct], texture: rightProduct === "L" ? undefined : "partial-solubility" };
    if (boundaries.has("generated-curve:6") && boundaries.has("generated-curve:7")) return { role: "products", phases: [leftProduct, rightProduct] };
    if (boundaries.has("generated-curve:2") && boundaries.has("generated-curve:4")) return { role: "left-product-parent", phases: [leftProduct, "gamma"] };
    if (boundaries.has("generated-curve:3") && boundaries.has("generated-curve:5")) return { role: "parent-right-product", phases: ["gamma", rightProduct] };
    throw new Error(`${reactionType} field could not be classified.`);
  }, reactionType === "metatectic" ? 10 : 8);
  const inventory: PhaseDefinition[] = [
    { id: "L", symbol: "L", name: "Liquid", kind: "liquid", required: true },
    ...(reactionType === "monotectoid" ? [{ id: "delta", symbol: "α₂", name: "Product solid solution", kind: "intermediate-solid-solution" as const, required: true, phaseFamilyId: "alpha-solution" }] : [{ id: "alpha", symbol: "α", name: "Left product solid solution", kind: "terminal-solid" as const, required: true }]),
    { id: "gamma", symbol: reactionType === "monotectoid" ? "α₁" : "γ", name: "Parent solid solution", kind: "intermediate-solid-solution", required: true, phaseFamilyId: reactionType === "monotectoid" ? "alpha-solution" : "parent-solution" },
    { id: "beta", symbol: "β", name: "Right product solid solution", kind: "terminal-solid" as const, required: true },
  ];
  const title = `${REACTION_RULES[reactionType].title} in a complete melting system · ${REACTION_RULES[reactionType].coolingEquation}`;
  return { seed, difficulty, family: reactionType, solution, puzzle: puzzleFrom(seed, difficulty, title, solution, requiredInvariantsFor(solution), inventory) };
}

function annotateRound(round: GeneratedRound): GeneratedRound {
  const adaptedIdentity = adaptPhaseIdentities(round.puzzle, round.solution);
  round = { ...round, puzzle: adaptedIdentity.puzzle, solution: adaptedIdentity.solution };
  const invariantTypes = [...new Set(round.solution.invariants.map((item) => item.reactionType))];
  const topologyAssembly = invariantTypes.length === 0
    ? undefined
    : assemblePhaseTopology({
      invariantTargets: invariantTypes.map((type) => ({ type, weight: 1, minCount: 1, maxCount: 1 })),
      required: { invariantCount: { min: invariantTypes.length, max: invariantTypes.length } },
    }, round.seed);
  if (topologyAssembly && !topologyAssembly.accepted) {
    const detail = topologyAssembly.rejections.map((item) => `${item.code}: ${item.message}`).join("\n");
    throw new Error(`${round.solution.puzzleId} failed topology assembly:\n${detail}`);
  }
  assertPhaseEquilibria(round.puzzle, round.solution);
  const thermodynamicAudit = auditRoundThermodynamicRealizability(round.puzzle, round.solution);
  if (!thermodynamicAudit.valid) {
    const detail = thermodynamicAudit.violations.map((item) => `${item.ruleId}: ${item.message}`).join("\n");
    throw new Error(`${round.solution.puzzleId} failed local Gibbs realizability:\n${detail}`);
  }
  const { points, geometry } = generatedGeometry(round.solution);
  const cells = extractFaces(points, geometry);
  const minimumArea = Math.min(...cells.map((cell) => Math.abs(polygonArea(cell.polygon))));
  if (!Number.isFinite(minimumArea) || minimumArea < 35) throw new Error(`${round.solution.puzzleId} failed the minimum-field-area layout check.`);
  const topCells = cells.filter((cell) => cell.boundary.some((edge) => edge.geometryId === "frame-top"));
  if (topCells.length !== 1) throw new Error(`${round.solution.puzzleId} must have one connected field along the complete high-temperature edge.`);
  const topField = round.solution.expectedFields.find((field) => sameLogicalPoint(field.witnessPoint, topCells[0].labelPoint));
  const topPhase = topField?.expectedAssemblage.length === 1
    ? round.puzzle.phases.find((phase) => phase.id === topField.expectedAssemblage[0])
    : undefined;
  if (topPhase?.kind !== "liquid") {
    const assemblage = topField?.expectedAssemblage.join(" + ") ?? "unmapped";
    throw new Error(`${round.solution.puzzleId} must begin with one homogeneous liquid field at the top edge; found ${assemblage}.`);
  }
  const intermediatePhaseCount = round.puzzle.intermediateCompositions.length
    + round.puzzle.phases.filter((phase) => phase.kind === "intermediate-solid-solution").length;
  const invariantCriticalRoles = new Set(round.solution.invariants.flatMap((item) => item.interiorRoleIds));
  const nonInvariantCriticalRoles = round.solution.points.filter((item) =>
    !invariantCriticalRoles.has(item.roleId)
    && (item.roleId === "critical" || item.roleId === "dome-peak" || item.roleId === "order-critical"),
  );
  const reactionTypes = new Set<string>(round.solution.invariants.map((item) => item.reactionType));
  if (["liquid-spinodal", "subsolidus-polymorph", "superlattice"].includes(round.family)) reactionTypes.add(round.family);
  return {
    ...round,
    reactionTypes: [...reactionTypes],
    intermediatePhaseCount,
    criticalPointCount: invariantCriticalRoles.size + nonInvariantCriticalRoles.length,
    layoutQualityScore: Math.min(100, Math.round(minimumArea / 4)),
    thermodynamicCertificate: {
      scope: thermodynamicAudit.scope,
      certifiedInvariantCount: thermodynamicAudit.certifiedInvariants.length,
    },
    topologyCertificate: topologyAssembly?.accepted ? {
      schemaVersion: topologyAssembly.graph.schemaVersion,
      certifiedInvariantTypes: invariantTypes,
      certifiedInvariantCount: round.solution.invariants.length,
      scope: "generated-diagram",
    } : undefined,
  };
}

type FamilyGenerator = (seed: number) => GeneratedRound;

export interface FamilyGenerationRule {
  id: string;
  weight: number;
  generate: FamilyGenerator;
  requiredInvariantTypes: ReactionType[];
  requiredInvariantCounts?: Partial<Record<ReactionType, number>>;
  requiredFeatures: GenerationFeature[];
}

/** Weighted accepted-output rules. Weights are integer percentage shares within each difficulty. */
export const FAMILY_RULES: Record<Difficulty, readonly FamilyGenerationRule[]> = {
  easy: [
    { id: "compound-double-eutectic", weight: 1, generate: (seed) => generateCompound(seed, "easy"), requiredInvariantTypes: ["eutectic"], requiredInvariantCounts: { eutectic: 2 }, requiredFeatures: ["compound"] },
    { id: "peritectic", weight: 1, generate: (seed) => generateIncongruentCompound(seed, "easy"), requiredInvariantTypes: ["eutectic", "peritectic"], requiredFeatures: ["compound"] },
    { id: "limited-eutectic", weight: 1, generate: (seed) => generateLimited(seed, "easy"), requiredInvariantTypes: ["eutectic"], requiredFeatures: ["partial-solubility"] },
    { id: "simple-eutectic", weight: 1, generate: generateSimple, requiredInvariantTypes: ["eutectic"], requiredFeatures: [] },
    { id: "peritectoid", weight: 1, generate: (seed) => generatePeritectoidSystem(seed, "easy"), requiredInvariantTypes: ["eutectic", "peritectoid"], requiredFeatures: ["intermediate-phase"] },
    { id: "subsolidus-polymorph", weight: 1, generate: (seed) => generateSubsolidusPolymorph(seed, "easy"), requiredInvariantTypes: [], requiredFeatures: ["polymorphism"] },
    { id: "eutectoid", weight: 1, generate: (seed) => generateSolidDecompositionSystem(seed, "easy", "eutectoid"), requiredInvariantTypes: ["eutectoid"], requiredFeatures: ["partial-solubility"] },
  ],
  normal: [
    { id: "compound-double-eutectic", weight: 1, generate: (seed) => generateCompound(seed, "normal"), requiredInvariantTypes: ["eutectic"], requiredInvariantCounts: { eutectic: 2 }, requiredFeatures: ["compound"] },
    { id: "peritectic", weight: 1, generate: (seed) => generateIncongruentCompound(seed, "normal"), requiredInvariantTypes: ["eutectic", "peritectic"], requiredFeatures: ["compound"] },
    { id: "limited-eutectic", weight: 1, generate: (seed) => generateLimited(seed, "normal"), requiredInvariantTypes: ["eutectic"], requiredFeatures: ["partial-solubility"] },
    { id: "peritectoid", weight: 1, generate: (seed) => generatePeritectoidSystem(seed, "normal"), requiredInvariantTypes: ["eutectic", "peritectoid"], requiredFeatures: ["intermediate-phase"] },
    { id: "subsolidus-polymorph", weight: 1, generate: (seed) => generateSubsolidusPolymorph(seed, "normal"), requiredInvariantTypes: [], requiredFeatures: ["polymorphism"] },
    { id: "coupled-eutectic-peritectic", weight: 1, generate: (seed) => generateCoupledEutecticPeritectic(seed, "normal"), requiredInvariantTypes: ["eutectic", "peritectic"], requiredFeatures: ["partial-solubility", "intermediate-phase"] },
    { id: "superlattice", weight: 1, generate: (seed) => generateSuperlatticeSolution(seed, "normal"), requiredInvariantTypes: [], requiredFeatures: ["ordering"] },
    { id: "eutectoid", weight: 1, generate: (seed) => generateSolidDecompositionSystem(seed, "normal", "eutectoid"), requiredInvariantTypes: ["eutectoid"], requiredFeatures: ["partial-solubility"] },
    { id: "monotectoid", weight: 1, generate: (seed) => generateSolidDecompositionSystem(seed, "normal", "monotectoid"), requiredInvariantTypes: ["monotectoid"], requiredFeatures: ["partial-solubility"] },
    { id: "metatectic", weight: 1, generate: (seed) => generateSolidDecompositionSystem(seed, "normal", "metatectic"), requiredInvariantTypes: ["eutectic", "metatectic"], requiredFeatures: ["partial-solubility"] },
  ],
  hard: [
    { id: "triple-eutectic", weight: 1, generate: generateTripleEutectic, requiredInvariantTypes: ["eutectic"], requiredInvariantCounts: { eutectic: 3 }, requiredFeatures: ["compound"] },
    { id: "syntectic", weight: 1, generate: (seed) => generateImmiscibleHard(seed, "syntectic"), requiredInvariantTypes: ["syntectic", "eutectic"], requiredInvariantCounts: { syntectic: 1, eutectic: 2 }, requiredFeatures: ["liquid-immiscibility", "intermediate-phase"] },
    { id: "monotectic", weight: 1, generate: (seed) => generateMonotectic(seed, "hard"), requiredInvariantTypes: ["monotectic", "eutectic"], requiredFeatures: ["liquid-immiscibility"] },
    { id: "liquid-spinodal", weight: 1, generate: (seed) => generateImmiscibleHard(seed, "liquid-spinodal"), requiredInvariantTypes: ["syntectic", "eutectic"], requiredInvariantCounts: { syntectic: 1, eutectic: 2 }, requiredFeatures: ["liquid-immiscibility", "spinodal", "intermediate-phase"] },
    { id: "compound-double-eutectic", weight: 1, generate: (seed) => generateCompound(seed, "hard"), requiredInvariantTypes: ["eutectic"], requiredInvariantCounts: { eutectic: 2 }, requiredFeatures: ["compound"] },
    { id: "peritectic", weight: 1, generate: (seed) => generateIncongruentCompound(seed, "hard"), requiredInvariantTypes: ["eutectic", "peritectic"], requiredFeatures: ["compound"] },
    { id: "limited-eutectic", weight: 1, generate: (seed) => generateLimited(seed, "hard"), requiredInvariantTypes: ["eutectic"], requiredFeatures: ["partial-solubility"] },
    { id: "peritectoid", weight: 1, generate: (seed) => generatePeritectoidSystem(seed, "hard"), requiredInvariantTypes: ["eutectic", "peritectoid"], requiredFeatures: ["intermediate-phase"] },
    { id: "subsolidus-polymorph", weight: 1, generate: (seed) => generateSubsolidusPolymorph(seed, "hard"), requiredInvariantTypes: [], requiredFeatures: ["polymorphism"] },
    { id: "coupled-eutectic-peritectic", weight: 1, generate: (seed) => generateCoupledEutecticPeritectic(seed, "hard"), requiredInvariantTypes: ["eutectic", "peritectic"], requiredFeatures: ["partial-solubility", "intermediate-phase"] },
    { id: "superlattice", weight: 1, generate: (seed) => generateSuperlatticeSolution(seed, "hard"), requiredInvariantTypes: [], requiredFeatures: ["ordering"] },
    { id: "simple-eutectic", weight: 1, generate: (seed) => generateSimple(seed, "hard"), requiredInvariantTypes: ["eutectic"], requiredFeatures: [] },
    { id: "eutectoid", weight: 1, generate: (seed) => generateSolidDecompositionSystem(seed, "hard", "eutectoid"), requiredInvariantTypes: ["eutectoid"], requiredFeatures: ["partial-solubility"] },
    { id: "monotectoid", weight: 1, generate: (seed) => generateSolidDecompositionSystem(seed, "hard", "monotectoid"), requiredInvariantTypes: ["monotectoid"], requiredFeatures: ["partial-solubility"] },
    { id: "metatectic", weight: 1, generate: (seed) => generateSolidDecompositionSystem(seed, "hard", "metatectic"), requiredInvariantTypes: ["eutectic", "metatectic"], requiredFeatures: ["partial-solubility"] },
  ],
};

/** Compatibility view for tests and direct family sampling. */
export const FAMILY_POOLS: Record<Difficulty, readonly FamilyGenerator[]> = {
  easy: FAMILY_RULES.easy.map((rule) => rule.generate),
  normal: FAMILY_RULES.normal.map((rule) => rule.generate),
  hard: FAMILY_RULES.hard.map((rule) => rule.generate),
};

function weightedRule(seed: number, difficulty: Difficulty): { rule: FamilyGenerationRule; targetPercent: number } {
  const rules = FAMILY_RULES[difficulty];
  const total = rules.reduce((sum, rule) => {
    if (!Number.isInteger(rule.weight) || rule.weight <= 0) throw new Error(`Generation weight for ${rule.id} must be a positive integer.`);
    return sum + rule.weight;
  }, 0);
  let slot = seed % total;
  for (const rule of rules) {
    if (slot < rule.weight) return { rule, targetPercent: (rule.weight / total) * 100 };
    slot -= rule.weight;
  }
  throw new Error("Weighted generation registry is empty.");
}

function roundHasFeature(round: GeneratedRound, feature: GenerationFeature): boolean {
  switch (feature) {
    case "compound": return round.puzzle.phases.some((phase) => phase.kind === "line-compound");
    case "partial-solubility": return round.solution.expectedFields.some((field) => field.texture === "partial-solubility");
    case "polymorphism": return round.puzzle.phases.some((phase) => phase.temperatureRole)
      || round.solution.curves.some((curve) => curve.boundaryKind === "polymorph-boundary");
    case "ordering": return round.solution.curves.some((curve) => curve.boundaryKind === "ordering-boundary");
    case "liquid-immiscibility": return round.solution.curves.some((curve) => curve.boundaryKind === "miscibility-gap");
    case "spinodal": return round.solution.curves.some((curve) => curve.boundaryKind === "stability-guide");
    case "intermediate-phase": return round.puzzle.phases.some((phase) => phase.kind === "line-compound"
      || phase.kind === "intermediate-solid-solution"
      || phase.compositionRole === "intermediate");
  }
}

export function generateRound(rawSeed: number, difficulty: Difficulty = "normal"): GeneratedRound {
  const seed = rawSeed >>> 0;
  const { rule, targetPercent } = weightedRule(seed, difficulty);
  const round = annotateRound(rule.generate(seed));
  const actualInvariantTypes = new Set(round.solution.invariants.map((item) => item.reactionType));
  const requiredInvariantTypes = new Set(rule.requiredInvariantTypes);
  if (actualInvariantTypes.size !== requiredInvariantTypes.size
    || [...actualInvariantTypes].some((type) => !requiredInvariantTypes.has(type))) {
    throw new Error(`${round.solution.puzzleId} does not realize generation rule ${rule.id}'s invariant contract.`);
  }
  const requiredInvariantCounts = Object.fromEntries(rule.requiredInvariantTypes.map((type) => [
    type,
    rule.requiredInvariantCounts?.[type] ?? 1,
  ])) as Partial<Record<ReactionType, number>>;
  const actualInvariantCounts = round.solution.invariants.reduce<Partial<Record<ReactionType, number>>>((counts, invariant) => ({
    ...counts,
    [invariant.reactionType]: (counts[invariant.reactionType] ?? 0) + 1,
  }), {});
  if (rule.requiredInvariantTypes.some((type) => actualInvariantCounts[type] !== requiredInvariantCounts[type])) {
    throw new Error(`${round.solution.puzzleId} does not realize generation rule ${rule.id}'s invariant occurrence contract.`);
  }
  const missingFeature = rule.requiredFeatures.find((feature) => !roundHasFeature(round, feature));
  if (missingFeature) throw new Error(`${round.solution.puzzleId} does not realize required feature ${missingFeature}.`);
  return {
    ...round,
    generationContract: {
      ruleId: rule.id,
      weight: rule.weight,
      targetPercent,
      requiredInvariantTypes: [...rule.requiredInvariantTypes],
      requiredInvariantCounts,
      requiredFeatures: [...rule.requiredFeatures],
    },
  };
}

export function generateEutecticRound(rawSeed: number): GeneratedRound {
  return annotateRound(generateLimited(rawSeed >>> 0));
}

export function createPuzzleSeed(): number {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) return crypto.getRandomValues(new Uint32Array(1))[0];
  return Math.floor(Math.random() * 0x100000000) >>> 0;
}
