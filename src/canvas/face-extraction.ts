import { pointInPolygon, polygonArea, polygonLabelPoint, sampleQuadratic } from "../domain/geometry";
import type { ExtractedCell, LogicalPoint, OrientedBoundaryRef, PlayerGeometry, PlayerPoint } from "../domain/schema";

interface Vertex {
  id: string;
  point: LogicalPoint;
}

interface Edge {
  id: string;
  sourceId: OrientedBoundaryRef["geometryId"];
  a: string;
  b: string;
}

const DOMAIN_AREA = 100 * 1100;
const keyForPoint = (point: LogicalPoint) => `${point.compositionBPercent.toFixed(5)}:${point.temperatureCelsius.toFixed(5)}`;

function buildPlanarGraph(points: PlayerPoint[], geometry: PlayerGeometry[]): { vertices: Map<string, Vertex>; edges: Edge[] } {
  const vertices = new Map<string, Vertex>();
  const coordinateToId = new Map<string, string>();
  const edges: Edge[] = [];

  const addVertex = (id: string, point: LogicalPoint): string => {
    const key = keyForPoint(point);
    const existing = coordinateToId.get(key);
    if (existing) return existing;
    vertices.set(id, { id, point });
    coordinateToId.set(key, id);
    return id;
  };
  const addEdge = (id: string, sourceId: Edge["sourceId"], a: string, b: string) => {
    if (a !== b) edges.push({ id, sourceId, a, b });
  };

  points.forEach((point) => addVertex(point.id, point.point));
  addVertex("corner-bl", { compositionBPercent: 0, temperatureCelsius: 0 });
  addVertex("corner-br", { compositionBPercent: 100, temperatureCelsius: 0 });
  addVertex("corner-tr", { compositionBPercent: 100, temperatureCelsius: 1100 });
  addVertex("corner-tl", { compositionBPercent: 0, temperatureCelsius: 1100 });

  for (const item of geometry) {
    if (item.type === "curve") {
      const start = points.find((point) => point.id === item.startPointId)?.point;
      const end = points.find((point) => point.id === item.endPointId)?.point;
      if (!start || !end) continue;
      const samples = sampleQuadratic(start, item.control, end, 20);
      const ids = samples.map((point, index) => addVertex(
        index === 0 ? item.startPointId : index === samples.length - 1 ? item.endPointId : `${item.id}:sample:${index}`,
        point,
      ));
      ids.slice(0, -1).forEach((id, index) => addEdge(`${item.id}:${index}`, item.id, id, ids[index + 1]));
    } else {
      const ids = [item.startPointId, ...item.interiorPointIds, item.endPointId]
        .filter((id) => vertices.has(id))
        .sort((a, b) => vertices.get(a)!.point.compositionBPercent - vertices.get(b)!.point.compositionBPercent);
      ids.slice(0, -1).forEach((id, index) => addEdge(`${item.id}:${index}`, item.id, id, ids[index + 1]));
    }
  }

  const frameDefinitions: Array<{
    sourceId: Edge["sourceId"];
    filter: (point: LogicalPoint) => boolean;
    sort: (a: Vertex, b: Vertex) => number;
  }> = [
    { sourceId: "frame-left", filter: (point) => point.compositionBPercent === 0, sort: (a, b) => a.point.temperatureCelsius - b.point.temperatureCelsius },
    { sourceId: "frame-right", filter: (point) => point.compositionBPercent === 100, sort: (a, b) => a.point.temperatureCelsius - b.point.temperatureCelsius },
    { sourceId: "frame-bottom", filter: (point) => point.temperatureCelsius === 0, sort: (a, b) => a.point.compositionBPercent - b.point.compositionBPercent },
    { sourceId: "frame-top", filter: (point) => point.temperatureCelsius === 1100, sort: (a, b) => a.point.compositionBPercent - b.point.compositionBPercent },
  ];
  for (const frame of frameDefinitions) {
    const ids = [...vertices.values()].filter((vertex) => frame.filter(vertex.point)).sort(frame.sort).map((vertex) => vertex.id);
    ids.slice(0, -1).forEach((id, index) => addEdge(`${frame.sourceId}:${index}`, frame.sourceId, id, ids[index + 1]));
  }

  return { vertices, edges };
}

function directedKey(edgeId: string, from: string, to: string): string {
  return `${edgeId}:${from}>${to}`;
}

