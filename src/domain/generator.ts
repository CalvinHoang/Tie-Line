import { extractFaces } from "../canvas/face-extraction";
import { pointInPolygon, polygonArea } from "./geometry";
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
  | "eutectoid"
  | "monotectic"
  | "monotectoid"
  | "inverse-peritectic"
  | "liquid-spinodal"
  | "solid-spinodal"
  | "peritectic"
  | "peritectoid"
  | "syntectic"
  | "subsolidus-polymorph"
  | "supersolidus-polymorph"
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
  classify: (label: LogicalPoint, boundaryIds: Set<string>) => { role: string; phases: string[] },
  expectedCount: number,
): ExpectedFieldSpec[] {
  const { points, geometry } = generatedGeometry(solution);
  const fields = extractFaces(points, geometry).map((cell) => {
    const match = classify(cell.labelPoint, new Set(cell.boundary.map((item) => item.geometryId)));
    return { role: match.role, expectedAssemblage: match.phases, witnessPoint: cell.labelPoint };
  });
  if (fields.length !== expectedCount) throw new Error(`${solution.puzzleId} produced ${fields.length} fields; expected ${expectedCount}.`);
  return fields;
}

const phases = (compound = false): PhaseDefinition[] => [
  { id: "L", symbol: "L", name: "Liquid", kind: "liquid", required: true },
  { id: "alpha", symbol: "α", name: "Alpha", kind: "terminal-solid", required: true },
  ...(compound ? [{ id: "gamma", symbol: "γ", name: "Gamma compound", kind: "line-compound" as const, required: true }] : []),
  { id: "beta", symbol: "β", name: "Beta", kind: "terminal-solid", required: true },
];

