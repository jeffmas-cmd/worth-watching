import type { GameData, Prefs, Sport } from "../types";
import { NY_TEAMS } from "../types";
import { getSportLabel } from "../lib/prefs";
import { toESPNDate } from "../lib/espn";

interface Props {
  games: GameData[];
  prefs: Prefs;
  loading: boolean;
  error: string | null;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
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

function getPast7Days(): Date[] {
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function formatDayLabel(date: Date, todayStr: string): string {
  const ds = toESPNDate(date);
  if (ds === todayStr) return "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (ds === toESPNDate(yesterday)) return "Yesterday";
  return date.toLocaleDateString([], { weekday: "short", month: "numeric", day: "numeric" });
}

export function GamePicker({ games, prefs, loading, error, selectedDate, onSelectDate, onSelectGame }: Props) {
  const sports: Sport[] = ["mlb", "nfl", "nba", "nhl"];
  const todayStr = toESPNDate(new Date());
  const selectedStr = toESPNDate(selectedDate);
  const days = getPast7Days();

  const gamesBySport = sports.reduce<Record<Sport, GameData[]>>(
    (acc, sport) => {
      acc[sport] = games.filter((g) => g.sport === sport);
      return acc;
    },
    { mlb: [], nfl: [], nba: [], nhl: [] }
  );

  return (
    <div className="game-picker">
      <h1 className="game-picker__title">Worth Watching?</h1>

      <div className="date-strip">
        {days.map((day) => {
          const ds = toESPNDate(day);
          const isSelected = ds === selectedStr;
          return (
            <button
              key={ds}
              className={`date-chip ${isSelected ? "date-chip--selected" : ""}`}
              onClick={() => onSelectDate(new Date(day))}
            >
              {formatDayLabel(day, todayStr)}
            </button>
          );
        })}
      </div>

      {loading && <div className="loading">Loading games...</div>}

      {!loading && error && (
        <div className="error">Failed to load games: {error}</div>
      )}

      {!loading && !error && games.length === 0 && (
        <p className="game-picker__empty">No NY games on this date.</p>
      )}

      {!loading && !error && sports.map((sport) => {
        const sportGames = gamesBySport[sport];
        if (sportGames.length === 0) return null;

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
                    {game.status === "scheduled" ? formatTime(game.date) : ""}
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
