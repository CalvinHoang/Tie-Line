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