function puzzleFrom(
  seed: number,
  difficulty: Difficulty,
  familyLabel: string,
  solution: HiddenSolution,
  requiredInvariants: RequiredInvariantSpec[],
  phaseInventory?: PhaseDefinition[],
): PuzzleDefinition {
  const compound = solution.points.some((item) => item.roleId === "gamma-peak");
  return {
    schemaVersion: "tie-line-labels-2",
    id: solution.puzzleId,
    title: familyLabel,
    compositionMinPercentB: 0,
    compositionMaxPercentB: 100,
    temperatureMinCelsius: 0,
    temperatureMaxCelsius: 1100,
    phases: phaseInventory ?? phases(compound),
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
      ...(solution.invariants.length > 0 ? [{ id: "instruction-invariant", compactText: `Label ${solution.invariants.length === 1 ? "the invariant line" : `all ${solution.invariants.length} invariant lines`}` }] : []),
      { id: "instruction-mode", compactText: `${difficulty[0].toUpperCase()}${difficulty.slice(1)} · Seed ${seed}` },
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

function generateSimple(seed: number): GeneratedRound {
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
  const requiredInvariants = [{ startRoleId: "left-eut", endRoleId: "right-eut", interiorRoleIds: ["eutectic"], expectedAssemblage: ["L", "alpha", "beta"], reactionType: "eutectic" }];
  return { seed, difficulty: "easy", family: "simple-eutectic", solution, puzzle: puzzleFrom(seed, "easy", "Simple eutectic", solution, requiredInvariants) };
}

function generateLimited(seed: number): GeneratedRound {
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
    puzzleId: `normal-limited-eutectic-v2-${seed}`,
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
    { role: "liquid-beta", boundaries: [1, 3], phases: ["L", "beta"] }, { role: "alpha", boundaries: [2, 4], phases: ["alpha"] },
    { role: "beta", boundaries: [3, 5], phases: ["beta"] }, { role: "alpha-beta", boundaries: [4, 5], phases: ["alpha", "beta"] },
  ];
  solution.expectedFields = deriveExpectedFields(solution, (_label, boundaries) => {
    const match = rules.find((rule) => rule.boundaries.every((index) => boundaries.has(`generated-curve:${index}`)));
    if (!match) throw new Error("Limited eutectic field could not be classified.");
    return match;
  }, 6);
  const requiredInvariants = [{ startRoleId: "alpha-eut", endRoleId: "beta-eut", interiorRoleIds: ["eutectic"], expectedAssemblage: ["L", "alpha", "beta"], reactionType: "eutectic" }];
  return { seed, difficulty: "normal", family: "limited-eutectic", solution, puzzle: puzzleFrom(seed, "normal", "Limited-solubility eutectic", solution, requiredInvariants) };
}

function generateCompound(seed: number, difficulty: Difficulty = "hard"): GeneratedRound {
  const random = randomForSeed(seed);
  const gx = integer(random, 43, 57);
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

function generateIncongruentCompound(seed: number, difficulty: Difficulty = "easy", inverse = false): GeneratedRound {
  const random = randomForSeed(seed ^ 0x7f4a11);
  const gx = integer(random, 42, 56);
  const ex = integer(random, 16, gx - 14);
  const px = integer(random, ex + 7, gx - 6);
  const eutecticT = integer(random, 390, 480, 10);
  const peritecticT = eutecticT + integer(random, 150, 240, 10);
  const leftMelt = integer(random, peritecticT + 210, 1040, 10);
  const rightMelt = integer(random, peritecticT + 170, 1020, 10);
  const reactionType = inverse ? "inverse-peritectic" : "peritectic";
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
  const title = inverse ? "Incongruent compound with inverse peritectic" : "Incongruent compound with peritectic";
  return { seed, difficulty, family: inverse ? "inverse-peritectic" : "peritectic", solution, puzzle: puzzleFrom(seed, difficulty, title, solution, requiredInvariants) };
}

function generateCompoundPolymorph(
  seed: number,
  difficulty: Difficulty,
  supersolidus: boolean,
  solidReaction: "subsolidus-polymorphism" | "eutectoid" | "peritectoid" = "subsolidus-polymorphism",
): GeneratedRound {
  const base = generateCompound(seed, difficulty);
  const solution = structuredClone(base.solution);
  solution.invariants = solution.invariants.filter((item) => item.startRoleId === "left-e1");
  const byRole = (roleId: string) => solution.points.find((item) => item.roleId === roleId)!.point;
  const gx = byRole("gamma-peak").compositionBPercent;
  const peakT = byRole("gamma-peak").temperatureCelsius;
  const e1x = byRole("e1").compositionBPercent;
  const e1t = byRole("e1").temperatureCelsius;
  const e2t = byRole("e2").temperatureCelsius;
  const deltaPhase: PhaseDefinition = { id: "delta", symbol: "δ", name: "Delta structure", kind: "line-compound", required: true };

  if (supersolidus) {
    const transitionT = Math.round((Math.max(e1t, e2t) + peakT) / 20) * 10;
    const transitionX = Math.round(e1x + (gx - e1x) * .62);
    solution.points.push(
      { roleId: "supersolidus-left", point: point(transitionX, transitionT) },
      { roleId: "gamma-supersolidus", point: point(gx, transitionT) },
    );
    solution.curves = solution.curves.filter((curve) => !(
      (curve.startRoleId === "gamma-peak" && curve.endRoleId === "e1")
      || (curve.startRoleId === "gamma-e2" && curve.endRoleId === "gamma-peak")
    ));
    solution.curves.push(
      { type: "curve", startRoleId: "e1", endRoleId: "supersolidus-left", recommendedControl: bowedControl(point(e1x, e1t), point(transitionX, transitionT), .72), semanticRole: "liquidus-gamma-left-low" },
      { type: "curve", startRoleId: "supersolidus-left", endRoleId: "gamma-peak", recommendedControl: bowedControl(point(transitionX, transitionT), point(gx, peakT), 1), semanticRole: "liquidus-gamma-left-high" },
      { type: "curve", startRoleId: "gamma-e2", endRoleId: "gamma-supersolidus", recommendedControl: point(gx, (e2t + transitionT) / 2), semanticRole: "compound-line-upper-low" },
      { type: "curve", startRoleId: "gamma-supersolidus", endRoleId: "gamma-peak", recommendedControl: point(gx, (transitionT + peakT) / 2), semanticRole: "compound-line-upper-high" },
    );
    solution.invariants.push({ type: "invariant-horizontal", startRoleId: "supersolidus-left", endRoleId: "gamma-supersolidus", interiorRoleIds: [], temperatureCelsius: transitionT, expectedAssemblage: ["L", "gamma", "delta"], reactionType: "supersolidus-polymorphism" });
    solution.puzzleId = `${difficulty}-supersolidus-compound-v3-${seed}`;
    solution.expectedFields = deriveExpectedFields(solution, (label, boundaries) => {
      if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
      if (label.compositionBPercent < gx && label.temperatureCelsius < e1t) return { role: "alpha-gamma", phases: ["alpha", "gamma"] };
      if (label.compositionBPercent > gx) return { role: "gamma-beta", phases: ["gamma", "beta"] };
      if (label.compositionBPercent > transitionX && label.compositionBPercent < gx && label.temperatureCelsius > transitionT) return { role: "liquid-delta", phases: ["L", "delta"] };
      if (label.compositionBPercent < gx) return label.compositionBPercent < e1x ? { role: "liquid-alpha", phases: ["L", "alpha"] } : { role: "liquid-gamma-left", phases: ["L", "gamma"] };
      return { role: "gamma-beta", phases: ["gamma", "beta"] };
    }, 6);
  } else {
    const transitionT = Math.round(e1t * .46 / 10) * 10;
    solution.points.push(
      { roleId: "left-subsolidus", point: point(0, transitionT) },
      { roleId: "gamma-subsolidus", point: point(gx, transitionT) },
    );
    solution.curves = solution.curves.filter((curve) => !(curve.startRoleId === "gamma-low" && curve.endRoleId === "gamma-e1"));
    solution.curves.push(
      { type: "curve", startRoleId: "gamma-low", endRoleId: "gamma-subsolidus", recommendedControl: point(gx, transitionT / 2), semanticRole: "compound-line-lower-ordered" },
      { type: "curve", startRoleId: "gamma-subsolidus", endRoleId: "gamma-e1", recommendedControl: point(gx, (transitionT + e1t) / 2), semanticRole: "compound-line-lower-parent" },
    );
    solution.invariants.push({ type: "invariant-horizontal", startRoleId: "left-subsolidus", endRoleId: "gamma-subsolidus", interiorRoleIds: [], temperatureCelsius: transitionT, expectedAssemblage: ["alpha", "gamma", "delta"], reactionType: solidReaction });
    solution.puzzleId = `${difficulty}-${solidReaction}-compound-v3-${seed}`;
    const formation = solidReaction === "peritectoid";
    solution.expectedFields = deriveExpectedFields(solution, (label, boundaries) => {
      if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
      if (label.compositionBPercent < gx && label.temperatureCelsius < transitionT) return formation ? { role: "alpha-gamma", phases: ["alpha", "gamma"] } : { role: "alpha-delta", phases: ["alpha", "delta"] };
      if (label.compositionBPercent < gx && label.temperatureCelsius < e1t) return formation ? { role: "alpha-delta", phases: ["alpha", "delta"] } : { role: "alpha-gamma", phases: ["alpha", "gamma"] };
      if (label.compositionBPercent > gx) return { role: "gamma-beta", phases: ["gamma", "beta"] };
      if (label.compositionBPercent < gx) return label.compositionBPercent < e1x ? { role: "liquid-alpha", phases: ["L", "alpha"] } : { role: "liquid-gamma-left", phases: ["L", "gamma"] };
      return { role: "gamma-beta", phases: ["gamma", "beta"] };
    }, 6);
  }

  const requiredInvariants = solution.invariants.map((item) => ({ startRoleId: item.startRoleId, endRoleId: item.endRoleId, interiorRoleIds: item.interiorRoleIds, expectedAssemblage: item.expectedAssemblage, reactionType: item.reactionType }));
  const title = supersolidus ? "Supersolidus polymorphism of an intermediate compound"
    : solidReaction === "eutectoid" ? "Intermediate-compound eutectoid"
      : solidReaction === "peritectoid" ? "Intermediate-compound peritectoid"
        : "Subsolidus polymorphism of an intermediate compound";
  const family: DiagramFamily = supersolidus ? "supersolidus-polymorph"
    : solidReaction === "eutectoid" ? "eutectoid"
      : solidReaction === "peritectoid" ? "peritectoid"
        : "subsolidus-polymorph";
  return {
    seed,
    difficulty,
    family,
    solution,
    puzzle: puzzleFrom(seed, difficulty, title, solution, requiredInvariants, [...phases(true), deltaPhase]),
  };
}

function generateTripleEutectic(seed: number): GeneratedRound {
  const random = randomForSeed(seed ^ 0x3ea9c7);
  const g1x = integer(random, 29, 36);
  const g2x = integer(random, 64, 71);
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
    { id: "gamma", symbol: "γ", name: "Gamma intermediate", kind: "line-compound", required: true },
    { id: "delta", symbol: "δ", name: "Delta intermediate", kind: "line-compound", required: true },
    { id: "beta", symbol: "β", name: "Beta", kind: "terminal-solid", required: true },
  ];
  const requiredInvariants = solution.invariants.map((item) => ({ startRoleId: item.startRoleId, endRoleId: item.endRoleId, interiorRoleIds: item.interiorRoleIds, expectedAssemblage: item.expectedAssemblage, reactionType: item.reactionType }));
  return { seed, difficulty: "hard", family: "triple-eutectic", solution, puzzle: puzzleFrom(seed, "hard", "Two intermediate compounds with three eutectics", solution, requiredInvariants, inventory) };
}

function generateSuperlatticeCompound(seed: number): GeneratedRound {
  const base = generateCompound(seed, "normal");
  const solution = structuredClone(base.solution);
  solution.invariants = solution.invariants.filter((item) => item.startRoleId === "left-e1");
  const byRole = (roleId: string) => solution.points.find((item) => item.roleId === roleId)!.point;
  const gx = byRole("gamma-peak").compositionBPercent;
  const e1x = byRole("e1").compositionBPercent;
  const e1t = byRole("e1").temperatureCelsius;
  const leftBaseX = Math.max(7, Math.round(e1x * .38));
  const rightBaseX = Math.round(gx - (gx - e1x) * .2);
  const peakX = Math.round((leftBaseX + rightBaseX) / 2);
  const orderT = Math.round(e1t * .62 / 10) * 10;
  solution.points.push(
    { roleId: "order-left", point: point(leftBaseX, 0) },
    { roleId: "order-critical", point: point(peakX, orderT) },
    { roleId: "order-right", point: point(rightBaseX, 0) },
  );
  const firstOrderingCurveIndex = solution.curves.length;
  solution.curves.push(
    { type: "curve", startRoleId: "order-left", endRoleId: "order-critical", recommendedControl: bowedControl(point(leftBaseX, 0), point(peakX, orderT), 1, .32), semanticRole: "superlattice-left" },
    { type: "curve", startRoleId: "order-critical", endRoleId: "order-right", recommendedControl: bowedControl(point(rightBaseX, 0), point(peakX, orderT), 1, .32), semanticRole: "superlattice-right" },
  );
  solution.puzzleId = `normal-superlattice-compound-v3-${seed}`;
  solution.expectedFields = deriveExpectedFields(solution, (label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
    if (boundaries.has(`generated-curve:${firstOrderingCurveIndex}`) && boundaries.has(`generated-curve:${firstOrderingCurveIndex + 1}`)) return { role: "alpha-delta", phases: ["alpha", "delta"] };
    if (label.compositionBPercent < gx && label.temperatureCelsius < e1t) return { role: "alpha-gamma", phases: ["alpha", "gamma"] };
    if (label.compositionBPercent > gx) return { role: "gamma-beta", phases: ["gamma", "beta"] };
    return label.compositionBPercent < e1x ? { role: "liquid-alpha", phases: ["L", "alpha"] } : { role: "liquid-gamma", phases: ["L", "gamma"] };
  }, 6);
  const inventory = [...phases(true), { id: "delta", symbol: "γ′", name: "Ordered gamma superlattice", kind: "line-compound" as const, required: true }];
  const requiredInvariants = solution.invariants.map((item) => ({ startRoleId: item.startRoleId, endRoleId: item.endRoleId, interiorRoleIds: item.interiorRoleIds, expectedAssemblage: item.expectedAssemblage, reactionType: item.reactionType }));
  return { seed, difficulty: "normal", family: "superlattice", solution, puzzle: puzzleFrom(seed, "normal", "Intermediate compound with superlattice ordering", solution, requiredInvariants, inventory) };
}

function generateImmiscibleHard(seed: number, variant: "syntectic" | "monotectic" | "liquid-spinodal"): GeneratedRound {
  const spinodal = variant === "liquid-spinodal";
  const random = randomForSeed(seed ^ 0x1a2b7f);
  const gx = integer(random, 46, 54);
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
      { type: "invariant-horizontal", startRoleId: "dome-left", endRoleId: "dome-right", interiorRoleIds: ["gamma-syntectic"], temperatureCelsius: synT, expectedAssemblage: ["L1", "L2", "gamma"], reactionType: spinodal ? "spinodal-decomposition" : variant },
    ],
    expectedFields: [],
  };
  let innerLeftIndex = -1;
  if (spinodal) {
    const innerLeftX = domeLeftX + 5;
    const innerRightX = domeRightX - 5;
    const innerPeakT = domePeakT - 70;
    solution.points.push(
      { roleId: "spinodal-left", point: point(innerLeftX, synT) },
      { roleId: "spinodal-peak", point: point(gx, innerPeakT) },
      { roleId: "spinodal-right", point: point(innerRightX, synT) },
    );
    solution.invariants[2].interiorRoleIds = ["spinodal-left", "gamma-syntectic", "spinodal-right"];
    innerLeftIndex = solution.curves.length;
    solution.curves.push(
      { type: "curve", startRoleId: "spinodal-left", endRoleId: "spinodal-peak", recommendedControl: bowedControl(point(innerLeftX, synT), point(gx, innerPeakT), 1, .32), semanticRole: "spinodal-left" },
      { type: "curve", startRoleId: "spinodal-peak", endRoleId: "spinodal-right", recommendedControl: bowedControl(point(innerRightX, synT), point(gx, innerPeakT), 1, .32), semanticRole: "spinodal-right" },
    );
  }
  const domeLeftIndex = 4;
  solution.expectedFields = deriveExpectedFields(solution, (label, boundaries) => {
    if (spinodal && boundaries.has(`generated-curve:${innerLeftIndex}`) && boundaries.has(`generated-curve:${innerLeftIndex + 1}`)) return { role: "unstable-two-liquid", phases: ["L1", "L2"] };
    if (boundaries.has(`generated-curve:${domeLeftIndex}`) && boundaries.has(`generated-curve:${domeLeftIndex + 1}`)) return { role: "two-liquid", phases: ["L1", "L2"] };
    if (boundaries.has("frame-top")) return { role: "liquid", phases: ["L"] };
    if (label.compositionBPercent < gx) {
      if (label.temperatureCelsius < leftT) return { role: "alpha-gamma", phases: ["alpha", "gamma"] };
      return label.compositionBPercent < e1x ? { role: "liquid-alpha", phases: ["L", "alpha"] } : { role: "liquid-gamma-left", phases: ["L", "gamma"] };
    }
    if (label.temperatureCelsius < rightT) return { role: "gamma-beta", phases: ["gamma", "beta"] };
    return label.compositionBPercent < e2x ? { role: "liquid-gamma-right", phases: ["L", "gamma"] } : { role: "liquid-beta", phases: ["L", "beta"] };
  }, spinodal ? 9 : 8);
  const inventory: PhaseDefinition[] = [
    { id: "L", symbol: "L", name: "Homogeneous liquid", kind: "liquid", required: true },
    { id: "L1", symbol: "L₁", name: "Liquid 1", kind: "liquid", required: true },
    { id: "L2", symbol: "L₂", name: "Liquid 2", kind: "liquid", required: true },
    { id: "alpha", symbol: "α", name: "Alpha", kind: "terminal-solid", required: true },
    { id: "gamma", symbol: "γ", name: "Gamma intermediate", kind: "line-compound", required: true },
    { id: "beta", symbol: "β", name: "Beta", kind: "terminal-solid", required: true },
  ];
  const requiredInvariants = solution.invariants.map((item) => ({ startRoleId: item.startRoleId, endRoleId: item.endRoleId, interiorRoleIds: item.interiorRoleIds, expectedAssemblage: item.expectedAssemblage, reactionType: item.reactionType }));
  const title = spinodal ? "Liquid immiscibility with spinodal decomposition"
    : variant === "monotectic" ? "Liquid immiscibility with monotectic reaction"
      : "Liquid immiscibility with syntectic reaction";
  return { seed, difficulty: "hard", family: variant, solution, puzzle: puzzleFrom(seed, "hard", title, solution, requiredInvariants, inventory) };
}

