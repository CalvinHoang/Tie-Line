# Tie-Line MVP Complete Handoff v3

# Current MVP context

This combined file is the current MVP implementation slice. Read the end-product North Star documents before using it.

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
