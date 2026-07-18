# Schema and State Contracts

The reference TypeScript definitions are in `src/domain/schema.ts`.

## 1. Identifiers

- stable opaque strings;
- no array-index identity;
- hidden solution IDs may correspond to puzzle role IDs but must not leak into player affordances.

## 2. Player phase assemblages

Store insertion order:

```ts
phaseOrder: PhaseId[]
```

Constraints:

- no duplicates;
- zero through all declared phases permitted;
- validation canonicalises to a sorted set key;
- UI preserves insertion order.

## 3. Point specification

Each point role declares:

- visible symbolic label;
- placement constraint class;
- optional edge;
- correct hidden coordinate;
- whether required.

The public puzzle fixture must not include the hidden correct coordinate if the UI is expected to derive it only from human-readable instructions. For this MVP, the instruction values are public and the same data may power the instruction strip, but no automatic placement may consume them.

## 4. Player point state

A placed point stores:

- role ID;
- player coordinate;
- locked-to-grid result;
- incident geometry;
- creation order.

The point is not scientifically correct merely because it satisfies its placement constraint class.

## 5. Geometry

### Curve

- distinct endpoints;
- one control point;
- no scientific type stored.

### Invariant horizontal

- exact shared temperature;
- sorted interior point IDs;
- phase insertion array.

### Frame

- locked;
- nonlabelable;
- participates in face extraction.

## 6. Extracted cells

Store:

- stable ID;
- ordered boundary references;
- polygon approximation;
- label point;
- player phase insertion order.

Hidden semantic role is test-only or solution-only.

## 7. Puzzle constraints

The golden puzzle declares:

- seven required point roles;
- exact hidden coordinates;
- six required curve endpoint pairs;
- one required invariant horizontal;
- six expected 2-D fields;
- expected field assemblages;
- zero permitted extra geometry on Submit.

## 8. Canonical MVP signature

```text
point: role|u|t
curve: curve|min(pointA,pointB)|max(pointA,pointB)
horizontal: horizontal|left|interior...|right|t
cell: canonical cyclic oriented boundary sequence
assemblage: sorted phase IDs
```

Curve control points are excluded.

## 9. State

Mutable construction state contains:

- point placements;
- geometry;
- extracted cells;
- labels;
- active mode;
- active point role or phase;
- selection;
- viewport;
- metrics;
- solved status.

## 10. Metrics

Record locally:

- active time;
- Submit count;
- submissions remaining;
- scored-attempt status;
- local-invalidity-check setting;
- point moves;
- geometry deletions;
- phase deletions;
- undo count;
- solved timestamp.

Do not display a competitive score in MVP.
