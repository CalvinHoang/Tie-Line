import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
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
    expect(screen.getByRole("button", { name: "Erase labels" })).toBeInTheDocument();
    expect(screen.getByRole("toolbar", { name: "Phase symbols" })).toBeInTheDocument();
    for (const name of ["Point", "Curve", "Horizontal", "Select"]) {
      expect(screen.queryByRole("button", { name: `${name} mode` })).not.toBeInTheDocument();
    }
  });

  it("shows the notes fundamentals without a search field", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Rules" }));
    expect(screen.getByRole("heading", { name: "Compatibility triangles" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Processing definitions" })).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });
});
