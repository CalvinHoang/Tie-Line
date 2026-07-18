# Implementation notes

## Specification decisions

- The preserved handoff remains the governing product source; the runnable Vite app lives at the repository root.
- A seeded generator creates the public puzzle geometry and its hidden semantic answer together. Only the locked geometry is placed into the playable construction; phase assemblages remain hidden until validation or reveal.
- Planar faces are extracted from the frame and sampled semantic geometry with a deterministic half-edge walk. Pixel flood fill is not used.
- Labels are reconciled across cosmetic curve edits when topology and field count remain unchanged. Split or merged cells clear labels as one geometry action.
- Difficulty is structural, not cosmetic. Easy draws from eutectic/peritectic/eutectoid/peritectoid and subsolidus families with one intermediate phase; Normal adds inverse-peritectic, supersolidus and superlattice families; Hard draws across the full binary T–X pool with three critical points and up to two intermediate phases.
- Each reaction family owns a canonical complete topology (compound peak, peritectic termination, solid-state invariant, ordering/solvus dome, or liquid immiscibility dome). Seeded variation moves valid features within guarded ranges, and a layout-quality gate rejects tiny extracted fields.
- The Playwright flow verifies locked generated geometry, direct labelling, seed changes, difficulty switching, Rules, and narrow-screen launch. Generator tests semantically solve hundreds of seeds across all three modes.

## Visual grammar

- Diagram drawing follows the reference notes: frames are open at the top (axes at A and B plus a baseline), boundaries are thin uniform ink, and stoichiometric invariant horizontals run to the frame edge exactly as in the notes' schematic pages.
- Generated boundary curvature follows the notes' signature via `bowedControl`: liquidus and solidus branches leave a melting point or dome apex almost flat and steepen into the invariant they terminate on; miscibility and ordering domes get steep sides and rounded tops.
- Rules concept art uses one consistent encoding: base ink draws the diagram skeleton, the accent stroke marks the feature the card teaches, dashed strokes are reserved for metastable features, hatching marks solid-solution regions, and an open circle marks the reaction point. Each glyph is traced from its counterpart figure in the reference notes.

## Deliberately deferred

Ternary generation is deliberately deferred because the handoff marks its grammar as non-binding until topology generation and validation rules are formalised. The schema uses extensible identifiers, multiple invariants, line compounds, and reaction strings so that expansion remains possible without replacing the label-first game model.

## External delivery choices

Deployment visibility and pushing to GitHub are intentionally not assumed. Both change external state and should be chosen explicitly by the repository owner.
