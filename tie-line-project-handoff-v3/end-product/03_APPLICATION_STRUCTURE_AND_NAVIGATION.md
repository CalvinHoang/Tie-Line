# Application Structure and Navigation

## 1. Launch behaviour

Tie-Line opens directly into the most recently active scored Main Game puzzle.

- On first launch, it opens an Easy onboarding puzzle.
- On later launches, it restores the exact active board, instruction state, timer, viewport, submissions remaining, and edits.
- When there is no current puzzle, it immediately generates one in the last selected difficulty; the first default is Easy.

There is no mandatory home screen.

## 2. Main menu

A small, low-prominence menu control opens the application navigation over or beside the paused board.

Primary destinations:

```text
Main Game
  Easy
  Normal
  Advanced
Practice
Notes
Statistics
Settings
```

Closing the menu restores the board exactly.

## 3. Main Game navigation

Easy, Normal, and Advanced are all available from the beginning. No difficulty is unlocked or completed.

The application maintains one resumable scored puzzle per difficulty. Switching difficulty pauses the current puzzle and resumes or generates the selected difficulty's puzzle. This prevents accidental loss while preserving the immediate-play model.

Each difficulty page may show only compact status:

- current seed or puzzle identifier;
- in-progress or ready state;
- elapsed active time;
- submissions remaining;
- start/resume control.

It must not become a campaign map or level grid.

## 4. Practice navigation

Practice opens a concept browser organised by diagram family and concept category.

Example structure:

```text
Binary
  Coordinates and fields
  Boundaries and tie lines
  Invariant reactions
  Compounds and transformations
  Cooling and phase fractions
  Error identification
Ternary
  Composition and joins
  Compatibility triangles
  Liquidus projections
  Cotectics and temperature direction
  Invariant points
  Isothermal sections
  Crystallisation paths
```

Selecting a concept starts a generated focused exercise. Practice preserves its own most recent exercise but never replaces the active Main Game puzzle.

## 5. Notes navigation

Notes supports:

- alphabetical index;
- category index;
- search;
- related-entry links;
- direct links from Practice and result states.

Opening Notes from a rule reference goes to the relevant definition without exposing the current puzzle's solution.

## 6. Statistics navigation

Statistics is a separate page containing daily streaks, puzzle counts, time, no-error solves, and recent history. Nothing from this page is persistently visible around the board except the active timer.

## 7. Settings navigation

Settings contains presentation and interaction preferences, including the optional local-invalidity-check setting. Scientific grammar and difficulty rules are not user settings.

## 8. Pause rules

The scored timer pauses when:

- the application is backgrounded;
- the menu is open;
- the player leaves Main Game for Practice, Notes, Statistics, or Settings;
- the browser or device suspends the application.

The timer does not pause merely because the player is reading the instructions on the active puzzle screen.

## 9. Back behaviour

Back navigation should preserve work:

- leaving an editor returns to its parent screen without discarding changes;
- leaving a puzzle pauses rather than abandons it;
- abandoning a puzzle requires an explicit action;
- generating a replacement puzzle requires confirmation when a scored puzzle is in progress.

## 10. Completion transition

A successful submission produces a restrained result state over the solved board. The player can inspect the diagram, view the result summary, or begin the next puzzle. The application does not automatically replace the solved diagram before the player acknowledges completion.
