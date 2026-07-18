# Tie-Line Project Complete Handoff v3

# Tie-Line Project Handoff v3

This package combines two levels of specification:

1. **End Product / North Star** — the mature procedurally generated Tie-Line application.
2. **MVP Handoff** — the deliberately narrow first playable implementation.

Tie-Line is a minimal geometric deduction game in which the player reconstructs fictional phase diagrams from a complete set of thermodynamic instructions. Main Game opens immediately, generates reproducible puzzles in Easy, Normal, and Advanced, permits three scored submissions, and verifies semantic topology rather than cosmetic drawing shape.

## Read first

1. `end-product/00_NORTH_STAR_AND_DOCUMENT_HIERARCHY.md`
2. `end-product/01_PRODUCT_VISION.md`
3. `end-product/02_GAME_DESIGN_CONSTITUTION.md`
4. `end-product/15_END_PRODUCT_DECISION_LOG.md`
5. `end-product/17_RELATIONSHIP_TO_MVP.md`
6. `docs/00_AGENT_MASTER_PROMPT.md`
7. `docs/01_FORMAL_RULES_v0.2.md`
8. `docs/02_MVP_PRODUCT_SPEC.md`
9. `docs/10_ACCEPTANCE_TESTS.md`

## Governing hierarchy

- Product Vision defines the destination.
- Game Design Constitution defines permanent product constraints.
- Formal Rules define supported scientific legality.
- End-product specifications define mature behaviour and architecture.
- MVP specifications define the current implementation slice.
- Fixtures and tests define executable current acceptance.

The MVP may omit future features. It may not silently redefine Tie-Line as a single eutectic demo.

## End-product package

- North Star and hierarchy
- Product Vision
- Game Design Constitution
- application and navigation specification
- Main Game lifecycle
- procedural generation
- instruction language
- deterministic difficulty rules
- interaction and presentation
- Practice
- Notes reference manual
- statistics and streaks
- scientific coverage
- architecture evolution
- validation plan
- decision log
- design-owned defaults
- relationship to MVP

A combined file is available at `TIE_LINE_END_PRODUCT_COMPLETE_SPEC_v1.md`.

## MVP package

The existing MVP documents, fixture, schema, and visual references remain under `docs/`, `fixtures/`, `src/`, and `assets/`.

The integrated package revises the intended current behaviour in these respects:

- user-facing “instructions,” not “clues”;
- no default pre-submit correctness check;
- three scored submissions;
- visible active timer;
- optional local invalidity checking, off by default;
- fixed or partial geometry only for tutorial variants.

A combined project file is available at `TIE_LINE_PROJECT_COMPLETE_HANDOFF_v3.md`.

## Scientific reference

The supplied `references/MATS2008 Notes.pdf` is included as a taxonomy and scientific-validation source. Formal Rules remain the executable source of truth.


# Part I — End Product / North Star

---

# Tie-Line North Star and Document Hierarchy

**Status:** Governing product document for the mature Tie-Line application.

## Purpose

This pack defines the product that the MVP is intended to grow into. It exists so that a narrow first build does not silently become the permanent product model.

The end-product documents are directional and architectural. They do not require the current implementation agent to build every described capability. They do require the agent to avoid choices that would make those capabilities unnecessarily difficult or contradict the product constitution.

## Source-of-truth hierarchy

When documents appear to conflict, apply this order:

1. **Product Vision** — what Tie-Line ultimately is.
2. **Game Design Constitution** — principles that product and implementation decisions may not violate.
3. **Formal scientific rules** — what constitutes a legal diagram under the currently supported grammar.
4. **End-product specifications** — mature behaviour for generation, navigation, Main Game, Practice, Notes, statistics, and interaction.
5. **MVP Product Specification** — binding implementation scope for the current build only.
6. **Fixtures and acceptance tests** — executable examples of the current scope.

A current MVP shortcut may omit an end-product feature. It may not redefine the long-term product unless the decision log is deliberately revised.

## Binding language

- **Must**: required for the mature product or for preserving its architecture.
- **Should**: preferred default; revise only with a recorded reason.
- **May**: permitted but not required.
- **MVP only**: a temporary implementation restriction.
- **Provisional ruleset**: deterministic and usable now, but expected to be replaced by a later manually authored version rather than by automatic telemetry.

## Product in one sentence

> Tie-Line is a minimal geometric deduction game in which the player reconstructs procedurally generated binary and ternary phase diagrams from a complete set of thermodynamic instructions, with one canonical logical solution and no need to guess.

## What this pack prevents

It prevents the project from collapsing into any of the following:

- a single eutectic demonstration;
- a freeform diagram editor;
- a multiple-choice educational quiz;
- a fixed campaign of authored levels;
- a dashboard surrounding a small diagram;
- a generator that creates diagrams without proving legality and uniqueness;
- a validator that compares pixels or curve shape rather than thermodynamic topology;
- an application in which scientific reference content is mixed into the active puzzle board.

## End-product documents

1. Product Vision
2. Game Design Constitution
3. Application Structure and Navigation
4. Main Game Specification
5. Procedural Generation Specification
6. Instruction Language Specification
7. Deterministic Difficulty Ruleset
8. Interaction and Presentation End State
9. Practice Specification
10. Notes Reference Manual Specification
11. Statistics and Streaks Specification
12. Scientific Coverage and Content Taxonomy
13. Architecture Evolution Plan
14. Validation and Quality Plan
15. End-Product Decision Log
16. Design-Owned Defaults and Deferred Implementation
17. Relationship to the MVP

---

# Product Vision

## 1. Product thesis

Tie-Line turns phase-diagram construction into a repeatable logic game.

The player is given all instructions required to define a fictional material system. The player places thermodynamic events, constructs legal boundaries and invariant objects, and labels the resulting phase-bearing regions. The puzzle is solved when the submitted construction is semantically equivalent to the generated canonical solution.

The challenge is not remembering the appearance of a real alloy system. It is translating thermodynamic statements into geometry and using the rules of phase equilibria to deduce the only legal completion.

## 2. Core promise

Every scored Main Game puzzle must be:

- procedurally generated;
- based on abstract components and phases;
- completely specified by instructions shown from the start;
- solvable without hidden information;
- legal under a versioned scientific grammar;
- uniquely solvable at the canonical semantic level;
- reproducible from its seed and version identifiers;
- classified by deterministic difficulty rules;
- playable without guessing.

## 3. Intended experience

Tie-Line should create the same broad rhythm as a strong Minesweeper, Sudoku, or crossword application:

1. open directly into the current puzzle;
2. inspect the full information set;
3. make a sequence of deductions on a quiet board;
4. submit the completed construction;
5. record the result;
6. continue immediately with another generated puzzle.

The product is educational because the game rules are scientific. It should not feel like a lesson wrapped around a quiz.

## 4. Intended audience

Tie-Line is designed primarily for:

- materials-science and metallurgy students;
- graduates revising phase-equilibrium reasoning;
- lecturers seeking focused practice exercises;
- technically curious players who enjoy geometric logic games.

A player should be able to learn terminology through Practice and Notes, but Main Game assumes that the player is attempting a deduction puzzle rather than following a guided course.

## 5. Mature application

The mature application contains five main areas:

- **Main Game** — unlimited generated puzzles in Easy, Normal, and Advanced.
- **Practice** — generated exercises focused on every supported concept.
- **Notes** — a reference manual of definitions, rules, reactions, and diagrams.
- **Statistics** — streaks, solves, time, no-error solves, and puzzle history.
- **Settings** — presentation, accessibility, interaction, and optional local invalidity checking.

The application opens into Main Game rather than into this menu.

## 6. Binary and ternary destination

Binary diagrams establish the core interaction and verifier. The mature scientific scope extends beyond the initial restricted binary grammar to include the binary and ternary reasoning families in the supplied course notes.

Binary play ultimately covers complete and limited solubility, invariant reactions, compounds, polymorphism, immiscibility where formally supported, tie lines, cooling paths, and phase fractions.

Ternary play ultimately covers ternary composition, compatibility triangles, primary crystallisation fields, liquidus projections, cotectic boundaries, Alkemade relationships, temperature directions, invariant points, isothermal sections, and crystallisation paths.

The Main Game menu remains Easy, Normal, and Advanced. The active difficulty ruleset determines which diagram families and features are eligible for each mode.

## 7. What Tie-Line is not

Tie-Line is not:

- a CALPHAD package;
- a thermodynamic database;
- a laboratory-data fitting tool;
- a pixel-perfect drafting application;
- a fixed sequence of textbook questions;
- an adaptive-learning platform that changes difficulty from behavioural telemetry;
- a memorisation test based on named real systems.

## 8. Long-term success

The product succeeds when a player can repeatedly encounter unfamiliar generated systems and become better at the underlying procedure for constructing and reading phase diagrams.

The strongest evidence of success is not that the player remembers a diagram. It is that the player can derive a new one.

---

# Game Design Constitution

These principles govern future product, content, and implementation decisions.

## C1. The diagram is the board

The phase diagram is the primary play surface. Lines, points, lower-dimensional phase objects, phase symbols, and instructions are the game pieces. Persistent panels must not reduce the board to a small illustration.

## C2. Instructions are complete and simultaneous

All information needed to solve a puzzle is available from the beginning. Instructions are not drip-fed, randomly revealed, or hidden behind progress gates. They may be arranged compactly, but the player can inspect the complete set at any time.

## C3. No guessing

Every published puzzle has exactly one canonical semantic completion under its ruleset. A generator must reject puzzles that are ambiguous, underdetermined, contradictory, or dependent on aesthetic curve choice.

## C4. Procedural Main Game

Main Game is an unlimited stream of procedurally generated puzzles. Easy, Normal, and Advanced are modes, not campaigns. The player completes puzzles, not difficulties.

## C5. Abstract systems

Ordinary Main Game puzzles use abstract component and phase labels. Real systems are reserved for scientific validation, Notes, Practice examples, or explicitly curated special puzzles.

## C6. Scientific legality is the game law

The validator evaluates phase-equilibrium structure, dimensionality, incidence, adjacency, reaction templates, and instruction satisfaction. Cosmetic similarity to a reference rendering is not sufficient and is not required.

## C7. Canonical equivalence, not drawing imitation

Equivalent solutions may differ in benign curvature, control-point placement, label placement, and insertion order. They must agree in canonical topology, phase assemblages, reaction identity, required coordinates, and incidence.

## C8. Constrained expression

The editor prevents malformed input such as undeclared crossings, accidental gaps, impossible endpoint syntax, or non-horizontal invariant objects. It must still permit scientifically wrong but structurally expressible constructions so that the player, rather than the editor, performs the reasoning.

## C9. Submission is consequential

A scored puzzle provides three submissions. Main Game gives no correctness feedback before submission by default. An optional Settings preference may enable local invalidity checking, but it must not reveal the canonical answer.

## C10. Failure is bounded, not punitive

After three incorrect submissions, the scored attempt ends and the timer stops. The puzzle is marked unsuccessful. The player may continue unscored, reveal the solution, or begin a new generated puzzle. There are no lives and no difficulty-wide lockout.

## C11. Minimal active play

The application opens into Main Game. The active board contains only the controls, timer, submission state, and instruction access required to play. Practice, Notes, Statistics, and Settings remain one menu action away.

## C12. Practice isolates concepts

Practice is not simply an easier Main Game. It generates focused exercises for every supported concept, permits unlimited attempts, and may provide immediate explanatory feedback.

## C13. Notes are a reference manual

Notes define terms, invariants, rules, notation, and procedures. Notes are searchable and cross-linked. They are not a forced course, narrative textbook, or source of hidden puzzle answers.

## C14. Difficulty is deterministic

Difficulty is assigned exclusively from a versioned set of structural and instruction rules. Player solve rates, times, mistakes, or abandonment do not automatically alter puzzle difficulty.

## C15. Seeds are reproducible

Every puzzle is identified by a seed plus generator, grammar, instruction-language, and difficulty-ruleset versions. The same complete identity must reproduce the same semantic puzzle.

## C16. Generation proves before publication

A generated puzzle is not playable until the system has constructed its canonical solution, validated scientific legality, generated sufficient instructions, and proved canonical uniqueness within the supported grammar.

## C17. Learning content stays outside deduction

Main Game may link to a relevant Notes definition after a result, but it must not interrupt play with teaching panels or transform rule errors into answer-revealing hints.

## C18. Architecture follows the domain

Thermodynamic objects, generation, validation, canonicalisation, and instruction semantics remain independent of rendering and UI frameworks. No golden puzzle may be hard-coded throughout the product.

## C19. Rules evolve explicitly

New scientific families require a new formal-rules version, tests, generator support, and Notes coverage. They may not be added through ad hoc exceptions.

## C20. Telemetry describes; it does not govern

Statistics may report how the player performed. They do not change difficulty, generate personalised scientific rules, or silently modify the puzzle distribution.

---

# Application Structure and Navigation

## 1. Launch behaviour

Tie-Line opens directly into the most recently active scored Main Game puzzle.

- On first launch, it opens an Easy onboarding puzzle.
- On later launches, it restores the exact active board, instruction state, timer, viewport, submissions remaining, and edits.
- When there is no current puzzle, it immediately generates one in the last selected difficulty; the first default is Easy.

There is no mandatory home screen.

## 2. Main menu

A small, low-prominence menu control opens the application navigation over or beside the paused board.

Primary destinations:

```text
Main Game
  Easy
  Normal
  Advanced
Practice
Notes
Statistics
Settings
```

Closing the menu restores the board exactly.

## 3. Main Game navigation

Easy, Normal, and Advanced are all available from the beginning. No difficulty is unlocked or completed.

The application maintains one resumable scored puzzle per difficulty. Switching difficulty pauses the current puzzle and resumes or generates the selected difficulty's puzzle. This prevents accidental loss while preserving the immediate-play model.

Each difficulty page may show only compact status:

- current seed or puzzle identifier;
- in-progress or ready state;
- elapsed active time;
- submissions remaining;
- start/resume control.

It must not become a campaign map or level grid.

## 4. Practice navigation

Practice opens a concept browser organised by diagram family and concept category.

Example structure:

```text
Binary
  Coordinates and fields
  Boundaries and tie lines
  Invariant reactions
  Compounds and transformations
  Cooling and phase fractions
  Error identification
Ternary
  Composition and joins
  Compatibility triangles
  Liquidus projections
  Cotectics and temperature direction
  Invariant points
  Isothermal sections
  Crystallisation paths
```

Selecting a concept starts a generated focused exercise. Practice preserves its own most recent exercise but never replaces the active Main Game puzzle.

## 5. Notes navigation

Notes supports:

- alphabetical index;
- category index;
- search;
- related-entry links;
- direct links from Practice and result states.

Opening Notes from a rule reference goes to the relevant definition without exposing the current puzzle's solution.

## 6. Statistics navigation

Statistics is a separate page containing daily streaks, puzzle counts, time, no-error solves, and recent history. Nothing from this page is persistently visible around the board except the active timer.

## 7. Settings navigation

Settings contains presentation and interaction preferences, including the optional local-invalidity-check setting. Scientific grammar and difficulty rules are not user settings.

## 8. Pause rules

The scored timer pauses when:

- the application is backgrounded;
- the menu is open;
- the player leaves Main Game for Practice, Notes, Statistics, or Settings;
- the browser or device suspends the application.

The timer does not pause merely because the player is reading the instructions on the active puzzle screen.

## 9. Back behaviour

Back navigation should preserve work:

- leaving an editor returns to its parent screen without discarding changes;
- leaving a puzzle pauses rather than abandons it;
- abandoning a puzzle requires an explicit action;
- generating a replacement puzzle requires confirmation when a scored puzzle is in progress.

## 10. Completion transition

A successful submission produces a restrained result state over the solved board. The player can inspect the diagram, view the result summary, or begin the next puzzle. The application does not automatically replace the solved diagram before the player acknowledges completion.

---

# Main Game Specification

## 1. Purpose

Main Game is the default and primary Tie-Line experience: a continuous stream of complete procedurally generated phase-diagram construction puzzles.

## 2. Puzzle lifecycle

A scored puzzle moves through these states:

```text
generating
ready
active
submitted-incorrect-1
submitted-incorrect-2
solved
failed-scored-attempt
continued-unscored
solution-revealed
abandoned
```

## 3. Generation and start

When a new puzzle is requested:

1. select the current difficulty ruleset and requested difficulty;
2. derive a deterministic puzzle from a random seed;
3. construct and validate the canonical solution;
4. generate the complete instruction set;
5. prove canonical uniqueness;
6. render the empty or minimally initialised board;
7. show all instructions as one complete set;
8. start the visible timer when the puzzle becomes active.

