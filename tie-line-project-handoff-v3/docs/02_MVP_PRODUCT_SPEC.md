# Tie-Line MVP Product Specification

## 1. Product thesis

Tie-Line is a logic game in which the player reconstructs a phase diagram from facts about a fictional material system.

The default puzzle begins with an almost empty temperature-composition board and a compact symbolic instruction set. The player places thermodynamic anchors, draws the topology, and labels phase-bearing objects.

The experience should feel closer to Minesweeper than to a conventional materials-science lesson.

## 2. Frozen MVP scope

The MVP contains one hand-authored binary simple-eutectic puzzle with limited terminal solid solubility.

The player must:

1. place seven anchors from numerical instructions;
2. draw six ordinary curved interfaces;
3. draw one invariant horizontal;
4. label six 2-D fields;
5. label the invariant horizontal;
6. submit the completed diagram.

Declared phases:

- `L`
- `α`
- `β`

Expected 2-D fields:

- `{L}`
- `{α}`
- `{β}`
- `{L, α}`
- `{L, β}`
- `{α, β}`

Expected invariant assemblage:

- `{L, α, β}`

## 3. Default starting state

Visible at puzzle start:

- empty diagram frame;
- temperature axis and composition axis;
- component labels `A` and `B`;
- compact instruction strip;
- visible active timer;
- three compact submission indicators;
- tiny tool controls;
- phase palette only when Label is active.

Not visible at puzzle start:

- anchor points;
- ordinary interfaces;
- invariant horizontal;
- field labels;
- boundary classifications;
- reaction name;
- solution geometry;
- instructions paragraph.

## 4. Golden instruction set

The first puzzle displays only concise notation:

```text
A 1000°
B 850°
E 700° · 40%B
α@E 10%B
β@E 80%B
α@0 0%B
β@0 100%B
```

Interpretation:

- pure A melts at 1000°C;
- pure B melts at 850°C;
- eutectic liquid composition is 40% B at 700°C;
- α composition at the eutectic is 10% B;
- β composition at the eutectic is 80% B;
- the low-temperature α and β solvus endpoints are at the pure-component ends.

The actual screen should use a more compact typeset version, not explanatory prose.

## 5. Core player loop

1. Inspect the instructions.
2. Select Point.
3. Place each instruction-defined anchor on the snapped board.
4. Select Curve or Horizontal.
5. Draw constrained connections.
6. Select Label.
7. Add phases to fields and the invariant horizontal.
8. Revise using Select, Erase, or Undo.
9. Submit, with three scored submissions available.
10. On success, see the clean solved diagram and result summary.
11. After a third failure, continue unscored, reveal, or begin a new puzzle.

## 6. Tool set

Persistent or quickly accessible modes:

- **Point**: place a semantic anchor.
- **Curve**: draw an ordinary constrained interface.
- **Horizontal**: draw an exact invariant horizontal.
- **Label**: apply phase tokens.
- **Select**: inspect or adjust one object.
- **Erase**: remove one phase token or one player-created object.

Undo is always available. Reset and settings live in a compact overflow control.

## 7. Anchor placement

The player chooses a instruction-defined anchor type, then taps or drags it onto the board.

Anchor classes in the golden puzzle:

- A melting point;
- B melting point;
- α composition at eutectic temperature;
- eutectic liquid point;
- β composition at eutectic temperature;
- low-temperature α solvus endpoint;
- low-temperature β solvus endpoint.

Placement rules:

- coordinates snap to the semantic grid;
- edge-constrained anchors remain on their required frame edge;
- invariant-temperature anchors snap to the stated temperature line;
- composition values snap to the stated composition;
- a placed anchor can be selected and moved until geometry depends on it;
- moving an incident anchor moves attached geometry or requires explicit confirmation;
- the UI must not place anchors automatically from the instructions.

Because the instruction itself gives exact coordinates, a conflicting coordinate is a direct instruction error. It is not shown before submission unless optional local invalidity checking is enabled.

## 8. Scientific error freedom

The editor must permit scientific mistakes.

The player may:

- place an anchor at an incorrect instruction coordinate;
- connect the wrong structurally compatible anchors;
- create the wrong field arrangement;
- label a 2-D field with zero, one, two, or three phases;
- label the invariant horizontal with any subset of phases;
- add phases in any order.

The editor prevents only malformed geometry and impossible input syntax.

## 9. Assemblage entry

The player may add a phase by:

- selecting a phase and tapping targets; or
- dragging a phase symbol onto a target.

Rules:

- insertion order is preserved visually;
- semantic comparison uses an unordered set;
- duplicates are ignored;
- empty targets are allowed during play;
- no phase-count restriction is enforced by the editor;
- Erase removes individual tokens.


## 10. Pre-submission checking

The default MVP play screen has no correctness Check action.

The editor blocks malformed gestures but does not report scientific correctness before submission. An optional local-invalidity-check preference may be implemented if it is clearly off by default and reports only definite local violations without comparing against the hidden full solution.


## 11. Submit

The puzzle permits three scored submissions.

- A correct submission stops the visible active timer and solves the puzzle.
- The first or second incorrect submission consumes one attempt, preserves the construction, and permits continued editing.
- The third incorrect submission ends the scored attempt and stops the timer.
- After third failure, the player may continue unscored or reveal the hidden fixture solution.

Submission feedback is broad by default and must not reveal answer geometry.

## 12. Solved state

When solved:

- editing handles and anchor affordances fade;
- geometry resolves to a uniform clean rendering;
- the complete diagram remains nearly full screen;
- a small next control appears;
- no score card or lesson modal interrupts the board.

A short optional explanation may be opened separately.

## 13. Tutorial mode

Tutorial puzzles may reveal some anchors or partial boundaries.

This is an onboarding variant only. It is not the default core Tie-Line experience.

## 14. Persistence

Autosave after every committed action.

Restore:

- placed anchors;
- geometry;
- phase labels and insertion order;
- viewport;
- elapsed active time;
- submissions remaining and scored status;
- solved or failed state.

## 15. Mobile-first requirements

The MVP works at 320 CSS pixels wide.

Required:

- large invisible hit targets;
- pinch zoom and two-finger pan;
- no page scroll during board gestures;
- compact bottom controls;
- transient instruction strip;
- no permanent feedback sheet;
- no surrounding dashboard.

## 16. Non-goals

Not included:

- multiple generated puzzles;
- procedural generation;
- uniqueness solver;
- line compounds;
- peritectic, eutectoid, or peritectoid gameplay;
- ternary diagrams;
- boundary-type labelling by the player;
- accounts, cloud sync, leaderboards, or backend;
- exact real material data;
- long teaching copy on the board.

## 17. Success criteria

The MVP succeeds if:

1. a first-time player can place points, draw, label, erase, and submit with minimal onboarding;
2. the player feels they reconstructed the diagram from facts;
3. the board remains the dominant visual object;
4. mistakes are about reasoning, not pointer precision;
5. the editor does not leak the answer;
6. cosmetic curve variation does not affect correctness;
7. the flow works smoothly on mobile and desktop.
