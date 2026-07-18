import type { NumericInstruction } from "../domain/schema";

interface InstructionStripProps {
  instructions: NumericInstruction[];
  collapsed: boolean;
  onToggle: () => void;
}

export function InstructionStrip({ instructions, collapsed, onToggle }: InstructionStripProps) {
  return (
    <div className={`instruction-strip ${collapsed ? "is-collapsed" : ""}`}>
      <button
        className="instruction-toggle"
        type="button"
        aria-label={collapsed ? "Show instructions" : "Hide instructions"}
        aria-expanded={!collapsed}
        onClick={onToggle}
      >
        <span aria-hidden="true">{collapsed ? "i" : "×"}</span>
      </button>
      {!collapsed && (
        <div className="instruction-list" aria-label="Puzzle instructions">
          {instructions.map((instruction) => <span key={instruction.id}>{instruction.compactText}</span>)}
        </div>
      )}
    </div>
  );
}
