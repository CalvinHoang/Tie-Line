# Tie-Line

Tie-Line is a mobile-first phase-equilibria labelling game. Every round procedurally generates a valid binary phase diagram, draws and locks its boundaries, and asks the player to label its phase fields and invariant lines. Answers are checked semantically rather than pixel-by-pixel.

This repository contains the complete playable binary-labelling release and the preserved source handoff in `tie-line-project-handoff-v3/`.

## Run locally

```bash
npm install
npm run dev
```

## Validate

```bash
npm run typecheck
npm test
npm run test:performance
npm run test:e2e
npm run build
```

The Playwright command requires its Chromium runtime (`npx playwright install chromium`).

`test:performance` runs the complex Hard diagram through both the desktop and 320 px mobile projects in an isolated, single-worker configuration. It enforces a 70 ms 95th-percentile input-to-paint/update budget, verifies that a one-finger drag remains frame-driven, and injects an 80 ms construction-storage delay to catch synchronous persistence work leaking back into active inputs. Timing checks are intentionally kept out of the parallel functional suite so unrelated browser workers cannot distort their budgets.

## Game features

- three always-available difficulties: Easy uses compact teaching families, while Normal and Hard share a seeded reaction grammar with smaller and larger complexity budgets respectively;
- rule-derived formula markers identify intermediate compositions along the bottom axis (for example AB, A₂B, AB₂, or ABC) and are visibly linked to their Greek phase symbols; polymorphs stack beneath their shared composition, and selecting a linked symbol activates that phase for labelling; invariant horizontals remain visible construction features but are not answer targets;
- the shared grammar can feature all 28 condensed-phase T-X concepts from Notes: the eight invariant reactions plus liquid/solid spinodals, consolute points, polymorphism, ordering, melting behaviour, compounds, solid solutions and miscibility phenomena; incompatible concepts are selected as alternative kernels rather than forced together;
- every generated round carries an explicit count for all 28 eligible concepts, including `0` for absent features; boiling, sublimation and gas-bearing triple points remain Notes-only because playable rounds are condensed-phase temperature-composition diagrams with no gas phase;
- Normal generates one to three intermediate compositions and a moderate field count; Hard remains large with three to five feature-aware backbone intermediates (four to seven total intermediate phases after nested solid-state modules), four or more invariants, and fifteen or more label fields. Spatial phenomena receive the smaller intermediary and module budgets so their defining fields remain visible;
- an independent geometry/topology and phase-equilibria audit rejects non-manifold boundaries, illegal field adjacency, degenerate invariants, incorrect parent/product incidence, phase-rule violations, and line-compound/solid-solution model mismatches before a round can be played; dense compositions retry with a simpler valid graph when necessary;
- complete, locked phase diagrams ready for labelling;
- visible active timer and three scored submissions;
- focused Label and Erase modes with direct tap placement;
- deterministic planar face extraction and direct field labelling;
- field-aware label placement: a tap selects the field, while the full assemblage is automatically anchored inside its extracted polygon;
- canonical visual phase ordering with unordered semantic assemblage validation;
- adaptive horizontal or vertical label layout for narrow and curved fields;
- undo, local autosave, and one resumable puzzle per difficulty;
- failed-attempt continuation, solution reveal, and clean solved state;
- Rules covering pages 1–5 of the supplied notes, critical points, transformations, and binary diagram families with original vector schematics;
- solve, no-error, and best-time statistics separated into Easy, Normal, and Hard, plus recent history and a daily streak;
- a blocking end-of-attempt choice screen with Continue, Reveal, New, and Menu, followed by an unobstructed diagram review when the solution is shown;
- first-run onboarding plus dark/light/system themes, reduced motion, and left-handed controls;
- 320 px mobile layout, one-finger drag pan with tap/drag disambiguation, pinch zoom, cursor-anchored wheel zoom and accessible zoom controls for narrow Hard fields, plus high contrast.

Ternary gameplay remains out of scope because the source handoff marks its grammar and validation rules as non-binding. Accounts, a backend, multiplayer, and leaderboards are also intentionally out of scope.
