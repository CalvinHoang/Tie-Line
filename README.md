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
npm run test:e2e
npm run build
```

The Playwright command requires its Chromium runtime (`npx playwright install chromium`).

## Game features

- three always-available difficulty grammars: Easy (canonical invariants and simpler compound diagrams), Normal (expanded reactions and transformations), and Hard (immiscibility, spinodal, and multi-invariant topologies);
- rule-derived formula markers identify intermediate compositions along the bottom axis (for example AB, A₂B, AB₂, or ABC), while Greek phase symbols remain hidden until the player labels a field; invariant horizontals remain visible construction features but are not answer targets;
- seeded complete eutectic, compound, peritectic, peritectoid, subsolidus/supersolidus polymorphic, superlattice, monotectic, liquid-spinodal, syntectic, and multi-compound topologies;
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
- solve statistics, recent history, and a daily streak;
- first-run onboarding plus dark/light/system themes, reduced motion, and left-handed controls;
- 320 px mobile layout, pinch zoom/two-finger pan, accessible controls, and high contrast.

Ternary gameplay remains out of scope because the source handoff marks its grammar and validation rules as non-binding. Accounts, a backend, multiplayer, and leaderboards are also intentionally out of scope.
