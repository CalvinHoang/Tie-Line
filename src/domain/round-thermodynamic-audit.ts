import { REACTION_RULES } from "./phase-rules";
import type { HiddenInvariantSolution, HiddenSolution, PhaseId, PuzzleDefinition } from "./schema";
import {
  compareThermodynamicContract,
  createThermodynamicCertificate,
  type ThermodynamicContractViolation,
  type ThermodynamicPhaseModel,
} from "./thermodynamic-certificate";

/**
 * This adapter asks a deliberately bounded question: can each authored binary
 * invariant be realized by a local family of Gibbs curves with the declared
 * cooling direction? It does not fit one set of Gibbs models to the entire
 * diagram. Passing this audit is therefore necessary local evidence, not a
 * certificate of global thermodynamic realizability.
 */

export interface RoundThermodynamicViolation {
  ruleId:
    | "local-gibbs-contract-missing"
    | "local-gibbs-composition-invalid"
    | "local-gibbs-reaction-partition"
    | "local-gibbs-equilibrium-mismatch";
  invariantIndex: number;
  reactionType: HiddenInvariantSolution["reactionType"];
  message: string;
  phaseIds: PhaseId[];
  thermodynamicViolation?: ThermodynamicContractViolation;
}

export interface LocalInvariantCertificateSummary {
  invariantIndex: number;
  reactionType: HiddenInvariantSolution["reactionType"];
  temperatureCelsius: number;
  orderedPhaseIds: [PhaseId, PhaseId, PhaseId];
  reactantPhaseIds: PhaseId[];
  productPhaseIds: PhaseId[];
}

export interface RoundThermodynamicAuditResult {
  valid: boolean;
  violations: RoundThermodynamicViolation[];
  certifiedInvariants: LocalInvariantCertificateSummary[];
  scope: "local-invariant-realizability";
}

interface ResolvedInvariant {
  orderedPhaseIds: [PhaseId, PhaseId, PhaseId];
  orderedCompositions: [number, number, number];
  canonicalReactants: PhaseId[];
  canonicalProducts: PhaseId[];
}

function samePhaseMultiset(left: PhaseId[], right: PhaseId[]): boolean {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((phaseId, index) => phaseId === sortedRight[index]);
}

function resolveInvariant(
  invariant: HiddenInvariantSolution,
  solution: HiddenSolution,
): ResolvedInvariant | string {
  if (
    invariant.expectedAssemblage.length !== 3 ||
    !invariant.phaseCompositionRoleIds ||
    Object.keys(invariant.phaseCompositionRoleIds).length !== 3
  ) {
    return "A local Gibbs audit requires exactly three phases with explicit composition-role ownership.";
  }
  const pointByRole = new Map(solution.points.map((point) => [point.roleId, point.point]));
  const located = invariant.expectedAssemblage.map((phaseId) => {
    const roleId = invariant.phaseCompositionRoleIds?.[phaseId];
    const point = roleId ? pointByRole.get(roleId) : undefined;
    return point ? { phaseId, composition: point.compositionBPercent } : undefined;
  });
  if (located.some((entry) => !entry)) {
    return "At least one invariant phase has no resolvable composition-role point.";
  }
  const ordered = located
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((a, b) => a.composition - b.composition);
  if (!(ordered[0].composition < ordered[1].composition && ordered[1].composition < ordered[2].composition)) {
    return "Invariant phase compositions must be strictly ordered left-interior-right.";
  }
  const orderedPhaseIds: [PhaseId, PhaseId, PhaseId] = [
    ordered[0].phaseId,
    ordered[1].phaseId,
    ordered[2].phaseId,
  ];
  const rule = REACTION_RULES[invariant.reactionType];
  const interior = [orderedPhaseIds[1]];
  const outer = [orderedPhaseIds[0], orderedPhaseIds[2]];
  return {
    orderedPhaseIds,
    orderedCompositions: [ordered[0].composition, ordered[1].composition, ordered[2].composition],
    canonicalReactants: rule.interiorCompositionSide === "reactants" ? interior : outer,
    canonicalProducts: rule.interiorCompositionSide === "products" ? interior : outer,
  };
}

function localGibbsModels(
  resolved: ResolvedInvariant,
  invariantTemperature: number,
  halfWindow: number,
  compositionStep: number,
): ThermodynamicPhaseModel[] {
  const [left, , right] = resolved.orderedCompositions;
  const radius = right - left;
  const reactants = new Set(resolved.canonicalReactants);
  return resolved.orderedPhaseIds.map((phaseId, index) => {
    const equilibriumComposition = resolved.orderedCompositions[index];
    // Align every phase's own sampling lattice to its equilibrium composition;
    // otherwise a stoichiometric invariant point could fall between samples.
    const stepsToLeft = Math.floor((equilibriumComposition - left) / compositionStep + 1e-9);
    const stepsToRight = Math.floor((right - equilibriumComposition) / compositionStep + 1e-9);
    return {
      id: phaseId,
      compositionMinBPercent: equilibriumComposition - stepsToLeft * compositionStep,
      compositionMaxBPercent: equilibriumComposition + stepsToRight * compositionStep,
      gibbsEnergy: (compositionBPercent: number, temperatureCelsius: number) => {
        const reducedComposition = (compositionBPercent - equilibriumComposition) / radius;
        const reducedTemperature = (temperatureCelsius - invariantTemperature) / halfWindow;
        // All phase minima are collinear at T_inv. Above it, reactants are
        // lowered; below it, products are lowered. The quadratic wells give a
        // finite local composition range to the one-phase side.
        const sideShift = reactants.has(phaseId) ? -reducedTemperature : reducedTemperature;
        return 0.25 * reducedComposition * reducedComposition + sideShift;
      },
    };
  });
}

