# Scientific Coverage and Content Taxonomy

## 1. Purpose

This document defines the intended scientific destination and separates it from the currently binding restricted grammar.

The Formal Rules v0.2 binary scope remains authoritative for the first implementation. The mature product expands through explicit new formal-rules versions rather than by treating all phase diagrams as already supported.

## 2. Initial binding binary grammar

Formal Rules v0.2 currently supports:

- constant-pressure binary temperature-composition diagrams;
- liquid;
- terminal solid-solution phases with restricted ranges;
- stoichiometric intermediate line compounds;
- eutectic;
- eutectoid;
- peritectic;
- peritectoid;
- congruent melting;
- incongruent melting;
- ordinary liquidus, solidus, and solvus interfaces;
- canonical labelled topological verification.

## 3. Mature binary coverage target

The end product aims to support the principal construction and interpretation families represented in the supplied notes, subject to formalisation and validation:

- complete solid solubility;
- limited terminal solid solubility;
- one or multiple intermediate phases;
- stoichiometric compounds;
- congruent and incongruent melting;
- polymorphic transformations;
- eutectic and eutectoid reactions;
- peritectic and peritectoid reactions;
- liquid and solid immiscibility families;
- additional binary invariant archetypes where their topology can be formally represented;
- tie lines and phase fractions;
- cooling and heating paths;
- phase presence at specified conditions;
- error identification and diagram completion.

Each added family requires a new formal-rules version and the full support chain described in the generator specification.

## 4. Mature ternary coverage target

The end product aims to support:

- ternary composition and barycentric coordinates;
- binary edges and joins;
- subsolidus compatibility triangles;
- stoichiometric compounds in a ternary system;
- primary crystallisation fields;
- liquidus projections;
- cotectic boundary networks;
- Alkemade relationships;
- temperature maxima and directions along boundaries;
- ternary eutectic and peritectic invariant points;
- isothermal sections;
- phase assemblage determination;
- liquid and crystallisation paths;
- final solid compatibility;
- generated full-diagram and focused Practice tasks.

Ternary rules in the existing v0.2 notes are non-binding design material until rewritten as a complete formal grammar.

## 5. Real systems

Main Game uses fictional abstract systems. Real systems serve four other purposes:

- scientific golden tests;
- regression examples;
- Notes illustrations;
- curated Practice or special puzzles.

The supplied notes already contain real binary examples suitable for an initial reference set, including complete-solubility, eutectic, peritectic, compound, and Fe–C-style multi-reaction examples. The exact source diagram and interpretation must be reviewed before it becomes an executable golden fixture.

Before freezing ternary generation, add a small set of complete authoritative ternary examples showing compatibility triangles, liquidus projections, cotectic directions, invariant points, and isothermal sections together.

## 6. Scientific claims boundary

Passing Tie-Line's formal rules means a diagram is legal within the supported game grammar. It does not by itself prove that a fictional system corresponds to a globally consistent set of Gibbs-energy functions or an experimentally real material system.

This limitation should be documented for contributors but need not interrupt ordinary play.

## 7. Content completion definition

A concept is fully supported only when all are present:

- formal definition;
- canonical data model;
- generator production or eligible composition rule;
- instruction types;
- validator;
- uniqueness method;
- deterministic difficulty features;
- Main Game eligibility where appropriate;
- Practice exercises;
- Notes entry;
- automated fixtures;
- scientific review.

## 8. Reference notes mapping

The supplied MATS2008 notes provide:

- ternary construction procedures and compatibility reasoning on pages 1–2;
- binary classification and invariant-reaction schematics on pages 4–12;
- real binary example diagrams on pages 13–17.

They are included in the project package under `references/` as a design and validation source, not as executable rules by themselves.
