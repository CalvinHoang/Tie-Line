import { describe, expect, it } from "vitest";
import { extractFaces } from "../canvas/face-extraction";
import { goldenPuzzle, goldenSolution } from "../domain/fixtures";
import { pointInPolygon } from "../domain/geometry";
import type { ConstructionState, PlayerGeometry } from "../domain/schema";
import { createInitialState } from "../editor/state";
import { validateSubmit } from "./validator";

function solvedState(): ConstructionState {
  const points = goldenSolution.points.map((item, index) => ({
    id: `point:${item.roleId}`,
    roleId: item.roleId,
    point: item.point,
    createdAtOrdinal: index,
  }));
  const geometry: PlayerGeometry[] = [
    ...goldenSolution.curves.map((curve, index) => ({
      type: "curve" as const,
      id: `curve:${index}`,
      startPointId: `point:${curve.startRoleId}`,
      endPointId: `point:${curve.endRoleId}`,
      control: curve.recommendedControl,
      createdBy: "player" as const,
    })),
    {
      type: "invariant-horizontal",
      id: "horizontal:0",
      startPointId: "point:alpha-eut",
      endPointId: "point:beta-eut",
      interiorPointIds: ["point:eutectic"],
      temperatureCelsius: 700,
      phaseOrder: ["beta", "L", "alpha"],
      createdBy: "player",
    },
  ];
  const cells = extractFaces(points, geometry).map((cell) => {
    const expected = goldenSolution.expectedFields.find((field) => pointInPolygon(field.witnessPoint, cell.polygon));
    return { ...cell, phaseOrder: expected ? [...expected.expectedAssemblage].reverse() : [] };
  });
  return { ...createInitialState(goldenPuzzle), points, geometry, cells };
}

describe("semantic submit validator", () => {
  it("reports an empty board as incomplete", () => {
    expect(validateSubmit(createInitialState(goldenPuzzle), goldenPuzzle, goldenSolution).status).toBe("incomplete");
  });

  it("accepts the golden topology regardless of phase insertion order", () => {
    expect(validateSubmit(solvedState(), goldenPuzzle, goldenSolution)).toEqual({ status: "solved", violations: [] });
  });

  it("ignores cosmetic curve-control changes", () => {
    const state = solvedState();
    state.geometry = state.geometry.map((geometry, index) => geometry.type === "curve" && index === 0
      ? { ...geometry, control: { compositionBPercent: 15, temperatureCelsius: 875 } }
      : geometry);
    state.cells = extractFaces(state.points, state.geometry, state.cells);
    expect(validateSubmit(state, goldenPuzzle, goldenSolution).status).toBe("solved");
  });

  it("rejects a wrong instruction coordinate", () => {
    const state = solvedState();
    state.points = state.points.map((point) => point.roleId === "eutectic"
      ? { ...point, point: { ...point.point, compositionBPercent: 50 } }
      : point);
    expect(validateSubmit(state, goldenPuzzle, goldenSolution).status).toBe("incorrect");
  });
});