function auditOneInvariant(
  puzzle: PuzzleDefinition,
  solution: HiddenSolution,
  invariant: HiddenInvariantSolution,
  invariantIndex: number,
): { violations: RoundThermodynamicViolation[]; summary?: LocalInvariantCertificateSummary } {
  const violations: RoundThermodynamicViolation[] = [];
  const resolved = resolveInvariant(invariant, solution);
  if (typeof resolved === "string") {
    violations.push({
      ruleId: resolved.includes("strictly ordered")
        ? "local-gibbs-composition-invalid"
        : "local-gibbs-contract-missing",
      invariantIndex,
      reactionType: invariant.reactionType,
      message: resolved,
      phaseIds: [...invariant.expectedAssemblage],
    });
    return { violations };
  }

  const declaredReactants = invariant.reactantPhaseIds ?? [];
  const declaredProducts = invariant.productPhaseIds ?? [];
  if (
    !samePhaseMultiset(declaredReactants, resolved.canonicalReactants) ||
    !samePhaseMultiset(declaredProducts, resolved.canonicalProducts)
  ) {
    violations.push({
      ruleId: "local-gibbs-reaction-partition",
      invariantIndex,
      reactionType: invariant.reactionType,
      message:
        `${invariant.reactionType} requires ${resolved.canonicalReactants.join(" + ")} -> ` +
        `${resolved.canonicalProducts.join(" + ")} on cooling from its independently resolved interior-composition rule; ` +
        `the round declares ${declaredReactants.join(" + ") || "nothing"} -> ${declaredProducts.join(" + ") || "nothing"}.`,
      phaseIds: [...invariant.expectedAssemblage],
    });
  }

  const [leftComposition, interiorComposition, rightComposition] = resolved.orderedCompositions;
  const span = rightComposition - leftComposition;
  const compositionStep = span / 100;
  const halfWindow = Math.max(
    0.1,
    Math.min(2, (puzzle.temperatureMaxCelsius - puzzle.temperatureMinCelsius) / 100),
  );
  const certificate = createThermodynamicCertificate(
    localGibbsModels(resolved, invariant.temperatureCelsius, halfWindow, compositionStep),
    {
      compositionMinBPercent: leftComposition,
      compositionMaxBPercent: rightComposition,
      temperatureMinCelsius: invariant.temperatureCelsius - halfWindow,
      temperatureMaxCelsius: invariant.temperatureCelsius + halfWindow,
      compositionStepBPercent: compositionStep,
      temperatureStepCelsius: halfWindow,
      energyTolerance: 1e-7,
      includeEquilibriumGrid: false,
    },
  );
  // A half-grid offset avoids querying exactly on the interior phase vertex,
  // where the adjacent tie line is mathematically also an equilibrium support.
  const sideWitnessComposition = Math.min(
    rightComposition - compositionStep / 2,
    interiorComposition + compositionStep / 2,
  );
  const thermodynamicResult = compareThermodynamicContract(certificate, {
    invariants: [
      {
        id: `invariant-${invariantIndex}`,
        temperatureCelsius: invariant.temperatureCelsius,
        compositionMinBPercent: leftComposition,
        compositionMaxBPercent: rightComposition,
        expectedPhaseIds: [...resolved.orderedPhaseIds],
      },
    ],
    fields: [
      {
        id: `invariant-${invariantIndex}-above`,
        compositionBPercent: sideWitnessComposition,
        temperatureCelsius: invariant.temperatureCelsius + halfWindow / 2,
        expectedPhaseIds: declaredReactants,
      },
      {
        id: `invariant-${invariantIndex}-below`,
        compositionBPercent: sideWitnessComposition,
        temperatureCelsius: invariant.temperatureCelsius - halfWindow / 2,
        expectedPhaseIds: declaredProducts,
      },
    ],
  });
  for (const violation of thermodynamicResult.violations) {
    violations.push({
      ruleId: "local-gibbs-equilibrium-mismatch",
      invariantIndex,
      reactionType: invariant.reactionType,
      message: violation.message,
      phaseIds: [...invariant.expectedAssemblage],
      thermodynamicViolation: violation,
    });
  }

  return {
    violations,
    summary: {
      invariantIndex,
      reactionType: invariant.reactionType,
      temperatureCelsius: invariant.temperatureCelsius,
      orderedPhaseIds: resolved.orderedPhaseIds,
      reactantPhaseIds: resolved.canonicalReactants,
      productPhaseIds: resolved.canonicalProducts,
    },
  };
}

export function auditRoundThermodynamicRealizability(
  puzzle: PuzzleDefinition,
  solution: HiddenSolution,
): RoundThermodynamicAuditResult {
  const violations: RoundThermodynamicViolation[] = [];
  const certifiedInvariants: LocalInvariantCertificateSummary[] = [];
  solution.invariants.forEach((invariant, invariantIndex) => {
    const result = auditOneInvariant(puzzle, solution, invariant, invariantIndex);
    violations.push(...result.violations);
    if (result.summary && result.violations.length === 0) certifiedInvariants.push(result.summary);
  });
  return {
    valid: violations.length === 0,
    violations,
    certifiedInvariants,
    scope: "local-invariant-realizability",
  };
}
