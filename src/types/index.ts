export type Sport = "mlb" | "nfl" | "nba" | "nhl";

export type WatchReason = "close" | "comeback" | "offense" | "pitching";

export type SpoilerTolerance = "vibes" | "story" | "players";

export type TeamBias = "any" | "favorite_win_only";

export type VerdictKey =
  | "pitch_by_pitch"
  | "fast_forward"
  | "condensed"
  | "highlights"
  | "skip"
  | "live";

export interface FeedbackEntry {
  gameId: string;
  verdictGiven: VerdictKey;
  userRating: VerdictKey;
  note?: string;
}

export interface Prefs {
  sports: Sport[];
  favoriteTeams: Record<Sport, string>; // team abbrev per sport
  watchReasons: WatchReason[];
  spoilerTolerance: SpoilerTolerance;
  teamBias: TeamBias;
  darkMode: boolean;
  feedbackHistory: FeedbackEntry[];
}

export interface PeriodScore {
  period: number;
  label: string; // "1st", "2nd", "Top 1", etc.
  homeScore: number;
  awayScore: number;
  combined: number;
}

export interface GameData {
  id: string;
  sport: Sport;
  status: "scheduled" | "inprogress" | "final";
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeAbbrev: string;
  awayAbbrev: string;
  score: Record<string, number>;
  periods: PeriodScore[];
  totalRuns: number;
  margin: number;
  strongPitching: boolean;
  startingPitcher?: string;
  bigPeriod?: number;
  bigPeriodSwing?: number;
  lateAction: boolean;
  backAndForth: boolean;
  favoriteTeamWon?: boolean;
  favoriteTeamPlaying: boolean;
}

export interface VerdictResult {
  key: VerdictKey;
  label: string;
  emoji: string;
  score: number;
  beats: string[];
}

export const VERDICT_ORDER: VerdictKey[] = [
  "pitch_by_pitch",
  "fast_forward",
  "condensed",
  "highlights",
  "skip",
];

export const VERDICT_META: Record<
  VerdictKey,
  { label: string; emoji: string }
> = {
  pitch_by_pitch: { label: "Watch Pitch by Pitch", emoji: "📺" },
  fast_forward: { label: "Watch but Fast Forward", emoji: "⏩" },
  condensed: { label: "Condensed Replay", emoji: "🎬" },
  highlights: { label: "Highlights Only", emoji: "✂️" },
  skip: { label: "Skip It", emoji: "😴" },
  live: { label: "Worth Tuning In", emoji: "🔴" },
};

// NY teams per sport
export const NY_TEAMS: Record<Sport, { abbrev: string; name: string }[]> = {
  mlb: [
    { abbrev: "NYY", name: "New York Yankees" },
    { abbrev: "NYM", name: "New York Mets" },
  ],
  nfl: [
    { abbrev: "NYG", name: "New York Giants" },
    { abbrev: "NYJ", name: "New York Jets" },
  ],
  nba: [
    { abbrev: "NY", name: "New York Knicks" },
    { abbrev: "BKN", name: "Brooklyn Nets" },
  ],
  nhl: [
    { abbrev: "NYR", name: "New York Rangers" },
    { abbrev: "NYI", name: "New York Islanders" },
    { abbrev: "NJ", name: "New Jersey Devils" },
  ],
};

export const PERIOD_LABEL: Record<Sport, string> = {
  mlb: "inning",
  nfl: "quarter",
  nba: "quarter",
  nhl: "period",
};
