import { extractFaces } from "../canvas/face-extraction";
import type {
  ConstructionState,
  ExtractedCell,
  HiddenSolution,
  LogicalPoint,
  PhaseId,
  PlayerGeometry,
  PlayerPoint,
  PuzzleDefinition,
  ToolId,
} from "../domain/schema";

export function createInitialState(puzzle: PuzzleDefinition, now = Date.now()): ConstructionState {
  return {
    version: 2,
    puzzleId: puzzle.id,
    points: [],
    geometry: [],
    cells: [],
    activeTool: "point",
    activePointRoleId: puzzle.pointRoles[0]?.id,
    instructionsCollapsed: false,
    viewport: { scale: 1, translateX: 0, translateY: 0 },
    metrics: {
      activeMilliseconds: 0,
      timerStartedAt: now,
      submitCount: 0,
      submissionsRemaining: 3,
      scoredAttemptEnded: false,
      continuingUnscored: false,
      localInvalidityCheckingEnabled: false,
      pointMoveCount: 0,
      geometryDeleteCount: 0,
      phaseDeleteCount: 0,
      undoCount: 0,
    },
    solved: false,
    revealed: false,
  };
}

export function createLabelingState(
  puzzle: PuzzleDefinition,
  solution: HiddenSolution,
  now = Date.now(),
): ConstructionState {
  const points: PlayerPoint[] = solution.points.map((item, index) => ({
    id: `point:${item.roleId}`,
    roleId: item.roleId,
    point: item.point,
    createdAtOrdinal: index,
  }));
  const geometry: PlayerGeometry[] = [
    ...solution.curves.map((curve, index) => ({
      type: "curve" as const,
      id: `generated-curve:${index}`,
      startPointId: `point:${curve.startRoleId}`,
      endPointId: `point:${curve.endRoleId}`,
      control: curve.recommendedControl,
      createdBy: "generated" as const,
      semanticRole: curve.semanticRole,
      boundaryKind: curve.boundaryKind,
      compositionSiteId: curve.compositionSiteId,
      fieldBoundary: curve.fieldBoundary,
    })),
    ...solution.invariants.map((invariant, index) => ({
      type: "invariant-horizontal" as const,
      id: `generated-horizontal:${index}`,
      startPointId: `point:${invariant.startRoleId}`,
      endPointId: `point:${invariant.endRoleId}`,
      interiorPointIds: invariant.interiorRoleIds.map((role) => `point:${role}`),
      temperatureCelsius: invariant.temperatureCelsius,
      phaseOrder: [],
      createdBy: "generated" as const,
    })),
  ];
  return {
    ...createInitialState(puzzle, now),
    points,
    geometry,
    cells: extractFaces(points, geometry),
    activeTool: "label",
    activePointRoleId: undefined,
    activePhaseId: puzzle.diagramLabels[0]?.id,
  };
}

export function activeMilliseconds(state: ConstructionState, now = Date.now()): number {
  if (state.solved || (state.metrics.scoredAttemptEnded && !state.metrics.continuingUnscored) || !state.metrics.timerStartedAt) {
    return state.metrics.activeMilliseconds;
  }
  return state.metrics.activeMilliseconds + Math.max(0, now - state.metrics.timerStartedAt);
}

export function pauseTimer(state: ConstructionState, now = Date.now()): ConstructionState {
  if (!state.metrics.timerStartedAt) return state;
  return {
    ...state,
    metrics: {
      ...state.metrics,
      activeMilliseconds: activeMilliseconds(state, now),
      timerStartedAt: undefined,
    },
  };
}

export function resumeTimer(state: ConstructionState, now = Date.now()): ConstructionState {
  if (state.solved || (state.metrics.scoredAttemptEnded && !state.metrics.continuingUnscored) || state.metrics.timerStartedAt) return state;
  return { ...state, metrics: { ...state.metrics, timerStartedAt: now } };
}

function recomputeCells(
  points: PlayerPoint[],
  geometry: PlayerGeometry[],
  previousCells: ExtractedCell[],
): ExtractedCell[] {
  return extractFaces(points, geometry, previousCells);
}

export function placeOrMovePoint(
  state: ConstructionState,
  roleId: string,
  point: LogicalPoint,
): ConstructionState {
  const existing = state.points.find((candidate) => candidate.roleId === roleId);
  const points = existing
    ? state.points.map((candidate) => candidate.id === existing.id ? { ...candidate, point } : candidate)
    : [...state.points, {
      id: `point:${roleId}`,
      roleId,
      point,
      createdAtOrdinal: state.points.length,
    }];
  return {
    ...state,
    points,
    cells: recomputeCells(points, state.geometry, state.cells),
    metrics: {
      ...state.metrics,
      pointMoveCount: state.metrics.pointMoveCount + (existing ? 1 : 0),
    },
  };
}