A generation failure is invisible to the player; the generator rejects that candidate and tries another seed.

## 4. Active board

The active board contains:

- diagram axes and composition frame;
- player-created semantic geometry;
- phase symbols and labels;
- compact access to the full instruction set;
- visible active-time timer;
- submissions remaining, represented compactly;
- minimal drawing, selection, erase, undo, and submission controls;
- one menu control.

It does not contain statistics cards, concept lessons, advertisements, a progress campaign, or a persistent inspector.

## 5. Instructions

All puzzle instructions are available from the start. Instructions may be displayed in a compact band on large screens and a dedicated sheet on small screens, but the entire set is inspectable together. Instructions are never described internally or publicly as hidden clues.

The instruction set must be sufficient to reconstruct the unique canonical solution without knowledge of the seed or template.

## 6. Editing

The player may place points, create semantic boundaries, create invariant or compound objects, label phase-bearing cells, modify eligible geometry, remove entries, pan, zoom, and undo.

The editor enforces syntactic geometry while allowing scientific errors.

## 7. Pre-submission feedback

Default Main Game behaviour provides no correctness checking before submission.

The editor may still block malformed gestures that cannot form a valid data structure. Blocking malformed input is not correctness feedback.

A Settings option, **Local invalidity checking**, may be enabled. When enabled it may flag definite local violations of the current formal grammar or explicit instruction coordinates. It must not:

- identify missing objects solely because the puzzle is incomplete;
- reveal where a correct object belongs;
- compare against the hidden complete answer;
- perform solver-backed next-step hints.

The setting is off by default.

## 8. Submission budget

Each scored puzzle has exactly three submissions.

### Incorrect first or second submission

- consume one submission;
- keep the timer running;
- preserve the construction;
- show only that the submission is incorrect, incomplete, or malformed at the broad outcome level;
- do not reveal answer geometry;
- return control to the player.

When local invalidity checking is enabled, the result may additionally retain local rule highlighting that would have been available before submission.

### Correct submission

- mark the puzzle solved;
- stop the timer;
- record statistics;
- lock the semantic construction against accidental editing;
- show the result state.

### Incorrect third submission

- mark the scored attempt unsuccessful;
- stop the scored timer;
- record the failed attempt;
- offer Continue unscored, Reveal solution, and New puzzle.

## 9. Unscored continuation

Continuing unscored preserves the player's construction and allows unlimited further submissions or local checks. It cannot become a scored solve and cannot count toward the daily streak or no-error statistics.

The interface must clearly indicate that the timer and scored attempt have ended without covering the board in warning chrome.

## 10. Reveal solution

Reveal solution displays the canonical semantic construction. Player and solution layers may be compared, but the solution must be visually distinguished. Revealing ends any remaining scored status.

The solution view may link to relevant Notes entries, but it should not force a lesson.

## 11. Result state

A successful result state contains:

- solved diagram;
- selected difficulty;
- completion time;
- submissions used;
- no-error status;
- assisted/local-check status;
- reproducible puzzle code or seed identifier;
- Next puzzle;
- optional View details.

It should be a compact overlay or sheet, not a dashboard replacing the diagram.

## 12. No-error definition

A **no-error solve** is a scored solution accepted on the first submission without revealing the solution. Whether local invalidity checking was enabled is stored separately so statistics can distinguish assisted and unassisted no-error solves without changing the definition.

## 13. Daily streak eligibility

A day counts when the player successfully completes at least one scored Main Game puzzle during the local calendar day. Practice, failed attempts, revealed solutions, and unscored continuation do not count.

A failed puzzle does not break the streak if another scored puzzle is solved that day.

## 14. Abandonment

The player may abandon an in-progress puzzle. Abandonment:

- stops the timer;
- records an abandoned scored attempt;
- does not reveal the solution automatically;
- allows a replacement puzzle to be generated;
- does not consume or lock a difficulty.

## 15. Offline behaviour

Generated puzzle definitions, canonical answers, instructions, and state should be stored locally once issued. A current puzzle remains playable offline. The end product should not require a network round trip for each move or submission.

---

# Procedural Generation Specification

## 1. Principle

Procedural generation in Tie-Line means generating a legal semantic phase diagram and then deriving a complete puzzle from it. It does not mean drawing random curves and attempting to interpret them afterward.

The generator is template-driven at the topology level and parameterised at the coordinate, phase, reaction, and instruction levels. This approach remains compatible with a broad grammar while making legality and uniqueness auditable.

## 2. Puzzle identity

A puzzle is reproduced by the tuple:

```text
seed
generatorVersion
formalRulesVersion
instructionLanguageVersion
difficultyRulesetVersion
topologyLibraryVersion
```

A user-facing puzzle code may encode or reference this tuple.

## 3. Generation pipeline

### Stage 1: Select eligibility profile

Input:

- requested difficulty;
- current deterministic difficulty ruleset;
- supported formal-rules version;
- enabled topology library.

Output:

- permitted diagram family;
- permitted invariant types;
- allowed intermediate phases;
- coordinate and instruction constraints;
- target structural range.

### Stage 2: Select canonical topology template

Choose a legal topological skeleton rather than a rendered diagram. A template defines:

- phases and phase kinds;
- event ordering;
- invariant-reaction templates;
- compounds and fixed compositions;
- incidence between cells, interfaces, and events;
- unary edge sequences;
- binary or ternary family.

Templates are composable grammar productions where scientifically valid composition is proven.

### Stage 3: Assign abstract inventory

Assign abstract component and phase labels from a declared inventory. The phase palette must disclose permitted labels but not correct assemblages.

### Stage 4: Parameterise geometry

Assign temperatures and compositions under explicit constraints:

- correct event ordering;
- invariant horizontality or ternary event geometry;
- line-compound verticality;
- positive-area fields;
- minimum visual separation;
- non-crossing monotone branches;
- axis bounds;
- grid compatibility;
- no degenerate cells;
- no values that create accidental alternate topology.

Rendering curves are generated only after semantic coordinates and incidence are fixed.

### Stage 5: Build canonical cell complex

Construct the full labelled stratified cell complex. Derive ordinary interface types from incident assemblages rather than assigning them cosmetically.

### Stage 6: Validate scientific legality

Run all structural, field, adjacency, tie-line, invariant, compound, unary, and completeness rules supported by the selected formal grammar.

Reject on any failure.

### Stage 7: Generate instructions

Choose instruction forms permitted by the requested difficulty. Generate deterministic text or notation from semantic facts. Runtime prose must come from controlled templates rather than unconstrained language generation.

### Stage 8: Verify instruction consistency and sufficiency

Parse the generated instruction set back into formal constraints. Confirm that:

- every instruction is true of the canonical solution;
- instructions do not contradict one another;
- all required symbols are declared;
- every numerical value is representable on the puzzle grid;
- the instructions do not accidentally reveal excluded hidden metadata.

### Stage 9: Prove canonical uniqueness

Enumerate or solve for all legal completions under the current grammar and instruction constraints. Canonicalise each completion. Accept only when exactly one canonical completion remains.

Uniqueness ignores cosmetic curve shape and label placement.

### Stage 10: Classify difficulty

Apply the versioned deterministic difficulty ruleset to the generated semantic puzzle and instruction set. The resulting category must match the requested mode. Otherwise reject or regenerate.

### Stage 11: Quality filters

Reject puzzles with:

- visually unplayable narrow regions;
- nearly coincident anchors;
- excessive instruction length for the target mode;
- redundant instructions that trivialise the puzzle beyond the mode;
- unstable face extraction under permitted drawing tolerance;
- inaccessible touch targets;
- semantically equivalent but visually misleading arrangements.

### Stage 12: Serialize

Store:

- public puzzle definition;
- complete instructions;
- hidden canonical solution;
- canonical hash;
- seed and version tuple;
- difficulty feature vector and result;
- validation report.

## 4. Topology library

The topology library is the authoritative set of generator productions for a formal-rules version. It should begin with simple binary families and expand deliberately.

Each template requires:

- formal name and stable ID;
- supported phase inventory;
- event and incidence schema;
- legal parameter ranges;
- instruction-generation coverage;
- canonicalisation tests;
- valid and invalid fixtures;
- associated Notes entries;
- at least one real-system or authoritative schematic regression reference where available.

## 5. Generator randomness

Randomness may choose:

- topology template within mode eligibility;
- number and type of intermediate phases;
- abstract labels;
- legal event temperatures and compositions;
- equivalent visual layout parameters;
- instruction forms allowed by difficulty;
- order of instructions on screen, provided grouping remains readable.

Randomness may not bypass validation or determine scientific truth after rendering.

## 6. Reproducibility

Generation must be deterministic for a complete puzzle identity. Changing a generator or rules version may change the result for the same raw seed, which is why all version identifiers are part of the identity.

## 7. Canonical uniqueness

Two completions are canonically identical when they agree on all semantically relevant features, including:

- declared phases and kinds;
- event roles and required coordinates within formal tolerance;
- invariant reaction types and participating phases;
- incidence graph;
- phase-bearing cells and assemblages;
- interface adjacency;
- unary-edge sequences;
- compound placement and behaviour;
- required ordering and ternary compatibility structure.

They may differ in:

- Bézier control points;
- harmless curve smoothness;
- phase-token insertion order;
- label screen position;
- viewport and zoom;
- rendering theme.

## 8. Generation limits

A template or scientific feature is not eligible for Main Game until the product has:

- formal rules;
- canonical representation;
- a generator production;
- an instruction vocabulary;
- a uniqueness method;
- a validator;
- Practice coverage;
- a Notes definition;
- tests.

This prevents unsupported science from entering through content alone.

---

# Instruction Language Specification

## 1. Purpose

The instruction language is the controlled vocabulary through which a generated semantic diagram becomes a player-facing puzzle.

Instructions are facts and requirements, not hints. The entire set is available from the beginning and is sufficient to identify one canonical solution.

## 2. Requirements

Every instruction form must have:

- a stable machine-readable type;
- typed parameters;
- a deterministic compact rendering;
- an optional expanded plain-language rendering;
- a formal constraint interpretation;
- tests for parsing and rendering;
- defined difficulty eligibility.

Runtime instructions should never depend on ambiguous freeform prose.

## 3. Presentation

The player can inspect all instructions together.

Recommended presentation:

- compact notation in a board-adjacent instruction sheet;
- grouping by components, events, phases, and relationships;
- expanded wording on tap where needed;
- no one-at-a-time reveal sequence;
- no requirement to memorise instructions before returning to the board.

On a small screen, the instruction sheet may overlay part of the board while open, but it preserves the complete set and can remain open during construction.

## 4. Core binary instruction families

### 4.1 Component and axis declarations

Examples:

```text
Components: A–B
Horizontal axis: 0–100%B
Temperature: 0–1100°C
```

### 4.2 Phase inventory

```text
Phases: L, α, β, γ
γ is a line compound.
```

The inventory permits input; it does not state where phases belong.

### 4.3 Exact melting facts

```text
A melts at 1000°C.
B melts at 850°C.
```

Formal constraint: unary melting event at the specified edge and temperature.

### 4.4 Exact invariant facts

```text
E₁ occurs at 40%B and 700°C.
At E₁: L → α + β.
```

The reaction statement and event coordinate may be separate instructions.

### 4.5 Phase composition at an event

```text
At E₁, α contains 10%B.
At E₁, β contains 80%B.
```

### 4.6 Terminal solubility facts

```text
At 300°C, α contains at most 4%B.
At 300°C, β contains at least 94%B.
```

### 4.7 Compound facts

```text
γ has composition 60%B.
γ melts congruently at 920°C.
γ forms peritectically at P₁.
```

### 4.8 Reaction facts

Supported forms correspond exactly to the current formal grammar, for example:

```text
L → α + β
α + L → β
α → β + γ
α + β → γ
```

Later formal-rules versions may add liquid-immiscibility and other invariant families.

### 4.9 Ordering relationships

```text
E₁ is hotter than E₂.
P₁ lies to the B-rich side of γ.
The composition of E₁ is between α and γ.
```

### 4.10 Adjacency and incidence relationships

```text
The L + α field is adjacent to the A edge.
γ terminates at C₁.
The E₁ horizontal meets γ.
```

These are used cautiously because overly direct incidence statements can trivialise a puzzle.

### 4.11 Cooling and observation instructions

```text
At 35%B, α is the first solid to form on cooling.
At 65%B, the last liquid disappears at E₂.
At 500°C and 45%B, the stable phases are α and γ.
```

These translate physical observations into constraints without naming every boundary.

### 4.12 Quantitative phase-fraction instructions

Where lever-rule concepts are enabled:

```text
At T₁ and x₀, the fraction of α is 0.40.
```

Such instructions require exact phase-composition endpoints and must be generated only when numerical tolerance is unambiguous.

## 5. Ternary instruction families

### 5.1 Composition-point facts

```text
P contains 20%A, 30%B, and 50%C.
```

### 5.2 Phase and compound inventory

```text
Phases: L, A, B, C, X, Y.
X and Y are stoichiometric compounds.
```

### 5.3 Binary-edge facts

```text
The A–B edge contains one eutectic.
X lies on the A–C join.
```

### 5.4 Compatibility relationships

```text
X is compatible with B.
The stable subsolidus triangles include A–X–B and X–Y–B.
```

The language must distinguish a supplied compatibility fact from a relationship the player is expected to infer.

### 5.5 Primary crystallisation fields

```text
Point P lies in the primary field of X.
A and X share a cotectic boundary.
```

### 5.6 Alkemade and temperature-direction facts

```text
The maximum temperature on this boundary lies on the A–X join.
Temperature decreases from U₁ toward E₁.
```

### 5.7 Ternary invariant facts

```text
At E₁: L → A + X + B.
At P₁: L + X → Y + B.
```

### 5.8 Isothermal-section facts

```text
At T₁, the stable three-phase triangle is A–X–B.
The liquid composition lies on boundary q.
```

### 5.9 Crystallisation-path facts

```text
An alloy starting at P first precipitates X.
The liquid path reaches q before E₁.
```

## 6. Direct and derived instructions

Instructions are classified by the amount of deduction they leave:

- **Direct numerical** — exact coordinate or value.
- **Direct semantic** — exact reaction or phase property.
- **Relational** — ordering, adjacency, compatibility, or containment.
- **Observational** — cooling, phase presence, or fraction at a condition.
- **Composite** — a concise notation encoding multiple typed facts.

Difficulty rules specify which mix is eligible.

## 7. Instruction sufficiency

A complete instruction set must constrain every semantically meaningful degree of freedom required for one canonical solution. The uniqueness solver, not human judgement alone, confirms sufficiency.

## 8. Instruction redundancy

Some redundancy may improve readability or Easy-mode accessibility. Redundancy is allowed only when it does not reduce the puzzle below the target difficulty or introduce a second interpretation.

## 9. Terminology

User-facing documents and UI use **instructions**. Legacy MVP code may temporarily contain fields named `clues`; these are migration targets and must not define the mature domain vocabulary.

---

# Deterministic Difficulty Ruleset v0.1

**Status:** Provisional design-owned ruleset. It is deterministic and must not be changed automatically from player data.

## 1. Principle

Easy, Normal, and Advanced are assigned from the semantic structure of a puzzle and the form of its instructions. They are not campaigns, skill ratings, or adaptive user profiles.

The same puzzle identity always receives the same difficulty under the same ruleset version.

## 2. Inputs

The classifier may use only declared puzzle features, including:

- diagram family;
- invariant types;
- number of invariant reactions;
- number of intermediate phases;
- congruent or incongruent compound behaviour;
- number of phase-bearing cells;
- number of structural events;
- maximum dependency depth between instructions and required construction;
- ratio of direct to relational or observational instructions;
- number of locally plausible partial topologies eliminated by global constraints;
- requirement to reason about cooling paths, phase fractions, or ternary compatibility.

It may not use player performance, solve rates, elapsed time, mistakes, geography, account history, or live telemetry.

## 3. Ruleset v0.1 categories

### Easy

A generated puzzle is Easy only when all applicable conditions hold:

- binary diagram;
- one invariant reaction;
- invariant is eutectic or eutectoid;
- zero intermediate phases, or one simple congruently melting line compound with its behaviour stated directly;
- no incongruent compound;
- reaction type is given directly;
- critical event coordinates are numerical;
- instructions are predominantly direct numerical or direct semantic facts;
- maximum required deduction chain is short;
- no more than one meaningful partial topology remains plausible after placing the supplied events;
- limited number of phase-bearing regions and boundary segments.

### Normal

A generated puzzle is Normal when it exceeds Easy but remains within all of the following:

