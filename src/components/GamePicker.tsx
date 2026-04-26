import type { GameData, Prefs, Sport } from "../types";
import { NY_TEAMS } from "../types";
import { getSportLabel } from "../lib/prefs";

interface Props {
  games: GameData[];
  prefs: Prefs;
  loading: boolean;
  error: string | null;
  onSelectGame: (game: GameData) => void;
}

function statusBadge(status: GameData["status"]) {
  if (status === "inprogress") return <span className="badge badge--live">🔴 Live</span>;
  if (status === "final") return <span className="badge badge--final">Final</span>;
  return <span className="badge badge--upcoming">Upcoming</span>;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function GamePicker({ games, prefs, loading, error, onSelectGame }: Props) {
  const sports: Sport[] = ["mlb", "nfl", "nba", "nhl"];

  const gamesBySport = sports.reduce<Record<Sport, GameData[]>>(
    (acc, sport) => {
      acc[sport] = games.filter((g) => g.sport === sport);
      return acc;
    },
    { mlb: [], nfl: [], nba: [], nhl: [] }
  );

  if (loading) {
    return <div className="loading">Loading today's games...</div>;
  }

  if (error) {
    return <div className="error">Failed to load games: {error}</div>;
  }

  const hasAnyGames = games.length > 0;

  return (
    <div className="game-picker">
      <h1 className="game-picker__title">Worth Watching?</h1>
      <p className="game-picker__subtitle">NY teams · Today</p>

      {!hasAnyGames && (
        <p className="game-picker__empty">No NY games today.</p>
      )}

      {sports.map((sport) => {
        const sportGames = gamesBySport[sport];
        if (sportGames.length === 0) return null;

        // Sort: favorite team's games first
        const favTeam = prefs.favoriteTeams[sport];
        const sorted = [...sportGames].sort((a, b) => {
          const aFav = a.favoriteTeamPlaying ? -1 : 0;
          const bFav = b.favoriteTeamPlaying ? -1 : 0;
          return aFav - bFav;
        });

        return (
          <div key={sport} className="sport-group">
            <h2 className="sport-group__header">{getSportLabel(sport)}</h2>
            {sorted.map((game) => {
              const isFav = game.favoriteTeamPlaying;
              const favTeamName = NY_TEAMS[sport].find(
                (t) => t.abbrev === favTeam
              )?.name;

              return (
                <button
                  key={game.id}
                  className={`game-row ${isFav ? "game-row--favorite" : ""}`}
                  onClick={() => onSelectGame(game)}
                >
                  <span className="game-row__matchup">
                    {game.awayAbbrev} @ {game.homeAbbrev}
                  </span>
                  <span className="game-row__time">
                    {game.status === "scheduled"
                      ? formatTime(game.date)
                      : ""}
                  </span>
                  {statusBadge(game.status)}
                  {isFav && (
                    <span className="game-row__fav-tag">⭐ {favTeamName}</span>
                  )}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
