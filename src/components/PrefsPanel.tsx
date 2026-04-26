import type { Prefs, Sport, WatchReason } from "../types";
import { NY_TEAMS } from "../types";
import { savePrefs } from "../lib/prefs";

interface Props {
  prefs: Prefs;
  onChange: (prefs: Prefs) => void;
  onClose: () => void;
}

const WATCH_REASONS: { key: WatchReason; label: string }[] = [
  { key: "close", label: "Close games" },
  { key: "comeback", label: "Late comebacks" },
  { key: "offense", label: "High scoring" },
  { key: "pitching", label: "Strong pitching (MLB)" },
];

const SPORTS: Sport[] = ["mlb", "nfl", "nba", "nhl"];

export function PrefsPanel({ prefs, onChange, onClose }: Props) {
  const update = (patch: Partial<Prefs>) => {
    const updated = { ...prefs, ...patch };
    savePrefs(updated);
    onChange(updated);
  };

  const toggleReason = (reason: WatchReason) => {
    const has = prefs.watchReasons.includes(reason);
    update({
      watchReasons: has
        ? prefs.watchReasons.filter((r) => r !== reason)
        : [...prefs.watchReasons, reason],
    });
  };

  const setFavTeam = (sport: Sport, abbrev: string) => {
    update({ favoriteTeams: { ...prefs.favoriteTeams, [sport]: abbrev } });
  };

  return (
    <div className="prefs-panel">
      <div className="prefs-panel__header">
        <h2>Preferences</h2>
        <button onClick={onClose}>✕</button>
      </div>

      <section className="prefs-section">
        <h3>Favorite Teams</h3>
        {SPORTS.map((sport) => (
          <div key={sport} className="prefs-row">
            <label>{sport.toUpperCase()}</label>
            <select
              value={prefs.favoriteTeams[sport]}
              onChange={(e) => setFavTeam(sport, e.target.value)}
            >
              {NY_TEAMS[sport].map((t) => (
                <option key={t.abbrev} value={t.abbrev}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </section>

      <section className="prefs-section">
        <h3>I watch for...</h3>
        {WATCH_REASONS.map(({ key, label }) => (
          <label key={key} className="prefs-checkbox">
            <input
              type="checkbox"
              checked={prefs.watchReasons.includes(key)}
              onChange={() => toggleReason(key)}
            />
            {label}
          </label>
        ))}
      </section>

      <section className="prefs-section">
        <h3>Spoiler Tolerance</h3>
        {(["vibes", "story", "players"] as const).map((level) => (
          <label key={level} className="prefs-radio">
            <input
              type="radio"
              name="spoilerTolerance"
              value={level}
              checked={prefs.spoilerTolerance === level}
              onChange={() => update({ spoilerTolerance: level })}
            />
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </label>
        ))}
      </section>

      <section className="prefs-section">
        <h3>Appearance</h3>
        <label className="prefs-checkbox">
          <input
            type="checkbox"
            checked={prefs.darkMode}
            onChange={() => update({ darkMode: !prefs.darkMode })}
          />
          Dark mode
        </label>
      </section>

      <section className="prefs-section">
        <h3>Team Bias</h3>
        <label className="prefs-radio">
          <input
            type="radio"
            name="teamBias"
            value="any"
            checked={prefs.teamBias === "any"}
            onChange={() => update({ teamBias: "any" })}
          />
          Any good game
        </label>
        <label className="prefs-radio">
          <input
            type="radio"
            name="teamBias"
            value="favorite_win_only"
            checked={prefs.teamBias === "favorite_win_only"}
            onChange={() => update({ teamBias: "favorite_win_only" })}
          />
          Only if my team won
        </label>
      </section>
    </div>
  );
}
