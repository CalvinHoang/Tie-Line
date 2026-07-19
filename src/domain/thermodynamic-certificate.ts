/**
 * A bounded thermodynamic plausibility certificate for pedagogical binary T-X
 * diagrams.
 *
 * This is deliberately not a CALPHAD solver. It samples user-supplied molar
 * Gibbs-energy functions, constructs the lower convex envelope at each
 * temperature, and reads equilibrium phase states from its supporting
 * segments. The certificate is independent of drawn boundaries and authored
 * field labels, which makes it useful as a second opinion on a generated
 * diagram.
 *
 * Assumptions:
 * - pressure is fixed and composition is the only conserved coordinate;
 * - every supplied G(x,T) is on one consistent molar-energy reference;
 * - continuous phase models are smooth enough for the selected composition
 *   step; fixed-composition compounds declare `fixedCompositionBPercent`;
 * - the result is a numerical certificate at the requested resolution, not a
 *   proof between samples.
 */

export interface ThermodynamicPhaseModel {
  id: string;
  gibbsEnergy: (compositionBPercent: number, temperatureCelsius: number) => number;
  compositionMinBPercent?: number;
  compositionMaxBPercent?: number;
  fixedCompositionBPercent?: number;
}

export interface ThermodynamicCertificateOptions {
  compositionMinBPercent: number;
  compositionMaxBPercent: number;
  temperatureMinCelsius: number;
  temperatureMaxCelsius: number;
  /** Maximum spacing of sampled phase compositions. Defaults to 2 at.%. */
  compositionStepBPercent?: number;
  /** Spacing of the reported equilibrium grid. Defaults to 25 degrees. */
  temperatureStepCelsius?: number;
  /** Absolute tolerance in the units returned by gibbsEnergy. */
  energyTolerance?: number;
  /** Build the full reporting grid. Disable for point-only generation gates. */
  includeEquilibriumGrid?: boolean;
}

export interface EquilibriumState {
  phaseId: string;
  compositionBPercent: number;
  gibbsEnergy: number;
}

export interface EquilibriumPoint {
  compositionBPercent: number;
  temperatureCelsius: number;
  kind: "one-phase" | "two-phase" | "three-phase-or-more";
  /**
   * Endpoints (and any collinear invariant phases) of the supporting common
   * tangent. A miscibility gap may contain the same phaseId twice at different
   * compositions.
   */
  states: EquilibriumState[];
  equilibriumGibbsEnergy: number;
}

export interface ThermodynamicFieldContract {
  id: string;
  compositionBPercent: number;
  temperatureCelsius: number;
  /** A multiset: ["L", "L"] can require liquid-liquid separation. */
  expectedPhaseIds: string[];
}

export interface ThermodynamicInvariantContract {
  id: string;
  temperatureCelsius: number;
  compositionMinBPercent: number;
  compositionMaxBPercent: number;
  expectedPhaseIds: string[];
}

export interface ThermodynamicContract {
  fields?: ThermodynamicFieldContract[];
  invariants?: ThermodynamicInvariantContract[];
}

export interface ThermodynamicContractViolation {
  code: "field-assemblage-mismatch" | "invariant-assemblage-mismatch" | "invalid-contract";
  contractId: string;
  message: string;
  expectedPhaseIds: string[];
  actualPhaseIds: string[];
  compositionBPercent: number;
  temperatureCelsius: number;
}

export interface ThermodynamicContractResult {
  accepted: boolean;
  violations: ThermodynamicContractViolation[];
}

export interface ThermodynamicCertificate {
  options: Required<ThermodynamicCertificateOptions>;
  phaseIds: string[];
  /** Equilibria on the bounded reporting grid, useful for reconstructing fields. */
  equilibria: EquilibriumPoint[];
  equilibriumAt: (compositionBPercent: number, temperatureCelsius: number) => EquilibriumPoint;
}

interface Sample extends EquilibriumState {}

interface HullVertex extends Sample {}

