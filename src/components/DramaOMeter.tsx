import type { PeriodScore } from "../types";

interface Props {
  periods: PeriodScore[];
}

export function DramaOMeter({ periods }: Props) {
  if (periods.length === 0) return null;

  const max = Math.max(...periods.map((p) => p.combined), 1);

  return (
    <div className="drama-meter">
      <h3 className="drama-meter__title">Drama-o-Meter</h3>
      <div className="drama-meter__bars">
        {periods.map((p) => {
          const height = p.combined === 0 ? 4 : Math.round((p.combined / max) * 100);
          return (
            <div key={p.period} className="drama-meter__bar-wrap">
              <div
                className={`drama-meter__bar ${p.combined === 0 ? "drama-meter__bar--empty" : ""}`}
                style={{ height: `${height}%` }}
                title={`${p.label}: ${p.combined} combined`}
              />
              <span className="drama-meter__label">{p.period}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
