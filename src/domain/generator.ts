import { extractFaces } from "../canvas/face-extraction";
import { pointInPolygon, polygonArea, sameLogicalPoint } from "./geometry";
import { assertPhaseEquilibria, auditPhaseEquilibria } from "./phase-equilibria-validator";
import type {
  ExpectedFieldSpec,
  HiddenSolution,
  LogicalPoint,
  PhaseDefinition,
  PlayerGeometry,
  PlayerPoint,
  PuzzleDefinition,
  RequiredInvariantSpec,
  SolutionCurve,
} from "./schema";

export type Difficulty = "easy" | "normal" | "hard";

export type DiagramFamily =
  | "simple-eutectic"
  | "limited-eutectic"
  | "compound-double-eutectic"
  | "monotectic"
  | "liquid-spinodal"
  | "solid-spinodal"
  | "solid-miscibility-gap"
  | "complete-solid-solution"
  | "maximum-melting"
  | "minimum-melting"
  | "secondary-solid-solution"
  | "degenerate-eutectic"
  | "peritectic"
  | "peritectoid"
  | "syntectic"
  | "subsolidus-polymorph"
  | "supersolidus-polymorph"
  | "superlattice"
  | "triple-eutectic"
  | "large-multi-invariant"
  | "large-catatectic"
  | "rule-composed"
  | "liquid-immiscibility";

export interface GeneratedRound {
  seed: number;
  difficulty: Difficulty;
  family: DiagramFamily;
  puzzle: PuzzleDefinition;
  solution: HiddenSolution;
  reactionTypes?: string[];
  featuredFeature?: ComposableBinaryFeature;
  featureCounts?: BinaryFeatureCounts;
  intermediatePhaseCount?: number;
  criticalPointCount?: number;
  layoutQualityScore?: number;
}

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
  expectedCount?: number,
): ExpectedFieldSpec[] {
  const { points, geometry } = generatedGeometry(solution);
  const fields = extractFaces(points, geometry).map((cell) => {
    const match = classify(cell.labelPoint, new Set(cell.boundary.map((item) => item.geometryId)));
    return { role: match.role, expectedAssemblage: match.phases, witnessPoint: cell.labelPoint, texture: match.texture };
  });
  if (expectedCount !== undefined && fields.length !== expectedCount) throw new Error(`${solution.puzzleId} produced ${fields.length} fields; expected ${expectedCount}.`);
  return fields;
}

