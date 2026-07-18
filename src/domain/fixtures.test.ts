import { describe, expect, it } from "vitest";
import { assertFixtureCompatibility, goldenPuzzle, goldenSolution } from "./fixtures";

describe("golden fixtures", () => {
  it("loads compatible public and hidden fixtures", () => {
    expect(() => assertFixtureCompatibility()).not.toThrow();
    expect(goldenPuzzle.pointRoles).toHaveLength(7);
    expect(goldenSolution.points).toHaveLength(7);
  });

  it("keeps the scientific anchors and invariant exact", () => {
    const point = (roleId: string) => goldenSolution.points.find((candidate) => candidate.roleId === roleId)!.point;
    expect(point("a-melt")).toEqual({ compositionBPercent: 0, temperatureCelsius: 1000 });
    expect(point("b-melt")).toEqual({ compositionBPercent: 100, temperatureCelsius: 850 });
    expect(point("eutectic")).toEqual({ compositionBPercent: 40, temperatureCelsius: 700 });
    expect(goldenSolution.invariants[0]).toMatchObject({
      temperatureCelsius: 700,
      startRoleId: "alpha-eut",
      endRoleId: "beta-eut",
      interiorRoleIds: ["eutectic"],
    });
  });
});
