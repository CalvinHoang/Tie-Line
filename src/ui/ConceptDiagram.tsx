import type { ConceptDiagramKind } from "../domain/concepts";

const base = "M16 94V14M16 94H144";

export function ConceptDiagram({ kind, compact = false }: { kind: ConceptDiagramKind; compact?: boolean }) {
  const paths: Record<ConceptDiagramKind, React.ReactNode> = {
    eutectic: <><path d="M17 27Q49 42 80 67Q111 43 143 29"/><path className="accent" d="M17 67H143"/><circle cx="80" cy="67" r="3"/></>,
    peritectic: <><path d="M17 27Q65 41 88 58Q112 40 143 31"/><path d="M58 94Q68 72 88 58"/><path className="accent" d="M58 58H143"/><circle cx="88" cy="58" r="3"/></>,
    eutectoid: <><path d="M17 30Q52 39 80 50Q108 39 143 30"/><path className="accent" d="M35 62H125"/><path d="M80 50V62M80 62Q60 76 45 93M80 62Q101 76 119 93"/><circle cx="80" cy="62" r="3"/></>,
    peritectoid: <><path d="M17 30Q52 39 80 48Q108 39 143 30"/><path className="accent" d="M34 66H126"/><path d="M53 93Q61 76 77 66M111 93Q99 76 77 66"/><circle cx="77" cy="66" r="3"/></>,
    monotectic: <><path d="M17 38Q49 47 64 66"/><path d="M71 52Q92 25 116 52"/><path className="accent" d="M64 66H143"/><circle cx="116" cy="52" r="3"/></>,
    syntectic: <><path d="M17 38Q48 51 62 66"/><path d="M64 50Q85 22 108 50Q124 66 143 35"/><path className="accent" d="M62 66H108"/><path d="M85 66V94"/><circle cx="85" cy="66" r="3"/></>,
    spinodal: <><path d="M17 40Q50 53 62 68M110 60Q123 45 143 30"/><path d="M62 68Q84 25 110 60"/><path className="accent dashed" d="M72 84Q85 55 101 82"/><text x="86" y="49">2L</text></>,
    polymorph: <><path d="M17 27Q50 42 78 59Q109 41 143 29"/><path d="M17 59H143"/><path className="accent" d="M17 76H143"/><text x="25" y="72">β</text><text x="25" y="89">α</text></>,
    compound: <><path d="M17 42Q38 55 54 66Q72 40 82 31Q96 43 110 70Q125 50 143 40"/><path className="accent" d="M82 31V94"/><path d="M17 66H82M82 70H143"/></>,
    "compound-incongruent": <><path d="M17 31Q43 45 62 69Q91 42 143 28"/><path className="accent" d="M62 58H111M88 58V94"/><circle cx="88" cy="58" r="3"/></>,
    stability: <><path d="M17 31Q51 45 80 62Q111 43 143 30"/><path d="M17 62H143"/><path className="accent" d="M80 74V94M55 74H105"/><path className="accent" d="M55 86H105"/></>,
    solution: <><path d="M17 35Q81 69 143 31"/><path d="M17 35Q80 49 143 31"/><path className="fill" d="M17 35Q80 49 143 31Q81 69 17 35Z"/></>,
    "solution-maximum": <><path d="M17 52Q78 14 143 48"/><path d="M17 52Q78 32 143 48"/><circle className="accent-fill" cx="79" cy="23" r="3"/></>,
    "solution-minimum": <><path d="M17 30Q78 74 143 32"/><path d="M17 30Q78 58 143 32"/><circle className="accent-fill" cx="79" cy="66" r="3"/></>,
    "miscibility-gap": <><path d="M17 37Q80 64 143 35"/><path d="M17 37Q80 50 143 35"/><path className="accent" d="M48 94Q80 43 114 94"/><path className="dashed" d="M60 94Q80 60 102 94"/></>,
    partial: <><path d="M17 29Q48 43 80 61Q111 42 143 29"/><path className="accent" d="M17 61H143"/><path d="M17 94Q25 76 34 61M143 94Q134 76 126 61"/></>,
    secondary: <><path d="M17 29Q58 44 80 58Q112 43 143 30"/><path className="accent" d="M45 65H119"/><path d="M62 94V65M101 94V65"/><path className="fill" d="M62 65H101V94H62Z"/></>,
    "liquid-immiscible": <><path d="M17 33Q47 46 60 68M111 60Q126 43 143 27"/><path className="accent" d="M60 68Q83 22 111 60"/><path d="M60 68H143"/><text x="85" y="47">2L</text></>,
    "state-change": <><path d="M28 82Q56 58 80 54Q106 48 132 24"/><path className="accent" d="M80 54H132"/><circle cx="80" cy="54" r="3"/><text x="38" y="79">S</text><text x="92" y="48">L/G</text></>,
    triple: <><path d="M80 55L31 82M80 55L76 15M80 55L132 24"/><circle className="accent-fill" cx="80" cy="55" r="4"/><text x="31" y="76">S</text><text x="88" y="30">L</text><text x="119" y="42">G</text></>,
  };
  return <svg className={`concept-diagram ${compact ? "is-compact" : ""}`} viewBox="0 0 160 110" role={compact ? undefined : "img"} aria-label={compact ? undefined : "Schematic phase diagram"} aria-hidden={compact || undefined}>
    <path className="axes" d={base}/>{paths[kind]}<text className="axis-a" x="12" y="106">A</text><text className="axis-b" x="141" y="106">B</text>
  </svg>;
}
