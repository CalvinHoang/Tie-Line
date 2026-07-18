# Tie-Line Screen Wireframe

## Mobile default

```text
┌────────────────────────────────┐
│ A1000  B850  E700·40B  αE10 ...│  compact instruction strip
│                                │
│ T                              │
│ ┌────────────────────────────┐ │
│ │                            │ │
│ │                            │ │
│ │          BOARD             │ │
│ │                            │ │
│ │                            │ │
│ └────────────────────────────┘ │
│ A                            B │
│                                │
│  ↶       ●/⌒/─/α/⌫       ✓     │  compact controls
└────────────────────────────────┘
```

No visible page title or instruction paragraph.

## Mode expansion

Tapping the central mode control temporarily expands:

```text
●   ⌒   ─   α   ↖   ⌫
```

Representing:

- Point
- Curve
- Horizontal
- Label
- Select
- Erase

The row closes after selection.

## Point palette

When Point is active:

```text
Aₘ  Bₘ  αE  E  βE  α0  β0
```

Placed points disappear from the palette or show a completed state.

## Label palette

When Label is active:

```text
L   α   β
```

## Feedback

There is no default pre-submission Check action. When optional local invalidity checking is enabled, a definite invalid object may receive a local outline and concise rule tooltip. No permanent panel appears.

## Desktop

The board remains centred and dominant. Controls float near the lower board edge rather than forming a side panel. Optional extra whitespace should not be filled with dashboard content.
