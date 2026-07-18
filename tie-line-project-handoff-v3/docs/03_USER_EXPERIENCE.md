# Tie-Line User Experience

Tie-Line opens directly into the current puzzle.

There is no home dashboard between the player and the board. The screen shows an empty temperature-composition frame, component labels A and B, and a compact instruction strip containing the facts of a fictional system.

For the golden puzzle, the instructions appear in compact notation such as:

```text
A 1000°   B 850°   E 700°·40%B
α@E 10%B   β@E 80%B
```

The instructions can collapse to a small symbol while the player works.

## Placing the thermodynamic anchors

The player selects the Point tool. The available instruction-defined point symbols appear in a small temporary row.

They choose the A melting point and place it on the left edge at 1000°C. The point snaps cleanly to the edge and grid.

They place the B melting point, the three eutectic-temperature phase compositions, and the low-temperature solvus endpoints.

The app does not draw the diagram for them. It only regularises the input so the intended coordinate is machine-readable.

## Constructing the topology

The player selects Curve and drags between anchors.

A faint raw trace follows the gesture. A clean candidate curve appears over it. On release, the raw trace disappears and the constrained curve remains.

The player chooses what connects to what. The editor prevents accidental gaps and illegal geometric crossings, but it allows the player to create the wrong scientifically meaningful topology.

The invariant horizontal is drawn with the Horizontal tool. It snaps exactly through the three anchors at the eutectic temperature.

As the topology closes, phase fields become selectable.

## Labelling

The player selects a phase symbol:

```text
L   α   β
```

They tap a field to add it. Selecting another phase and tapping the same field appends that phase.

The order is preserved visually. `α + L` and `L + α` are both allowed and semantically equivalent.

The player may put three phases in a 2-D field or one phase on the invariant horizontal. Tie-Line does not prevent scientific mistakes through the input controls.

## Correcting

Erase mode changes the meaning of a deliberate tap:

- tap a phase symbol to remove only that phase;
- tap a player curve to remove it;
- tap a player point to remove it when no remaining geometry depends on it.

Undo is always visible but unobtrusive.


## Submission

The player works without correctness feedback before submission by default.

The visible timer continues while the puzzle is active. Three compact submission indicators show the scored attempts remaining.

On the first or second incorrect submission, Tie-Line reports only the broad outcome and returns the player to the unchanged construction. It does not point to the answer.

An optional Settings preference may enable local invalidity checking. When enabled, definite local rule violations may pulse or outline and may link to a short rule explanation, but the hidden solution is never used as a hint.

## Deduction loop

The intended loop is:

> read instructions → place anchors → infer a connection → draw it → infer neighbouring fields → label them → submit

Each solved relationship constrains the remaining diagram.

## Solving

On Submit, Tie-Line verifies coordinates, topology, cell structure, labels, and invariant geometry. The player has three scored submissions.

Exact curve shape is ignored once the correct incidence and legal topology are present.

A correct submission stops the timer. A third incorrect submission also stops the scored timer and offers unscored continuation, solution reveal, or a new puzzle.

When solved, control points and editing affordances fade. The finished phase diagram remains on screen. A restrained completion animation runs and a small next control appears.

A compact result sheet shows completion time, submissions used, and no-error status. There is no score dashboard.

## Leaving and returning

The puzzle saves automatically. Reopening Tie-Line restores the same points, curves, labels, and viewport directly.

Settings, puzzle selection, statistics, and scientific reference material live outside the active board.

## Overall character

Tie-Line should feel like a board puzzle, not a diagram editor and not a digital textbook.

The facts are the instructions.

The points, lines, and phase symbols are the pieces.

The phase diagram is the board.
