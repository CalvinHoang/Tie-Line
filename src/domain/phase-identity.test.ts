import { describe, expect, it } from "vitest";
import {
  derivePhaseIdentity,
  PhaseIdentityError,
  type InferredPhaseFacts,
  type SemanticPhaseRecord,
} from "./phase-identity";

const facts = (
  sourceKey: string,
  compositionCentroidBPercent: number,
  overrides: Partial<InferredPhaseFacts> = {},
): InferredPhaseFacts => ({
  sourceKey,
  touchesA: false,
  touchesB: false,
  compositionCentroidBPercent,
  ...overrides,
});

const phase = (
  sourceKey: string,
  compositionContract: SemanticPhaseRecord["compositionContract"],
  overrides: Partial<SemanticPhaseRecord> = {},
): SemanticPhaseRecord => ({ sourceKey, state: "solid-solution", compositionContract, ...overrides });

describe("derivePhaseIdentity", () => {
  it("numbers two liquids by monotectic reaction role rather than left-to-right composition", () => {
    const plan = derivePhaseIdentity([
      { sourceKey: "parent", state: "liquid" },
      { sourceKey: "separated", state: "liquid" },
    ], [
      facts("parent", 72, { liquidRole: "homogeneous-parent" }),
      facts("separated", 8, { liquidRole: "immiscible-branch" }),
    ]);

    expect(plan.phases.find((item) => item.sourceKey === "parent"))
      .toMatchObject({ symbol: "L₁", name: "Parent liquid" });
    expect(plan.phases.find((item) => item.sourceKey === "separated"))
      .toMatchObject({ symbol: "L₂", name: "Immiscible liquid ₂" });
  });

  it("rejects a multi-liquid identity without one geometry-derived parent", () => {
    expect(() => derivePhaseIdentity([
      { sourceKey: "left", state: "liquid" },
      { sourceKey: "right", state: "liquid" },
    ], [facts("left", 20), facts("right", 80)]))
      .toThrowError(PhaseIdentityError);
  });

  it("derives A-terminal alpha, an interior gamma, and B-terminal beta", () => {
    const plan = derivePhaseIdentity([
      phase("left terminal", "a-terminal"),
      phase("peritectic product", "intermediate"),
      phase("right polymorph", "b-terminal"),
    ], [
      facts("left terminal", 4, { touchesA: true }),
      facts("peritectic product", 54),
      facts("right polymorph", 94, { touchesB: true }),
    ]);

    expect(plan.phases.map(({ id, symbol, compositionRole }) => ({ id, symbol, compositionRole }))).toEqual([
      { id: "left-terminal", symbol: "α", compositionRole: "a-terminal" },
      { id: "peritectic-product", symbol: "γ", compositionRole: "intermediate" },
      { id: "right-polymorph", symbol: "β", compositionRole: "b-terminal" },
    ]);
    expect(plan.answerAutomorphisms).toHaveLength(1);
  });

  it("uses conventional low alpha/high beta and permits only a whole-family swap when unanchored", () => {
    const plan = derivePhaseIdentity([
      phase("high solid", "complete-range", { familyKey: "complete polymorph", temperatureContract: "high-temperature" }),
      phase("low solid", "complete-range", { familyKey: "complete polymorph", temperatureContract: "low-temperature" }),
    ], [
      facts("high solid", 50, { touchesA: true, touchesB: true, temperatureRole: "high-temperature" }),
      facts("low solid", 50, { touchesA: true, touchesB: true, temperatureRole: "low-temperature" }),
    ]);

    expect(plan.phases.find((item) => item.sourceKey === "low solid")?.symbol).toBe("α");
    expect(plan.phases.find((item) => item.sourceKey === "high solid")?.symbol).toBe("β");
    expect(plan.answerAutomorphisms).toHaveLength(2);
    const swapped = plan.answerAutomorphisms[1];
    expect(swapped.get("low-solid")).toBe("high-solid");
    expect(swapped.get("high-solid")).toBe("low-solid");
  });

  it("does not permit the polymorph swap once either identity is visibly anchored", () => {
    const plan = derivePhaseIdentity([
      phase("low", "complete-range", { familyKey: "p", temperatureContract: "low-temperature" }),
      phase("high", "complete-range", { familyKey: "p", temperatureContract: "high-temperature" }),
    ], [
      facts("low", 50, { touchesA: true, touchesB: true, temperatureRole: "low-temperature", visibleNotationAnchor: true }),
      facts("high", 50, { touchesA: true, touchesB: true, temperatureRole: "high-temperature" }),
    ]);

    expect(plan.answerAutomorphisms).toHaveLength(1);
    expect(plan.phases.every((item) => item.labelEquivalenceGroup === undefined)).toBe(true);
  });

  it("numbers intermediate identities left-to-right independently of input order", () => {
    const plan = derivePhaseIdentity([
      phase("right compound", "fixed-composition", { state: "line-compound", formulaLabel: "AB₃" }),
      phase("left compound", "fixed-composition", { state: "line-compound", formulaLabel: "AB" }),
    ], [
      facts("right compound", 75, { compositionSiteId: "AB3", fixedCompositionBPercent: 75 }),
      facts("left compound", 50, { compositionSiteId: "AB", fixedCompositionBPercent: 50 }),
    ]);

    expect(plan.phases.find((item) => item.sourceKey === "left compound")?.symbol).toBe("γ");
    expect(plan.phases.find((item) => item.sourceKey === "right compound")?.symbol).toBe("δ");
  });

  it("keeps an ordered derivative in its base family and adds a prime", () => {
    const plan = derivePhaseIdentity([
      phase("disordered", "complete-range", { familyKey: "ordered solution" }),
      phase("ordered", "complete-range", {
        familyKey: "ordered solution",
        relationship: { kind: "ordered-derivative", baseSourceKey: "disordered" },
      }),
    ], [
      facts("disordered", 50, { touchesA: true, touchesB: true }),
      facts("ordered", 50, { touchesA: true, touchesB: true, derivativeOf: "disordered" }),
    ]);

    const base = plan.phases.find((item) => item.sourceKey === "disordered")!;
    const ordered = plan.phases.find((item) => item.sourceKey === "ordered")!;
    expect([base.symbol, ordered.symbol]).toEqual(["α", "α′"]);
    expect(ordered.phaseFamilyId).toBe(base.phaseFamilyId);
    expect(plan.answerAutomorphisms).toHaveLength(1);
  });

  it("aligns fixed-composition polymorphs at one site and derives one unanchored global swap", () => {
    const plan = derivePhaseIdentity([
      phase("low AB", "fixed-composition", { state: "line-compound", familyKey: "AB polymorph", temperatureContract: "low-temperature", formulaLabel: "AB" }),
      phase("high AB", "fixed-composition", { state: "line-compound", familyKey: "AB polymorph", temperatureContract: "high-temperature", formulaLabel: "AB" }),
    ], [
      facts("low AB", 50, { compositionSiteId: "AB", fixedCompositionBPercent: 50, temperatureRole: "low-temperature" }),
      facts("high AB", 50, { compositionSiteId: "AB", fixedCompositionBPercent: 50, temperatureRole: "high-temperature" }),
    ]);

    expect(plan.phases.map((item) => item.symbol)).toEqual(["γ", "γ′"]);
    expect(plan.answerAutomorphisms).toHaveLength(2);
  });

  it("forms a Cartesian product of independent swaps while every map remains globally bijective", () => {
    const plan = derivePhaseIdentity([
      phase("full low", "complete-range", { familyKey: "full", temperatureContract: "low-temperature" }),
      phase("full high", "complete-range", { familyKey: "full", temperatureContract: "high-temperature" }),
      phase("site low", "fixed-composition", { state: "line-compound", familyKey: "site", temperatureContract: "low-temperature" }),
      phase("site high", "fixed-composition", { state: "line-compound", familyKey: "site", temperatureContract: "high-temperature" }),
    ], [
      facts("full low", 50, { touchesA: true, touchesB: true, temperatureRole: "low-temperature" }),
      facts("full high", 50, { touchesA: true, touchesB: true, temperatureRole: "high-temperature" }),
      facts("site low", 60, { compositionSiteId: "site", fixedCompositionBPercent: 60, temperatureRole: "low-temperature" }),
      facts("site high", 60, { compositionSiteId: "site", fixedCompositionBPercent: 60, temperatureRole: "high-temperature" }),
    ]);

    expect(plan.answerAutomorphisms).toHaveLength(4);
    for (const mapping of plan.answerAutomorphisms) {
      expect(new Set(mapping.values()).size).toBe(plan.phases.length);
      expect(mapping.get("full-low")).toMatch(/^full-/);
      expect(mapping.get("site-low")).toMatch(/^site-/);
    }
  });

  it.each([
    {
      title: "declared terminal role contradicts edge incidence",
      phases: [phase("wrong side", "a-terminal")],
      inferred: [facts("wrong side", 95, { touchesB: true })],
      rule: "composition-contract-mismatch",
    },
    {
      title: "temperature contract contradicts reconstructed ordering",
      phases: [phase("solid", "complete-range", { temperatureContract: "low-temperature" })],
      inferred: [facts("solid", 50, { touchesA: true, touchesB: true, temperatureRole: "high-temperature" })],
      rule: "temperature-contract-mismatch",
    },
    {
      title: "ordered derivative is at another composition domain",
      phases: [
        phase("base", "a-terminal", { familyKey: "f" }),
        phase("ordered", "b-terminal", { familyKey: "f", relationship: { kind: "ordered-derivative", baseSourceKey: "base" } }),
      ],
      inferred: [
        facts("base", 5, { touchesA: true }),
        facts("ordered", 95, { touchesB: true, derivativeOf: "base" }),
      ],
      rule: "derivative-domain-mismatch",
    },
    {
      title: "fixed polymorphs claim one site at different compositions",
      phases: [
        phase("one", "fixed-composition", { state: "line-compound", familyKey: "f", temperatureContract: "low-temperature" }),
        phase("two", "fixed-composition", { state: "line-compound", familyKey: "f", temperatureContract: "high-temperature" }),
      ],
      inferred: [
        facts("one", 40, { compositionSiteId: "same", fixedCompositionBPercent: 40, temperatureRole: "low-temperature" }),
        facts("two", 41, { compositionSiteId: "same", fixedCompositionBPercent: 41, temperatureRole: "high-temperature" }),
      ],
      rule: "fixed-site-misalignment",
    },
  ])("rejects $title", ({ phases, inferred, rule }) => {
    try {
      derivePhaseIdentity(phases, inferred);
      expect.fail("Expected the identity contract to be rejected");
    } catch (error) {
      expect(error).toBeInstanceOf(PhaseIdentityError);
      expect((error as PhaseIdentityError).issues.map((item) => item.ruleId)).toContain(rule);
    }
  });

  it("rejects normalized stable-id collisions", () => {
    expect(() => derivePhaseIdentity([
      phase("A phase", "a-terminal"),
      phase("a--phase", "b-terminal"),
    ], [
      facts("A phase", 5, { touchesA: true }),
      facts("a--phase", 95, { touchesB: true }),
    ])).toThrow(PhaseIdentityError);
  });
});