const phases = (compound = false): PhaseDefinition[] => [
  { id: "L", symbol: "L", name: "Liquid", kind: "liquid", required: true },
  { id: "alpha", symbol: "α", name: "Alpha", kind: "terminal-solid", required: true },
  ...(compound ? [{ id: "gamma", symbol: "γ", name: "Intermediate compound", kind: "line-compound" as const, required: true, compositionGroupId: "gamma" }] : []),
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
  inventory.filter((phase) => phase.kind === "line-compound" || phase.kind === "intermediate-solid-solution").forEach((phase) => {
    const groupId = phase.compositionGroupId ?? phase.id;
    groupedPhases.set(groupId, [...(groupedPhases.get(groupId) ?? []), phase]);
  });
  const groups = [...groupedPhases].map(([id, groupPhases]) => {
    const candidates = solution.points
      .filter((item) => item.roleId === id || item.roleId.startsWith(`${id}-`))
      .map((item) => item.point.compositionBPercent);
    if (candidates.length === 0) throw new Error(`${solution.puzzleId} has no composition anchor for intermediate group ${id}.`);
    const counts = new Map<number, number>();
    candidates.forEach((composition) => counts.set(composition, (counts.get(composition) ?? 0) + 1));
    const compositionBPercent = [...counts].sort((a, b) => b[1] - a[1])[0][0];
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
      compositionGroupId: composition.id,
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
  const compound = solution.points.some((item) => item.roleId === "gamma" || item.roleId.startsWith("gamma-"));
  const ruledInventory = intermediateRules(seed, solution, phaseInventory ?? phases(compound), endMemberLabels);
  return {
    schemaVersion: "tie-line-labels-2",
    id: solution.puzzleId,
    title: familyLabel,
    compositionMinPercentB: 0,
    compositionMaxPercentB: 100,
    temperatureMinCelsius: 0,
    temperatureMaxCelsius: 1100,
    endMemberLabels,
    intermediateCompositions: ruledInventory.intermediateCompositions,
    phases: ruledInventory.phases,
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
      ...(solution.expectedFields.length >= 16 ? [{ id: "instruction-zoom", compactText: "Pinch or wheel to inspect narrow fields" }] : []),
    ],
    permittedTools: ["label", "erase"],
    requiredCurves: solution.curves.map((curve) => ({
      startRoleId: curve.startRoleId,
      endRoleId: curve.endRoleId,
      semanticRole: curve.semanticRole ?? "phase-boundary",
    })),
    requiredInvariants,
    expectedFieldCount: solution.expectedFields.length,
    expectedFields: solution.expectedFields,
    allowExtraGeometryOnSubmit: false,
  };
}

function generateSimple(seed: number, degenerate = false): GeneratedRound {
  const random = randomForSeed(seed);
  const ex = degenerate
    ? (((seed >>> 5) & 1) === 0 ? integer(random, 3, 8) : integer(random, 92, 97))
    : integer(random, 34, 66);
  const et = integer(random, 470, 640, 10);
  const leftMelt = integer(random, et + 250, 1050, 10);
  const rightMelt = integer(random, et + 220, 1030, 10);
  const solution: HiddenSolution = {
    puzzleId: `${degenerate ? "degenerate" : "simple"}-eutectic-v3-${seed}`,
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
  const requiredInvariants: RequiredInvariantSpec[] = [{ startRoleId: "left-eut", endRoleId: "right-eut", interiorRoleIds: ["eutectic"], expectedAssemblage: ["L", "alpha", "beta"], reactionType: "eutectic" }];
  const family: DiagramFamily = degenerate ? "degenerate-eutectic" : "simple-eutectic";
  return { seed, difficulty: "easy", family, solution, puzzle: puzzleFrom(seed, "easy", degenerate ? "Degenerate eutectic" : "Simple eutectic", solution, requiredInvariants) };
}

function generateLimited(seed: number, difficulty: Difficulty = "normal"): GeneratedRound {
  const random = randomForSeed(seed);
  const ex = integer(random, 34, 66);
  const et = integer(random, 480, 650, 10);
  const ax = difficulty === "hard"
    ? integer(random, 16, Math.min(25, ex - 12))
    : integer(random, 7, Math.min(22, ex - 18));
  const bx = difficulty === "hard"
    ? integer(random, Math.max(75, ex + 12), 84)
    : integer(random, Math.max(78, ex + 18), 93);
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
  const requiredInvariants: RequiredInvariantSpec[] = [{ startRoleId: "alpha-eut", endRoleId: "beta-eut", interiorRoleIds: ["eutectic"], expectedAssemblage: ["L", "alpha", "beta"], reactionType: "eutectic" }];
  return { seed, difficulty, family: "limited-eutectic", solution, puzzle: puzzleFrom(seed, difficulty, "Limited-solubility eutectic", solution, requiredInvariants) };
}

function generateCompleteSolidSolution(
  seed: number,
  difficulty: Difficulty,
  variant: "complete-solid-solution" | "maximum-melting" | "minimum-melting",
): GeneratedRound {
  const random = randomForSeed(seed ^ 0x501d501d);
  const leftMelt = integer(random, 860, 980, 10);
  const rightMelt = integer(random, 850, 970, 10);
  const solution: HiddenSolution = { puzzleId: `${difficulty}-${variant}-v1-${seed}`, points: [], curves: [], invariants: [], expectedFields: [] };

  if (variant === "complete-solid-solution") {
    solution.points.push(
      { roleId: "a-melt", point: point(0, leftMelt) },
      { roleId: "b-melt", point: point(100, rightMelt) },
    );
    solution.curves.push(
      { type: "curve", startRoleId: "a-melt", endRoleId: "b-melt", recommendedControl: point(50, Math.max(leftMelt, rightMelt) + 90), semanticRole: "complete-solution-liquidus" },
      { type: "curve", startRoleId: "a-melt", endRoleId: "b-melt", recommendedControl: point(50, Math.min(leftMelt, rightMelt) - 190), semanticRole: "complete-solution-solidus" },
    );
  } else {
    const extremumX = integer(random, 38, 62);
    const extremumT = variant === "maximum-melting"
      ? Math.min(1090, Math.max(leftMelt, rightMelt) + integer(random, 90, 160, 10))
      : Math.min(leftMelt, rightMelt) - integer(random, 170, 250, 10);
    solution.points.push(
      { roleId: "a-melt", point: point(0, leftMelt) },
      { roleId: "melting-extremum", point: point(extremumX, extremumT) },
      { roleId: "b-melt", point: point(100, rightMelt) },
    );
    const leftMidX = extremumX / 2;
    const rightMidX = (extremumX + 100) / 2;
    const leftMidT = (leftMelt + extremumT) / 2;
    const rightMidT = (rightMelt + extremumT) / 2;
    solution.curves.push(
      { type: "curve", startRoleId: "a-melt", endRoleId: "melting-extremum", recommendedControl: point(leftMidX, leftMidT + 55), semanticRole: `${variant}-liquidus-left` },
      { type: "curve", startRoleId: "melting-extremum", endRoleId: "b-melt", recommendedControl: point(rightMidX, rightMidT + 55), semanticRole: `${variant}-liquidus-right` },
      { type: "curve", startRoleId: "a-melt", endRoleId: "melting-extremum", recommendedControl: point(leftMidX, leftMidT - 55), semanticRole: `${variant}-solidus-left` },
      { type: "curve", startRoleId: "melting-extremum", endRoleId: "b-melt", recommendedControl: point(rightMidX, rightMidT - 55), semanticRole: `${variant}-solidus-right` },
    );
  }

  solution.expectedFields = deriveExpectedFields(solution, (_label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
    const inTwoPhaseLens = variant === "complete-solid-solution"
      ? boundaries.has("generated-curve:0") && boundaries.has("generated-curve:1")
      : (boundaries.has("generated-curve:0") && boundaries.has("generated-curve:2"))
        || (boundaries.has("generated-curve:1") && boundaries.has("generated-curve:3"));
    return inTwoPhaseLens
      ? { role: "liquid-solid-solution", phases: ["L", "alpha"] }
      : { role: "solid-solution", phases: ["alpha"], texture: "partial-solubility" };
  }, variant === "complete-solid-solution" ? 3 : 4);
  const inventory: PhaseDefinition[] = [
    { id: "L", symbol: "L", name: "Liquid", kind: "liquid", required: true },
    { id: "alpha", symbol: "α", name: "Complete solid solution", kind: "terminal-solid", required: true },
  ];
  const title = variant === "complete-solid-solution" ? "Complete solid solution"
    : variant === "maximum-melting" ? "Maximum-melting solid solution" : "Minimum-melting solid solution";
  return { seed, difficulty, family: variant, solution, puzzle: puzzleFrom(seed, difficulty, title, solution, [], inventory) };
}

function generateSolidMiscibilityGap(seed: number, difficulty: Difficulty, includeSpinodal: boolean): GeneratedRound {
  const random = randomForSeed(seed ^ 0x5011d6a9);
  const leftMelt = integer(random, 900, 1020, 10);
  const rightMelt = integer(random, 880, 1000, 10);
  const leftX = integer(random, 16, 25);
  const rightX = integer(random, 75, 84);
  const criticalX = integer(random, 43, 57);
  const criticalT = integer(random, 330, 470, 10);
  const solution: HiddenSolution = {
    puzzleId: `${difficulty}-solid-${includeSpinodal ? "spinodal" : "miscibility-gap"}-v1-${seed}`,
    points: [
      { roleId: "a-melt", point: point(0, leftMelt) },
      { roleId: "b-melt", point: point(100, rightMelt) },
      { roleId: "solid-solvus-left", point: point(leftX, 0) },
      { roleId: "solid-consolute", point: point(criticalX, criticalT) },
      { roleId: "solid-solvus-right", point: point(rightX, 0) },
    ],
    curves: [
      { type: "curve", startRoleId: "a-melt", endRoleId: "b-melt", recommendedControl: point(50, Math.max(leftMelt, rightMelt) + 80), semanticRole: "complete-solution-liquidus" },
      { type: "curve", startRoleId: "a-melt", endRoleId: "b-melt", recommendedControl: point(50, Math.min(leftMelt, rightMelt) - 180), semanticRole: "complete-solution-solidus" },
      { type: "curve", startRoleId: "solid-solvus-left", endRoleId: "solid-consolute", recommendedControl: bowedControl(point(leftX, 0), point(criticalX, criticalT), 1, .32), semanticRole: "solid-miscibility-left" },
      { type: "curve", startRoleId: "solid-consolute", endRoleId: "solid-solvus-right", recommendedControl: bowedControl(point(rightX, 0), point(criticalX, criticalT), 1, .32), semanticRole: "solid-miscibility-right" },
    ],
    invariants: [],
    expectedFields: [],
  };
  if (includeSpinodal) {
    const innerLeftX = leftX + (criticalX - leftX) * .46;
    const innerRightX = rightX - (rightX - criticalX) * .46;
    solution.points.push(
      { roleId: "solid-spinodal-left", point: point(innerLeftX, 0) },
      { roleId: "solid-spinodal-right", point: point(innerRightX, 0) },
    );
    solution.curves.push(
      { type: "curve", startRoleId: "solid-spinodal-left", endRoleId: "solid-consolute", recommendedControl: bowedControl(point(innerLeftX, 0), point(criticalX, criticalT), 1, .32), semanticRole: "solid-spinodal-left", fieldBoundary: false },
      { type: "curve", startRoleId: "solid-consolute", endRoleId: "solid-spinodal-right", recommendedControl: bowedControl(point(innerRightX, 0), point(criticalX, criticalT), 1, .32), semanticRole: "solid-spinodal-right", fieldBoundary: false },
    );
  }
  solution.expectedFields = deriveExpectedFields(solution, (label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
    if (boundaries.has("generated-curve:0") && boundaries.has("generated-curve:1")) return { role: "liquid-solid", phases: ["L", "alpha"] };
    const sideWidth = label.compositionBPercent <= criticalX ? criticalX - leftX : rightX - criticalX;
    const normalizedX = sideWidth > 0 ? Math.abs(label.compositionBPercent - criticalX) / sideWidth : 2;
    const belowSolvus = label.compositionBPercent > leftX && label.compositionBPercent < rightX
      && label.temperatureCelsius < criticalT * (1 - normalizedX * normalizedX);
    if (belowSolvus) return { role: "solid-miscibility-gap", phases: ["alpha", "beta"], texture: "partial-solubility" };
    return { role: "homogeneous-solid-solution", phases: ["alpha"], texture: "partial-solubility" };
  }, 4);
  const inventory: PhaseDefinition[] = [
    { id: "L", symbol: "L", name: "Liquid", kind: "liquid", required: true },
    { id: "alpha", symbol: "α₁", name: "Alpha-rich solid-solution composition", kind: "terminal-solid", required: true },
    { id: "beta", symbol: "α₂", name: "Beta-rich solid-solution composition", kind: "terminal-solid", required: true },
  ];
  const family: DiagramFamily = includeSpinodal ? "solid-spinodal" : "solid-miscibility-gap";
  return { seed, difficulty, family, solution, puzzle: puzzleFrom(seed, difficulty, includeSpinodal ? "Solid spinodal inside a miscibility gap" : "Solid miscibility gap", solution, [], inventory) };
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
      { type: "curve", startRoleId: "gamma-low", endRoleId: "gamma-e1", recommendedControl: point(gx, e1t * .5), semanticRole: "compound-line-low" },
      { type: "curve", startRoleId: "gamma-e1", endRoleId: "gamma-e2", recommendedControl: point(gx, (e1t + e2t) / 2), semanticRole: "compound-line-mid" },
      { type: "curve", startRoleId: "gamma-e2", endRoleId: "gamma-peak", recommendedControl: point(gx, (e2t + peak) / 2), semanticRole: "compound-line-high" },
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
      { type: "curve", startRoleId: "gamma-low", endRoleId: "gamma-eut", recommendedControl: point(gx, eutecticT * .5), semanticRole: "compound-line-low" },
      { type: "curve", startRoleId: "gamma-eut", endRoleId: "gamma-peritectic", recommendedControl: point(gx, (eutecticT + peritecticT) / 2), semanticRole: "compound-line-high" },
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
      { type: "curve", startRoleId: "gamma-low", endRoleId: "gamma-e1", recommendedControl: point(g1x, e1t / 2), semanticRole: "gamma-line-low" },
      { type: "curve", startRoleId: "gamma-e1", endRoleId: "gamma-e2", recommendedControl: point(g1x, (e1t + e2t) / 2), semanticRole: "gamma-line-mid" },
      { type: "curve", startRoleId: "gamma-e2", endRoleId: "gamma-peak", recommendedControl: point(g1x, (e2t + g1Peak) / 2), semanticRole: "gamma-line-high" },
      { type: "curve", startRoleId: "delta-low", endRoleId: "delta-e2", recommendedControl: point(g2x, e2t / 2), semanticRole: "delta-line-low" },
      { type: "curve", startRoleId: "delta-e2", endRoleId: "delta-e3", recommendedControl: point(g2x, (e2t + e3t) / 2), semanticRole: "delta-line-mid" },
      { type: "curve", startRoleId: "delta-e3", endRoleId: "delta-peak", recommendedControl: point(g2x, (e3t + g2Peak) / 2), semanticRole: "delta-line-high" },
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
    { id: "gamma", symbol: "γ", name: "First intermediate", kind: "line-compound", required: true, compositionGroupId: "gamma" },
    { id: "delta", symbol: "δ", name: "Second intermediate", kind: "line-compound", required: true, compositionGroupId: "delta" },
    { id: "beta", symbol: "β", name: "Beta", kind: "terminal-solid", required: true },
  ];
  const requiredInvariants = solution.invariants.map((item) => ({ startRoleId: item.startRoleId, endRoleId: item.endRoleId, interiorRoleIds: item.interiorRoleIds, expectedAssemblage: item.expectedAssemblage, reactionType: item.reactionType }));
  return { seed, difficulty: "hard", family: "triple-eutectic", solution, puzzle: puzzleFrom(seed, "hard", "Two intermediate compounds with three eutectics", solution, requiredInvariants, inventory) };
}

export const BINARY_PUZZLE_FEATURES = [
  "eutectic-point", "eutectoid-point", "monotectic-point", "monotectoid-point",
  "catatectic-point", "liquid-spinodal", "solid-spinodal", "consolute-point",
  "peritectic-point", "peritectoid-point", "syntectic-point",
  "subsolidus-polymorphism", "supersolidus-polymorphism", "superlattice",
  "congruent-melting", "degenerate-eutectic",
  "simple-eutectic", "congruent-compound", "incongruent-compound",
  "compound-stability", "complete-solid-solution", "maximum-melting",
  "minimum-melting", "solid-miscibility-gap", "partial-miscibility",
  "secondary-solution", "liquid-immiscibility", "metastable-immiscibility",
] as const;

export type BinaryPuzzleFeature = typeof BINARY_PUZZLE_FEATURES[number];
export type BinaryFeatureCounts = Record<BinaryPuzzleFeature, number>;

function generateLargeMultiInvariant(seed: number): GeneratedRound {
  const random = randomForSeed(seed ^ 0x51a9e3);
  const compoundIds = ["gamma", "delta", "epsilon", "zeta"] as const;
  const phaseIds = ["alpha", ...compoundIds, "beta"];
  const compositions = [0, 18, 38, 60, 80, 100];
  const invariantTemperatures = [
    integer(random, 330, 390, 10),
    integer(random, 430, 480, 10),
    integer(random, 350, 400, 10),
    integer(random, 460, 510, 10),
    integer(random, 370, 430, 10),
  ];
  const peakTemperatures = [
    integer(random, 900, 1010, 10),
    integer(random, 940, 1060, 10),
    integer(random, 910, 1030, 10),
    integer(random, 950, 1070, 10),
    integer(random, 920, 1040, 10),
    integer(random, 900, 1020, 10),
  ];
  const peakRoles = ["a-melt", "gamma-peak", "delta-peak", "epsilon-peak", "zeta-peak", "b-melt"];
  const eutecticCompositions = compositions.slice(0, -1).map((left, index) => integer(random, left + 6, compositions[index + 1] - 6));
  const points: HiddenSolution["points"] = [];
  const curves: HiddenSolution["curves"] = [];
  const invariants: HiddenSolution["invariants"] = [];

  peakRoles.forEach((roleId, index) => points.push({ roleId, point: point(compositions[index], peakTemperatures[index]) }));

  for (let interval = 0; interval < phaseIds.length - 1; interval += 1) {
    const leftPhase = phaseIds[interval];
    const rightPhase = phaseIds[interval + 1];
    const temperature = invariantTemperatures[interval];
    const eutecticRole = `e${interval + 1}`;
    const leftRole = `${leftPhase}-e${interval + 1}`;
    const rightRole = `${rightPhase}-e${interval + 1}`;
    const eutecticPoint = point(eutecticCompositions[interval], temperature);
    const leftPeak = point(compositions[interval], peakTemperatures[interval]);
    const rightPeak = point(compositions[interval + 1], peakTemperatures[interval + 1]);
    points.push(
      { roleId: leftRole, point: point(compositions[interval], temperature) },
      { roleId: eutecticRole, point: eutecticPoint },
      { roleId: rightRole, point: point(compositions[interval + 1], temperature) },
    );
    curves.push(
      { type: "curve", startRoleId: peakRoles[interval], endRoleId: eutecticRole, recommendedControl: bowedControl(eutecticPoint, leftPeak, interval === 0 ? .78 : 1), semanticRole: `liquidus-${leftPhase}-right` },
      { type: "curve", startRoleId: peakRoles[interval + 1], endRoleId: eutecticRole, recommendedControl: bowedControl(eutecticPoint, rightPeak, interval + 1 === phaseIds.length - 1 ? .78 : 1), semanticRole: `liquidus-${rightPhase}-left` },
    );
    invariants.push({
      type: "invariant-horizontal",
      startRoleId: leftRole,
      endRoleId: rightRole,
      interiorRoleIds: [eutecticRole],
      temperatureCelsius: temperature,
      expectedAssemblage: ["L", leftPhase, rightPhase],
      reactionType: "eutectic",
    });
  }

  compoundIds.forEach((phaseId, compoundIndex) => {
    const compositionIndex = compoundIndex + 1;
    const anchors = points
      .filter((item) => item.roleId.startsWith(`${phaseId}-e`))
      .sort((a, b) => a.point.temperatureCelsius - b.point.temperatureCelsius);
    const lowRole = `${phaseId}-low`;
    points.push({ roleId: lowRole, point: point(compositions[compositionIndex], 0) });
    const orderedRoles = [lowRole, ...anchors.map((item) => item.roleId), `${phaseId}-peak`];
    for (let index = 0; index < orderedRoles.length - 1; index += 1) {
      const start = points.find((item) => item.roleId === orderedRoles[index])!.point;
      const end = points.find((item) => item.roleId === orderedRoles[index + 1])!.point;
      curves.push({
        type: "curve",
        startRoleId: orderedRoles[index],
        endRoleId: orderedRoles[index + 1],
        recommendedControl: point(start.compositionBPercent, (start.temperatureCelsius + end.temperatureCelsius) / 2),
        semanticRole: `${phaseId}-line-${index}`,
      });
    }
  });

  const solution: HiddenSolution = {
    puzzleId: `hard-large-multi-invariant-v1-${seed}`,
    points,
    curves,
    invariants,
    expectedFields: [],
  };
  solution.expectedFields = deriveExpectedFields(solution, (label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
    const interval = Math.min(phaseIds.length - 2, Math.max(0, compositions.findIndex((composition, index) => index > 0 && label.compositionBPercent < composition) - 1));
    const leftPhase = phaseIds[interval];
    const rightPhase = phaseIds[interval + 1];
    if (label.temperatureCelsius < invariantTemperatures[interval]) {
      return { role: `${leftPhase}-${rightPhase}`, phases: [leftPhase, rightPhase] };
    }
    return label.compositionBPercent < eutecticCompositions[interval]
      ? { role: `liquid-${leftPhase}`, phases: ["L", leftPhase] }
      : { role: `liquid-${rightPhase}`, phases: ["L", rightPhase] };
  }, 16);
  const inventory: PhaseDefinition[] = [
    { id: "L", symbol: "L", name: "Liquid", kind: "liquid", required: true },
    { id: "alpha", symbol: "α", name: "Alpha", kind: "terminal-solid", required: true },
    ...compoundIds.map((id) => ({ id, symbol: id, name: `${id} intermediate`, kind: "line-compound" as const, required: true, compositionGroupId: id })),
    { id: "beta", symbol: "β", name: "Beta", kind: "terminal-solid", required: true },
  ];
  const requiredInvariants = solution.invariants.map((item) => ({
    startRoleId: item.startRoleId,
    endRoleId: item.endRoleId,
    interiorRoleIds: item.interiorRoleIds,
    expectedAssemblage: item.expectedAssemblage,
    reactionType: item.reactionType,
  }));
  return {
    seed,
    difficulty: "hard",
    family: "large-multi-invariant",
    solution,
    puzzle: puzzleFrom(seed, "hard", "Large multi-compound binary system", solution, requiredInvariants, inventory),
  };
}

function generateLargeCatatectic(seed: number): GeneratedRound {
  const random = randomForSeed(seed ^ 0x6ca7ec7);
  const gammaX = 20;
  const deltaX = 38;
  const liquidCatX = 50;
  const epsilonX = 62;
  const zetaX = 80;
  const e1x = integer(random, 8, 13);
  const e2x = integer(random, 27, 32);
  const e4x = integer(random, 68, 73);
  const e5x = integer(random, 88, 93);
  const e1t = integer(random, 300, 340, 10);
  const e3t = integer(random, 370, 410, 10);
  const e5t = integer(random, 320, 360, 10);
  const e4t = integer(random, 440, 480, 10);
  const catT = integer(random, 610, 650, 10);
  const e2t = integer(random, 760, 800, 10);
  const aMelt = integer(random, 880, 940, 10);
  const gammaPeak = integer(random, 980, 1030, 10);
  const deltaPeak = integer(random, 1030, 1080, 10);
  const epsilonPeak = integer(random, 940, 1000, 10);
  const zetaPeak = integer(random, 990, 1050, 10);
  const bMelt = integer(random, 890, 950, 10);
  const solution: HiddenSolution = {
    puzzleId: `hard-large-catatectic-v1-${seed}`,
    points: [
      { roleId: "a-melt", point: point(0, aMelt) },
      { roleId: "gamma-peak", point: point(gammaX, gammaPeak) },
      { roleId: "delta-peak", point: point(deltaX, deltaPeak) },
      { roleId: "epsilon-peak", point: point(epsilonX, epsilonPeak) },
      { roleId: "zeta-peak", point: point(zetaX, zetaPeak) },
      { roleId: "b-melt", point: point(100, bMelt) },

      { roleId: "left-e1", point: point(0, e1t) },
      { roleId: "e1", point: point(e1x, e1t) },
      { roleId: "gamma-e1", point: point(gammaX, e1t) },

      { roleId: "gamma-e2", point: point(gammaX, e2t) },
      { roleId: "e2", point: point(e2x, e2t) },
      { roleId: "delta-e2", point: point(deltaX, e2t) },

      { roleId: "gamma-cat", point: point(gammaX, catT) },
      { roleId: "delta-cat", point: point(deltaX, catT) },
      { roleId: "liquid-cat", point: point(liquidCatX, catT) },

      { roleId: "gamma-e3", point: point(gammaX, e3t) },
      { roleId: "e3", point: point(liquidCatX, e3t) },
      { roleId: "epsilon-e3", point: point(epsilonX, e3t) },

      { roleId: "epsilon-e4", point: point(epsilonX, e4t) },
      { roleId: "e4", point: point(e4x, e4t) },
      { roleId: "zeta-e4", point: point(zetaX, e4t) },

      { roleId: "zeta-e5", point: point(zetaX, e5t) },
      { roleId: "e5", point: point(e5x, e5t) },
      { roleId: "right-e5", point: point(100, e5t) },

      { roleId: "gamma-low", point: point(gammaX, 0) },
      { roleId: "epsilon-low", point: point(epsilonX, 0) },
      { roleId: "zeta-low", point: point(zetaX, 0) },
    ],
    curves: [
      { type: "curve", startRoleId: "a-melt", endRoleId: "e1", recommendedControl: bowedControl(point(e1x, e1t), point(0, aMelt)), semanticRole: "liquidus-alpha" },
      { type: "curve", startRoleId: "gamma-peak", endRoleId: "e1", recommendedControl: bowedControl(point(e1x, e1t), point(gammaX, gammaPeak), 1), semanticRole: "liquidus-gamma-left" },
      { type: "curve", startRoleId: "gamma-peak", endRoleId: "e2", recommendedControl: bowedControl(point(e2x, e2t), point(gammaX, gammaPeak), 1), semanticRole: "liquidus-gamma-right" },
      { type: "curve", startRoleId: "delta-peak", endRoleId: "e2", recommendedControl: bowedControl(point(e2x, e2t), point(deltaX, deltaPeak), 1), semanticRole: "liquidus-delta-left" },
      { type: "curve", startRoleId: "delta-peak", endRoleId: "liquid-cat", recommendedControl: bowedControl(point(liquidCatX, catT), point(deltaX, deltaPeak), 1), semanticRole: "liquidus-delta-right" },
      { type: "curve", startRoleId: "liquid-cat", endRoleId: "e3", recommendedControl: point(liquidCatX + 1, (catT + e3t) / 2), semanticRole: "reentrant-liquidus-left" },
      { type: "curve", startRoleId: "epsilon-peak", endRoleId: "e3", recommendedControl: bowedControl(point(liquidCatX, e3t), point(epsilonX, epsilonPeak), 1), semanticRole: "liquidus-epsilon-left" },
      { type: "curve", startRoleId: "epsilon-peak", endRoleId: "e4", recommendedControl: bowedControl(point(e4x, e4t), point(epsilonX, epsilonPeak), 1), semanticRole: "liquidus-epsilon-right" },
      { type: "curve", startRoleId: "zeta-peak", endRoleId: "e4", recommendedControl: bowedControl(point(e4x, e4t), point(zetaX, zetaPeak), 1), semanticRole: "liquidus-zeta-left" },
      { type: "curve", startRoleId: "zeta-peak", endRoleId: "e5", recommendedControl: bowedControl(point(e5x, e5t), point(zetaX, zetaPeak), 1), semanticRole: "liquidus-zeta-right" },
      { type: "curve", startRoleId: "b-melt", endRoleId: "e5", recommendedControl: bowedControl(point(e5x, e5t), point(100, bMelt)), semanticRole: "liquidus-beta" },

      { type: "curve", startRoleId: "gamma-low", endRoleId: "gamma-e1", recommendedControl: point(gammaX, e1t / 2), semanticRole: "gamma-line-0" },
      { type: "curve", startRoleId: "gamma-e1", endRoleId: "gamma-e3", recommendedControl: point(gammaX, (e1t + e3t) / 2), semanticRole: "gamma-line-1" },
      { type: "curve", startRoleId: "gamma-e3", endRoleId: "gamma-cat", recommendedControl: point(gammaX, (e3t + catT) / 2), semanticRole: "gamma-line-2" },
      { type: "curve", startRoleId: "gamma-cat", endRoleId: "gamma-e2", recommendedControl: point(gammaX, (catT + e2t) / 2), semanticRole: "gamma-line-3" },
      { type: "curve", startRoleId: "gamma-e2", endRoleId: "gamma-peak", recommendedControl: point(gammaX, (e2t + gammaPeak) / 2), semanticRole: "gamma-line-4" },

      { type: "curve", startRoleId: "delta-cat", endRoleId: "delta-e2", recommendedControl: point(deltaX, (catT + e2t) / 2), semanticRole: "delta-line-0" },
      { type: "curve", startRoleId: "delta-e2", endRoleId: "delta-peak", recommendedControl: point(deltaX, (e2t + deltaPeak) / 2), semanticRole: "delta-line-1" },

      { type: "curve", startRoleId: "epsilon-low", endRoleId: "epsilon-e3", recommendedControl: point(epsilonX, e3t / 2), semanticRole: "epsilon-line-0" },
      { type: "curve", startRoleId: "epsilon-e3", endRoleId: "epsilon-e4", recommendedControl: point(epsilonX, (e3t + e4t) / 2), semanticRole: "epsilon-line-1" },
      { type: "curve", startRoleId: "epsilon-e4", endRoleId: "epsilon-peak", recommendedControl: point(epsilonX, (e4t + epsilonPeak) / 2), semanticRole: "epsilon-line-2" },

      { type: "curve", startRoleId: "zeta-low", endRoleId: "zeta-e5", recommendedControl: point(zetaX, e5t / 2), semanticRole: "zeta-line-0" },
      { type: "curve", startRoleId: "zeta-e5", endRoleId: "zeta-e4", recommendedControl: point(zetaX, (e5t + e4t) / 2), semanticRole: "zeta-line-1" },
      { type: "curve", startRoleId: "zeta-e4", endRoleId: "zeta-peak", recommendedControl: point(zetaX, (e4t + zetaPeak) / 2), semanticRole: "zeta-line-2" },
    ],
    invariants: [
      { type: "invariant-horizontal", startRoleId: "left-e1", endRoleId: "gamma-e1", interiorRoleIds: ["e1"], temperatureCelsius: e1t, expectedAssemblage: ["L", "alpha", "gamma"], reactionType: "eutectic" },
      { type: "invariant-horizontal", startRoleId: "gamma-e2", endRoleId: "delta-e2", interiorRoleIds: ["e2"], temperatureCelsius: e2t, expectedAssemblage: ["L", "gamma", "delta"], reactionType: "eutectic" },
      { type: "invariant-horizontal", startRoleId: "gamma-cat", endRoleId: "liquid-cat", interiorRoleIds: ["delta-cat"], temperatureCelsius: catT, expectedAssemblage: ["gamma", "delta", "L"], reactionType: "catatectic" },
      { type: "invariant-horizontal", startRoleId: "gamma-e3", endRoleId: "epsilon-e3", interiorRoleIds: ["e3"], temperatureCelsius: e3t, expectedAssemblage: ["L", "gamma", "epsilon"], reactionType: "eutectic" },
      { type: "invariant-horizontal", startRoleId: "epsilon-e4", endRoleId: "zeta-e4", interiorRoleIds: ["e4"], temperatureCelsius: e4t, expectedAssemblage: ["L", "epsilon", "zeta"], reactionType: "eutectic" },
      { type: "invariant-horizontal", startRoleId: "zeta-e5", endRoleId: "right-e5", interiorRoleIds: ["e5"], temperatureCelsius: e5t, expectedAssemblage: ["L", "zeta", "beta"], reactionType: "eutectic" },
    ],
    expectedFields: [],
  };
  solution.expectedFields = deriveExpectedFields(solution, (label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
    const x = label.compositionBPercent;
    const t = label.temperatureCelsius;
    if (x < gammaX) {
      if (t < e1t) return { role: "alpha-gamma", phases: ["alpha", "gamma"] };
      return x < e1x ? { role: "liquid-alpha", phases: ["L", "alpha"] } : { role: "liquid-gamma-left", phases: ["L", "gamma"] };
    }
    if (x < deltaX) {
      if (t < e3t) return { role: "gamma-epsilon-left", phases: ["gamma", "epsilon"] };
      if (t < catT) return { role: "gamma-liquid-left", phases: ["gamma", "L"] };
      if (t < e2t) return { role: "gamma-delta", phases: ["gamma", "delta"] };
      return x < e2x ? { role: "liquid-gamma-right", phases: ["L", "gamma"] } : { role: "liquid-delta-left", phases: ["L", "delta"] };
    }
    if (x < liquidCatX) {
      if (t < e3t) return { role: "gamma-epsilon-mid", phases: ["gamma", "epsilon"] };
      if (t < catT) return { role: "gamma-liquid-right", phases: ["gamma", "L"] };
      return { role: "liquid-delta-right", phases: ["L", "delta"] };
    }
    if (x < epsilonX) {
      if (t < e3t) return { role: "gamma-epsilon-right", phases: ["gamma", "epsilon"] };
      return { role: "liquid-epsilon-left", phases: ["L", "epsilon"] };
    }
    if (x < zetaX) {
      if (t < e4t) return { role: "epsilon-zeta", phases: ["epsilon", "zeta"] };
      return x < e4x ? { role: "liquid-epsilon-right", phases: ["L", "epsilon"] } : { role: "liquid-zeta-left", phases: ["L", "zeta"] };
    }
    if (t < e5t) return { role: "zeta-beta", phases: ["zeta", "beta"] };
    return x < e5x ? { role: "liquid-zeta-right", phases: ["L", "zeta"] } : { role: "liquid-beta", phases: ["L", "beta"] };
  }, 17);
  const inventory: PhaseDefinition[] = [
    { id: "L", symbol: "L", name: "Liquid", kind: "liquid", required: true },
    { id: "alpha", symbol: "α", name: "Alpha", kind: "terminal-solid", required: true },
    { id: "gamma", symbol: "γ", name: "First intermediate", kind: "line-compound", required: true, compositionGroupId: "gamma" },
    { id: "delta", symbol: "δ", name: "Catatectic parent intermediate", kind: "line-compound", required: true, compositionGroupId: "delta" },
    { id: "epsilon", symbol: "ε", name: "Third intermediate", kind: "line-compound", required: true, compositionGroupId: "epsilon" },
    { id: "zeta", symbol: "ζ", name: "Fourth intermediate", kind: "line-compound", required: true, compositionGroupId: "zeta" },
    { id: "beta", symbol: "β", name: "Beta", kind: "terminal-solid", required: true },
  ];
  const requiredInvariants = solution.invariants.map((item) => ({
    startRoleId: item.startRoleId,
    endRoleId: item.endRoleId,
    interiorRoleIds: item.interiorRoleIds,
    expectedAssemblage: item.expectedAssemblage,
    reactionType: item.reactionType,
  }));
  return {
    seed,
    difficulty: "hard",
    family: "large-catatectic",
    solution,
    puzzle: puzzleFrom(seed, "hard", "Large binary system with catatectic decomposition", solution, requiredInvariants, inventory),
  };
}

function generateImmiscibleHard(seed: number, variant: "syntectic" | "liquid-spinodal", metastable = false): GeneratedRound {
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
      { type: "curve", startRoleId: "gamma-low", endRoleId: "gamma-right", recommendedControl: point(gx, rightT / 2), semanticRole: "compound-line-low" },
      { type: "curve", startRoleId: "gamma-right", endRoleId: "gamma-left", recommendedControl: point(gx, (rightT + leftT) / 2), semanticRole: "compound-line-mid" },
      { type: "curve", startRoleId: "gamma-left", endRoleId: "gamma-syntectic", recommendedControl: point(gx, (leftT + synT) / 2), semanticRole: "compound-line-high" },
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
      { type: "curve", startRoleId: "spinodal-left", endRoleId: "dome-peak", recommendedControl: bowedControl(point(innerLeftX, synT), point(gx, domePeakT), 1, .32), semanticRole: metastable ? "spinodal-left-metastable" : "spinodal-left", fieldBoundary: false },
      { type: "curve", startRoleId: "dome-peak", endRoleId: "spinodal-right", recommendedControl: bowedControl(point(innerRightX, synT), point(gx, domePeakT), 1, .32), semanticRole: metastable ? "spinodal-right-metastable" : "spinodal-right", fieldBoundary: false },
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
    { id: "L", symbol: "L", name: "Homogeneous liquid", kind: "liquid", required: true },
    { id: "L1", symbol: "L₁", name: "Liquid 1", kind: "liquid", required: true },
    { id: "L2", symbol: "L₂", name: "Liquid 2", kind: "liquid", required: true },
    { id: "alpha", symbol: "α", name: "Alpha", kind: "terminal-solid", required: true },
    { id: "gamma", symbol: "γ", name: "Intermediate compound", kind: "line-compound", required: true, compositionGroupId: "gamma" },
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
    ],
    curves: [
      { type: "curve", startRoleId: "dome-left", endRoleId: "dome-peak", recommendedControl: bowedControl(point(domeLeftX, invariantT), point(domePeakX, domePeakT), 1, .32), semanticRole: "liquid-immiscibility-left" },
      { type: "curve", startRoleId: "dome-peak", endRoleId: "monotectic", recommendedControl: bowedControl(point(parentLiquidX, invariantT), point(domePeakX, domePeakT), 1, .32), semanticRole: "liquid-immiscibility-right" },
      { type: "curve", startRoleId: "monotectic", endRoleId: "alpha-melt", recommendedControl: bowedControl(point(parentLiquidX, invariantT), point(100, alphaMeltT)), semanticRole: "liquidus-alpha" },
    ],
    invariants: [{
      type: "invariant-horizontal",
      startRoleId: "dome-left",
      endRoleId: "alpha-invariant",
      interiorRoleIds: ["monotectic"],
      temperatureCelsius: invariantT,
      expectedAssemblage: ["L2", "L1", "alpha"],
      reactionType: "monotectic",
      incidence: {
        above: [["L1", "L2"], ["L", "alpha"]],
        below: [["L2", "alpha"]],
      },
    }],
    expectedFields: [],
  };
  solution.expectedFields = deriveExpectedFields(solution, (label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
    if (boundaries.has("generated-curve:0") && boundaries.has("generated-curve:1")) return { role: "L1-L2", phases: ["L1", "L2"] };
    if (boundaries.has("frame-bottom")) return { role: "L2-alpha", phases: ["L2", "alpha"] };
    return { role: "liquid-alpha", phases: ["L", "alpha"] };
  }, 4);
  const inventory: PhaseDefinition[] = [
    { id: "L", symbol: "L", name: "Homogeneous liquid", kind: "liquid", required: true },
    { id: "L1", symbol: "L₁", name: "Parent liquid", kind: "liquid", required: true },
    { id: "L2", symbol: "L₂", name: "Second liquid", kind: "liquid", required: true },
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
    incidence: item.incidence,
  }));
}

