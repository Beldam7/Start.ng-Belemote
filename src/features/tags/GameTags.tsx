import { useEffect, useState } from "react";
import type { PagePartProps } from "../registry";
import { getGameTags } from "./api";

type Loaded = { game: string; tags: { slug: string; label: string }[] };

/** The game page part (registerPagePart, page "game"): this game's categories, as links to their pages. */
export default function GameTags({ game }: PagePartProps) {
  const [loaded, setLoaded] = useState<Loaded | null>(null); // tied to the game it was fetched for
  const [failed, setFailed] = useState<string | null>(null); // the game whose request failed
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!game) return;
    let live = true;
    setFailed(null);
    getGameTags(game).then((t) => live && setLoaded({ game, tags: t })).catch(() => live && setFailed(game));
    return () => { live = false; };
  }, [game, attempt]);
  if (game && failed === game) {
    return (
      <section className="container game-tags" aria-label="Categories">
        <p className="eyebrow">Categories</p>
        <p className="tags-state" role="status">The categories didn't load. <button type="button" className="link" onClick={() => setAttempt((n) => n + 1)}>Try again</button></p>
      </section>
    );
  }
  const tags = loaded && loaded.game === game ? loaded.tags : [];
  if (tags.length === 0) return null;
  return (
    <section className="container game-tags" aria-label="Categories">
      <p className="eyebrow">Categories</p>
      <ul>{tags.map((t) => <li key={t.slug}><a href={`/categories/${t.slug}`}>{t.label}</a></li>)}</ul>
    </section>
  );
}
