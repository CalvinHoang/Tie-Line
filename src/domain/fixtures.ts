import type { HiddenSolution, PuzzleDefinition } from "./schema";

export const goldenPuzzle: PuzzleDefinition = {
  schemaVersion: "tie-line-mvp-3",
  id: "tie-line-eutectic-001",
  title: "Tie-Line",
  compositionMinPercentB: 0,
  compositionMaxPercentB: 100,
  temperatureMinCelsius: 0,
  temperatureMaxCelsius: 1100,
  endMemberLabels: { left: "A", right: "B" },
  intermediateCompositions: [],
  phases: [
    { id: "L", symbol: "L", name: "Liquid", kind: "liquid", required: true },
    { id: "alpha", symbol: "α", name: "Alpha", kind: "terminal-solid", required: true },
    { id: "beta", symbol: "β", name: "Beta", kind: "terminal-solid", required: true },
  ],
  pointRoles: [
    { id: "a-melt", symbol: "Aₘ", constraint: { kind: "left-edge" }, required: true, instructionLabel: "A 1000°" },
    { id: "b-melt", symbol: "Bₘ", constraint: { kind: "right-edge" }, required: true, instructionLabel: "B 850°" },
    { id: "alpha-eut", symbol: "αE", constraint: { kind: "fixed-temperature", temperatureCelsius: 700 }, required: true, instructionLabel: "α@E 10%B" },
    { id: "eutectic", symbol: "E", constraint: { kind: "fixed-temperature", temperatureCelsius: 700 }, required: true, instructionLabel: "E 700° · 40%B" },
    { id: "beta-eut", symbol: "βE", constraint: { kind: "fixed-temperature", temperatureCelsius: 700 }, required: true, instructionLabel: "β@E 80%B" },
    { id: "alpha-low", symbol: "α0", constraint: { kind: "bottom-edge" }, required: true, instructionLabel: "α@0 0%B" },
    { id: "beta-low", symbol: "β0", constraint: { kind: "bottom-edge" }, required: true, instructionLabel: "β@0 100%B" },
  ],
  instructions: [
    { id: "instruction-a", compactText: "A 1000°", roleId: "a-melt" },
    { id: "instruction-b", compactText: "B 850°", roleId: "b-melt" },
    { id: "instruction-e", compactText: "E 700°·40%B", roleId: "eutectic" },
    { id: "instruction-alpha-e", compactText: "αE 10%B", roleId: "alpha-eut" },
    { id: "instruction-beta-e", compactText: "βE 80%B", roleId: "beta-eut" },
    { id: "instruction-alpha-0", compactText: "α0 0%B", roleId: "alpha-low" },
    { id: "instruction-beta-0", compactText: "β0 100%B", roleId: "beta-low" },
  ],
  permittedTools: ["point", "curve", "horizontal", "label", "select", "erase"],
  requiredCurves: [
    { startRoleId: "a-melt", endRoleId: "eutectic", semanticRole: "liquidus-left", boundaryKind: "liquidus" },
    { startRoleId: "b-melt", endRoleId: "eutectic", semanticRole: "liquidus-right", boundaryKind: "liquidus" },
    { startRoleId: "a-melt", endRoleId: "alpha-eut", semanticRole: "solidus-left", boundaryKind: "solidus" },
    { startRoleId: "b-melt", endRoleId: "beta-eut", semanticRole: "solidus-right", boundaryKind: "solidus" },
    { startRoleId: "alpha-low", endRoleId: "alpha-eut", semanticRole: "solvus-left", boundaryKind: "solvus" },
    { startRoleId: "beta-low", endRoleId: "beta-eut", semanticRole: "solvus-right", boundaryKind: "solvus" },
  ],
  requiredInvariants: [{
    startRoleId: "alpha-eut",
    endRoleId: "beta-eut",
    interiorRoleIds: ["eutectic"],
    expectedAssemblage: ["L", "alpha", "beta"],
    reactionType: "eutectic",
  }],
  expectedFieldCount: 6,
  expectedFields: [
    { role: "liquid", expectedAssemblage: ["L"], witnessPoint: { compositionBPercent: 50, temperatureCelsius: 900 } },
    { role: "alpha", expectedAssemblage: ["alpha"], witnessPoint: { compositionBPercent: 2, temperatureCelsius: 500 } },
    { role: "beta", expectedAssemblage: ["beta"], witnessPoint: { compositionBPercent: 96, temperatureCelsius: 425 } },
    { role: "liquid-alpha", expectedAssemblage: ["L", "alpha"], witnessPoint: { compositionBPercent: 12, temperatureCelsius: 850 } },
    { role: "liquid-beta", expectedAssemblage: ["L", "beta"], witnessPoint: { compositionBPercent: 78, temperatureCelsius: 775 } },
    { role: "alpha-beta", expectedAssemblage: ["alpha", "beta"], witnessPoint: { compositionBPercent: 50, temperatureCelsius: 350 } },
  ],
  allowExtraGeometryOnSubmit: false,
};