function addSolidCriticalDome(base: GeneratedRound, family: "solid-spinodal" | "monotectoid"): GeneratedRound {
  const solution = structuredClone(base.solution);
  const { points: basePoints, geometry: baseGeometry } = generatedGeometry(base.solution);
  const baseCells = extractFaces(basePoints, baseGeometry);
  const gammaX = solution.points.find((item) => item.roleId === "gamma-peak")?.point.compositionBPercent ?? 50;
  const invariantFloor = Math.min(...solution.invariants.map((item) => item.temperatureCelsius));
  const leftX = Math.round(gammaX + (100 - gammaX) * .2);
  const rightX = Math.round(gammaX + (100 - gammaX) * .82);
  const peakX = Math.round((leftX + rightX) / 2);
  const peakT = Math.round(invariantFloor * .54 / 10) * 10;
  solution.points.push(
    { roleId: `${family}-left`, point: point(leftX, 0) },
    { roleId: `${family}-critical`, point: point(peakX, peakT) },
    { roleId: `${family}-right`, point: point(rightX, 0) },
  );
  const firstCurve = solution.curves.length;
  solution.curves.push(
    { type: "curve", startRoleId: `${family}-left`, endRoleId: `${family}-critical`, recommendedControl: bowedControl(point(leftX, 0), point(peakX, peakT), 1, .32), semanticRole: `${family}-left` },
    { type: "curve", startRoleId: `${family}-critical`, endRoleId: `${family}-right`, recommendedControl: bowedControl(point(rightX, 0), point(peakX, peakT), 1, .32), semanticRole: `${family}-right` },
  );
  solution.puzzleId = `hard-${family}-${base.seed}`;
  solution.expectedFields = deriveExpectedFields(solution, (label, boundaries) => {
    if (boundaries.has(`generated-curve:${firstCurve}`) && boundaries.has(`generated-curve:${firstCurve + 1}`)) {
      return family === "solid-spinodal" ? { role: "beta-beta-prime", phases: ["beta", "betaPrime"] } : { role: "gamma-beta-prime", phases: ["gamma", "betaPrime"] };
    }
    const baseCell = baseCells.find((cell) => pointInPolygon(label, cell.polygon));
    const expected = baseCell && base.solution.expectedFields.find((field) => pointInPolygon(field.witnessPoint, baseCell.polygon));
    if (!expected) throw new Error(`Could not map ${family} field to its parent topology.`);
    return { role: expected.role, phases: expected.expectedAssemblage };
  }, base.puzzle.expectedFieldCount + 1);
  const inventory = [...base.puzzle.phases, { id: "betaPrime", symbol: "β′", name: "Beta prime", kind: "terminal-solid" as const, required: true }];
  const requiredInvariants = solution.invariants.map((item) => ({ startRoleId: item.startRoleId, endRoleId: item.endRoleId, interiorRoleIds: item.interiorRoleIds, expectedAssemblage: item.expectedAssemblage, reactionType: item.reactionType }));
  return {
    seed: base.seed,
    difficulty: "hard",
    family,
    solution,
    puzzle: puzzleFrom(base.seed, "hard", family === "solid-spinodal" ? "Compound diagram with solid spinodal decomposition" : "Compound diagram with monotectoid decomposition", solution, requiredInvariants, inventory),
  };
}