function generateSubsolidusPolymorph(seed: number, difficulty: Difficulty = "normal"): GeneratedRound {
  const random = randomForSeed(seed ^ 0x51b50d);
  const aMelt = integer(random, 930, 1040, 10);
  const bMelt = integer(random, 900, 1020, 10);
  const liquidusControl = point(50, Math.min(1080, Math.max(aMelt, bMelt) + 70));
  const solidusControl = point(50, Math.min(aMelt, bMelt) - 190);
  const leftTransitionX = integer(random, 18, 28);
  const rightTransitionX = integer(random, 72, 82);
  const transitionX = integer(random, 43, 57);
  const transitionT = integer(random, 300, 430, 10);
  const solution: HiddenSolution = {
    puzzleId: `${difficulty}-subsolidus-polymorph-solution-v1-${seed}`,
    points: [
      { roleId: "a-melt", point: point(0, aMelt) },
      { roleId: "b-melt", point: point(100, bMelt) },
      { roleId: "polymorph-left", point: point(leftTransitionX, 0) },
      { roleId: "polymorph-critical", point: point(transitionX, transitionT) },
      { roleId: "polymorph-right", point: point(rightTransitionX, 0) },
    ],
    curves: [
      { type: "curve", startRoleId: "a-melt", endRoleId: "b-melt", recommendedControl: liquidusControl, semanticRole: "complete-solution-liquidus" },
      { type: "curve", startRoleId: "a-melt", endRoleId: "b-melt", recommendedControl: solidusControl, semanticRole: "complete-solution-solidus" },
      { type: "curve", startRoleId: "polymorph-left", endRoleId: "polymorph-critical", recommendedControl: bowedControl(point(leftTransitionX, 0), point(transitionX, transitionT), 1, .32), semanticRole: "subsolidus-polymorph-left" },
      { type: "curve", startRoleId: "polymorph-critical", endRoleId: "polymorph-right", recommendedControl: bowedControl(point(rightTransitionX, 0), point(transitionX, transitionT), 1, .32), semanticRole: "subsolidus-polymorph-right" },
    ],
    invariants: [],
    expectedFields: [],
  };
  solution.expectedFields = deriveExpectedFields(solution, (label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
    if (boundaries.has("generated-curve:0") && boundaries.has("generated-curve:1")) return { role: "liquid-parent", phases: ["L", "gamma"] };
    const sideWidth = label.compositionBPercent <= transitionX ? transitionX - leftTransitionX : rightTransitionX - transitionX;
    const normalizedX = sideWidth > 0 ? Math.abs(label.compositionBPercent - transitionX) / sideWidth : 2;
    const insidePolymorph = label.compositionBPercent > leftTransitionX && label.compositionBPercent < rightTransitionX
      && label.temperatureCelsius < transitionT * (1 - normalizedX * normalizedX);
    if (insidePolymorph) return { role: "low-temperature-polymorph", phases: ["delta"], texture: "partial-solubility" };
    return { role: "high-temperature-polymorph", phases: ["gamma"], texture: "partial-solubility" };
  }, 4);
  const inventory: PhaseDefinition[] = [
    { id: "L", symbol: "L", name: "Liquid", kind: "liquid", required: true },
    { id: "gamma", symbol: "α", name: "High-temperature solid solution", kind: "terminal-solid", required: true, compositionGroupId: "polymorph" },
    { id: "delta", symbol: "β", name: "Low-temperature solid solution", kind: "terminal-solid", required: true, compositionGroupId: "polymorph" },
  ];
  return { seed, difficulty, family: "subsolidus-polymorph", solution, puzzle: puzzleFrom(seed, difficulty, "Subsolidus polymorphism in a complete solid solution", solution, [], inventory) };
}

