# Decision Log

## Authoritative decisions

1. Product name is **Tie-Line**.
2. Assistant's Formal Rules v0.2 is authoritative.
3. The game is a geometric deduction puzzle, not a multiple-choice quiz.
4. The default core puzzle is instruction-first, not a partly drawn diagram.
5. Tutorial variants may reveal anchors or partial geometry.
6. Constrained drawing is the core input model.
7. Raw freehand strokes are not authoritative geometry.
8. The editor blocks malformed geometry but permits scientific mistakes.
9. Players may place phase combinations of any permitted size and order.
10. Duplicate phase tokens are ignored.
11. Erase mode removes individual phase tokens or player geometry.
12. Tie-Line uses a minimal board-first UX inspired by Minesweeper: The Clean One.
13. There is no play-screen dashboard.
14. The instruction strip uses compact notation and may collapse.
15. The MVP includes player placement of instruction-defined anchors.
16. Correctness ignores cosmetic curve shape.
17. Check gives only definite local contradictions.
18. Submit gives complete verification.
19. No solver-backed hint mode in MVP.
20. The golden system is fictional and simple eutectic with terminal solubility.

## Deferred

- procedural generation;
- uniqueness checker;
- real-system puzzle library;
- compounds;
- other binary invariant types;
- ternary liquidus projections;
- accounts and statistics screens;
- pencil marks;
- advanced relational instructions;
- experimental-data instructions;
- dark theme.

## Superseding end-product and revised-MVP decisions

21. User-facing puzzle facts are called **instructions**, not clues.
22. Main Game has no correctness checking before submission by default.
23. Local invalidity checking is an optional Settings preference and is off by default.
24. Each scored puzzle permits three submissions.
25. The active timer is visible and stored in statistics.
26. Third incorrect submission ends the scored attempt and stops the timer.
27. After third failure, continue unscored or reveal solution is permitted.
28. Main Game is ultimately procedurally generated with reproducible seeds.
29. Easy, Normal, and Advanced are always available and are not campaigns.
30. Difficulty is deterministic from puzzle rules and never recalibrated automatically from player data.
31. Practice ultimately covers every supported concept.
32. Notes is a reference manual of definitions and rules.
33. The application opens directly into Main Game; menu contains Main Game, Practice, Notes, Statistics, and Settings.
