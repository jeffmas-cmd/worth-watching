import { useState } from "react";
import type { VerdictKey } from "../types";
import { VERDICT_ORDER, VERDICT_META } from "../types";

interface Props {
  gameId: string;
  verdictGiven: VerdictKey;
  onSubmit: (rating: VerdictKey, note?: string) => void;
}

export function FeedbackPrompt({ verdictGiven, onSubmit }: Props) {
  const [selected, setSelected] = useState<VerdictKey | null>(null);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return <p className="feedback__thanks">Thanks for the feedback!</p>;
  }

  return (
    <div className="feedback">
      <p className="feedback__question">Was this rating right?</p>
      <div className="feedback__options">
        {VERDICT_ORDER.map((key) => {
          const meta = VERDICT_META[key];
          return (
            <button
              key={key}
              className={`feedback__option ${selected === key ? "feedback__option--selected" : ""} ${verdictGiven === key ? "feedback__option--given" : ""}`}
              onClick={() => setSelected(key)}
            >
              {meta.emoji} {meta.label}
            </button>
          );
        })}
      </div>
      {selected && (
        <>
          <input
            className="feedback__note"
            placeholder="Optional note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            className="feedback__submit"
            onClick={() => {
              onSubmit(selected, note || undefined);
              setSubmitted(true);
            }}
          >
            Submit
          </button>
        </>
      )}
    </div>
  );
}
