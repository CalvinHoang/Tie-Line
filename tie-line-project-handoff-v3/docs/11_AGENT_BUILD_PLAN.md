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
