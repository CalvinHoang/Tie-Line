import { useCallback, useEffect, useRef, useState } from "react";
import { DiagramCanvas } from "../canvas/DiagramCanvas";
import { createPuzzleSeed, generateRound, type Difficulty, type GeneratedRound } from "../domain/generator";
import { pointInPolygon, sameLogicalPoint } from "../domain/geometry";
import { RULE_CATEGORIES, RULE_CONCEPTS, type RuleConcept } from "../domain/concepts";
import type { ConstructionState, ViewportState } from "../domain/schema";
import {
  activeMilliseconds,
  addGeometry,
  addPhaseToCell,
  addPhaseToInvariant,
  createLabelingState,
  deleteGeometry,
  deletePoint,
  formatElapsed,
  pauseTimer,
  placeOrMovePoint,
  removePhaseFromCell,
  removePhaseFromInvariant,
  resumeTimer,
  setTool,
  updateGeometry,
} from "../editor/state";
import {
  clearConstruction,
  constructionHasProgress,
  currentStreak,
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
  { id: "easy", label: "Easy", detail: "1–2 critical points · 1 intermediate phase" },
  { id: "normal", label: "Normal", detail: "Expanded transitions · 1 intermediate phase" },
  { id: "hard", label: "Hard", detail: "3 critical points · up to 2 intermediate phases" },
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
    summary: "Congruent melting preserves composition; incongruent melting produces a solid and liquid of different compositions.",
    points: [
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
  if (kind === "triangle") return <svg viewBox="0 0 160 88" aria-hidden="true"><path d="M24 73 80 14l56 59Z"/><circle cx="24" cy="73" r="3"/><circle cx="80" cy="14" r="3"/><circle cx="136" cy="73" r="3"/><circle className="accent-fill" cx="80" cy="52" r="4"/><path className="accent" d="M80 52 24 73M80 52 80 14M80 52l56 21"/></svg>;
  if (kind === "lever") return <svg viewBox="0 0 160 88" aria-hidden="true"><path d="M22 45h116"/><circle cx="42" cy="45" r="4"/><circle className="accent-fill" cx="94" cy="45" r="5"/><circle cx="129" cy="45" r="4"/><text x="36" y="68">α</text><text x="90" y="68">C₀</text><text x="125" y="68">β</text></svg>;
  if (kind === "melting") return <svg viewBox="0 0 160 88" aria-hidden="true"><path d="M18 73h124M25 73V12M36 65Q68 22 80 22t44 43M80 73V22"/><path className="accent" d="M89 62h36M107 62V40"/><circle className="accent-fill" cx="80" cy="22" r="4"/></svg>;
  if (kind === "section") return <svg viewBox="0 0 160 88" aria-hidden="true"><path d="M22 72 80 14l58 58Z"/><path d="M51 43q27 16 57 0M51 43 34 61M108 43l18 18"/><path className="accent" d="M51 43 108 43 80 68Z"/></svg>;
  if (kind === "path") return <svg viewBox="0 0 160 88" aria-hidden="true"><path d="M18 72h124M24 72V12M34 23q25 8 43 27t52 14"/><path className="accent" d="M43 29c12 8 20 17 27 27s25 9 45 8"/><path className="accent-fill" d="m111 58 12 6-12 6Z"/></svg>;
  return <svg viewBox="0 0 160 88" aria-hidden="true"><path d="M18 72h124M24 72V12M32 60Q54 19 80 49t49-23M28 55h104"/><circle className="accent-fill" cx="80" cy="49" r="4"/></svg>;
}

function RulesOverview() {
  return <>
    <section className="rules-intro"><span className="eyebrow">Reference notes · pages 1–5</span><h3>Read, classify, then label</h3><p>Use equilibrium geometry first: identify the diagram family, locate the invariant reaction, and only then assign the phase assemblages.</p></section>
    <div className="foundation-grid">{FOUNDATIONS.map((item) => <article key={item.id} className="foundation-card"><FoundationSketch kind={item.sketch}/><h4>{item.title}</h4><p>{item.summary}</p><ul>{item.points.map((point) => <li key={point}>{point}</li>)}</ul></article>)}</div>
    <section className="processing-rules"><h3>Processing definitions</h3><div>{PROCESSING.map(([title, description]) => <article key={title}><h4>{title}</h4><p>{description}</p></article>)}</div></section>
    <section className="notation-key"><h3>Invariant notation</h3><p><strong>T</strong> temperature · <strong>X</strong> composition · <strong>L</strong> liquid · <strong>S</strong> solid or solid solution · primes/subscripts distinguish structures or compositions.</p></section>
  </>;
}

export function App() {
  const [profile, setProfile] = useState<PlayerProfile>(loadProfile);
  const [difficulty, setDifficulty] = useState<Difficulty>(() => loadProfile().lastDifficulty);
  const [round, setRound] = useState<GeneratedRound>(() => loadRound(loadProfile().lastDifficulty));
  const [state, setState] = useState<ConstructionState>(() => loadConstruction(round.puzzle.id, round.difficulty) ?? createLabelingState(round.puzzle, round.solution));
  const [atHome, setAtHome] = useState(true);
  const [panel, setPanel] = useState<Panel>();
  const [feedback, setFeedback] = useState<string>();
  const [clock, setClock] = useState(Date.now());
  const [selectedConceptId, setSelectedConceptId] = useState<string>();
  const history = useRef<ConstructionState[]>([]);

  const { puzzle, solution } = round;
  const overlayOpen = atHome || Boolean(panel) || !profile.onboardingComplete;
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
    document.documentElement.dataset.theme = profile.settings.theme;
    document.documentElement.classList.toggle("reduce-motion", profile.settings.reducedMotion);
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
      history.current.push(structuredClone(current));
      if (history.current.length > 80) history.current.shift();
      return update(current);
    });
  }, []);

  const updateTransient = useCallback((update: (current: ConstructionState) => ConstructionState) => setState(update), []);
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

  const resetLabels = () => {
    clearConstruction(difficulty);
    history.current = [];
    setState(createLabelingState(puzzle, solution));
    announce("Round reset");
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
      commit((current) => ({ ...current, lastSubmitStatus: result.status, metrics: { ...current.metrics, submitCount: current.metrics.submitCount + 1 } }));
      announce(result.status === "incomplete" ? "Some labels are still missing" : "Not quite — check each phase assemblage");
      return;
    }
    const lastAttempt = state.metrics.submissionsRemaining <= 1;
    const submissions = state.metrics.submitCount + 1;
    commit((current) => {
      const next = { ...current, lastSubmitStatus: lastAttempt ? "failed-scored-attempt" as const : result.status, metrics: { ...current.metrics, submitCount: submissions, submissionsRemaining: Math.max(0, current.metrics.submissionsRemaining - 1), scoredAttemptEnded: lastAttempt } };
      return lastAttempt ? pauseTimer(next) : next;
    });
    if (lastAttempt) recordOutcome("failed", true, submissions);
    announce(lastAttempt ? "Scored attempt ended" : result.status === "incomplete" ? "Incomplete" : "Not correct");
  };

  const revealSolution = () => {
    commit((current) => ({
      ...pauseTimer(current),
      geometry: current.geometry.map((item) => item.type === "invariant-horizontal"
        ? { ...item, phaseOrder: solution.invariants.find((expected) => expected.temperatureCelsius === item.temperatureCelsius)?.expectedAssemblage ?? [] }
        : item),
      cells: current.cells.map((cell) => ({ ...cell, phaseOrder: (solution.expectedFields.find((field) => sameLogicalPoint(field.witnessPoint, cell.labelPoint)) ?? solution.expectedFields.find((field) => pointInPolygon(field.witnessPoint, cell.polygon)))?.expectedAssemblage ?? [] })),
      revealed: true,
      solved: false,
    }));
    announce("Solution revealed");
  };

  const elapsed = formatElapsed(activeMilliseconds(state, clock));
  const solvedHistory = profile.history.filter((item) => item.outcome === "solved" && item.scored);
  const streak = currentStreak(profile.history);
  const selectedConcept = RULE_CONCEPTS.find((concept) => concept.id === selectedConceptId);
  const setSettings = (settings: GameSettings) => updateProfile((current) => ({ ...current, settings }));
  const openPanel = (next: Panel) => {
    setSelectedConceptId(undefined);
    setPanel(next);
  };

  return (
    <main className={`game-shell ${state.solved || state.revealed ? "is-clean" : ""} ${profile.settings.leftHanded ? "left-handed" : ""}`}>
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
          <button className="back-action" type="button" aria-label="Main menu" onClick={goHome}>‹</button>
          <div className="status-cluster" aria-label="Puzzle status">
            <time aria-label={`Elapsed time ${elapsed}`}>{elapsed}</time>
            <div className="attempts" aria-label={`${state.metrics.submissionsRemaining} submissions remaining`}>{[0, 1, 2].map((index) => <span key={index} className={index < state.metrics.submissionsRemaining ? "is-available" : ""} />)}</div>
          </div>
          <button className="reset-view-action" type="button" aria-label="Reset view" onClick={() => updateTransient((current) => ({ ...current, viewport: { scale: 1, translateX: 0, translateY: 0 } }))}>⌾</button>
        </header>

        <section className="board-region">
            <DiagramCanvas
              key={puzzle.id}
              state={state}
              puzzle={puzzle}
              invalidPointIds={new Set()}
              onPlacePoint={(roleId, value) => commit((current) => placeOrMovePoint(current, roleId, value))}
              onAddGeometry={(value) => commit((current) => addGeometry(current, value))}
              onUpdateGeometry={(value) => commit((current) => updateGeometry(current, value))}
              onAddPhaseToCell={(cellId, phaseId) => commit((current) => addPhaseToCell(current, cellId, phaseId))}
              onRemovePhaseFromCell={(cellId, phaseId) => commit((current) => removePhaseFromCell(current, cellId, phaseId))}
              onAddPhaseToInvariant={(geometryId, phaseId) => commit((current) => addPhaseToInvariant(current, geometryId, phaseId))}
              onRemovePhaseFromInvariant={(geometryId, phaseId) => commit((current) => removePhaseFromInvariant(current, geometryId, phaseId))}
              onDeleteGeometry={(geometryId) => commit((current) => deleteGeometry(current, geometryId))}
              onDeletePoint={(pointId) => commit((current) => deletePoint(current, pointId))}
              onSelectElement={(selectedElementId) => updateTransient((current) => ({ ...current, selectedElementId }))}
              onViewportChange={(viewport: ViewportState) => updateTransient((current) => ({ ...current, viewport }))}
              onRejected={announce}
            />
            {state.metrics.scoredAttemptEnded && !state.metrics.continuingUnscored && !state.revealed && (
              <div className="failure-actions" aria-label="Scored attempt ended">
                <button type="button" onClick={() => commit((current) => ({ ...current, metrics: { ...current.metrics, continuingUnscored: true } }))}>Continue</button>
                <button type="button" onClick={revealSolution}>Reveal</button>
                <button type="button" onClick={newPuzzle}>New</button>
              </div>
            )}
            {(state.solved || state.revealed) && (
              <div className="result-sheet" role="dialog" aria-label="Round result">
                <span className="eyebrow">{state.revealed ? "Solution" : state.metrics.continuingUnscored ? "Unscored" : "Round complete"}</span>
                <h2>{state.revealed ? "Study the labels" : "Diagram solved"}</h2>
                <div className="result-grid"><div><strong>{elapsed}</strong><span>Time</span></div><div><strong>{state.metrics.submitCount}</strong><span>Submissions</span></div><div><strong>{puzzle.expectedFieldCount}</strong><span>Fields</span></div></div>
                <p><strong>{puzzle.title}</strong><br/>Seed {round.seed}</p>
                <div className="result-actions"><button type="button" onClick={goHome}>Menu</button><button type="button" onClick={newPuzzle}>Next</button></div>
              </div>
            )}
        </section>

        {feedback && <div className="feedback-toast" role="status" aria-live="polite">{feedback}</div>}

        {!state.solved && !state.revealed && (
          <footer className="minimal-control-rail">
            <button className="icon-action" type="button" aria-label="Undo" disabled={history.current.length === 0} onClick={undo}>↶</button>
            <PhasePalette phases={puzzle.phases} activePhaseId={state.activePhaseId} onSelect={(activePhaseId) => updateTransient((current) => ({ ...setTool(current, "label"), activePhaseId }))} onPointerStart={() => undefined} />
            <button className={`erase-action ${state.activeTool === "erase" ? "is-active" : ""}`} type="button" aria-label="Erase labels" aria-pressed={state.activeTool === "erase"} onClick={() => updateTransient((current) => setTool(current, current.activeTool === "erase" ? "label" : "erase"))}>⌫</button>
            <button className="submit-action" type="button" aria-label="Submit labels" onClick={handleSubmit}>✓</button>
          </footer>
        )}
      </>}

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

            {panel === "statistics" && <><div className="stat-grid"><div><strong>{solvedHistory.length}</strong><span>Solved</span></div><div><strong>{streak}</strong><span>Day streak</span></div><div><strong>{solvedHistory.length ? Math.round(solvedHistory.filter((item) => item.noError).length / solvedHistory.length * 100) : 0}%</strong><span>No-error</span></div><div><strong>{solvedHistory.length ? formatElapsed(Math.min(...solvedHistory.map((item) => item.elapsedMilliseconds))) : "—"}</strong><span>Best time</span></div></div><div className="recent-list"><h3>Recent</h3>{profile.history.length === 0 ? <p>No scored rounds yet.</p> : [...profile.history].reverse().slice(0, 8).map((item) => <div key={`${item.puzzleId}:${item.completedAt}`}><span>{item.difficulty} · {item.family.replaceAll("-", " ")}</span><small>{item.outcome} · {formatElapsed(item.elapsedMilliseconds)}</small></div>)}</div></>}

            {panel === "settings" && <div className="settings-list"><label><span>Theme<small>Dark, light, or follow the system</small></span><select value={profile.settings.theme} onChange={(event) => setSettings({ ...profile.settings, theme: event.target.value as GameSettings["theme"] })}><option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option></select></label><label><span>Reduce motion<small>Minimise transitions and pops</small></span><input type="checkbox" checked={profile.settings.reducedMotion} onChange={(event) => setSettings({ ...profile.settings, reducedMotion: event.target.checked })}/></label><label><span>Left-handed controls<small>Move the submit action to the left</small></span><input type="checkbox" checked={profile.settings.leftHanded} onChange={(event) => setSettings({ ...profile.settings, leftHanded: event.target.checked })}/></label></div>}
          </section>
        </div>
      )}
    </main>
  );
}
