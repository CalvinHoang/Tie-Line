import { describe, expect, it } from "vitest";
import { pointInPolygon, sameLogicalPoint } from "./geometry";
import { createLabelingState } from "../editor/state";
import { validateSubmit } from "../game/validator";
import { FAMILY_RULES, generateEutecticRound, generateRound, intermediateFormula, type Difficulty } from "./generator";
import { auditPhaseEquilibria } from "./phase-equilibria-validator";
import { expectedLabels } from "./diagram-notation";

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
          phaseOrder: (() => { const field = solution.expectedFields.find((candidate) => pointInPolygon(candidate.witnessPoint, cell.polygon)); return field ? expectedLabels(field) : []; })(),
        })),
      };
      expect(solved.geometry.filter((item) => item.type === "invariant-horizontal").every((item) => item.phaseOrder.length === 0)).toBe(true);
      expect(validateSubmit(solved, puzzle, solution), `seed ${seed}`).toEqual({ status: "solved", violations: [] });
    }
  }, 15_000);

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
          cells: state.cells.map((cell) => { const field = solution.expectedFields.find((candidate) => sameLogicalPoint(candidate.witnessPoint, cell.labelPoint)) ?? solution.expectedFields.find((candidate) => pointInPolygon(candidate.witnessPoint, cell.polygon)); return { ...cell, phaseOrder: field ? expectedLabels(field) : [] }; }),
        };
        expect(puzzle.instructions.some((instruction) => /invariant line/i.test(instruction.compactText)), `${difficulty} seed ${seed}`).toBe(false);
        expect(validateSubmit(solved, puzzle, solution), `${difficulty} seed ${seed}`).toEqual({ status: "solved", violations: [] });
      }
    }
  }, 15_000);

  it("uses the agreed reaction pools and complexity limits", () => {
    const easy = Array.from({ length: 7 }, (_, seed) => generateRound(seed, "easy"));
    const normal = Array.from({ length: 10 }, (_, seed) => generateRound(seed, "normal"));
    const hard = Array.from({ length: 15 }, (_, seed) => generateRound(seed, "hard"));
    expect(new Set(easy.map((round) => round.family))).toEqual(new Set(["compound-double-eutectic", "peritectic", "limited-eutectic", "simple-eutectic", "peritectoid", "subsolidus-polymorph", "eutectoid"]));
    expect(new Set(normal.map((round) => round.family))).toEqual(new Set(["compound-double-eutectic", "peritectic", "limited-eutectic", "peritectoid", "subsolidus-polymorph", "coupled-eutectic-peritectic", "superlattice", "eutectoid", "monotectoid", "metatectic"]));
    expect(new Set(hard.map((round) => round.family))).toEqual(new Set([
      "triple-eutectic", "syntectic", "monotectic", "liquid-spinodal", "compound-double-eutectic",
      "peritectic", "limited-eutectic", "peritectoid", "subsolidus-polymorph", "coupled-eutectic-peritectic", "superlattice", "simple-eutectic", "eutectoid", "monotectoid", "metatectic",
    ]));
    expect(easy.every((round) => (round.intermediatePhaseCount ?? 0) <= 1 && (round.reactionTypes?.length ?? 0) >= 1)).toBe(true);
    expect(normal.every((round) => (round.intermediatePhaseCount ?? 0) <= 2 && (round.reactionTypes?.length ?? 0) >= 1)).toBe(true);
    expect(hard.every((round) => (round.intermediatePhaseCount ?? 0) <= 2 && (round.reactionTypes?.length ?? 0) >= 1)).toBe(true);
    expect([...easy, ...normal, ...hard].every((round) => (round.layoutQualityScore ?? 0) > 0)).toBe(true);
  });

  it("selects weighted feature contracts before accepting each generated round", () => {
    for (const difficulty of ["easy", "normal", "hard"] as const) {
      const rules = FAMILY_RULES[difficulty];
      const totalWeight = rules.reduce((sum, rule) => sum + rule.weight, 0);
      const observed = new Map<string, number>();
      for (let seed = 0; seed < totalWeight; seed += 1) {
        const round = generateRound(seed, difficulty);
        const contract = round.generationContract!;
        observed.set(contract.ruleId, (observed.get(contract.ruleId) ?? 0) + 1);
        expect(contract.targetPercent).toBeCloseTo((contract.weight / totalWeight) * 100);
        expect(new Set(round.solution.invariants.map((item) => item.reactionType)))
          .toEqual(new Set(contract.requiredInvariantTypes));
        for (const type of contract.requiredInvariantTypes) {
          expect(round.solution.invariants.filter((item) => item.reactionType === type)).toHaveLength(
            contract.requiredInvariantCounts[type] ?? 0,
          );
        }
        expect(round.thermodynamicCertificate?.certifiedInvariantCount).toBe(round.solution.invariants.length);
        if (round.solution.invariants.length > 0) {
          expect(round.topologyCertificate?.certifiedInvariantCount).toBe(round.solution.invariants.length);
          expect(round.topologyCertificate?.scope).toBe("generated-diagram");
        } else {
          expect(round.topologyCertificate).toBeUndefined();
        }
        expect(round.topologyCertificate?.certifiedInvariantTypes ?? []).toEqual(
          expect.arrayContaining(contract.requiredInvariantTypes),
        );
      }
      for (const rule of rules) expect(observed.get(rule.id), `${difficulty} ${rule.id}`).toBe(rule.weight);
    }
  });

  it("keeps both compound eutectics tied to invariant horizontals", () => {
    const affected = [
      generateRound(0, "easy"),
      generateRound(0, "normal"),
      generateRound(4, "hard"),
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
    expect(monotectic.solution.invariants.map((invariant) => invariant.reactionType)).toEqual(["monotectic", "eutectic"]);
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
    expect(spinodal.solution.invariants.map((item) => String(item.reactionType))).not.toContain("spinodal-decomposition");
    expect(spinodal.solution.invariants.some((item) => item.reactionType === "syntectic")).toBe(true);
    expect(spinodal.reactionTypes).toContain("liquid-spinodal");
    expect(spinodal.puzzle.expectedFieldCount).toBe(8);
    expect(spinodal.solution.expectedFields.filter((field) => field.expectedAssemblage.join("+") === "L1+L2")).toHaveLength(1);
    expect(spinodal.solution.expectedFields.some((field) => field.role === "unstable-two-liquid")).toBe(false);
    expect(spinodal.solution.curves.filter((curve) => curve.semanticRole?.startsWith("spinodal-"))
      .every((curve) => curve.fieldBoundary === false)).toBe(true);
  });

  it("generates finite terminal solid-solution fields for partial solubility", () => {
    const limited = generateRound(2, "normal");
    expect(limited.family).toBe("limited-eutectic");
    expect(limited.solution.expectedFields.filter((field) => field.texture === "partial-solubility"))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ expectedAssemblage: ["alpha"] }),
        expect.objectContaining({ expectedAssemblage: ["beta"] }),
      ]));
    expect(limited.puzzle.expectedFieldCount).toBe(6);
  });

  it("models every transformation family with finite solid-solution domains", () => {
    const subsolidus = generateRound(4, "normal");
    expect(subsolidus.family).toBe("subsolidus-polymorph");
    expect(subsolidus.solution.expectedFields.map((field) => field.expectedAssemblage.join("+")))
      .toEqual(expect.arrayContaining(["gamma", "gamma+delta", "delta"]));
    expect(subsolidus.solution.expectedFields.filter((field) => field.expectedAssemblage.length === 1
      && ["gamma", "delta"].includes(field.expectedAssemblage[0])).every((field) => field.texture === "complete-solid-solution")).toBe(true);
    const lowPolymorph = subsolidus.puzzle.phases.find((phase) => phase.temperatureRole === "low-temperature")!;
    const highPolymorph = subsolidus.puzzle.phases.find((phase) => phase.temperatureRole === "high-temperature")!;
    expect(lowPolymorph).toMatchObject({ symbol: "α", compositionRole: "complete-range" });
    expect(highPolymorph).toMatchObject({ symbol: "β", compositionRole: "complete-range" });
    expect(lowPolymorph.labelEquivalenceGroup).toBeTruthy();
    expect(highPolymorph.labelEquivalenceGroup).toBe(lowPolymorph.labelEquivalenceGroup);

    const supersolidus = generateRound(5, "normal");
    expect(supersolidus.family).toBe("coupled-eutectic-peritectic");
    expect(supersolidus.solution.invariants.map((invariant) => invariant.reactionType)).toEqual(["eutectic", "peritectic"]);
    expect(supersolidus.solution.expectedFields.map((field) => field.expectedAssemblage.join("+")))
      .toEqual(expect.arrayContaining(["gamma", "gamma+delta", "delta"]));
    expect(supersolidus.puzzle.phases.find((phase) => phase.compositionRole === "a-terminal"))
      .toMatchObject({ symbol: "α", id: "alpha" });
    expect(supersolidus.puzzle.phases.find((phase) => phase.compositionRole === "intermediate"))
      .toMatchObject({ symbol: "γ", id: "gamma", kind: "intermediate-solid-solution" });
    expect(supersolidus.puzzle.phases.find((phase) => phase.compositionRole === "b-terminal"))
      .toMatchObject({ symbol: "β", id: "delta" });
    expect(supersolidus.puzzle.phases.some((phase) => phase.symbol === "γ′")).toBe(false);
    expect(supersolidus.puzzle.expectedFieldCount).toBe(9);

    const ordering = generateRound(6, "normal");
    expect(ordering.family).toBe("superlattice");
    expect(ordering.solution.expectedFields.map((field) => field.expectedAssemblage.join("+")))
      .toEqual(expect.arrayContaining(["gamma", "delta"]));
    expect(ordering.solution.expectedFields.find((field) => field.expectedAssemblage.join("+") === "gamma")?.texture)
      .toBe("complete-solid-solution");
    expect(ordering.solution.expectedFields.find((field) => field.expectedAssemblage.join("+") === "delta")?.texture)
      .toBe("ordered-solid-solution");
    expect(ordering.solution.curves.filter((curve) => curve.semanticRole?.startsWith("superlattice-"))).toHaveLength(2);
    expect(ordering.puzzle.expectedFieldCount).toBe(4);
  });

  it("keeps every generated dome tangent horizontal at its apex", () => {
    const domes = [
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

  it("passes every generated round through the independent equilibrium audit", () => {
    for (const difficulty of ["easy", "normal", "hard"] as const) {
      for (let seed = 0; seed < 250; seed += 1) {
        const round = generateRound(seed, difficulty);
        expect(auditPhaseEquilibria(round.puzzle, round.solution), `${difficulty} seed ${seed} ${round.family}`)
          .toMatchObject({ valid: true, violations: [] });
      }
    }
  }, 15_000);

  it("rejects degenerate invariant compositions and all-phases-at-once boundaries", () => {
    const round = generateRound(4, "easy");
    const degenerate = structuredClone(round);
    const productRole = degenerate.solution.invariants.find((item) => item.reactionType === "peritectoid")!.interiorRoleIds[0];
    const productPoint = degenerate.solution.points.find((item) => item.roleId === productRole)!;
    productPoint.point.compositionBPercent = 100;
    const audit = auditPhaseEquilibria(degenerate.puzzle, degenerate.solution);
    expect(audit.valid).toBe(false);
    expect(audit.violations.map((item) => item.ruleId)).toContain("invariant-composition-order");

    const adjacency = structuredClone(generateRound(2, "normal"));
    const alphaField = adjacency.solution.expectedFields.find((field) => field.role === "alpha")!;
    alphaField.expectedAssemblage = ["beta"];
    const adjacencyAudit = auditPhaseEquilibria(adjacency.puzzle, adjacency.solution);
    expect(adjacencyAudit.valid).toBe(false);
    expect(adjacencyAudit.violations.map((item) => item.ruleId)).toContain("curve-field-adjacency");

    const collapsedOrdering = structuredClone(generateRound(6, "normal"));
    collapsedOrdering.solution.expectedFields.find((field) => field.expectedAssemblage[0] === "delta")!.expectedAssemblage = ["gamma"];
    const orderingAudit = auditPhaseEquilibria(collapsedOrdering.puzzle, collapsedOrdering.solution);
    expect(orderingAudit.valid).toBe(false);
    expect(orderingAudit.violations.map((item) => item.ruleId)).toContain("phase-variant-finite-domain");

    const wrongReaction = structuredClone(generateRound(12, "hard"));
    wrongReaction.solution.invariants[0].reactantPhaseIds = ["alpha"];
    wrongReaction.solution.invariants[0].productPhaseIds = ["gamma", "beta"];
    const reactionAudit = auditPhaseEquilibria(wrongReaction.puzzle, wrongReaction.solution);
    expect(reactionAudit.valid).toBe(false);
    expect(reactionAudit.violations.map((item) => item.ruleId)).toEqual(expect.arrayContaining(["reaction-interior-composition", "invariant-contract-meaning"]));

    const unownedCompound = structuredClone(generateRound(0, "hard"));
    const compoundLine = unownedCompound.solution.curves.find((curve) => curve.boundaryKind === "line-compound")!;
    compoundLine.compositionSiteId = undefined;
    const ownershipAudit = auditPhaseEquilibria(unownedCompound.puzzle, unownedCompound.solution);
    expect(ownershipAudit.valid).toBe(false);
    expect(ownershipAudit.violations.map((item) => item.ruleId)).toContain("line-boundary-composition-ownership");
  });

  it("accepts only globally consistent relabelings of unanchored complete-range polymorphs", () => {
    const { puzzle, solution } = generateRound(4, "normal");
    expect(puzzle.title).toBe("Subsolidus polymorphism in a complete solid solution");
    const state = createLabelingState(puzzle, solution);
    const expectedForCell = (cell: typeof state.cells[number]) => (solution.expectedFields.find((field) => sameLogicalPoint(field.witnessPoint, cell.labelPoint))
      ?? solution.expectedFields.find((field) => pointInPolygon(field.witnessPoint, cell.polygon)))!.expectedAssemblage;
    const swap = (phaseId: string) => phaseId === "gamma" ? "delta" : phaseId === "delta" ? "gamma" : phaseId;
    const globallySwapped = {
      ...state,
      cells: state.cells.map((cell) => ({ ...cell, phaseOrder: expectedForCell(cell).map(swap) })),
    };
    expect(validateSubmit(globallySwapped, puzzle, solution)).toEqual({ status: "solved", violations: [] });

    let changedOneSinglePhaseField = false;
    const inconsistentlySwapped = {
      ...state,
      cells: state.cells.map((cell) => {
        const expected = expectedForCell(cell);
        if (!changedOneSinglePhaseField && expected.length === 1 && ["gamma", "delta"].includes(expected[0])) {
          changedOneSinglePhaseField = true;
          return { ...cell, phaseOrder: expected.map(swap) };
        }
        return { ...cell, phaseOrder: expected };
      }),
    };
    expect(validateSubmit(inconsistentlySwapped, puzzle, solution).status).toBe("incorrect");
  });

  it("completes the reported monotectic seed with a lower all-solid region", () => {
    const round = generateRound(249121847, "hard");
    expect(round.family).toBe("monotectic");
    expect(round.solution.invariants.map((invariant) => invariant.reactionType)).toEqual(["monotectic", "eutectic"]);
    expect(round.puzzle.expectedFieldCount).toBe(6);
    const bottomFields = round.solution.expectedFields.filter((field) => field.witnessPoint.temperatureCelsius < round.solution.invariants[1].temperatureCelsius);
    expect(bottomFields.some((field) => field.expectedAssemblage.includes("L1") || field.expectedAssemblage.includes("L2"))).toBe(false);
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
      name: "AB compound",
      kind: "line-compound",
      compositionSiteId: "gamma",
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
        expect(groupPhases.every((phase) => ["line-compound", "intermediate-solid-solution"].includes(phase.kind)
          && phase.compositionSiteId === composition.id), family).toBe(true);
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

  it("generates all eight binary invariant archetypes with explicit reaction ownership", () => {
    const rounds = Array.from({ length: 15 }, (_, seed) => generateRound(seed, "hard"));
    const reactions = new Set(rounds.flatMap((round) => round.solution.invariants.map((invariant) => invariant.reactionType)));
    expect(reactions).toEqual(new Set(["eutectic", "peritectic", "peritectoid", "monotectic", "syntectic", "eutectoid", "monotectoid", "metatectic"]));
    for (const round of rounds) {
      for (const invariant of round.solution.invariants) {
        expect(invariant.reactantPhaseIds?.length).toBeGreaterThan(0);
        expect(invariant.productPhaseIds?.length).toBeGreaterThan(0);
        expect(Object.keys(invariant.phaseCompositionRoleIds ?? {})).toHaveLength(3);
      }
    }
    const metatectic = rounds.find((round) => round.family === "metatectic")!;
    expect(metatectic.solution.expectedFields.find((field) => field.role === "metatectic-products")?.expectedAssemblage).toEqual(["alpha", "L"]);
    expect(metatectic.solution.expectedFields.some((field) => field.expectedAssemblage.length === 1 && field.expectedAssemblage[0] === "L"
      && field.witnessPoint.temperatureCelsius < metatectic.solution.invariants[0].temperatureCelsius)).toBe(true);
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
        const bottomCells = state.cells.filter((cell) => cell.boundary.some((edge) => edge.geometryId === "frame-bottom"));
        expect(bottomCells.length, `${difficulty} seed ${seed} ${family} bottom fields`).toBeGreaterThan(0);
        for (const cell of bottomCells) {
          const field = solution.expectedFields.find((candidate) => sameLogicalPoint(candidate.witnessPoint, cell.labelPoint));
          expect(field?.expectedAssemblage.some((phaseId) => puzzle.phases.find((phase) => phase.id === phaseId)?.kind === "liquid"), `${difficulty} seed ${seed} ${family} liquid at bottom`).toBe(false);
        }
      }
    }
  });

});
