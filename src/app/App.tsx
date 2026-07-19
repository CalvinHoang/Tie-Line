import { useCallback, useEffect, useRef, useState } from "react";
import { DiagramCanvas, maximumViewportScale, zoomViewportAt } from "../canvas/DiagramCanvas";
import { createPuzzleSeed, generateRound, type Difficulty, type GeneratedRound } from "../domain/generator";
import { pointInPolygon, sameLogicalPoint } from "../domain/geometry";
import { expectedLabels } from "../domain/diagram-notation";
import { RULE_CATEGORIES, RULE_CONCEPTS, type RuleConcept } from "../domain/concepts";
import type { ConstructionState, ViewportState } from "../domain/schema";
import {
  activeMilliseconds,
  addGeometry,
  clearPhaseLabels,
  createLabelingState,
  deleteGeometry,
  deletePoint,
  formatElapsed,
  pauseTimer,
  placeOrMovePoint,
  removePhaseFromCell,
  resumeTimer,
  setTool,
  togglePhaseInCell,
  updateGeometry,
} from "../editor/state";
import {
  clearConstruction,
  constructionHasProgress,
  hasResumableConstruction,
  loadConstruction,
  loadProfile,
  loadPuzzleSeed,
  saveConstruction,
  saveProfile,
  savePuzzleSeed,
  type GameSettings,
  type PlayerProfile,
  type SolveRecord,
} from "../game/persistence";
import { validateSubmit } from "../game/validator";
import { PhasePalette } from "../ui/Controls";
import { ConceptDiagram } from "../ui/ConceptDiagram";

type Panel = "rules" | "statistics" | "settings";

const DIFFICULTIES: Array<{ id: Difficulty; label: string; detail: string }> = [
  { id: "easy", label: "Easy", detail: "Complete systems · simpler invariants" },
  { id: "normal", label: "Normal", detail: "Composed systems · smaller reaction budget" },
  { id: "hard", label: "Hard", detail: "Large systems · full invariant grammar" },
];

const FOUNDATIONS = [
  {
    id: "compatibility",
    title: "Compatibility triangles",
    sketch: "triangle",
    summary: "Inside a subsolidus compatibility triangle, the stable phases are the phases at its three corners.",
    points: [
      "Each compatibility triangle has an invariant point where its three primary crystallisation fields meet.",
      "A eutectic lies inside its parent triangle; a peritectic lies outside it and changes which triangles share an edge.",
    ],
  },
  {
    id: "melting",
    title: "Melting behaviour",
    sketch: "melting",
    summary: "A complete diagram starts in one homogeneous liquid field; melting behaviour determines how the solid fields connect below it.",
    points: [
      "The complete high-temperature edge must belong to one connected single-liquid field; a solid-only top edge is valid only in an explicitly cropped subsolidus section.",
      "A congruently melting phase sits inside its own primary crystallisation field.",
      "An incongruently melting phase lies outside its own field and decomposes at a peritectic temperature.",
    ],
  },
  {
    id: "lever",
    title: "Lever rules",
    sketch: "lever",
    summary: "Phase fractions are read from inverse segment lengths about the bulk composition.",
    points: [
      "Binary: draw one tie-line between the two equilibrium compositions.",
      "Ternary: draw through the composition from each triangle corner to its opposite side; equilateral 100% divisions can be read directly.",
    ],
  },
  {
    id: "isothermal",
    title: "Isothermal sections",
    sketch: "section",
    summary: "An isothermal section contains single-phase regions, two-phase wedges and three-phase triangles.",
    points: [
      "First outline liquid homogeneity regions, then construct solid–liquid equilibria, then retain compatible solid–solid tie-lines.",
      "When liquid envelops a complete primary field, that solid and any impossible tie-lines disappear.",
    ],
  },
  {
    id: "crystallisation",
    title: "Crystallisation paths",
    sketch: "path",
    summary: "On cooling, the liquid composition moves downhill across a primary field and then along boundary lines.",
    points: [
      "The first solid is named by the starting primary crystallisation field.",
      "At a matching invariant point, three solids precipitate together and the path stops; otherwise resorption continues toward the matching invariant.",
    ],
  },
  {
    id: "classification",
    title: "Diagram classification",
    sketch: "classification",
    summary: "Binary diagrams are organised by simple eutectic, solid-solution and liquid-immiscibility families.",
    points: [
      "Look for polymorphism, compounds, miscibility limits, melting extrema and stability limits within those families.",
      "Invariant points split into eutectic-type decompositions on cooling and peritectic-type reactions on heating.",
    ],
  },
] as const;

