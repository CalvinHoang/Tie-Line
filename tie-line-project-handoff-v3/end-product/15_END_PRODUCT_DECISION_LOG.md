# End-Product Decision Log

## Product identity

1. Product name is **Tie-Line**.
2. Tie-Line is a geometric phase-diagram deduction game.
3. The phase diagram is the board.
4. The active-board aesthetic is minimal and board-first, using Minesweeper: The Clean One as a UI-density reference.
5. The application opens directly into Main Game.

## Main Game

6. Main Game puzzles are procedurally generated.
7. Easy, Normal, and Advanced are always available.
8. Difficulties are modes and are never completed.
9. The player completes individual puzzles.
10. Main Game uses abstract component and phase labels.
11. Every puzzle has one canonical semantic solution and requires no guessing.
12. All instructions are shown from the start and remain available together.
13. User-facing terminology is **instructions**, not clues.
14. The visible timer runs during active play and is stored in statistics.
15. Each puzzle permits exactly three scored submissions.
16. Default Main Game provides no correctness checking before submission.
17. Settings may enable local invalidity checking.
18. Local checking may identify definite local violations but may not reveal the hidden solution.
19. A correct submission stops the timer and records the solve.
20. An incorrect first or second submission consumes one attempt and preserves editing.
21. An incorrect third submission ends the scored attempt and stops the timer.
22. After third failure, the player may continue unscored, reveal the solution, or generate a new puzzle.
23. Unscored completion does not count toward streaks or scored solves.
24. Generated puzzles use reproducible seeds plus version identifiers.

## Difficulty

25. Difficulty is determined only by versioned design rules based on puzzle structure and instruction semantics.
26. Difficulty never updates automatically from real-time or historical player performance data.
27. Known difficulty factors include invariant type, number of invariants, number of intermediate phases, congruent or incongruent behaviour, instruction form, and deduction depth.
28. Exact thresholds may be manually revised only through a new deterministic ruleset version.

## Application areas

29. The menu contains Main Game, Practice, Notes, Statistics, and Settings.
30. Main Game contains Easy, Normal, and Advanced.
31. Practice ultimately covers every supported concept.
32. Practice is generated, focused, unlimited in attempts, and separate from Main Game scoring.
33. Notes is a reference manual of definitions, invariants, rules, and procedures.
34. Statistics includes daily streaks, puzzles solved, completion time, and no-error solves.
35. Settings contains genuine interaction, display, accessibility, and local-check preferences rather than scientific rules.

## Interaction

36. Constrained semantic drawing is authoritative.
37. Raw freehand traces are not authoritative geometry.
38. The editor blocks malformed geometry but permits scientific mistakes.
39. Players may add declared phases to a target in any order.
40. Semantic assemblages are unordered distinct sets.
41. Duplicate phase tokens are ignored as input accidents.
42. Erase mode removes individual phase tokens or player-created geometry.
43. Cosmetic curve shape does not determine correctness.

## Science and content

44. Formal Rules v0.2 is the authoritative initial binary grammar.
45. Ternary content in v0.2 is non-binding until rewritten as a full formal grammar.
46. The supplied course notes are a primary taxonomy and validation source for binary and ternary coverage.
47. Real systems are used for regression, reference, and curated content rather than ordinary generated Main Game puzzles.
48. New concepts require formal rules, generation, instructions, validation, uniqueness, Practice, Notes, and tests.

## Architecture

49. Thermodynamic domain logic remains independent of the UI.
50. The generator starts from semantic topology rather than random rendered curves.
51. Puzzle identity includes seed and generator, grammar, instruction, topology-library, and difficulty versions.
52. Player statistics describe performance but do not govern generation or difficulty.