function promoteNormalFamilyToHard(base: GeneratedRound): GeneratedRound {
  const promoted = addSolidCriticalDome(base, "solid-spinodal");
  return {
    ...promoted,
    family: base.family,
    puzzle: { ...promoted.puzzle, title: `${base.puzzle.title} with a solid critical point` },
  };
}

interface CriticalPhaseSpec {
  id: string;
  symbol: string;
  name: string;
  kind: PhaseDefinition["kind"];
}

interface CriticalFamilySpec {
  family: Exclude<DiagramFamily, "simple-eutectic" | "limited-eutectic" | "compound-double-eutectic">;
  title: string;
  reaction: string;
  topology: "decomposition" | "formation" | "critical-dome";
  left: CriticalPhaseSpec;
  middle: CriticalPhaseSpec;
  right: CriticalPhaseSpec;
}

const phase = (id: string, symbol: string, name: string, kind: PhaseDefinition["kind"] = "terminal-solid"): CriticalPhaseSpec => ({ id, symbol, name, kind });

const CRITICAL_FAMILIES: CriticalFamilySpec[] = [
  {
    family: "eutectoid", title: "Eutectoid", reaction: "γ → α + β", topology: "decomposition",
    left: phase("alpha", "α", "Alpha"), middle: phase("gamma", "γ", "Gamma parent"), right: phase("beta", "β", "Beta"),
  },
  {
    family: "monotectic", title: "Monotectic", reaction: "L₁ → L₂ + α", topology: "decomposition",
    left: phase("L2", "L₂", "Liquid 2", "liquid"), middle: phase("L1", "L₁", "Liquid 1", "liquid"), right: phase("alpha", "α", "Alpha"),
  },
  {
    family: "monotectoid", title: "Monotectoid", reaction: "α₁ → α₂ + β", topology: "decomposition",
    left: phase("alpha2", "α₂", "Alpha 2"), middle: phase("alpha1", "α₁", "Alpha 1"), right: phase("beta", "β", "Beta"),
  },
  {
    family: "inverse-peritectic", title: "Inverse peritectic", reaction: "α₁ → α₂ + L", topology: "decomposition",
    left: phase("alpha2", "α₂", "Alpha 2"), middle: phase("alpha1", "α₁", "Alpha 1"), right: phase("L", "L", "Liquid", "liquid"),
  },
  {
    family: "liquid-spinodal", title: "Liquid spinodal decomposition", reaction: "L → L₁ + L₂", topology: "critical-dome",
    left: phase("L1", "L₁", "Liquid 1", "liquid"), middle: phase("L", "L", "Homogeneous liquid", "liquid"), right: phase("L2", "L₂", "Liquid 2", "liquid"),
  },
  {
    family: "solid-spinodal", title: "Solid spinodal decomposition", reaction: "α → α₁ + α₂", topology: "critical-dome",
    left: phase("alpha1", "α₁", "Alpha 1"), middle: phase("alpha", "α", "Homogeneous alpha"), right: phase("alpha2", "α₂", "Alpha 2"),
  },
  {
    family: "peritectic", title: "Peritectic", reaction: "L + α → β", topology: "formation",
    left: phase("alpha", "α", "Alpha"), middle: phase("beta", "β", "Beta product"), right: phase("L", "L", "Liquid", "liquid"),
  },
  {
    family: "peritectoid", title: "Peritectoid", reaction: "α + β → γ", topology: "formation",
    left: phase("alpha", "α", "Alpha"), middle: phase("gamma", "γ", "Gamma product"), right: phase("beta", "β", "Beta"),
  },
  {
    family: "syntectic", title: "Syntectic", reaction: "L₁ + L₂ → α", topology: "formation",
    left: phase("L1", "L₁", "Liquid 1", "liquid"), middle: phase("alpha", "α", "Alpha product"), right: phase("L2", "L₂", "Liquid 2", "liquid"),
  },
];

