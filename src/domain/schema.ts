export type PhaseId = string;
export type PointRoleId = string;
export type GeometryId = string;
export type CellId = string;

export interface LogicalPoint {
  compositionBPercent: number;
  temperatureCelsius: number;
}

export type PhaseKind = "liquid" | "terminal-solid" | "line-compound" | "intermediate-solid-solution";

export interface PhaseDefinition {
  id: PhaseId;
  symbol: string;
  name: string;
  kind: PhaseKind;
  required: boolean;
  compositionGroupId?: string;
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
}

export interface RequiredInvariantSpec {
  startRoleId: PointRoleId;
  endRoleId: PointRoleId;
  interiorRoleIds: PointRoleId[];
  expectedAssemblage: PhaseId[];
  reactionType: string;
}

export interface ExpectedFieldSpec {
  role: string;
  expectedAssemblage: PhaseId[];
  witnessPoint: LogicalPoint;
  texture?: "partial-solubility";
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
  fieldBoundary?: boolean;
}

export interface HiddenInvariantSolution {
  type: "invariant-horizontal";
  startRoleId: PointRoleId;
  endRoleId: PointRoleId;
  interiorRoleIds: PointRoleId[];
  temperatureCelsius: number;
  expectedAssemblage: PhaseId[];
  reactionType: string;
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