const DEFAULT_COMPOSITION_STEP = 2;
const DEFAULT_TEMPERATURE_STEP = 25;
const DEFAULT_ENERGY_TOLERANCE = 1e-8;

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) throw new Error(`${name} must be finite.`);
}

function inclusiveGrid(min: number, max: number, step: number): number[] {
  const values: number[] = [];
  for (let value = min; value < max; value += step) values.push(value);
  values.push(max);
  return values;
}

function interpolateEnergy(left: Sample, right: Sample, composition: number): number {
  if (Math.abs(right.compositionBPercent - left.compositionBPercent) < Number.EPSILON) {
    return Math.min(left.gibbsEnergy, right.gibbsEnergy);
  }
  const fraction =
    (composition - left.compositionBPercent) /
    (right.compositionBPercent - left.compositionBPercent);
  return left.gibbsEnergy + fraction * (right.gibbsEnergy - left.gibbsEnergy);
}

function samplePhases(
  phases: ThermodynamicPhaseModel[],
  options: Required<ThermodynamicCertificateOptions>,
  temperature: number,
): Sample[] {
  const samples: Sample[] = [];
  for (const phase of phases) {
    const phaseMin = Math.max(
      options.compositionMinBPercent,
      phase.compositionMinBPercent ?? options.compositionMinBPercent,
    );
    const phaseMax = Math.min(
      options.compositionMaxBPercent,
      phase.compositionMaxBPercent ?? options.compositionMaxBPercent,
    );
    const compositions =
      phase.fixedCompositionBPercent === undefined
        ? inclusiveGrid(phaseMin, phaseMax, options.compositionStepBPercent)
        : [phase.fixedCompositionBPercent];

    for (const composition of compositions) {
      if (composition < phaseMin || composition > phaseMax) continue;
      const energy = phase.gibbsEnergy(composition, temperature);
      if (!Number.isFinite(energy)) continue;
      samples.push({ phaseId: phase.id, compositionBPercent: composition, gibbsEnergy: energy });
    }
  }
  return samples.sort(
    (a, b) => a.compositionBPercent - b.compositionBPercent || a.gibbsEnergy - b.gibbsEnergy,
  );
}

function lowestSamplesByComposition(samples: Sample[], tolerance: number): Sample[] {
  const result: Sample[] = [];
  for (let index = 0; index < samples.length; ) {
    const composition = samples[index].compositionBPercent;
    let end = index + 1;
    while (end < samples.length && samples[end].compositionBPercent === composition) end += 1;
    const minimum = samples[index].gibbsEnergy;
    const equivalent = samples.slice(index, end).filter((sample) => sample.gibbsEnergy <= minimum + tolerance);
    // One representative is enough for hull geometry. Degenerate alternatives
    // are recovered from all samples when the supporting line is inspected.
    result.push(equivalent[0]);
    index = end;
  }
  return result;
}

function lowerHull(samples: Sample[], tolerance: number): HullVertex[] {
  const candidates = lowestSamplesByComposition(samples, tolerance);
  const hull: HullVertex[] = [];
  for (const candidate of candidates) {
    while (hull.length >= 2) {
      const a = hull[hull.length - 2];
      const b = hull[hull.length - 1];
      const energyOnChord = interpolateEnergy(a, candidate, b.compositionBPercent);
      // Remove concave and collinear middle points. Collinear phase states are
      // intentionally recovered later so a three-phase invariant is not lost.
      if (b.gibbsEnergy >= energyOnChord - tolerance) hull.pop();
      else break;
    }
    hull.push(candidate);
  }
  return hull;
}

function uniqueStates(states: Sample[], tolerance: number): Sample[] {
  const result: Sample[] = [];
  for (const state of states) {
    const duplicate = result.some(
      (entry) =>
        entry.phaseId === state.phaseId &&
        Math.abs(entry.compositionBPercent - state.compositionBPercent) <= tolerance,
    );
    if (!duplicate) result.push(state);
  }
  return result;
}