function inventoryFor(spec: CriticalFamilySpec): PhaseDefinition[] {
  return [spec.left, spec.middle, spec.right].map((item) => ({ ...item, required: true }));
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

function generateDecomposition(seed: number, spec: CriticalFamilySpec): GeneratedRound {
  const random = randomForSeed(seed ^ 0x51f15e);
  const mx = integer(random, 34, 66);
  const invariantT = integer(random, 430, 650, 10);
  const leftHigh = integer(random, invariantT + 220, 1030, 10);
  const rightHigh = integer(random, invariantT + 220, 1030, 10);
  const solution: HiddenSolution = {
    puzzleId: `normal-${spec.family}-v3-${seed}`,
    points: [
      { roleId: "left-high", point: point(0, leftHigh) },
      { roleId: "right-high", point: point(100, rightHigh) },
      { roleId: "left-invariant", point: point(0, invariantT) },
      { roleId: "critical", point: point(mx, invariantT) },
      { roleId: "right-invariant", point: point(100, invariantT) },
    ],
    curves: [
      { type: "curve", startRoleId: "left-high", endRoleId: "critical", recommendedControl: bowedControl(point(mx, invariantT), point(0, leftHigh)), semanticRole: `${spec.family}-left` },
      { type: "curve", startRoleId: "right-high", endRoleId: "critical", recommendedControl: bowedControl(point(mx, invariantT), point(100, rightHigh)), semanticRole: `${spec.family}-right` },
    ],
    invariants: [{
      type: "invariant-horizontal",
      startRoleId: "left-invariant",
      endRoleId: "right-invariant",
      interiorRoleIds: ["critical"],
      temperatureCelsius: invariantT,
      expectedAssemblage: [spec.left.id, spec.middle.id, spec.right.id],
      reactionType: spec.family,
    }],
    expectedFields: [],
  };
  solution.expectedFields = deriveExpectedFields(solution, (_label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: `${spec.middle.id}`, phases: [spec.middle.id] };
    if (boundaries.has("frame-bottom")) return { role: `${spec.left.id}-${spec.right.id}`, phases: [spec.left.id, spec.right.id] };
    if (boundaries.has("frame-left")) return { role: `${spec.left.id}-${spec.middle.id}`, phases: [spec.left.id, spec.middle.id] };
    return { role: `${spec.middle.id}-${spec.right.id}`, phases: [spec.middle.id, spec.right.id] };
  }, 4);
  const label = `${spec.title} · ${spec.reaction}`;
  return { seed, difficulty: "normal", family: spec.family, solution, puzzle: puzzleFrom(seed, "normal", label, solution, requiredInvariantsFor(solution), inventoryFor(spec)) };
}

