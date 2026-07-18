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
