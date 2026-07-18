# Practice Specification

## 1. Purpose

Practice lets the player deliberately train one phase-diagram concept or operation at a time. It covers every concept supported by the mature grammar and does not affect Main Game streaks or scored statistics.

## 2. Behaviour

Practice exercises are:

- procedurally generated;
- selected by concept rather than difficulty campaign;
- usually partial-diagram or focused tasks;
- untimed by default;
- unlimited in attempts;
- permitted to give immediate local feedback;
- linked to the relevant Notes definitions;
- repeatable with a new seed.

Practice may record completion history for convenience, but it does not adapt scientific content or reclassify difficulty from performance.

## 3. Exercise forms

Practice may ask the player to:

- place one or more events;
- select the correct reaction object;
- draw a missing boundary;
- complete a local topology;
- label fields or lower-dimensional cells;
- identify an invalid construction;
- determine phases at a point;
- trace a cooling path;
- apply the lever rule;
- construct a full diagram restricted to one concept;
- complete a ternary compatibility or projection step.

## 4. Binary concept catalogue

The mature Practice library includes at least:

### Coordinates and fields

- reading composition and temperature axes;
- phase inventory and assemblage notation;
- one-phase and two-phase fields;
- lower-dimensional compound and invariant cells;
- Gibbs phase-rule dimensional intuition where applicable.

### Boundaries and tie lines

- liquidus;
- solidus;
- solvus;
- tie-line endpoints;
- phase identification at a coordinate;
- phase fractions and lever rule;
- invalid adjacency recognition.

### Solubility families

- complete solid solubility;
- limited terminal solid solubility;
- terminal and intermediate phases;
- solid-state miscibility gaps when enabled.

### Invariant reactions

- eutectic;
- peritectic;
- eutectoid;
- peritectoid;
- additional binary invariant families only after their formal-rules version enables them.

### Compounds and transformations

- stoichiometric line compounds;
- congruent melting;
- incongruent melting;
- polymorphic transformations;
- multiple intermediate phases.

### Paths and interpretation

- cooling and heating paths;
- first solid and last liquid;
- invariant arrest interpretation;
- microconstituent sequence where included in the scientific scope;
- completing a diagram from mixed numerical and observational instructions.

### Error identification

- crossings;
- illegal terminations;
- wrong dimensional labels;
- impossible invariant ordering;
- illegal phase adjacency;
- incomplete decomposition;
- incorrect unary edges.

## 5. Ternary concept catalogue

The mature Practice library includes:

- ternary composition coordinates;
- binary joins and sections;
- subsolidus compatibility triangles;
- primary crystallisation fields;
- liquidus projections;
- cotectic boundaries;
- Alkemade joins and related temperature maxima;
- direction of falling temperature;
- ternary eutectic and peritectic invariant points;
- isothermal sections;
- liquid and solid assemblages along cooling paths;
- crystallisation paths and boundary following;
- invalid compatibility and topology recognition.

## 6. Feedback model

Practice may provide:

- immediate local correctness;
- a rule identifier;
- a concise explanation;
- a direct Notes link;
- step reset;
- show answer after an explicit request.

Feedback should explain the governing rule rather than merely announce a wrong answer.

## 7. Relationship to Main Game

Practice and Main Game use the same domain objects, formal validators, instruction types, and rendering primitives. Practice differs in task scope, feedback, and scoring, not in scientific truth.

A concept is not complete in the product until it has:

- at least one Practice generator;
- Notes coverage;
- validator tests;
- a path to use in a full Main Game puzzle where appropriate.