- binary diagram;
- one to three invariant reactions;
- eutectic, eutectoid, peritectic, or peritectoid reactions permitted;
- up to two intermediate phases;
- congruent and one incongruent compound permitted;
- mixed direct and relational instructions;
- reaction type may require inference for at most one event;
- moderate dependency chains;
- more than one partial construction may initially appear plausible, but local and event-order constraints resolve the choice without requiring full global enumeration by the player.

### Advanced

A puzzle is Advanced when any Advanced trigger is present:

- ternary diagram under ruleset v0.1;
- more than three invariant reactions;
- more than two intermediate phases;
- interacting congruent and incongruent compound structures;
- multiple inferred reaction identities;
- instructions predominantly relational or observational;
- long dependency chains;
- several locally legal partial topologies remain possible until global compatibility, completeness, or cooling-path reasoning is applied;
- quantitative phase-fraction constraints interact with topology;
- advanced formal-rules families such as immiscibility when later enabled.

## 4. Manual revision

This ruleset may be replaced by v0.2 or later after design review, scientific review, or deliberate playtesting. Revision is a manual product decision and produces a new version. Existing puzzle identities retain the ruleset version under which they were classified.

## 5. Statistics

Statistics may be reported by difficulty but never feed back into the classifier. A puzzle does not move between difficulties because players found it easier or harder than expected.

## 6. Generator contract

The generator requests a target mode and must reject candidates classified into a different mode. It may not override the classifier label to fill inventory.

## 7. Future refinement

Later deterministic versions may replace broad thresholds with a formal complexity calculation. Any such calculation must remain inspectable, versioned, and based entirely on puzzle structure and instruction semantics.

---

# Interaction and Presentation End State

## 1. Visual principle

Tie-Line uses the UI-density and board-first discipline of a clean Minesweeper application. This is a product grammar, not a requirement to imitate another application's exact colours or assets.

The board dominates. Controls appear only when they support the current action.

## 2. Board layout

The active play screen includes:

- full available diagram area;
- axes and sparse numerical markings;
- visible timer;
- compact submission count;
- instruction access;
- a minimal tool area;
- undo;
- submit;
- menu.

There is no persistent dashboard, lesson pane, statistics card, or large title.

## 3. Instruction presentation

All instructions are available simultaneously.

Large screens:

- a compact instruction column or band may remain visible without materially shrinking the board.

Small screens:

- one instruction control opens a sheet containing the complete set;
- the sheet can remain open while the board is partially visible where practical;
- instructions are grouped and scroll as one set;
- closing the sheet never changes puzzle state.

The UI does not reveal instructions one by one.

## 4. Coordinate model

The mature editor presents continuous-looking axes backed by a hidden deterministic semantic grid.

- generated coordinates lie on the semantic grid;
- dragging snaps to legal grid values and semantic constraints;
- temporary coordinate readouts appear during placement;
- visible grid density may vary by mode, but semantic precision is fixed by puzzle definition;
- coordinate acceptance is based on snapped semantic values, not raw pixel tolerance.

## 5. Semantic tools

The domain supports distinct semantic actions even if the visual toolbar is contextual:

- place event or anchor;
- draw ordinary boundary;
- create invariant object;
- create compound object;
- label phase-bearing target;
- select and adjust;
- erase;
- pan and zoom;
- undo.

The toolbar may consolidate tools when the action remains predictable and reversible. It must not infer so aggressively that scientifically wrong but structurally legal input becomes impossible.

## 6. Drawing

For an ordinary boundary:

1. begin at a valid semantic node or frame location;
2. drag toward a valid endpoint;
3. show a clean snapped preview;
4. release to commit a semantic segment;
5. expose limited curvature adjustment on selection.

Raw stroke shape is not authoritative.

Invariant horizontals, line compounds, joins, and ternary boundary objects use specialised constrained gestures.

## 7. Labelling

The phase palette is derived from the puzzle inventory.

The player may:

- select a phase and tap multiple targets;
- drag a phase token to a target;
- add phases in any order;
- remove an individual token in Erase mode.

Insertion order may be preserved visually. Validation uses distinct unordered sets. Duplicate tokens are ignored as input accidents.

The editor does not prevent the player from assigning the wrong number of phases to a target unless the local-invalidity-check setting is enabled; even then, it flags rather than silently corrects.

## 8. Feedback

Before submission, default feedback is limited to interaction syntax:

- snap preview;
- valid structural endpoint affordance;
- selection state;
- blocked malformed gesture;
- undo confirmation.

It does not communicate scientific correctness.

After submission, the board gives a restrained global outcome. Local scientific highlighting appears only when the Settings option permits it.

## 9. Timer and submissions

The active timer is visible but visually subordinate to the diagram. Three compact submission indicators show the remaining scored submissions.

The timer must not become a speed-game demand. It records performance and supports statistics while preserving a quiet solving experience.

## 10. Completion

On success:

- edit handles fade;
- geometry resolves to a clean final diagram;
- a subtle completion motion may trace or settle the constructed topology;
- a compact result sheet appears;
- the solved board remains inspectable.

## 11. Accessibility

The mature product supports:

- light and dark appearance;
- colour-independent phase and error distinctions;
- scalable phase symbols and controls;
- left-handed tool placement;
- reduced motion;
- sound and haptic controls;
- keyboard and mouse operation on desktop;
- touch targets suitable for mobile;
- screen-reader labels for tools, instructions, phase tokens, and result states.

## 12. Onboarding

The first Easy puzzle is an authored onboarding puzzle presented in the same visual language as generated play. It teaches interaction mechanics without redefining Main Game as a campaign.

Tutorial assistance may preplace or demonstrate selected objects. After onboarding, generated Main Game puzzles begin instruction-first with no assumed partial solution unless a generated instruction explicitly locks an element.

---

# Practice Specification

## 1. Purpose

Practice lets the player deliberately train one phase-diagram concept or operation at a time. It covers every concept supported by the mature grammar and does not affect Main Game streaks or scored statistics.

## 2. Behaviour

Practice exercises are:

- procedurally generated;
- selected by concept rather than difficulty campaign;
- usually partial-diagram or focused tasks;
- untimed by default;
- unlimited in attempts;
- permitted to give immediate local feedback;
- linked to the relevant Notes definitions;
- repeatable with a new seed.

Practice may record completion history for convenience, but it does not adapt scientific content or reclassify difficulty from performance.

## 3. Exercise forms

Practice may ask the player to:

- place one or more events;
- select the correct reaction object;
- draw a missing boundary;
- complete a local topology;
- label fields or lower-dimensional cells;
- identify an invalid construction;
- determine phases at a point;
- trace a cooling path;
- apply the lever rule;
- construct a full diagram restricted to one concept;
- complete a ternary compatibility or projection step.

## 4. Binary concept catalogue

The mature Practice library includes at least:

### Coordinates and fields

- reading composition and temperature axes;
- phase inventory and assemblage notation;
- one-phase and two-phase fields;
- lower-dimensional compound and invariant cells;
- Gibbs phase-rule dimensional intuition where applicable.

### Boundaries and tie lines

- liquidus;
- solidus;
- solvus;
- tie-line endpoints;
- phase identification at a coordinate;
- phase fractions and lever rule;
- invalid adjacency recognition.

### Solubility families

- complete solid solubility;
- limited terminal solid solubility;
- terminal and intermediate phases;
- solid-state miscibility gaps when enabled.

### Invariant reactions

- eutectic;
- peritectic;
- eutectoid;
- peritectoid;
- additional binary invariant families only after their formal-rules version enables them.

### Compounds and transformations

- stoichiometric line compounds;
- congruent melting;
- incongruent melting;
- polymorphic transformations;
- multiple intermediate phases.

### Paths and interpretation

- cooling and heating paths;
- first solid and last liquid;
- invariant arrest interpretation;
- microconstituent sequence where included in the scientific scope;
- completing a diagram from mixed numerical and observational instructions.

### Error identification

- crossings;
- illegal terminations;
- wrong dimensional labels;
- impossible invariant ordering;
- illegal phase adjacency;
- incomplete decomposition;
- incorrect unary edges.

## 5. Ternary concept catalogue

The mature Practice library includes:

- ternary composition coordinates;
- binary joins and sections;
- subsolidus compatibility triangles;
- primary crystallisation fields;
- liquidus projections;
- cotectic boundaries;
- Alkemade joins and related temperature maxima;
- direction of falling temperature;
- ternary eutectic and peritectic invariant points;
- isothermal sections;
- liquid and solid assemblages along cooling paths;
- crystallisation paths and boundary following;
- invalid compatibility and topology recognition.

## 6. Feedback model

Practice may provide:

- immediate local correctness;
- a rule identifier;
- a concise explanation;
- a direct Notes link;
- step reset;
- show answer after an explicit request.

Feedback should explain the governing rule rather than merely announce a wrong answer.

## 7. Relationship to Main Game

Practice and Main Game use the same domain objects, formal validators, instruction types, and rendering primitives. Practice differs in task scope, feedback, and scoring, not in scientific truth.

A concept is not complete in the product until it has:

- at least one Practice generator;
- Notes coverage;
- validator tests;
- a path to use in a full Main Game puzzle where appropriate.

---

# Notes Reference Manual Specification

## 1. Purpose

Notes is a concise reference manual of definitions for every invariant, rule, object, and procedure supported by Tie-Line.

It is not a linear course and does not require completion.

## 2. Organisation

Notes supports:

- alphabetical index;
- scientific category index;
- search by term, symbol, and reaction;
- cross-links between related concepts;
- stable entry IDs for links from Practice and validation results;
- binary and ternary sections;
- formal-rule index.

## 3. Entry structure

Each entry contains only fields relevant to that concept:

1. **Name and aliases**
2. **Definition**
3. **Notation or reaction equation**
4. **Minimal schematic**
5. **How to recognise it geometrically**
6. **Dimensional or adjacency rule**
7. **Heating and cooling interpretation where relevant**
8. **Common confusion**
9. **Related entries**
10. **Formal rule references**

Entries should be brief at first view, with deeper formal detail expandable below.

## 4. Required binary entries

At minimum, the mature manual contains entries for:

- component;
- phase;
- phase assemblage;
- phase field;
- temperature-composition diagram;
- unary edge;
- liquidus;
- solidus;
- solvus;
- tie line;
- lever rule;
- terminal solid solution;
- intermediate phase;
- stoichiometric line compound;
- invariant reaction;
- eutectic;
- peritectic;
- eutectoid;
- peritectoid;
- congruent melting;
- incongruent melting;
- polymorphism;
- complete solid solubility;
- limited solid solubility;
- liquid or solid immiscibility when supported;
- cooling path;
- phase-composition locus;
- ordinary interface;
- invariant horizontal;
- congruent point;
- canonical topology;
- every active formal-rule family and rule ID.

## 5. Required ternary entries

At minimum:

- ternary composition triangle;
- barycentric composition;
- binary join;
- isopleth or section;
- compatibility triangle;
- primary crystallisation field;
- liquidus projection;
- cotectic;
- boundary line;
- Alkemade line and theorem;
- back-tangent rule where included;
- direction of falling temperature;
- ternary invariant point;
- ternary eutectic;
- ternary peritectic;
- isothermal section;
- crystallisation path;
- liquid path;
- final solid assemblage.

## 6. Formal rules

Every active formal rule must have a human-readable Notes entry or be grouped into a clearly named rule-family entry. The reference manual may show formal rule IDs, but the primary heading uses ordinary materials-science language.

## 7. Linking from the game

- Practice may link directly to a definition.
- A failed submission may link to a broad relevant definition only when doing so does not expose the answer.
- Revealed-solution comparison may link to all involved concepts.
- Main Game never forces Notes open.

## 8. Source basis

The supplied MATS2008 notes provide the initial taxonomy and schematic reference for binary classification, invariant reactions, compounds, real binary examples, ternary compatibility triangles, invariant points, isothermal sections, and crystallisation paths.

The manual should supplement this with authoritative scientific sources and formal review before publication. Notes content is not generated at runtime.

## 9. Content versioning

Each entry records:

- content version;
- associated formal-rules versions;
- review status;
- source references;
- related generator features.

A scientific feature cannot be marked supported while its defining Notes entry is missing.

---

# Statistics and Streaks Specification

## 1. Purpose

Statistics record play without affecting puzzle generation, scientific rules, or difficulty classification.

## 2. Required statistics

The Statistics page includes:

- current daily streak;
- longest daily streak;
- total scored puzzles solved;
- solved puzzles by difficulty;
- total scored attempts;
- successful and unsuccessful attempts;
- completion time for each solved puzzle;
- average completion time;
- best completion time;
- no-error solves;
- no-error solve rate;
- recent puzzle history.

Useful additional breakdowns may include assisted versus unassisted local checking and binary versus ternary family when those fields exist.

## 3. Timer

The visible timer measures active scored puzzle time.

It starts when the active puzzle is presented and ready for interaction. It pauses while the application is backgrounded, suspended, or outside the active Main Game board. It continues after the first and second incorrect submissions. It stops on:

- successful submission;
- third incorrect submission;
- abandonment.

Unscored continuation may use a separate exploratory timer but cannot alter the recorded scored time.

## 4. Daily streak

A local calendar day qualifies when at least one scored Main Game puzzle is solved during that day.

The following do not qualify:

- Practice completion;
- failed scored attempt;
- unscored continuation solve;
- revealed solution;
- viewing Notes;
- completing only an onboarding interaction without an accepted scored puzzle, unless the onboarding puzzle is explicitly recorded as scored.

One failure does not break a day if another puzzle is solved before the local day ends.

## 5. No-error solve

A no-error solve is accepted on the first scored submission without solution reveal. Store whether local invalidity checking was enabled as separate metadata.

## 6. Puzzle history record

Each scored attempt records:

- puzzle identity and seed tuple;
- difficulty and difficulty-ruleset version;
- diagram family;
- start and end timestamps;
- active duration;
- submission count;
- outcome;
- no-error status;
- local-invalidity-check setting;
- whether continued unscored;
- whether solution revealed;
- generator and formal-rules versions.

Player geometry history is not required for ordinary statistics and should not be retained indefinitely by default.

## 7. Privacy and persistence

The initial product should be local-first. Statistics and current puzzles persist on the device without requiring an account. A future optional account or sync layer may replicate the same versioned records but must not be required for play.

## 8. No adaptive use

Statistics are never used automatically to:

- reclassify a puzzle;
- alter difficulty rules;
- hide or unlock modes;
- personalise scientific content;
- change the number of submissions;
- modify the generator distribution.

---

# Scientific Coverage and Content Taxonomy

## 1. Purpose

This document defines the intended scientific destination and separates it from the currently binding restricted grammar.

The Formal Rules v0.2 binary scope remains authoritative for the first implementation. The mature product expands through explicit new formal-rules versions rather than by treating all phase diagrams as already supported.

## 2. Initial binding binary grammar

Formal Rules v0.2 currently supports:

- constant-pressure binary temperature-composition diagrams;
- liquid;
- terminal solid-solution phases with restricted ranges;
- stoichiometric intermediate line compounds;
- eutectic;
- eutectoid;
- peritectic;
- peritectoid;
- congruent melting;
- incongruent melting;
- ordinary liquidus, solidus, and solvus interfaces;
- canonical labelled topological verification.

## 3. Mature binary coverage target

The end product aims to support the principal construction and interpretation families represented in the supplied notes, subject to formalisation and validation:

- complete solid solubility;
- limited terminal solid solubility;
- one or multiple intermediate phases;
- stoichiometric compounds;
- congruent and incongruent melting;
- polymorphic transformations;
- eutectic and eutectoid reactions;
- peritectic and peritectoid reactions;
- liquid and solid immiscibility families;
- additional binary invariant archetypes where their topology can be formally represented;
- tie lines and phase fractions;
- cooling and heating paths;
- phase presence at specified conditions;
- error identification and diagram completion.

Each added family requires a new formal-rules version and the full support chain described in the generator specification.

## 4. Mature ternary coverage target

The end product aims to support:

- ternary composition and barycentric coordinates;
- binary edges and joins;
- subsolidus compatibility triangles;
- stoichiometric compounds in a ternary system;
- primary crystallisation fields;
- liquidus projections;
- cotectic boundary networks;
- Alkemade relationships;
- temperature maxima and directions along boundaries;
- ternary eutectic and peritectic invariant points;
- isothermal sections;
- phase assemblage determination;
- liquid and crystallisation paths;
- final solid compatibility;
- generated full-diagram and focused Practice tasks.

Ternary rules in the existing v0.2 notes are non-binding design material until rewritten as a complete formal grammar.

## 5. Real systems

Main Game uses fictional abstract systems. Real systems serve four other purposes:

- scientific golden tests;
- regression examples;
- Notes illustrations;
- curated Practice or special puzzles.