function generateSupersolidusPolymorph(seed: number, difficulty: Difficulty = "normal"): GeneratedRound {
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
    puzzleId: `${difficulty}-supersolidus-polymorph-peritectic-v1-${seed}`,
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
      { type: "curve", startRoleId: "gamma-eutectic", endRoleId: "gamma-peritectic", recommendedControl: point((gammaEutX + gammaPeritecticX) / 2, (eutecticT + peritecticT) / 2), semanticRole: "supersolidus-polymorph-solidus" },
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
    if (boundaries.has("generated-curve:1") && boundaries.has("generated-curve:4")) return { role: "liquid-low-polymorph", phases: ["L", "gamma"] };
    if (boundaries.has("generated-curve:2") && boundaries.has("generated-curve:5")) return { role: "liquid-high-polymorph", phases: ["L", "delta"] };
    if (boundaries.has("generated-curve:3") && boundaries.has("generated-curve:6")) return { role: "alpha", phases: ["alpha"], texture: "partial-solubility" };
    if (boundaries.has("generated-curve:6") && boundaries.has("generated-curve:7")) return { role: "alpha-low-polymorph", phases: ["alpha", "gamma"] };
    if (boundaries.has("generated-curve:7") && boundaries.has("generated-curve:8")) return { role: "low-polymorph", phases: ["gamma"], texture: "partial-solubility" };
    if (boundaries.has("generated-curve:8") && boundaries.has("generated-curve:9")) return { role: "polymorph-coexistence", phases: ["gamma", "delta"] };
    return { role: "high-polymorph", phases: ["delta"], texture: "partial-solubility" };
  }, 9);
  const inventory: PhaseDefinition[] = [
    { id: "L", symbol: "L", name: "Liquid", kind: "liquid", required: true },
    { id: "alpha", symbol: "α", name: "Terminal solid solution", kind: "terminal-solid", required: true },
    { id: "gamma", symbol: "γ", name: "Low-temperature solid-solution polymorph", kind: "terminal-solid", required: true, compositionGroupId: "polymorph" },
    { id: "delta", symbol: "γ′", name: "High-temperature solid-solution polymorph", kind: "terminal-solid", required: true, compositionGroupId: "polymorph" },
  ];
  return { seed, difficulty, family: "supersolidus-polymorph", solution, puzzle: puzzleFrom(seed, difficulty, "Supersolidus polymorphism with a peritectic", solution, requiredInvariantsFor(solution), inventory) };
}

