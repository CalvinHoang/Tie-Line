import type { Difficulty } from "../domain/generator";
import type { ConstructionState } from "../domain/schema";
import { pauseTimer, resumeTimer } from "../editor/state";

const PREFIX = "tie-line:full-1";
const PROFILE_KEY = `${PREFIX}:profile`;

export interface GameSettings {
  theme: "dark" | "light" | "system";
  reducedMotion: boolean;
  leftHanded: boolean;
}

export interface SolveRecord {
  puzzleId: string;
  seed: number;
  difficulty: Difficulty;
  family: string;
  outcome: "solved" | "failed" | "revealed";
  scored: boolean;
  noError: boolean;
  elapsedMilliseconds: number;
  submissions: number;
  completedAt: string;
}

export interface PlayerProfile {
  version: 1;
  lastDifficulty: Difficulty;
  onboardingComplete: boolean;
  settings: GameSettings;
  history: SolveRecord[];
}

export const defaultProfile = (): PlayerProfile => ({
  version: 1,
  lastDifficulty: "normal",
  onboardingComplete: false,
  settings: { theme: "light", reducedMotion: false, leftHanded: false },
  history: [],
});

export function loadProfile(): PlayerProfile {
  try {
    const value = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "null") as PlayerProfile | null;
    if (!value || value.version !== 1) return defaultProfile();
    const legacyDifficulty = (value as unknown as { lastDifficulty: string }).lastDifficulty;
    const lastDifficulty: Difficulty = legacyDifficulty === "advanced" ? "hard" : value.lastDifficulty;
    return { ...defaultProfile(), ...value, lastDifficulty, settings: { ...defaultProfile().settings, ...value.settings }, history: value.history ?? [] };
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...profile, history: profile.history.slice(-200) }));
  } catch {
    // The game remains playable when storage is unavailable.
  }
}

const constructionKey = (difficulty: Difficulty) => `${PREFIX}:construction:${difficulty}`;
const seedKey = (difficulty: Difficulty) => `${PREFIX}:seed:${difficulty}`;

export function saveConstruction(state: ConstructionState, difficulty: Difficulty = "normal"): void {
  try {
    localStorage.setItem(constructionKey(difficulty), JSON.stringify(pauseTimer(state)));
  } catch {
    // Storage is an enhancement; a blocked store must not stop play.
  }
}

export function constructionHasProgress(state: ConstructionState): boolean {
  if (state.solved || state.revealed || state.metrics.scoredAttemptEnded) return false;
  return Boolean(
    state.metrics.submitCount > 0
    || state.metrics.pointMoveCount > 0
    || state.metrics.geometryDeleteCount > 0
    || state.metrics.phaseDeleteCount > 0
    || state.metrics.undoCount > 0
    || state.cells.some((cell) => cell.phaseOrder.length > 0)
  );
}

export function hasResumableConstruction(difficulty: Difficulty = "normal"): boolean {
  try {
    const raw = localStorage.getItem(constructionKey(difficulty));
    if (!raw) return false;
    const state = JSON.parse(raw) as ConstructionState;
    return state.version === 2 && constructionHasProgress(state);
  } catch {
    return false;
  }
}

export function loadConstruction(puzzleId: string, difficulty: Difficulty = "normal"): ConstructionState | undefined {
  try {
    const raw = localStorage.getItem(constructionKey(difficulty));
    if (!raw) return undefined;
    const state = JSON.parse(raw) as ConstructionState;
    if (state.version !== 2 || state.puzzleId !== puzzleId) return undefined;
    return resumeTimer(state);
  } catch {
    return undefined;
  }
}

export function clearConstruction(difficulty: Difficulty = "normal"): void {
  try {
    localStorage.removeItem(constructionKey(difficulty));
  } catch {
    // Ignore unavailable storage.
  }
}

export function loadPuzzleSeed(difficulty: Difficulty = "normal"): number | undefined {
  try {
    const raw = localStorage.getItem(seedKey(difficulty));
    if (raw === null && difficulty === "normal") {
      const legacy = localStorage.getItem("tie-line:labels-1:seed");
      if (legacy !== null) return Number(legacy) >>> 0;
    }
    if (raw === null) return undefined;
    const seed = Number(raw);
    return Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff ? seed : undefined;
  } catch {
    return undefined;
  }
}

export function savePuzzleSeed(seed: number, difficulty: Difficulty = "normal"): void {
  try {
    localStorage.setItem(seedKey(difficulty), String(seed >>> 0));
  } catch {
    // A blocked store simply means the next reload may generate a new round.
  }
}

export function currentStreak(history: SolveRecord[], today = new Date()): number {
  const dates = new Set(history.filter((item) => item.outcome === "solved" && item.scored)
    .map((item) => new Date(item.completedAt).toLocaleDateString("en-CA")));
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let streak = 0;
  while (dates.has(cursor.toLocaleDateString("en-CA"))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
