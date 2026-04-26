import type { GameData, Prefs, VerdictResult } from "../types";
import { DramaOMeter } from "./DramaOMeter";
import { FeedbackPrompt } from "./FeedbackPrompt";
import { StoryBeats } from "./StoryBeats";
import { addFeedback, hasRatedGame } from "../lib/prefs";
import type { VerdictKey } from "../types";

interface Props {
  game: GameData;
  verdict: VerdictResult;
  prefs: Prefs;
  onPrefsChange: (prefs: Prefs) => void;
  onBack: () => void;
}

export function VerdictCard({ game, verdict, prefs, onPrefsChange, onBack }: Props) {
  const isLive = game.status === "inprogress";
  const isFinal = game.status === "final";
  const alreadyRated = hasRatedGame(prefs, game.id);

  const handleFeedback = (rating: VerdictKey, note?: string) => {
    const updated = addFeedback(prefs, {
      gameId: game.id,
      verdictGiven: verdict.key,
      userRating: rating,
      note,
    });
    onPrefsChange(updated);
  };

  return (
    <div className="verdict-card">
      <button className="verdict-card__back" onClick={onBack}>
        ← Back
      </button>

      <div className="verdict-card__matchup">
        <span className="verdict-card__team">{game.awayTeam}</span>
        <span className="verdict-card__at">@</span>
        <span className="verdict-card__team">{game.homeTeam}</span>
      </div>

      {isLive && (
        <div className="verdict-card__live-badge">🔴 LIVE</div>
      )}

      <div className={`verdict-card__verdict verdict-card__verdict--${verdict.key}`}>
        <span className="verdict-card__emoji">{verdict.emoji}</span>
        <span className="verdict-card__label">{verdict.label}</span>
      </div>

      {!isLive && <StoryBeats beats={verdict.beats} />}

      {!isLive && game.periods.length > 0 && (
        <DramaOMeter periods={game.periods} />
      )}

      {isFinal && !alreadyRated && (
        <FeedbackPrompt
          gameId={game.id}
          verdictGiven={verdict.key}
          onSubmit={handleFeedback}
        />
      )}
    </div>
  );
}
