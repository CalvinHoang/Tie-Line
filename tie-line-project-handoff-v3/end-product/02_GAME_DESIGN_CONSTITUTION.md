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
