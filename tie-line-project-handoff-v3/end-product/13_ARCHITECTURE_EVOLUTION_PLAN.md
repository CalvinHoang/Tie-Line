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
