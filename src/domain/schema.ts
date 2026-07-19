export type PhaseId = string;
export type DiagramLabelId = string;
export type PointRoleId = string;
export type GeometryId = string;
export type CellId = string;

export type BinaryInvariantType =
  | "eutectic"
  | "peritectic"
  | "eutectoid"
  | "peritectoid"
  | "catatectic"
  | "monotectoid"
  | "monotectic"
  | "syntectic";

export interface InvariantIncidence {
  above: PhaseId[][];
  below: PhaseId[][];
}

export interface LogicalPoint {
  compositionBPercent: number;
  temperatureCelsius: number;
}

export type PhaseKind = "liquid" | "terminal-solid" | "line-compound" | "intermediate-solid-solution";

export type PhaseCompositionRole = "a-terminal" | "b-terminal" | "intermediate" | "complete-range";
export type PhaseTemperatureRole = "low-temperature" | "high-temperature";

export type ReactionType =
  | "eutectic"
  | "eutectoid"
  | "peritectic"
  | "peritectoid"
  | "monotectic"
  | "monotectoid"
  | "syntectic"
  | "catatectic"
  | "metatectic";

export type BoundaryKind =
  | "liquidus"
  | "solidus"
  | "solvus"
  | "miscibility-gap"
  | "line-compound"
  | "polymorph-boundary"
  | "ordering-boundary"
  | "stability-guide"
  | "phase-boundary";

export interface PhaseDefinition {
  id: PhaseId;
  symbol: string;
  name: string;
  kind: PhaseKind;
  required: boolean;
  /** Legacy grouping used by composed large-binary generators. */
  compositionGroupId?: string;
  /** Structural/solution family shared by polymorphs or ordered variants. */
  phaseFamilyId?: string;
  /** Composition-domain identity used to derive and audit notation. */
  compositionRole?: PhaseCompositionRole;
  /** Temperature identity for otherwise compositionally equivalent polymorphs. */
  temperatureRole?: PhaseTemperatureRole;
  /** Symbols in one group may be globally permuted when the diagram supplies no visible anchor. */
  labelEquivalenceGroup?: string;
  /** Fixed stoichiometric site. Only phases at this exact composition share it. */
  compositionSiteId?: string;
  fixedCompositionBPercent?: number;
  /** How an intermediate phase terminates on heating in the generated topology. */
  intermediateThermalMode?: "congruent" | "incongruent" | "eutectoid" | "peritectoid";
  /** True only when the topology contains a finite-width single-phase field. */
  partialSolubility?: boolean;
}

export interface IntermediateCompositionDefinition {
  id: string;
  label: string;
  compositionBPercent: number;
  phaseIds: PhaseId[];
}

export type PlacementConstraint =
  | { kind: "left-edge" }
  | { kind: "right-edge" }
  | { kind: "bottom-edge" }
  | { kind: "fixed-temperature"; temperatureCelsius: number };

export interface PointRoleDefinition {
  id: PointRoleId;
  symbol: string;
  instructionLabel: string;
  constraint: PlacementConstraint;
  required: boolean;
}

export interface PlayerPoint {
  id: string;
  roleId: PointRoleId;
  point: LogicalPoint;
  createdAtOrdinal: number;
}

export interface QuadraticCurveGeometry {
  type: "curve";
  id: GeometryId;
  startPointId: string;
  endPointId: string;
  control: LogicalPoint;
  createdBy: "player" | "generated";
  boundaryKind?: BoundaryKind;
  compositionSiteId?: string;
  semanticRole?: string;
  fieldBoundary?: boolean;
}

export interface InvariantHorizontalGeometry {
  type: "invariant-horizontal";
  id: GeometryId;
  startPointId: string;
  endPointId: string;
  interiorPointIds: string[];
  temperatureCelsius: number;
  phaseOrder: PhaseId[];
  createdBy: "player" | "generated";
}

export type PlayerGeometry = QuadraticCurveGeometry | InvariantHorizontalGeometry;

export interface OrientedBoundaryRef {
  geometryId: GeometryId | "frame-left" | "frame-right" | "frame-top" | "frame-bottom";
  /** Exact planar-graph segment. Geometry ids alone are ambiguous for horizontals. */
  segmentId?: string;
  direction: "forward" | "reverse";
}

export interface ExtractedCell {
  id: CellId;
  dimension: 2;
  boundary: OrientedBoundaryRef[];
  polygon: LogicalPoint[];
  labelPoint: LogicalPoint;
  phaseOrder: PhaseId[];
}

export type ToolId = "point" | "curve" | "horizontal" | "label" | "select" | "erase";

export interface NumericInstruction {
  id: string;
  compactText: string;
  roleId?: PointRoleId;
}

export interface RequiredCurveSpec {
  startRoleId: PointRoleId;
  endRoleId: PointRoleId;
  semanticRole: string;
  boundaryKind: BoundaryKind;
  compositionSiteId?: string;
}

