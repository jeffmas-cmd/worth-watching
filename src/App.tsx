import { useCallback, useEffect, useRef, useState } from "react";
import type { GameData, Prefs } from "./types";
import { fetchAllGames } from "./lib/espn";
import { computeVerdict } from "./lib/verdict";
import { loadPrefs, savePrefs } from "./lib/prefs";
import { GamePicker } from "./components/GamePicker";
import { VerdictCard } from "./components/VerdictCard";
import { PrefsPanel } from "./components/PrefsPanel";
import "./App.css";

export default function App() {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [showPrefs, setShowPrefs] = useState(false);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadGames = useCallback(async (currentPrefs: Prefs) => {
    try {
      const data = await fetchAllGames(currentPrefs);
      setGames(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGames(prefs);

    refreshRef.current = setInterval(() => {
      setGames((prev) => {
        const hasLive = prev.some((g) => g.status === "inprogress");
        if (hasLive) loadGames(prefs);
        return prev;
      });
    }, 60_000);

    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [prefs, loadGames]);

  // When a live game goes final, update the selected game
  useEffect(() => {
    if (selectedGame?.status === "inprogress") {
      const updated = games.find((g) => g.id === selectedGame.id);
      if (updated?.status === "final") setSelectedGame(updated);
    }
  }, [games, selectedGame]);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      prefs.darkMode ? "dark" : "light"
    );
  }, [prefs.darkMode]);

  const handlePrefsChange = (updated: Prefs) => {
    setPrefs(updated);
    savePrefs(updated);
  };

  if (selectedGame) {
    const verdict = computeVerdict(selectedGame, prefs);
    return (
      <VerdictCard
        game={selectedGame}
        verdict={verdict}
        prefs={prefs}
        onPrefsChange={handlePrefsChange}
        onBack={() => setSelectedGame(null)}
      />
    );
  }

  return (
    <>
      <div className="app-header">
        <button
          className="prefs-button"
          onClick={() => setShowPrefs((v) => !v)}
          aria-label="Preferences"
        >
          ⚙️
        </button>
      </div>

      {showPrefs ? (
        <PrefsPanel
          prefs={prefs}
          onChange={handlePrefsChange}
          onClose={() => setShowPrefs(false)}
        />
      ) : (
        <GamePicker
          games={games}
          prefs={prefs}
          loading={loading}
          error={error}
          onSelectGame={setSelectedGame}
        />
      )}
    </>
  );
}