The supplied notes already contain real binary examples suitable for an initial reference set, including complete-solubility, eutectic, peritectic, compound, and Fe–C-style multi-reaction examples. The exact source diagram and interpretation must be reviewed before it becomes an executable golden fixture.

Before freezing ternary generation, add a small set of complete authoritative ternary examples showing compatibility triangles, liquidus projections, cotectic directions, invariant points, and isothermal sections together.

## 6. Scientific claims boundary

Passing Tie-Line's formal rules means a diagram is legal within the supported game grammar. It does not by itself prove that a fictional system corresponds to a globally consistent set of Gibbs-energy functions or an experimentally real material system.

This limitation should be documented for contributors but need not interrupt ordinary play.

## 7. Content completion definition

A concept is fully supported only when all are present:

- formal definition;
- canonical data model;
- generator production or eligible composition rule;
- instruction types;
- validator;
- uniqueness method;
- deterministic difficulty features;
- Main Game eligibility where appropriate;
- Practice exercises;
- Notes entry;
- automated fixtures;
- scientific review.

## 8. Reference notes mapping

The supplied MATS2008 notes provide:

- ternary construction procedures and compatibility reasoning on pages 1–2;
- binary classification and invariant-reaction schematics on pages 4–12;
- real binary example diagrams on pages 13–17.

They are included in the project package under `references/` as a design and validation source, not as executable rules by themselves.

---

# Architecture Evolution Plan

## 1. Objective

The MVP may be narrow, but its code should preserve the path to procedural generation, multiple scientific grammars, Practice, Notes, statistics, and ternary diagrams.

This does not justify prematurely building every future subsystem. It does require stable boundaries and avoiding eutectic-specific assumptions in shared layers.

## 2. Target domain modules

```text
domain/
  grammar/
  topology/
  canonical/
  validation/
  instructions/
  difficulty/
  generation/
  geometry/
  puzzle-state/
  statistics/
```

UI code consumes these modules and does not define scientific truth.

## 3. Versioned contracts

Persist and serialize version identifiers for:

- puzzle schema;
- formal rules;
- generator;
- topology library;
- instruction language;
- difficulty ruleset;
- statistics schema.

Migrations must be explicit. A saved puzzle must retain the versions needed to verify it.

## 4. Generalised phase and object inventory

Do not restrict shared schemas to `L`, `alpha`, and `beta` or to one invariant horizontal.

The mature model must support:

- arbitrary declared abstract phase IDs;
- terminal phases;
- intermediate line compounds;
- future intermediate solution phases;
- multiple invariant events;
- phase-bearing cells of supported dimensions;
- binary and ternary coordinate domains;
- formal reaction objects;
- relationships used by instructions.

The current golden fixture may use narrow TypeScript literals only inside an MVP adapter, not in the long-term domain core.

## 5. Generator boundary

The generator produces a complete `GeneratedPuzzleBundle` containing:

```text
public puzzle definition
instruction set
hidden canonical solution
canonical hash
seed and version identity
difficulty feature vector
generation validation report
```

The editor never needs to know how the puzzle was generated.

## 6. Validator layers

Maintain separate layers for:

- syntactic editor constraints;
- structural well-formedness;
- scientific grammar legality;
- instruction satisfaction;
- puzzle completeness;
- canonical equivalence;
- uniqueness solving during generation.

The optional local-invalidity-check setting calls only checks that are sound for a partial construction. It must not call hidden-solution comparison as a hint mechanism.

## 7. Canonical representation

Canonicalisation operates on labelled semantic topology, not SVG paths. The canonical model must support graph isomorphism or stable normalisation across equivalent player drawings.

A canonical hash is required for:

- uniqueness proof;
- solution comparison;
- generator testing;
- reproducible puzzle reports.

## 8. Rendering boundary

Use separate renderers or renderer strategies for:

- binary rectangular diagrams;
- ternary triangular diagrams;
- Notes schematics;
- Practice partial tasks;
- solution comparison.

All render the same domain concepts where applicable.

## 9. Interaction actions

Represent edits as semantic commands, such as:

- place node;
- connect nodes with ordinary interface;
- create invariant object;
- create compound cell;
- assign phase token;
- remove phase token;
- delete object;
- move eligible anchor;
- adjust cosmetic geometry.

Commands support undo, persistence, replay in tests, and possible future sharing of constructions.

## 10. Application services

Separate services should own:

- active puzzle per difficulty;
- autosave and resume;
- timer state;
- submission budget;
- result recording;
- Practice session;
- Notes content index;
- Settings;
- statistics aggregation.

## 11. Persistence

Use local-first versioned storage. Separate:

- puzzle bundles;
- player construction states;
- settings;
- statistics records;
- Notes content cache.

A future sync layer should replicate these records rather than redefine them.

## 12. Platform stance

The product is touch-first, mobile-first, and desktop-compatible. A responsive web or cross-platform implementation is acceptable provided it supports precise semantic drawing, offline persistence, and the visual grammar.

Do not couple the scientific engine to browser DOM or a native canvas API.

## 13. MVP shortcuts that must remain temporary

The following are acceptable only behind narrow adapters:

- one hard-authored puzzle;
- one fixed phase inventory;
- one fixed invariant type;
- hidden-solution direct matcher;
- fixture-specific point-role unions;
- fixture-specific expected field witnesses;
- no generator;
- no uniqueness solver;
- no application menu.

## 14. Features not to build prematurely

The MVP agent should preserve seams but should not construct unused complexity such as:

- a general ternary solver;
- accounts and cloud sync;
- a full content-management system;
- adaptive difficulty;
- a CALPHAD backend;
- multiplayer or leaderboards.

---

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

---

# End-Product Decision Log

## Product identity

1. Product name is **Tie-Line**.
2. Tie-Line is a geometric phase-diagram deduction game.
3. The phase diagram is the board.
4. The active-board aesthetic is minimal and board-first, using Minesweeper: The Clean One as a UI-density reference.
5. The application opens directly into Main Game.

## Main Game

6. Main Game puzzles are procedurally generated.
7. Easy, Normal, and Advanced are always available.
8. Difficulties are modes and are never completed.
9. The player completes individual puzzles.
10. Main Game uses abstract component and phase labels.
11. Every puzzle has one canonical semantic solution and requires no guessing.
12. All instructions are shown from the start and remain available together.
13. User-facing terminology is **instructions**, not clues.
14. The visible timer runs during active play and is stored in statistics.
15. Each puzzle permits exactly three scored submissions.
16. Default Main Game provides no correctness checking before submission.
17. Settings may enable local invalidity checking.
18. Local checking may identify definite local violations but may not reveal the hidden solution.
19. A correct submission stops the timer and records the solve.
20. An incorrect first or second submission consumes one attempt and preserves editing.
21. An incorrect third submission ends the scored attempt and stops the timer.
22. After third failure, the player may continue unscored, reveal the solution, or generate a new puzzle.
23. Unscored completion does not count toward streaks or scored solves.
24. Generated puzzles use reproducible seeds plus version identifiers.

## Difficulty

25. Difficulty is determined only by versioned design rules based on puzzle structure and instruction semantics.
26. Difficulty never updates automatically from real-time or historical player performance data.
27. Known difficulty factors include invariant type, number of invariants, number of intermediate phases, congruent or incongruent behaviour, instruction form, and deduction depth.
28. Exact thresholds may be manually revised only through a new deterministic ruleset version.

## Application areas

29. The menu contains Main Game, Practice, Notes, Statistics, and Settings.
30. Main Game contains Easy, Normal, and Advanced.
31. Practice ultimately covers every supported concept.
32. Practice is generated, focused, unlimited in attempts, and separate from Main Game scoring.
33. Notes is a reference manual of definitions, invariants, rules, and procedures.
34. Statistics includes daily streaks, puzzles solved, completion time, and no-error solves.
35. Settings contains genuine interaction, display, accessibility, and local-check preferences rather than scientific rules.

## Interaction

36. Constrained semantic drawing is authoritative.
37. Raw freehand traces are not authoritative geometry.
38. The editor blocks malformed geometry but permits scientific mistakes.
39. Players may add declared phases to a target in any order.
40. Semantic assemblages are unordered distinct sets.
41. Duplicate phase tokens are ignored as input accidents.
42. Erase mode removes individual phase tokens or player-created geometry.
43. Cosmetic curve shape does not determine correctness.

## Science and content

44. Formal Rules v0.2 is the authoritative initial binary grammar.
45. Ternary content in v0.2 is non-binding until rewritten as a full formal grammar.
46. The supplied course notes are a primary taxonomy and validation source for binary and ternary coverage.
47. Real systems are used for regression, reference, and curated content rather than ordinary generated Main Game puzzles.
48. New concepts require formal rules, generation, instructions, validation, uniqueness, Practice, Notes, and tests.

## Architecture

49. Thermodynamic domain logic remains independent of the UI.
50. The generator starts from semantic topology rather than random rendered curves.
51. Puzzle identity includes seed and generator, grammar, instruction, topology-library, and difficulty versions.
52. Player statistics describe performance but do not govern generation or difficulty.

---

# Design-Owned Defaults and Deferred Implementation

This document records decisions that do not require further product-direction input. They may be refined during implementation without reopening the core product.

## 1. Generator approach

Default: template-driven semantic topology generation with parameter randomisation and solver-backed uniqueness verification.

Reason: unrestricted random constraints create avoidable ambiguity and make scientific coverage difficult to audit.

## 2. Coordinate input

Default: continuous-looking dragging over a hidden discrete semantic grid, with exact snapped values.

Reason: this preserves geometric feel while making generation, instructions, reproduction, and validation deterministic.

## 3. Active puzzles

Default: retain one resumable scored Main Game puzzle for each difficulty, with the most recently used difficulty opening on launch.

## 4. Instruction display

Default: all instructions in one complete sheet. It may collapse or overlay on mobile, but no instruction is withheld or revealed sequentially.

## 5. Submission feedback

Default without local checking: broad outcome only after failed submission—incorrect, incomplete, or malformed—plus attempts remaining. Do not identify the correct location or phase.

## 6. Result screen

Default: compact sheet over the solved board with time, submissions, no-error status, seed code, and Next puzzle.

## 7. Practice feedback

Default: immediate local feedback, unlimited attempts, optional answer reveal, and direct Notes link. Practice is untimed unless a future explicit timed-Practice setting is added.

## 8. Onboarding

Default: one authored interaction tutorial that visually resembles a normal Easy puzzle. Main Game becomes generated immediately afterward.

## 9. Ternary in difficulty v0.1

Default: all ternary Main Game puzzles are Advanced in the provisional v0.1 classifier. A later manually authored deterministic ruleset may classify simpler ternary puzzles differently without adding a separate top-level Main Game menu.

## 10. Platform and persistence

Default: touch-first, mobile-first, desktop-compatible, local-first, and offline-capable. Accounts and cloud sync remain optional future infrastructure.

## 11. Notes content

Default: authored and scientifically reviewed content stored as versioned structured entries. Do not generate definitions dynamically at runtime.

## 12. Theme and accessibility

Default: light and dark appearance, scalable symbols, reduced motion, sound and haptic controls, left-handed control placement, and colour-independent semantic distinctions.

## 13. Matters intentionally deferred

The following do not block end-product documentation or the MVP:

- monetisation;
- cloud provider;
- social sharing;
- leaderboards;
- classroom administration;
- user-authored puzzles;
- daily shared puzzle;
- exact sound design;
- exact visual theme colours;
- final native versus web packaging.

These may be added only when they preserve the Product Vision and Game Design Constitution.

---

# Relationship to the MVP

## 1. Purpose of the MVP

The MVP proves the core interaction and semantic verification loop on one simple binary puzzle. It is not a miniature definition of the whole product.

## 2. What the MVP should prove

- instruction-first anchor placement;
- constrained semantic drawing;
- phase-token labelling;
- structurally sound editing;
- semantic field extraction;
- canonical solution comparison for one fixture;
- three-submission lifecycle where included in the revised build;
- autosave and direct resume;
- minimal board-first presentation.

## 3. What the MVP may omit

- procedural generation;
- uniqueness solver;
- Easy/Normal/Advanced mode shell;
- full menu;
- Practice library;
- Notes manual;
- statistics page;
- multiple binary invariant types;
- compounds;
- ternary diagrams;
- accounts and cloud sync.

## 4. What the MVP must not hard-code into shared architecture

- exactly three phases;
- exactly one invariant;
- exactly seven points;
- exactly six fields;
- eutectic-only object types;
- a `clues` domain vocabulary as the permanent instruction model;
- hidden-solution pixel or curve comparison;
- one global active puzzle with no difficulty-ready storage model;
- submission count without an explicit lifecycle model;
- UI components containing thermodynamic rules.

## 5. Temporary validator

The MVP may compare a player's canonical construction against a hidden fixture because there is no generator or general uniqueness solver yet. This matcher is an adapter and must not become the mature validation architecture.

## 6. Source priority for an implementation agent

For the current build:

- end-product vision and constitution define what must be preserved;
- MVP Product Specification defines what must be implemented now;
- Formal Rules v0.2 defines scientific legality;
- acceptance tests define completion.

When an end-product feature is absent from MVP scope, preserve an extension seam rather than implementing it speculatively.

## 7. Migration items from MVP v2

The integrated project package should migrate the following previous assumptions:

- replace user-facing “clue” terminology with “instruction”;
- remove a default pre-submit Check action from Main Game;
- use three scored submissions;
- show a visible active timer;
- treat local invalidity checking as an optional setting, off by default;
- retain fixed or partial starting geometry only for tutorial variants;
- keep the golden puzzle as an implementation fixture rather than a model of the full game.

---

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


# Part II — MVP Implementation Handoff

---

# Master Build Prompt

Build the **Tie-Line MVP** described in this repository.

Read every document in the source-of-truth order in `README.md` before changing code. Treat `docs/01_FORMAL_RULES_v0.2.md` as the authoritative scientific grammar and the remaining documents as binding product and implementation requirements.

## Product objective

Create a polished, mobile-first, one-screen logic puzzle in which the player reconstructs a simple binary eutectic phase diagram from compact numerical instructions.

The player must place anchors, draw constrained geometry, and label phase-bearing regions. The game judges phase-diagram reasoning, not drawing precision.

The active screen must be minimal and board-first. Do not build an educational dashboard.

## Required technology

Use:

- React
- TypeScript with strict type checking
- Vite
- SVG for the board
- Vitest for unit and domain tests
- Playwright for critical interaction tests

Use no backend. Persist progress locally. Keep dependencies small.

## Critical behaviour

1. The app opens directly into the current puzzle.
2. The board occupies nearly the full viewport.
3. A compact instruction strip displays only symbolic facts needed for construction.
4. The player places locked-to-grid semantic anchors from those instructions.
5. Anchor placement is constrained to valid object classes, but the editor must permit scientifically wrong locations where the instruction does not syntactically forbid them.
6. Curve and Horizontal gestures create clean semantic objects.
7. The editor blocks malformed geometry but permits scientifically wrong geometry.
8. The phase inventory is `L`, `α`, and `β`.
9. A player may add zero, one, two, or all three phases to any phase-bearing target.
10. The UI preserves insertion order, while validation treats assemblages as unordered sets.
11. Duplicate phase tokens on one target are ignored.
12. Erase mode removes one selected phase token or one player-created object.
13. The UI must not reveal scientific correctness through endpoint filtering, line style, field colour, or phase-count restrictions.
14. Main Game provides no correctness checking before submission by default.
15. The puzzle permits three scored submissions.
16. Optional local invalidity checking is a Settings preference, off by default, and may report only definite local contradictions.
17. Curve shape is cosmetic after endpoint incidence, monotonicity, and planar legality are established.
18. The solution is checked semantically, not by pixels or Bézier control points.
19. The solved state removes editing affordances and leaves a clean diagram.

## Interaction modes

Required modes:

- Point
- Curve
- Horizontal
- Label
- Select
- Erase

Undo is a persistent action. Other controls may be hidden in a compact overflow control.

## Explicit non-goals

Do not implement:

- procedural puzzle generation;
- uniqueness solving;
- solver-backed hints;
- line compounds;
- peritectic, eutectoid, or peritectoid gameplay;
- ternary diagrams;
- accounts, leaderboards, cloud saves, or a backend;
- persistent dashboard panels;
- competitive scoring;
- long instructional copy on the play screen;
- automatic boundary-type labels before solving.

## Architecture expectations

Keep separate modules for:

- domain schema;
- coordinate and instruction interpretation;
- planar geometry;
- face extraction;
- player state and history;
- validation;
- SVG rendering and input;
- persistence.

Do not place thermodynamic logic in React components.

## Working method

