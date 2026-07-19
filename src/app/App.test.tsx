import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { generateRound } from "../domain/generator";
import { createLabelingState } from "../editor/state";
import { defaultProfile, saveConstruction, saveProfile, savePuzzleSeed, type SolveRecord } from "../game/persistence";
import { App } from "./App";

describe("Tie-Line launch", () => {
  beforeEach(() => localStorage.clear());

  it("opens on a separate, single-column main menu", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "TIE-LINE" })).toBeInTheDocument();
    for (const name of ["Start", "Rules", "Settings"]) expect(screen.getByRole("button", { name })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resume" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Practice" })).not.toBeInTheDocument();
    expect(screen.queryByText(/phase equilibrium labelling/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /tie-line logo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("application", { name: /phase diagram board/i })).not.toBeInTheDocument();
  });

  it("keeps the play controls compact and label-only", async () => {
    const { container } = render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /Start/i }));
    await userEvent.click(screen.getByRole("button", { name: /start labelling/i }));
    expect(container.querySelector(".critical-options")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear all labels" })).toBeDisabled();
    const phaseChooser = screen.getByRole("button", { name: /Choose phase/i });
    expect(phaseChooser).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("toolbar", { name: "Phase symbols" })).not.toBeInTheDocument();
    await userEvent.click(phaseChooser);
    expect(screen.getByRole("toolbar", { name: "Phase symbols" })).toBeInTheDocument();
    for (const name of ["Point", "Curve", "Horizontal", "Select"]) {
      expect(screen.queryByRole("button", { name: `${name} mode` })).not.toBeInTheDocument();
    }
  });

  it("clears all placed phase labels as one undoable action", async () => {
    saveProfile({ ...defaultProfile(), onboardingComplete: true });
    const { container } = render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Start" }));
    const fields = container.querySelectorAll<SVGPathElement>(".field-target");
    await userEvent.click(fields[0]);
    await userEvent.click(fields[1]);
    expect(container.querySelectorAll(".phase-label")).toHaveLength(2);

    await userEvent.click(screen.getByRole("button", { name: "Clear all labels" }));
    expect(container.querySelectorAll(".phase-label")).toHaveLength(0);
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(container.querySelectorAll(".phase-label")).toHaveLength(2);
  });

  it("blocks the board after the final failed submission and offers all four outcomes", async () => {
    saveProfile({ ...defaultProfile(), onboardingComplete: true });
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Start" }));
    const submit = screen.getByRole("button", { name: "Submit labels" });
    await userEvent.click(submit);
    await userEvent.click(submit);
    await userEvent.click(submit);

    const dialog = screen.getByRole("dialog", { name: "Choose what happens next" });
    for (const name of ["Continue", "Reveal", "New", "Menu"]) {
      expect(within(dialog).getByRole("button", { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "Submit labels" })).not.toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole("button", { name: "Continue" }));
    expect(screen.queryByRole("dialog", { name: "Choose what happens next" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit labels" })).toBeInTheDocument();
  });

  it("shows the notes fundamentals without a search field", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Rules" }));
    expect(screen.getByRole("heading", { name: "Compatibility triangles" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Processing definitions" })).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("separates honest statistics for Easy, Normal, and Hard while preserving recent history", async () => {
    const records: SolveRecord[] = [
      { puzzleId: "easy-solved", seed: 1, difficulty: "easy", family: "simple-eutectic", outcome: "solved", scored: true, noError: true, elapsedMilliseconds: 45_000, submissions: 1, completedAt: "2026-07-19T08:00:00.000Z" },
      { puzzleId: "easy-failed", seed: 2, difficulty: "easy", family: "simple-eutectic", outcome: "failed", scored: true, noError: false, elapsedMilliseconds: 50_000, submissions: 3, completedAt: "2026-07-19T08:10:00.000Z" },
      { puzzleId: "normal-clean", seed: 3, difficulty: "normal", family: "peritectic-point", outcome: "solved", scored: true, noError: true, elapsedMilliseconds: 91_000, submissions: 1, completedAt: "2026-07-19T08:20:00.000Z" },
      { puzzleId: "normal-retry", seed: 4, difficulty: "normal", family: "eutectoid", outcome: "solved", scored: true, noError: false, elapsedMilliseconds: 75_000, submissions: 2, completedAt: "2026-07-19T08:30:00.000Z" },
    ];
    saveProfile({ ...defaultProfile(), onboardingComplete: true, history: records });

    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Statistics" }));

    const easy = screen.getByRole("heading", { name: "Easy" }).closest("section");
    const normal = screen.getByRole("heading", { name: "Normal" }).closest("section");
    const hard = screen.getByRole("heading", { name: "Hard" }).closest("section");
    expect(easy).not.toBeNull();
    expect(normal).not.toBeNull();
    expect(hard).not.toBeNull();
    expect(within(easy!).getByText("1")).toBeInTheDocument();
    expect(within(easy!).getByText("100%")).toBeInTheDocument();
    expect(within(easy!).getByText("00:45")).toBeInTheDocument();
    expect(within(normal!).getByText("2")).toBeInTheDocument();
    expect(within(normal!).getByText("50%")).toBeInTheDocument();
    expect(within(normal!).getByText("01:15")).toBeInTheDocument();
    expect(within(hard!).getByText("0")).toBeInTheDocument();
    expect(within(hard!).getByText("0%")).toBeInTheDocument();
    expect(within(hard!).getByText("—")).toBeInTheDocument();
    expect(within(screen.getByRole("heading", { name: "Recent" }).parentElement!).getByText(/normal · eutectoid/i)).toBeInTheDocument();
  });

  it("resumes a large Hard puzzle with its complete phase inventory", async () => {
    const round = generateRound(13, "hard");
    const labeling = createLabelingState(round.puzzle, round.solution);
    savePuzzleSeed(round.seed, "hard");
    saveProfile({ ...defaultProfile(), lastDifficulty: "hard", onboardingComplete: true });
    saveConstruction({
      ...labeling,
      cells: labeling.cells.map((cell, index) => index === 0 ? { ...cell, phaseOrder: ["L"] } : cell),
    }, "hard");

    const { container } = render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Resume" }));

    expect(container.querySelector(".game-shell.is-large-binary")).toBeInTheDocument();
    expect(container.querySelectorAll(".invariant-line")).toHaveLength(round.solution.invariants.length);
    await userEvent.click(screen.getByRole("button", { name: /Choose phase/i }));
    expect(within(screen.getByRole("toolbar", { name: "Phase symbols" })).getAllByRole("button"))
      .toHaveLength(round.puzzle.phases.length);
    expect(container.querySelector(".axis-t")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".intermediate-phase-symbol").length).toBeGreaterThan(0);
  });
});
