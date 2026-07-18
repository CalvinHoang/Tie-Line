# Tie-Line Interaction Grammar v0.2

## 1. Principle

The interaction feels direct and free, but the persisted construction is semantic.

Raw gestures propose points, curves, and targets. The application stores exact snapped coordinates, incidence, constrained geometry, phase sets, and topology.

## 2. Mode model

Exactly one mode is active:

- Point
- Curve
- Horizontal
- Label
- Select
- Erase

The active mode must be recognisable through icon shape, selected state, pointer behaviour, and accessible name. Do not rely only on colour.

## 3. Point mode

### 3.1 Point palette

Opening Point mode reveals one compact symbol per unplaced instruction-defined anchor.

Example symbols:

- `Aₘ`
- `Bₘ`
- `αE`
- `E`
- `βE`
- `α0`
- `β0`

The symbols are identifiers, not explanatory sentences.

### 3.2 Placement

The player may:

- tap a point symbol, then tap the board; or
- drag a point symbol onto the board.

A clean point preview snaps to the logical grid.

### 3.3 Constraint classes

- Unary melting anchors are constrained to the corresponding composition edge.
- Eutectic-temperature anchors may move along the exact eutectic-temperature row until released.
- Low-temperature endpoints are constrained to the bottom frame.
- Composition values snap to the declared puzzle grid.

These are syntactic placement constraints. They do not silently correct the player to the instruction's exact coordinate.

### 3.4 Coordinate feedback

While placing or moving a point, show only a tiny temporary coordinate readout near the finger or cursor, for example `40%B · 700°`.

The readout disappears after release.

### 3.5 Moving points

In Select mode, an unconnected point may be moved freely within its constraint class.

Moving a connected point previews the movement of attached curves. Commit as one undoable action.

## 4. Curve mode

1. Pointer down within a point hit radius begins a stroke.
2. A faint raw trace follows the pointer.
3. A clean candidate curve previews over the trace.
4. All structurally reachable end anchors use the same neutral affordance. Do not highlight only scientifically correct targets.
5. Release within the target snap radius proposes a curve.
6. Reject self-intersection, illegal crossing, overlap, duplicate incidence, or free endpoint.
7. Commit the clean curve and discard the raw trace.

## 5. Curve representation

Use one quadratic Bézier or equivalent one-handle representation.

Store:

- start point ID;
- end point ID;
- one control point;
- player-created status.

The gesture determines broad bow direction. Clamp the control point to avoid loops, excessive curvature, or hidden extrema.

Select mode reveals one handle only while the curve is selected.

## 6. Horizontal mode

1. Start on one anchor.
2. Drag toward another anchor.
3. Preview an exactly horizontal semantic object.
4. The object may include one or more interior anchors on the same row.
5. Release near the final anchor.
6. Reject overlap, duplicate, or illegal crossing.

The golden puzzle's invariant horizontal must include `αE`, `E`, and `βE`.

## 7. Face extraction and target behaviour

After each geometry commit:

- recompute the planar cell complex;
- identify bounded 2-D fields;
- preserve stable cell IDs where topology is unchanged;
- make fields directly tappable;
- attach phase labels automatically near a suitable interior point.

No manual text positioning is required.

## 8. Label mode

### 8.1 Phase palette

The temporary palette contains:

```text
L   α   β
```

### 8.2 Applying phases

Support both:

- select a phase, then tap one or more targets;
- drag a phase onto one target.

A selected phase remains active until the player changes mode or phase.

### 8.3 Permitted targets

- 2-D fields;
- invariant horizontal.

Future grammars may add line compounds and special points.

### 8.4 Error freedom

Allow zero through all declared phases on every phase-bearing target.

Do not allow duplicate copies of one phase on one target.

Preserve insertion order visually. Canonicalise only for validation.

## 9. Erase mode

A deliberate tap may remove:

- one tapped phase token;
- one player-created curve;
- one invariant horizontal;
- one player-created point when deletion does not orphan committed geometry.

If a point has incident geometry, highlight the dependent objects and require a second confirmation tap or undoable grouped deletion.

Do not support scrub-to-delete.

## 10. Select mode

Select mode supports:

- moving a point;
- adjusting one curve handle;
- inspecting a field or horizontal;
- cycling overlapping targets;
- opening a compact local rule tooltip when optional local invalidity checking is enabled.

Tap empty board space to clear selection and hide handles.

## 11. Undo and redo

Undo is always accessible.

Each of these is one semantic action:

- place point;
- move point and attached geometry;
- add curve;
- adjust curve;
- add horizontal;
- add phase;
- remove phase;
- delete geometry;
- grouped dependent deletion.

Redo may live in overflow on narrow screens.


## 12. Local invalidity checking and Submit

### Default state

There is no pre-submission correctness action on the default play screen. The editor blocks only malformed gestures and data structures.

### Optional local invalidity checking

When enabled in Settings, it may:

- report definite present contradictions;
- highlight locally;
- ignore absence alone;
- link to a concise rule explanation;
- avoid hidden-solution comparison and answer-revealing corrections.

### Submit

- checks all required points;
- checks exact instruction coordinates;
- checks required topology;
- checks labels and invariant assemblage;
- checks completeness and extra geometry;
- consumes one of three scored submissions when incorrect;
- stops the timer on success or after the third incorrect submission.

## 13. Gesture priority

On touch:

1. visible point or selected handle;
2. visible phase token;
3. geometry line;
4. field;
5. empty board.

Use generous invisible hit areas.

## 14. Zoom and pan

- two-finger pinch zoom;
- two-finger pan;
- no one-finger pan while a drawing mode is active;
- reset view in overflow;
- screen-space snap and hit thresholds remain constant under zoom.

## 15. Structural versus scientific constraints

The editor enforces:

- machine-readable coordinates;
- valid graph incidence;
- no accidental crossings;
- no floating curve endpoints;
- exact horizontality for invariant objects;
- nonduplicate phase tokens.

The validator enforces:

- correct coordinates from instructions;
- correct topology;
- correct field dimensions and assemblages;
- correct invariant structure.
