# Tie-Line Visual Grammar v0.2

## 1. Reference

Use **Minesweeper: The Clean One** as the reference for interaction density, restraint, and board dominance.

Adapt principles only. Do not copy proprietary assets, branding, exact colour themes, or layout.

## 2. Core rule

The phase diagram is the board.

Every persistent element must support the player's next puzzle action.

## 3. Prohibited play-screen patterns

Do not include:

- dashboard cards;
- persistent title banner;
- paragraph instructions;
- visible statistics;
- progress cards;
- side inspector;
- permanent feedback panel;
- persistent rule list;
- decorative science imagery;
- full-field teaching annotations;
- large submit card.

## 4. Screen composition

The board should occupy approximately:

- 85 to 92 percent of the mobile play area;
- 80 to 90 percent of the desktop play area.

Remaining space is used for:

- a tiny instruction strip or instruction toggle;
- a compact mode control;
- undo;
- submit and three compact submission indicators.

Controls may overlay the board margins.

## 5. Board

- flat neutral background;
- no card around the board;
- no paper texture;
- no grid by default;
- optional grid appears only while placing or moving a point;
- thin dark frame and boundaries;
- minimal axis notation: `T`, `A`, `B`;
- numerical ticks hidden unless placement mode requires them.

## 6. Instruction strip

The instruction strip uses concise scientific notation only.

It may appear as one or two compact rows at the top edge:

```text
A 1000°  B 850°  E 700°·40%B
αE 10%B  βE 80%B
```

Behaviour:

- visible on puzzle open;
- collapsible to a small instruction icon;
- temporarily reappears when Point is selected;
- no explanatory prose;
- no surrounding card shadow;
- may use subtle translucent backing only for legibility.

## 7. Geometry

During ordinary play:

- all scientific boundary types use one neutral line style;
- locked and player-created geometry settle to the same style after placement;
- selected geometry uses a temporary accent outline;
- raw pointer trace is faint;
- snapped preview is clearer;
- malformed preview uses an error state.

Do not reveal liquidus, solidus, or solvus through colour or dash pattern.

## 8. Points

Point states:

- unplaced point symbol: compact palette glyph;
- placement preview: hollow circle with subtle crosshair;
- committed point: small filled or outlined circle;
- selected point: accent ring;
- optional local-invalidity indication: error ring;
- solved point: reduced or hidden affordance.

Point markers fade when no point-related mode is active.

## 9. Phase labels

Render phase assemblages directly on the board.

Preferred form:

```text
α + L
```

Use:

- readable phase symbols;
- neutral plus signs;
- subtle stable colour per phase symbol if desired;
- no large pill around the entire assemblage;
- no full-field colour fill during play.

For narrow fields, use a small external label with a fine leader line.

## 10. Phase colours

Colour may distinguish phase symbols, but not scientific correctness.

Rules:

- one stable accessible colour per phase;
- phase colours are separate from error, success, and selection colours;
- do not blend colours to create multiphase field colours;
- labels remain legible in monochrome and colour-blind modes.

## 11. Controls

Controls are icon-first and compact.

Suggested always-visible actions:

- undo;
- active mode button;
- submit and three compact submission indicators.

Selecting the mode button opens the small row of six modes.

Selecting Point or Label opens the relevant temporary symbol row.

Erase may remain one tap away because it changes board semantics.

Long press or accessibility mode reveals control names.

## 12. Feedback

Default feedback is visual and local.

When optional local invalidity checking is enabled:

- definite contradictory objects pulse once;
- an error outline remains until the next edit or selection;
- no full-screen message or permanent panel appears;
- tapping an error reveals one short rule tooltip.

When it is disabled, scientific error styling appears only after submission and remains broad rather than answer-revealing.

## 13. Motion

Use motion only to clarify:

- point snap;
- curve regularisation;
- phase token addition or removal;
- local error pulse;
- undo restoration;
- solved-state cleanup.

No confetti, bouncing controls, decorative particles, or continuous animation.

## 14. Solved state

- remove control handles;
- reduce point markers;
- normalise lines;
- retain the complete diagram;
- display one small next control;
- optional subtle field-label settling animation.

## 15. Typography

- clean sans-serif UI font;
- maths-capable rendering for Greek symbols and subscripts;
- no decorative science font;
- no all-caps play text;
- body prose is absent from normal play.

## 16. Accessibility

- controls have accessible names;
- touch targets at least 44 CSS px even when visible icons are smaller;
- colour is never the sole state indicator;
- phase symbols remain textual;
- high contrast mode supported by CSS variables;
- reduced-motion preference respected.