function generateSuperlatticeSolution(seed: number, difficulty: Difficulty = "normal", variant: "superlattice" | "secondary-solution" = "superlattice"): GeneratedRound {
  const random = randomForSeed(seed ^ 0x29c6e3);
  const aMelt = integer(random, 930, 1040, 10);
  const bMelt = integer(random, 900, 1020, 10);
  const leftOrderX = integer(random, 20, 32);
  const rightOrderX = integer(random, 68, 80);
  const criticalX = integer(random, leftOrderX + 14, rightOrderX - 14);
  const orderT = integer(random, 300, 440, 10);
  const solution: HiddenSolution = {
    puzzleId: `${difficulty}-${variant}-complete-solution-v2-${seed}`,
    points: [
      { roleId: "a-melt", point: point(0, aMelt) }, { roleId: "b-melt", point: point(100, bMelt) },
      { roleId: "order-left", point: point(leftOrderX, 0) },
      { roleId: "order-critical", point: point(criticalX, orderT) },
      { roleId: "order-right", point: point(rightOrderX, 0) },
    ],
    curves: [
      { type: "curve", startRoleId: "a-melt", endRoleId: "b-melt", recommendedControl: point(50, Math.min(1080, Math.max(aMelt, bMelt) + 70)), semanticRole: "complete-solution-liquidus" },
      { type: "curve", startRoleId: "a-melt", endRoleId: "b-melt", recommendedControl: point(50, Math.min(aMelt, bMelt) - 190), semanticRole: "complete-solution-solidus" },
      { type: "curve", startRoleId: "order-left", endRoleId: "order-critical", recommendedControl: bowedControl(point(leftOrderX, 0), point(criticalX, orderT), 1, .32), semanticRole: variant === "superlattice" ? "superlattice-left" : "secondary-solution-left" },
      { type: "curve", startRoleId: "order-critical", endRoleId: "order-right", recommendedControl: bowedControl(point(rightOrderX, 0), point(criticalX, orderT), 1, .32), semanticRole: variant === "superlattice" ? "superlattice-right" : "secondary-solution-right" },
    ],
    invariants: [],
    expectedFields: [],
  };
  solution.expectedFields = deriveExpectedFields(solution, (label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
    if (boundaries.has("generated-curve:0") && boundaries.has("generated-curve:1")) return { role: "liquid-disordered-solution", phases: ["L", "gamma"] };
    if (boundaries.has("generated-curve:2") && boundaries.has("generated-curve:3") && label.temperatureCelsius < orderT) return { role: "ordered-superlattice", phases: ["delta"], texture: "partial-solubility" };
    return { role: "disordered-solid-solution", phases: ["gamma"], texture: "partial-solubility" };
  }, 4);
  const inventory: PhaseDefinition[] = [
    { id: "L", symbol: "L", name: "Liquid", kind: "liquid", required: true },
    { id: "gamma", symbol: "α", name: "Disordered solid solution", kind: "terminal-solid", required: true, compositionGroupId: "ordered-solution" },
    { id: "delta", symbol: "α′", name: "Ordered superlattice", kind: "terminal-solid", required: true, compositionGroupId: "ordered-solution" },
  ];
  const family: DiagramFamily = variant === "superlattice" ? "superlattice" : "secondary-solid-solution";
  return { seed, difficulty, family, solution, puzzle: puzzleFrom(seed, difficulty, variant === "superlattice" ? "Superlattice ordering in a complete solid solution" : "Secondary solid-solution field", solution, [], inventory) };
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
      { type: "curve", startRoleId: "gamma-low", endRoleId: "gamma-peritectoid", recommendedControl: point(gammaX, peritectoidT * .5), semanticRole: "gamma-product-line" },
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
    { id: "gamma", symbol: "γ", name: "Intermediate product", kind: "line-compound", required: true, compositionGroupId: "gamma" },
    { id: "beta", symbol: "β", name: "Beta", kind: "terminal-solid", required: true },
  ];
  return { seed, difficulty, family: "peritectoid", solution, puzzle: puzzleFrom(seed, difficulty, "Complete eutectic system with peritectoid · α + β → γ", solution, requiredInvariantsFor(solution), inventory) };
}

function generateSolidDecompositionSystem(
  seed: number,
  difficulty: Difficulty,
  reactionType: "eutectoid" | "monotectoid",
): GeneratedRound {
  const random = randomForSeed(seed ^ (reactionType === "eutectoid" ? 0xe071ec7 : 0x6d0ec7));
  const parentX = integer(random, 38, 62);
  const eutecticX = integer(random, 32, 68);
  const reactionT = integer(random, 260, 360, 10);
  const parentApexT = reactionT + integer(random, 90, 140, 10);
  const eutecticT = parentApexT + integer(random, 150, 220, 10);
  const leftMelt = integer(random, eutecticT + 210, 1040, 10);
  const rightMelt = integer(random, eutecticT + 190, 1020, 10);
  const parentId = reactionType === "eutectoid" ? "gamma" : "alpha1";
  const leftId = reactionType === "eutectoid" ? "alpha" : "alpha2";
  const solution: HiddenSolution = {
    puzzleId: `${difficulty}-composable-${reactionType}-v1-${seed}`,
    points: [
      { roleId: "a-melt", point: point(0, leftMelt) },
      { roleId: "b-melt", point: point(100, rightMelt) },
      { roleId: "left-eutectic", point: point(0, eutecticT) },
      { roleId: "eutectic", point: point(eutecticX, eutecticT) },
      { roleId: "right-eutectic", point: point(100, eutecticT) },
      { roleId: "left-decomposition", point: point(0, reactionT) },
      { roleId: `${parentId}-decomposition`, point: point(parentX, reactionT) },
      { roleId: "right-decomposition", point: point(100, reactionT) },
      { roleId: `${parentId}-apex`, point: point(parentX, parentApexT) },
    ],
    curves: [
      { type: "curve", startRoleId: "a-melt", endRoleId: "eutectic", recommendedControl: bowedControl(point(eutecticX, eutecticT), point(0, leftMelt)), semanticRole: "liquidus-left" },
      { type: "curve", startRoleId: "b-melt", endRoleId: "eutectic", recommendedControl: bowedControl(point(eutecticX, eutecticT), point(100, rightMelt)), semanticRole: "liquidus-right" },
      { type: "curve", startRoleId: "left-decomposition", endRoleId: `${parentId}-apex`, recommendedControl: point(parentX - 14, parentApexT - 20), semanticRole: `${reactionType}-left-boundary` },
      { type: "curve", startRoleId: `${parentId}-apex`, endRoleId: "right-decomposition", recommendedControl: point(parentX + 14, parentApexT - 20), semanticRole: `${reactionType}-right-boundary` },
      { type: "curve", startRoleId: `${parentId}-decomposition`, endRoleId: `${parentId}-apex`, recommendedControl: point(parentX, (reactionT + parentApexT) / 2), semanticRole: `${parentId}-parent-line` },
    ],
    invariants: [
      {
        type: "invariant-horizontal", startRoleId: "left-eutectic", endRoleId: "right-eutectic", interiorRoleIds: ["eutectic"],
        temperatureCelsius: eutecticT, expectedAssemblage: ["L", leftId, "beta"], reactionType: "eutectic",
        incidence: { above: [["L", leftId], ["L", "beta"]], below: [[leftId, "beta"]] },
      },
      {
        type: "invariant-horizontal", startRoleId: "left-decomposition", endRoleId: "right-decomposition", interiorRoleIds: [`${parentId}-decomposition`],
        temperatureCelsius: reactionT, expectedAssemblage: [leftId, parentId, "beta"], reactionType,
        incidence: { above: [[leftId, parentId], [parentId, "beta"]], below: [[leftId, "beta"]] },
      },
    ],
    expectedFields: [],
  };
  solution.expectedFields = deriveExpectedFields(solution, (label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
    if (label.temperatureCelsius > eutecticT) return label.compositionBPercent < eutecticX
      ? { role: "liquid-left", phases: ["L", leftId] }
      : { role: "liquid-right", phases: ["L", "beta"] };
    if (boundaries.has("generated-curve:4")) return label.compositionBPercent < parentX
      ? { role: `${reactionType}-left-parent`, phases: [leftId, parentId] }
      : { role: `${reactionType}-parent-right`, phases: [parentId, "beta"] };
    return { role: `${reactionType}-products`, phases: [leftId, "beta"] };
  });
  const inventory: PhaseDefinition[] = [
    { id: "L", symbol: "L", name: "Liquid", kind: "liquid", required: true },
    { id: leftId, symbol: "α", name: reactionType === "monotectoid" ? "Low-temperature alpha composition" : "Alpha", kind: "terminal-solid", required: true },
    { id: parentId, symbol: "γ", name: reactionType === "monotectoid" ? "Parent alpha composition" : "Parent intermediate", kind: "line-compound", required: true, compositionGroupId: parentId },
    { id: "beta", symbol: "β", name: "Beta", kind: "terminal-solid", required: true },
  ];
  return { seed, difficulty, family: "rule-composed", solution, puzzle: puzzleFrom(seed, difficulty, `${reactionType} decomposition kernel`, solution, requiredInvariantsFor(solution), inventory) };
}