export const goldenSolution: HiddenSolution = {
  puzzleId: goldenPuzzle.id,
  points: [
    { roleId: "a-melt", point: { compositionBPercent: 0, temperatureCelsius: 1000 } },
    { roleId: "b-melt", point: { compositionBPercent: 100, temperatureCelsius: 850 } },
    { roleId: "alpha-eut", point: { compositionBPercent: 10, temperatureCelsius: 700 } },
    { roleId: "eutectic", point: { compositionBPercent: 40, temperatureCelsius: 700 } },
    { roleId: "beta-eut", point: { compositionBPercent: 80, temperatureCelsius: 700 } },
    { roleId: "alpha-low", point: { compositionBPercent: 0, temperatureCelsius: 0 } },
    { roleId: "beta-low", point: { compositionBPercent: 100, temperatureCelsius: 0 } },
  ],
  curves: [
    { type: "curve", startRoleId: "a-melt", endRoleId: "eutectic", recommendedControl: { compositionBPercent: 17, temperatureCelsius: 860 } },
    { type: "curve", startRoleId: "b-melt", endRoleId: "eutectic", recommendedControl: { compositionBPercent: 70, temperatureCelsius: 790 } },
    { type: "curve", startRoleId: "a-melt", endRoleId: "alpha-eut", recommendedControl: { compositionBPercent: 5, temperatureCelsius: 840 } },
    { type: "curve", startRoleId: "b-melt", endRoleId: "beta-eut", recommendedControl: { compositionBPercent: 91, temperatureCelsius: 790 } },
    { type: "curve", startRoleId: "alpha-low", endRoleId: "alpha-eut", recommendedControl: { compositionBPercent: 2, temperatureCelsius: 390 } },
    { type: "curve", startRoleId: "beta-low", endRoleId: "beta-eut", recommendedControl: { compositionBPercent: 95, temperatureCelsius: 400 } },
  ],
  invariants: [{
    type: "invariant-horizontal",
    startRoleId: "alpha-eut",
    endRoleId: "beta-eut",
    interiorRoleIds: ["eutectic"],
    temperatureCelsius: 700,
    expectedAssemblage: ["L", "alpha", "beta"],
    reactionType: "eutectic",
  }],
  expectedFields: goldenPuzzle.expectedFields,
};

export function assertFixtureCompatibility(puzzle = goldenPuzzle, solution = goldenSolution): void {
  if (puzzle.id !== solution.puzzleId) throw new Error("Puzzle and solution IDs differ.");
  const roles = new Set(puzzle.pointRoles.map((role) => role.id));
  for (const point of solution.points) {
    if (!roles.has(point.roleId)) throw new Error(`Unknown solution point role: ${point.roleId}`);
  }
  if (solution.expectedFields.length !== puzzle.expectedFieldCount) throw new Error("Expected field count differs.");
}