const PROCESSING = [
  ["Solid-state sintering", "Diffusion densifies particles at high temperature without a liquid."],
  ["Liquid-phase sintering", "A small liquid fraction improves rearrangement, solution–precipitation and bonding; it may remain glassy or recrystallise."],
  ["Casting", "A homogeneous, congruently melting liquid is fully melted and poured into a mould."],
  ["Czochralski growth", "A seed is rotated and withdrawn from a homogeneous, congruently melting melt to grow one oriented crystal."],
  ["Flux growth", "A target crystal precipitates from a compatible liquid flux; slower cooling generally produces larger crystals."],
] as const;

function loadRound(difficulty: Difficulty): GeneratedRound {
  const seed = loadPuzzleSeed(difficulty) ?? createPuzzleSeed();
  savePuzzleSeed(seed, difficulty);
  return generateRound(seed, difficulty);
}

function ConceptGrid({ concepts, onSelect }: { concepts: RuleConcept[]; onSelect: (concept: RuleConcept) => void }) {
  return <div className="concept-sections">{RULE_CATEGORIES.map((category) => {
    const items = concepts.filter((concept) => concept.category === category);
    if (items.length === 0) return null;
    return <section key={category} className="concept-section"><h3>{category}</h3><div className="concept-grid">{items.map((concept) => <button key={concept.id} type="button" className="concept-card" onClick={() => onSelect(concept)}><ConceptDiagram kind={concept.diagram} compact/><span>{concept.title}</span></button>)}</div></section>;
  })}</div>;
}

function FoundationSketch({ kind }: { kind: typeof FOUNDATIONS[number]["sketch"] }) {
  if (kind === "triangle") return <svg viewBox="0 0 160 88" aria-hidden="true"><g className="ink"><path d="M24 73 80 14l56 59Z"/><circle cx="24" cy="73" r="3"/><circle cx="80" cy="14" r="3"/><circle cx="136" cy="73" r="3"/><circle className="accent-fill" cx="80" cy="52" r="4"/><path className="accent" d="M80 52 24 73M80 52 80 14M80 52l56 21"/></g></svg>;
  if (kind === "lever") return <svg viewBox="0 0 160 88" aria-hidden="true"><g className="ink"><path d="M22 45h116"/><circle cx="42" cy="45" r="4"/><circle className="accent-fill" cx="94" cy="45" r="5"/><circle cx="129" cy="45" r="4"/><text x="36" y="68">α</text><text x="90" y="68">C₀</text><text x="125" y="68">β</text></g></svg>;
  if (kind === "melting") return <svg viewBox="0 0 160 88" aria-hidden="true"><g className="ink"><path className="axes" d="M20 8V72H140V8"/><path d="M20 30Q32 36 44 54Q56 26 70 22Q86 26 96 58Q118 38 140 28"/><path d="M20 54H70M70 58H140"/><path className="accent" d="M70 22V72"/><circle className="accent-fill" cx="70" cy="22" r="3"/><text x="34" y="18">L</text></g></svg>;
  if (kind === "section") return <svg viewBox="0 0 160 88" aria-hidden="true"><g className="ink"><path d="M22 72 80 14l58 58Z"/><path d="M51 43q27 16 57 0M51 43 34 61M108 43l18 18"/><path className="accent" d="M51 43 108 43 80 68Z"/></g></svg>;
  if (kind === "path") return <svg viewBox="0 0 160 88" aria-hidden="true"><g className="ink"><path className="axes" d="M20 8V72H140V8"/><path d="M20 26Q52 32 74 54M140 30Q102 34 74 54"/><path d="M20 54H140"/><path className="accent" d="M46 18Q50 34 60 42Q68 48 74 54"/><circle className="accent-fill" cx="74" cy="54" r="3"/><text x="98" y="20">L</text></g></svg>;
  return <svg viewBox="0 0 160 88" aria-hidden="true"><g className="ink"><path className="axes" d="M20 8V72H140V8"/><path d="M20 24Q50 30 68 48M140 28Q102 32 68 48"/><path className="accent" d="M20 48H140"/><circle cx="68" cy="48" r="3"/><text x="74" y="18">L</text></g></svg>;
}