function supportingStates(
  samples: Sample[],
  left: HullVertex,
  right: HullVertex,
  energyTolerance: number,
): Sample[] {
  const span = right.compositionBPercent - left.compositionBPercent;
  const compositionTolerance = Math.max(1e-9, Math.abs(span) * 1e-9);
  return uniqueStates(
    samples.filter((sample) => {
      if (
        sample.compositionBPercent < left.compositionBPercent - compositionTolerance ||
        sample.compositionBPercent > right.compositionBPercent + compositionTolerance
      ) {
        return false;
      }
      const supportEnergy = interpolateEnergy(left, right, sample.compositionBPercent);
      return Math.abs(sample.gibbsEnergy - supportEnergy) <= energyTolerance;
    }),
    compositionTolerance,
  ).sort((a, b) => a.compositionBPercent - b.compositionBPercent || a.phaseId.localeCompare(b.phaseId));
}

function phaseMultisetEqual(expected: string[], actual: string[]): boolean {
  if (expected.length !== actual.length) return false;
  const sortedExpected = [...expected].sort();
  const sortedActual = [...actual].sort();
  return sortedExpected.every((phase, index) => phase === sortedActual[index]);
}

export function createThermodynamicCertificate(
  phases: ThermodynamicPhaseModel[],
  inputOptions: ThermodynamicCertificateOptions,
): ThermodynamicCertificate {
  if (phases.length === 0) throw new Error("At least one thermodynamic phase model is required.");
  const options: Required<ThermodynamicCertificateOptions> = {
    ...inputOptions,
    compositionStepBPercent: inputOptions.compositionStepBPercent ?? DEFAULT_COMPOSITION_STEP,
    temperatureStepCelsius: inputOptions.temperatureStepCelsius ?? DEFAULT_TEMPERATURE_STEP,
    energyTolerance: inputOptions.energyTolerance ?? DEFAULT_ENERGY_TOLERANCE,
    includeEquilibriumGrid: inputOptions.includeEquilibriumGrid ?? true,
  };
  for (const [name, value] of Object.entries(options)) {
    if (name !== "includeEquilibriumGrid") assertFinite(name, value as number);
  }
  if (options.compositionMinBPercent >= options.compositionMaxBPercent) {
    throw new Error("compositionMinBPercent must be below compositionMaxBPercent.");
  }
  if (options.temperatureMinCelsius > options.temperatureMaxCelsius) {
    throw new Error("temperatureMinCelsius must not exceed temperatureMaxCelsius.");
  }
  if (options.compositionStepBPercent <= 0 || options.temperatureStepCelsius <= 0) {
    throw new Error("Certificate grid steps must be positive.");
  }
  if (options.energyTolerance < 0) throw new Error("energyTolerance must not be negative.");
  const phaseIds = phases.map((phase) => phase.id);
  if (new Set(phaseIds).size !== phaseIds.length) throw new Error("Thermodynamic phase ids must be unique.");

  const equilibriumAt = (composition: number, temperature: number): EquilibriumPoint => {
    if (composition < options.compositionMinBPercent || composition > options.compositionMaxBPercent) {
      throw new Error(`Composition ${composition} is outside the certificate bounds.`);
    }
    if (temperature < options.temperatureMinCelsius || temperature > options.temperatureMaxCelsius) {
      throw new Error(`Temperature ${temperature} is outside the certificate bounds.`);
    }
    const samples = samplePhases(phases, options, temperature);
    const hull = lowerHull(samples, options.energyTolerance);
    if (hull.length < 2) throw new Error("Phase models do not span the certificate composition interval.");
    let left = hull[0];
    let right = hull[1];
    for (let index = 0; index < hull.length - 1; index += 1) {
      if (composition >= hull[index].compositionBPercent && composition <= hull[index + 1].compositionBPercent) {
        left = hull[index];
        right = hull[index + 1];
        break;
      }
    }
    if (composition < left.compositionBPercent || composition > right.compositionBPercent) {
      throw new Error(`No equilibrium support spans composition ${composition}.`);
    }
    let states = supportingStates(samples, left, right, options.energyTolerance);
    const localSinglePhaseSegment =
      states.length >= 2 &&
      states.every((state) => state.phaseId === states[0].phaseId) &&
      right.compositionBPercent - left.compositionBPercent <= options.compositionStepBPercent * 1.01;
    if (localSinglePhaseSegment) {
      const phase = phases.find((candidate) => candidate.id === states[0].phaseId)!;
      states = [
        {
          phaseId: phase.id,
          compositionBPercent: composition,
          gibbsEnergy: phase.gibbsEnergy(composition, temperature),
        },
      ];
    }
    const kind = states.length === 1 ? "one-phase" : states.length === 2 ? "two-phase" : "three-phase-or-more";
    return {
      compositionBPercent: composition,
      temperatureCelsius: temperature,
      kind,
      states,
      equilibriumGibbsEnergy: interpolateEnergy(left, right, composition),
    };
  };

  const equilibria = options.includeEquilibriumGrid ? inclusiveGrid(
    options.temperatureMinCelsius,
    options.temperatureMaxCelsius,
    options.temperatureStepCelsius,
  ).flatMap((temperature) =>
    inclusiveGrid(
      options.compositionMinBPercent,
      options.compositionMaxBPercent,
      options.compositionStepBPercent,
    ).map((composition) => equilibriumAt(composition, temperature)),
  ) : [];

  return { options, phaseIds, equilibria, equilibriumAt };
}

