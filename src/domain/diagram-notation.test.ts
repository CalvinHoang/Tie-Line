import { describe, expect, it } from "vitest";
import { generateRound } from "./generator";

describe("diagram notation projection", () => {
  it("keeps monotectoid global alpha separate from alpha branch notation", () => {
    const round = generateRound(8, "normal");
    expect(round.family).toBe("monotectoid");
    const invariant = round.solution.invariants.find((item) => item.reactionType === "monotectoid")!;
    const parent = invariant.reactantPhaseIds![0];
    const familyProduct = invariant.productPhaseIds!.find((id) =>
      round.puzzle.phases.find((phase) => phase.id === id)?.phaseFamilyId
      === round.puzzle.phases.find((phase) => phase.id === parent)?.phaseFamilyId)!;

    expect(invariant.participantNotation?.[parent]).toBe("α₁");
    expect(invariant.participantNotation?.[familyProduct]).toBe("α₂");
    const singletonFamilyFields = round.solution.expectedFields.filter((field) =>
      field.expectedAssemblage.length === 1 && [parent, familyProduct].includes(field.expectedAssemblage[0]));
    expect(singletonFamilyFields).toHaveLength(2);
    expect(singletonFamilyFields.map((field) => field.expectedLabelIds?.[0])).toEqual([
      expect.stringMatching(/^family:/),
      expect.stringMatching(/^family:/),
    ]);
    expect(new Set(singletonFamilyFields.map((field) => field.expectedLabelIds?.[0])).size).toBe(1);
    const global = round.puzzle.diagramLabels.find((label) => label.id === singletonFamilyFields[0].expectedLabelIds?.[0]);
    expect(global).toMatchObject({ symbol: "α", scope: "global-phase" });
    expect(round.puzzle.title).toContain("α₁ → α₂ + β");
  });

  it("uses global L above a monotectic but L1/L2 for its invariant branches", () => {
    const round = generateRound(2, "hard");
    expect(round.family).toBe("monotectic");
    const invariant = round.solution.invariants.find((item) => item.reactionType === "monotectic")!;
    const top = round.solution.expectedFields.find((field) => field.role === "liquid")!;
    expect(top.expectedAssemblage).toEqual(["L"]);
    expect(top.expectedLabelIds).toEqual(["L"]);
    expect(round.puzzle.diagramLabels.find((label) => label.id === "L")?.symbol).toBe("L");
    expect(Object.values(invariant.participantNotation ?? {})).toEqual(expect.arrayContaining(["L₁", "L₂"]));
  });
});