function RulesOverview() {
  return <>
    <section className="rules-intro"><span className="eyebrow">Reference notes · pages 1–5</span><h3>Read, classify, then label</h3><p>Use equilibrium geometry first: identify the diagram family, locate the invariant reaction, and only then assign the phase assemblages.</p></section>
    <div className="foundation-grid">{FOUNDATIONS.map((item) => <article key={item.id} className="foundation-card"><FoundationSketch kind={item.sketch}/><h4>{item.title}</h4><p>{item.summary}</p><ul>{item.points.map((point) => <li key={point}>{point}</li>)}</ul></article>)}</div>
    <section className="processing-rules"><h3>Processing definitions</h3><div>{PROCESSING.map(([title, description]) => <article key={title}><h4>{title}</h4><p>{description}</p></article>)}</div></section>
    <section className="notation-key"><h3>Invariant notation</h3><p><strong>T</strong> temperature · <strong>X</strong> composition · <strong>L</strong> liquid · <strong>S</strong> solid or solid solution · primes/subscripts distinguish structures or compositions.</p></section>
  </>;
}

function DifficultyStatistics({ difficulty, history }: { difficulty: typeof DIFFICULTIES[number]; history: SolveRecord[] }) {
  const solved = history.filter((item) => item.difficulty === difficulty.id && item.outcome === "solved" && item.scored);
  const noErrorRate = solved.length === 0 ? 0 : Math.round(solved.filter((item) => item.noError).length / solved.length * 100);
  const bestTime = solved.length === 0 ? "—" : formatElapsed(Math.min(...solved.map((item) => item.elapsedMilliseconds)));

  return <section className="difficulty-statistics" aria-labelledby={`statistics-${difficulty.id}`}>
    <h3 id={`statistics-${difficulty.id}`}>{difficulty.label}</h3>
    <div className="stat-grid">
      <div><strong>{solved.length}</strong><span>Solved</span></div>
      <div><strong>{noErrorRate}%</strong><span>No-error</span></div>
      <div><strong>{bestTime}</strong><span>Best time</span></div>
    </div>
  </section>;
}