Implement tasks in `docs/11_AGENT_BUILD_PLAN.md` order.

For every work package:

1. Add tests first where practical.
2. Keep changes scoped.
3. Run type checking and relevant tests.
4. Record spec ambiguities rather than making hidden decisions.
5. Test at 320 px mobile width and a desktop viewport.
6. Preserve the no-dashboard requirement.

## Definition of done

The build is complete only when all required acceptance tests pass and the golden puzzle can be solved through the intended instruction-first flow on desktop and mobile.

## End-product context

Before implementation, read `../end-product/00_NORTH_STAR_AND_DOCUMENT_HIERARCHY.md`, `01_PRODUCT_VISION.md`, `02_GAME_DESIGN_CONSTITUTION.md`, and `17_RELATIONSHIP_TO_MVP.md`.

The MVP is a narrow proof of the editor and semantic validation loop. Do not hard-code shared architecture around one eutectic fixture. User-facing puzzle facts are **instructions**. Default Main Game has no pre-submit correctness check, uses a visible active timer, and permits three scored submissions; optional local invalidity checking is off by default.

---

# Tie-Line Formal Rules v0.2

**Status:** Authoritative restricted game grammar. Binary rules are binding. Ternary rules are non-binding Phase 2 notes.

## Purpose

This document defines game-legal diagrams within the restricted Tie-Line grammar.

It serves as:

1. validator specification for generated diagrams;
2. win-condition specification for player constructions;
3. constraint foundation for future uniqueness checking;
4. test oracle for valid and invalid fixtures.

Passing these rules establishes game legality within this restricted grammar. It does not prove that a fictional diagram is experimentally realisable or derivable from a globally consistent Gibbs-energy model.

## Binding binary scope

Binary temperature-composition diagrams at constant pressure.

Supported phases:

- liquid `L`;
- terminal solid-solution phases with restricted composition ranges;
- intermediate stoichiometric line compounds;
- one solid phase for each pure component.

Supported invariant reactions:

- eutectic;
- eutectoid;
- peritectic;
- peritectoid.

Supported intermediate-compound behaviour:

- congruent melting;
- incongruent melting.

Intermediate solid solutions, liquid immiscibility, critical points, extensive unary allotropy, metastable extensions, and pressure variation are excluded.

## Terminology

`Cell` is the formal data-model term for a connected phase-bearing region of dimension 0, 1, or 2.

Classroom equivalents:

- a 2-D cell is an ordinary phase field;
- a 1-D three-phase cell is an invariant horizontal;
- a 1-D one-phase cell is a line compound;
- a phase-bearing 0-D cell may represent a congruent melting equilibrium.

The user interface may use classroom language. The validator uses the formal model.

# Part 0: Object model

## 0.1 Diagram domain

The diagram occupies:

\[
D=[0,1]\times[T_{\min},T_{\max}]
\]

where `x = 0` is pure component A and `x = 1` is pure component B.

The diagram is represented as a stratified planar cell complex containing phase-bearing cells, non-phase-bearing interfaces, and structural nodes.

## 0.2 Phase

A phase is:

- `L`;
- a terminal solid phase such as `α` or `β`;
- an intermediate stoichiometric phase such as `γ`, `AB`, or `A2B`.

Each line compound `φ` has a fixed composition `x_φ`.

## 0.3 Phase assemblage

An assemblage is an unordered set of distinct phases.

Examples:

- `{L}`
- `{α}`
- `{L, α}`
- `{α, β}`
- `{L, α, β}`

User insertion order may be preserved visually, but semantic comparison uses set equality.

## 0.4 Two-dimensional phase cell

A 2-cell is a connected open region with positive area carrying one or two phases.

Permitted labels:

- one-phase fields such as `{L}`, `{α}`, and `{β}`;
- two-phase fields such as `{L, α}` and `{α, β}`.

A binary diagram contains no 2-D three-phase field.

## 0.5 One-dimensional phase-bearing cell

Two kinds are supported.

### Compound cell

A vertical cell at fixed composition `x_φ`, labelled `{φ}`. It represents a stoichiometric phase with zero homogeneity range.

### Invariant cell

A horizontal cell at fixed temperature `T*`, labelled by three distinct phases. It represents binary three-phase equilibrium over a range of overall compositions.

## 0.6 Ordinary interface

An ordinary interface is a non-phase-bearing 1-D separator between incident 2-cells.

Its semantic type is derived from the assemblages on its two sides. Liquidus, solidus, and solvus curves are ordinary interfaces.

## 0.7 Node

A node is a 0-D structural point at which cells or interfaces terminate, meet, or are segmented.

Roles include:

- frame intersection;
- curve endpoint;
- temperature extremum;
- invariant phase-composition point;
- congruent melting point;
- compound endpoint;
- structural subdivision point.

A node records all incident cells and interfaces. It does not need one exclusive assemblage label.

## 0.8 Congruent point

A congruent melting equilibrium may be represented as a phase-bearing 0-cell carrying `{L, φ}` at `x = x_φ`.

## 0.9 Phase-composition locus

A phase-composition locus gives the equilibrium composition of a phase at a temperature. It may be:

- a solidus branch;
- a solvus branch;
- a liquidus branch for `L`;
- a compound cell;
- a pure-component frame edge;
- a marked phase-composition node on an invariant cell.

## 0.10 Regular temperature and temperature band

An event temperature is the temperature of any invariant cell, curve extremum, endpoint, horizontal frame intersection, or other structural singularity.

A regular temperature band is an open interval between consecutive event temperatures. Within one band, interfaces do not cross or change incidence. One representative horizontal slice therefore determines the left-to-right ordering for that band.

# Part P: Puzzle specification

## P1. Phase inventory

Every puzzle declares all permitted phases, their kinds, their display labels, and fixed compositions where applicable.

## P2. Permitted semantic elements

Every puzzle declares permitted phase labels, compound cells, invariant reaction types, node types, coordinate anchors, structural cardinalities, and incidence patterns.

The UI palette and validator derive from the same puzzle specification.

## P3. Locked elements

Every revealed element is marked locked. Locked properties may include coordinates, labels, endpoints, reaction types, and incidences.

## P4. Required elements

The puzzle declares all phases, cells, reactions, anchors, and relationships that must appear in the completed canonical construction.

## P5. Geometry constraints

The puzzle may specify grid resolution, permitted node coordinates, locked endpoints, exact horizontal or vertical objects, and other semantic geometry constraints. Cosmetic curve shape is excluded unless explicitly declared.

# Part S: Structural well-formedness

S-rules run first. Any S failure produces `malformed` and suppresses downstream scientific checks.

## S1. Planar embedding

Cells and interfaces may intersect only through declared shared nodes or shared lower-dimensional cells. Ordinary interfaces may not cross.

## S2. Complete domain decomposition

The closures of all 2-cells, together with their lower-dimensional boundaries and the diagram frame, cover the rectangle exactly. There is no overlap of 2-cell interiors and no uncovered area.

## S3. Closed 2-cells

Every 2-cell has a closed boundary cycle composed of interfaces, phase-bearing lower-dimensional cells, frame segments, and nodes.

## S4. Connected construction

Every non-frame element connects through incidence relationships to the frame. Floating islands are illegal.

## S5. Segment monotonicity

Every ordinary curved interface segment between consecutive structural nodes is single-valued as `x(T)`. Every temperature maximum or minimum is represented by a node dividing the curve into monotone segments.

## S6. Invariant horizontality

Every invariant cell has exactly constant temperature.

## S7. Compound verticality

Every compound cell remains at exactly its declared composition.

## S8. Dimension-label compatibility

- 2-cells carry one or two phases.
- compound cells carry one stoichiometric solid phase.
- invariant cells carry three distinct phases.
- ordinary interfaces carry no assemblage.
- congruent phase-bearing 0-cells carry `{L, φ}`.

## S9. Positive-area fields

Every 2-cell has positive area. Zero-width one-phase regions are compound cells rather than 2-cells.

## S10. Unary-edge structure

The left and right frame edges reproduce the declared pure-component unary sequences.

# Part F: Phase-field and tie-line rules

## F1. Binary tie-line rule

At every regular temperature intersecting a two-phase cell `{φ, ψ}`, the horizontal intersection is one interval. Its endpoints lie on the equilibrium composition loci of `φ` and `ψ`, one at each end.

## F2. Ordered phase compositions

Within a connected two-phase cell, the two phase-composition loci never cross.

## F3. Overall-composition containment

Every overall composition inside a two-phase field lies strictly between the two equilibrium phase compositions at that temperature.

## F4. Upper liquid field

Every 2-cell incident to the open upper frame is labelled `{L}`. Under the binding grammar these incidences belong to one connected liquid field.

## F5. Terminal one-phase fields

A terminal phase with a finite composition range occupies a genuine 2-cell adjacent to its unary edge.

## F6. Line compounds

An intermediate stoichiometric phase with zero homogeneity range is represented as a vertical compound cell, not a 2-cell.

## F7. Label continuity

One connected 2-cell carries one assemblage over its entire area. Disconnected regions with the same assemblage are separate cells.

# Part A: Ordinary-interface adjacency rules

## A1. Exhaustive adjacency table

| Incident assemblages | Derived interface type |
|---|---|
| `{L}` and `{L, φ}` | liquidus |
| `{φ}` and `{L, φ}` | solidus |
| `{φ}` and `{φ, ψ}`, both solid | solvus |
| anything else | illegal unless mediated by a phase-bearing lower-dimensional cell |

## A2. One-phase-change rule

Crossing an ordinary interface adds or removes exactly one phase.

## A3. Two-phase to different two-phase prohibition

An ordinary interface may not directly separate `{φ, ψ}` and `{φ, χ}` where `ψ != χ`. A lower-dimensional three-phase equilibrium must mediate the transition.

## A4. Distinct one-phase prohibition

Two distinct one-phase 2-cells may not share an ordinary interface without an intervening legal two-phase or lower-dimensional equilibrium structure.

## A5. Derived typing

Any stored interface type must equal the type derived from incident assemblages. Validation never trusts a player-supplied type label.

## A6. Legal endpoints

An ordinary interface may terminate only at the frame, an invariant node, a congruent point, or another permitted structural node.

## A7. Nonredundancy

An ordinary interface separates distinct cells with different assemblages. A decorative line splitting one assemblage into two identical fields is illegal.

# Part U: Unary-edge rules

## U1. Pure-component edges

The left edge is pure A and the right edge is pure B. Under v0.2 each follows one solid phase, one melting equilibrium, then liquid.

## U2. Edge phase identity

Only phases permitted by the unary specification may occupy or contact a pure-component edge as one-phase fields.

## U3. Unary melting termination

Liquidus and solidus branches for a pure component terminate at its declared melting point.

## U4. No undeclared allotropy

Additional solid-solid unary transformations are illegal unless a later puzzle grammar explicitly enables them.

# Part I: Invariant reaction rules

## I1. Three-phase assemblage

Every invariant object contains exactly three distinct phases with compositions:

\[
x_{left} < x_{mid} < x_{right}
\]

## I2. Invariant span

The horizontal three-phase cell spans exactly from the left outer phase composition to the right outer phase composition.

At an outer endpoint, the overall composition equals the corresponding outer phase composition and the amounts of the other invariant phases approach zero. The endpoint node records all incident cells and loci.

## I3. Geometric realisation

Each of the three phase compositions is represented by a marked node on the corresponding phase-composition locus.

## I4. Middle-phase rule

Let `M` be the phase at `x_mid`.

If `M` is stable immediately above `T*`, cooling gives:

\[
M \rightarrow P_{left} + P_{right}
\]

- `M = L`: eutectic.
- `M` solid: eutectoid.

If `M` is stable immediately below `T*`, cooling gives:

\[
P_{left} + P_{right} \rightarrow M
\]

- one outer phase is `L`: peritectic.
- both outer phases are solid: peritectoid.

## I5. Decomposition template

For `M -> P_left + P_right`:

Immediately above:

- `(x_left, x_mid)` is `{P_left, M}`;
- `(x_mid, x_right)` is `{M, P_right}`;
- the one-phase locus of `M` reaches the interior node from above.

Immediately below:

- the full open span is `{P_left, P_right}`.

## I6. Formation template

For `P_left + P_right -> M`:

Immediately above:

- the full open span is `{P_left, P_right}`.

Immediately below:

- `(x_left, x_mid)` is `{P_left, M}`;
- `(x_mid, x_right)` is `{M, P_right}`;
- the one-phase locus of `M` leaves the interior node downward.

## I7. Phase-locus continuity

Every participating phase has a legal stable continuation on the side required by its reaction template.

## I8. Temperature-order consistency

A phase consumed on cooling is stable immediately above the reaction. A phase produced on cooling is stable immediately below the reaction. No invariant may reference a phase absent from both adjacent temperature intervals.

## I9. No overlapping undeclared invariants

Distinct invariant objects may not share one temperature and overlapping composition spans unless a later grammar explicitly enables a coupled construction.

# Part C: Stoichiometric compound rules

## C1. Fixed composition

Every intermediate stoichiometric phase is a vertical compound cell at its declared composition.

## C2. Stability span

The cell extends through every temperature interval in which the one-phase compound is stable.

## C3. Congruent melting

For congruent melting:

- the compound cell ends at a phase-bearing 0-cell `{L, φ}` at `x_φ`;
- left and right liquidus branches meet there;
- their union has a local temperature maximum at `x_φ`;
- immediately below the point, both incident 2-cells are `{L, φ}`;
- immediately above, the incident 2-cell is `{L}`.

The vertical compound cell is not required to share a tangent with the liquidus branches.

## C4. Incongruent melting

For incongruent melting:

- the compound cell ends from below at a peritectic invariant;
- the compound is the middle-composition phase;
- no congruent liquidus maximum occurs at its composition.

## C5. Lower termination

The lower end reaches `T_min` or terminates at a supported invariant reaction according to its reaction template.

## C6. Incident fields

Every 2-cell incident to a compound cell contains the compound phase in its assemblage.

## C7. No ordinary-interface misclassification

A compound cell is phase-bearing and is never reclassified as liquidus, solidus, or solvus.

# Part G: Global completeness and inventory

## G1. Declared phase inventory

Every phase used in any assemblage belongs to the puzzle inventory.

## G2. Candidate consistency

The UI candidates and validator inventory come from the same puzzle specification.

## G3. Required phase occurrence

Every required phase appears in at least one legal phase-bearing cell.

## G4. Explicit permitted structure

The completed canonical graph satisfies the cardinality, template, incidence, and anchor constraints in the puzzle's `permittedStructure` specification.

## G5. Required semantic structure

Every cell, reaction, incidence relationship, and numerical anchor marked required appears in the completed canonical graph.

## G6. No undeclared structure

The construction introduces no undeclared phase, compound, invariant type, unary transformation, or special point.

## G7. No redundant geometry

Every non-frame geometric object either constitutes a required phase-bearing cell, separates legally distinct cells, segments a curve at a required structural node, or realises a locked feature.

## G8. Complete reaction incidence

Every invariant reaction includes all cells, loci, nodes, and branches required by its template.

# Part E: Canonical equivalence and uniqueness

## E1. Canonical graph

A completed construction canonicalises to:

- phase inventory;
- cell set with dimensions and assemblages;
- interface and node incidence;
- invariant reaction types and ordering;
- interface endpoint incidences;
- left-to-right cell and locus ordering in each regular temperature band;
- locked semantic coordinates and anchors;
- declared geometry constraints.

## E2. Cosmetic geometry

Unless constrained, these do not affect identity:

- curve control points;
- exact curvature;
- rendering style;
- sampling density;
- small deformations preserving topology, monotonicity, incidence, and ordering.

## E3. Semantic geometry

These remain significant where declared:

- invariant temperatures;
- compound compositions;
- unary melting points;
- endpoint coordinates;
- extrema;
- locked grid positions;
- node and cell ordering.

## E4. Completion hash

`completionHash` hashes the canonical graph rather than rendered paths.

## E5. Unique completion

A generated puzzle is publishable only if exactly one canonical legal completion satisfies all instructions, permitted elements, coordinate constraints, and applicable rules.

Cosmetically different drawings of one canonical topology are one solution.

# Part V: Verifier behaviour

## V1. Verification order

1. S rules.
2. Puzzle inventory and locked-element checks.
3. F and A rules.
4. U rules.
5. I rules.
6. C rules.
7. G rules.
8. Canonical puzzle-completion checks.

## V2. Completed-construction verdicts

- `win`: all rules pass, all required structure is present, and all locked elements are preserved.
- `legal_but_incomplete`: present completed structures are legal but required structure is absent.
- `illegal`: structurally interpretable but violates scientific or puzzle rules.
- `malformed`: cannot be interpreted as a valid cell complex.

