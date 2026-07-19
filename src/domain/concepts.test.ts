import { describe, expect, it } from "vitest";
import { RULE_CONCEPTS } from "./concepts";
import { REACTION_RULES } from "./phase-rules";

describe("critical-point rules", () => {
  it("defines every critical point by a visible phase transition", () => {
    const criticalPoints = RULE_CONCEPTS.filter((concept) => concept.category === "Critical points");
    expect(criticalPoints).toHaveLength(11);
    for (const concept of criticalPoints) {
      expect(concept.reaction, concept.title).toBeTruthy();
      expect(concept.direction, concept.title).toBeTruthy();
      expect(concept.transitionNote, concept.title).toMatch(/consum|becomes unstable|separates/i);
    }
  });

  it("draws and describes every playable invariant from the shared reaction registry", () => {
    const invariantConcepts = RULE_CONCEPTS.filter((concept) => Object.values(REACTION_RULES).some((rule) => rule.coolingEquation === concept.reaction));
    expect(new Set(invariantConcepts.map((concept) => concept.reaction))).toEqual(new Set(Object.values(REACTION_RULES).map((rule) => rule.coolingEquation)));
    expect(RULE_CONCEPTS.some((concept) => concept.id === "inverse-peritectic")).toBe(false);
    expect(RULE_CONCEPTS.find((concept) => concept.id === "metatectic-point")?.diagram).toBe("metatectic");
  });
});
