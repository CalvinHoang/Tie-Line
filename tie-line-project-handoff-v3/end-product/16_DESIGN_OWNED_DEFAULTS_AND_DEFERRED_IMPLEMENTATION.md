# Design-Owned Defaults and Deferred Implementation

This document records decisions that do not require further product-direction input. They may be refined during implementation without reopening the core product.

## 1. Generator approach

Default: template-driven semantic topology generation with parameter randomisation and solver-backed uniqueness verification.

Reason: unrestricted random constraints create avoidable ambiguity and make scientific coverage difficult to audit.

## 2. Coordinate input

Default: continuous-looking dragging over a hidden discrete semantic grid, with exact snapped values.

Reason: this preserves geometric feel while making generation, instructions, reproduction, and validation deterministic.

## 3. Active puzzles

Default: retain one resumable scored Main Game puzzle for each difficulty, with the most recently used difficulty opening on launch.

## 4. Instruction display

Default: all instructions in one complete sheet. It may collapse or overlay on mobile, but no instruction is withheld or revealed sequentially.

## 5. Submission feedback

Default without local checking: broad outcome only after failed submission—incorrect, incomplete, or malformed—plus attempts remaining. Do not identify the correct location or phase.

## 6. Result screen

Default: compact sheet over the solved board with time, submissions, no-error status, seed code, and Next puzzle.

## 7. Practice feedback

Default: immediate local feedback, unlimited attempts, optional answer reveal, and direct Notes link. Practice is untimed unless a future explicit timed-Practice setting is added.

## 8. Onboarding

Default: one authored interaction tutorial that visually resembles a normal Easy puzzle. Main Game becomes generated immediately afterward.

## 9. Ternary in difficulty v0.1

Default: all ternary Main Game puzzles are Advanced in the provisional v0.1 classifier. A later manually authored deterministic ruleset may classify simpler ternary puzzles differently without adding a separate top-level Main Game menu.

## 10. Platform and persistence

Default: touch-first, mobile-first, desktop-compatible, local-first, and offline-capable. Accounts and cloud sync remain optional future infrastructure.

## 11. Notes content

Default: authored and scientifically reviewed content stored as versioned structured entries. Do not generate definitions dynamically at runtime.

## 12. Theme and accessibility

Default: light and dark appearance, scalable symbols, reduced motion, sound and haptic controls, left-handed control placement, and colour-independent semantic distinctions.

## 13. Matters intentionally deferred

The following do not block end-product documentation or the MVP:

- monetisation;
- cloud provider;
- social sharing;
- leaderboards;
- classroom administration;
- user-authored puzzles;
- daily shared puzzle;
- exact sound design;
- exact visual theme colours;
- final native versus web packaging.

These may be added only when they preserve the Product Vision and Game Design Constitution.
