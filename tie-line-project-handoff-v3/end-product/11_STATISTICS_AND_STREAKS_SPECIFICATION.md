# Statistics and Streaks Specification

## 1. Purpose

Statistics record play without affecting puzzle generation, scientific rules, or difficulty classification.

## 2. Required statistics

The Statistics page includes:

- current daily streak;
- longest daily streak;
- total scored puzzles solved;
- solved puzzles by difficulty;
- total scored attempts;
- successful and unsuccessful attempts;
- completion time for each solved puzzle;
- average completion time;
- best completion time;
- no-error solves;
- no-error solve rate;
- recent puzzle history.

Useful additional breakdowns may include assisted versus unassisted local checking and binary versus ternary family when those fields exist.

## 3. Timer

The visible timer measures active scored puzzle time.

It starts when the active puzzle is presented and ready for interaction. It pauses while the application is backgrounded, suspended, or outside the active Main Game board. It continues after the first and second incorrect submissions. It stops on:

- successful submission;
- third incorrect submission;
- abandonment.

Unscored continuation may use a separate exploratory timer but cannot alter the recorded scored time.

## 4. Daily streak

A local calendar day qualifies when at least one scored Main Game puzzle is solved during that day.

The following do not qualify:

- Practice completion;
- failed scored attempt;
- unscored continuation solve;
- revealed solution;
- viewing Notes;
- completing only an onboarding interaction without an accepted scored puzzle, unless the onboarding puzzle is explicitly recorded as scored.

One failure does not break a day if another puzzle is solved before the local day ends.

## 5. No-error solve

A no-error solve is accepted on the first scored submission without solution reveal. Store whether local invalidity checking was enabled as separate metadata.

## 6. Puzzle history record

Each scored attempt records:

- puzzle identity and seed tuple;
- difficulty and difficulty-ruleset version;
- diagram family;
- start and end timestamps;
- active duration;
- submission count;
- outcome;
- no-error status;
- local-invalidity-check setting;
- whether continued unscored;
- whether solution revealed;
- generator and formal-rules versions.

Player geometry history is not required for ordinary statistics and should not be retained indefinitely by default.

## 7. Privacy and persistence

The initial product should be local-first. Statistics and current puzzles persist on the device without requiring an account. A future optional account or sync layer may replicate the same versioned records but must not be required for play.

## 8. No adaptive use

Statistics are never used automatically to:

- reclassify a puzzle;
- alter difficulty rules;
- hide or unlock modes;
- personalise scientific content;
- change the number of submissions;
- modify the generator distribution.
