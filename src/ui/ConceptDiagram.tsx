import type { ConceptDiagramKind } from "../domain/concepts";

// Frame convention from the reference notes: vertical axes at A and B, a bottom
// baseline, open at the top. Ink strokes draw the diagram skeleton; the accent
// stroke marks the feature the card teaches; dashed is reserved for metastable
// features; hatch shading marks solid-solution regions; an open circle marks
// the reaction or critical point.
const base = "M16 8V96H144V8";

export function ConceptDiagram({ kind, compact = false }: { kind: ConceptDiagramKind; compact?: boolean }) {
  const paths: Record<ConceptDiagramKind, React.ReactNode> = {
    eutectic: <>
      <path d="M16 26Q52 32 76 58M144 30Q104 34 76 58"/>
      <path className="accent" d="M16 58H144"/>
      <circle cx="76" cy="58" r="3"/>
      <text x="76" y="20">L</text>
    </>,
    peritectic: <>
      <path d="M16 58Q64 30 144 12"/>
      <path d="M144 12Q112 24 100 44"/>
      <path className="accent" d="M38 44H118"/>
      <path d="M58 44Q52 68 50 96M118 44Q124 68 126 96"/>
      <circle cx="58" cy="44" r="3"/>
      <text x="34" y="24">L</text>
      <text x="122" y="34">β</text>
    </>,
    eutectoid: <>
      <path d="M16 22Q48 34 78 62M144 26Q108 36 78 62"/>
      <path className="accent" d="M24 62H136"/>
      <path d="M78 62Q60 78 50 96M78 62Q98 78 108 96"/>
      <path className="hatch" d="M66 34L90 34M70 46L86 46"/>
      <circle cx="78" cy="62" r="3"/>
      <text x="78" y="20">γ</text>
      <text x="30" y="90">α</text>
      <text x="124" y="90">β</text>
    </>,
    peritectoid: <>
      <path d="M16 24Q48 34 76 56M144 28Q108 38 76 56"/>
      <path className="accent" d="M26 56H130"/>
      <path d="M76 56Q64 78 58 96M76 56Q90 78 96 96"/>
      <path className="hatch" d="M70 78L84 78M68 88L88 88"/>
      <circle cx="76" cy="56" r="3"/>
      <text x="34" y="26">α</text>
      <text x="118" y="30">β</text>
      <text x="77" y="86">γ</text>
    </>,
    monotectic: <>
      <path d="M16 26Q34 34 56 70"/>
      <path d="M64 46Q70 22 86 20Q104 22 110 46"/>
      <path className="accent" d="M40 46H110"/>
      <path d="M110 46Q126 36 144 24"/>
      <path d="M16 70H144"/>
      <circle cx="110" cy="46" r="3"/>
      <circle className="accent-fill" cx="86" cy="20" r="3"/>
      <text x="87" y="38">2L</text>
      <text x="128" y="14">L</text>
    </>,
    syntectic: <>
      <path d="M56 44Q62 16 80 14Q98 16 104 44"/>
      <path className="accent" d="M56 44H104"/>
      <path d="M80 44V96"/>
      <path d="M16 32Q36 40 48 58Q52 50 56 44M16 58H80"/>
      <path d="M104 44Q112 52 118 62Q132 46 144 34M80 62H144"/>
      <circle cx="80" cy="44" r="3"/>
      <text x="80" y="34">2L</text>
      <text x="128" y="16">L</text>
    </>,
    spinodal: <>
      <path d="M16 26Q30 38 48 64"/>
      <path d="M60 44Q66 20 80 18Q94 20 100 44"/>
      <path d="M37 44H100M100 44Q122 32 144 22"/>
      <path d="M16 64H144"/>
      <path className="accent dashed" d="M56 96Q80 56 104 96"/>
      <text x="80" y="36">2L</text>
      <text x="80" y="86">(2L)</text>
    </>,
    "spinodal-liquid": <>
      <path d="M16 26Q30 36 48 62"/>
      <path d="M60 46Q64 16 82 16Q100 16 106 46"/>
      <path d="M38 46H106M106 46Q124 36 144 24"/>
      <path d="M16 62H144"/>
      <path className="accent" d="M66 46Q70 16 82 16Q94 16 100 46"/>
      <circle className="accent-fill" cx="82" cy="16" r="3"/>
      <text x="83" y="40">2L</text>
      <text x="128" y="14">L</text>
    </>,
    "spinodal-solid": <>
      <path d="M16 50Q84 30 144 12"/>
      <path d="M16 50Q96 46 144 12"/>
      <path className="hatch" d="M16 64L144 32"/>
      <path d="M52 96Q60 56 78 56Q96 56 104 96"/>
      <path className="accent" d="M60 96Q66 56 78 56Q90 56 96 96"/>
      <circle className="accent-fill" cx="78" cy="56" r="3"/>
      <text x="52" y="22">L</text>
      <text x="78" y="88">2S</text>
    </>,
    polymorph: <>
      <path d="M16 24Q52 30 76 54M144 28Q104 32 76 54"/>
      <path d="M16 54H144"/>
      <path className="accent" d="M16 74H144"/>
      <circle cx="76" cy="54" r="3"/>
      <text x="76" y="16">L</text>
      <text x="25" y="70">β</text>
      <text x="25" y="86">α</text>
    </>,
    "polymorph-super": <>
      <path d="M16 34Q48 40 72 60M144 36Q102 40 72 60"/>
      <path d="M16 60H144"/>
      <path className="accent" d="M16 26H44"/>
      <circle cx="72" cy="60" r="3"/>
      <text x="76" y="20">L</text>
      <text x="24" y="22">β</text>
      <text x="24" y="40">α</text>
    </>,
    compound: <>
      <path d="M16 30Q34 36 46 56Q60 34 78 30Q92 36 102 64Q124 40 144 26"/>
      <path className="accent" d="M78 30V96"/>
      <path d="M16 56H78M78 64H144"/>
      <circle cx="78" cy="30" r="3"/>
      <text x="126" y="14">L</text>
    </>,
    "compound-incongruent": <>
      <path d="M16 22Q28 30 40 60Q76 30 144 16"/>
      <path className="accent" d="M64 40H132"/>
      <path d="M96 40V96"/>
      <path d="M16 60H96"/>
      <circle cx="64" cy="40" r="3"/>
      <text x="116" y="10">L</text>
    </>,
    stability: <>
      <path d="M16 24Q52 30 80 50Q108 30 144 24"/>
      <path d="M16 50H144"/>
      <path className="accent" d="M16 68H144M16 84H144"/>
      <path d="M80 68V84"/>
      <text x="80" y="16">L</text>
    </>,
    solution: <>
      <path d="M16 56Q84 30 144 14"/>
      <path d="M16 56Q96 50 144 14"/>
      <path className="hatch" d="M16 68L144 34M16 82L144 52M16 96L144 70"/>
      <text x="56" y="24">L</text>
    </>,
    "solution-maximum": <>
      <path d="M16 48Q72 14 102 14Q126 16 144 24"/>
      <path d="M16 48Q84 30 102 16Q124 20 144 24"/>
      <path className="hatch" d="M16 62L144 38M16 78L144 56"/>
      <circle className="accent-fill" cx="102" cy="14" r="3"/>
      <text x="36" y="16">L</text>
    </>,
    "solution-minimum": <>
      <path d="M16 40Q60 62 84 64Q118 60 144 22"/>
      <path d="M16 40Q64 52 84 62Q116 50 144 22"/>
      <path className="hatch" d="M16 76L144 60M16 90L144 76"/>
      <circle className="accent-fill" cx="84" cy="64" r="3"/>
      <text x="80" y="16">L</text>
    </>,
    "miscibility-gap": <>
      <path d="M16 50Q84 30 144 12"/>
      <path d="M16 50Q96 46 144 12"/>
      <path className="hatch" d="M16 64L144 32"/>
      <path className="accent" d="M52 96Q60 58 78 56Q96 58 104 96"/>
      <circle className="accent-fill" cx="78" cy="56" r="3"/>
      <text x="78" y="84">2S</text>
      <text x="52" y="22">L</text>
    </>,
    partial: <>
      <path d="M16 26Q50 32 74 54M144 30Q106 34 74 54"/>
      <path d="M16 26Q24 40 34 54M144 30Q128 42 118 54"/>
      <path className="accent" d="M34 54H118"/>
      <path d="M34 54Q28 72 24 96M118 54Q128 74 132 96"/>
      <path className="hatch" d="M18 70L30 62M18 84L28 76M138 68L126 60M140 82L130 74"/>
      <circle cx="74" cy="54" r="3"/>
      <text x="76" y="18">L</text>
    </>,
    secondary: <>
      <path d="M16 18Q56 24 92 42Q120 36 144 30"/>
      <path d="M48 42H144"/>
      <path d="M16 74H144"/>
      <path className="accent" d="M56 42L90 42Q80 62 72 66Q64 58 56 42Z"/>
      <path className="hatch" d="M62 48L74 56M68 46L80 54"/>
      <text x="112" y="16">L</text>
    </>,
    "liquid-immiscible": <>
      <path d="M16 26Q34 34 56 70"/>
      <path className="accent" d="M64 46Q70 22 86 20Q104 22 110 46"/>
      <path d="M40 46H110M110 46Q126 36 144 24"/>
      <path d="M16 70H144"/>
      <circle className="accent-fill" cx="86" cy="20" r="3"/>
      <text x="87" y="38">2L</text>
      <text x="128" y="14">L</text>
    </>,
    "state-change": <>
      <path d="M24 84Q60 60 84 52Q112 44 136 20"/>
      <path className="accent" d="M84 52H136"/>
      <circle cx="84" cy="52" r="3"/>
      <text x="38" y="78">S</text>
      <text x="102" y="42">L/G</text>
    </>,
    triple: <>
      <path d="M80 55L31 84M80 55L74 14M80 55L134 24"/>
      <circle className="accent-fill" cx="80" cy="55" r="4"/>
      <text x="38" y="72">S</text>
      <text x="86" y="28">L</text>
      <text x="120" y="46">G</text>
    </>,
  };
  return <svg className={`concept-diagram ${compact ? "is-compact" : ""}`} viewBox="0 0 160 110" role={compact ? undefined : "img"} aria-label={compact ? undefined : "Schematic phase diagram"} aria-hidden={compact || undefined}>
    <path className="axes" d={base}/>{paths[kind]}<text className="axis-a" x="12" y="106">A</text><text className="axis-b" x="141" y="106">B</text>
  </svg>;
}
