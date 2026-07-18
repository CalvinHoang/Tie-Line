# Interaction and Presentation End State

## 1. Visual principle

Tie-Line uses the UI-density and board-first discipline of a clean Minesweeper application. This is a product grammar, not a requirement to imitate another application's exact colours or assets.

The board dominates. Controls appear only when they support the current action.

## 2. Board layout

The active play screen includes:

- full available diagram area;
- axes and sparse numerical markings;
- visible timer;
- compact submission count;
- instruction access;
- a minimal tool area;
- undo;
- submit;
- menu.

There is no persistent dashboard, lesson pane, statistics card, or large title.

## 3. Instruction presentation

All instructions are available simultaneously.

Large screens:

- a compact instruction column or band may remain visible without materially shrinking the board.

Small screens:

- one instruction control opens a sheet containing the complete set;
- the sheet can remain open while the board is partially visible where practical;
- instructions are grouped and scroll as one set;
- closing the sheet never changes puzzle state.

The UI does not reveal instructions one by one.

## 4. Coordinate model

The mature editor presents continuous-looking axes backed by a hidden deterministic semantic grid.

- generated coordinates lie on the semantic grid;
- dragging snaps to legal grid values and semantic constraints;
- temporary coordinate readouts appear during placement;
- visible grid density may vary by mode, but semantic precision is fixed by puzzle definition;
- coordinate acceptance is based on snapped semantic values, not raw pixel tolerance.

## 5. Semantic tools

The domain supports distinct semantic actions even if the visual toolbar is contextual:

- place event or anchor;
- draw ordinary boundary;
- create invariant object;
- create compound object;
- label phase-bearing target;
- select and adjust;
- erase;
- pan and zoom;
- undo.

The toolbar may consolidate tools when the action remains predictable and reversible. It must not infer so aggressively that scientifically wrong but structurally legal input becomes impossible.

## 6. Drawing

For an ordinary boundary:

1. begin at a valid semantic node or frame location;
2. drag toward a valid endpoint;
3. show a clean snapped preview;
4. release to commit a semantic segment;
5. expose limited curvature adjustment on selection.

Raw stroke shape is not authoritative.

Invariant horizontals, line compounds, joins, and ternary boundary objects use specialised constrained gestures.

## 7. Labelling

The phase palette is derived from the puzzle inventory.

The player may:

- select a phase and tap multiple targets;
- drag a phase token to a target;
- add phases in any order;
- remove an individual token in Erase mode.

Insertion order may be preserved visually. Validation uses distinct unordered sets. Duplicate tokens are ignored as input accidents.

The editor does not prevent the player from assigning the wrong number of phases to a target unless the local-invalidity-check setting is enabled; even then, it flags rather than silently corrects.

## 8. Feedback

Before submission, default feedback is limited to interaction syntax:

- snap preview;
- valid structural endpoint affordance;
- selection state;
- blocked malformed gesture;
- undo confirmation.

It does not communicate scientific correctness.

After submission, the board gives a restrained global outcome. Local scientific highlighting appears only when the Settings option permits it.

## 9. Timer and submissions

The active timer is visible but visually subordinate to the diagram. Three compact submission indicators show the remaining scored submissions.

The timer must not become a speed-game demand. It records performance and supports statistics while preserving a quiet solving experience.

## 10. Completion

On success:

- edit handles fade;
- geometry resolves to a clean final diagram;
- a subtle completion motion may trace or settle the constructed topology;
- a compact result sheet appears;
- the solved board remains inspectable.

## 11. Accessibility

The mature product supports:

- light and dark appearance;
- colour-independent phase and error distinctions;
- scalable phase symbols and controls;
- left-handed tool placement;
- reduced motion;
- sound and haptic controls;
- keyboard and mouse operation on desktop;
- touch targets suitable for mobile;
- screen-reader labels for tools, instructions, phase tokens, and result states.

## 12. Onboarding

The first Easy puzzle is an authored onboarding puzzle presented in the same visual language as generated play. It teaches interaction mechanics without redefining Main Game as a campaign.

Tutorial assistance may preplace or demonstrate selected objects. After onboarding, generated Main Game puzzles begin instruction-first with no assumed partial solution unless a generated instruction explicitly locks an element.
