import { describe, expect, it } from "vitest";
import { createLabelingState } from "../editor/state";
import { logicalToSvg } from "../domain/coordinates";
import { pointInPolygon, sameLogicalPoint } from "../domain/geometry";
import { generateRound, type Difficulty } from "../domain/generator";
import { fieldLabelPlacement } from "./label-placement";

describe("field-aware label placement", () => {
  it("fits every correct generated assemblage inside its actual extracted field", () => {
    const pools: Array<[Difficulty, number]> = [["easy", 5], ["normal", 8], ["hard", 14]];
    for (const [difficulty, count] of pools) {
      for (let seed = 0; seed < count * 3; seed += 1) {
        const { puzzle, solution } = generateRound(seed, difficulty);
        const state = createLabelingState(puzzle, solution);
        for (const cell of state.cells) {
          const expected = solution.expectedFields.find((field) => sameLogicalPoint(field.witnessPoint, cell.labelPoint))
            ?? solution.expectedFields.find((field) => pointInPolygon(field.witnessPoint, cell.polygon));
          if (!expected) throw new Error(`Missing expected field for ${difficulty} seed ${seed}`);
          const placement = fieldLabelPlacement(cell.polygon, Math.max(2, expected.expectedAssemblage.length));
          const svg = cell.polygon.map(logicalToSvg);
          const bounds = { width: Math.max(...svg.map((point) => point.x)) - Math.min(...svg.map((point) => point.x)), height: Math.max(...svg.map((point) => point.y)) - Math.min(...svg.map((point) => point.y)) };
          expect(placement.fits, `${difficulty} seed ${seed} field ${expected.role} bounds ${JSON.stringify(bounds)} placement ${JSON.stringify(placement)}`).toBe(true);
        }
      }
    }
  }, 15_000);
});