export function extractFaces(
  points: PlayerPoint[],
  geometry: PlayerGeometry[],
  previousCells: ExtractedCell[] = [],
): ExtractedCell[] {
  const { vertices, edges } = buildPlanarGraph(points, geometry);
  const incident = new Map<string, Edge[]>();
  for (const edge of edges) {
    incident.set(edge.a, [...(incident.get(edge.a) ?? []), edge]);
    incident.set(edge.b, [...(incident.get(edge.b) ?? []), edge]);
  }
  const visited = new Set<string>();
  const cycles: Array<{ polygon: LogicalPoint[]; boundary: OrientedBoundaryRef[]; sourceKey: string }> = [];

  for (const initialEdge of edges) {
    for (const [initialFrom, initialTo] of [[initialEdge.a, initialEdge.b], [initialEdge.b, initialEdge.a]]) {
      const startKey = directedKey(initialEdge.id, initialFrom, initialTo);
      if (visited.has(startKey)) continue;
      const polygon: LogicalPoint[] = [];
      const boundary: OrientedBoundaryRef[] = [];
      const sourceIds: string[] = [];
      let edge = initialEdge;
      let from = initialFrom;
      let to = initialTo;
      let closed = false;
      for (let guard = 0; guard < edges.length * 2 + 8; guard += 1) {
        const key = directedKey(edge.id, from, to);
        if (visited.has(key) && key !== startKey) break;
        visited.add(key);
        polygon.push(vertices.get(from)!.point);
        boundary.push({ geometryId: edge.sourceId, direction: edge.a === from ? "forward" : "reverse" });
        sourceIds.push(edge.sourceId);
        const options = [...(incident.get(to) ?? [])].sort((left, right) => {
          const leftOther = left.a === to ? left.b : left.a;
          const rightOther = right.a === to ? right.b : right.a;
          const origin = vertices.get(to)!.point;
          const leftPoint = vertices.get(leftOther)!.point;
          const rightPoint = vertices.get(rightOther)!.point;
          const leftAngle = Math.atan2((leftPoint.temperatureCelsius - origin.temperatureCelsius) / 11, leftPoint.compositionBPercent - origin.compositionBPercent);
          const rightAngle = Math.atan2((rightPoint.temperatureCelsius - origin.temperatureCelsius) / 11, rightPoint.compositionBPercent - origin.compositionBPercent);
          return leftAngle - rightAngle;
        });
        const reverseIndex = options.findIndex((candidate) => candidate.id === edge.id);
        if (reverseIndex < 0 || options.length < 2) break;
        const next = options[(reverseIndex - 1 + options.length) % options.length];
        const nextTo = next.a === to ? next.b : next.a;
        from = to;
        to = nextTo;
        edge = next;
        if (directedKey(edge.id, from, to) === startKey) {
          closed = true;
          break;
        }
      }
      const area = Math.abs(polygonArea(polygon));
      if (closed && polygon.length >= 3 && area > 1 && area < DOMAIN_AREA - 1) {
        cycles.push({
          polygon,
          boundary,
          sourceKey: [...new Set(sourceIds)].sort().join("|"),
        });
      }
    }
  }

  const unique = cycles.filter((cycle, index) => {
    const label = polygonLabelPoint(cycle.polygon);
    return cycles.findIndex((candidate) => candidate.sourceKey === cycle.sourceKey
      && Math.abs(polygonLabelPoint(candidate.polygon).compositionBPercent - label.compositionBPercent) < 0.01
      && Math.abs(polygonLabelPoint(candidate.polygon).temperatureCelsius - label.temperatureCelsius) < 0.1) === index;
  });

  const nextCells: ExtractedCell[] = unique.map((cycle, index) => ({
    id: `cell:${index}:${cycle.sourceKey}`,
    dimension: 2,
    boundary: cycle.boundary,
    polygon: cycle.polygon,
    labelPoint: polygonLabelPoint(cycle.polygon),
    phaseOrder: [],
  }));

  if (previousCells.length !== nextCells.length) return nextCells;
  return nextCells.map((cell) => {
    const previous = previousCells.find((candidate) => pointInPolygon(candidate.labelPoint, cell.polygon));
    return previous ? { ...cell, id: previous.id, phaseOrder: previous.phaseOrder } : cell;
  });
}