## V3. Rules-based checking

The verifier does not compare rendered pixels or freehand paths with a stored drawing. It checks semantic geometry, topology, labels, and required structure.

## V4. Error reporting

Report the lowest-numbered violated rule per offending element in the earliest applicable rule group. Highlight affected cells, interfaces, or nodes. S failures suppress downstream diagnostics.

## V5. Locked elements

Moving, deleting, relabelling, or replacing a locked element is a puzzle-specification failure.

## V6. Exact semantic coordinates

Snapped semantic coordinates use exact logical equality. Screen-space rendering tolerance may not change topology.

## V7. Partial checking

Without a completion solver, partial checking may report only definite contradictions in structures already present. Missing elements remain unresolved. It must not claim global repairability or uniqueness.

## V8. Future solver semantics

A solver-backed partial state may later be classified as contradicted, consistent, forced, or unresolved depending on the set of permitted legal completions.

# Part X: Exclusions

- X1. Intermediate solid solutions.
- X2. Liquid immiscibility, including monotectic and syntectic reactions.
- X3. Metatectic and other unsupported invariant reactions.
- X4. Retrograde solubility in generated puzzles.
- X5. Solvus critical points.
- X6. Multiple unary allotropes unless a later grammar enables them.
- X7. Pressure-dependent diagrams.
- X8. Metastable extensions and kinetic phase selection.
- X9. Proof of thermodynamic realisability.

# Part T: Ternary liquidus projections, non-binding Phase 2 draft

Part T applies only to a deliberately restricted grammar of ternary liquidus projections with stoichiometric solids, no liquid immiscibility, no overlapping invariant structures, and controlled cotectic segments.

## T1. Primary fields

Each primary field is labelled by the first solid phase to crystallise. Liquid is implicit.

## T2. Cotectic adjacency

A boundary between primary fields `α` and `β` is an `α-β` cotectic carrying `L + α + β` equilibrium.

## T3. Alkemade joins

For supported phase pairs, the diagram includes the straight composition join between the two solid compositions. The puzzle specification declares permitted compatibility pairs.

## T4. Temperature direction

Within the restricted grammar, the intersection of a cotectic and its Alkemade join, allowing extension of either, is the cotectic temperature maximum. Down-temperature arrows point away from the intersection.

## T5. Segment character

Cotectics are stored as analytic or topological segments of uniform coprecipitation or resorption character. A character change requires an explicit node.

## T6. Compatibility graph

Permitted joins form a non-crossing compatibility graph. In simple supported systems they partition the triangle into compatibility triangles.

## T7. Invariant record

A ternary invariant stores phases, liquid position relative to the solid compatibility triangle, incident branches, arrow directions, and reactant and product sets. Display classification is derived from this full record.

## T8. Binary edge references

Each triangle edge references a separately valid binary subsystem. The liquidus projection edge contains projected binary liquidus events and ordering, not the complete binary temperature-composition diagram.

# Required scientific test strategy

Before expanding beyond the MVP:

1. Maintain one authoritative valid example for every supported topology.
2. Maintain at least one near-miss designed to violate each rule.
3. Test canonical equivalence across differently shaped drawings of one topology.
4. Test ambiguous puzzle fixtures against the future uniqueness solver.
5. Verify all invariant templates against authoritative teaching examples and domain review.

---

# Tie-Line MVP Product Specification

## 1. Product thesis

Tie-Line is a logic game in which the player reconstructs a phase diagram from facts about a fictional material system.

The default puzzle begins with an almost empty temperature-composition board and a compact symbolic instruction set. The player places thermodynamic anchors, draws the topology, and labels phase-bearing objects.

The experience should feel closer to Minesweeper than to a conventional materials-science lesson.

## 2. Frozen MVP scope

The MVP contains one hand-authored binary simple-eutectic puzzle with limited terminal solid solubility.

The player must:

1. place seven anchors from numerical instructions;
2. draw six ordinary curved interfaces;
3. draw one invariant horizontal;
4. label six 2-D fields;
5. label the invariant horizontal;
6. submit the completed diagram.

Declared phases:

- `L`
- `α`
- `β`

Expected 2-D fields:

- `{L}`
- `{α}`
- `{β}`
- `{L, α}`
- `{L, β}`
- `{α, β}`

Expected invariant assemblage:

- `{L, α, β}`

## 3. Default starting state

Visible at puzzle start:

- empty diagram frame;
- temperature axis and composition axis;
- component labels `A` and `B`;
- compact instruction strip;
- visible active timer;
- three compact submission indicators;
- tiny tool controls;
- phase palette only when Label is active.

Not visible at puzzle start:

- anchor points;
- ordinary interfaces;
- invariant horizontal;
- field labels;
- boundary classifications;
- reaction name;
- solution geometry;
- instructions paragraph.

## 4. Golden instruction set

The first puzzle displays only concise notation:

```text
A 1000°
B 850°
E 700° · 40%B
α@E 10%B
β@E 80%B
α@0 0%B
β@0 100%B
```

Interpretation:

- pure A melts at 1000°C;
- pure B melts at 850°C;
- eutectic liquid composition is 40% B at 700°C;
- α composition at the eutectic is 10% B;
- β composition at the eutectic is 80% B;
- the low-temperature α and β solvus endpoints are at the pure-component ends.

The actual screen should use a more compact typeset version, not explanatory prose.

## 5. Core player loop

1. Inspect the instructions.
2. Select Point.
3. Place each instruction-defined anchor on the snapped board.
4. Select Curve or Horizontal.
5. Draw constrained connections.
6. Select Label.
7. Add phases to fields and the invariant horizontal.
8. Revise using Select, Erase, or Undo.
9. Submit, with three scored submissions available.
10. On success, see the clean solved diagram and result summary.
11. After a third failure, continue unscored, reveal, or begin a new puzzle.

## 6. Tool set

Persistent or quickly accessible modes:

- **Point**: place a semantic anchor.
- **Curve**: draw an ordinary constrained interface.
- **Horizontal**: draw an exact invariant horizontal.
- **Label**: apply phase tokens.
- **Select**: inspect or adjust one object.
- **Erase**: remove one phase token or one player-created object.

Undo is always available. Reset and settings live in a compact overflow control.

## 7. Anchor placement

The player chooses a instruction-defined anchor type, then taps or drags it onto the board.

Anchor classes in the golden puzzle:

- A melting point;
- B melting point;
- α composition at eutectic temperature;
- eutectic liquid point;
- β composition at eutectic temperature;
- low-temperature α solvus endpoint;
- low-temperature β solvus endpoint.

Placement rules:

- coordinates snap to the semantic grid;
- edge-constrained anchors remain on their required frame edge;
- invariant-temperature anchors snap to the stated temperature line;
- composition values snap to the stated composition;
- a placed anchor can be selected and moved until geometry depends on it;
- moving an incident anchor moves attached geometry or requires explicit confirmation;
- the UI must not place anchors automatically from the instructions.

Because the instruction itself gives exact coordinates, a conflicting coordinate is a direct instruction error. It is not shown before submission unless optional local invalidity checking is enabled.

## 8. Scientific error freedom

The editor must permit scientific mistakes.

The player may:

- place an anchor at an incorrect instruction coordinate;
- connect the wrong structurally compatible anchors;
- create the wrong field arrangement;
- label a 2-D field with zero, one, two, or three phases;
- label the invariant horizontal with any subset of phases;
- add phases in any order.

The editor prevents only malformed geometry and impossible input syntax.

## 9. Assemblage entry

The player may add a phase by:

- selecting a phase and tapping targets; or
- dragging a phase symbol onto a target.

Rules:

- insertion order is preserved visually;
- semantic comparison uses an unordered set;
- duplicates are ignored;
- empty targets are allowed during play;
- no phase-count restriction is enforced by the editor;
- Erase removes individual tokens.


## 10. Pre-submission checking

The default MVP play screen has no correctness Check action.

The editor blocks malformed gestures but does not report scientific correctness before submission. An optional local-invalidity-check preference may be implemented if it is clearly off by default and reports only definite local violations without comparing against the hidden full solution.


## 11. Submit

The puzzle permits three scored submissions.

- A correct submission stops the visible active timer and solves the puzzle.
- The first or second incorrect submission consumes one attempt, preserves the construction, and permits continued editing.
- The third incorrect submission ends the scored attempt and stops the timer.
- After third failure, the player may continue unscored or reveal the hidden fixture solution.

Submission feedback is broad by default and must not reveal answer geometry.

## 12. Solved state

When solved:

- editing handles and anchor affordances fade;
- geometry resolves to a uniform clean rendering;
- the complete diagram remains nearly full screen;
- a small next control appears;
- no score card or lesson modal interrupts the board.

A short optional explanation may be opened separately.

## 13. Tutorial mode

Tutorial puzzles may reveal some anchors or partial boundaries.

This is an onboarding variant only. It is not the default core Tie-Line experience.

## 14. Persistence

Autosave after every committed action.

Restore:

- placed anchors;
- geometry;
- phase labels and insertion order;
- viewport;
- elapsed active time;
- submissions remaining and scored status;
- solved or failed state.

## 15. Mobile-first requirements

The MVP works at 320 CSS pixels wide.

Required:

- large invisible hit targets;
- pinch zoom and two-finger pan;
- no page scroll during board gestures;
- compact bottom controls;
- transient instruction strip;
- no permanent feedback sheet;
- no surrounding dashboard.

## 16. Non-goals

Not included:

- multiple generated puzzles;
- procedural generation;
- uniqueness solver;
- line compounds;
- peritectic, eutectoid, or peritectoid gameplay;
- ternary diagrams;
- boundary-type labelling by the player;
- accounts, cloud sync, leaderboards, or backend;
- exact real material data;
- long teaching copy on the board.

## 17. Success criteria

The MVP succeeds if:

1. a first-time player can place points, draw, label, erase, and submit with minimal onboarding;
2. the player feels they reconstructed the diagram from facts;
3. the board remains the dominant visual object;
4. mistakes are about reasoning, not pointer precision;
5. the editor does not leak the answer;
6. cosmetic curve variation does not affect correctness;
7. the flow works smoothly on mobile and desktop.

---

# Tie-Line User Experience

Tie-Line opens directly into the current puzzle.

There is no home dashboard between the player and the board. The screen shows an empty temperature-composition frame, component labels A and B, and a compact instruction strip containing the facts of a fictional system.

For the golden puzzle, the instructions appear in compact notation such as:

```text
A 1000°   B 850°   E 700°·40%B
α@E 10%B   β@E 80%B
```

The instructions can collapse to a small symbol while the player works.

## Placing the thermodynamic anchors

The player selects the Point tool. The available instruction-defined point symbols appear in a small temporary row.

They choose the A melting point and place it on the left edge at 1000°C. The point snaps cleanly to the edge and grid.

They place the B melting point, the three eutectic-temperature phase compositions, and the low-temperature solvus endpoints.

The app does not draw the diagram for them. It only regularises the input so the intended coordinate is machine-readable.

## Constructing the topology

The player selects Curve and drags between anchors.

A faint raw trace follows the gesture. A clean candidate curve appears over it. On release, the raw trace disappears and the constrained curve remains.

The player chooses what connects to what. The editor prevents accidental gaps and illegal geometric crossings, but it allows the player to create the wrong scientifically meaningful topology.

The invariant horizontal is drawn with the Horizontal tool. It snaps exactly through the three anchors at the eutectic temperature.

As the topology closes, phase fields become selectable.

## Labelling

The player selects a phase symbol:

```text
L   α   β
```

They tap a field to add it. Selecting another phase and tapping the same field appends that phase.

The order is preserved visually. `α + L` and `L + α` are both allowed and semantically equivalent.

The player may put three phases in a 2-D field or one phase on the invariant horizontal. Tie-Line does not prevent scientific mistakes through the input controls.

## Correcting

Erase mode changes the meaning of a deliberate tap:

- tap a phase symbol to remove only that phase;
- tap a player curve to remove it;
- tap a player point to remove it when no remaining geometry depends on it.

Undo is always visible but unobtrusive.


## Submission

The player works without correctness feedback before submission by default.

The visible timer continues while the puzzle is active. Three compact submission indicators show the scored attempts remaining.

On the first or second incorrect submission, Tie-Line reports only the broad outcome and returns the player to the unchanged construction. It does not point to the answer.

An optional Settings preference may enable local invalidity checking. When enabled, definite local rule violations may pulse or outline and may link to a short rule explanation, but the hidden solution is never used as a hint.

## Deduction loop

The intended loop is:

> read instructions → place anchors → infer a connection → draw it → infer neighbouring fields → label them → submit

Each solved relationship constrains the remaining diagram.

## Solving

On Submit, Tie-Line verifies coordinates, topology, cell structure, labels, and invariant geometry. The player has three scored submissions.

Exact curve shape is ignored once the correct incidence and legal topology are present.

A correct submission stops the timer. A third incorrect submission also stops the scored timer and offers unscored continuation, solution reveal, or a new puzzle.

When solved, control points and editing affordances fade. The finished phase diagram remains on screen. A restrained completion animation runs and a small next control appears.

A compact result sheet shows completion time, submissions used, and no-error status. There is no score dashboard.

## Leaving and returning

The puzzle saves automatically. Reopening Tie-Line restores the same points, curves, labels, and viewport directly.

Settings, puzzle selection, statistics, and scientific reference material live outside the active board.

## Overall character

Tie-Line should feel like a board puzzle, not a diagram editor and not a digital textbook.

The facts are the instructions.

The points, lines, and phase symbols are the pieces.

The phase diagram is the board.

---

# Tie-Line Interaction Grammar v0.2

## 1. Principle

The interaction feels direct and free, but the persisted construction is semantic.

Raw gestures propose points, curves, and targets. The application stores exact snapped coordinates, incidence, constrained geometry, phase sets, and topology.

## 2. Mode model

Exactly one mode is active:

- Point
- Curve
- Horizontal
- Label
- Select
- Erase

The active mode must be recognisable through icon shape, selected state, pointer behaviour, and accessible name. Do not rely only on colour.

## 3. Point mode

### 3.1 Point palette

Opening Point mode reveals one compact symbol per unplaced instruction-defined anchor.

Example symbols:

- `Aₘ`
- `Bₘ`
- `αE`
- `E`
- `βE`
- `α0`
- `β0`

The symbols are identifiers, not explanatory sentences.

### 3.2 Placement

The player may:

- tap a point symbol, then tap the board; or
- drag a point symbol onto the board.

A clean point preview snaps to the logical grid.

### 3.3 Constraint classes

- Unary melting anchors are constrained to the corresponding composition edge.
- Eutectic-temperature anchors may move along the exact eutectic-temperature row until released.
- Low-temperature endpoints are constrained to the bottom frame.
- Composition values snap to the declared puzzle grid.

These are syntactic placement constraints. They do not silently correct the player to the instruction's exact coordinate.

### 3.4 Coordinate feedback

While placing or moving a point, show only a tiny temporary coordinate readout near the finger or cursor, for example `40%B · 700°`.

The readout disappears after release.

### 3.5 Moving points

In Select mode, an unconnected point may be moved freely within its constraint class.

Moving a connected point previews the movement of attached curves. Commit as one undoable action.

## 4. Curve mode

1. Pointer down within a point hit radius begins a stroke.
2. A faint raw trace follows the pointer.
3. A clean candidate curve previews over the trace.
4. All structurally reachable end anchors use the same neutral affordance. Do not highlight only scientifically correct targets.
5. Release within the target snap radius proposes a curve.
6. Reject self-intersection, illegal crossing, overlap, duplicate incidence, or free endpoint.
7. Commit the clean curve and discard the raw trace.

## 5. Curve representation

Use one quadratic Bézier or equivalent one-handle representation.

Store:

- start point ID;
- end point ID;
- one control point;
- player-created status.

The gesture determines broad bow direction. Clamp the control point to avoid loops, excessive curvature, or hidden extrema.

Select mode reveals one handle only while the curve is selected.

## 6. Horizontal mode

1. Start on one anchor.
2. Drag toward another anchor.
3. Preview an exactly horizontal semantic object.
4. The object may include one or more interior anchors on the same row.
5. Release near the final anchor.
6. Reject overlap, duplicate, or illegal crossing.

The golden puzzle's invariant horizontal must include `αE`, `E`, and `βE`.

## 7. Face extraction and target behaviour

After each geometry commit:

- recompute the planar cell complex;
- identify bounded 2-D fields;
- preserve stable cell IDs where topology is unchanged;
- make fields directly tappable;
- attach phase labels automatically near a suitable interior point.

No manual text positioning is required.

## 8. Label mode

### 8.1 Phase palette