export function addGeometry(state: ConstructionState, geometry: PlayerGeometry): ConstructionState {
  const nextGeometry = [...state.geometry, geometry];
  return {
    ...state,
    geometry: nextGeometry,
    cells: recomputeCells(state.points, nextGeometry, state.cells),
  };
}

export function updateGeometry(state: ConstructionState, geometry: PlayerGeometry): ConstructionState {
  const nextGeometry = state.geometry.map((candidate) => candidate.id === geometry.id ? geometry : candidate);
  return {
    ...state,
    geometry: nextGeometry,
    cells: recomputeCells(state.points, nextGeometry, state.cells),
  };
}

export function deleteGeometry(state: ConstructionState, geometryId: string): ConstructionState {
  const nextGeometry = state.geometry.filter((geometry) => geometry.id !== geometryId);
  return {
    ...state,
    geometry: nextGeometry,
    cells: recomputeCells(state.points, nextGeometry, state.cells),
    selectedElementId: undefined,
    metrics: { ...state.metrics, geometryDeleteCount: state.metrics.geometryDeleteCount + 1 },
  };
}

export function deletePoint(state: ConstructionState, pointId: string): ConstructionState {
  if (state.geometry.some((geometry) => geometry.startPointId === pointId
    || geometry.endPointId === pointId
    || (geometry.type === "invariant-horizontal" && geometry.interiorPointIds.includes(pointId)))) return state;
  const points = state.points.filter((point) => point.id !== pointId);
  return { ...state, points, cells: recomputeCells(points, state.geometry, state.cells) };
}

function orderedAssemblage(current: PhaseId[], phaseId: PhaseId, preferredOrder: PhaseId[]): PhaseId[] {
  const phases = [...new Set([...current, phaseId])];
  if (preferredOrder.length === 0) return phases;
  const rank = new Map(preferredOrder.map((id, index) => [id, index]));
  return phases.sort((left, right) => (rank.get(left) ?? Number.MAX_SAFE_INTEGER) - (rank.get(right) ?? Number.MAX_SAFE_INTEGER));
}

export function addPhaseToCell(state: ConstructionState, cellId: string, phaseId: PhaseId, preferredOrder: PhaseId[] = []): ConstructionState {
  const cell = state.cells.find((candidate) => candidate.id === cellId);
  if (!cell || cell.phaseOrder.includes(phaseId)) return state;
  return {
    ...state,
    cells: state.cells.map((cell) => cell.id === cellId
      ? { ...cell, phaseOrder: orderedAssemblage(cell.phaseOrder, phaseId, preferredOrder) }
      : cell),
  };
}

export function removePhaseFromCell(state: ConstructionState, cellId: string, phaseId: PhaseId): ConstructionState {
  const cell = state.cells.find((candidate) => candidate.id === cellId);
  if (!cell?.phaseOrder.includes(phaseId)) return state;
  return {
    ...state,
    cells: state.cells.map((cell) => cell.id === cellId
      ? { ...cell, phaseOrder: cell.phaseOrder.filter((phase) => phase !== phaseId) }
      : cell),
    metrics: { ...state.metrics, phaseDeleteCount: state.metrics.phaseDeleteCount + 1 },
  };
}

export function clearPhaseLabels(state: ConstructionState): ConstructionState {
  const removedCount = state.cells.reduce((total, cell) => total + cell.phaseOrder.length, 0);
  if (removedCount === 0) return state;
  return {
    ...state,
    activeTool: "label",
    selectedElementId: undefined,
    cells: state.cells.map((cell) => ({ ...cell, phaseOrder: [] })),
    metrics: { ...state.metrics, phaseDeleteCount: state.metrics.phaseDeleteCount + removedCount },
  };
}

export function togglePhaseInCell(state: ConstructionState, cellId: string, phaseId: PhaseId, preferredOrder: PhaseId[] = []): ConstructionState {
  const cell = state.cells.find((candidate) => candidate.id === cellId);
  if (!cell) return state;
  return cell.phaseOrder.includes(phaseId)
    ? removePhaseFromCell(state, cellId, phaseId)
    : addPhaseToCell(state, cellId, phaseId, preferredOrder);
}

export function setTool(state: ConstructionState, tool: ToolId): ConstructionState {
  return {
    ...state,
    activeTool: tool,
    activePointRoleId: tool === "point" ? state.activePointRoleId : undefined,
    activePhaseId: tool === "label" ? state.activePhaseId : undefined,
    selectedElementId: undefined,
    instructionsCollapsed: tool === "point" ? false : state.instructionsCollapsed,
  };
}

export function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
