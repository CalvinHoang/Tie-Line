# Technical Architecture

## 1. Application shape

Build a static client-only web application.

Recommended stack:

- React
- TypeScript strict mode
- Vite
- SVG
- Vitest
- Playwright

No backend, database, authentication, or network API is required.

## 2. Suggested module boundaries

```text
src/
  app/
  domain/
    schema.ts
    instruction-coordinates.ts
    geometry.ts
    canonical.ts
    rules/
  editor/
    actions.ts
    history.ts
    cell-reconciliation.ts
  canvas/
    DiagramCanvas.tsx
    pointer-controller.ts
    face-extraction.ts
    hit-testing.ts
  game/
    PuzzleScreen.tsx
    persistence.ts
    feedback.ts
  ui/
    ModeControl.tsx
    PointPalette.tsx
    PhasePalette.tsx
    InstructionStrip.tsx
    ErrorTooltip.tsx
```

Thermodynamic logic must remain outside React components.

## 3. Coordinates

Use logical units:

- `u`: composition from 0 to 100 percent B;
- `t`: temperature in degrees Celsius for the golden puzzle.

The board viewport maps logical coordinates to SVG coordinates.

Semantic equality uses logical coordinates. Hit and snap thresholds use screen pixels.

## 4. Puzzle temperature domain

Golden puzzle board:

- minimum displayed temperature: 0°C;
- maximum displayed temperature: 1100°C.

The visible axis may suppress most numeric labels. Placement mode may show a temporary coordinate readout.

## 5. Point model

Each instruction-defined point stores:

- semantic role;
- correct coordinate;
- permitted placement constraint;
- player coordinate if placed;
- placement status;
- incident geometry IDs.

Point placement is player state. Correct solution coordinates remain in the hidden fixture.

## 6. Curves

Store ordinary curves as quadratic Bézier segments:

```ts
{
  startNodeId,
  endNodeId,
  control: { u, t }
}
```

Curvature is cosmetic within structural limits.

## 7. Invariant horizontal

Store:

- left endpoint;
- right endpoint;
- ordered interior point IDs;
- exact temperature;
- player phase insertion order.

## 8. Geometry commit pipeline

After a point or geometry action:

1. validate syntactic placement class;
2. reject duplicate semantic object;
3. sample curves for intersection checks;
4. reject self-intersection, overlap, or unregistered crossing;
5. update embedded graph;
6. extract bounded faces;
7. reconcile cell IDs and labels;
8. persist state.

## 9. Face extraction

Use a half-edge traversal or another deterministic planar embedding method, not pixel flood fill.

Curves may be sampled into polylines for area and hit testing, but semantic identity remains the original curve.

## 10. Cell identity

Prefer topology signatures from ordered boundary IDs and orientations.

If topology changes, transfer labels only when polygon overlap is unambiguous. Otherwise move them to a temporary unresolved state or clear them with an undoable warning.

For the MVP, a simpler policy is acceptable:

- preserve labels when only control points move;
- clear labels on a cell split or merge;
- include the geometry edit and label clearing in one undo action.

## 11. Validation layers

### Structural validator

Checks machine-readable geometry and planar legality.

### Optional local-invalidity validator

Reports definite current contradictions only when the Settings preference is enabled. It is not exposed as a default Check action.

### Submit validator

Checks exact instruction coordinates, required topology, field labels, invariant assemblage, completeness, and extra geometry.

### Future solver

Not required for MVP.

## 12. Semantic comparison

Compare:

- point role and exact coordinate;
- geometry type and unordered endpoint incidence;
- invariant interior-node incidence;
- extracted field topology;
- unordered phase sets;
- absence of extra geometry.

Ignore:

- curve control points;
- phase insertion order;
- label screen position;
- viewport;
- raw stroke path.

## 13. Persistence

Store one versioned local record after each action.

Exclude:

- raw pointer traces;
- hover state;
- hidden solution;
- transient error pulse state.

## 14. Performance targets

- pointer preview near 60 fps;
- face recomputation under 30 ms for golden puzzle;
- optional local validation and Submit under 100 ms;
- no visible label jump during cosmetic curve adjustment.

## 15. Dependency policy

Do not use a full vector-editor framework.

A small geometry library is acceptable only if it is deterministic, browser-safe, focused, and does not obscure the semantic graph model.