function generateFormation(seed: number, spec: CriticalFamilySpec): GeneratedRound {
  const random = randomForSeed(seed ^ 0xa9137d);
  const mx = integer(random, 34, 66);
  const invariantT = integer(random, 500, 720, 10);
  const lowX = integer(random, Math.max(24, mx - 10), Math.min(76, mx + 10));
  const solution: HiddenSolution = {
    puzzleId: `normal-${spec.family}-v3-${seed}`,
    points: [
      { roleId: "left-invariant", point: point(0, invariantT) },
      { roleId: "critical", point: point(mx, invariantT) },
      { roleId: "right-invariant", point: point(100, invariantT) },
      { roleId: "product-low", point: point(lowX, 0) },
    ],
    curves: [{
      type: "curve",
      startRoleId: "critical",
      endRoleId: "product-low",
      recommendedControl: point((mx + lowX) / 2, invariantT * .48),
      semanticRole: `${spec.family}-product-locus`,
    }],
    invariants: [{
      type: "invariant-horizontal",
      startRoleId: "left-invariant",
      endRoleId: "right-invariant",
      interiorRoleIds: ["critical"],
      temperatureCelsius: invariantT,
      expectedAssemblage: [spec.left.id, spec.middle.id, spec.right.id],
      reactionType: spec.family,
    }],
    expectedFields: [],
  };
  solution.expectedFields = deriveExpectedFields(solution, (_label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: `${spec.left.id}-${spec.right.id}`, phases: [spec.left.id, spec.right.id] };
    if (boundaries.has("frame-left")) return { role: `${spec.left.id}-${spec.middle.id}`, phases: [spec.left.id, spec.middle.id] };
    return { role: `${spec.middle.id}-${spec.right.id}`, phases: [spec.middle.id, spec.right.id] };
  }, 3);
  const label = `${spec.title} · ${spec.reaction}`;
  return { seed, difficulty: "normal", family: spec.family, solution, puzzle: puzzleFrom(seed, "normal", label, solution, requiredInvariantsFor(solution), inventoryFor(spec)) };
}

