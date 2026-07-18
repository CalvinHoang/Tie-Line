import { describe, expect, it } from "vitest";
import { pointInPolygon, sameLogicalPoint } from "./geometry";
import { createLabelingState } from "../editor/state";
import { validateSubmit } from "../game/validator";
import { generateEutecticRound, generateRound, type Difficulty } from "./generator";

describe("procedural phase-diagram generator", () => {
  it("is deterministic for a seed and varies between seeds", () => {
    expect(generateEutecticRound(12345)).toEqual(generateEutecticRound(12345));
    expect(generateEutecticRound(12345).solution.points).not.toEqual(generateEutecticRound(12346).solution.points);
  });

  it("produces a valid six-field label puzzle across many seeds", () => {
    for (let seed = 0; seed < 500; seed += 1) {
      const { puzzle, solution } = generateEutecticRound(seed);
      const state = createLabelingState(puzzle, solution);
      expect(state.points, `seed ${seed}`).toHaveLength(7);
      expect(state.geometry, `seed ${seed}`).toHaveLength(7);
      expect(state.cells, `seed ${seed}`).toHaveLength(6);
      expect(state.activeTool).toBe("label");
      expect(state.cells.every((cell) => cell.phaseOrder.length === 0)).toBe(true);
      expect(validateSubmit(state, puzzle, solution).status).toBe("incomplete");

      const solved = {
        ...state,
        cells: state.cells.map((cell) => ({
          ...cell,
          phaseOrder: solution.expectedFields.find((field) => pointInPolygon(field.witnessPoint, cell.polygon))?.expectedAssemblage ?? [],
        })),
        geometry: state.geometry.map((item) => item.type === "invariant-horizontal"
          ? { ...item, phaseOrder: solution.invariants.find((invariant) => invariant.temperatureCelsius === item.temperatureCelsius)?.expectedAssemblage ?? [] }
          : item),
      };
      expect(validateSubmit(solved, puzzle, solution), `seed ${seed}`).toEqual({ status: "solved", violations: [] });
    }
  });

  it("produces solvable label-first puzzles for every difficulty", () => {
    const difficulties: Difficulty[] = ["easy", "normal", "hard"];
    for (const difficulty of difficulties) {
      for (let seed = 0; seed < 150; seed += 1) {
        const { puzzle, solution } = generateRound(seed, difficulty);
        const state = createLabelingState(puzzle, solution);
        expect(state.cells, `${difficulty} seed ${seed}`).toHaveLength(puzzle.expectedFieldCount);
        expect(state.geometry.filter((item) => item.type === "invariant-horizontal")).toHaveLength(solution.invariants.length);
        const solved = {
          ...state,
          cells: state.cells.map((cell) => ({ ...cell, phaseOrder: (solution.expectedFields.find((field) => sameLogicalPoint(field.witnessPoint, cell.labelPoint)) ?? solution.expectedFields.find((field) => pointInPolygon(field.witnessPoint, cell.polygon)))?.expectedAssemblage ?? [] })),
          geometry: state.geometry.map((item) => item.type === "invariant-horizontal"
            ? { ...item, phaseOrder: solution.invariants.find((invariant) => invariant.temperatureCelsius === item.temperatureCelsius)?.expectedAssemblage ?? [] }
            : item),
        };
        expect(validateSubmit(solved, puzzle, solution), `${difficulty} seed ${seed}`).toEqual({ status: "solved", violations: [] });
      }
    }
  });

  it("uses the agreed reaction pools and complexity limits", () => {
    const easy = Array.from({ length: 5 }, (_, seed) => generateRound(seed, "easy"));
    const normal = Array.from({ length: 8 }, (_, seed) => generateRound(seed, "normal"));
    const hard = Array.from({ length: 14 }, (_, seed) => generateRound(seed, "hard"));
    expect(new Set(easy.map((round) => round.family))).toEqual(new Set(["compound-double-eutectic", "peritectic", "subsolidus-polymorph", "eutectoid", "peritectoid"]));
    expect(new Set(normal.map((round) => round.family))).toEqual(new Set(["compound-double-eutectic", "peritectic", "subsolidus-polymorph", "eutectoid", "peritectoid", "inverse-peritectic", "supersolidus-polymorph", "superlattice"]));
    expect(new Set(hard.map((round) => round.family))).toEqual(new Set([
      "triple-eutectic", "syntectic", "monotectic", "liquid-spinodal", "solid-spinodal", "monotectoid",
      "compound-double-eutectic", "peritectic", "subsolidus-polymorph", "eutectoid", "peritectoid", "inverse-peritectic", "supersolidus-polymorph", "superlattice",
    ]));
    expect([...easy, ...normal].every((round) => round.intermediatePhaseCount === 1 && round.criticalPointCount === 2)).toBe(true);
    expect(hard.every((round) => (round.intermediatePhaseCount ?? 0) <= 2 && round.criticalPointCount === 3)).toBe(true);
    expect([...easy, ...normal, ...hard].every((round) => (round.layoutQualityScore ?? 0) > 0)).toBe(true);
  });
});
