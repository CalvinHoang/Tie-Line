# Golden Puzzle: Instruction-First Binary Eutectic

## 1. Purpose

This is the only playable puzzle required for the MVP.

It validates:

- compact instruction presentation;
- point placement;
- constrained drawing;
- face extraction;
- phase labelling;
- erasing;
- three-submission lifecycle;
- persistence;
- minimal board UX.

The system is fictional.

## 2. Board domain

- composition: 0 to 100 percent B;
- temperature: 0°C to 1100°C.

## 3. Public instructions

```text
A 1000°
B 850°
E 700° · 40%B
α@E 10%B
β@E 80%B
α@0 0%B
β@0 100%B
```

## 4. Required points

| Role ID | Correct composition | Correct temperature | Placement constraint |
|---|---:|---:|---|
| `a-melt` | 0%B | 1000°C | left edge |
| `b-melt` | 100%B | 850°C | right edge |
| `alpha-eut` | 10%B | 700°C | eutectic row |
| `eutectic` | 40%B | 700°C | eutectic row |
| `beta-eut` | 80%B | 700°C | eutectic row |
| `alpha-low` | 0%B | 0°C | bottom edge |
| `beta-low` | 100%B | 0°C | bottom edge |

## 5. Required curves

- `a-melt` to `eutectic`: left liquidus branch;
- `b-melt` to `eutectic`: right liquidus branch;
- `a-melt` to `alpha-eut`: left solidus branch;
- `b-melt` to `beta-eut`: right solidus branch;
- `alpha-low` to `alpha-eut`: left solvus branch;
- `beta-low` to `beta-eut`: right solvus branch.

The player is not told these names during play.

## 6. Required invariant horizontal

- start: `alpha-eut`;
- interior: `eutectic`;
- end: `beta-eut`;
- temperature: 700°C;
- expected assemblage: `{L, α, β}`.

## 7. Expected fields

- upper field: `{L}`;
- lower-left terminal field: `{α}`;
- lower-right terminal field: `{β}`;
- upper-left two-phase field: `{L, α}`;
- upper-right two-phase field: `{L, β}`;
- lower-middle field: `{α, β}`.

## 8. Curve freedom

Any structurally legal monotone curve with the correct endpoints is accepted.

The visual reference fixture supplies recommended control points for tests and screenshots only.

## 9. Initial state

- empty frame;
- no points;
- no geometry;
- no labels;
- instruction strip expanded;
- Point mode may be selected automatically for the first session;
- no instructional paragraph.


## 10. Optional local invalidity examples

When local invalidity checking is enabled, definite errors may include:

- A melting point at 900°C;
- eutectic point at 50%B;
- a 2-D field with `{L, α, β}`;
- invariant horizontal with more than three distinct phases;
- curve crossing;
- horizontal not incident to its committed anchors;
- ordinary curve ending freely.

Missing points or labels alone are not local-invalidity errors. With the setting disabled, none of these receive scientific correctness feedback before submission.

## 11. Submit success

A submission succeeds only when:

- all seven points are at exact instruction coordinates;
- all required geometry incidences exist;
- no extra geometry exists;
- exactly six fields are extracted;
- each expected field has the correct unordered assemblage;
- the invariant has `{L, α, β}`;
- the construction is planar and structurally valid.

## 12. Submission budget

The golden MVP puzzle permits exactly three scored submissions. The timer stops on success or after the third incorrect submission.
