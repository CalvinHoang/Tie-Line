# MVP Validator Specification

This is the executable subset required for the first Tie-Line build.

## 1. Validation order

1. Structural geometry.
2. Point instruction coordinates.
3. Required geometry incidence.
4. Face count and topology.
5. Dimensional assemblage checks.
6. Field semantic matching.
7. Invariant semantic matching.
8. Completeness and extra structure.

## 2. Structural rules

### M-S1

Every player curve has two distinct committed point endpoints.

### M-S2

No committed curves cross, self-intersect, overlap, or touch except at shared endpoints or declared invariant incidence.

### M-S3

Every invariant object is exactly horizontal.

### M-S4

The committed frame and geometry produce a deterministic planar embedding.

### M-S5

On Submit, all extracted 2-D fields are closed and positive-area.

### M-S6

No player geometry has a free endpoint.

## 3. Point rules

### M-P1

Every required point role is placed exactly once.

### M-P2

Each point satisfies its placement constraint class.

### M-P3

When optional local invalidity checking is enabled, a placed point at a coordinate different from its explicit instruction value is a definite contradiction.

### M-P4

On Submit, every point coordinate equals the golden solution coordinate exactly after snapping.

## 4. Geometry rules

### M-G1

On Submit, exactly six ordinary curves exist.

### M-G2

Each required unordered endpoint pair exists exactly once.

### M-G3

Exactly one invariant horizontal exists.

### M-G4

The invariant connects `alpha-eut` to `beta-eut` and contains `eutectic` as an ordered interior node.

### M-G5

No extra curve or horizontal exists.

### M-G6

Curve control points are ignored except for structural monotonicity and intersection legality.

## 5. Cell rules

### M-C1

On Submit, exactly six bounded 2-D fields exist.

### M-C2

Every field has at least one phase on Submit.

### M-C3

Every 2-D field has one or two distinct phases.

### M-C4

Field assemblage comparison is unordered.

### M-C5

Each solution witness point lies inside exactly one extracted field and that field has the expected assemblage.

## 6. Invariant rules

### M-I1

The invariant horizontal is a phase-bearing 1-D target.

### M-I2

On Submit it contains exactly `{L, α, β}`.

### M-I3

With optional local invalidity checking enabled, an invariant carrying more than three distinct phases is a definite dimensional contradiction. A subset remains unresolved during partial construction. Submit requires all three expected phases.


## 7. Optional local invalidity policy

The default MVP exposes no pre-submission correctness check.

When the Settings preference is enabled, local validation reports:

- M-S failures in committed geometry;
- M-P3 point contradictions;
- M-C3 too-many-phase dimensional errors;
- undeclared phase IDs;
- locked-element violations;
- local incidence contradictions that cannot be repaired by adding missing objects.

It does not report:

- missing points;
- missing curves;
- missing labels;
- one- or two-phase partial invariant labels;
- wrong field labels based only on hidden-solution comparison.

## 8. Submit outcomes

### Solved

All rules pass.

### Incomplete

The graph remains structurally interpretable but required points, geometry, or labels are missing.

### Incorrect

The construction is complete enough to evaluate but differs semantically from the required solution.

### Malformed

The planar structure cannot be interpreted.

## 9. Error reporting

For each offending object, show one earliest rule violation.

Default board response:

- local outline or pulse;
- no large text.

On tap, show one concise sentence and rule ID.


## 9. Submission lifecycle

The validator is called for up to three scored submissions. Incorrect or incomplete results consume an attempt. The third non-solved result returns `failed-scored-attempt` at the game-state layer and stops the timer. The player construction remains available for unscored continuation or solution reveal.
