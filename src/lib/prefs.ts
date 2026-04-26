import type { Prefs, Sport } from "../types";

const STORAGE_KEY = "worth_watching_prefs";

export const DEFAULT_PREFS: Prefs = {
  sports: ["mlb", "nfl", "nba", "nhl"],
  favoriteTeams: {
    mlb: "NYY",
    nfl: "NYG",
    nba: "NY",
    nhl: "NYR",
  },
  watchReasons: ["close", "comeback"],
  spoilerTolerance: "story",
  teamBias: "any",
  darkMode: false,
  feedbackHistory: [],
};

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: Prefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function addFeedback(
  prefs: Prefs,
  entry: Prefs["feedbackHistory"][0]
): Prefs {
  const updated = {
    ...prefs,
    feedbackHistory: [
      ...prefs.feedbackHistory.filter((f) => f.gameId !== entry.gameId),
      entry,
    ],
  };
  savePrefs(updated);
  return updated;
}

export function hasRatedGame(prefs: Prefs, gameId: string): boolean {
  return prefs.feedbackHistory.some((f) => f.gameId === gameId);
}

export function getSportLabel(sport: Sport): string {
  return sport.toUpperCase();
}
