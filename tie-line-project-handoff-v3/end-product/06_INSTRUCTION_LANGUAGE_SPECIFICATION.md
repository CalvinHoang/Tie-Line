# Instruction Language Specification

## 1. Purpose

The instruction language is the controlled vocabulary through which a generated semantic diagram becomes a player-facing puzzle.

Instructions are facts and requirements, not hints. The entire set is available from the beginning and is sufficient to identify one canonical solution.

## 2. Requirements

Every instruction form must have:

- a stable machine-readable type;
- typed parameters;
- a deterministic compact rendering;
- an optional expanded plain-language rendering;
- a formal constraint interpretation;
- tests for parsing and rendering;
- defined difficulty eligibility.

Runtime instructions should never depend on ambiguous freeform prose.

## 3. Presentation

The player can inspect all instructions together.

Recommended presentation:

- compact notation in a board-adjacent instruction sheet;
- grouping by components, events, phases, and relationships;
- expanded wording on tap where needed;
- no one-at-a-time reveal sequence;
- no requirement to memorise instructions before returning to the board.

On a small screen, the instruction sheet may overlay part of the board while open, but it preserves the complete set and can remain open during construction.

## 4. Core binary instruction families

### 4.1 Component and axis declarations

Examples:

```text
Components: A–B
Horizontal axis: 0–100%B
Temperature: 0–1100°C
```

### 4.2 Phase inventory

```text
Phases: L, α, β, γ
γ is a line compound.
```

The inventory permits input; it does not state where phases belong.

### 4.3 Exact melting facts

```text
A melts at 1000°C.
B melts at 850°C.
```

Formal constraint: unary melting event at the specified edge and temperature.

### 4.4 Exact invariant facts

```text
E₁ occurs at 40%B and 700°C.
At E₁: L → α + β.
```

The reaction statement and event coordinate may be separate instructions.

### 4.5 Phase composition at an event

```text
At E₁, α contains 10%B.
At E₁, β contains 80%B.
```

### 4.6 Terminal solubility facts

```text
At 300°C, α contains at most 4%B.
At 300°C, β contains at least 94%B.
```

### 4.7 Compound facts

```text
γ has composition 60%B.
γ melts congruently at 920°C.
γ forms peritectically at P₁.
```

### 4.8 Reaction facts

Supported forms correspond exactly to the current formal grammar, for example:

```text
L → α + β
α + L → β
α → β + γ
α + β → γ
```

Later formal-rules versions may add liquid-immiscibility and other invariant families.

### 4.9 Ordering relationships

```text
E₁ is hotter than E₂.
P₁ lies to the B-rich side of γ.
The composition of E₁ is between α and γ.
```

### 4.10 Adjacency and incidence relationships

```text
The L + α field is adjacent to the A edge.
γ terminates at C₁.
The E₁ horizontal meets γ.
```

These are used cautiously because overly direct incidence statements can trivialise a puzzle.

### 4.11 Cooling and observation instructions

```text
At 35%B, α is the first solid to form on cooling.
At 65%B, the last liquid disappears at E₂.
At 500°C and 45%B, the stable phases are α and γ.
```

These translate physical observations into constraints without naming every boundary.

### 4.12 Quantitative phase-fraction instructions

Where lever-rule concepts are enabled:

```text
At T₁ and x₀, the fraction of α is 0.40.
```

Such instructions require exact phase-composition endpoints and must be generated only when numerical tolerance is unambiguous.

## 5. Ternary instruction families

### 5.1 Composition-point facts

```text
P contains 20%A, 30%B, and 50%C.
```

### 5.2 Phase and compound inventory

```text
Phases: L, A, B, C, X, Y.
X and Y are stoichiometric compounds.
```

### 5.3 Binary-edge facts

```text
The A–B edge contains one eutectic.
X lies on the A–C join.
```

### 5.4 Compatibility relationships

```text
X is compatible with B.
The stable subsolidus triangles include A–X–B and X–Y–B.
```

The language must distinguish a supplied compatibility fact from a relationship the player is expected to infer.

### 5.5 Primary crystallisation fields

```text
Point P lies in the primary field of X.
A and X share a cotectic boundary.
```

### 5.6 Alkemade and temperature-direction facts

```text
The maximum temperature on this boundary lies on the A–X join.
Temperature decreases from U₁ toward E₁.
```

### 5.7 Ternary invariant facts

```text
At E₁: L → A + X + B.
At P₁: L + X → Y + B.
```

### 5.8 Isothermal-section facts

```text
At T₁, the stable three-phase triangle is A–X–B.
The liquid composition lies on boundary q.
```

### 5.9 Crystallisation-path facts

```text
An alloy starting at P first precipitates X.
The liquid path reaches q before E₁.
```

## 6. Direct and derived instructions

Instructions are classified by the amount of deduction they leave:

- **Direct numerical** — exact coordinate or value.
- **Direct semantic** — exact reaction or phase property.
- **Relational** — ordering, adjacency, compatibility, or containment.
- **Observational** — cooling, phase presence, or fraction at a condition.
- **Composite** — a concise notation encoding multiple typed facts.

Difficulty rules specify which mix is eligible.

## 7. Instruction sufficiency

A complete instruction set must constrain every semantically meaningful degree of freedom required for one canonical solution. The uniqueness solver, not human judgement alone, confirms sufficiency.

## 8. Instruction redundancy

Some redundancy may improve readability or Easy-mode accessibility. Redundancy is allowed only when it does not reduce the puzzle below the target difficulty or introduce a second interpretation.

## 9. Terminology

User-facing documents and UI use **instructions**. Legacy MVP code may temporarily contain fields named `clues`; these are migration targets and must not define the mature domain vocabulary.
