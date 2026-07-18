# Notes Reference Manual Specification

## 1. Purpose

Notes is a concise reference manual of definitions for every invariant, rule, object, and procedure supported by Tie-Line.

It is not a linear course and does not require completion.

## 2. Organisation

Notes supports:

- alphabetical index;
- scientific category index;
- search by term, symbol, and reaction;
- cross-links between related concepts;
- stable entry IDs for links from Practice and validation results;
- binary and ternary sections;
- formal-rule index.

## 3. Entry structure

Each entry contains only fields relevant to that concept:

1. **Name and aliases**
2. **Definition**
3. **Notation or reaction equation**
4. **Minimal schematic**
5. **How to recognise it geometrically**
6. **Dimensional or adjacency rule**
7. **Heating and cooling interpretation where relevant**
8. **Common confusion**
9. **Related entries**
10. **Formal rule references**

Entries should be brief at first view, with deeper formal detail expandable below.

## 4. Required binary entries

At minimum, the mature manual contains entries for:

- component;
- phase;
- phase assemblage;
- phase field;
- temperature-composition diagram;
- unary edge;
- liquidus;
- solidus;
- solvus;
- tie line;
- lever rule;
- terminal solid solution;
- intermediate phase;
- stoichiometric line compound;
- invariant reaction;
- eutectic;
- peritectic;
- eutectoid;
- peritectoid;
- congruent melting;
- incongruent melting;
- polymorphism;
- complete solid solubility;
- limited solid solubility;
- liquid or solid immiscibility when supported;
- cooling path;
- phase-composition locus;
- ordinary interface;
- invariant horizontal;
- congruent point;
- canonical topology;
- every active formal-rule family and rule ID.

## 5. Required ternary entries

At minimum:

- ternary composition triangle;
- barycentric composition;
- binary join;
- isopleth or section;
- compatibility triangle;
- primary crystallisation field;
- liquidus projection;
- cotectic;
- boundary line;
- Alkemade line and theorem;
- back-tangent rule where included;
- direction of falling temperature;
- ternary invariant point;
- ternary eutectic;
- ternary peritectic;
- isothermal section;
- crystallisation path;
- liquid path;
- final solid assemblage.

## 6. Formal rules

Every active formal rule must have a human-readable Notes entry or be grouped into a clearly named rule-family entry. The reference manual may show formal rule IDs, but the primary heading uses ordinary materials-science language.

## 7. Linking from the game

- Practice may link directly to a definition.
- A failed submission may link to a broad relevant definition only when doing so does not expose the answer.
- Revealed-solution comparison may link to all involved concepts.
- Main Game never forces Notes open.

## 8. Source basis

The supplied MATS2008 notes provide the initial taxonomy and schematic reference for binary classification, invariant reactions, compounds, real binary examples, ternary compatibility triangles, invariant points, isothermal sections, and crystallisation paths.

The manual should supplement this with authoritative scientific sources and formal review before publication. Notes content is not generated at runtime.

## 9. Content versioning

Each entry records:

- content version;
- associated formal-rules versions;
- review status;
- source references;
- related generator features.

A scientific feature cannot be marked supported while its defining Notes entry is missing.
