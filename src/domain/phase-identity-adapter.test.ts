import { describe, expect, it } from "vitest";
import { FAMILY_POOLS, type Difficulty } from "./generator";
import { adaptPhaseIdentities, inferPhaseIdentityInputs } from "./phase-identity-adapter";
import { auditPhaseEquilibria } from "./phase-equilibria-validator";

describe("phase identity adapter", () => {
  it("infers low alpha/high beta for the unanchored complete-range polymorph", () => {
    const round = FAMILY_POOLS.normal[4](4);
    expect(round.family).toBe("subsolidus-polymorph");
    const adapted = adaptPhaseIdentities(round.puzzle, round.solution);
    const low = adapted.puzzle.phases.find((phase) => phase.temperatureRole === "low-temperature")!;
    const high = adapted.puzzle.phases.find((phase) => phase.temperatureRole === "high-temperature")!;

    expect(low).toMatchObject({ id: "delta", symbol: "α", compositionRole: "complete-range" });
    expect(high).toMatchObject({ id: "gamma", symbol: "β", compositionRole: "complete-range" });
    expect(adapted.identityPlan.answerAutomorphisms).toHaveLength(2);
    expect(auditPhaseEquilibria(adapted.puzzle, adapted.solution).violations).toEqual([]);
  });

  it("infers A alpha, intermediate gamma, and B beta in the coupled eutectic-peritectic case", () => {
    const round = FAMILY_POOLS.normal[5](5);
    expect(round.family).toBe("coupled-eutectic-peritectic");
    const adapted = adaptPhaseIdentities(round.puzzle, round.solution);

    expect(adapted.puzzle.phases.find((phase) => phase.compositionRole === "a-terminal"))
      .toMatchObject({ id: "alpha", symbol: "α" });
    expect(adapted.puzzle.phases.find((phase) => phase.compositionRole === "intermediate"))
      .toMatchObject({ id: "gamma", symbol: "γ" });
    expect(adapted.puzzle.phases.find((phase) => phase.compositionRole === "b-terminal"))
      .toMatchObject({ id: "delta", symbol: "β" });
    expect(adapted.identityPlan.answerAutomorphisms).toHaveLength(1);
    expect(auditPhaseEquilibria(adapted.puzzle, adapted.solution).violations).toEqual([]);
  });

  it("infers the superlattice as an ordered alpha-prime derivative", () => {
    const round = FAMILY_POOLS.normal[6](6);
    expect(round.family).toBe("superlattice");
    const inferred = inferPhaseIdentityInputs(round.puzzle, round.solution);
    const orderedFacts = inferred.inferredFacts.find((facts) => facts.sourceKey === "delta")!;
    expect(orderedFacts).toMatchObject({ derivativeOf: "gamma", touchesA: true, touchesB: true });

    const adapted = adaptPhaseIdentities(round.puzzle, round.solution);
    const base = adapted.puzzle.phases.find((phase) => phase.id === "gamma")!;
    const ordered = adapted.puzzle.phases.find((phase) => phase.id === "delta")!;
    expect([base.symbol, ordered.symbol]).toEqual(["α", "α′"]);
    expect(ordered.phaseFamilyId).toBe(base.phaseFamilyId);
    expect(adapted.identityPlan.answerAutomorphisms).toHaveLength(1);
    expect(auditPhaseEquilibria(adapted.puzzle, adapted.solution).violations).toEqual([]);
  });

  it("remaps every phase reference and preserves already normalized ids", () => {
    const round = FAMILY_POOLS.normal[0](0);
    const adapted = adaptPhaseIdentities(round.puzzle, round.solution);
    const defined = new Set(adapted.puzzle.phases.map((phase) => phase.id));
    const references = [
      ...adapted.solution.expectedFields.flatMap((field) => field.expectedAssemblage),
      ...adapted.solution.invariants.flatMap((invariant) => [
        ...invariant.expectedAssemblage,
        ...(invariant.reactantPhaseIds ?? []),
        ...(invariant.productPhaseIds ?? []),
        ...Object.keys(invariant.phaseCompositionRoleIds ?? {}),
      ]),
      ...adapted.puzzle.requiredInvariants.flatMap((invariant) => [
        ...invariant.expectedAssemblage,
        ...(invariant.reactantPhaseIds ?? []),
        ...(invariant.productPhaseIds ?? []),
        ...Object.keys(invariant.phaseCompositionRoleIds ?? {}),
      ]),
      ...adapted.puzzle.intermediateCompositions.flatMap((site) => site.phaseIds),
    ];
    expect(references.every((id) => defined.has(id))).toBe(true);
    expect(adapted.puzzle.phases.some((phase) => phase.id === "alpha")).toBe(true);
  });

  it("normalizes every current generated family across many seeds", () => {
    const difficulties: Difficulty[] = ["easy", "normal", "hard"];
    for (const difficulty of difficulties) {
      for (const [familyIndex, generator] of FAMILY_POOLS[difficulty].entries()) {
        for (let sample = 0; sample < 12; sample += 1) {
          const seed = sample * FAMILY_POOLS[difficulty].length + familyIndex;
          const round = generator(seed);
          const adapted = adaptPhaseIdentities(round.puzzle, round.solution);
          const defined = new Set(adapted.puzzle.phases.map((phase) => phase.id));
          const referenced = [
            ...adapted.solution.expectedFields.flatMap((field) => field.expectedAssemblage),
            ...adapted.solution.invariants.flatMap((invariant) => [
              ...invariant.expectedAssemblage,
              ...(invariant.reactantPhaseIds ?? []),
              ...(invariant.productPhaseIds ?? []),
              ...Object.keys(invariant.phaseCompositionRoleIds ?? {}),
            ]),
          ];
          expect(referenced.every((id) => defined.has(id)), `${difficulty} ${seed} ${round.family}`).toBe(true);
          expect(adapted.puzzle.phases.every((phase) => phase.symbol.length > 0), `${difficulty} ${seed} ${round.family}`).toBe(true);
          expect(auditPhaseEquilibria(adapted.puzzle, adapted.solution).violations,
            `${difficulty} ${seed} ${round.family}`).toEqual([]);
        }
      }
    }
  }, 30_000);
});
