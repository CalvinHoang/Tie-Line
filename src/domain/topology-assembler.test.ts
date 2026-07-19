import { describe, expect, it } from "vitest";
import type { ReactionType } from "./schema";
import {
  EMBEDDABLE_INVARIANT_PAIRS,
  assemblePhaseTopology,
  validatePhaseTopology,
  type PhaseTopologyGraph,
  type TopologyFeatureContract,
} from "./topology-assembler";

const TYPES: ReactionType[] = [
  "eutectic",
  "eutectoid",
  "peritectic",
  "peritectoid",
  "monotectic",
  "monotectoid",
  "syntectic",
  "metatectic",
];

function requireType(type: ReactionType): TopologyFeatureContract {
  return { invariantTargets: [{ type, weight: 1, minCount: 1, maxCount: 1 }] };
}

function acceptedGraph(contract: TopologyFeatureContract, seed = 1): PhaseTopologyGraph {
  const result = assemblePhaseTopology(contract, seed);
  expect(result.accepted).toBe(true);
  if (!result.accepted) throw new Error(result.rejections.map((item) => item.message).join("; "));
  return result.graph;
}

describe("typed topology motif assembler", () => {
  it.each(TYPES)("assembles and validates the %s archetype", (type) => {
    for (let seed = 0; seed < 40; seed += 1) {
      const result = assemblePhaseTopology(requireType(type), seed);
      expect(result.accepted).toBe(true);
      if (!result.accepted) continue;
      expect(result.selectedInvariantTypes).toEqual([type]);
      expect(validatePhaseTopology(result.graph)).toEqual({ valid: true, rejections: [] });
    }
  });

  it("is deterministic for a seed and contract", () => {
    const contract: TopologyFeatureContract = {
      invariantTargets: [
        { type: "eutectic", weight: 1 },
        { type: "peritectic", weight: 3 },
        { type: "syntectic", weight: 2 },
      ],
    };
    expect(assemblePhaseTopology(contract, 94721)).toEqual(assemblePhaseTopology(contract, 94721));
  });

  it("uses relative weights over many deterministic seeds", () => {
    const contract: TopologyFeatureContract = {
      invariantTargets: [
        { type: "eutectic", weight: 1 },
        { type: "peritectic", weight: 4 },
      ],
    };
    const counts = { eutectic: 0, peritectic: 0 };
    for (let seed = 0; seed < 2000; seed += 1) {
      const result = assemblePhaseTopology(contract, seed);
      if (result.accepted) counts[result.selectedInvariantTypes[0] as keyof typeof counts] += 1;
    }
    expect(counts.peritectic / counts.eutectic).toBeGreaterThan(3.2);
    expect(counts.peritectic / counts.eutectic).toBeLessThan(4.8);
  });

  it("filters motifs through physical feature requirements", () => {
    const result = assemblePhaseTopology({
      invariantTargets: TYPES.map((type) => ({ type, weight: 1 })),
      required: { liquidImmiscibility: true },
    }, 12);
    expect(result.accepted).toBe(true);
    if (result.accepted) expect(["monotectic", "syntectic"]).toContain(result.selectedInvariantTypes[0]);
  });

  it("filters by phase budget before weighted selection", () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const result = assemblePhaseTopology({
        invariantTargets: [
          { type: "monotectic", weight: 1 },
          { type: "syntectic", weight: 100 },
        ],
        required: { liquidImmiscibility: true, maxPhaseCount: 5 },
      }, seed);
      expect(result).toMatchObject({ accepted: true, selectedInvariantTypes: ["monotectic"] });
    }
  });

  it.each(EMBEDDABLE_INVARIANT_PAIRS)("assembles the compatible %s + %s chain", (first, second) => {
    for (let seed = 0; seed < 40; seed += 1) {
      const result = assemblePhaseTopology({
        invariantTargets: [
          { type: first, weight: 1, minCount: 1 },
          { type: second, weight: 1, minCount: 1 },
        ],
      }, seed);
      expect(result.accepted).toBe(true);
      if (!result.accepted) continue;
      expect(new Set(result.selectedInvariantTypes)).toEqual(new Set([first, second]));
      expect(result.graph.invariants[0].temperatureRank).toBeGreaterThan(result.graph.invariants[1].temperatureRank);
      expect(validatePhaseTopology(result.graph)).toEqual({ valid: true, rejections: [] });
    }
  });

  it("connects the syntectic liquids to one top L and carries L2 into the lower eutectic", () => {
    const graph = acceptedGraph({
      invariantTargets: [
        { type: "syntectic", weight: 1, minCount: 1 },
        { type: "eutectic", weight: 1, minCount: 1 },
      ],
    }, 8842);
    const syntectic = graph.invariants.find((item) => item.reactionType === "syntectic")!;
    const eutectic = graph.invariants.find((item) => item.reactionType === "eutectic")!;
    expect(syntectic.reactantPhaseIds).toEqual(["L1", "L2"]);
    expect(syntectic.productPhaseIds).toEqual(["gamma"]);
    expect(eutectic.reactantPhaseIds).toEqual(["L2"]);
    expect(eutectic.productPhaseIds).toEqual(["gamma", "beta"]);
    expect(syntectic.temperatureRank).toBeGreaterThan(eutectic.temperatureRank);
    expect(graph.phases.filter((item) => item.state === "liquid" && item.reachesTop).map((item) => item.id)).toEqual(["L"]);
    expect(graph.adjacency.filter((item) => item.kind === "miscibility-branch").map((item) => item.phaseBId).sort()).toEqual(["L1", "L2"]);
  });

  it("returns an explicit rejection for incompatible required combinations", () => {
    const result = assemblePhaseTopology({
      invariantTargets: [
        { type: "syntectic", weight: 1, minCount: 1 },
        { type: "peritectoid", weight: 1, minCount: 1 },
      ],
    }, 1);
    expect(result).toMatchObject({ accepted: false, rejections: [{ code: "combination-not-embeddable" }] });
  });

  it("rejects zero-width phase domains and reversed lever ordering", () => {
    const graph = acceptedGraph(requireType("eutectic"));
    graph.phases[0].compositionInterval.maxBPercent = graph.phases[0].compositionInterval.minBPercent;
    graph.invariants[0].compositionByPhaseId.L = 5;
    const audit = validatePhaseTopology(graph);
    expect(audit.valid).toBe(false);
    expect(audit.rejections.map((item) => item.code)).toEqual(expect.arrayContaining([
      "invalid-composition-interval",
      "invalid-lever-order",
    ]));
  });

  it("rejects wrong reaction ownership", () => {
    const graph = acceptedGraph(requireType("peritectic"));
    graph.invariants[0].reactantPhaseIds = ["gamma"];
    graph.invariants[0].productPhaseIds = ["alpha", "L"];
    const audit = validatePhaseTopology(graph);
    expect(audit.rejections.map((item) => item.code)).toContain("invalid-reaction-ownership");
  });

  it("rejects unordered or coincident invariant temperatures", () => {
    const graph = acceptedGraph({
      invariantTargets: [
        { type: "eutectic", weight: 1, minCount: 1 },
        { type: "peritectoid", weight: 1, minCount: 1 },
      ],
    });
    graph.invariants[1].temperatureRank = graph.invariants[0].temperatureRank;
    const audit = validatePhaseTopology(graph);
    expect(audit.rejections.map((item) => item.code)).toContain("invalid-temperature-order");
  });

  it("rejects orphan phases, split liquid tops, and incomplete solid bottoms", () => {
    const graph = acceptedGraph(requireType("syntectic"));
    graph.phases.push({
      id: "orphan",
      identityKey: "orphan",
      state: "solid",
      compositionRole: "intermediate",
      compositionInterval: { minBPercent: 45, maxBPercent: 55 },
      reachesTop: false,
      reachesBottom: false,
    });
    graph.phases.find((item) => item.id === "L1")!.reachesTop = true;
    graph.phases.find((item) => item.id === "alpha")!.reachesBottom = false;
    const audit = validatePhaseTopology(graph);
    expect(audit.rejections.map((item) => item.code)).toEqual(expect.arrayContaining([
      "orphan-phase",
      "liquid-top-component",
      "solid-bottom-coverage",
    ]));
  });

  it("rejects duplicate semantic identities and undefined adjacency endpoints", () => {
    const graph = acceptedGraph(requireType("eutectoid"));
    graph.phases.find((item) => item.id === "gamma")!.identityKey = "alpha";
    graph.adjacency[0].phaseAId = "missing";
    const audit = validatePhaseTopology(graph);
    expect(audit.rejections.map((item) => item.code)).toEqual(expect.arrayContaining([
      "invalid-phase-identity",
      "invalid-adjacency",
    ]));
  });

  it("rejects a monotectoid that loses its parent solution family", () => {
    const graph = acceptedGraph(requireType("monotectoid"));
    graph.phases.find((item) => item.id === "alpha")!.phaseFamilyId = "unrelated";
    const audit = validatePhaseTopology(graph);
    expect(audit.rejections.map((item) => item.code)).toContain("invalid-phase-identity");
  });

  it("rejects impossible or malformed feature contracts", () => {
    expect(assemblePhaseTopology({ required: { invariantCount: { min: 2, max: 1 } } }, 1))
      .toMatchObject({ accepted: false, rejections: [{ code: "invalid-contract" }] });
    expect(assemblePhaseTopology({ invariantTargets: [{ type: "eutectic", weight: 0 }] }, 1))
      .toMatchObject({ accepted: false, rejections: [{ code: "no-eligible-motif" }] });
  });
});
