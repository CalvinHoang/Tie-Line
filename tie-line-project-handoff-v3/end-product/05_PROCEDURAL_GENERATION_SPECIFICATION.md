# Procedural Generation Specification

## 1. Principle

Procedural generation in Tie-Line means generating a legal semantic phase diagram and then deriving a complete puzzle from it. It does not mean drawing random curves and attempting to interpret them afterward.

The generator is template-driven at the topology level and parameterised at the coordinate, phase, reaction, and instruction levels. This approach remains compatible with a broad grammar while making legality and uniqueness auditable.

## 2. Puzzle identity

A puzzle is reproduced by the tuple:

```text
seed
generatorVersion
formalRulesVersion
instructionLanguageVersion
difficultyRulesetVersion
topologyLibraryVersion
```

A user-facing puzzle code may encode or reference this tuple.

## 3. Generation pipeline

### Stage 1: Select eligibility profile

Input:

- requested difficulty;
- current deterministic difficulty ruleset;
- supported formal-rules version;
- enabled topology library.

Output:

- permitted diagram family;
- permitted invariant types;
- allowed intermediate phases;
- coordinate and instruction constraints;
- target structural range.

### Stage 2: Select canonical topology template

Choose a legal topological skeleton rather than a rendered diagram. A template defines:

- phases and phase kinds;
- event ordering;
- invariant-reaction templates;
- compounds and fixed compositions;
- incidence between cells, interfaces, and events;
- unary edge sequences;
- binary or ternary family.

Templates are composable grammar productions where scientifically valid composition is proven.

### Stage 3: Assign abstract inventory

Assign abstract component and phase labels from a declared inventory. The phase palette must disclose permitted labels but not correct assemblages.

### Stage 4: Parameterise geometry

Assign temperatures and compositions under explicit constraints:

- correct event ordering;
- invariant horizontality or ternary event geometry;
- line-compound verticality;
- positive-area fields;
- minimum visual separation;
- non-crossing monotone branches;
- axis bounds;
- grid compatibility;
- no degenerate cells;
- no values that create accidental alternate topology.

Rendering curves are generated only after semantic coordinates and incidence are fixed.

### Stage 5: Build canonical cell complex

Construct the full labelled stratified cell complex. Derive ordinary interface types from incident assemblages rather than assigning them cosmetically.

### Stage 6: Validate scientific legality

Run all structural, field, adjacency, tie-line, invariant, compound, unary, and completeness rules supported by the selected formal grammar.

Reject on any failure.

### Stage 7: Generate instructions

Choose instruction forms permitted by the requested difficulty. Generate deterministic text or notation from semantic facts. Runtime prose must come from controlled templates rather than unconstrained language generation.

### Stage 8: Verify instruction consistency and sufficiency

Parse the generated instruction set back into formal constraints. Confirm that:

- every instruction is true of the canonical solution;
- instructions do not contradict one another;
- all required symbols are declared;
- every numerical value is representable on the puzzle grid;
- the instructions do not accidentally reveal excluded hidden metadata.

### Stage 9: Prove canonical uniqueness

Enumerate or solve for all legal completions under the current grammar and instruction constraints. Canonicalise each completion. Accept only when exactly one canonical completion remains.

Uniqueness ignores cosmetic curve shape and label placement.

### Stage 10: Classify difficulty

Apply the versioned deterministic difficulty ruleset to the generated semantic puzzle and instruction set. The resulting category must match the requested mode. Otherwise reject or regenerate.

### Stage 11: Quality filters

Reject puzzles with:

- visually unplayable narrow regions;
- nearly coincident anchors;
- excessive instruction length for the target mode;
- redundant instructions that trivialise the puzzle beyond the mode;
- unstable face extraction under permitted drawing tolerance;
- inaccessible touch targets;
- semantically equivalent but visually misleading arrangements.

### Stage 12: Serialize

Store:

- public puzzle definition;
- complete instructions;
- hidden canonical solution;
- canonical hash;
- seed and version tuple;
- difficulty feature vector and result;
- validation report.

## 4. Topology library

The topology library is the authoritative set of generator productions for a formal-rules version. It should begin with simple binary families and expand deliberately.

Each template requires:

- formal name and stable ID;
- supported phase inventory;
- event and incidence schema;
- legal parameter ranges;
- instruction-generation coverage;
- canonicalisation tests;
- valid and invalid fixtures;
- associated Notes entries;
- at least one real-system or authoritative schematic regression reference where available.

## 5. Generator randomness

Randomness may choose:

- topology template within mode eligibility;
- number and type of intermediate phases;
- abstract labels;
- legal event temperatures and compositions;
- equivalent visual layout parameters;
- instruction forms allowed by difficulty;
- order of instructions on screen, provided grouping remains readable.

Randomness may not bypass validation or determine scientific truth after rendering.

## 6. Reproducibility

Generation must be deterministic for a complete puzzle identity. Changing a generator or rules version may change the result for the same raw seed, which is why all version identifiers are part of the identity.

## 7. Canonical uniqueness

Two completions are canonically identical when they agree on all semantically relevant features, including:

- declared phases and kinds;
- event roles and required coordinates within formal tolerance;
- invariant reaction types and participating phases;
- incidence graph;
- phase-bearing cells and assemblages;
- interface adjacency;
- unary-edge sequences;
- compound placement and behaviour;
- required ordering and ternary compatibility structure.

They may differ in:

- Bézier control points;
- harmless curve smoothness;
- phase-token insertion order;
- label screen position;
- viewport and zoom;
- rendering theme.

## 8. Generation limits

A template or scientific feature is not eligible for Main Game until the product has:

- formal rules;
- canonical representation;
- a generator production;
- an instruction vocabulary;
- a uniqueness method;
- a validator;
- Practice coverage;
- a Notes definition;
- tests.

This prevents unsupported science from entering through content alone.
