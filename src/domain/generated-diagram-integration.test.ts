import { describe, expect, it } from "vitest";
import { createLabelingState } from "../editor/state";
import { validateSubmit } from "../game/validator";
import { FAMILY_RULES, generateRound } from "./generator";
import { pointInPolygon, sameLogicalPoint } from "./geometry";
import { auditPhaseEquilibria } from "./phase-equilibria-validator";
import { auditRoundThermodynamicRealizability } from "./round-thermodynamic-audit";
import { expectedLabels } from "./diagram-notation";

describe("generated phase-diagram integration samples", () => {
  it("exercises the weighted generation system and independently accepts every output", () => {
    const cycles = 3;

    for (const difficulty of ["easy", "normal", "hard"] as const) {
      const rules = FAMILY_RULES[difficulty];
      const totalWeight = rules.reduce((sum, rule) => sum + rule.weight, 0);
      const selections = new Map<string, number>();
      const geometrySignatures = new Map<string, Set<string>>();

      for (let seed = 0; seed < totalWeight * cycles; seed += 1) {
        const round = generateRound(seed, difficulty);
        const contract = round.generationContract!;
        const geometryAudit = auditPhaseEquilibria(round.puzzle, round.solution);
        const signature = JSON.stringify(round.solution.points.map(({ roleId, point }) => [roleId, point]));
        const state = createLabelingState(round.puzzle, round.solution);
        const solvedState = {
          ...state,
          cells: state.cells.map((cell) => ({
            ...cell,
            phaseOrder: (() => { const field = round.solution.expectedFields.find((candidate) => sameLogicalPoint(candidate.witnessPoint, cell.labelPoint))
              ?? round.solution.expectedFields.find((candidate) => pointInPolygon(candidate.witnessPoint, cell.polygon)); return field ? expectedLabels(field) : []; })(),
          })),
        };

        selections.set(contract.ruleId, (selections.get(contract.ruleId) ?? 0) + 1);
        geometrySignatures.set(contract.ruleId, new Set([
          ...(geometrySignatures.get(contract.ruleId) ?? []),
          signature,
        ]));

        expect(geometryAudit, `${difficulty} seed ${seed} ${round.family}`)
          .toMatchObject({ valid: true, violations: [] });
        expect(validateSubmit(solvedState, round.puzzle, round.solution), `${difficulty} seed ${seed} answer key`)
          .toEqual({ status: "solved", violations: [] });
        const definedPhaseIds = new Set(round.puzzle.phases.map((phase) => phase.id));
        const definedLabelIds = new Set(round.puzzle.diagramLabels.map((label) => label.id));
        expect(round.solution.expectedFields.every((field) =>
          field.expectedAssemblage.every((phaseId) => definedPhaseIds.has(phaseId))))
          .toBe(true);
        expect(round.solution.expectedFields.every((field) =>
          field.expectedLabelIds?.every((labelId) => definedLabelIds.has(labelId))))
          .toBe(true);
        if (contract.requiredFeatures.includes("liquid-immiscibility")) {
          expect(round.puzzle.phases.map((phase) => phase.symbol))
            .toEqual(expect.arrayContaining(["L", "L₁", "L₂"]));
          expect(round.solution.expectedFields.some((field) => field.expectedAssemblage.join("+") === "L1+L2"))
            .toBe(true);
          const topLiquidFields = round.solution.expectedFields.filter((field) =>
            field.expectedAssemblage.length === 1 && field.expectedAssemblage[0] === "L");
          expect(topLiquidFields.length).toBeGreaterThan(0);
        }
        expect(round.thermodynamicCertificate?.certifiedInvariantCount)
          .toBe(round.solution.invariants.length);
        if (round.solution.invariants.length > 0) {
          expect(round.topologyCertificate).toMatchObject({
            scope: "generated-diagram",
            certifiedInvariantCount: round.solution.invariants.length,
          });
        }
        for (const [reactionType, expectedCount] of Object.entries(contract.requiredInvariantCounts)) {
          expect(
            round.solution.invariants.filter((invariant) => invariant.reactionType === reactionType),
            `${difficulty} seed ${seed} ${reactionType}`,
          ).toHaveLength(expectedCount);
        }
      }

      for (const rule of rules) {
        expect(selections.get(rule.id), `${difficulty} ${rule.id} selection count`)
          .toBe(rule.weight * cycles);
        expect(geometrySignatures.get(rule.id)?.size, `${difficulty} ${rule.id} geometry variation`)
          .toBeGreaterThan(1);
      }
    }
  }, 15_000);

  it("generates and certifies a coupled eutectic-peritectic diagram", () => {
    const round = generateRound(5, "normal");
    const geometryAudit = auditPhaseEquilibria(round.puzzle, round.solution);
    const thermodynamicAudit = auditRoundThermodynamicRealizability(round.puzzle, round.solution);

    expect(round.family).toBe("coupled-eutectic-peritectic");
    expect(round.solution.invariants.map((invariant) => invariant.reactionType))
      .toEqual(["eutectic", "peritectic"]);
    expect(round.generationContract).toMatchObject({
      requiredInvariantCounts: { eutectic: 1, peritectic: 1 },
      requiredFeatures: ["partial-solubility", "intermediate-phase"],
    });
    expect(round.puzzle.phases.map(({ symbol, compositionRole }) => ({ symbol, compositionRole })))
      .toEqual(expect.arrayContaining([
        { symbol: "α", compositionRole: "a-terminal" },
        { symbol: "γ", compositionRole: "intermediate" },
        { symbol: "β", compositionRole: "b-terminal" },
      ]));
    expect(round.solution.expectedFields.filter((field) => field.texture === "partial-solubility"))
      .toHaveLength(3);
    expect(geometryAudit).toMatchObject({ valid: true, violations: [], cellCount: 9 });
    expect(thermodynamicAudit).toMatchObject({ valid: true, violations: [] });
    expect(round.topologyCertificate).toMatchObject({
      scope: "generated-diagram",
      certifiedInvariantCount: 2,
    });
    expect(round.thermodynamicCertificate?.certifiedInvariantCount).toBe(2);
  });

  it("generates and certifies a liquid-spinodal diagram without treating the spinodal as an invariant", () => {
    const round = generateRound(3, "hard");
    const geometryAudit = auditPhaseEquilibria(round.puzzle, round.solution);
    const thermodynamicAudit = auditRoundThermodynamicRealizability(round.puzzle, round.solution);
    const invariantCounts = round.solution.invariants.reduce<Record<string, number>>((counts, invariant) => ({
      ...counts,
      [invariant.reactionType]: (counts[invariant.reactionType] ?? 0) + 1,
    }), {});

    expect(round.family).toBe("liquid-spinodal");
    expect(invariantCounts).toEqual({ eutectic: 2, syntectic: 1 });
    expect(round.generationContract).toMatchObject({
      requiredInvariantCounts: { eutectic: 2, syntectic: 1 },
      requiredFeatures: ["liquid-immiscibility", "spinodal", "intermediate-phase"],
    });
    expect(round.solution.curves.filter((curve) => curve.boundaryKind === "stability-guide"))
      .toHaveLength(2);
    expect(round.solution.invariants.some((invariant) => String(invariant.reactionType).includes("spinodal")))
      .toBe(false);
    expect(round.solution.expectedFields.filter((field) => field.expectedAssemblage.join("+") === "L1+L2"))
      .toHaveLength(1);
    expect(geometryAudit).toMatchObject({ valid: true, violations: [], cellCount: 8 });
    expect(thermodynamicAudit).toMatchObject({ valid: true, violations: [] });
    expect(round.topologyCertificate?.certifiedInvariantCount).toBe(3);
    expect(round.thermodynamicCertificate?.certifiedInvariantCount).toBe(3);
  });

  it("derives and enforces monotectic L₁ parent and L₂ product identities", () => {
    const round = generateRound(2_923_108_772, "hard");
    const invariant = round.solution.invariants.find((item) => item.reactionType === "monotectic")!;
    const phaseById = new Map(round.puzzle.phases.map((phase) => [phase.id, phase]));
    const parentId = invariant.reactantPhaseIds!.find((id) => phaseById.get(id)?.kind === "liquid")!;
    const productId = invariant.productPhaseIds!.find((id) => phaseById.get(id)?.kind === "liquid")!;

    expect(round.family).toBe("monotectic");
    expect(phaseById.get(parentId)).toMatchObject({ id: "L1", symbol: "L₁", name: "Parent liquid" });
    expect(phaseById.get(productId)).toMatchObject({ id: "L2", symbol: "L₂", name: "Immiscible liquid ₂" });
    expect(phaseById.get("L")).toMatchObject({ id: "L", symbol: "L", name: "Homogeneous liquid" });
    expect(round.solution.expectedFields.find((field) => field.role === "liquid")?.expectedAssemblage)
      .toEqual(["L"]);
    expect(auditPhaseEquilibria(round.puzzle, round.solution)).toMatchObject({ valid: true, violations: [] });

    const reversed = structuredClone(round);
    const reversedParent = reversed.puzzle.phases.find((phase) => phase.id === "L1")!;
    const reversedProduct = reversed.puzzle.phases.find((phase) => phase.id === "L2")!;
    [reversedParent.symbol, reversedProduct.symbol] = [reversedProduct.symbol, reversedParent.symbol];
    const reversedAudit = auditPhaseEquilibria(reversed.puzzle, reversed.solution);
    expect(reversedAudit.valid).toBe(false);
    expect(reversedAudit.violations.map((violation) => violation.ruleId))
      .toContain("monotectic-liquid-identity");
  });
});