The temporary palette contains:

```text
L   α   β
```

### 8.2 Applying phases

Support both:

- select a phase, then tap one or more targets;
- drag a phase onto one target.

A selected phase remains active until the player changes mode or phase.

### 8.3 Permitted targets

- 2-D fields;
- invariant horizontal.

Future grammars may add line compounds and special points.

### 8.4 Error freedom

Allow zero through all declared phases on every phase-bearing target.

Do not allow duplicate copies of one phase on one target.

Preserve insertion order visually. Canonicalise only for validation.

## 9. Erase mode

A deliberate tap may remove:

- one tapped phase token;
- one player-created curve;
- one invariant horizontal;
- one player-created point when deletion does not orphan committed geometry.

If a point has incident geometry, highlight the dependent objects and require a second confirmation tap or undoable grouped deletion.

Do not support scrub-to-delete.

## 10. Select mode

Select mode supports:

- moving a point;
- adjusting one curve handle;
- inspecting a field or horizontal;
- cycling overlapping targets;
- opening a compact local rule tooltip when optional local invalidity checking is enabled.

Tap empty board space to clear selection and hide handles.

## 11. Undo and redo

Undo is always accessible.

Each of these is one semantic action:

- place point;
- move point and attached geometry;
- add curve;
- adjust curve;
- add horizontal;
- add phase;
- remove phase;
- delete geometry;
- grouped dependent deletion.

Redo may live in overflow on narrow screens.


## 12. Local invalidity checking and Submit

### Default state

There is no pre-submission correctness action on the default play screen. The editor blocks only malformed gestures and data structures.

### Optional local invalidity checking

When enabled in Settings, it may:

- report definite present contradictions;
- highlight locally;
- ignore absence alone;
- link to a concise rule explanation;
- avoid hidden-solution comparison and answer-revealing corrections.

### Submit

- checks all required points;
- checks exact instruction coordinates;
- checks required topology;
- checks labels and invariant assemblage;
- checks completeness and extra geometry;
- consumes one of three scored submissions when incorrect;
- stops the timer on success or after the third incorrect submission.

## 13. Gesture priority

On touch:

1. visible point or selected handle;
2. visible phase token;
3. geometry line;
4. field;
5. empty board.

Use generous invisible hit areas.

## 14. Zoom and pan

- two-finger pinch zoom;
- two-finger pan;
- no one-finger pan while a drawing mode is active;
- reset view in overflow;
- screen-space snap and hit thresholds remain constant under zoom.

## 15. Structural versus scientific constraints

The editor enforces:

- machine-readable coordinates;
- valid graph incidence;
- no accidental crossings;
- no floating curve endpoints;
- exact horizontality for invariant objects;
- nonduplicate phase tokens.

The validator enforces:

- correct coordinates from instructions;
- correct topology;
- correct field dimensions and assemblages;
- correct invariant structure.

---

# Tie-Line Visual Grammar v0.2

## 1. Reference

Use **Minesweeper: The Clean One** as the reference for interaction density, restraint, and board dominance.

Adapt principles only. Do not copy proprietary assets, branding, exact colour themes, or layout.

## 2. Core rule

The phase diagram is the board.

Every persistent element must support the player's next puzzle action.

## 3. Prohibited play-screen patterns

Do not include:

- dashboard cards;
- persistent title banner;
- paragraph instructions;
- visible statistics;
- progress cards;
- side inspector;
- permanent feedback panel;
- persistent rule list;
- decorative science imagery;
- full-field teaching annotations;
- large submit card.

## 4. Screen composition

The board should occupy approximately:

- 85 to 92 percent of the mobile play area;
- 80 to 90 percent of the desktop play area.

Remaining space is used for:

- a tiny instruction strip or instruction toggle;
- a compact mode control;
- undo;
- submit and three compact submission indicators.

Controls may overlay the board margins.

## 5. Board

- flat neutral background;
- no card around the board;
- no paper texture;
- no grid by default;
- optional grid appears only while placing or moving a point;
- thin dark frame and boundaries;
- minimal axis notation: `T`, `A`, `B`;
- numerical ticks hidden unless placement mode requires them.

## 6. Instruction strip

The instruction strip uses concise scientific notation only.

It may appear as one or two compact rows at the top edge:

```text
A 1000°  B 850°  E 700°·40%B
αE 10%B  βE 80%B
```

Behaviour:

- visible on puzzle open;
- collapsible to a small instruction icon;
- temporarily reappears when Point is selected;
- no explanatory prose;
- no surrounding card shadow;
- may use subtle translucent backing only for legibility.

## 7. Geometry

During ordinary play:

- all scientific boundary types use one neutral line style;
- locked and player-created geometry settle to the same style after placement;
- selected geometry uses a temporary accent outline;
- raw pointer trace is faint;
- snapped preview is clearer;
- malformed preview uses an error state.

Do not reveal liquidus, solidus, or solvus through colour or dash pattern.

## 8. Points

Point states:

- unplaced point symbol: compact palette glyph;
- placement preview: hollow circle with subtle crosshair;
- committed point: small filled or outlined circle;
- selected point: accent ring;
- optional local-invalidity indication: error ring;
- solved point: reduced or hidden affordance.

Point markers fade when no point-related mode is active.

## 9. Phase labels

Render phase assemblages directly on the board.

Preferred form:

```text
α + L
```

Use:

- readable phase symbols;
- neutral plus signs;
- subtle stable colour per phase symbol if desired;
- no large pill around the entire assemblage;
- no full-field colour fill during play.

For narrow fields, use a small external label with a fine leader line.

## 10. Phase colours

Colour may distinguish phase symbols, but not scientific correctness.

Rules:

- one stable accessible colour per phase;
- phase colours are separate from error, success, and selection colours;
- do not blend colours to create multiphase field colours;
- labels remain legible in monochrome and colour-blind modes.

## 11. Controls

Controls are icon-first and compact.

Suggested always-visible actions:

- undo;
- active mode button;
- submit and three compact submission indicators.

Selecting the mode button opens the small row of six modes.

Selecting Point or Label opens the relevant temporary symbol row.

Erase may remain one tap away because it changes board semantics.

Long press or accessibility mode reveals control names.

## 12. Feedback

Default feedback is visual and local.

When optional local invalidity checking is enabled:

- definite contradictory objects pulse once;
- an error outline remains until the next edit or selection;
- no full-screen message or permanent panel appears;
- tapping an error reveals one short rule tooltip.

When it is disabled, scientific error styling appears only after submission and remains broad rather than answer-revealing.

## 13. Motion

Use motion only to clarify:

- point snap;
- curve regularisation;
- phase token addition or removal;
- local error pulse;
- undo restoration;
- solved-state cleanup.

No confetti, bouncing controls, decorative particles, or continuous animation.

## 14. Solved state

- remove control handles;
- reduce point markers;
- normalise lines;
- retain the complete diagram;
- display one small next control;
- optional subtle field-label settling animation.

## 15. Typography

- clean sans-serif UI font;
- maths-capable rendering for Greek symbols and subscripts;
- no decorative science font;
- no all-caps play text;
- body prose is absent from normal play.

## 16. Accessibility

- controls have accessible names;
- touch targets at least 44 CSS px even when visible icons are smaller;
- colour is never the sole state indicator;
- phase symbols remain textual;
- high contrast mode supported by CSS variables;
- reduced-motion preference respected.

---

# Technical Architecture

## 1. Application shape

Build a static client-only web application.

Recommended stack:

- React
- TypeScript strict mode
- Vite
- SVG
- Vitest
- Playwright

No backend, database, authentication, or network API is required.

## 2. Suggested module boundaries

```text
src/
  app/
  domain/
    schema.ts
    instruction-coordinates.ts
    geometry.ts
    canonical.ts
    rules/
  editor/
    actions.ts
    history.ts
    cell-reconciliation.ts
  canvas/
    DiagramCanvas.tsx
    pointer-controller.ts
    face-extraction.ts
    hit-testing.ts
  game/
    PuzzleScreen.tsx
    persistence.ts
    feedback.ts
  ui/
    ModeControl.tsx
    PointPalette.tsx
    PhasePalette.tsx
    InstructionStrip.tsx
    ErrorTooltip.tsx
```

Thermodynamic logic must remain outside React components.

## 3. Coordinates

Use logical units:

- `u`: composition from 0 to 100 percent B;
- `t`: temperature in degrees Celsius for the golden puzzle.

The board viewport maps logical coordinates to SVG coordinates.

Semantic equality uses logical coordinates. Hit and snap thresholds use screen pixels.

## 4. Puzzle temperature domain

Golden puzzle board:

- minimum displayed temperature: 0°C;
- maximum displayed temperature: 1100°C.

The visible axis may suppress most numeric labels. Placement mode may show a temporary coordinate readout.

## 5. Point model

Each instruction-defined point stores:

- semantic role;
- correct coordinate;
- permitted placement constraint;
- player coordinate if placed;
- placement status;
- incident geometry IDs.

Point placement is player state. Correct solution coordinates remain in the hidden fixture.

## 6. Curves

Store ordinary curves as quadratic Bézier segments:

```ts
{
  startNodeId,
  endNodeId,
  control: { u, t }
}
```

Curvature is cosmetic within structural limits.

## 7. Invariant horizontal

Store:

- left endpoint;
- right endpoint;
- ordered interior point IDs;
- exact temperature;
- player phase insertion order.

## 8. Geometry commit pipeline

After a point or geometry action:

1. validate syntactic placement class;
2. reject duplicate semantic object;
3. sample curves for intersection checks;
4. reject self-intersection, overlap, or unregistered crossing;
5. update embedded graph;
6. extract bounded faces;
7. reconcile cell IDs and labels;
8. persist state.

## 9. Face extraction

Use a half-edge traversal or another deterministic planar embedding method, not pixel flood fill.

Curves may be sampled into polylines for area and hit testing, but semantic identity remains the original curve.

## 10. Cell identity

Prefer topology signatures from ordered boundary IDs and orientations.

If topology changes, transfer labels only when polygon overlap is unambiguous. Otherwise move them to a temporary unresolved state or clear them with an undoable warning.

For the MVP, a simpler policy is acceptable:

- preserve labels when only control points move;
- clear labels on a cell split or merge;
- include the geometry edit and label clearing in one undo action.

## 11. Validation layers

### Structural validator

Checks machine-readable geometry and planar legality.

### Optional local-invalidity validator

Reports definite current contradictions only when the Settings preference is enabled. It is not exposed as a default Check action.

### Submit validator

Checks exact instruction coordinates, required topology, field labels, invariant assemblage, completeness, and extra geometry.

### Future solver

Not required for MVP.

## 12. Semantic comparison

Compare:

- point role and exact coordinate;
- geometry type and unordered endpoint incidence;
- invariant interior-node incidence;
- extracted field topology;
- unordered phase sets;
- absence of extra geometry.

Ignore:

- curve control points;
- phase insertion order;
- label screen position;
- viewport;
- raw stroke path.

## 13. Persistence

Store one versioned local record after each action.

Exclude:

- raw pointer traces;
- hover state;
- hidden solution;
- transient error pulse state.

## 14. Performance targets

- pointer preview near 60 fps;
- face recomputation under 30 ms for golden puzzle;
- optional local validation and Submit under 100 ms;
- no visible label jump during cosmetic curve adjustment.

## 15. Dependency policy

Do not use a full vector-editor framework.

A small geometry library is acceptable only if it is deterministic, browser-safe, focused, and does not obscure the semantic graph model.

---

# Schema and State Contracts

The reference TypeScript definitions are in `src/domain/schema.ts`.

## 1. Identifiers

- stable opaque strings;
- no array-index identity;
- hidden solution IDs may correspond to puzzle role IDs but must not leak into player affordances.

## 2. Player phase assemblages

Store insertion order:

```ts
phaseOrder: PhaseId[]
```

Constraints:

- no duplicates;
- zero through all declared phases permitted;
- validation canonicalises to a sorted set key;
- UI preserves insertion order.

## 3. Point specification

Each point role declares:

- visible symbolic label;
- placement constraint class;
- optional edge;
- correct hidden coordinate;
- whether required.

The public puzzle fixture must not include the hidden correct coordinate if the UI is expected to derive it only from human-readable instructions. For this MVP, the instruction values are public and the same data may power the instruction strip, but no automatic placement may consume them.

## 4. Player point state

A placed point stores:

- role ID;
- player coordinate;
- locked-to-grid result;
- incident geometry;
- creation order.

The point is not scientifically correct merely because it satisfies its placement constraint class.

## 5. Geometry

### Curve

- distinct endpoints;
- one control point;
- no scientific type stored.

### Invariant horizontal

- exact shared temperature;
- sorted interior point IDs;
- phase insertion array.

### Frame

- locked;
- nonlabelable;
- participates in face extraction.

## 6. Extracted cells

Store:

- stable ID;
- ordered boundary references;
- polygon approximation;
- label point;
- player phase insertion order.

Hidden semantic role is test-only or solution-only.

## 7. Puzzle constraints

The golden puzzle declares:

- seven required point roles;
- exact hidden coordinates;
- six required curve endpoint pairs;
- one required invariant horizontal;
- six expected 2-D fields;
- expected field assemblages;
- zero permitted extra geometry on Submit.

## 8. Canonical MVP signature

```text
point: role|u|t
curve: curve|min(pointA,pointB)|max(pointA,pointB)
horizontal: horizontal|left|interior...|right|t
cell: canonical cyclic oriented boundary sequence
assemblage: sorted phase IDs
```

Curve control points are excluded.

## 9. State

Mutable construction state contains:

- point placements;
- geometry;
- extracted cells;
- labels;
- active mode;
- active point role or phase;
- selection;
- viewport;
- metrics;
- solved status.

## 10. Metrics

Record locally:

- active time;
- Submit count;
- submissions remaining;
- scored-attempt status;
- local-invalidity-check setting;
- point moves;
- geometry deletions;
- phase deletions;
- undo count;
- solved timestamp.

Do not display a competitive score in MVP.

---

# Golden Puzzle: Instruction-First Binary Eutectic

## 1. Purpose

This is the only playable puzzle required for the MVP.

It validates:

- compact instruction presentation;
- point placement;
- constrained drawing;
- face extraction;
- phase labelling;
- erasing;
- three-submission lifecycle;
- persistence;
- minimal board UX.

The system is fictional.

## 2. Board domain

- composition: 0 to 100 percent B;
- temperature: 0°C to 1100°C.

## 3. Public instructions

```text
A 1000°
B 850°
E 700° · 40%B
α@E 10%B
β@E 80%B
α@0 0%B
β@0 100%B
```

## 4. Required points

| Role ID | Correct composition | Correct temperature | Placement constraint |
|---|---:|---:|---|
| `a-melt` | 0%B | 1000°C | left edge |
| `b-melt` | 100%B | 850°C | right edge |
| `alpha-eut` | 10%B | 700°C | eutectic row |
| `eutectic` | 40%B | 700°C | eutectic row |
| `beta-eut` | 80%B | 700°C | eutectic row |
| `alpha-low` | 0%B | 0°C | bottom edge |
| `beta-low` | 100%B | 0°C | bottom edge |

## 5. Required curves

- `a-melt` to `eutectic`: left liquidus branch;
- `b-melt` to `eutectic`: right liquidus branch;
- `a-melt` to `alpha-eut`: left solidus branch;
- `b-melt` to `beta-eut`: right solidus branch;
- `alpha-low` to `alpha-eut`: left solvus branch;
- `beta-low` to `beta-eut`: right solvus branch.

The player is not told these names during play.

## 6. Required invariant horizontal

- start: `alpha-eut`;
- interior: `eutectic`;
- end: `beta-eut`;
- temperature: 700°C;
- expected assemblage: `{L, α, β}`.

## 7. Expected fields

- upper field: `{L}`;
- lower-left terminal field: `{α}`;
- lower-right terminal field: `{β}`;
- upper-left two-phase field: `{L, α}`;
- upper-right two-phase field: `{L, β}`;
- lower-middle field: `{α, β}`.

## 8. Curve freedom

Any structurally legal monotone curve with the correct endpoints is accepted.

The visual reference fixture supplies recommended control points for tests and screenshots only.

## 9. Initial state

- empty frame;
- no points;
- no geometry;
- no labels;
- instruction strip expanded;
- Point mode may be selected automatically for the first session;
- no instructional paragraph.


## 10. Optional local invalidity examples

When local invalidity checking is enabled, definite errors may include:

- A melting point at 900°C;
- eutectic point at 50%B;
- a 2-D field with `{L, α, β}`;
- invariant horizontal with more than three distinct phases;
- curve crossing;
- horizontal not incident to its committed anchors;
- ordinary curve ending freely.

