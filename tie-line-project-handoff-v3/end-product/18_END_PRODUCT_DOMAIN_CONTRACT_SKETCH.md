# End-Product Domain Contract Sketch

This is a directional contract, not a frozen implementation schema.

```ts
interface PuzzleIdentity {
  seed: string;
  generatorVersion: string;
  formalRulesVersion: string;
  instructionLanguageVersion: string;
  difficultyRulesetVersion: string;
  topologyLibraryVersion: string;
}

interface GeneratedPuzzleBundle {
  identity: PuzzleIdentity;
  difficulty: "easy" | "normal" | "advanced";
  diagramFamily: "binary" | "ternary";
  publicDefinition: PuzzleDefinition;
  instructions: PuzzleInstruction[];
  hiddenCanonicalSolution: CanonicalDiagram;
  canonicalHash: string;
  generationAudit: GenerationAudit;
}

interface ScoredAttemptState {
  puzzleIdentity: PuzzleIdentity;
  activeMilliseconds: number;
  submissionsRemaining: 3 | 2 | 1 | 0;
  status:
    | "active"
    | "solved"
    | "failed-scored-attempt"
    | "continued-unscored"
    | "solution-revealed"
    | "abandoned";
  localInvalidityCheckingEnabled: boolean;
}

interface PuzzleInstruction {
  id: string;
  type: string;
  parameters: Record<string, unknown>;
  compactRendering: string;
  expandedRendering: string;
}
```

The mature domain must not use a fixture-specific phase union or a single-invariant field model.
