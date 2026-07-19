import { useEffect, useMemo, useRef, useState } from "react";
import { constrainPoint, distance, formatCoordinate, FRAME, logicalToSvg, roleById, svgToLogical, VIEWBOX } from "../domain/coordinates";
import { geometryPolyline, hasIllegalIntersection, pointInPolygon, sameLogicalPoint, unorderedPairKey } from "../domain/geometry";
import { fieldLabelPlacement } from "./label-placement";
import type {
  ConstructionState,
  LogicalPoint,
  PhaseId,
  PlayerGeometry,
  PlayerPoint,
  PuzzleDefinition,
  QuadraticCurveGeometry,
  ViewportState,
} from "../domain/schema";

type Gesture =
  | { kind: "point"; roleId: string; preview: LogicalPoint }
  | { kind: "curve" | "horizontal"; startPointId: string; raw: LogicalPoint[]; preview: LogicalPoint }
  | { kind: "move-point"; pointId: string; preview: LogicalPoint }
  | { kind: "handle"; geometryId: string; preview: LogicalPoint }
  | undefined;

interface DiagramCanvasProps {
  state: ConstructionState;
  puzzle: PuzzleDefinition;
  invalidPointIds: Set<string>;
  externalPreview?: { kind: "point" | "phase"; value: string; point: LogicalPoint };
  onPlacePoint: (roleId: string, point: LogicalPoint) => void;
  onAddGeometry: (geometry: PlayerGeometry) => void;
  onUpdateGeometry: (geometry: PlayerGeometry) => void;
  onTogglePhaseInCell: (cellId: string, phaseId: PhaseId) => void;
  onRemovePhaseFromCell: (cellId: string, phaseId: PhaseId) => void;
  onDeleteGeometry: (geometryId: string) => void;
  onDeletePoint: (pointId: string) => void;
  onSelectElement: (elementId?: string) => void;
  onViewportChange: (viewport: ViewportState) => void;
  onRejected: (message: string) => void;
}

const phaseSymbol = (puzzle: PuzzleDefinition, id: PhaseId) => puzzle.phases.find((phase) => phase.id === id)?.symbol ?? id;
const logicalPath = (points: LogicalPoint[]) => points.map((point, index) => {
  const svg = logicalToSvg(point);
  return `${index === 0 ? "M" : "L"}${svg.x} ${svg.y}`;
}).join(" ");

function nearestPoint(target: LogicalPoint, points: PlayerPoint[], radius = 4): PlayerPoint | undefined {
  return points.map((point) => ({ point, d: distance(target, point.point) })).sort((a, b) => a.d - b.d)[0]?.d <= radius
    ? points.map((point) => ({ point, d: distance(target, point.point) })).sort((a, b) => a.d - b.d)[0].point
    : undefined;
}

