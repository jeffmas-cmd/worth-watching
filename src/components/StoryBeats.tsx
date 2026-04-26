interface Props {
  beats: string[];
}

export function StoryBeats({ beats }: Props) {
  if (beats.length === 0) return null;

  return (
    <ul className="story-beats">
      {beats.map((beat, i) => (
        <li key={i} className="story-beats__item">
          {beat}
        </li>
      ))}
    </ul>
  );
}
