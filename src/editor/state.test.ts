import { describe, expect, it } from "vitest";
import { generateRound } from "../domain/generator";
import {
  addPhaseToCell,
  addPhaseToInvariant,
  createLabelingState,
  togglePhaseInCell,
  togglePhaseInInvariant,
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

  it("reorders invariant assemblages using the same canonical sequence", () => {
    const { puzzle, solution } = generateRound(0, "easy");
    const order = puzzle.phases.map((phase) => phase.id);
    let state = createLabelingState(puzzle, solution);
    const invariant = state.geometry.find((item) => item.type === "invariant-horizontal");
    if (!invariant) throw new Error("Expected an invariant line");

    state = addPhaseToInvariant(state, invariant.id, "beta", order);
    state = addPhaseToInvariant(state, invariant.id, "L", order);

    const labelledInvariant = state.geometry.find((item) => item.id === invariant.id);
    expect(labelledInvariant?.type).toBe("invariant-horizontal");
    if (labelledInvariant?.type !== "invariant-horizontal") throw new Error("Invariant was lost");
    expect(labelledInvariant.phaseOrder).toEqual(["L", "beta"]);
  });

  it("returns the same state for duplicate additions so undo history can ignore no-ops", () => {
    const { puzzle, solution } = generateRound(0, "easy");
    const state = createLabelingState(puzzle, solution);
    const cellId = state.cells[0].id;
    const once = addPhaseToCell(state, cellId, "L");

    expect(addPhaseToCell(once, cellId, "L")).toBe(once);
  });

  it("toggles the active phase directly on fields and invariants", () => {
    const { puzzle, solution } = generateRound(0, "easy");
    const order = puzzle.phases.map((phase) => phase.id);
    let state = createLabelingState(puzzle, solution);
    const cellId = state.cells[0].id;
    const invariant = state.geometry.find((item) => item.type === "invariant-horizontal");
    if (!invariant) throw new Error("Expected an invariant line");

    state = togglePhaseInCell(state, cellId, "L", order);
    expect(state.cells.find((cell) => cell.id === cellId)?.phaseOrder).toEqual(["L"]);
    state = togglePhaseInCell(state, cellId, "L", order);
    expect(state.cells.find((cell) => cell.id === cellId)?.phaseOrder).toEqual([]);

    state = togglePhaseInInvariant(state, invariant.id, "alpha", order);
    const labelled = state.geometry.find((item) => item.id === invariant.id);
    expect(labelled?.type === "invariant-horizontal" ? labelled.phaseOrder : undefined).toEqual(["alpha"]);
    state = togglePhaseInInvariant(state, invariant.id, "alpha", order);
    const cleared = state.geometry.find((item) => item.id === invariant.id);
    expect(cleared?.type === "invariant-horizontal" ? cleared.phaseOrder : undefined).toEqual([]);
  });
});