function generateCatatecticSystem(seed: number, difficulty: Difficulty): GeneratedRound {
  const random = randomForSeed(seed ^ 0xca7a7ec7);
  const gammaX = 28;
  const deltaX = 48;
  const liquidProductX = 58;
  const eutectic3X = integer(random, 70, 82);
  const eutectic1X = integer(random, 10, 18);
  const eutectic2X = integer(random, 34, 41);
  const eutectic1T = integer(random, 300, 350, 10);
  const eutectic3T = eutectic1T + integer(random, 60, 100, 10);
  const catatecticT = eutectic3T + integer(random, 150, 200, 10);
  const eutectic2T = catatecticT + integer(random, 120, 170, 10);
  const aMelt = integer(random, eutectic2T + 160, 1040, 10);
  const gammaPeak = integer(random, eutectic2T + 180, 1060, 10);
  const deltaPeak = integer(random, eutectic2T + 200, 1080, 10);
  const bMelt = integer(random, eutectic2T + 130, 1020, 10);
  const solution: HiddenSolution = {
    puzzleId: `${difficulty}-composable-catatectic-v1-${seed}`,
    points: [
      { roleId: "a-melt", point: point(0, aMelt) }, { roleId: "gamma-peak", point: point(gammaX, gammaPeak) },
      { roleId: "delta-peak", point: point(deltaX, deltaPeak) }, { roleId: "b-melt", point: point(100, bMelt) },
      { roleId: "left-e1", point: point(0, eutectic1T) }, { roleId: "e1", point: point(eutectic1X, eutectic1T) }, { roleId: "gamma-e1", point: point(gammaX, eutectic1T) },
      { roleId: "gamma-e2", point: point(gammaX, eutectic2T) }, { roleId: "e2", point: point(eutectic2X, eutectic2T) }, { roleId: "delta-e2", point: point(deltaX, eutectic2T) },
      { roleId: "gamma-cat", point: point(gammaX, catatecticT) }, { roleId: "delta-cat", point: point(deltaX, catatecticT) }, { roleId: "liquid-cat", point: point(liquidProductX, catatecticT) },
      { roleId: "gamma-e3", point: point(gammaX, eutectic3T) }, { roleId: "e3", point: point(eutectic3X, eutectic3T) }, { roleId: "right-e3", point: point(100, eutectic3T) },
      { roleId: "gamma-low", point: point(gammaX, 0) },
    ],
    curves: [
      { type: "curve", startRoleId: "a-melt", endRoleId: "e1", recommendedControl: bowedControl(point(eutectic1X, eutectic1T), point(0, aMelt)), semanticRole: "liquidus-alpha" },
      { type: "curve", startRoleId: "e1", endRoleId: "gamma-peak", recommendedControl: bowedControl(point(eutectic1X, eutectic1T), point(gammaX, gammaPeak)), semanticRole: "liquidus-gamma-left" },
      { type: "curve", startRoleId: "gamma-peak", endRoleId: "e2", recommendedControl: bowedControl(point(eutectic2X, eutectic2T), point(gammaX, gammaPeak)), semanticRole: "liquidus-gamma-right" },
      { type: "curve", startRoleId: "e2", endRoleId: "delta-peak", recommendedControl: bowedControl(point(eutectic2X, eutectic2T), point(deltaX, deltaPeak)), semanticRole: "liquidus-delta-left" },
      { type: "curve", startRoleId: "delta-peak", endRoleId: "liquid-cat", recommendedControl: bowedControl(point(liquidProductX, catatecticT), point(deltaX, deltaPeak)), semanticRole: "liquidus-delta-right" },
      { type: "curve", startRoleId: "liquid-cat", endRoleId: "e3", recommendedControl: bowedControl(point(eutectic3X, eutectic3T), point(liquidProductX, catatecticT), .72), semanticRole: "catatectic-liquid-product" },
      { type: "curve", startRoleId: "e3", endRoleId: "b-melt", recommendedControl: bowedControl(point(eutectic3X, eutectic3T), point(100, bMelt)), semanticRole: "liquidus-beta" },
      { type: "curve", startRoleId: "gamma-low", endRoleId: "gamma-e1", recommendedControl: point(gammaX, eutectic1T / 2), semanticRole: "gamma-line-0" },
      { type: "curve", startRoleId: "gamma-e1", endRoleId: "gamma-e3", recommendedControl: point(gammaX, (eutectic1T + eutectic3T) / 2), semanticRole: "gamma-line-1" },
      { type: "curve", startRoleId: "gamma-e3", endRoleId: "gamma-cat", recommendedControl: point(gammaX, (eutectic3T + catatecticT) / 2), semanticRole: "gamma-line-2" },
      { type: "curve", startRoleId: "gamma-cat", endRoleId: "gamma-e2", recommendedControl: point(gammaX, (catatecticT + eutectic2T) / 2), semanticRole: "gamma-line-3" },
      { type: "curve", startRoleId: "gamma-e2", endRoleId: "gamma-peak", recommendedControl: point(gammaX, (eutectic2T + gammaPeak) / 2), semanticRole: "gamma-line-4" },
      { type: "curve", startRoleId: "delta-cat", endRoleId: "delta-e2", recommendedControl: point(deltaX, (catatecticT + eutectic2T) / 2), semanticRole: "delta-line-1" },
      { type: "curve", startRoleId: "delta-e2", endRoleId: "delta-peak", recommendedControl: point(deltaX, (eutectic2T + deltaPeak) / 2), semanticRole: "delta-line-2" },
    ],
    invariants: [
      { type: "invariant-horizontal", startRoleId: "left-e1", endRoleId: "gamma-e1", interiorRoleIds: ["e1"], temperatureCelsius: eutectic1T, expectedAssemblage: ["L", "alpha", "gamma"], reactionType: "eutectic", incidence: { above: [["L", "alpha"], ["L", "gamma"]], below: [["alpha", "gamma"]] } },
      { type: "invariant-horizontal", startRoleId: "gamma-e2", endRoleId: "delta-e2", interiorRoleIds: ["e2"], temperatureCelsius: eutectic2T, expectedAssemblage: ["L", "gamma", "delta"], reactionType: "eutectic", incidence: { above: [["L", "gamma"], ["L", "delta"]], below: [["gamma", "delta"]] } },
      { type: "invariant-horizontal", startRoleId: "gamma-cat", endRoleId: "liquid-cat", interiorRoleIds: ["delta-cat"], temperatureCelsius: catatecticT, expectedAssemblage: ["gamma", "delta", "L"], reactionType: "catatectic", incidence: { above: [["gamma", "delta"], ["delta", "L"]], below: [["gamma", "L"]] } },
      { type: "invariant-horizontal", startRoleId: "gamma-e3", endRoleId: "right-e3", interiorRoleIds: ["e3"], temperatureCelsius: eutectic3T, expectedAssemblage: ["L", "gamma", "beta"], reactionType: "eutectic", incidence: { above: [["L", "gamma"], ["L", "beta"]], below: [["gamma", "beta"]] } },
    ],
    expectedFields: [],
  };
  solution.expectedFields = deriveExpectedFields(solution, (label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
    const x = label.compositionBPercent; const t = label.temperatureCelsius;
    if (x < gammaX) {
      if (t < eutectic1T) return { role: "alpha-gamma", phases: ["alpha", "gamma"] };
      return x < eutectic1X ? { role: "liquid-alpha", phases: ["L", "alpha"] } : { role: "liquid-gamma-left", phases: ["L", "gamma"] };
    }
    if (x < deltaX) {
      if (t < eutectic3T) return { role: "gamma-beta-left", phases: ["gamma", "beta"] };
      if (t < catatecticT) return { role: "gamma-liquid-left", phases: ["gamma", "L"] };
      if (t < eutectic2T) return { role: "gamma-delta", phases: ["gamma", "delta"] };
      return x < eutectic2X ? { role: "liquid-gamma-right", phases: ["L", "gamma"] } : { role: "liquid-delta-left", phases: ["L", "delta"] };
    }
    if (x < liquidProductX) {
      if (t < eutectic3T) return { role: "gamma-beta-mid", phases: ["gamma", "beta"] };
      if (t < catatecticT) return { role: "gamma-liquid-right", phases: ["gamma", "L"] };
      return { role: "liquid-delta-right", phases: ["L", "delta"] };
    }
    if (t < eutectic3T) return { role: "gamma-beta-right", phases: ["gamma", "beta"] };
    return { role: "liquid-beta", phases: ["L", "beta"] };
  });
  const inventory: PhaseDefinition[] = [
    { id: "L", symbol: "L", name: "Liquid", kind: "liquid", required: true },
    { id: "alpha", symbol: "α", name: "Alpha", kind: "terminal-solid", required: true },
    { id: "gamma", symbol: "γ", name: "First intermediate", kind: "line-compound", required: true, compositionGroupId: "gamma" },
    { id: "delta", symbol: "δ", name: "Catatectic parent", kind: "line-compound", required: true, compositionGroupId: "delta" },
    { id: "beta", symbol: "β", name: "Beta", kind: "terminal-solid", required: true },
  ];
  return { seed, difficulty, family: "rule-composed", solution, puzzle: puzzleFrom(seed, difficulty, "Catatectic reaction kernel", solution, requiredInvariantsFor(solution), inventory) };
}

export const COMPOSABLE_INVARIANT_TYPES = [
  "eutectic", "peritectic", "eutectoid", "peritectoid",
  "catatectic", "monotectic", "monotectoid", "syntectic",
] as const;

type ComposableInvariantType = typeof COMPOSABLE_INVARIANT_TYPES[number];

export const COMPOSABLE_BINARY_FEATURES = [
  ...COMPOSABLE_INVARIANT_TYPES,
  "liquid-spinodal", "solid-spinodal", "consolute-point",
  "subsolidus-polymorphism", "supersolidus-polymorphism", "superlattice",
  "congruent-melting", "degenerate-eutectic", "simple-eutectic",
  "congruent-compound", "incongruent-compound", "compound-stability",
  "complete-solid-solution", "maximum-melting", "minimum-melting",
  "solid-miscibility-gap", "partial-miscibility", "secondary-solution",
  "liquid-immiscibility", "metastable-immiscibility",
] as const;

export type ComposableBinaryFeature = typeof COMPOSABLE_BINARY_FEATURES[number];

const SPATIAL_HARD_FEATURES = new Set<ComposableBinaryFeature>([
  "liquid-spinodal", "solid-spinodal", "consolute-point",
  "subsolidus-polymorphism", "supersolidus-polymorphism", "superlattice",
  "complete-solid-solution", "maximum-melting", "minimum-melting",
  "solid-miscibility-gap", "partial-miscibility", "secondary-solution",
  "liquid-immiscibility", "metastable-immiscibility",
]);

interface ComposedSegment {
  index: number;
  leftX: number;
  rightX: number;
  leftPhaseId: string;
  rightPhaseId: string;
  eutecticX: number;
  eutecticT: number;
}

interface ComposedSolidModule {
  segmentIndex: number;
  reactionType: "eutectoid" | "peritectoid" | "monotectoid";
  parentPhaseId: string;
  parentX: number;
  temperature: number;
  verticalCurveId?: string;
}

const COMPOSED_SOLID_IDS = ["gamma", "delta", "epsilon", "zeta", "eta", "theta", "kappa", "lambda", "mu", "nu", "xi", "omicron"] as const;

function featureKernel(seed: number, difficulty: Difficulty, feature: ComposableBinaryFeature): GeneratedRound {
  if (feature === "eutectic") return generateSimple(seed);
  if (feature === "peritectic") return generateIncongruentCompound(seed, difficulty);
  if (feature === "eutectoid" || feature === "monotectoid") return generateSolidDecompositionSystem(seed, difficulty, feature);
  if (feature === "peritectoid") return generatePeritectoidSystem(seed, difficulty);
  if (feature === "catatectic") return generateCatatecticSystem(seed, difficulty);
  if (feature === "monotectic") return generateMonotectic(seed, difficulty);
  if (feature === "syntectic") return generateImmiscibleHard(seed, "syntectic");
  if (feature === "liquid-spinodal") return generateImmiscibleHard(seed, "liquid-spinodal");
  if (feature === "metastable-immiscibility") return generateImmiscibleHard(seed, "liquid-spinodal", true);
  if (feature === "solid-spinodal") return generateSolidMiscibilityGap(seed, difficulty, true);
  if (feature === "solid-miscibility-gap" || feature === "consolute-point") return generateSolidMiscibilityGap(seed, difficulty, false);
  if (feature === "subsolidus-polymorphism") return generateSubsolidusPolymorph(seed, difficulty);
  if (feature === "supersolidus-polymorphism") return generateSupersolidusPolymorph(seed, difficulty);
  if (feature === "superlattice") return generateSuperlatticeSolution(seed, difficulty, "superlattice");
  if (feature === "secondary-solution") return generateSuperlatticeSolution(seed, difficulty, "secondary-solution");
  if (feature === "partial-miscibility") return generateLimited(seed, difficulty);
  if (feature === "complete-solid-solution" || feature === "maximum-melting" || feature === "minimum-melting") return generateCompleteSolidSolution(seed, difficulty, feature);
  if (feature === "degenerate-eutectic") return generateSimple(seed, true);
  if (feature === "simple-eutectic") return generateSimple(seed);
  if (feature === "congruent-melting" || feature === "congruent-compound") return generateCompound(seed, difficulty);
  if (feature === "incongruent-compound" || feature === "compound-stability") return generateIncongruentCompound(seed, difficulty);
  return ((seed >>> 6) & 1) === 0 ? generateMonotectic(seed, difficulty) : generateImmiscibleHard(seed, "syntectic");
}