Missing points or labels alone are not local-invalidity errors. With the setting disabled, none of these receive scientific correctness feedback before submission.

## 11. Submit success

A submission succeeds only when:

- all seven points are at exact instruction coordinates;
- all required geometry incidences exist;
- no extra geometry exists;
- exactly six fields are extracted;
- each expected field has the correct unordered assemblage;
- the invariant has `{L, α, β}`;
- the construction is planar and structurally valid.

## 12. Submission budget

The golden MVP puzzle permits exactly three scored submissions. The timer stops on success or after the third incorrect submission.

---

# MVP Validator Specification

This is the executable subset required for the first Tie-Line build.

## 1. Validation order

1. Structural geometry.
2. Point instruction coordinates.
3. Required geometry incidence.
4. Face count and topology.
5. Dimensional assemblage checks.
6. Field semantic matching.
7. Invariant semantic matching.
8. Completeness and extra structure.

## 2. Structural rules

### M-S1

Every player curve has two distinct committed point endpoints.

### M-S2

No committed curves cross, self-intersect, overlap, or touch except at shared endpoints or declared invariant incidence.

### M-S3

Every invariant object is exactly horizontal.

### M-S4

The committed frame and geometry produce a deterministic planar embedding.

### M-S5

On Submit, all extracted 2-D fields are closed and positive-area.

### M-S6

No player geometry has a free endpoint.

## 3. Point rules

### M-P1

Every required point role is placed exactly once.

### M-P2

Each point satisfies its placement constraint class.

### M-P3

When optional local invalidity checking is enabled, a placed point at a coordinate different from its explicit instruction value is a definite contradiction.

### M-P4

On Submit, every point coordinate equals the golden solution coordinate exactly after snapping.

## 4. Geometry rules

### M-G1

On Submit, exactly six ordinary curves exist.

### M-G2

Each required unordered endpoint pair exists exactly once.

### M-G3

Exactly one invariant horizontal exists.

### M-G4

The invariant connects `alpha-eut` to `beta-eut` and contains `eutectic` as an ordered interior node.

### M-G5

No extra curve or horizontal exists.

### M-G6

Curve control points are ignored except for structural monotonicity and intersection legality.

## 5. Cell rules

### M-C1

On Submit, exactly six bounded 2-D fields exist.

### M-C2

Every field has at least one phase on Submit.

### M-C3

Every 2-D field has one or two distinct phases.

### M-C4

Field assemblage comparison is unordered.

### M-C5

Each solution witness point lies inside exactly one extracted field and that field has the expected assemblage.

## 6. Invariant rules

### M-I1

The invariant horizontal is a phase-bearing 1-D target.

### M-I2

On Submit it contains exactly `{L, α, β}`.

### M-I3

With optional local invalidity checking enabled, an invariant carrying more than three distinct phases is a definite dimensional contradiction. A subset remains unresolved during partial construction. Submit requires all three expected phases.


## 7. Optional local invalidity policy

The default MVP exposes no pre-submission correctness check.

When the Settings preference is enabled, local validation reports:

- M-S failures in committed geometry;
- M-P3 point contradictions;
- M-C3 too-many-phase dimensional errors;
- undeclared phase IDs;
- locked-element violations;
- local incidence contradictions that cannot be repaired by adding missing objects.

It does not report:

- missing points;
- missing curves;
- missing labels;
- one- or two-phase partial invariant labels;
- wrong field labels based only on hidden-solution comparison.

## 8. Submit outcomes

### Solved

All rules pass.

### Incomplete

The graph remains structurally interpretable but required points, geometry, or labels are missing.

### Incorrect

The construction is complete enough to evaluate but differs semantically from the required solution.

### Malformed

The planar structure cannot be interpreted.

## 9. Error reporting

For each offending object, show one earliest rule violation.

Default board response:

- local outline or pulse;
- no large text.

On tap, show one concise sentence and rule ID.


## 9. Submission lifecycle

The validator is called for up to three scored submissions. Incorrect or incomplete results consume an attempt. The third non-solved result returns `failed-scored-attempt` at the game-state layer and stops the timer. The player construction remains available for unscored continuation or solution reveal.

---

# MVP Acceptance Tests

All required tests must pass.

## A. Launch and minimal screen

1. App opens directly into the current puzzle.
2. No dashboard appears before the board.
3. No title banner, instruction paragraph, statistics card, or permanent feedback panel appears during play.
4. Board occupies at least 85 percent of a 390 x 844 mobile viewport excluding browser chrome.
5. Instruction strip is visible and collapsible.
6. Visible active timer and three compact submission indicators are present.
7. Refresh restores current puzzle directly.

## B. Instructions

7. Instruction strip shows all seven facts in compact notation.
8. Instruction strip contains no explanatory paragraph.
9. Collapsing instructions leaves a small discoverable instruction control.
10. Entering Point mode can reveal the instruction strip again.

## C. Point placement

11. Point palette shows all unplaced role symbols.
12. Player can place a point by tap-then-tap.
13. Player can place a point by drag.
14. Unary melting points remain on their required frame edge.
15. Eutectic-row points remain on the 700°C row.
16. Low-temperature endpoints remain on the bottom edge.
17. Temporary coordinate readout appears during placement.
18. Coordinate readout disappears after placement.
19. Incorrect instruction coordinate is permitted by the editor when within the syntactic class.
20. Incorrect instruction coordinate receives no scientific correctness styling before submission when local checking is off.
21. Optional local invalidity checking, when enabled, highlights an incorrect placed coordinate without showing the correct coordinate.
22. Unconnected points can be moved.
23. Connected point movement previews attached geometry.
24. Point placement is undoable.

## D. Curve and horizontal drawing

24. Curve gesture begins only near a committed point.
25. Raw trace and clean preview are visually distinct.
26. Release near a valid endpoint commits a semantic curve.
27. Free endpoint is rejected.
28. Crossing is rejected.
29. Duplicate endpoint pair is rejected.
30. Wrong but structurally valid endpoint pair is accepted.
31. Selected curve exposes one handle.
32. Handle adjustment preserves endpoint incidence.
33. Horizontal snaps exactly to one temperature.
34. Horizontal incorporates the interior eutectic point.
35. Geometry changes are undoable.

## E. Face extraction

36. Correct geometry extracts exactly six fields.
37. Cosmetic handle adjustment does not change field identity.
38. A topology-changing deletion recomputes fields.
39. No field requires manual text positioning.

## F. Labelling

40. Phase palette contains `L`, `α`, and `β` only.
41. Tap-to-apply works.
42. Drag-to-apply works.
43. Phase remains active for repeated taps.
44. Insertion order is displayed.
45. Validation treats insertion order as irrelevant.
46. Duplicate token is ignored.
47. Three phases can be added to a 2-D field.
48. Erase removes one tapped phase only.
49. Invariant horizontal accepts phase tokens.


## G. Pre-submission behaviour

50. No default Check action is visible.
51. With local invalidity checking off, scientific mistakes receive no pre-submission correctness feedback.
52. The editor still rejects malformed crossings and free endpoints.
53. With local invalidity checking enabled, an incorrect instruction coordinate may be highlighted locally.
54. Optional local checking does not complain merely because the puzzle is incomplete.
55. Optional local checking does not compare a field directly against the hidden complete answer.
56. Player work is preserved when local feedback changes.


## H. Submit

57. The active screen shows three scored submission indicators.
58. Missing point produces Incomplete and consumes one submission.
59. Missing curve produces Incomplete and consumes one submission.
60. Empty required field produces Incomplete and consumes one submission.
61. Wrong point coordinate produces Incorrect.
62. Wrong endpoint incidence produces Incorrect.
63. Wrong field assemblage produces Incorrect.
64. Extra curve produces Incorrect.
65. Crossing or uninterpretable graph produces Malformed.
66. Correct topology and labels with different curve bows produces Solved.
67. `α + L` is accepted where `{L, α}` is expected.
68. First and second unsuccessful submissions preserve editing and keep the timer running.
69. Third unsuccessful submission ends the scored attempt and stops the timer.
70. After third failure, Continue unscored and Reveal solution are available.
71. Unscored continuation cannot later record a scored solve.

## I. Solved state

67. Editing handles fade.
68. Point affordances reduce or disappear.
69. No score dashboard appears.
70. Small next control appears.
71. Finished diagram remains visible.

## J. Persistence

72. Point placements persist after reload.
73. Curves persist after reload.
74. Labels and insertion order persist.
75. Viewport persists.
76. Solved state persists.
77. Submissions remaining, timer, and scored-attempt status persist.

## K. Mobile and accessibility

77. Works at 320 px width without horizontal page scrolling.
78. Touch hit targets are at least 44 px.
79. Pinch zoom and two-finger pan work.
80. One-finger drawing does not scroll the page.
81. Controls have accessible names.
82. Colour is not the only state signal.
83. Reduced-motion preference is respected.

## L. Scientific fixture

84. Golden fixture produces six fields.
85. Golden witness points map one-to-one to expected fields.
86. Invariant spans 10%B to 80%B at 700°C and includes 40%B interior point.
87. Hidden solution point coordinates match public instruction notation.

---

# Agent Build Plan

Use small, reviewable work packages. Do not ask one agent to build the whole game in one pass.

## Package 1: Project foundation

Deliver:

- React, TypeScript, Vite setup;
- test setup;
- CSS variables and full-screen board shell;
- no-dashboard launch screen.

Acceptance: A1 to A4.

## Package 2: Domain schema and fixtures

Deliver:

- `schema.ts` implementation;
- puzzle and solution loaders;
- instruction formatting;
- fixture validation tests.

Acceptance: B7 to B10, L84 to L87.

## Package 3: Coordinate board

Deliver:

- logical-to-SVG transform;
- frame and axes;
- zoom and pan;
- placement grid shown only in Point mode;
- temporary coordinate readout.

Acceptance: C14 to C18, K77 to K80.

## Package 4: Point placement

Deliver:

- Point mode;
- point symbol palette;
- placement constraint classes;
- moving points;
- undo actions;
- persistence.

Acceptance: C11 to C23, J72.

## Package 5: Constrained geometry

Deliver:

- Curve mode;
- Horizontal mode;
- snapping;
- crossing and overlap rejection;
- one-handle editing;
- undo and persistence.

Acceptance: D24 to D35, J73.

## Package 6: Planar embedding and cells

Deliver:

- frame segmentation;
- half-edge or deterministic face extraction;
- stable cell IDs;
- hit testing;
- tests against golden geometry.

Acceptance: E36 to E39, L84 to L86.

## Package 7: Labelling and erase

Deliver:

- Label mode;
- phase palette;
- insertion order;
- invariant labelling;
- Erase mode;
- undo and persistence.

Acceptance: F40 to F49, J74.

## Package 8: Validation

Deliver:

- structural validator;
- point instruction checks;
- Submit semantic comparison;
- status model;
- local error highlighting and tooltip.

Acceptance: G50 to G56, H57 to H66.

## Package 9: Solved state and persistence polish

Deliver:

- solved cleanup animation;
- small next control;
- restoration after reload;
- metrics storage.

Acceptance: I67 to I71, J72 to J76.

## Package 10: Visual and mobile audit

Deliver:

- comparison against Visual Grammar;
- removal of dashboard creep;
- accessibility audit;
- mobile gesture audit;
- reduced motion.

Acceptance: A1 to A6, K77 to K83.

## Package 11: Scientific and integration review

Deliver:

- verify every fixture coordinate and incidence;
- confirm no solution data leaks into available targets;
- complete Playwright solve path;
- record deferred issues.

Acceptance: all tests.

---

# Decision Log

## Authoritative decisions

1. Product name is **Tie-Line**.
2. Assistant's Formal Rules v0.2 is authoritative.
3. The game is a geometric deduction puzzle, not a multiple-choice quiz.
4. The default core puzzle is instruction-first, not a partly drawn diagram.
5. Tutorial variants may reveal anchors or partial geometry.
6. Constrained drawing is the core input model.
7. Raw freehand strokes are not authoritative geometry.
8. The editor blocks malformed geometry but permits scientific mistakes.
9. Players may place phase combinations of any permitted size and order.
10. Duplicate phase tokens are ignored.
11. Erase mode removes individual phase tokens or player geometry.
12. Tie-Line uses a minimal board-first UX inspired by Minesweeper: The Clean One.
13. There is no play-screen dashboard.
14. The instruction strip uses compact notation and may collapse.
15. The MVP includes player placement of instruction-defined anchors.
16. Correctness ignores cosmetic curve shape.
17. Check gives only definite local contradictions.
18. Submit gives complete verification.
19. No solver-backed hint mode in MVP.
20. The golden system is fictional and simple eutectic with terminal solubility.

## Deferred

- procedural generation;
- uniqueness checker;
- real-system puzzle library;
- compounds;
- other binary invariant types;
- ternary liquidus projections;
- accounts and statistics screens;
- pencil marks;
- advanced relational instructions;
- experimental-data instructions;
- dark theme.

## Superseding end-product and revised-MVP decisions

21. User-facing puzzle facts are called **instructions**, not clues.
22. Main Game has no correctness checking before submission by default.
23. Local invalidity checking is an optional Settings preference and is off by default.
24. Each scored puzzle permits three submissions.
25. The active timer is visible and stored in statistics.
26. Third incorrect submission ends the scored attempt and stops the timer.
27. After third failure, continue unscored or reveal solution is permitted.
28. Main Game is ultimately procedurally generated with reproducible seeds.
29. Easy, Normal, and Advanced are always available and are not campaigns.
30. Difficulty is deterministic from puzzle rules and never recalibrated automatically from player data.
31. Practice ultimately covers every supported concept.
32. Notes is a reference manual of definitions and rules.
33. The application opens directly into Main Game; menu contains Main Game, Practice, Notes, Statistics, and Settings.

---

# Tie-Line Screen Wireframe

## Mobile default

```text
┌────────────────────────────────┐
│ A1000  B850  E700·40B  αE10 ...│  compact instruction strip
│                                │
│ T                              │
│ ┌────────────────────────────┐ │
│ │                            │ │
│ │                            │ │
│ │          BOARD             │ │
│ │                            │ │
│ │                            │ │
│ └────────────────────────────┘ │
│ A                            B │
│                                │
│  ↶       ●/⌒/─/α/⌫       ✓     │  compact controls
└────────────────────────────────┘
```

No visible page title or instruction paragraph.

## Mode expansion

Tapping the central mode control temporarily expands:

```text
●   ⌒   ─   α   ↖   ⌫
```

Representing:

- Point
- Curve
- Horizontal
- Label
- Select
- Erase

The row closes after selection.

## Point palette

When Point is active:

```text
Aₘ  Bₘ  αE  E  βE  α0  β0
```

Placed points disappear from the palette or show a completed state.

## Label palette

When Label is active:

```text
L   α   β
```

## Feedback

There is no default pre-submission Check action. When optional local invalidity checking is enabled, a definite invalid object may receive a local outline and concise rule tooltip. No permanent panel appears.

## Desktop

The board remains centred and dominant. Controls float near the lower board edge rather than forming a side panel. Optional extra whitespace should not be filled with dashboard content.

---

# Scientific Golden Set Plan

The fictional MVP puzzle is enough to build and test interaction. It is not enough to certify the complete formal grammar.

Before implementing additional reaction types, create authoritative references for:

1. complete solid solubility;
2. simple eutectic;
3. eutectic with restricted terminal solubility;
4. congruently melting line compound;
5. incongruently melting compound and peritectic;
6. eutectoid;
7. peritectoid;
8. multiple invariant reactions.

For each reference, record:

- source;
- exact region or topology being validated;
- simplified canonical graph;
- relevant rules;
- real-world features excluded from the game grammar;
- valid fixture;
- one-rule near misses.

Use real systems as scientific regression examples, not necessarily as playable puzzles. Do not force complex real diagrams into the restricted grammar.

---

# Package Validation Record

- Public and hidden JSON fixtures parse successfully.
- Golden reference geometry polygonises into exactly **6** bounded 2-D fields.
- The six field witness points lie inside six distinct fields.
- The eutectic temperature, 700°C, is below both pure-component melting points, 1000°C and 850°C.
- The invariant horizontal spans 10%B to 80%B and contains the 40%B eutectic point.
- Visual references are explanatory only. Fixtures and formal documents remain authoritative.

## v3 integration checks

- End-product North Star pack is present under `end-product/`.
- Complete end-product specification is present.
- Integrated complete project handoff is present.
- Supplied MATS2008 reference notes are included under `references/`.
- Main Game instructions terminology supersedes clues terminology.
- Three-submission and visible-timer lifecycle is documented.
- Difficulty is explicitly deterministic and non-adaptive.
