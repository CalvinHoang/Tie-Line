import { describe, expect, it } from "vitest";
import {
  compareThermodynamicContract,
  createThermodynamicCertificate,
  type ThermodynamicCertificateOptions,
} from "./thermodynamic-certificate";

const boundedOptions: ThermodynamicCertificateOptions = {
  compositionMinBPercent: 0,
  compositionMaxBPercent: 100,
  temperatureMinCelsius: 0,
  temperatureMaxCelsius: 100,
  compositionStepBPercent: 1,
  temperatureStepCelsius: 50,
  energyTolerance: 1e-9,
};

describe("thermodynamic lower-envelope certificate", () => {
  it("identifies a stable complete solid solution as one phase", () => {
    const certificate = createThermodynamicCertificate(
      [
        {
          id: "alpha",
          gibbsEnergy: (composition, temperature) => {
            const x = composition / 100;
            return x * x + 0.001 * temperature;
          },
        },
      ],
      boundedOptions,
    );

    const equilibrium = certificate.equilibriumAt(37, 25);
    expect(equilibrium.kind).toBe("one-phase");
    expect(equilibrium.states).toEqual([
      expect.objectContaining({ phaseId: "alpha", compositionBPercent: 37 }),
    ]);
    expect(certificate.equilibria).toHaveLength(303);
    expect(
      compareThermodynamicContract(certificate, {
        fields: [{ id: "solid", compositionBPercent: 37, temperatureCelsius: 25, expectedPhaseIds: ["alpha"] }],
      }),
    ).toEqual({ accepted: true, violations: [] });
  });

  it("finds two equilibrium compositions of one phase inside a miscibility gap", () => {
    const certificate = createThermodynamicCertificate(
      [
        {
          id: "alpha",
          compositionMinBPercent: 20,
          compositionMaxBPercent: 80,
          gibbsEnergy: (composition) => {
            const x = composition / 100;
            return (x - 0.2) ** 2 * (x - 0.8) ** 2;
          },
        },
      ],
      { ...boundedOptions, compositionMinBPercent: 20, compositionMaxBPercent: 80 },
    );

    const equilibrium = certificate.equilibriumAt(50, 50);
    expect(equilibrium.kind).toBe("two-phase");
    expect(equilibrium.states.map((state) => [state.phaseId, state.compositionBPercent])).toEqual([
      ["alpha", 20],
      ["alpha", 80],
    ]);
    expect(
      compareThermodynamicContract(certificate, {
        fields: [{ id: "gap", compositionBPercent: 50, temperatureCelsius: 50, expectedPhaseIds: ["alpha", "alpha"] }],
      }).accepted,
    ).toBe(true);
  });

  it("retains a collinear third phase and reports actionable contract mismatches", () => {
    const certificate = createThermodynamicCertificate(
      [
        { id: "alpha", fixedCompositionBPercent: 20, gibbsEnergy: () => 0 },
        { id: "liquid", fixedCompositionBPercent: 50, gibbsEnergy: (_composition, temperature) => (temperature - 50) * 0.01 },
        { id: "beta", fixedCompositionBPercent: 80, gibbsEnergy: () => 0 },
      ],
      { ...boundedOptions, compositionMinBPercent: 20, compositionMaxBPercent: 80 },
    );

    const invariant = certificate.equilibriumAt(40, 50);
    expect(invariant.kind).toBe("three-phase-or-more");
    expect(invariant.states.map((state) => state.phaseId)).toEqual(["alpha", "liquid", "beta"]);
    expect(certificate.equilibriumAt(40, 25).states.map((state) => state.phaseId)).toEqual([
      "alpha",
      "liquid",
    ]);
    expect(certificate.equilibriumAt(40, 75).states.map((state) => state.phaseId)).toEqual([
      "alpha",
      "beta",
    ]);

    const accepted = compareThermodynamicContract(certificate, {
      invariants: [
        {
          id: "eutectic",
          temperatureCelsius: 50,
          compositionMinBPercent: 20,
          compositionMaxBPercent: 80,
          expectedPhaseIds: ["alpha", "liquid", "beta"],
        },
      ],
    });
    expect(accepted).toEqual({ accepted: true, violations: [] });

    const wrongTemperature = compareThermodynamicContract(certificate, {
      invariants: [
        {
          id: "not-an-invariant",
          temperatureCelsius: 75,
          compositionMinBPercent: 20,
          compositionMaxBPercent: 80,
          expectedPhaseIds: ["alpha", "liquid", "beta"],
        },
      ],
    });
    expect(wrongTemperature.accepted).toBe(false);
    expect(wrongTemperature.violations).toHaveLength(3);
    expect(wrongTemperature.violations[0].code).toBe("invariant-assemblage-mismatch");

    const rejected = compareThermodynamicContract(certificate, {
      fields: [{ id: "wrong-liquid", compositionBPercent: 40, temperatureCelsius: 50, expectedPhaseIds: ["liquid"] }],
    });
    expect(rejected.accepted).toBe(false);
    expect(rejected.violations[0]).toMatchObject({
      code: "field-assemblage-mismatch",
      contractId: "wrong-liquid",
      expectedPhaseIds: ["liquid"],
      actualPhaseIds: ["alpha", "liquid", "beta"],
    });
    expect(rejected.violations[0].message).toContain("Gibbs lower envelope");
  });
});
