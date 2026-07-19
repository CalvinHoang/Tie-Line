# Implementation notes

## Specification decisions

- The preserved handoff remains the governing product source; the runnable Vite app lives at the repository root.
- A seeded generator creates the public puzzle geometry and its hidden semantic answer together. Only the locked geometry is placed into the playable construction; phase assemblages remain hidden until validation or reveal.
- Planar faces are extracted from the frame and sampled semantic geometry with a deterministic half-edge walk. Pixel flood fill is not used.
- Labels are reconciled across cosmetic curve edits when topology and field count remain unchanged. Split or merged cells clear labels as one geometry action.
- A field tap records only the selected cell and phase; pointer coordinates never become label coordinates. Label placement searches the complete extracted polygon in screen space and maximises clearance from every boundary.
- A stationary primary-pointer gesture remains a field tap, while movement beyond a small threshold becomes a one-pointer viewport pan and suppresses label placement. Pinch, cursor-anchored wheel zoom, and explicit zoom controls share the same clamped viewport transform.
- Every field reserves a stable anchor large enough for a two-phase assemblage. Narrow fields can use a vertical layout and conservative scaling, so adding or removing phases does not move the anchor or place glyphs across a boundary.
- Phase labels follow the puzzle inventory's canonical display order regardless of click order. Validation remains order-independent. This intentionally replaces the preserved handoff's earlier visual-insertion-order default.
- Intermediate compounds use rule-derived formula markers on the bottom composition axis. The phase engine assigns deterministic Greek symbols independently, visibly links each symbol beneath its formula, and stacks polymorphs within the same composition group. These associations identify the phases without pre-filling any diagram field; selecting a symbol activates it for labelling. Invariant horizontals remain part of the generated and validated topology, but players do not label them.
- Difficulty is structural, not cosmetic. Easy retains compact teaching families. Normal and Hard use one seeded feature-composition engine: one of 28 condensed-phase Notes features is selected as the kernel, joined to a variable multi-compound eutectic backbone, compatible solid-state reaction modules may be inserted, and some seeds mirror the completed graph. Normal keeps its existing small composition budget. Hard uses three backbone intermediates and one supporting module for spatial phenomena, or four to five backbone intermediates and two modules for compact phenomena, while retaining at least fifteen fields and four invariants. Partial-miscibility kernels reserve forty percent of the composition axis and both terminal solvus spans must remain at least six composition-percent wide. Feature counts are total records with explicit zeroes. Gas-bearing boiling, sublimation and triple-point content is not part of the T-X generator.
- Every generated round passes an independent geometry/topology and phase-equilibria audit before it is returned. The audit enforces planar manifold incidence, finite fields, a one-liquid high-temperature edge, binary one/two-phase fields, three-phase invariant archetypes and composition order, explicit parent/product incidence above and below composed reactions, line-compound versus solid-solution dimensionality, and legal field adjacency. The composer reduces its optional solid-state module count and retries when a dense graph fails that independent audit. Generator-owned `expectedFields` are therefore not accepted as proof of validity by themselves.
- Stability limits do not partition equilibrium label fields: liquid spinodals are non-field guide curves inside one `L₁ + L₂` assemblage and are rendered with an unstable-region hatch. Limited-solubility terminal phases and polymorph/order variants occupy finite single-phase regions bounded by solidus, solvus, coexistence, or ordering curves and use the partial-solubility hatch.
- Local reaction kernels encode only the physically required incidence of each invariant. The composer supplies the complete melting backbone, ordered intermediate compositions, connection points, optional nested reactions, numerical layout, and left/right orientation. Seeded variation therefore changes both graph structure and geometry; a layout-quality gate still rejects tiny extracted fields.
- The Playwright flow verifies locked generated geometry, direct labelling, stable contained label anchors, seed changes, difficulty switching, Rules, and narrow-screen launch. Generator tests semantically solve hundreds of seeds across all three modes, while placement tests exercise multiple seeded variations of every topology family.

## Visual grammar

- Diagram drawing follows the reference notes: frames are open at the top (axes at A and B plus a baseline), boundaries are thin uniform ink, and stoichiometric invariant horizontals run to the frame edge exactly as in the notes' schematic pages.
- Generated boundary curvature follows the notes' signature via `bowedControl`: liquidus and solidus branches leave a melting point or dome apex almost flat and steepen into the invariant they terminate on; miscibility and ordering domes get steep sides and rounded tops.
- Rules concept art uses one consistent encoding: base ink draws the diagram skeleton, the accent stroke marks the feature the card teaches, dashed strokes are reserved for metastable features, hatching marks solid-solution regions, and an open circle marks the reaction point. Each glyph is traced from its counterpart figure in the reference notes.

## Deliberately deferred

Ternary generation is deliberately deferred because the handoff marks its grammar as non-binding until topology generation and validation rules are formalised. The schema uses extensible identifiers, multiple invariants, line compounds, and reaction strings so that expansion remains possible without replacing the label-first game model.

## External delivery choices

Deployment visibility and pushing to GitHub are intentionally not assumed. Both change external state and should be chosen explicitly by the repository owner.