function generateCriticalDome(seed: number, spec: CriticalFamilySpec): GeneratedRound {
  const random = randomForSeed(seed ^ 0xd04e55);
  const leftX = integer(random, 12, 27);
  const rightX = integer(random, 73, 88);
  const peakX = integer(random, Math.max(leftX + 18, 40), Math.min(rightX - 18, 60));
  const peakT = integer(random, 600, 860, 10);
  const solution: HiddenSolution = {
    puzzleId: `normal-${spec.family}-v3-${seed}`,
    points: [
      { roleId: "left-limit", point: point(leftX, 0) },
      { roleId: "critical", point: point(peakX, peakT) },
      { roleId: "right-limit", point: point(rightX, 0) },
    ],
    curves: [
      { type: "curve", startRoleId: "left-limit", endRoleId: "critical", recommendedControl: bowedControl(point(leftX, 0), point(peakX, peakT), 1, .32), semanticRole: `${spec.family}-left-limit` },
      { type: "curve", startRoleId: "critical", endRoleId: "right-limit", recommendedControl: bowedControl(point(rightX, 0), point(peakX, peakT), 1, .32), semanticRole: `${spec.family}-right-limit` },
    ],
    invariants: [],
    expectedFields: [],
  };
  solution.expectedFields = deriveExpectedFields(solution, (_label, boundaries) => {
    if (boundaries.has("frame-top")) return { role: spec.middle.id, phases: [spec.middle.id] };
    return { role: `${spec.left.id}-${spec.right.id}`, phases: [spec.left.id, spec.right.id] };
  }, 2);
  const label = `${spec.title} · ${spec.reaction}`;
  return { seed, difficulty: "normal", family: spec.family, solution, puzzle: puzzleFrom(seed, "normal", label, solution, [], inventoryFor(spec)) };
}

