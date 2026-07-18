# Deterministic Difficulty Ruleset v0.1

**Status:** Provisional design-owned ruleset. It is deterministic and must not be changed automatically from player data.

## 1. Principle

Easy, Normal, and Advanced are assigned from the semantic structure of a puzzle and the form of its instructions. They are not campaigns, skill ratings, or adaptive user profiles.

The same puzzle identity always receives the same difficulty under the same ruleset version.

## 2. Inputs

The classifier may use only declared puzzle features, including:

- diagram family;
- invariant types;
- number of invariant reactions;
- number of intermediate phases;
- congruent or incongruent compound behaviour;
- number of phase-bearing cells;
- number of structural events;
- maximum dependency depth between instructions and required construction;
- ratio of direct to relational or observational instructions;
- number of locally plausible partial topologies eliminated by global constraints;
- requirement to reason about cooling paths, phase fractions, or ternary compatibility.

It may not use player performance, solve rates, elapsed time, mistakes, geography, account history, or live telemetry.

## 3. Ruleset v0.1 categories

### Easy

A generated puzzle is Easy only when all applicable conditions hold:

- binary diagram;
- one invariant reaction;
- invariant is eutectic or eutectoid;
- zero intermediate phases, or one simple congruently melting line compound with its behaviour stated directly;
- no incongruent compound;
- reaction type is given directly;
- critical event coordinates are numerical;
- instructions are predominantly direct numerical or direct semantic facts;
- maximum required deduction chain is short;
- no more than one meaningful partial topology remains plausible after placing the supplied events;
- limited number of phase-bearing regions and boundary segments.

### Normal

A generated puzzle is Normal when it exceeds Easy but remains within all of the following:

- binary diagram;
- one to three invariant reactions;
- eutectic, eutectoid, peritectic, or peritectoid reactions permitted;
- up to two intermediate phases;
- congruent and one incongruent compound permitted;
- mixed direct and relational instructions;
- reaction type may require inference for at most one event;
- moderate dependency chains;
- more than one partial construction may initially appear plausible, but local and event-order constraints resolve the choice without requiring full global enumeration by the player.

### Advanced

A puzzle is Advanced when any Advanced trigger is present:

- ternary diagram under ruleset v0.1;
- more than three invariant reactions;
- more than two intermediate phases;
- interacting congruent and incongruent compound structures;
- multiple inferred reaction identities;
- instructions predominantly relational or observational;
- long dependency chains;
- several locally legal partial topologies remain possible until global compatibility, completeness, or cooling-path reasoning is applied;
- quantitative phase-fraction constraints interact with topology;
- advanced formal-rules families such as immiscibility when later enabled.

## 4. Manual revision

This ruleset may be replaced by v0.2 or later after design review, scientific review, or deliberate playtesting. Revision is a manual product decision and produces a new version. Existing puzzle identities retain the ruleset version under which they were classified.

## 5. Statistics

Statistics may be reported by difficulty but never feed back into the classifier. A puzzle does not move between difficulties because players found it easier or harder than expected.

## 6. Generator contract

The generator requests a target mode and must reject candidates classified into a different mode. It may not override the classifier label to fill inventory.

## 7. Future refinement

Later deterministic versions may replace broad thresholds with a formal complexity calculation. Any such calculation must remain inspectable, versioned, and based entirely on puzzle structure and instruction semantics.
