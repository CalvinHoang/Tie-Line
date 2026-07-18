import type { PhaseDefinition, PointRoleDefinition, ToolId } from "../domain/schema";

const tools: Array<{ id: ToolId; glyph: string; label: string }> = [
  { id: "point", glyph: "●", label: "Point" },
  { id: "curve", glyph: "⌒", label: "Curve" },
  { id: "horizontal", glyph: "─", label: "Horizontal" },
  { id: "label", glyph: "α", label: "Label" },
  { id: "select", glyph: "↖", label: "Select" },
  { id: "erase", glyph: "⌫", label: "Erase" },
];

export function ModeControl({ activeTool, permittedTools, expanded, onExpandedChange, onToolChange }: {
  activeTool: ToolId;
  permittedTools: ToolId[];
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onToolChange: (tool: ToolId) => void;
}) {
  const availableTools = tools.filter((tool) => permittedTools.includes(tool.id));
  const active = availableTools.find((tool) => tool.id === activeTool) ?? availableTools[0];
  return <div className="mode-control">
    {expanded && <div className="mode-row" role="toolbar" aria-label="Drawing modes">{availableTools.map((tool) => <button key={tool.id} type="button" className={tool.id === activeTool ? "is-active" : ""} aria-label={`${tool.label} mode`} aria-pressed={tool.id === activeTool} onClick={() => { onToolChange(tool.id); onExpandedChange(false); }}><span aria-hidden="true">{tool.glyph}</span></button>)}</div>}
    <button type="button" className="mode-trigger" aria-label={`Mode: ${active.label}`} aria-expanded={expanded} onClick={() => onExpandedChange(!expanded)}><span aria-hidden="true">{active.glyph}</span><span className="mode-name">{active.label}</span></button>
  </div>;
}

export function PointPalette({ roles, placedRoleIds, activeRoleId, onSelect, onPointerStart }: {
  roles: PointRoleDefinition[];
  placedRoleIds: Set<string>;
  activeRoleId?: string;
  onSelect: (roleId: string) => void;
  onPointerStart: (event: React.PointerEvent<HTMLButtonElement>, roleId: string) => void;
}) {
  return <div className="symbol-palette" role="toolbar" aria-label="Point symbols">{roles.map((role) => {
    const placed = placedRoleIds.has(role.id);
    return <button key={role.id} type="button" className={activeRoleId === role.id ? "is-active" : ""} aria-label={`${role.symbol} point${placed ? ", placed" : ""}`} aria-pressed={activeRoleId === role.id} data-placed={placed || undefined} onClick={() => onSelect(role.id)} onPointerDown={(event) => onPointerStart(event, role.id)}>{role.symbol}{placed && <span className="placed-mark" aria-hidden="true">·</span>}</button>;
  })}</div>;
}

export function PhasePalette({ phases, activePhaseId, onSelect, onPointerStart, onPointerMove, onPointerEnd }: {
  phases: PhaseDefinition[];
  activePhaseId?: string;
  onSelect: (phaseId: string) => void;
  onPointerStart: (event: React.PointerEvent<HTMLButtonElement>, phaseId: string) => void;
  onPointerMove?: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerEnd?: (event: React.PointerEvent<HTMLButtonElement>) => void;
}) {
  return <div className="symbol-palette phase-palette" role="toolbar" aria-label="Phase symbols">{phases.map((phase) => <button key={phase.id} type="button" className={`phase-${phase.id} ${activePhaseId === phase.id ? "is-active" : ""}`} aria-label={`${phase.name} phase`} aria-pressed={activePhaseId === phase.id} onClick={() => onSelect(phase.id)} onPointerDown={(event) => onPointerStart(event, phase.id)} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}>{phase.symbol}</button>)}</div>;
}
