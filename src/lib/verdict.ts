import type { GameData, Prefs, VerdictKey, VerdictResult } from "../types";
import { VERDICT_META, VERDICT_ORDER, PERIOD_LABEL } from "../types";

function computeRawScore(game: GameData, prefs: Prefs): number {
  let score = 0;
  const { watchReasons } = prefs;

  if (watchReasons.includes("close")) {
    if (game.margin <= 1) score += 4;
    else if (game.margin <= 2) score += 3;
    else if (game.margin <= 4) score += 1;
  }

  if (watchReasons.includes("comeback") && game.lateAction) score += 2;

  if (watchReasons.includes("offense") && game.totalRuns >= 8) score += 2;

  if (watchReasons.includes("pitching") && game.strongPitching) score += 2;

  if (game.backAndForth) score += 1;

  if (
    (game.bigPeriodSwing ?? 0) >= 3 &&
    !watchReasons.includes("offense")
  ) {
    score -= 1;
  }

  return score;
}

function computeFeedbackAdjustment(
  gameId: string,
  prefs: Prefs
): number {
  let adjustment = 0;
  for (const entry of prefs.feedbackHistory) {
    if (entry.gameId === gameId) continue; // skip self
    const givenIdx = VERDICT_ORDER.indexOf(entry.verdictGiven);
    const ratedIdx = VERDICT_ORDER.indexOf(entry.userRating);
    if (givenIdx === -1 || ratedIdx === -1) continue;
    adjustment += (givenIdx - ratedIdx) * 0.4;
  }
  return adjustment;
}

function scoreToKey(score: number): VerdictKey {
  if (score >= 7) return "pitch_by_pitch";
  if (score >= 5) return "fast_forward";
  if (score >= 3) return "condensed";
  if (score >= 1) return "highlights";
  return "skip";
}

function buildBeats(game: GameData, prefs: Prefs): string[] {
  const beats: string[] = [];
  const { watchReasons, spoilerTolerance } = prefs;
  const periodWord = PERIOD_LABEL[game.sport];

  if (game.bigPeriod != null) {
    beats.push(`Biggest swing came in the ${ordinal(game.bigPeriod)} ${periodWord}`);
  }

  if (
    watchReasons.includes("pitching") &&
    game.strongPitching &&
    game.sport === "mlb"
  ) {
    if (spoilerTolerance === "players" && game.startingPitcher) {
      beats.push(`${game.startingPitcher} had a strong outing`);
    } else {
      beats.push("Good performance from the starting pitcher");
    }
  }

  if (watchReasons.includes("close") && game.margin <= 2) {
    beats.push("Game stayed tight throughout");
  }

  if (watchReasons.includes("comeback") && game.lateAction) {
    beats.push(`Late ${periodWord}s had some life`);
  }

  if (watchReasons.includes("offense") && game.totalRuns >= 8) {
    beats.push("Plenty of offense on both sides");
  }

  if (beats.length <= 1) {
    beats.push("Not much matched your watchlist");
  }

  return beats;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

export function computeVerdict(game: GameData, prefs: Prefs): VerdictResult {
  if (game.status === "inprogress") {
    return {
      key: "live",
      label: VERDICT_META.live.label,
      emoji: VERDICT_META.live.emoji,
      score: 0,
      beats: [],
    };
  }

  if (game.status === "scheduled") {
    return {
      key: "skip",
      label: "Not yet played",
      emoji: "🕐",
      score: 0,
      beats: ["Game hasn't started yet"],
    };
  }

  let score = computeRawScore(game, prefs);
  score += computeFeedbackAdjustment(game.id, prefs);

  // Team bias override
  if (
    prefs.teamBias === "favorite_win_only" &&
    game.favoriteTeamPlaying &&
    game.favoriteTeamWon === false
  ) {
    return {
      key: "skip",
      label: VERDICT_META.skip.label,
      emoji: VERDICT_META.skip.emoji,
      score,
      beats: ["Your team lost"],
    };
  }

  const key = scoreToKey(score);
  const meta = VERDICT_META[key];
  const beats = buildBeats(game, prefs);

  return {
    key,
    label: meta.label,
    emoji: meta.emoji,
    score,
    beats,
  };
}
