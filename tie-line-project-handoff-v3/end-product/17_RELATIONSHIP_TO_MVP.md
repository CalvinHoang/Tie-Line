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
