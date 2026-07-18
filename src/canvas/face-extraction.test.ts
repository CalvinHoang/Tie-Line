import { describe, expect, it } from "vitest";
import { goldenSolution } from "../domain/fixtures";
import { pointInPolygon } from "../domain/geometry";
import type { PlayerGeometry, PlayerPoint } from "../domain/schema";
import { extractFaces } from "./face-extraction";

function goldenConstruction(): { points: PlayerPoint[]; geometry: PlayerGeometry[] } {
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
      phaseOrder: [],
      createdBy: "player",
    },
  ];
  return { points, geometry };
}

describe("planar face extraction", () => {
  it("extracts exactly six bounded fields from the golden topology", () => {
    const construction = goldenConstruction();
    const cells = extractFaces(construction.points, construction.geometry);
    expect(cells).toHaveLength(6);
  });

  it("maps each golden witness to one distinct field", () => {
    const construction = goldenConstruction();
    const cells = extractFaces(construction.points, construction.geometry);
    const matched = goldenSolution.expectedFields.map((field) =>
      cells.find((cell) => pointInPolygon(field.witnessPoint, cell.polygon))?.id,
    );
    expect(matched.every(Boolean)).toBe(true);
    expect(new Set(matched).size).toBe(6);
  });

  it("preserves labels when only cosmetic control points change", () => {
    const construction = goldenConstruction();
    const cells = extractFaces(construction.points, construction.geometry).map((cell, index) => ({
      ...cell,
      phaseOrder: [`phase-${index}`],
    }));
    const changed = construction.geometry.map((geometry, index) => geometry.type === "curve" && index === 0
      ? { ...geometry, control: { ...geometry.control, compositionBPercent: geometry.control.compositionBPercent + 1 } }
      : geometry);
    const next = extractFaces(construction.points, changed, cells);
    expect(next.map((cell) => cell.phaseOrder).filter((phases) => phases.length > 0)).toHaveLength(6);
  });
});
