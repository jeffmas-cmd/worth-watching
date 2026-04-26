import type { GameData, PeriodScore, Prefs, Sport } from "../types";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";

const SPORT_PATH: Record<Sport, string> = {
  mlb: "baseball/mlb",
  nfl: "football/nfl",
  nba: "basketball/nba",
  nhl: "hockey/nhl",
};

// NY team abbrevs per sport (ESPN uses its own abbreviations)
const NY_ABBREVS: Record<Sport, string[]> = {
  mlb: ["NYY", "NYM"],
  nfl: ["NYG", "NYJ"],
  nba: ["NY", "BKN"],
  nhl: ["NYR", "NYI", "NJ"],
};

function parseStatus(
  event: ESPNEvent
): "scheduled" | "inprogress" | "final" {
  const type = event.status?.type?.name ?? "";
  if (type === "STATUS_IN_PROGRESS") return "inprogress";
  if (type === "STATUS_FINAL" || type === "STATUS_FINAL_OT" || type === "STATUS_FINAL_PEN") return "final";
  return "scheduled";
}

interface ESPNCompetitor {
  team: { abbreviation: string; displayName: string };
  homeAway: "home" | "away";
  score?: string;
  linescores?: { value: number }[];
  statistics?: { name: string; displayValue: string }[];
}

interface ESPNEvent {
  id: string;
  date: string;
  status: { type: { name: string } };
  competitions: {
    competitors: ESPNCompetitor[];
    situation?: { lastPlay?: { text: string } };
  }[];
}

function buildPeriods(
  home: ESPNCompetitor,
  away: ESPNCompetitor,
  sport: Sport
): PeriodScore[] {
  const homeLines = home.linescores ?? [];
  const awayLines = away.linescores ?? [];
  const count = Math.max(homeLines.length, awayLines.length);
  const periods: PeriodScore[] = [];

  for (let i = 0; i < count; i++) {
    const h = homeLines[i]?.value ?? 0;
    const a = awayLines[i]?.value ?? 0;
    periods.push({
      period: i + 1,
      label: periodLabel(sport, i + 1),
      homeScore: h,
      awayScore: a,
      combined: h + a,
    });
  }
  return periods;
}

function periodLabel(sport: Sport, n: number): string {
  if (sport === "mlb") return `Inning ${n}`;
  if (sport === "nfl" || sport === "nba") {
    const suffixes = ["1st", "2nd", "3rd", "4th"];
    return suffixes[n - 1] ?? `OT${n - 4}`;
  }
  if (sport === "nhl") {
    const suffixes = ["1st", "2nd", "3rd"];
    return suffixes[n - 1] ?? `OT${n - 3}`;
  }
  return `Period ${n}`;
}

function computeStrongPitching(
  home: ESPNCompetitor,
  away: ESPNCompetitor
): boolean {
  // ESPN MLB stats: look for ERA or strikeouts — if total runs <= 5, flag as strong pitching
  const homeScore = parseFloat(home.score ?? "0");
  const awayScore = parseFloat(away.score ?? "0");
  return homeScore + awayScore <= 5;
}

function normalizeGame(
  event: ESPNEvent,
  sport: Sport,
  prefs: Prefs
): GameData | null {
  const competition = event.competitions?.[0];
  if (!competition) return null;

  const homeComp = competition.competitors.find((c) => c.homeAway === "home");
  const awayComp = competition.competitors.find((c) => c.homeAway === "away");
  if (!homeComp || !awayComp) return null;

  const homeAbbrev = homeComp.team.abbreviation;
  const awayAbbrev = awayComp.team.abbreviation;

  const status = parseStatus(event);
  const homeScore = parseFloat(homeComp.score ?? "0");
  const awayScore = parseFloat(awayComp.score ?? "0");
  const margin = Math.abs(homeScore - awayScore);
  const totalRuns = homeScore + awayScore;

  const periods = buildPeriods(homeComp, awayComp, sport);

  // Big period: period with most combined scoring
  let bigPeriodIdx = 0;
  let bigPeriodSwing = 0;
  periods.forEach((p, i) => {
    if (p.combined > (periods[bigPeriodIdx]?.combined ?? 0)) bigPeriodIdx = i;
    const swing = Math.abs(p.homeScore - p.awayScore);
    if (swing > bigPeriodSwing) bigPeriodSwing = swing;
  });

  // Late action: scoring in final 25% of periods
  const lateStart = Math.floor(periods.length * 0.75);
  const lateAction = periods.slice(lateStart).some((p) => p.combined > 0);

  // Back and forth: 4+ periods with scoring
  const backAndForth = periods.filter((p) => p.combined > 0).length >= 4;

  const favTeam = prefs.favoriteTeams[sport];
  const favoriteTeamPlaying =
    homeAbbrev === favTeam || awayAbbrev === favTeam;

  let favoriteTeamWon: boolean | undefined;
  if (status === "final" && favoriteTeamPlaying) {
    const favIsHome = homeAbbrev === favTeam;
    favoriteTeamWon = favIsHome ? homeScore > awayScore : awayScore > homeScore;
  }

  return {
    id: event.id,
    sport,
    status,
    date: event.date,
    homeTeam: homeComp.team.displayName,
    awayTeam: awayComp.team.displayName,
    homeAbbrev,
    awayAbbrev,
    score: { [homeAbbrev]: homeScore, [awayAbbrev]: awayScore },
    periods,
    totalRuns,
    margin,
    strongPitching: sport === "mlb" ? computeStrongPitching(homeComp, awayComp) : false,
    bigPeriod: bigPeriodIdx + 1,
    bigPeriodSwing,
    lateAction,
    backAndForth,
    favoriteTeamWon,
    favoriteTeamPlaying,
  };
}

export function toESPNDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export async function fetchGamesForSport(
  sport: Sport,
  prefs: Prefs,
  date?: string // YYYYMMDD, omit for today
): Promise<GameData[]> {
  const params = date ? `?dates=${date}` : "";
  const url = `${ESPN_BASE}/${SPORT_PATH[sport]}/scoreboard${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ESPN API error: ${res.status}`);
  const data = await res.json();

  const events: ESPNEvent[] = data.events ?? [];
  const nyAbbrevs = NY_ABBREVS[sport];

  return events
    .filter((event) => {
      const competition = event.competitions?.[0];
      if (!competition) return false;
      return competition.competitors.some((c) =>
        nyAbbrevs.includes(c.team.abbreviation)
      );
    })
    .map((event) => normalizeGame(event, sport, prefs))
    .filter((g): g is GameData => g !== null);
}

export async function fetchAllGames(prefs: Prefs, date?: string): Promise<GameData[]> {
  const results = await Promise.allSettled(
    prefs.sports.map((sport) => fetchGamesForSport(sport, prefs, date))
  );

  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}