export function compareThermodynamicContract(
  certificate: ThermodynamicCertificate,
  contract: ThermodynamicContract,
): ThermodynamicContractResult {
  const violations: ThermodynamicContractViolation[] = [];
  for (const field of contract.fields ?? []) {
    const equilibrium = certificate.equilibriumAt(field.compositionBPercent, field.temperatureCelsius);
    const actual = equilibrium.states.map((state) => state.phaseId);
    if (!phaseMultisetEqual(field.expectedPhaseIds, actual)) {
      violations.push({
        code: "field-assemblage-mismatch",
        contractId: field.id,
        message: `Field ${field.id} expects ${field.expectedPhaseIds.join(" + ")}, but the Gibbs lower envelope gives ${actual.join(" + ")}.`,
        expectedPhaseIds: [...field.expectedPhaseIds],
        actualPhaseIds: actual,
        compositionBPercent: field.compositionBPercent,
        temperatureCelsius: field.temperatureCelsius,
      });
    }
  }
  for (const invariant of contract.invariants ?? []) {
    if (invariant.compositionMinBPercent >= invariant.compositionMaxBPercent) {
      violations.push({
        code: "invalid-contract",
        contractId: invariant.id,
        message: `Invariant ${invariant.id} has an empty or reversed composition span.`,
        expectedPhaseIds: [...invariant.expectedPhaseIds],
        actualPhaseIds: [],
        compositionBPercent: invariant.compositionMinBPercent,
        temperatureCelsius: invariant.temperatureCelsius,
      });
      continue;
    }
    const fractions = [0.25, 0.5, 0.75];
    for (const fraction of fractions) {
      const composition =
        invariant.compositionMinBPercent +
        fraction * (invariant.compositionMaxBPercent - invariant.compositionMinBPercent);
      const equilibrium = certificate.equilibriumAt(composition, invariant.temperatureCelsius);
      const actual = equilibrium.states.map((state) => state.phaseId);
      if (!phaseMultisetEqual(invariant.expectedPhaseIds, actual)) {
        violations.push({
          code: "invariant-assemblage-mismatch",
          contractId: invariant.id,
          message: `Invariant ${invariant.id} is not supported at ${composition.toFixed(2)}% B: expected ${invariant.expectedPhaseIds.join(" + ")}, Gibbs envelope gives ${actual.join(" + ")}.`,
          expectedPhaseIds: [...invariant.expectedPhaseIds],
          actualPhaseIds: actual,
          compositionBPercent: composition,
          temperatureCelsius: invariant.temperatureCelsius,
        });
      }
    }
  }
  return { accepted: violations.length === 0, violations };
}