export function DiagramCanvas(props: DiagramCanvasProps) {
  const { state, puzzle } = props;
  const svgRef = useRef<SVGSVGElement>(null);
  const [gesture, setGesture] = useState<Gesture>();
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; center: { x: number; y: number }; viewport: ViewportState } | undefined>(undefined);
  const [targetFeedback, setTargetFeedback] = useState<{
    id: number;
    targetId: string;
    point: LogicalPoint;
    phaseId: PhaseId;
    removing: boolean;
  }>();

  useEffect(() => {
    if (!targetFeedback) return;
    const timer = window.setTimeout(() => setTargetFeedback((current) => current?.id === targetFeedback.id ? undefined : current), 360);
    return () => window.clearTimeout(timer);
  }, [targetFeedback]);

  const toLogical = (clientX: number, clientY: number): LogicalPoint => {
    const rect = svgRef.current!.getBoundingClientRect();
    const svgX = ((clientX - rect.left) / rect.width) * VIEWBOX.width;
    const svgY = ((clientY - rect.top) / rect.height) * VIEWBOX.height;
    return svgToLogical(
      (svgX - state.viewport.translateX) / state.viewport.scale,
      (svgY - state.viewport.translateY) / state.viewport.scale,
    );
  };
  // A small logical tolerance keeps frame-edge anchors easy to acquire despite
  // sub-pixel client/SVG conversion at different device scales.
  const inFrame = (point: LogicalPoint) => point.compositionBPercent >= -2 && point.compositionBPercent <= 102
    && point.temperatureCelsius >= -25 && point.temperatureCelsius <= 1125;

  const confirmTarget = (event: React.PointerEvent<SVGElement>, targetId: string, phaseId: PhaseId, removing: boolean) => {
    setTargetFeedback((current) => ({
      id: (current?.id ?? 0) + 1,
      targetId,
      point: toLogical(event.clientX, event.clientY),
      phaseId,
      removing,
    }));
  };

  const pointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (state.solved || state.revealed) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        viewport: state.viewport,
      };
      setGesture(undefined);
      return;
    }
    const logical = toLogical(event.clientX, event.clientY);
    if (!inFrame(logical)) return;
    if (state.activeTool === "point" && state.activePointRoleId) {
      const role = roleById(puzzle.pointRoles, state.activePointRoleId);
      setGesture({ kind: "point", roleId: role.id, preview: constrainPoint(logical, role.constraint) });
    } else if (state.activeTool === "curve" || state.activeTool === "horizontal") {
      const start = nearestPoint(logical, state.points);
      if (start) setGesture({ kind: state.activeTool, startPointId: start.id, raw: [start.point, logical], preview: logical });
    }
  };

  const pointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (pointers.current.has(event.pointerId)) pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const nextDistance = Math.hypot(a.x - b.x, a.y - b.y);
      const nextCenter = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const scale = Math.min(3, Math.max(0.8, pinch.current.viewport.scale * (nextDistance / pinch.current.distance)));
      props.onViewportChange({
        scale,
        translateX: pinch.current.viewport.translateX + (nextCenter.x - pinch.current.center.x) * (VIEWBOX.width / svgRef.current!.clientWidth),
        translateY: pinch.current.viewport.translateY + (nextCenter.y - pinch.current.center.y) * (VIEWBOX.height / svgRef.current!.clientHeight),
      });
      return;
    }
    if (!gesture) return;
    const logical = toLogical(event.clientX, event.clientY);
    if (gesture.kind === "point") {
      const role = roleById(puzzle.pointRoles, gesture.roleId);
      setGesture({ ...gesture, preview: constrainPoint(logical, role.constraint) });
    } else if (gesture.kind === "curve" || gesture.kind === "horizontal") {
      setGesture({ ...gesture, preview: logical, raw: [...gesture.raw.slice(-20), logical] });
    } else if (gesture.kind === "move-point") {
      const point = state.points.find((candidate) => candidate.id === gesture.pointId)!;
      const role = roleById(puzzle.pointRoles, point.roleId);
      setGesture({ ...gesture, preview: constrainPoint(logical, role.constraint) });
    } else if (gesture.kind === "handle") {
      setGesture({ ...gesture, preview: logical });
    }
  };

  const pointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = undefined;
    if (!gesture) return;
    if (gesture.kind === "point") {
      props.onPlacePoint(gesture.roleId, gesture.preview);
    } else if (gesture.kind === "move-point") {
      const point = state.points.find((candidate) => candidate.id === gesture.pointId)!;
      props.onPlacePoint(point.roleId, gesture.preview);
    } else if (gesture.kind === "handle") {
      const curve = state.geometry.find((candidate) => candidate.id === gesture.geometryId);
      if (curve?.type === "curve") props.onUpdateGeometry({ ...curve, control: gesture.preview });
    } else {
      const end = nearestPoint(gesture.preview, state.points);
      const start = state.points.find((point) => point.id === gesture.startPointId);
      if (!end || !start || end.id === start.id) {
        props.onRejected("Release on a different committed anchor.");
        setGesture(undefined);
        return;
      }
      const duplicate = state.geometry.some((item) => unorderedPairKey(item.startPointId, item.endPointId) === unorderedPairKey(start.id, end.id));
      if (duplicate) {
        props.onRejected("Those anchors are already connected.");
        setGesture(undefined);
        return;
      }
      let candidate: PlayerGeometry;
      if (gesture.kind === "horizontal") {
        if (Math.abs(start.point.temperatureCelsius - end.point.temperatureCelsius) > 0.1) {
          props.onRejected("A horizontal must join anchors on one temperature row.");
          setGesture(undefined);
          return;
        }
        const min = Math.min(start.point.compositionBPercent, end.point.compositionBPercent);
        const max = Math.max(start.point.compositionBPercent, end.point.compositionBPercent);
        const interiorPointIds = state.points.filter((point) => point.id !== start.id && point.id !== end.id
          && Math.abs(point.point.temperatureCelsius - start.point.temperatureCelsius) < 0.1
          && point.point.compositionBPercent > min && point.point.compositionBPercent < max)
          .sort((a, b) => a.point.compositionBPercent - b.point.compositionBPercent).map((point) => point.id);
        candidate = {
          type: "invariant-horizontal",
          id: `horizontal:${Date.now()}`,
          startPointId: start.id,
          endPointId: end.id,
          interiorPointIds,
          temperatureCelsius: start.point.temperatureCelsius,
          phaseOrder: [],
          createdBy: "player",
        };
      } else {
        const gestureControl = gesture.raw[Math.floor(gesture.raw.length / 2)] ?? {
          compositionBPercent: (start.point.compositionBPercent + end.point.compositionBPercent) / 2,
          temperatureCelsius: (start.point.temperatureCelsius + end.point.temperatureCelsius) / 2,
        };
        candidate = {
          type: "curve",
          id: `curve:${Date.now()}`,
          startPointId: start.id,
          endPointId: end.id,
          control: gestureControl,
          createdBy: "player",
        };
      }
      if (hasIllegalIntersection(candidate, state.geometry, state.points)) props.onRejected("That object would cross or overlap existing geometry.");
      else props.onAddGeometry(candidate);
    }
    setGesture(undefined);
  };

  const curvePaths = useMemo(() => state.geometry.filter((item): item is QuadraticCurveGeometry => item.type === "curve").map((curve) => {
    const start = state.points.find((point) => point.id === curve.startPointId)?.point;
    const end = state.points.find((point) => point.id === curve.endPointId)?.point;
    if (!start || !end) return { curve, d: "" };
    const a = logicalToSvg(start);
    const c = logicalToSvg(curve.control);
    const b = logicalToSvg(end);
    return { curve, d: `M${a.x} ${a.y} Q${c.x} ${c.y} ${b.x} ${b.y}` };
  }), [state.geometry, state.points]);

  const fieldLabelPlacements = useMemo(() => new Map(state.cells
    .filter((cell) => cell.phaseOrder.length > 0)
    .map((cell) => [cell.id, fieldLabelPlacement(cell.polygon, Math.max(2, cell.phaseOrder.length))])), [state.cells]);

  const fieldTextures = useMemo(() => new Map(state.cells.flatMap((cell) => {
    const expected = puzzle.expectedFields.find((field) => sameLogicalPoint(field.witnessPoint, cell.labelPoint));
    return expected?.texture ? [[cell.id, expected.texture] as const] : [];
  })), [puzzle.expectedFields, state.cells]);

  const spinodalOverlayPath = useMemo(() => {
    const left = state.geometry.find((item) => item.type === "curve" && item.semanticRole === "spinodal-left");
    const right = state.geometry.find((item) => item.type === "curve" && item.semanticRole === "spinodal-right");
    if (!left || left.type !== "curve" || !right || right.type !== "curve") return undefined;
    const leftStart = state.points.find((point) => point.id === left.startPointId)?.point;
    const peak = state.points.find((point) => point.id === left.endPointId)?.point;
    const rightEnd = state.points.find((point) => point.id === right.endPointId)?.point;
    if (!leftStart || !peak || !rightEnd) return undefined;
    const a = logicalToSvg(leftStart);
    const lc = logicalToSvg(left.control);
    const p = logicalToSvg(peak);
    const rc = logicalToSvg(right.control);
    const b = logicalToSvg(rightEnd);
    return `M${a.x} ${a.y} Q${lc.x} ${lc.y} ${p.x} ${p.y} Q${rc.x} ${rc.y} ${b.x} ${b.y} Z`;
  }, [state.geometry, state.points]);

  const intermediateCompositionLabels = useMemo(() => puzzle.intermediateCompositions.map((composition) => ({
    ...composition,
    x: logicalToSvg({ compositionBPercent: composition.compositionBPercent, temperatureCelsius: 0 }).x,
  })), [puzzle.intermediateCompositions]);

  const previewPoint = gesture?.kind === "point" || gesture?.kind === "move-point" ? gesture.preview
    : props.externalPreview?.kind === "point" ? props.externalPreview.point : undefined;
  const selectedCurve = state.geometry.find((item) => item.id === state.selectedElementId && item.type === "curve" && item.createdBy === "player") as QuadraticCurveGeometry | undefined;

  return (
    <svg
      id="tie-line-board"
      ref={svgRef}
      className="diagram-canvas"
      viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
      preserveAspectRatio="xMidYMid meet"
      role="application"
      aria-label="Temperature-composition phase diagram board"
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={pointerUp}
    >
      <defs>
        <pattern id="partial-solubility-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="9" />
        </pattern>
        <pattern id="unstable-spinodal-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
          <line x1="0" y1="0" x2="0" y2="8" />
        </pattern>
        <filter id="paper-grain" x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="11" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.36  0 0 0 0 0.30  0 0 0 0 0.20  0 0 0 0.32 0" />
        </filter>
      </defs>
      <g className="ink-plate" transform={`translate(${state.viewport.translateX} ${state.viewport.translateY}) scale(${state.viewport.scale})`}>
        <rect className="board-surface" x={FRAME.left} y={FRAME.top} width={FRAME.right - FRAME.left} height={FRAME.bottom - FRAME.top} />
        <rect className="board-grain" aria-hidden="true" x={FRAME.left} y={FRAME.top} width={FRAME.right - FRAME.left} height={FRAME.bottom - FRAME.top} filter="url(#paper-grain)" />
        {state.activeTool === "point" && !state.solved && (
          <g className="placement-grid" aria-hidden="true">
            {Array.from({ length: 11 }, (_, index) => {
              const x = logicalToSvg({ compositionBPercent: index * 10, temperatureCelsius: 0 }).x;
              return <line key={`x-${index}`} x1={x} x2={x} y1={FRAME.top} y2={FRAME.bottom} />;
            })}
            {Array.from({ length: 12 }, (_, index) => {
              const y = logicalToSvg({ compositionBPercent: 0, temperatureCelsius: Math.min(1100, index * 100) }).y;
              return <line key={`y-${index}`} x1={FRAME.left} x2={FRAME.right} y1={y} y2={y} />;
            })}
          </g>
        )}

        {state.cells.map((cell) => {
          const texture = fieldTextures.get(cell.id);
          if (!texture) return null;
          return <path key={`texture:${cell.id}`} className={`field-texture texture-${texture}`} d={`${logicalPath(cell.polygon)} Z`} />;
        })}

        {spinodalOverlayPath && <path className="stability-overlay spinodal-unstable-overlay" d={spinodalOverlayPath} />}

        {state.cells.map((cell) => {
          const d = `${logicalPath(cell.polygon)} Z`;
          const phaseClasses = cell.phaseOrder.map((phase) => `field-${phase}`).join(" ");
          return <path key={cell.id} className={`field-target ${cell.phaseOrder.length > 0 ? "is-labelled" : ""} ${targetFeedback?.targetId === cell.id ? "is-confirmed" : ""} ${phaseClasses}`} d={d} onPointerDown={(event) => {
            if (state.activeTool !== "label" || !state.activePhaseId || state.solved || state.revealed) return;
            event.stopPropagation();
            const phaseId = state.activePhaseId;
            confirmTarget(event, cell.id, phaseId, cell.phaseOrder.includes(phaseId));
            props.onTogglePhaseInCell(cell.id, phaseId);
          }} />;
        })}

        {curvePaths.map(({ curve, d }) => (
          <g key={curve.id}>
            <path
              className="geometry-hit"
              d={d}
              style={{ pointerEvents: curve.createdBy === "player" && (state.activeTool === "select" || state.activeTool === "erase") ? "stroke" : "none" }}
              onPointerDown={(event) => {
              if (state.solved) return;
              if (curve.createdBy === "player" && state.activeTool === "erase") {
                event.stopPropagation();
                props.onDeleteGeometry(curve.id);
              } else if (state.activeTool === "select") {
                event.stopPropagation();
                props.onSelectElement(curve.id);
              }
              }}
            />
            <path pathLength={1} className={`geometry-line ${curve.fieldBoundary === false ? "is-stability-guide" : ""} ${state.selectedElementId === curve.id ? "is-selected" : ""}`} d={d} />
          </g>
        ))}

        {state.geometry.filter((item) => item.type === "invariant-horizontal").map((horizontal) => {
          const line = geometryPolyline(horizontal, state.points);
          const start = line[0] ? logicalToSvg(line[0]) : undefined;
          const end = line.at(-1) ? logicalToSvg(line.at(-1)!) : undefined;
          if (!start || !end) return null;
          return (
            <g key={horizontal.id}>
              <line className="geometry-hit" style={{ pointerEvents: horizontal.createdBy === "player" && (state.activeTool === "select" || state.activeTool === "erase") ? "stroke" : "none" }} x1={start.x} y1={start.y} x2={end.x} y2={end.y} onPointerDown={(event) => {
                if (state.solved) return;
                if (horizontal.createdBy === "player" && state.activeTool === "erase") {
                  event.stopPropagation();
                  props.onDeleteGeometry(horizontal.id);
                }
                if (horizontal.createdBy === "player" && state.activeTool === "select") {
                  event.stopPropagation();
                  props.onSelectElement(horizontal.id);
                }
              }} />
              <line pathLength={1} className={`geometry-line invariant-line ${state.selectedElementId === horizontal.id ? "is-selected" : ""}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
            </g>
          );
        })}

        {state.points.map((point, pointIndex) => {
          const svg = logicalToSvg(point.point);
          const invalid = props.invalidPointIds.has(point.id);
          return (
            <g key={point.id} className={`point-mark ${invalid ? "is-invalid" : ""} ${state.selectedElementId === point.id ? "is-selected" : ""}`}>
              <circle className="point-hit" cx={svg.x} cy={svg.y} r={24} style={{ pointerEvents: puzzle.permittedTools.includes("point") || puzzle.permittedTools.includes("select") ? "all" : "none" }} onPointerDown={(event) => {
                if (state.solved) return;
                if (state.activeTool === "erase") {
                  event.stopPropagation();
                  props.onDeletePoint(point.id);
                } else if (state.activeTool === "select") {
                  event.stopPropagation();
                  props.onSelectElement(point.id);
                  setGesture({ kind: "move-point", pointId: point.id, preview: point.point });
                }
              }} />
              <circle
                className="point-dot"
                cx={svg.x}
                cy={svg.y}
                r={state.solved || !puzzle.permittedTools.includes("point") ? 3 : 6}
                style={{ animationDelay: `${180 + pointIndex * 32}ms` }}
              />
            </g>
          );
        })}

        {targetFeedback && (() => {
          const point = logicalToSvg(targetFeedback.point);
          return <circle
            key={targetFeedback.id}
            className={`target-contact phase-${targetFeedback.phaseId} ${targetFeedback.removing ? "is-removing" : "is-adding"}`}
            cx={point.x}
            cy={point.y}
            r={8}
          />;
        })()}

        {state.cells.map((cell) => {
          if (cell.phaseOrder.length === 0) return null;
          const label = fieldLabelPlacements.get(cell.id) ?? { ...logicalToSvg(cell.labelPoint), scale: 1, fits: false, orientation: "horizontal" as const };
          return <PhaseLabel
            key={`label:${cell.id}`}
            x={label.x}
            y={label.y}
            phases={cell.phaseOrder}
            puzzle={puzzle}
            scale={label.scale}
            fitsField={label.fits}
            orientation={label.orientation}
            onRemove={state.activeTool === "erase"
              ? (phaseId) => props.onRemovePhaseFromCell(cell.id, phaseId)
              : undefined}
          />;
        })}

        {gesture && (gesture.kind === "curve" || gesture.kind === "horizontal") && (
          <g aria-hidden="true">
            <path className="raw-trace" d={logicalPath(gesture.raw)} />
            {gesture.kind === "curve" ? (
              <path className="candidate-line" d={logicalPath([state.points.find((point) => point.id === gesture.startPointId)!.point, gesture.preview])} />
            ) : (() => {
              const startPoint = state.points.find((point) => point.id === gesture.startPointId)!.point;
              return <path className="candidate-line" d={logicalPath([startPoint, { compositionBPercent: gesture.preview.compositionBPercent, temperatureCelsius: startPoint.temperatureCelsius }])} />;
            })()}
          </g>
        )}

        {previewPoint && (() => {
          const svg = logicalToSvg(previewPoint);
          return (
            <g className="point-preview" aria-hidden="true">
              <circle cx={svg.x} cy={svg.y} r={10} />
              <line x1={svg.x - 18} x2={svg.x + 18} y1={svg.y} y2={svg.y} />
              <line x1={svg.x} x2={svg.x} y1={svg.y - 18} y2={svg.y + 18} />
              <text x={svg.x + 18} y={svg.y - 18}>{formatCoordinate(previewPoint)}</text>
            </g>
          );
        })()}

        {selectedCurve && (() => {
          const startPoint = state.points.find((point) => point.id === selectedCurve.startPointId)!.point;
          const endPoint = state.points.find((point) => point.id === selectedCurve.endPointId)!.point;
          const a = logicalToSvg(startPoint);
          const b = logicalToSvg(endPoint);
          const c = logicalToSvg(gesture?.kind === "handle" && gesture.geometryId === selectedCurve.id ? gesture.preview : selectedCurve.control);
          return (
            <g className="curve-handle">
              <line x1={a.x} y1={a.y} x2={c.x} y2={c.y} />
              <line x1={c.x} y1={c.y} x2={b.x} y2={b.y} />
              <circle cx={c.x} cy={c.y} r={13} onPointerDown={(event) => {
                event.stopPropagation();
                setGesture({ kind: "handle", geometryId: selectedCurve.id, preview: selectedCurve.control });
              }} />
            </g>
          );
        })()}

        <path className="board-frame" d={`M${FRAME.left} ${FRAME.top} V${FRAME.bottom} H${FRAME.right} V${FRAME.top}`} />
        <text className="axis-label axis-t" x={FRAME.left - 42} y={(FRAME.top + FRAME.bottom) / 2}>T</text>
        <text className="axis-label" x={FRAME.left} y={FRAME.bottom + 26} textAnchor="middle">{puzzle.endMemberLabels.left}</text>
        {intermediateCompositionLabels.map((composition) => <text
          key={`intermediate-composition:${composition.id}`}
          className="axis-label intermediate-composition-label"
          data-composition={composition.id}
          data-phases={composition.phaseIds.join(" ")}
          x={composition.x}
          y={FRAME.bottom + 26}
          textAnchor="middle"
          aria-label={`${composition.label} intermediate composition`}
        >{composition.label}</text>)}
        <text className="axis-label" x={FRAME.right} y={FRAME.bottom + 26} textAnchor="middle">{puzzle.endMemberLabels.right}</text>
      </g>
    </svg>
  );
}

function PhaseLabel({ x, y, phases, puzzle, scale = 1, fitsField = true, orientation = "horizontal", onRemove }: {
  x: number;
  y: number;
  phases: PhaseId[];
  puzzle: PuzzleDefinition;
  scale?: number;
  fitsField?: boolean;
  orientation?: "horizontal" | "vertical";
  onRemove?: (phaseId: PhaseId) => void;
}) {
  const offsets = phases.map((_, index) => (index - (phases.length - 1) / 2) * (orientation === "horizontal" ? 45 : 36));
  return (
    <g className="phase-label-position" transform={`translate(${x} ${y})`} data-anchor-x={x} data-anchor-y={y} data-fits-field={fitsField}>
      <g className="phase-label-scale" transform={`scale(${scale})`}>
        <g className="phase-label">
          {phases.map((phase, index) => (
            <g
              key={phase}
              className="phase-token"
              data-phase={phase}
              style={{ transform: orientation === "horizontal" ? `translate(${offsets[index]}px, 0)` : `translate(0, ${offsets[index]}px)` }}
              onPointerDown={(event) => {
              if (!onRemove) return;
              event.stopPropagation();
              onRemove(phase);
              }}
            >
              <rect x={-18} y={-22} width={36} height={34} pointerEvents={onRemove ? "all" : "none"} />
              <text className={`phase-${phase}`} textAnchor="middle">{phaseSymbol(puzzle, phase)}</text>
              {index < phases.length - 1 && <text className="phase-plus" x={orientation === "horizontal" ? 22 : 0} y={orientation === "horizontal" ? 0 : 18} textAnchor="middle">+</text>}
            </g>
          ))}
        </g>
      </g>
    </g>
  );
}

export function targetAtPoint(state: ConstructionState, point: LogicalPoint): { kind: "cell" | "horizontal"; id: string } | undefined {
  const cell = state.cells.find((candidate) => pointInPolygon(point, candidate.polygon));
  if (cell) return { kind: "cell", id: cell.id };
  const horizontal = state.geometry.find((geometry) => geometry.type === "invariant-horizontal"
    && Math.abs(geometry.temperatureCelsius - point.temperatureCelsius) < 35
    && (() => {
      const start = state.points.find((candidate) => candidate.id === geometry.startPointId)?.point;
      const end = state.points.find((candidate) => candidate.id === geometry.endPointId)?.point;
      return start && end && point.compositionBPercent >= Math.min(start.compositionBPercent, end.compositionBPercent)
        && point.compositionBPercent <= Math.max(start.compositionBPercent, end.compositionBPercent);
    })());
  return horizontal ? { kind: "horizontal", id: horizontal.id } : undefined;
}