/**
 * A token the player may place in a field. This is deliberately separate from
 * PhaseDefinition: one thermodynamic phase family may use a global token in a
 * single-phase field and composition-specific branch tokens at an invariant.
 */
export interface DiagramLabelDefinition {
  id: DiagramLabelId;
  symbol: string;
  name: string;
  phaseIds: PhaseId[];
  scope: "global-phase" | "invariant-branch";
  colorPhaseId: PhaseId;
  labelEquivalenceGroup?: string;
}

export interface RequiredInvariantSpec {
  startRoleId: PointRoleId;
  endRoleId: PointRoleId;
  interiorRoleIds: PointRoleId[];
  expectedAssemblage: PhaseId[];
  reactionType: ReactionType;
  incidence?: InvariantIncidence;
  reactantPhaseIds?: PhaseId[];
  productPhaseIds?: PhaseId[];
  phaseCompositionRoleIds?: Record<PhaseId, PointRoleId>;
  /** Local composition notation, e.g. alpha_1 and alpha_2, never global field identity. */
  participantNotation?: Record<PhaseId, string>;
}

export interface ExpectedFieldSpec {
  role: string;
  expectedAssemblage: PhaseId[];
  /** Player-facing tokens; expectedAssemblage remains the physics certificate. */
  expectedLabelIds?: DiagramLabelId[];
  witnessPoint: LogicalPoint;
  texture?: "partial-solubility" | "complete-solid-solution" | "ordered-solid-solution";
}

export interface PuzzleDefinition {
  schemaVersion: string;
  id: string;
  title: string;
  compositionMinPercentB: number;
  compositionMaxPercentB: number;
  temperatureMinCelsius: number;
  temperatureMaxCelsius: number;
  endMemberLabels: { left: string; right: string };
  intermediateCompositions: IntermediateCompositionDefinition[];
  phases: PhaseDefinition[];
  diagramLabels: DiagramLabelDefinition[];
  pointRoles: PointRoleDefinition[];
  instructions: NumericInstruction[];
  permittedTools: ToolId[];
  requiredCurves: RequiredCurveSpec[];
  requiredInvariants: RequiredInvariantSpec[];
  expectedFieldCount: number;
  expectedFields: ExpectedFieldSpec[];
  allowExtraGeometryOnSubmit: boolean;
}

export interface HiddenPointSolution {
  roleId: PointRoleId;
  point: LogicalPoint;
}

export interface SolutionCurve {
  type: "curve";
  startRoleId: PointRoleId;
  endRoleId: PointRoleId;
  recommendedControl: LogicalPoint;
  semanticRole?: string;
  boundaryKind?: BoundaryKind;
  compositionSiteId?: string;
  fieldBoundary?: boolean;
}

export interface HiddenInvariantSolution {
  type: "invariant-horizontal";
  startRoleId: PointRoleId;
  endRoleId: PointRoleId;
  interiorRoleIds: PointRoleId[];
  temperatureCelsius: number;
  expectedAssemblage: PhaseId[];
  reactionType: ReactionType;
  incidence?: InvariantIncidence;
  reactantPhaseIds?: PhaseId[];
  productPhaseIds?: PhaseId[];
  phaseCompositionRoleIds?: Record<PhaseId, PointRoleId>;
  participantNotation?: Record<PhaseId, string>;
}

export interface HiddenSolution {
  puzzleId: string;
  points: HiddenPointSolution[];
  curves: SolutionCurve[];
  invariants: HiddenInvariantSolution[];
  expectedFields: ExpectedFieldSpec[];
}

export interface ViewportState {
  scale: number;
  translateX: number;
  translateY: number;
}

export interface PuzzleMetrics {
  activeMilliseconds: number;
  timerStartedAt?: number;
  submitCount: number;
  submissionsRemaining: number;
  scoredAttemptEnded: boolean;
  continuingUnscored: boolean;
  localInvalidityCheckingEnabled: boolean;
  pointMoveCount: number;
  geometryDeleteCount: number;
  phaseDeleteCount: number;
  undoCount: number;
  solvedAt?: string;
}

export interface ConstructionState {
  version: 2;
  puzzleId: string;
  points: PlayerPoint[];
  geometry: PlayerGeometry[];
  cells: ExtractedCell[];
  activeTool: ToolId;
  activePointRoleId?: PointRoleId;
  activePhaseId?: PhaseId;
  selectedElementId?: string;
  instructionsCollapsed: boolean;
  viewport: ViewportState;
  metrics: PuzzleMetrics;
  solved: boolean;
  revealed: boolean;
  lastSubmitStatus?: SubmitStatus;
}

export type ViolationCategory = "structural" | "instruction" | "scientific" | "puzzle";

export interface RuleViolation {
  ruleId: string;
  category: ViolationCategory;
  severity: "error" | "warning";
  elementIds: string[];
  message: string;
}

export type SubmitStatus = "solved" | "incomplete" | "incorrect" | "malformed" | "failed-scored-attempt";

export interface ValidationResult {
  status: Exclude<SubmitStatus, "failed-scored-attempt">;
  violations: RuleViolation[];
}
