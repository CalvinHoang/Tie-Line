export type ConceptCategory = "Critical points" | "Transformations" | "Diagram families";

export type ConceptDiagramKind =
  | "eutectic" | "peritectic" | "eutectoid" | "peritectoid" | "monotectic"
  | "monotectoid" | "syntectic" | "spinodal" | "spinodal-liquid" | "spinodal-solid"
  | "polymorph" | "polymorph-super" | "compound" | "compound-incongruent"
  | "stability" | "solution" | "solution-maximum" | "solution-minimum" | "miscibility-gap"
  | "partial" | "secondary" | "liquid-immiscible" | "metatectic" | "state-change" | "triple";

export interface RuleConcept {
  id: string;
  title: string;
  category: ConceptCategory;
  diagram: ConceptDiagramKind;
  rule: string;
  reaction?: string;
  direction?: "On cooling" | "On heating" | "On heating or cooling";
  transitionNote?: string;
  cue: string;
}

const invariantReaction = (type: ReactionType) => REACTION_RULES[type].coolingEquation;

export const RULE_CONCEPTS: RuleConcept[] = [
  { id: "eutectic-point", title: "Eutectic point", category: "Critical points", diagram: "eutectic", reaction: invariantReaction("eutectic"), direction: "On cooling", transitionNote: "Liquid is consumed; alpha and beta form simultaneously.", rule: "One liquid becomes two solid phases on cooling.", cue: "Two liquidus branches meet a horizontal invariant line at a low point." },
  { id: "eutectoid-point", title: "Eutectoid point", category: "Critical points", diagram: "eutectoid", reaction: invariantReaction("eutectoid"), direction: "On cooling", transitionNote: "Gamma is consumed; two different solid phases form.", rule: "One solid phase separates into two different solids on cooling.", cue: "The three-phase invariant lies wholly below the solidus." },
  { id: "monotectic-point", title: "Monotectic point", category: "Critical points", diagram: "monotectic", reaction: invariantReaction("monotectic"), direction: "On cooling", transitionNote: "One liquid is consumed; a second liquid and alpha form.", rule: "One liquid transforms into a second liquid and a solid on cooling. The 2L dome above the invariant closes at a liquid consolute point.", cue: "A 2L dome capped by its consolute point stands on the monotectic horizontal; the reaction point is the open circle where dome and horizontal meet." },
  { id: "monotectoid-point", title: "Monotectoid point", category: "Critical points", diagram: "monotectoid", reaction: invariantReaction("monotectoid"), direction: "On cooling", transitionNote: "One solid composition is consumed; another solid composition and beta form.", rule: "One solid solution becomes a second composition of that solid plus another solid.", cue: "A solid-state decomposition invariant with the parent composition between both products." },
  { id: "metatectic-point", title: "Metatectic (catatectic) point", category: "Critical points", diagram: "metatectic", reaction: invariantReaction("metatectic"), direction: "On cooling", transitionNote: "The parent solid is consumed; a different solid and liquid form.", rule: "A solid separates into a different solid and liquid on cooling.", cue: "The parent-solid composition lies between the product-solid and liquid compositions; liquid remains below the invariant." },
  { id: "liquid-spinodal", title: "Liquid spinodal", category: "Critical points", diagram: "spinodal-liquid", reaction: "L₁ → L₂ + L₃", direction: "On cooling", transitionNote: "The homogeneous liquid becomes unstable and separates continuously into two liquid compositions.", rule: "A liquid becomes unstable and separates continuously into two liquid compositions.", cue: "An inner spinodal curve nests inside the 2L dome and touches it only at the marked critical point." },
  { id: "solid-spinodal", title: "Solid spinodal", category: "Critical points", diagram: "spinodal-solid", reaction: "α₁ → α₂ + α₃", direction: "On cooling", transitionNote: "The homogeneous solid becomes unstable and separates continuously into two solid compositions.", rule: "A solid solution decomposes continuously into two solid compositions.", cue: "An inner spinodal curve nests inside the solvus dome and touches it only at the marked critical point." },
  { id: "consolute-point", title: "Consolute (critical) point", category: "Critical points", diagram: "miscibility-gap", reaction: "α ⇌ α₁ + α₂", direction: "On heating or cooling", transitionNote: "On cooling below the consolute point the single phase separates into two compositions; on heating the two compositions merge back into one.", rule: "A miscibility gap closes at its consolute point — the dome's temperature maximum, where the compositions of the two coexisting phases become identical and tie-lines shrink to zero length. It is not a three-phase invariant: no horizontal reaction line passes through it.", cue: "The marked dot capping a solvus or 2L dome, with single-phase solution everywhere above it." },
  { id: "peritectic-point", title: "Peritectic point", category: "Critical points", diagram: "peritectic", reaction: invariantReaction("peritectic"), direction: "On cooling", transitionNote: "Liquid and alpha are consumed; beta forms.", rule: "A liquid and one solid react to form a different solid on cooling.", cue: "A liquidus branch terminates on a horizontal invariant beside another boundary." },
  { id: "peritectoid-point", title: "Peritectoid point", category: "Critical points", diagram: "peritectoid", reaction: invariantReaction("peritectoid"), direction: "On cooling", transitionNote: "Alpha and beta are consumed; gamma forms.", rule: "Two solids react to form a third solid on cooling.", cue: "The invariant and all adjoining fields are below the solidus." },
  { id: "syntectic-point", title: "Syntectic point", category: "Critical points", diagram: "syntectic", reaction: invariantReaction("syntectic"), direction: "On cooling", transitionNote: "Two immiscible liquids are consumed; alpha forms.", rule: "Two liquids combine to form one solid phase on cooling.", cue: "A liquid miscibility gap closes onto a compound or solid field." },

  { id: "subsolidus-polymorphism", title: "Subsolidus polymorphism", category: "Transformations", diagram: "polymorph", reaction: "α ⇌ β", rule: "A crystal structure changes below every melting boundary.", cue: "An extra solid-state horizontal crosses beneath the eutectic or solidus." },
  { id: "supersolidus-polymorphism", title: "Supersolidus polymorphism", category: "Transformations", diagram: "polymorph-super", reaction: "α ⇌ β", rule: "A polymorphic transition intersects or lies above part of the solidus.", cue: "The structural-change boundary reaches a liquid-containing field." },
  { id: "superlattice", title: "Superlattice ordering", category: "Transformations", diagram: "miscibility-gap", reaction: "α ⇌ α′", rule: "An ordered superlattice forms from a disordered parent solid without changing the basic phase family.", cue: "A smaller ordering dome or boundary appears inside a solid solution." },
  { id: "congruent-melting", title: "Congruent melting", category: "Transformations", diagram: "compound", reaction: "γ ⇌ L", rule: "A compound melts to liquid of the same composition.", cue: "A vertical compound line reaches a liquidus maximum." },
  { id: "degenerate-eutectic", title: "Degenerate eutectic", category: "Transformations", diagram: "eutectic", reaction: "L → α + β", rule: "The eutectic composition coincides with, or lies extremely close to, an end member or compound.", cue: "The invariant point is pushed against a limiting composition." },
  { id: "boiling-point", title: "Boiling point", category: "Transformations", diagram: "state-change", reaction: "L ⇌ G", rule: "Liquid and gas coexist at the boiling condition.", cue: "The state change is between liquid and gas rather than between condensed phases." },
  { id: "sublimation-point", title: "Sublimation point", category: "Transformations", diagram: "state-change", reaction: "S ⇌ G", rule: "A solid changes directly to gas without passing through a liquid state.", cue: "The equilibrium joins solid and gas fields." },
  { id: "triple-point", title: "Triple point", category: "Transformations", diagram: "triple", reaction: "S + L + G", rule: "Solid, liquid and gas coexist at one unique pressure-temperature condition.", cue: "Three state boundaries meet at a single point in a T-P diagram." },

  { id: "simple-eutectic", title: "Simple eutectic", category: "Diagram families", diagram: "eutectic", rule: "The liquid field divides into L + α and L + β above one eutectic invariant; α + β lies below it.", cue: "A clean V-shaped pair of liquidus curves over one horizontal." },
  { id: "congruent-compound", title: "Congruent compound", category: "Diagram families", diagram: "compound", rule: "An intermediate compound is stable up to a liquidus maximum at its own composition.", cue: "A central vertical compound line meets a peak and divides two eutectic subsystems." },
  { id: "incongruent-compound", title: "Incongruent compound", category: "Diagram families", diagram: "compound-incongruent", rule: "The compound decomposes or forms through a peritectic rather than melting directly to equal-composition liquid.", cue: "The vertical compound line terminates at an invariant horizontal below the liquidus." },
  { id: "compound-stability", title: "Compound stability limits", category: "Diagram families", diagram: "stability", rule: "A compound may have an upper limit, a lower limit, or both limits to its stable temperature range.", cue: "The vertical compound field begins or ends at one or two horizontal reactions." },
  { id: "complete-solid-solution", title: "Complete solid solution", category: "Diagram families", diagram: "solution", rule: "One solid solution spans the full composition range; liquidus and solidus bound a continuous two-phase lens.", cue: "No eutectic invariant interrupts the liquidus-solidus pair." },
  { id: "maximum-melting", title: "Maximum melting point", category: "Diagram families", diagram: "solution-maximum", rule: "A continuous solid solution has an interior composition whose melting temperature exceeds both end members.", cue: "Liquidus and solidus meet at an internal maximum." },
  { id: "minimum-melting", title: "Minimum melting point", category: "Diagram families", diagram: "solution-minimum", rule: "A continuous solid solution has an interior composition whose melting temperature is below both end members.", cue: "Liquidus and solidus meet at an internal minimum without an invariant reaction." },
  { id: "solid-miscibility-gap", title: "Solid miscibility gap", category: "Diagram families", diagram: "miscibility-gap", rule: "A nominally continuous solid solution separates into two solid compositions inside a solvus dome. The gap closes at the marked consolute point, above which one continuous solid solution remains.", cue: "A two-solid dome below the solidus, capped by its consolute point." },
  { id: "partial-miscibility", title: "Partial solid miscibility", category: "Diagram families", diagram: "partial", rule: "Terminal solid solutions have limited composition ranges, leaving a two-solid field between their solvus boundaries.", cue: "Curved solvus boundaries rise from the low-temperature corners." },
  { id: "secondary-solution", title: "Secondary solid solution", category: "Diagram families", diagram: "secondary", rule: "An additional solid-solution field exists between or beside the primary terminal solutions.", cue: "A separate intermediate field is bounded within the solid region." },
  { id: "liquid-immiscibility", title: "Liquid immiscibility", category: "Diagram families", diagram: "liquid-immiscible", rule: "A single liquid separates into two liquids over a composition-temperature range.", cue: "A 2L miscibility dome appears inside the liquid field." },
  { id: "metastable-immiscibility", title: "Metastable immiscibility", category: "Diagram families", diagram: "spinodal", rule: "A hidden or metastable miscibility gap is pre-empted by a more stable phase reaction.", cue: "A dashed continuation lies beneath the stable equilibrium boundaries." },
];

export const RULE_CATEGORIES: ConceptCategory[] = ["Critical points", "Transformations", "Diagram families"];
import { REACTION_RULES } from "./phase-rules";
import type { ReactionType } from "./schema";
