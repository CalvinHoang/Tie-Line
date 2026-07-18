# Validation and Quality Plan

## 1. Validation objective

Tie-Line must prove that generated puzzles are scientifically legal, uniquely solvable, reproducible, correctly classified, and usable through the editor.

## 2. Test layers

### 2.1 Unit tests

Cover:

- phase-set canonicalisation;
- event ordering;
- invariant templates;
- adjacency derivation;
- tie-line rules;
- coordinate snapping;
- instruction rendering and parsing;
- difficulty classification;
- seed determinism;
- statistics calculations.

### 2.2 Formal-rule fixtures

For every rule, maintain:

- at least one valid fixture;
- one minimal invalid fixture;
- expected violation IDs;
- a canonical representation where relevant.

### 2.3 Topology-template tests

Every generator template must pass:

- parameter-bound tests;
- event-order tests;
- positive-cell-area tests;
- complete decomposition;
- instruction coverage;
- uniqueness;
- difficulty eligibility.

### 2.4 Property-based generation tests

Generate large deterministic seed ranges and assert:

- no validator failures;
- no ambiguous completions;
- no unsupported phase inventory;
- no degenerate geometry;
- stable reproduction;
- target difficulty agreement;
- valid instruction parse round-trip.

Failed seeds become permanent regression cases.

### 2.5 Canonical-equivalence tests

Create multiple visually different constructions of the same semantic solution and assert equality. Create subtly different incidence or assemblage structures and assert inequality.

### 2.6 Editor tests

Verify:

- malformed crossings are blocked;
- legal but scientifically wrong constructions can be entered;
- labels accept arbitrary distinct phase combinations;
- erase removes one token or selected object;
- undo restores semantic state;
- touch and mouse gestures produce the same commands;
- face extraction is stable under cosmetic curve adjustment.

### 2.7 Main Game lifecycle tests

Verify:

- direct launch and resume;
- timer pause and stop rules;
- exactly three scored submissions;
- first and second failure preserve editing;
- third failure ends scoring;
- unscored continuation cannot count as solved statistics;
- reveal ends scoring;
- successful result recording;
- daily streak qualification.

### 2.8 Practice and Notes tests

Verify every supported concept has:

- a Practice exercise generator;
- a Notes entry;
- stable links between them;
- correct scientific feedback.

### 2.9 Accessibility and layout tests

Test:

- 320 CSS pixel width;
- touch target size;
- zoom and pan;
- light and dark modes;
- reduced motion;
- colour-independent semantics;
- keyboard operation;
- screen-reader labelling.

## 3. Scientific golden set

Use authoritative schematic and real-system examples to test topology families. The supplied notes provide the initial binary examples and ternary reasoning taxonomy. Each executable golden fixture must record its source, interpretation, simplifications, and reviewer.

Real diagrams validate the grammar; they are not ordinary Main Game puzzle content.

## 4. Uniqueness proof tests

The generation solver must demonstrate that exactly one canonical completion satisfies:

- formal grammar;
- phase inventory;
- all instructions;
- coordinate grid;
- puzzle-specific object limits.

A timeout or inconclusive solve rejects the puzzle rather than publishing it.

## 5. Difficulty tests

Difficulty tests are golden feature-vector tests. They confirm deterministic classification under a ruleset version. Player behaviour is not an input and is not part of test data.

## 6. Release gate for a scientific feature

A feature is releasable only when:

- formal rules are reviewed;
- generator and validator agree;
- instruction forms round-trip;
- uniqueness is proven;
- Practice and Notes exist;
- real or authoritative schematic regression tests pass;
- interaction supports the object;
- difficulty rules classify it.

## 7. Audit output

Each generated puzzle should be able to emit a developer-only audit report containing:

- identity tuple;
- topology template;
- parameters;
- canonical hash;
- instruction constraints;
- validation passes;
- uniqueness count;
- difficulty feature vector and category.

This makes generation failures inspectable rather than mysterious.
