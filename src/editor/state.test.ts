import { describe, expect, it } from "vitest";
import { generateRound } from "../domain/generator";
import {
  addPhaseToCell,
  clearPhaseLabels,
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

  it("clears every field label without changing the puzzle or current phase", () => {
    const { puzzle, solution } = generateRound(0, "normal");
    let state = createLabelingState(puzzle, solution);
    state = addPhaseToCell(state, state.cells[0].id, "L");
    state = addPhaseToCell(state, state.cells[1].id, puzzle.phases.at(-1)!.id);

    const cleared = clearPhaseLabels(state);

    expect(cleared.cells.every((cell) => cell.phaseOrder.length === 0)).toBe(true);
    expect(cleared.puzzleId).toBe(state.puzzleId);
    expect(cleared.activePhaseId).toBe(state.activePhaseId);
    expect(cleared.metrics.phaseDeleteCount).toBe(state.metrics.phaseDeleteCount + 2);
    expect(clearPhaseLabels(cleared)).toBe(cleared);
  });
});