function expandReactionKernel(
  base: GeneratedRound,
  seed: number,
  difficulty: "normal" | "hard",
  targetBackboneIntermediates: number,
  solidModuleCount: number,
): GeneratedRound {
  const random = randomForSeed(seed ^ 0xc06ed5ed);
  const baseIntermediateCount = base.puzzle.intermediateCompositions.length;
  const appendedSegmentCount = Math.max(0, targetBackboneIntermediates - baseIntermediateCount);
  const evenKernelShare = (baseIntermediateCount + 1) / (targetBackboneIntermediates + 1) * 100;
  const minimumKernelShare = base.family === "degenerate-eutectic" ? 42
    : difficulty === "hard" && base.family === "limited-eutectic" ? 40
      : 0;
  const seamX = appendedSegmentCount === 0 ? 100 : Math.max(evenKernelShare, minimumKernelShare);
  const xScale = seamX / 100;
  const scalePoint = (value: LogicalPoint) => point(value.compositionBPercent * xScale, value.temperatureCelsius);

  const baseDiagram = generatedGeometry(base.solution);
  const baseRegions = extractFaces(baseDiagram.points, baseDiagram.geometry).map((cell) => ({
    polygon: cell.polygon,
    touchesRightEdge: cell.boundary.some((edge) => edge.geometryId === "frame-right"),
    field: base.solution.expectedFields.find((field) => sameLogicalPoint(field.witnessPoint, cell.labelPoint)),
  }));
  const topLiquidPhaseId = base.solution.expectedFields.find((field) => field.expectedAssemblage.length === 1
    && base.puzzle.phases.find((phase) => phase.id === field.expectedAssemblage[0])?.kind === "liquid")?.expectedAssemblage[0];
  if (!topLiquidPhaseId) throw new Error(`${base.solution.puzzleId} has no single high-temperature liquid phase.`);

  const rightEdgeSolidPhaseId = baseRegions.find((region) => region.touchesRightEdge
    && region.field?.expectedAssemblage.length === 1
    && base.puzzle.phases.find((phase) => phase.id === region.field!.expectedAssemblage[0])?.kind !== "liquid")
    ?.field?.expectedAssemblage[0];
  const originalRightPhase = base.puzzle.phases.find((phase) => phase.id === rightEdgeSolidPhaseId)
    ?? [...base.puzzle.phases].reverse().find((phase) => phase.kind !== "liquid");
  if (!originalRightPhase) throw new Error(`${base.solution.puzzleId} has no right-hand solid phase.`);
  const usedPhaseIds = new Set(base.puzzle.phases.map((phase) => phase.id));
  const takeSolidId = () => {
    const next = COMPOSED_SOLID_IDS.find((id) => !usedPhaseIds.has(id));
    if (!next) throw new Error("The reaction grammar exhausted its intermediate phase identifiers.");
    usedPhaseIds.add(next);
    return next;
  };
  const seamPhaseId = appendedSegmentCount > 0 ? takeSolidId() : originalRightPhase.id;
  const rightTerminalPhaseId = appendedSegmentCount > 0 && usedPhaseIds.has("beta") ? "right-terminal-beta" : "beta";
  if (appendedSegmentCount > 0) usedPhaseIds.add(rightTerminalPhaseId);
  const remapPhaseId = (phaseId: string) => appendedSegmentCount > 0 && phaseId === originalRightPhase.id ? seamPhaseId : phaseId;
  const remapAssemblage = (assemblage: string[]) => assemblage.map(remapPhaseId);
  const remapIncidence = (incidence: HiddenSolution["invariants"][number]["incidence"]) => incidence && ({
    above: incidence.above.map(remapAssemblage),
    below: incidence.below.map(remapAssemblage),
  });

  const solution: HiddenSolution = {
    puzzleId: `${difficulty}-rule-composed-v1-${seed}`,
    points: base.solution.points.map((item) => ({ ...item, point: scalePoint(item.point) })),
    curves: base.solution.curves.map((curve) => ({ ...curve, recommendedControl: scalePoint(curve.recommendedControl) })),
    invariants: base.solution.invariants.map((invariant) => ({
      ...invariant,
      expectedAssemblage: remapAssemblage(invariant.expectedAssemblage),
      incidence: remapIncidence(invariant.incidence),
    })),
    expectedFields: [],
  };
  const originalRightHasSinglePhaseField = base.solution.expectedFields.some((field) => field.expectedAssemblage.length === 1
    && field.expectedAssemblage[0] === originalRightPhase.id);
  const originalRightGroupId = originalRightPhase.compositionGroupId;
  const inventory: PhaseDefinition[] = base.puzzle.phases.map((phase) => {
    if (appendedSegmentCount === 0) return phase;
    if (phase.id === originalRightPhase.id) return {
      ...phase,
      id: seamPhaseId,
      kind: phase.kind === "line-compound" || !originalRightHasSinglePhaseField ? "line-compound" : "intermediate-solid-solution",
      compositionGroupId: originalRightPhase.id,
    };
    if (originalRightGroupId && phase.compositionGroupId === originalRightGroupId) return { ...phase, compositionGroupId: originalRightPhase.id };
    return phase;
  });

  const segments: ComposedSegment[] = [];
  const boundaryPhases: Array<{ x: number; phaseId: string; groupId: string; peakRoleId: string }> = [];
  if (appendedSegmentCount > 0) {
    const rightEdgePoints = solution.points.filter((item) => Math.abs(item.point.compositionBPercent - seamX) < .001);
    const seamPeak = [...rightEdgePoints].sort((a, b) => b.point.temperatureCelsius - a.point.temperatureCelsius)[0];
    if (!seamPeak) throw new Error(`${solution.puzzleId} cannot find the scaled kernel seam.`);
    boundaryPhases.push({ x: seamX, phaseId: seamPhaseId, groupId: originalRightPhase.id, peakRoleId: seamPeak.roleId });

    for (let boundaryIndex = 1; boundaryIndex <= appendedSegmentCount; boundaryIndex += 1) {
      const finalBoundary = boundaryIndex === appendedSegmentCount;
      const x = seamX + boundaryIndex / appendedSegmentCount * (100 - seamX);
      const phaseId = finalBoundary ? rightTerminalPhaseId : takeSolidId();
      const groupId = finalBoundary ? "right-terminal" : phaseId;
      const peakRoleId = finalBoundary ? "b-melt-composed" : `${groupId}-peak-composed`;
      const peakT = integer(random, 900, 1050, 10);
      solution.points.push({ roleId: peakRoleId, point: point(x, peakT) });
      boundaryPhases.push({ x, phaseId, groupId, peakRoleId });
      if (finalBoundary) inventory.push({ id: phaseId, symbol: "β", name: "Beta", kind: "terminal-solid", required: true });
      else inventory.push({ id: phaseId, symbol: "γ", name: "Composed intermediate", kind: "line-compound", required: true, compositionGroupId: groupId });
    }

    for (let segmentIndex = 0; segmentIndex < appendedSegmentCount; segmentIndex += 1) {
      const left = boundaryPhases[segmentIndex]; const right = boundaryPhases[segmentIndex + 1];
      let eutecticT = integer(random, 340, 510, 10);
      const occupiedLeftTemperatures = new Set(solution.points.filter((item) => Math.abs(item.point.compositionBPercent - left.x) < .001)
        .map((item) => item.point.temperatureCelsius));
      while (occupiedLeftTemperatures.has(eutecticT)) eutecticT += 5;
      const eutecticX = left.x + (right.x - left.x) * integer(random, 38, 62) / 100;
      const leftRole = `${left.groupId}-eutectic-right-${segmentIndex}`;
      const eutecticRole = `composed-eutectic-${segmentIndex}`;
      const rightRole = `${right.groupId}-eutectic-left-${segmentIndex}`;
      solution.points.push(
        { roleId: leftRole, point: point(left.x, eutecticT) },
        { roleId: eutecticRole, point: point(eutecticX, eutecticT) },
        { roleId: rightRole, point: point(right.x, eutecticT) },
      );
      solution.curves.push(
        { type: "curve", startRoleId: left.peakRoleId, endRoleId: eutecticRole, recommendedControl: bowedControl(point(eutecticX, eutecticT), point(left.x, solution.points.find((item) => item.roleId === left.peakRoleId)!.point.temperatureCelsius)), semanticRole: `composed-liquidus-left-${segmentIndex}` },
        { type: "curve", startRoleId: right.peakRoleId, endRoleId: eutecticRole, recommendedControl: bowedControl(point(eutecticX, eutecticT), point(right.x, solution.points.find((item) => item.roleId === right.peakRoleId)!.point.temperatureCelsius)), semanticRole: `composed-liquidus-right-${segmentIndex}` },
      );
      solution.invariants.push({
        type: "invariant-horizontal", startRoleId: leftRole, endRoleId: rightRole, interiorRoleIds: [eutecticRole],
        temperatureCelsius: eutecticT, expectedAssemblage: [topLiquidPhaseId, left.phaseId, right.phaseId], reactionType: "eutectic",
        incidence: { above: [[topLiquidPhaseId, left.phaseId], [topLiquidPhaseId, right.phaseId]], below: [[left.phaseId, right.phaseId]] },
      });
      segments.push({ index: segmentIndex, leftX: left.x, rightX: right.x, leftPhaseId: left.phaseId, rightPhaseId: right.phaseId, eutecticX, eutecticT });
    }
  }

  const solidModules: ComposedSolidModule[] = [];
  const requestedSolidModules = Math.min(appendedSegmentCount, solidModuleCount);
  const availableSegments = [...segments].sort(() => random() - .5).slice(0, requestedSolidModules);
  const solidTypes: Array<ComposedSolidModule["reactionType"]> = ["eutectoid", "monotectoid"];
  availableSegments.forEach((segment, moduleIndex) => {
    const reactionType = solidTypes[(seed + moduleIndex) % solidTypes.length];
    const parentPhaseId = takeSolidId();
    const parentX = (segment.leftX + segment.rightX) / 2;
    const temperature = Math.max(110, segment.eutecticT - integer(random, 150, 220, 10));
    const apexT = segment.eutecticT - 45;
    const leftRole = `composed-${reactionType}-left-${moduleIndex}`;
    const parentRole = `${parentPhaseId}-${reactionType}-${moduleIndex}`;
    const rightRole = `composed-${reactionType}-right-${moduleIndex}`;
    solution.points.push(
      { roleId: leftRole, point: point(segment.leftX, temperature) },
      { roleId: parentRole, point: point(parentX, temperature) },
      { roleId: rightRole, point: point(segment.rightX, temperature) },
    );
    let verticalCurveId: string | undefined;
    if (reactionType === "peritectoid") {
      const lowRole = `${parentPhaseId}-low-${moduleIndex}`;
      solution.points.push({ roleId: lowRole, point: point(parentX, 0) });
      verticalCurveId = `generated-curve:${solution.curves.length}`;
      solution.curves.push({ type: "curve", startRoleId: lowRole, endRoleId: parentRole, recommendedControl: point(parentX, temperature / 2), semanticRole: `${parentPhaseId}-peritectoid-product-line` });
    } else {
      const apexRole = `${parentPhaseId}-apex-${moduleIndex}`;
      solution.points.push({ roleId: apexRole, point: point(parentX, apexT) });
      solution.curves.push(
        { type: "curve", startRoleId: leftRole, endRoleId: apexRole, recommendedControl: point(parentX - (segment.rightX - segment.leftX) * .18, apexT - 12), semanticRole: `${reactionType}-left-boundary-${moduleIndex}` },
        { type: "curve", startRoleId: apexRole, endRoleId: rightRole, recommendedControl: point(parentX + (segment.rightX - segment.leftX) * .18, apexT - 12), semanticRole: `${reactionType}-right-boundary-${moduleIndex}` },
      );
      verticalCurveId = `generated-curve:${solution.curves.length}`;
      solution.curves.push({ type: "curve", startRoleId: parentRole, endRoleId: apexRole, recommendedControl: point(parentX, (temperature + apexT) / 2), semanticRole: `${parentPhaseId}-${reactionType}-parent-line` });
    }
    const decomposition = reactionType !== "peritectoid";
    solution.invariants.push({
      type: "invariant-horizontal", startRoleId: leftRole, endRoleId: rightRole, interiorRoleIds: [parentRole],
      temperatureCelsius: temperature, expectedAssemblage: [segment.leftPhaseId, parentPhaseId, segment.rightPhaseId], reactionType,
      incidence: decomposition
        ? { above: [[segment.leftPhaseId, parentPhaseId], [parentPhaseId, segment.rightPhaseId]], below: [[segment.leftPhaseId, segment.rightPhaseId]] }
        : { above: [[segment.leftPhaseId, segment.rightPhaseId]], below: [[segment.leftPhaseId, parentPhaseId], [parentPhaseId, segment.rightPhaseId]] },
    });
    inventory.push({ id: parentPhaseId, symbol: "γ", name: `${reactionType} intermediate`, kind: "line-compound", required: true, compositionGroupId: parentPhaseId });
    solidModules.push({ segmentIndex: segment.index, reactionType, parentPhaseId, parentX, temperature, verticalCurveId });
  });

  boundaryPhases.slice(0, -1).forEach((boundary) => {
    const bottomRole = `${boundary.groupId}-composed-bottom`;
    if (!solution.points.some((item) => Math.abs(item.point.compositionBPercent - boundary.x) < .001 && item.point.temperatureCelsius === 0)) {
      solution.points.push({ roleId: bottomRole, point: point(boundary.x, 0) });
    }
    const boundaryPoints = solution.points
      .filter((item) => Math.abs(item.point.compositionBPercent - boundary.x) < .001)
      .sort((a, b) => a.point.temperatureCelsius - b.point.temperatureCelsius)
      .filter((item, index, items) => index === 0 || item.point.temperatureCelsius !== items[index - 1].point.temperatureCelsius);
    for (let pointIndex = 1; pointIndex < boundaryPoints.length; pointIndex += 1) {
      const low = boundaryPoints[pointIndex - 1]; const high = boundaryPoints[pointIndex];
      solution.curves.push({ type: "curve", startRoleId: low.roleId, endRoleId: high.roleId, recommendedControl: point(boundary.x, (low.point.temperatureCelsius + high.point.temperatureCelsius) / 2), semanticRole: `${boundary.groupId}-composed-line-${pointIndex}` });
    }
  });

  solution.expectedFields = deriveExpectedFields(solution, (label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: "composed-liquid", phases: [topLiquidPhaseId] };
    if (appendedSegmentCount === 0 || label.compositionBPercent < seamX - .001) {
      const local = point(label.compositionBPercent / xScale, label.temperatureCelsius);
      const region = baseRegions.find((candidate) => pointInPolygon(local, candidate.polygon));
      if (!region?.field) throw new Error(`${solution.puzzleId} cannot map a kernel field at ${local.compositionBPercent}, ${local.temperatureCelsius}.`);
      return { role: `kernel-${region.field.role}`, phases: remapAssemblage(region.field.expectedAssemblage), texture: region.field.texture };
    }
    const segment = segments.find((candidate) => label.compositionBPercent >= candidate.leftX - .001 && label.compositionBPercent <= candidate.rightX + .001) ?? segments.at(-1)!;
    if (label.temperatureCelsius > segment.eutecticT) return label.compositionBPercent < segment.eutecticX
      ? { role: `segment-${segment.index}-liquid-left`, phases: [topLiquidPhaseId, segment.leftPhaseId] }
      : { role: `segment-${segment.index}-liquid-right`, phases: [topLiquidPhaseId, segment.rightPhaseId] };
    const module = solidModules.find((candidate) => candidate.segmentIndex === segment.index);
    if (module?.reactionType === "peritectoid" && label.temperatureCelsius < module.temperature) return label.compositionBPercent < module.parentX
      ? { role: `segment-${segment.index}-left-product`, phases: [segment.leftPhaseId, module.parentPhaseId] }
      : { role: `segment-${segment.index}-right-product`, phases: [module.parentPhaseId, segment.rightPhaseId] };
    if (module && module.reactionType !== "peritectoid" && module.verticalCurveId && boundaries.has(module.verticalCurveId)) return label.compositionBPercent < module.parentX
      ? { role: `segment-${segment.index}-left-parent`, phases: [segment.leftPhaseId, module.parentPhaseId] }
      : { role: `segment-${segment.index}-parent-right`, phases: [module.parentPhaseId, segment.rightPhaseId] };
    return { role: `segment-${segment.index}-solid-pair`, phases: [segment.leftPhaseId, segment.rightPhaseId] };
  });

  if (((seed >>> 4) & 1) === 1) {
    solution.points = solution.points.map((item) => ({ ...item, point: point(100 - item.point.compositionBPercent, item.point.temperatureCelsius) }));
    solution.curves = solution.curves.map((curve) => ({
      ...curve,
      recommendedControl: point(100 - curve.recommendedControl.compositionBPercent, curve.recommendedControl.temperatureCelsius),
    }));
    solution.invariants = solution.invariants.map((invariant) => ({
      ...invariant,
      startRoleId: invariant.endRoleId,
      endRoleId: invariant.startRoleId,
    }));
    solution.expectedFields = solution.expectedFields.map((field) => ({
      ...field,
      witnessPoint: point(100 - field.witnessPoint.compositionBPercent, field.witnessPoint.temperatureCelsius),
    }));
  }

  const title = `${difficulty === "hard" ? "Large" : "Composed"} rule-generated binary system`;
  const puzzle = puzzleFrom(seed, difficulty, title, solution, requiredInvariantsFor(solution), inventory);
  return { seed, difficulty, family: "rule-composed", solution, puzzle };
}

