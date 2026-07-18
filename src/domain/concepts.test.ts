import { describe, expect, it } from "vitest";
import { RULE_CONCEPTS } from "./concepts";

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
});
