import { describe, expect, it } from "vitest";
import { pointInPolygon, sameLogicalPoint } from "./geometry";
import { createLabelingState } from "../editor/state";
import { validateSubmit } from "../game/validator";
import { generateEutecticRound, generateRound, intermediateFormula, type Difficulty } from "./generator";

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
      };
      expect(solved.geometry.filter((item) => item.type === "invariant-horizontal").every((item) => item.phaseOrder.length === 0)).toBe(true);
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
        };
        expect(puzzle.instructions.some((instruction) => /invariant line/i.test(instruction.compactText)), `${difficulty} seed ${seed}`).toBe(false);
        expect(validateSubmit(solved, puzzle, solution), `${difficulty} seed ${seed}`).toEqual({ status: "solved", violations: [] });
      }
    }
  });

  it("uses the agreed reaction pools and complexity limits", () => {
    const easy = Array.from({ length: 5 }, (_, seed) => generateRound(seed, "easy"));
    const normal = Array.from({ length: 6 }, (_, seed) => generateRound(seed, "normal"));
    const hard = Array.from({ length: 10 }, (_, seed) => generateRound(seed, "hard"));
    expect(new Set(easy.map((round) => round.family))).toEqual(new Set(["compound-double-eutectic", "peritectic", "subsolidus-polymorph", "simple-eutectic", "peritectoid"]));
    expect(new Set(normal.map((round) => round.family))).toEqual(new Set(["compound-double-eutectic", "peritectic", "subsolidus-polymorph", "peritectoid", "supersolidus-polymorph", "superlattice"]));
    expect(new Set(hard.map((round) => round.family))).toEqual(new Set([
      "triple-eutectic", "syntectic", "monotectic", "liquid-spinodal", "compound-double-eutectic",
      "peritectic", "subsolidus-polymorph", "peritectoid", "supersolidus-polymorph", "superlattice",
    ]));
    expect(easy.every((round) => (round.intermediatePhaseCount ?? 0) <= 1 && (round.criticalPointCount ?? 0) >= 1)).toBe(true);
    expect(normal.every((round) => (round.intermediatePhaseCount ?? 0) <= 2 && (round.criticalPointCount ?? 0) >= 1)).toBe(true);
    expect(hard.every((round) => (round.intermediatePhaseCount ?? 0) <= 2 && (round.criticalPointCount ?? 0) >= 1)).toBe(true);
    expect([...easy, ...normal, ...hard].every((round) => (round.layoutQualityScore ?? 0) > 0)).toBe(true);
  });

  it("keeps both compound eutectics tied to invariant horizontals", () => {
    const affected = [
      generateRound(2, "normal"),
      generateRound(4, "normal"),
      generateRound(5, "normal"),
    ];
    for (const round of affected) {
      const eutectics = round.solution.invariants.filter((item) => item.reactionType === "eutectic");
      expect(eutectics, round.family).toHaveLength(2);
      expect(eutectics.map((item) => item.interiorRoleIds).flat()).toEqual(expect.arrayContaining(["e1", "e2"]));
    }
  });

  it("orders invariant compositions left-interior-right for a nonzero lever rule", () => {
    const cases = [
      { round: generateRound(1, "easy"), reactionType: "peritectic" },
      { round: generateRound(2, "hard"), reactionType: "monotectic" },
      { round: generateRound(4, "easy"), reactionType: "peritectoid" },
    ];
    for (const { round, reactionType } of cases) {
      const invariant = round.solution.invariants.find((item) => item.reactionType === reactionType)!;
      const byRole = (roleId: string) => round.solution.points.find((item) => item.roleId === roleId)!.point.compositionBPercent;
      const left = byRole(invariant.startRoleId);
      const parent = byRole(invariant.interiorRoleIds[0]);
      const right = byRole(invariant.endRoleId);
      expect(left, round.family).toBeLessThan(parent);
      expect(parent, round.family).toBeLessThan(right);
    }

    const monotectic = cases.find(({ round }) => round.family === "monotectic")!.round;
    expect(monotectic.solution.expectedFields.find((field) => field.role === "L2-alpha")?.expectedAssemblage).toEqual(["L2", "alpha"]);
  });

  it("embeds the peritectoid in a complete melting system", () => {
    const peritectoid = generateRound(3, "normal");
    expect(peritectoid.family).toBe("peritectoid");
    expect(peritectoid.puzzle.phases.map((item) => item.id)).toEqual(["L", "alpha", "gamma", "beta"]);
    expect(peritectoid.solution.invariants.map((item) => item.reactionType)).toEqual(["eutectic", "peritectoid"]);
    expect(peritectoid.solution.expectedFields.find((field) => field.role === "liquid")?.expectedAssemblage).toEqual(["L"]);
    expect(peritectoid.solution.expectedFields.find((field) => field.role === "alpha-beta")?.expectedAssemblage).toEqual(["alpha", "beta"]);
    expect(peritectoid.solution.expectedFields.find((field) => field.role === "alpha-gamma")?.expectedAssemblage).toEqual(["alpha", "gamma"]);
    expect(peritectoid.solution.expectedFields.find((field) => field.role === "gamma-beta")?.expectedAssemblage).toEqual(["gamma", "beta"]);
    expect(peritectoid.puzzle.expectedFieldCount).toBe(6);
  });

  it("does not label a three-phase invariant as spinodal decomposition", () => {
    const spinodal = generateRound(3, "hard");
    expect(spinodal.family).toBe("liquid-spinodal");
    expect(spinodal.solution.invariants.some((item) => item.reactionType === "spinodal-decomposition")).toBe(false);
    expect(spinodal.solution.invariants.some((item) => item.reactionType === "syntectic")).toBe(true);
    expect(spinodal.reactionTypes).toContain("liquid-spinodal");
  });

  it("keeps every generated dome tangent horizontal at its apex", () => {
    const domes = [
      { round: generateRound(5, "normal"), peakRoleId: "order-critical" },
      { round: generateRound(1, "hard"), peakRoleId: "dome-peak" },
      { round: generateRound(3, "hard"), peakRoleId: "dome-peak" },
      { round: generateRound(2, "hard"), peakRoleId: "dome-peak" },
    ];

    for (const { round, peakRoleId } of domes) {
      const peak = round.solution.points.find((item) => item.roleId === peakRoleId)!.point;
      const joinedCurves = round.solution.curves.filter((curve) => curve.startRoleId === peakRoleId || curve.endRoleId === peakRoleId);
      expect(joinedCurves.length, `${round.family} joined curves`).toBeGreaterThanOrEqual(2);
      for (const curve of joinedCurves) {
        expect(curve.recommendedControl.temperatureCelsius, `${round.family} ${curve.semanticRole}`).toBe(peak.temperatureCelsius);
      }
    }
  });

  it("defines every phase referenced by generated fields and invariants", () => {
    const difficulties: Difficulty[] = ["easy", "normal", "hard"];
    for (const difficulty of difficulties) {
      for (let seed = 0; seed < 50; seed += 1) {
        const { family, puzzle, solution } = generateRound(seed, difficulty);
        const defined = new Set(puzzle.phases.map((phase) => phase.id));
        const referenced = [
          ...solution.expectedFields.flatMap((field) => field.expectedAssemblage),
          ...solution.invariants.flatMap((invariant) => invariant.expectedAssemblage),
        ];
        expect(referenced.every((phaseId) => defined.has(phaseId)), `${difficulty} seed ${seed} ${family}`).toBe(true);
      }
    }

    const peritectic = generateRound(1, "easy");
    expect(peritectic.family).toBe("peritectic");
    expect(peritectic.puzzle.phases.find((phase) => phase.id === "gamma")).toMatchObject({
      name: "AB intermediate",
      kind: "line-compound",
      compositionGroupId: "gamma",
    });
  });

  it("derives intermediate formulas and keeps every phase variant aligned to its composition rule", () => {
    expect(intermediateFormula("A", "B", 0, 1)).toBe("AB");
    expect(intermediateFormula("AB", "C", 0, 1)).toBe("ABC");
    expect(intermediateFormula("A", "B", 0, 2)).toBe("A₂B");
    expect(intermediateFormula("A", "B", 1, 2)).toBe("AB₂");

    const rounds = [generateRound(0, "hard"), generateRound(2, "normal"), generateRound(5, "normal")];
    for (const { family, puzzle, solution } of rounds) {
      const baseSymbols = new Set<string>();
      for (const composition of puzzle.intermediateCompositions) {
        const groupPhases = composition.phaseIds.map((phaseId) => puzzle.phases.find((phase) => phase.id === phaseId)!);
        expect(groupPhases.every((phase) => phase.kind === "line-compound" && phase.compositionGroupId === composition.id), family).toBe(true);
        const unprimedSymbols = new Set(groupPhases.map((phase) => phase.symbol.replaceAll("′", "")));
        expect(unprimedSymbols.size, `${family} ${composition.label}`).toBe(1);
        const baseSymbol = [...unprimedSymbols][0];
        expect(baseSymbols.has(baseSymbol), `${family} duplicate Greek assignment`).toBe(false);
        baseSymbols.add(baseSymbol);
        const alignedPoints = solution.points.filter((point) => point.roleId === composition.id || point.roleId.startsWith(`${composition.id}-`));
        expect(alignedPoints.some((point) => point.point.compositionBPercent === composition.compositionBPercent), `${family} ${composition.label}`).toBe(true);
      }
    }
  });

  it("starts every complete playable diagram with one connected liquid field", () => {
    const difficulties: Difficulty[] = ["easy", "normal", "hard"];
    for (const difficulty of difficulties) {
      for (let seed = 0; seed < 50; seed += 1) {
        const { family, puzzle, solution } = generateRound(seed, difficulty);
        const state = createLabelingState(puzzle, solution);
        const topCells = state.cells.filter((cell) => cell.boundary.some((edge) => edge.geometryId === "frame-top"));
        expect(topCells, `${difficulty} seed ${seed} ${family}`).toHaveLength(1);
        const topField = solution.expectedFields.find((field) => sameLogicalPoint(field.witnessPoint, topCells[0].labelPoint));
        expect(topField?.expectedAssemblage, `${difficulty} seed ${seed} ${family}`).toHaveLength(1);
        const topPhase = puzzle.phases.find((phase) => phase.id === topField?.expectedAssemblage[0]);
        expect(topPhase?.kind, `${difficulty} seed ${seed} ${family}`).toBe("liquid");
      }
    }
  });

});
