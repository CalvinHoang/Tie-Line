# Main Game Specification

## 1. Purpose

Main Game is the default and primary Tie-Line experience: a continuous stream of complete procedurally generated phase-diagram construction puzzles.

## 2. Puzzle lifecycle

A scored puzzle moves through these states:

```text
generating
ready
active
submitted-incorrect-1
submitted-incorrect-2
solved
failed-scored-attempt
continued-unscored
solution-revealed
abandoned
```

## 3. Generation and start

When a new puzzle is requested:

1. select the current difficulty ruleset and requested difficulty;
2. derive a deterministic puzzle from a random seed;
3. construct and validate the canonical solution;
4. generate the complete instruction set;
5. prove canonical uniqueness;
6. render the empty or minimally initialised board;
7. show all instructions as one complete set;
8. start the visible timer when the puzzle becomes active.

A generation failure is invisible to the player; the generator rejects that candidate and tries another seed.

## 4. Active board

The active board contains:

- diagram axes and composition frame;
- player-created semantic geometry;
- phase symbols and labels;
- compact access to the full instruction set;
- visible active-time timer;
- submissions remaining, represented compactly;
- minimal drawing, selection, erase, undo, and submission controls;
- one menu control.

It does not contain statistics cards, concept lessons, advertisements, a progress campaign, or a persistent inspector.

## 5. Instructions

All puzzle instructions are available from the start. Instructions may be displayed in a compact band on large screens and a dedicated sheet on small screens, but the entire set is inspectable together. Instructions are never described internally or publicly as hidden clues.

The instruction set must be sufficient to reconstruct the unique canonical solution without knowledge of the seed or template.

## 6. Editing

The player may place points, create semantic boundaries, create invariant or compound objects, label phase-bearing cells, modify eligible geometry, remove entries, pan, zoom, and undo.

The editor enforces syntactic geometry while allowing scientific errors.

## 7. Pre-submission feedback

Default Main Game behaviour provides no correctness checking before submission.

The editor may still block malformed gestures that cannot form a valid data structure. Blocking malformed input is not correctness feedback.

A Settings option, **Local invalidity checking**, may be enabled. When enabled it may flag definite local violations of the current formal grammar or explicit instruction coordinates. It must not:

- identify missing objects solely because the puzzle is incomplete;
- reveal where a correct object belongs;
- compare against the hidden complete answer;
- perform solver-backed next-step hints.

The setting is off by default.

## 8. Submission budget

Each scored puzzle has exactly three submissions.

### Incorrect first or second submission

- consume one submission;
- keep the timer running;
- preserve the construction;
- show only that the submission is incorrect, incomplete, or malformed at the broad outcome level;
- do not reveal answer geometry;
- return control to the player.

When local invalidity checking is enabled, the result may additionally retain local rule highlighting that would have been available before submission.

### Correct submission

- mark the puzzle solved;
- stop the timer;
- record statistics;
- lock the semantic construction against accidental editing;
- show the result state.

### Incorrect third submission

- mark the scored attempt unsuccessful;
- stop the scored timer;
- record the failed attempt;
- offer Continue unscored, Reveal solution, and New puzzle.

## 9. Unscored continuation

Continuing unscored preserves the player's construction and allows unlimited further submissions or local checks. It cannot become a scored solve and cannot count toward the daily streak or no-error statistics.

The interface must clearly indicate that the timer and scored attempt have ended without covering the board in warning chrome.

## 10. Reveal solution

Reveal solution displays the canonical semantic construction. Player and solution layers may be compared, but the solution must be visually distinguished. Revealing ends any remaining scored status.

The solution view may link to relevant Notes entries, but it should not force a lesson.

## 11. Result state

A successful result state contains:

- solved diagram;
- selected difficulty;
- completion time;
- submissions used;
- no-error status;
- assisted/local-check status;
- reproducible puzzle code or seed identifier;
- Next puzzle;
- optional View details.

It should be a compact overlay or sheet, not a dashboard replacing the diagram.

## 12. No-error definition

A **no-error solve** is a scored solution accepted on the first submission without revealing the solution. Whether local invalidity checking was enabled is stored separately so statistics can distinguish assisted and unassisted no-error solves without changing the definition.

## 13. Daily streak eligibility

A day counts when the player successfully completes at least one scored Main Game puzzle during the local calendar day. Practice, failed attempts, revealed solutions, and unscored continuation do not count.

A failed puzzle does not break the streak if another scored puzzle is solved that day.

## 14. Abandonment

The player may abandon an in-progress puzzle. Abandonment:

- stops the timer;
- records an abandoned scored attempt;
- does not reveal the solution automatically;
- allows a replacement puzzle to be generated;
- does not consume or lock a difficulty.

## 15. Offline behaviour

Generated puzzle definitions, canonical answers, instructions, and state should be stored locally once issued. A current puzzle remains playable offline. The end product should not require a network round trip for each move or submission.
