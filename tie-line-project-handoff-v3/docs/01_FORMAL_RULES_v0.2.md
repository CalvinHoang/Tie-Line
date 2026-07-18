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
