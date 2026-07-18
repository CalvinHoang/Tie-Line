import { describe, expect, it } from "vitest";
import { generateRound } from "../domain/generator";
import {
  addPhaseToCell,
  createLabelingState,
  togglePhaseInCell,
} from "./state";

describe("phase-label placement state", () => {
  it("stores cell phases in the puzzle's canonical order regardless of click order", () => {
    const { puzzle, solution } = generateRound(0, "easy");
    const order = puzzle.phases.map((phase) => phase.id);
    let state = createLabelingState(puzzle, solution);
    const cellId = state.cells[0].id;

    state = addPhaseToCell(state, cellId, "beta", order);
    state = addPhaseToCell(state, cellId, "L", order);

    expect(state.cells.find((cell) => cell.id === cellId)?.phaseOrder).toEqual(["L", "beta"]);
  });

  it("returns the same state for duplicate additions so undo history can ignore no-ops", () => {
    const { puzzle, solution } = generateRound(0, "easy");
    const state = createLabelingState(puzzle, solution);
    const cellId = state.cells[0].id;
    const once = addPhaseToCell(state, cellId, "L");

    expect(addPhaseToCell(once, cellId, "L")).toBe(once);
  });

  it("toggles the active phase directly on fields", () => {
    const { puzzle, solution } = generateRound(0, "easy");
    const order = puzzle.phases.map((phase) => phase.id);
    let state = createLabelingState(puzzle, solution);
    const cellId = state.cells[0].id;
    state = togglePhaseInCell(state, cellId, "L", order);
    expect(state.cells.find((cell) => cell.id === cellId)?.phaseOrder).toEqual(["L"]);
    state = togglePhaseInCell(state, cellId, "L", order);
    expect(state.cells.find((cell) => cell.id === cellId)?.phaseOrder).toEqual([]);
  });
});
