# Implementation notes

## Specification decisions

- The preserved handoff remains the governing product source; the runnable Vite app lives at the repository root.
- A seeded generator creates the public puzzle geometry and its hidden semantic answer together. Only the locked geometry is placed into the playable construction; phase assemblages remain hidden until validation or reveal.
- Planar faces are extracted from the frame and sampled semantic geometry with a deterministic half-edge walk. Pixel flood fill is not used.
- Labels are reconciled across cosmetic curve edits when topology and field count remain unchanged. Split or merged cells clear labels as one geometry action.
- A field tap records only the selected cell and phase; pointer coordinates never become label coordinates. Label placement searches the complete extracted polygon in screen space and maximises clearance from every boundary.
- Every field reserves a stable anchor large enough for a two-phase assemblage. Narrow fields can use a vertical layout and conservative scaling, so adding or removing phases does not move the anchor or place glyphs across a boundary.
- Phase labels follow the puzzle inventory's canonical display order regardless of click order. Validation remains order-independent. This intentionally replaces the preserved handoff's earlier visual-insertion-order default.
- Intermediate compounds are identified only by rule-derived formula markers on the bottom composition axis. The phase engine assigns deterministic Greek symbols independently and keeps every polymorph tied to the same composition group; no Greek phase answer is pre-revealed inside the board. Invariant horizontals remain part of the generated and validated topology, but players do not label them.
- Difficulty is structural, not cosmetic. Every playable round is a complete melting system rather than an isolated solid-state excerpt. Easy mixes eutectic, compound, peritectic, peritectoid, and subsolidus systems; Normal adds supersolidus and superlattice transformations; Hard adds liquid immiscibility, liquid spinodal, monotectic, syntectic, and multi-compound systems. Standalone eutectoid, monotectoid, inverse-peritectic, and solid-spinodal excerpts remain teaching concepts only until complete host diagrams are implemented.
- The generator rejects any playable round unless exactly one connected field touches the complete high-temperature edge and that field contains one liquid phase. Solid-state-only diagrams must be presented explicitly as cropped subsolidus sections rather than as complete systems.
- Each reaction family owns a canonical complete topology (compound peak, peritectic termination, solid-state invariant, ordering/solvus dome, or liquid immiscibility dome). Seeded variation moves valid features within guarded ranges, and a layout-quality gate rejects tiny extracted fields.
- The Playwright flow verifies locked generated geometry, direct labelling, stable contained label anchors, seed changes, difficulty switching, Rules, and narrow-screen launch. Generator tests semantically solve hundreds of seeds across all three modes, while placement tests exercise multiple seeded variations of every topology family.

## Visual grammar

- Diagram drawing follows the reference notes: frames are open at the top (axes at A and B plus a baseline), boundaries are thin uniform ink, and stoichiometric invariant horizontals run to the frame edge exactly as in the notes' schematic pages.
- Generated boundary curvature follows the notes' signature via `bowedControl`: liquidus and solidus branches leave a melting point or dome apex almost flat and steepen into the invariant they terminate on; miscibility and ordering domes get steep sides and rounded tops.
- Rules concept art uses one consistent encoding: base ink draws the diagram skeleton, the accent stroke marks the feature the card teaches, dashed strokes are reserved for metastable features, hatching marks solid-solution regions, and an open circle marks the reaction point. Each glyph is traced from its counterpart figure in the reference notes.

## Deliberately deferred

Ternary generation is deliberately deferred because the handoff marks its grammar as non-binding until topology generation and validation rules are formalised. The schema uses extensible identifiers, multiple invariants, line compounds, and reaction strings so that expansion remains possible without replacing the label-first game model.

## External delivery choices

Deployment visibility and pushing to GitHub are intentionally not assumed. Both change external state and should be chosen explicitly by the repository owner.