export function App() {
  const [profile, setProfile] = useState<PlayerProfile>(loadProfile);
  const [difficulty, setDifficulty] = useState<Difficulty>(() => loadProfile().lastDifficulty);
  const [round, setRound] = useState<GeneratedRound>(() => loadRound(loadProfile().lastDifficulty));
  const [state, setState] = useState<ConstructionState>(() => loadConstruction(round.puzzle.id, round.difficulty) ?? createLabelingState(round.puzzle, round.solution));
  const [atHome, setAtHome] = useState(true);
  const [panel, setPanel] = useState<Panel>();
  const [feedback, setFeedback] = useState<string>();
  const [submitImpact, setSubmitImpact] = useState<{ id: number; kind: "wrong" | "solved" }>();
  const [clock, setClock] = useState(Date.now());
  const [selectedConceptId, setSelectedConceptId] = useState<string>();
  const [studyingResult, setStudyingResult] = useState(false);
  const history = useRef<ConstructionState[]>([]);

  const { puzzle, solution } = round;
  const failureOpen = state.metrics.scoredAttemptEnded && !state.metrics.continuingUnscored && !state.revealed;
  const completionOpen = state.solved && !studyingResult;
  const overlayOpen = atHome || Boolean(panel) || !profile.onboardingComplete || failureOpen || completionOpen;
  const canResume = round.difficulty === difficulty && constructionHasProgress(state)
    ? true
    : hasResumableConstruction(difficulty);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => saveConstruction(state, round.difficulty), [round.difficulty, state]);
  useEffect(() => saveProfile(profile), [profile]);

  useEffect(() => {
    const systemDark = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : undefined;
    const apply = () => {
      document.documentElement.dataset.theme = profile.settings.theme === "system"
        ? (systemDark?.matches ? "dark" : "light")
        : profile.settings.theme;
    };
    apply();
    document.documentElement.classList.toggle("reduce-motion", profile.settings.reducedMotion);
    systemDark?.addEventListener("change", apply);
    return () => systemDark?.removeEventListener("change", apply);
  }, [profile.settings]);

  useEffect(() => {
    setState((current) => overlayOpen ? pauseTimer(current) : resumeTimer(current));
  }, [overlayOpen]);

  useEffect(() => {
    const handleVisibility = () => setState((current) => document.hidden ? pauseTimer(current) : overlayOpen ? current : resumeTimer(current));
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [overlayOpen]);

  const announce = useCallback((message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback((current) => current === message ? undefined : current), 2600);
  }, []);

  const commit = useCallback((update: (current: ConstructionState) => ConstructionState) => {
    setState((current) => {
      const next = update(current);
      if (next === current) return current;
      history.current.push(structuredClone(current));
      if (history.current.length > 80) history.current.shift();
      return next;
    });
  }, []);

  const updateTransient = useCallback((update: (current: ConstructionState) => ConstructionState) => setState(update), []);
  const changeZoom = (factor: number) => updateTransient((current) => ({
    ...current,
    viewport: zoomViewportAt(
      current.viewport,
      current.viewport.scale * factor,
      undefined,
      maximumViewportScale(puzzle.expectedFieldCount),
    ),
  }));
  const updateProfile = (update: (current: PlayerProfile) => PlayerProfile) => setProfile((current) => update(current));
  const addRecord = (record: SolveRecord) => updateProfile((current) => current.history.some((item) => item.puzzleId === record.puzzleId)
    ? current
    : { ...current, history: [...current.history, record].slice(-200) });

  const recordOutcome = (outcome: SolveRecord["outcome"], scored: boolean, submissions: number) => addRecord({
    puzzleId: puzzle.id,
    seed: round.seed,
    difficulty: round.difficulty,
    family: round.family,
    outcome,
    scored,
    noError: outcome === "solved" && submissions === 1,
    elapsedMilliseconds: activeMilliseconds(state),
    submissions,
    completedAt: new Date().toISOString(),
  });

  const startRound = (nextDifficulty: Difficulty, nextSeed?: number) => {
    const seed = nextSeed ?? loadPuzzleSeed(nextDifficulty) ?? createPuzzleSeed();
    const nextRound = generateRound(seed, nextDifficulty);
    savePuzzleSeed(seed, nextDifficulty);
    setDifficulty(nextDifficulty);
    setRound(nextRound);
    setState(loadConstruction(nextRound.puzzle.id, nextDifficulty) ?? createLabelingState(nextRound.puzzle, nextRound.solution));
    setAtHome(false);
    setPanel(undefined);
    setStudyingResult(false);
    history.current = [];
    updateProfile((current) => ({ ...current, lastDifficulty: nextDifficulty }));
  };

  const newPuzzle = () => {
    let seed = createPuzzleSeed();
    if (seed === round.seed) seed = (seed + 1) >>> 0;
    clearConstruction(difficulty);
    startRound(difficulty, seed);
    announce("New diagram generated");
  };

  const cycleDifficulty = (direction: -1 | 1) => {
    const current = DIFFICULTIES.findIndex((item) => item.id === difficulty);
    setDifficulty(DIFFICULTIES[(current + direction + DIFFICULTIES.length) % DIFFICULTIES.length].id);
  };

  const startNewMain = () => {
    clearConstruction(difficulty);
    startRound(difficulty, createPuzzleSeed());
  };

  const goHome = () => {
    setState((current) => pauseTimer(current));
    setPanel(undefined);
    setAtHome(true);
  };

  const undo = () => {
    const previous = history.current.pop();
    if (!previous || state.solved) return;
    setState({ ...previous, metrics: { ...previous.metrics, undoCount: previous.metrics.undoCount + 1 } });
    announce("Undone");
  };

  const handleSubmit = () => {
    if (state.solved || state.revealed) return;
    const result = validateSubmit(state, puzzle, solution);
    if (result.status === "solved") {
      setStudyingResult(false);
      setSubmitImpact((current) => ({ id: (current?.id ?? 0) + 1, kind: "solved" }));
      const submissions = state.metrics.submitCount + 1;
      commit((current) => {
        const paused = pauseTimer(current);
        return { ...paused, solved: true, lastSubmitStatus: "solved", metrics: { ...paused.metrics, submitCount: submissions, solvedAt: new Date().toISOString() } };
      });
      if (!state.metrics.continuingUnscored) recordOutcome("solved", true, submissions);
      announce(state.metrics.continuingUnscored ? "Labels complete · unscored" : "Diagram solved");
      return;
    }
    if (state.metrics.continuingUnscored) {
      setSubmitImpact((current) => ({ id: (current?.id ?? 0) + 1, kind: "wrong" }));
      commit((current) => ({ ...current, lastSubmitStatus: result.status, metrics: { ...current.metrics, submitCount: current.metrics.submitCount + 1 } }));
      announce(result.status === "incomplete" ? "Some labels are still missing" : "Not quite — check each phase assemblage");
      return;
    }
    const lastAttempt = state.metrics.submissionsRemaining <= 1;
    const submissions = state.metrics.submitCount + 1;
    setSubmitImpact((current) => ({ id: (current?.id ?? 0) + 1, kind: "wrong" }));
    commit((current) => {
      const timed = lastAttempt ? pauseTimer(current) : current;
      return { ...timed, lastSubmitStatus: lastAttempt ? "failed-scored-attempt" as const : result.status, metrics: { ...timed.metrics, submitCount: submissions, submissionsRemaining: Math.max(0, timed.metrics.submissionsRemaining - 1), scoredAttemptEnded: lastAttempt } };
    });
    if (lastAttempt) recordOutcome("failed", true, submissions);
    announce(lastAttempt ? "Scored attempt ended" : result.status === "incomplete" ? "Incomplete" : "Not correct");
  };

  const revealSolution = () => {
    setStudyingResult(true);
    commit((current) => ({
      ...pauseTimer(current),
      cells: current.cells.map((cell) => {
        const field = solution.expectedFields.find((candidate) => sameLogicalPoint(candidate.witnessPoint, cell.labelPoint))
          ?? solution.expectedFields.find((candidate) => pointInPolygon(candidate.witnessPoint, cell.polygon));
        return { ...cell, phaseOrder: field ? expectedLabels(field) : [] };
      }),
      revealed: true,
      solved: false,
    }));
    announce("Solution revealed");
  };

  const continueUnscored = () => {
    setState((current) => resumeTimer({
      ...current,
      metrics: { ...current.metrics, continuingUnscored: true },
    }));
    announce("Continuing unscored");
  };

  const elapsed = formatElapsed(activeMilliseconds(state, clock));
  const selectedConcept = RULE_CONCEPTS.find((concept) => concept.id === selectedConceptId);
  const setSettings = (settings: GameSettings) => updateProfile((current) => ({ ...current, settings }));
  const openPanel = (next: Panel) => {
    setSelectedConceptId(undefined);
    setPanel(next);
  };

  return (
    <main className={`game-shell ${state.solved || state.revealed ? "is-clean" : ""} ${state.solved ? "is-solved" : ""} ${difficulty === "hard" ? "is-large-binary" : ""} ${profile.settings.leftHanded ? "left-handed" : ""}`}>
      {/* Paper-theme print filters, matching photographed ink figures: strokes
          stay drafted-straight, but edges erode into the paper fibre and ink
          density varies faintly along the line, like a book reproduction. */}
      <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter id="pen-ink-board" filterUnits="userSpaceOnUse" x="-60" y="-60" width="1120" height="1120">
            <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="4" result="fibre" />
            <feDisplacementMap in="SourceGraphic" in2="fibre" scale="1.8" xChannelSelector="R" yChannelSelector="G" result="rough" />
            <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed="9" result="density" />
            <feColorMatrix in="density" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.2 0.2 0.2 0 0.72" result="inkmask" />
            <feComposite in="rough" in2="inkmask" operator="in" />
          </filter>
          <filter id="pen-ink-glyph" filterUnits="userSpaceOnUse" x="-10" y="-10" width="180" height="130">
            <feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="2" seed="4" result="fibre" />
            <feDisplacementMap in="SourceGraphic" in2="fibre" scale="0.6" xChannelSelector="R" yChannelSelector="G" result="rough" />
            <feTurbulence type="fractalNoise" baseFrequency="0.2" numOctaves="2" seed="9" result="density" />
            <feColorMatrix in="density" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.2 0.2 0.2 0 0.72" result="inkmask" />
            <feComposite in="rough" in2="inkmask" operator="in" />
          </filter>
        </defs>
      </svg>
      {atHome ? (
        <section className="home-screen" aria-label="Main menu">
          <div className="home-menu">
            <h1 className="home-title">TIE-LINE</h1>
            <div className="difficulty-switcher" aria-label="Difficulty">
              <button type="button" aria-label="Previous difficulty" onClick={() => cycleDifficulty(-1)}>‹</button>
              <span>{DIFFICULTIES.find((item) => item.id === difficulty)?.label}</span>
              <button type="button" aria-label="Next difficulty" onClick={() => cycleDifficulty(1)}>›</button>
            </div>
            <div className="launch-actions">
              <button type="button" onClick={startNewMain}>Start</button>
              <div className="resume-slot" aria-hidden={!canResume}>{canResume && <button type="button" onClick={() => startRound(difficulty)}>Resume</button>}</div>
            </div>
            <nav className="home-icon-nav" aria-label="Main menu actions">
              <button type="button" aria-label="Settings" onClick={() => openPanel("settings")}><span aria-hidden="true">⚙</span></button>
              <button type="button" aria-label="Rules" onClick={() => openPanel("rules")}><span aria-hidden="true">≡</span></button>
              <button type="button" aria-label="Statistics" onClick={() => openPanel("statistics")}><span aria-hidden="true">●</span></button>
            </nav>
          </div>
        </section>
      ) : <>
        <header className="top-rail">
          <div className="top-left-actions">
            <button className="back-action" type="button" aria-label="Main menu" onClick={goHome}>‹</button>
            {!state.solved && !state.revealed && !failureOpen && <>
              <button className="clear-all-action" type="button" aria-label="Clear all labels" disabled={!state.cells.some((cell) => cell.phaseOrder.length > 0)} onClick={() => { commit(clearPhaseLabels); announce("All labels cleared"); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M7 11h10M9 15h6"/><path d="M5 19 19 5"/></svg></button>
              <button className={`erase-action ${state.activeTool === "erase" ? "is-active" : ""}`} type="button" aria-label="Erase labels" aria-pressed={state.activeTool === "erase"} onClick={() => updateTransient((current) => setTool(current, current.activeTool === "erase" ? "label" : "erase"))}>⌫</button>
            </>}
          </div>
          <div className="status-cluster" aria-label="Puzzle status">
            <time aria-label={`Elapsed time ${elapsed}`}>{elapsed}</time>
            <div className="attempts" aria-label={`${state.metrics.submissionsRemaining} submissions remaining`}>{[0, 1, 2].map((index) => <span key={index} className={`${index < state.metrics.submissionsRemaining ? "is-available" : ""} ${state.metrics.submitCount > 0 && index === state.metrics.submissionsRemaining ? "is-spent" : ""}`} />)}</div>
          </div>
          <div className="viewport-actions" role="group" aria-label="View controls">
            <button type="button" aria-label="Zoom out" disabled={state.viewport.scale <= 1.001} onClick={() => changeZoom(1 / 1.35)}>−</button>
            <button className="reset-view-action" type="button" aria-label="Reset view" title="Reset view" onClick={() => updateTransient((current) => ({ ...current, viewport: { scale: 1, translateX: 0, translateY: 0 } }))}>{Math.round(state.viewport.scale * 100)}%</button>
            <button type="button" aria-label="Zoom in" disabled={state.viewport.scale >= maximumViewportScale(puzzle.expectedFieldCount) - .001} onClick={() => changeZoom(1.35)}>+</button>
          </div>
        </header>

        <section className="board-region">
            <DiagramCanvas
              key={puzzle.id}
              state={state}
              puzzle={puzzle}
              interactionDisabled={failureOpen}
              invalidPointIds={new Set()}
              onPlacePoint={(roleId, value) => commit((current) => placeOrMovePoint(current, roleId, value))}
              onAddGeometry={(value) => commit((current) => addGeometry(current, value))}
              onUpdateGeometry={(value) => commit((current) => updateGeometry(current, value))}
              onSelectPhase={(activePhaseId) => updateTransient((current) => ({ ...setTool(current, "label"), activePhaseId }))}
              onTogglePhaseInCell={(cellId, phaseId) => commit((current) => togglePhaseInCell(current, cellId, phaseId, puzzle.diagramLabels.map((label) => label.id)))}
              onRemovePhaseFromCell={(cellId, phaseId) => commit((current) => removePhaseFromCell(current, cellId, phaseId))}
              onDeleteGeometry={(geometryId) => commit((current) => deleteGeometry(current, geometryId))}
              onDeletePoint={(pointId) => commit((current) => deletePoint(current, pointId))}
              onSelectElement={(selectedElementId) => updateTransient((current) => ({ ...current, selectedElementId }))}
              onViewportChange={(viewport: ViewportState) => updateTransient((current) => ({ ...current, viewport }))}
              onRejected={announce}
            />
            {submitImpact && <span key={submitImpact.id} className={`submission-impact is-${submitImpact.kind}`} aria-hidden="true" />}
        </section>

        {feedback && <div className="feedback-toast" role="status" aria-live="polite">{feedback}</div>}

        {!state.solved && !state.revealed && !failureOpen && (
          <>
            <footer className="minimal-control-rail">
              <button className="icon-action" type="button" aria-label="Undo" disabled={history.current.length === 0} onClick={undo}>↶</button>
              <PhasePalette phases={puzzle.diagramLabels} activePhaseId={state.activePhaseId} onSelect={(activePhaseId) => updateTransient((current) => ({ ...setTool(current, "label"), activePhaseId }))} onPointerStart={() => undefined} />
            </footer>
            <button className="submit-action submit-corner-action" type="button" aria-label="Submit labels" onClick={handleSubmit}>✓</button>
          </>
        )}
        {(state.revealed || (state.solved && studyingResult)) && <footer className="review-control-rail" aria-label="Solution controls"><span>{state.revealed ? "Solution shown" : "Diagram solved"}</span><button type="button" onClick={goHome}>Menu</button><button type="button" onClick={newPuzzle}>Next</button></footer>}
      </>}

      {failureOpen && <div className="modal-scrim round-outcome-overlay" role="dialog" aria-modal="true" aria-labelledby="failure-title">
        <section className="round-outcome-card">
          <span className="eyebrow">Scored attempt ended</span>
          <h2 id="failure-title">Choose what happens next</h2>
          <div className="result-grid"><div><strong>{elapsed}</strong><span>Time</span></div><div><strong>{state.metrics.submitCount}</strong><span>Submissions</span></div><div><strong>{puzzle.expectedFieldCount}</strong><span>Fields</span></div></div>
          <p><strong>{puzzle.title}</strong><br/>Seed {round.seed}</p>
          <div className="failure-choice-grid"><button type="button" onClick={continueUnscored}>Continue</button><button type="button" onClick={revealSolution}>Reveal</button><button type="button" onClick={newPuzzle}>New</button><button type="button" onClick={goHome}>Menu</button></div>
        </section>
      </div>}

      {completionOpen && <div className="modal-scrim round-outcome-overlay" role="dialog" aria-modal="true" aria-labelledby="completion-title">
        <section className="round-outcome-card">
          <span className="eyebrow">{state.metrics.continuingUnscored ? "Unscored" : "Round complete"}</span>
          <h2 id="completion-title">Diagram solved</h2>
          <div className="result-grid"><div><strong>{elapsed}</strong><span>Time</span></div><div><strong>{state.metrics.submitCount}</strong><span>Submissions</span></div><div><strong>{puzzle.expectedFieldCount}</strong><span>Fields</span></div></div>
          <p><strong>{puzzle.title}</strong><br/>Seed {round.seed}</p>
          <div className="completion-choice-grid"><button type="button" onClick={() => setStudyingResult(true)}>Study diagram</button><button type="button" onClick={goHome}>Menu</button><button type="button" onClick={newPuzzle}>Next</button></div>
        </section>
      </div>}

      {!atHome && !profile.onboardingComplete && (
        <div className="modal-scrim onboarding" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
          <div className="coach-card">
            <span className="eyebrow">Tie-Line</span>
            <h1 id="onboarding-title">Label the phase diagram.</h1>
            <ol><li>Choose a phase symbol.</li><li>Tap every field where it belongs.</li><li>Label each invariant line when one is present.</li></ol>
            <button className="primary-wide" type="button" onClick={() => updateProfile((current) => ({ ...current, onboardingComplete: true }))}>Start labelling</button>
          </div>
        </div>
      )}

      {panel && (
        <div className="modal-scrim" role="dialog" aria-modal="true" aria-label={`${panel} panel`}>
          <section className="game-panel">
            <header className="panel-header"><div><span className="eyebrow">Tie-Line</span><h2>{panel[0].toUpperCase() + panel.slice(1)}</h2></div><button type="button" aria-label="Close panel" onClick={() => setPanel(undefined)}>×</button></header>

            {panel === "rules" && (selectedConcept ? <div className="concept-focus">
              <button className="back-link" type="button" onClick={() => setSelectedConceptId(undefined)}>← All rules</button>
              <ConceptDiagram kind={selectedConcept.diagram}/>
              <span className="concept-category">{selectedConcept.category}</span>
              <h3>{selectedConcept.title}</h3>
              {selectedConcept.reaction && <div className="transition-block">
                <span>{selectedConcept.direction ?? "Phase transition"}</span>
                <p className="reaction-line">{selectedConcept.reaction}</p>
                {selectedConcept.transitionNote && <p>{selectedConcept.transitionNote}</p>}
              </div>}
              <p>{selectedConcept.rule}</p>
              <div className="recognition-cue"><strong>Recognise it</strong><span>{selectedConcept.cue}</span></div>
            </div> : <><RulesOverview/><ConceptGrid concepts={RULE_CONCEPTS} onSelect={(concept) => setSelectedConceptId(concept.id)}/></>)}

            {panel === "statistics" && <><div className="difficulty-statistics-list">{DIFFICULTIES.map((item) => <DifficultyStatistics key={item.id} difficulty={item} history={profile.history}/>)}</div><div className="recent-list"><h3>Recent</h3>{profile.history.length === 0 ? <p>No scored rounds yet.</p> : [...profile.history].reverse().slice(0, 8).map((item) => <div key={`${item.puzzleId}:${item.completedAt}`}><span>{item.difficulty} · {item.family.replaceAll("-", " ")}</span><small>{item.outcome} · {formatElapsed(item.elapsedMilliseconds)}</small></div>)}</div></>}

            {panel === "settings" && <div className="settings-list"><label><span>Theme<small>Dark, light, or follow the system</small></span><select value={profile.settings.theme} onChange={(event) => setSettings({ ...profile.settings, theme: event.target.value as GameSettings["theme"] })}><option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option></select></label><label><span>Reduce motion<small>Minimise transitions and pops</small></span><input type="checkbox" checked={profile.settings.reducedMotion} onChange={(event) => setSettings({ ...profile.settings, reducedMotion: event.target.checked })}/></label><label><span>Left-handed controls<small>Move the submit action to the left</small></span><input type="checkbox" checked={profile.settings.leftHanded} onChange={(event) => setSettings({ ...profile.settings, leftHanded: event.target.checked })}/></label></div>}
          </section>
        </div>
      )}
    </main>
  );
}