function generateCriticalFamily(seed: number, spec: CriticalFamilySpec): GeneratedRound {
  if (spec.topology === "formation") return generateFormation(seed, spec);
  if (spec.topology === "critical-dome") return generateCriticalDome(seed, spec);
  return generateDecomposition(seed, spec);
}

function annotateRound(round: GeneratedRound): GeneratedRound {
  const { points, geometry } = generatedGeometry(round.solution);
  const cells = extractFaces(points, geometry);
  const minimumArea = Math.min(...cells.map((cell) => Math.abs(polygonArea(cell.polygon))));
  if (!Number.isFinite(minimumArea) || minimumArea < 35) throw new Error(`${round.solution.puzzleId} failed the minimum-field-area layout check.`);
  const hasSecondCompound = round.solution.points.some((item) => item.roleId === "delta-peak");
  const hasFirstCompound = round.solution.points.some((item) => item.roleId.startsWith("gamma-") || item.roleId === "gamma-low");
  const reactionTypes = new Set(round.solution.invariants.map((item) => item.reactionType));
  if (["superlattice", "solid-spinodal", "monotectoid", "liquid-spinodal"].includes(round.family)) reactionTypes.add(round.family);
  return {
    ...round,
    reactionTypes: [...reactionTypes],
    intermediatePhaseCount: hasSecondCompound ? 2 : hasFirstCompound ? 1 : 0,
    criticalPointCount: round.difficulty === "hard" ? 3 : 2,
    layoutQualityScore: Math.min(100, Math.round(minimumArea / 4)),
  };
}

export function generateRound(rawSeed: number, difficulty: Difficulty = "normal"): GeneratedRound {
  const seed = rawSeed >>> 0;
  let round: GeneratedRound;
  if (difficulty === "easy") {
    const family = seed % 5;
    if (family === 0) round = generateCompound(seed, "easy");
    else if (family === 1) round = generateIncongruentCompound(seed, "easy");
    else if (family === 2) round = generateCompoundPolymorph(seed, "easy", false);
    else if (family === 3) round = generateCompoundPolymorph(seed, "easy", false, "eutectoid");
    else round = generateCompoundPolymorph(seed, "easy", false, "peritectoid");
  } else if (difficulty === "hard") {
    const family = seed % 14;
    if (family === 0) round = generateTripleEutectic(seed);
    else if (family === 1) round = generateImmiscibleHard(seed, "syntectic");
    else if (family === 2) round = generateImmiscibleHard(seed, "monotectic");
    else if (family === 3) round = generateImmiscibleHard(seed, "liquid-spinodal");
    else if (family === 4) round = addSolidCriticalDome(generateCompound(seed, "hard"), "solid-spinodal");
    else if (family === 5) round = addSolidCriticalDome(generateCompound(seed, "hard"), "monotectoid");
    else round = promoteNormalFamilyToHard(generateRound(seed, "normal"));
  } else {
    const familyIndex = seed % 8;
    if (familyIndex === 0) round = generateCompound(seed, "normal");
    else if (familyIndex === 1) round = generateIncongruentCompound(seed, "normal");
    else if (familyIndex === 2) round = generateCompoundPolymorph(seed, "normal", false);
    else if (familyIndex === 3) round = generateCompoundPolymorph(seed, "normal", false, "eutectoid");
    else if (familyIndex === 4) round = generateCompoundPolymorph(seed, "normal", false, "peritectoid");
    else if (familyIndex === 5) round = generateIncongruentCompound(seed, "normal", true);
    else if (familyIndex === 6) round = generateCompoundPolymorph(seed, "normal", true);
    else round = generateSuperlatticeCompound(seed);
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
