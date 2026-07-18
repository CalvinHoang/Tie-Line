# Tie-Line End Product Complete Specification v1

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
