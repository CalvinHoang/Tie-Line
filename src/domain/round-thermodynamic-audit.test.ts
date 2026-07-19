import { describe, expect, it } from "vitest";
import { generateRound } from "./generator";
import { auditRoundThermodynamicRealizability } from "./round-thermodynamic-audit";
import type { ReactionType } from "./schema";

const ALL_REACTIONS: ReactionType[] = [
  "eutectic",
  "eutectoid",
  "peritectic",
  "peritectoid",
  "monotectic",
  "monotectoid",
  "syntectic",
  "catatectic",
];

describe("generated-round local thermodynamic audit", () => {
  it("locally realizes all eight generated hard-round invariant archetypes", () => {
    const seen = new Set<ReactionType>();
    for (let seed = 0; seed < 30 && seen.size < ALL_REACTIONS.length; seed += 1) {
      const round = generateRound(seed, "hard");
      const result = auditRoundThermodynamicRealizability(round.puzzle, round.solution);
      expect(result, `seed ${seed}, ${round.family}`).toMatchObject({
        valid: true,
        violations: [],
        scope: "local-invariant-realizability",
      });
      expect(result.certifiedInvariants).toHaveLength(round.solution.invariants.length);
      round.solution.invariants.forEach((invariant) => seen.add(invariant.reactionType));
    }
    expect(seen).toEqual(new Set(ALL_REACTIONS));
  });

  it("rejects a deliberately inverted cooling reaction", () => {
    const round = structuredClone(generateRound(5, "hard"));
    const target = round.solution.invariants.find((invariant) => invariant.reactionType === "monotectic")!;
    const originalReactants = target.reactantPhaseIds!;
    target.reactantPhaseIds = target.productPhaseIds;
    target.productPhaseIds = originalReactants;

    const result = auditRoundThermodynamicRealizability(round.puzzle, round.solution);
    expect(result.valid).toBe(false);
    expect(result.violations.map((violation) => violation.ruleId)).toEqual(
      expect.arrayContaining([
        "local-gibbs-reaction-partition",
        "local-gibbs-equilibrium-mismatch",
      ]),
    );
    expect(result.violations.find((violation) => violation.ruleId === "local-gibbs-reaction-partition")?.message)
      .toContain("monotectic requires");
  });
});
