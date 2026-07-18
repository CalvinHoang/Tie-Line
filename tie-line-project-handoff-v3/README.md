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
