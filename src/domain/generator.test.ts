import { describe, expect, it } from "vitest";
import { pointInPolygon, sameLogicalPoint } from "./geometry";
import { createLabelingState } from "../editor/state";
import { validateSubmit } from "../game/validator";
import { BINARY_PUZZLE_FEATURES, COMPOSABLE_BINARY_FEATURES, COMPOSABLE_INVARIANT_TYPES, detectBinaryFeatures, generateEutecticRound, generateRound, intermediateFormula, type Difficulty } from "./generator";
import { auditPhaseEquilibria } from "./phase-equilibria-validator";

describe("procedural phase-diagram generator", () => {
  it("is deterministic for a seed and varies between seeds", () => {
    expect(generateEutecticRound(12345)).toEqual(generateEutecticRound(12345));
    expect(generateEutecticRound(12345).solution.points).not.toEqual(generateEutecticRound(12346).solution.points);
    expect(generateRound(42, "hard")).toEqual(generateRound(42, "hard"));
    expect(generateRound(42, "hard").solution.points).not.toEqual(generateRound(43, "hard").solution.points);
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
  }, 30_000);

  it("uses one shared reaction grammar with difficulty-sized complexity budgets", () => {
    const easy = Array.from({ length: 6 }, (_, seed) => generateRound(seed, "easy"));
    const normal = Array.from({ length: 16 }, (_, seed) => generateRound(seed, "normal"));
    const hard = Array.from({ length: 16 }, (_, seed) => generateRound(seed, "hard"));
    expect(new Set(easy.map((round) => round.family))).toEqual(new Set(["compound-double-eutectic", "peritectic", "limited-eutectic", "simple-eutectic", "peritectoid", "subsolidus-polymorph"]));
    expect(new Set(normal.map((round) => round.family))).toEqual(new Set(["rule-composed"]));
    expect(new Set(hard.map((round) => round.family))).toEqual(new Set(["rule-composed"]));
    expect(easy.every((round) => (round.intermediatePhaseCount ?? 0) <= 1 && (round.reactionTypes?.length ?? 0) >= 1)).toBe(true);
    expect(normal.every((round) => (round.intermediatePhaseCount ?? 0) >= 1 && (round.intermediatePhaseCount ?? 0) <= 3
      && round.solution.invariants.length >= 2 && round.solution.invariants.length <= 5)).toBe(true);
    expect(hard.filter((round) => !((round.intermediatePhaseCount ?? 0) >= 4 && (round.intermediatePhaseCount ?? 0) <= 7
      && round.solution.invariants.length >= 4 && round.solution.invariants.length <= 10 && round.puzzle.expectedFieldCount >= 15))
      .map((round) => ({ seed: round.seed, phases: round.intermediatePhaseCount, invariants: round.solution.invariants.length, fields: round.puzzle.expectedFieldCount }))).toEqual([]);
    expect(COMPOSABLE_INVARIANT_TYPES.every((reactionType) => normal.some((round) => round.reactionTypes?.includes(reactionType)))).toBe(true);
    expect(COMPOSABLE_INVARIANT_TYPES.every((reactionType) => hard.some((round) => round.reactionTypes?.includes(reactionType)))).toBe(true);
    expect(hard.some((round) => (round.reactionTypes ?? []).filter((reactionType) => reactionType !== "eutectic").length >= 2)).toBe(true);
    expect(new Set(hard.map((round) => round.solution.invariants.map((invariant) => invariant.reactionType).join("|"))).size).toBeGreaterThan(8);
    expect(hard.every((round, index) => round.puzzle.expectedFieldCount > normal[index].puzzle.expectedFieldCount)).toBe(true);
    expect([...easy, ...normal, ...hard].every((round) => (round.layoutQualityScore ?? 0) > 0)).toBe(true);
  });

  it("can feature every condensed-phase Notes concept in Normal and Hard with explicit zero counts", () => {
    expect(COMPOSABLE_BINARY_FEATURES).toHaveLength(BINARY_PUZZLE_FEATURES.length);
    for (const difficulty of ["normal", "hard"] as const) {
      COMPOSABLE_BINARY_FEATURES.forEach((featuredFeature, seed) => {
        const round = generateRound(seed, difficulty);
        expect(round.featuredFeature, `${difficulty} seed ${seed}`).toBe(featuredFeature);
        const independentlyDetected = detectBinaryFeatures(round.puzzle, round.solution);
        expect(independentlyDetected).toEqual(round.featureCounts);
        expect(Object.keys(round.featureCounts ?? {}), `${difficulty} ${featuredFeature}`).toEqual([...BINARY_PUZZLE_FEATURES]);
        const featureCountKey = (featuredFeature in (round.featureCounts ?? {}) ? featuredFeature : `${featuredFeature}-point`) as keyof NonNullable<typeof round.featureCounts>;
        expect(round.featureCounts?.[featureCountKey], `${difficulty} ${featuredFeature}`).toBeGreaterThan(0);
        expect(Object.values(round.featureCounts ?? {}).every((count) => Number.isInteger(count) && count >= 0)).toBe(true);
        expect(Object.values(round.featureCounts ?? {}).some((count) => count === 0)).toBe(true);
        expect(round.puzzle.phases.some((phase) => /\bgas\b/i.test(`${phase.id} ${phase.name} ${phase.symbol}`))).toBe(false);
        if (difficulty === "hard") {
          expect(round.intermediatePhaseCount).toBeGreaterThanOrEqual(4);
          expect(round.intermediatePhaseCount).toBeLessThanOrEqual(7);
          expect(round.puzzle.expectedFieldCount).toBeGreaterThanOrEqual(15);
        }
      });
    }
  }, 30_000);

  it("keeps primary selection balanced and independently observes every feature across ten complete cycles", () => {
    for (const difficulty of ["normal", "hard"] as const) {
      const primaryCounts = Object.fromEntries(COMPOSABLE_BINARY_FEATURES.map((feature) => [feature, 0]));
      const appearanceCounts = Object.fromEntries(BINARY_PUZZLE_FEATURES.map((feature) => [feature, 0]));
      for (let seed = 0; seed < COMPOSABLE_BINARY_FEATURES.length * 10; seed += 1) {
        const round = generateRound(seed, difficulty);
        primaryCounts[round.featuredFeature!] += 1;
        const detected = detectBinaryFeatures(round.puzzle, round.solution);
        for (const feature of BINARY_PUZZLE_FEATURES) if (detected[feature] > 0) appearanceCounts[feature] += 1;
      }
      expect(Object.values(primaryCounts), `${difficulty} primary selection`).toEqual(COMPOSABLE_BINARY_FEATURES.map(() => 10));
      expect(Object.entries(appearanceCounts).filter(([, count]) => count === 0), `${difficulty} missing appearances`).toEqual([]);
    }
  }, 60_000);

  it("keeps both terminal solutions visibly wide when Hard features partial miscibility", () => {
    const partialFeatureSeed = COMPOSABLE_BINARY_FEATURES.indexOf("partial-miscibility");
    const round = generateRound(partialFeatureSeed, "hard");
    const pointByRole = new Map(round.solution.points.map((item) => [item.roleId, item.point]));
    const solvusSpans = round.solution.curves
      .filter((curve) => curve.semanticRole === "solvus-left" || curve.semanticRole === "solvus-right")
      .map((curve) => Math.abs(
        pointByRole.get(curve.endRoleId)!.compositionBPercent - pointByRole.get(curve.startRoleId)!.compositionBPercent,
      ));
    expect(round.featuredFeature).toBe("partial-miscibility");
    expect(round.intermediatePhaseCount).toBe(4);
    expect(solvusSpans).toHaveLength(2);
    expect(Math.min(...solvusSpans)).toBeGreaterThanOrEqual(6);
    expect(round.solution.expectedFields.filter((field) =>
      field.texture === "partial-solubility" && field.expectedAssemblage.length === 1,
    )).toHaveLength(2);
    expect(round.puzzle.expectedFieldCount).toBeGreaterThanOrEqual(16);
  });

  it("generates large abstract Hard systems featuring advanced invariants", () => {
    const catatectic = generateRound(4, "hard");
    expect(catatectic).toMatchObject({ family: "rule-composed" });
    expect(catatectic.intermediatePhaseCount).toBeGreaterThanOrEqual(4);
    expect(catatectic.solution.invariants.length).toBeGreaterThanOrEqual(5);
    expect(catatectic.solution.invariants.map((item) => item.reactionType)).toContain("catatectic");
    expect(catatectic.reactionTypes).toContain("catatectic");
    expect(catatectic.puzzle.expectedFieldCount).toBeGreaterThanOrEqual(16);
    expect(catatectic.puzzle.endMemberLabels).toEqual({ left: "A", right: "B" });

    const syntectic = generateRound(7, "hard");
    expect(syntectic.reactionTypes).toEqual(expect.arrayContaining(["eutectic", "syntectic"]));
    expect(syntectic.puzzle.phases.filter((phase) => phase.kind === "liquid")).toHaveLength(3);
  });

  it("keeps both compound eutectics tied to invariant horizontals", () => {
    const affected = [
      generateRound(0, "easy"),
    ];
    for (const round of affected) {
      const eutectics = round.solution.invariants.filter((item) => item.reactionType === "eutectic");
      expect(eutectics, round.family).toHaveLength(2);
      expect(eutectics.map((item) => item.interiorRoleIds).flat()).toEqual(expect.arrayContaining(["e1", "e2"]));
    }
  });

  it("orders invariant compositions left-interior-right for a nonzero lever rule", () => {
    const cases = [
      { round: generateRound(1, "normal"), reactionType: "peritectic" },
      { round: generateRound(5, "hard"), reactionType: "monotectic" },
      { round: generateRound(3, "normal"), reactionType: "peritectoid" },
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

    const monotectic = cases.find(({ reactionType }) => reactionType === "monotectic")!.round;
    expect(monotectic.reactionTypes).toContain("monotectic");
  });

  it("embeds the peritectoid in a complete melting system", () => {
    const peritectoid = generateRound(3, "normal");
    expect(peritectoid.family).toBe("rule-composed");
    expect(peritectoid.reactionTypes).toEqual(expect.arrayContaining(["eutectic", "peritectoid"]));
    const reaction = peritectoid.solution.invariants.find((item) => item.reactionType === "peritectoid")!;
    expect(reaction.expectedAssemblage.every((phaseId) => peritectoid.puzzle.phases.some((phase) => phase.id === phaseId))).toBe(true);
    expect(peritectoid.puzzle.expectedFieldCount).toBeGreaterThanOrEqual(6);
  });

  it("models liquid immiscibility with a real syntectic invariant", () => {
    const immiscible = generateRound(7, "hard");
    expect(immiscible.solution.invariants.some((item) => String(item.reactionType) === "spinodal-decomposition")).toBe(false);
    expect(immiscible.solution.invariants.some((item) => item.reactionType === "syntectic")).toBe(true);
    expect(immiscible.solution.expectedFields.some((field) => field.expectedAssemblage.join("+") === "L1+L2")).toBe(true);
  });

  it("uses homogeneous L across the complete top of monotectic systems", () => {
    for (const difficulty of ["normal", "hard"] as const) {
      const monotectic = generateRound(COMPOSABLE_INVARIANT_TYPES.indexOf("monotectic"), difficulty);
      const state = createLabelingState(monotectic.puzzle, monotectic.solution);
      const topCell = state.cells.find((cell) => cell.boundary.some((edge) => edge.geometryId === "frame-top"))!;
      const topField = monotectic.solution.expectedFields.find((field) => sameLogicalPoint(field.witnessPoint, topCell.labelPoint));
      expect(monotectic.featuredFeature).toBe("monotectic");
      expect(topField?.expectedAssemblage).toEqual(["L"]);
      expect(monotectic.puzzle.phases.find((phase) => phase.id === "L")).toMatchObject({ symbol: "L", kind: "liquid" });
      expect(monotectic.solution.expectedFields.some((field) => field.expectedAssemblage.join("+") === "L1+L2")).toBe(true);
      const reaction = monotectic.solution.invariants.find((invariant) => invariant.reactionType === "monotectic")!;
      expect(reaction.expectedAssemblage.slice(0, 2)).toEqual(["L2", "L1"]);
      expect(monotectic.puzzle.phases.find((phase) => phase.id === reaction.expectedAssemblage[2])?.kind).not.toBe("liquid");
    }
  });

  it("generates finite terminal solid-solution fields for partial solubility", () => {
    const limited = generateRound(2, "easy");
    expect(limited.family).toBe("limited-eutectic");
    expect(limited.solution.expectedFields.filter((field) => field.texture === "partial-solubility"))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ expectedAssemblage: ["alpha"] }),
        expect.objectContaining({ expectedAssemblage: ["beta"] }),
      ]));
    expect(limited.puzzle.expectedFieldCount).toBe(6);
  });

  it("can feature every supported invariant archetype", () => {
    for (const difficulty of ["normal", "hard"] as const) {
      COMPOSABLE_INVARIANT_TYPES.forEach((reactionType, seed) => {
        const round = generateRound(seed, difficulty);
        expect(round.reactionTypes, `${difficulty} seed ${seed}`).toContain(reactionType);
        expect(round.solution.invariants.find((invariant) => invariant.reactionType === reactionType), `${difficulty} ${reactionType}`).toBeDefined();
      });
    }
  });

  it("keeps every generated dome tangent horizontal at its apex", () => {
    const domes = [
      { round: generateRound(5, "hard"), peakRoleId: "dome-peak" },
      { round: generateRound(7, "hard"), peakRoleId: "dome-peak" },
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
  }, 30_000);

  it("rejects degenerate invariant compositions and all-phases-at-once boundaries", () => {
    const round = generateRound(4, "easy");
    const degenerate = structuredClone(round);
    const productRole = degenerate.solution.invariants.find((item) => item.reactionType === "peritectoid")!.interiorRoleIds[0];
    const productPoint = degenerate.solution.points.find((item) => item.roleId === productRole)!;
    productPoint.point.compositionBPercent = 100;
    const audit = auditPhaseEquilibria(degenerate.puzzle, degenerate.solution);
    expect(audit.valid).toBe(false);
    expect(audit.violations.map((item) => item.ruleId)).toContain("invariant-composition-order");

    const adjacency = structuredClone(generateRound(2, "easy"));
    const alphaField = adjacency.solution.expectedFields.find((field) => field.role === "alpha")!;
    alphaField.expectedAssemblage = ["beta"];
    const adjacencyAudit = auditPhaseEquilibria(adjacency.puzzle, adjacency.solution);
    expect(adjacencyAudit.valid).toBe(false);
    expect(adjacencyAudit.violations.map((item) => item.ruleId)).toContain("curve-field-adjacency");

  });

  it("rejects a liquid-composition subscript on the complete top field", () => {
    const malformed = structuredClone(generateRound(COMPOSABLE_INVARIANT_TYPES.indexOf("monotectic"), "normal"));
    const state = createLabelingState(malformed.puzzle, malformed.solution);
    const topCell = state.cells.find((cell) => cell.boundary.some((edge) => edge.geometryId === "frame-top"))!;
    const topField = malformed.solution.expectedFields.find((field) => sameLogicalPoint(field.witnessPoint, topCell.labelPoint))!;
    topField.expectedAssemblage = ["L1"];
    const audit = auditPhaseEquilibria(malformed.puzzle, malformed.solution);
    expect(audit.valid).toBe(false);
    expect(audit.violations.map((item) => item.ruleId)).toContain("homogeneous-liquid-notation");
  });

  it("rejects a catatectic whose product field does not span the invariant", () => {
    const malformed = structuredClone(generateRound(4, "hard"));
    const catatectic = malformed.solution.invariants.find((invariant) => invariant.reactionType === "catatectic")!;
    const productKey = [...catatectic.incidence!.below[0]].sort().join("+");
    malformed.solution.expectedFields
      .filter((field) => [...field.expectedAssemblage].sort().join("+") === productKey)
      .forEach((field) => { field.expectedAssemblage = [...catatectic.incidence!.above[0]]; });
    const audit = auditPhaseEquilibria(malformed.puzzle, malformed.solution);
    expect(audit.valid).toBe(false);
    expect(audit.violations.map((item) => item.ruleId)).toContain("catatectic-decomposition-incidence");
  });

  it("defines every phase referenced by generated fields and invariants", () => {
    const difficulties: Difficulty[] = ["easy", "normal", "hard"];
    for (const difficulty of difficulties) {
      for (let seed = 0; seed < 50; seed += 1) {
        const { family, puzzle, solution } = generateRound(seed, difficulty);
        const defined = new Set(puzzle.phases.map((phase) => phase.id));
        expect(defined.size, `${difficulty} seed ${seed} ${family} duplicate phase ids`).toBe(puzzle.phases.length);
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
        expect(groupPhases.every((phase) => ["line-compound", "intermediate-solid-solution"].includes(phase.kind)
          && phase.compositionGroupId === composition.id), family).toBe(true);
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
        expect(topField?.expectedAssemblage, `${difficulty} seed ${seed} ${family}`).toEqual(["L"]);
        expect(topPhase?.symbol, `${difficulty} seed ${seed} ${family}`).toBe("L");
        expect(topPhase?.kind, `${difficulty} seed ${seed} ${family}`).toBe("liquid");
      }
    }
  }, 30_000);

});