function generateRuleComposedRound(seed: number, difficulty: "normal" | "hard"): GeneratedRound {
  const featuredFeature = COMPOSABLE_BINARY_FEATURES[seed % COMPOSABLE_BINARY_FEATURES.length];
  const kernel = featureKernel(seed, difficulty, featuredFeature);
  const targetIntermediates = difficulty === "hard"
    ? SPATIAL_HARD_FEATURES.has(featuredFeature) ? 3 : 4 + ((seed >>> 3) & 1)
    : Math.max(kernel.puzzle.intermediateCompositions.length, 1 + ((seed >>> 3) & 1));
  const desiredSolidModules = difficulty === "hard" && !SPATIAL_HARD_FEATURES.has(featuredFeature) ? 2 : 1;
  let lastViolations = "no candidate was audited";
  for (let solidModuleCount = desiredSolidModules; solidModuleCount >= 0; solidModuleCount -= 1) {
    const candidate = expandReactionKernel(kernel, seed, difficulty, targetIntermediates, solidModuleCount);
    const audit = auditPhaseEquilibria(candidate.puzzle, candidate.solution);
    if (audit.valid) return { ...candidate, featuredFeature };
    lastViolations = audit.violations.map((violation) => `${violation.ruleId}[${violation.elementIds.join("|")}]`).join(", ");
  }
  throw new Error(`${difficulty} seed ${seed} could not satisfy the ${featuredFeature} feature grammar (${lastViolations}).`);
}

const REACTION_FEATURE_IDS: Record<ComposableInvariantType, BinaryPuzzleFeature> = {
  eutectic: "eutectic-point",
  peritectic: "peritectic-point",
  eutectoid: "eutectoid-point",
  peritectoid: "peritectoid-point",
  catatectic: "catatectic-point",
  monotectoid: "monotectoid-point",
  monotectic: "monotectic-point",
  syntectic: "syntectic-point",
};

export function detectBinaryFeatures(puzzle: PuzzleDefinition, solution: HiddenSolution): BinaryFeatureCounts {
  const counts = Object.fromEntries(BINARY_PUZZLE_FEATURES.map((feature) => [feature, 0])) as BinaryFeatureCounts;
  for (const invariant of solution.invariants) {
    const feature = REACTION_FEATURE_IDS[invariant.reactionType as ComposableInvariantType];
    if (feature) counts[feature] += 1;
  }

  const pointByRole = new Map(solution.points.map((item) => [item.roleId, item.point]));
  const roles = solution.points.map((item) => item.roleId);
  const semantics = solution.curves.map((curve) => curve.semanticRole ?? "");
  const hasSemantic = (fragment: string) => semantics.some((semantic) => semantic.includes(fragment));
  const simpleEutectics = solution.invariants.filter((invariant) => {
    const endpoints = new Set([invariant.startRoleId, invariant.endRoleId]);
    return invariant.reactionType === "eutectic" && endpoints.has("left-eut") && endpoints.has("right-eut");
  });
  counts["simple-eutectic"] = simpleEutectics.length;
  counts["degenerate-eutectic"] = simpleEutectics.filter((invariant) => {
    const start = pointByRole.get(invariant.startRoleId);
    const end = pointByRole.get(invariant.endRoleId);
    const interior = pointByRole.get(invariant.interiorRoleIds[0]);
    if (!start || !end || !interior || end.compositionBPercent === start.compositionBPercent) return false;
    const ratio = (interior.compositionBPercent - start.compositionBPercent) / (end.compositionBPercent - start.compositionBPercent);
    return ratio <= .1 || ratio >= .9;
  }).length;

  if (hasSemantic("liquid-immiscibility") || hasSemantic("immiscibility-left")) counts["liquid-immiscibility"] = 1;
  if (hasSemantic("spinodal") && (hasSemantic("liquid-immiscibility") || hasSemantic("immiscibility"))) {
    counts["liquid-spinodal"] = 1;
  }
  if (hasSemantic("metastable")) counts["metastable-immiscibility"] = 1;
  if (hasSemantic("solid-spinodal")) counts["solid-spinodal"] = 1;
  if (hasSemantic("solid-miscibility")) counts["solid-miscibility-gap"] = 1;
  if (roles.some((role) => role === "dome-peak" || role === "solid-consolute")) counts["consolute-point"] += 1;
  if (hasSemantic("complete-solution") || hasSemantic("maximum-melting") || hasSemantic("minimum-melting")) counts["complete-solid-solution"] = 1;
  if (hasSemantic("subsolidus-polymorph")) counts["subsolidus-polymorphism"] = 1;
  if (hasSemantic("supersolidus-polymorph")) counts["supersolidus-polymorphism"] = 1;
  if (hasSemantic("superlattice")) counts.superlattice = 1;
  if (hasSemantic("solvus") && !hasSemantic("solid-miscibility")) counts["partial-miscibility"] = Math.max(1, counts["partial-miscibility"]);
  if (hasSemantic("secondary-solution")) counts["secondary-solution"] = 1;
  if (hasSemantic("maximum-melting")) counts["maximum-melting"] = 1;
  if (hasSemantic("minimum-melting")) counts["minimum-melting"] = 1;

  const hasCompoundLine = hasSemantic("compound-line");
  const hasPeritectic = solution.invariants.some((invariant) => invariant.reactionType === "peritectic");
  const hasCatatectic = solution.invariants.some((invariant) => invariant.reactionType === "catatectic");
  if (hasCompoundLine && roles.some((role) => role.endsWith("-peak"))) {
    counts["congruent-melting"] = 1;
    counts["congruent-compound"] = 1;
  }
  if (hasCompoundLine && hasPeritectic) counts["incongruent-compound"] = 1;
  if (hasCompoundLine && (hasPeritectic || hasCatatectic)) counts["compound-stability"] = 1;

  // Gas-bearing Notes concepts are intentionally absent: the playable model
  // requires one condensed homogeneous liquid phase across the complete top edge.
  if (puzzle.phases.some((phase) => /\bgas\b/i.test(`${phase.id} ${phase.name} ${phase.symbol}`))) {
    throw new Error(`${solution.puzzleId} introduced a gas phase into the condensed T-X feature audit.`);
  }
  return counts;
}

function assertFeaturedFeatureVisibility(round: GeneratedRound): void {
  if (round.difficulty !== "hard" || round.featuredFeature !== "partial-miscibility") return;
  const pointByRole = new Map(round.solution.points.map((item) => [item.roleId, item.point]));
  const solvusSpans = round.solution.curves
    .filter((curve) => curve.semanticRole === "solvus-left" || curve.semanticRole === "solvus-right")
    .map((curve) => {
      const start = pointByRole.get(curve.startRoleId);
      const end = pointByRole.get(curve.endRoleId);
      return start && end ? Math.abs(end.compositionBPercent - start.compositionBPercent) : 0;
    });
  const terminalSolutionFields = round.solution.expectedFields.filter((field) =>
    field.texture === "partial-solubility" && field.expectedAssemblage.length === 1,
  );
  if (solvusSpans.length !== 2 || solvusSpans.some((span) => span < 6) || terminalSolutionFields.length !== 2) {
    throw new Error(`${round.solution.puzzleId} does not give both partial-solubility terminal fields enough visible composition width.`);
  }
}

function annotateRound(round: GeneratedRound): GeneratedRound {
  assertPhaseEquilibria(round.puzzle, round.solution);
  assertFeaturedFeatureVisibility(round);
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
  if (topField?.expectedAssemblage[0] !== "L" || topPhase?.kind !== "liquid" || topPhase.symbol !== "L") {
    const assemblage = topField?.expectedAssemblage.join(" + ") ?? "unmapped";
    throw new Error(`${round.solution.puzzleId} must begin with the homogeneous L field at the top edge; found ${assemblage}.`);
  }
  const intermediatePhaseCount = round.puzzle.intermediateCompositions.length;
  const invariantCriticalRoles = new Set(round.solution.invariants.flatMap((item) => item.interiorRoleIds));
  const nonInvariantCriticalRoles = round.solution.points.filter((item) =>
    !invariantCriticalRoles.has(item.roleId)
    && (item.roleId === "critical" || item.roleId === "dome-peak" || item.roleId === "order-critical"
      || item.roleId === "solid-consolute" || item.roleId === "melting-extremum"),
  );
  const reactionTypes = new Set<string>(round.solution.invariants.map((item) => item.reactionType));
  if (["liquid-spinodal", "subsolidus-polymorph", "supersolidus-polymorph", "superlattice"].includes(round.family)) reactionTypes.add(round.family);
  return {
    ...round,
    reactionTypes: [...reactionTypes],
    featureCounts: detectBinaryFeatures(round.puzzle, round.solution),
    intermediatePhaseCount,
    criticalPointCount: invariantCriticalRoles.size + nonInvariantCriticalRoles.length,
    layoutQualityScore: Math.min(100, Math.round(minimumArea / 4)),
  };
}

export function generateRound(rawSeed: number, difficulty: Difficulty = "normal"): GeneratedRound {
  const seed = rawSeed >>> 0;
  let round: GeneratedRound;
  if (difficulty === "easy") {
    const family = seed % 6;
    if (family === 0) round = generateCompound(seed, "easy");
    else if (family === 1) round = generateIncongruentCompound(seed, "easy");
    else if (family === 2) round = generateLimited(seed, "easy");
    else if (family === 3) round = generateSimple(seed);
    else if (family === 4) round = generatePeritectoidSystem(seed, "easy");
    else round = generateSubsolidusPolymorph(seed, "easy");
  } else if (difficulty === "hard") {
    round = generateRuleComposedRound(seed, "hard");
  } else {
    round = generateRuleComposedRound(seed, "normal");
  }
  return annotateRound(round);
}

export function generateEutecticRound(rawSeed: number): GeneratedRound {
  return annotateRound(generateLimited(rawSeed >>> 0));
}

export function createPuzzleSeed(): number {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) return crypto.getRandomValues(new Uint32Array(1))[0];
  return Math.floor(Math.random() * 0x100000000) >>> 0;
}
