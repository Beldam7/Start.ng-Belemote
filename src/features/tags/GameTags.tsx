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
    setLoaded(null);
    setFailed(null);
    getGameTags(game).then((t) => live && setLoaded({ game, tags: t })).catch(() => live && setFailed(game));
    return () => { live = false; };
  }, [game, attempt]);
  if (!game) return null;
  const tags = loaded && loaded.game === game ? loaded.tags : null;
  if (failed === game || tags === null) {
    return (
      <div className="game-page-share" role="group" aria-label="Categories">
        <span>Categories</span>
        {failed === game
          ? <span className="tags-state" role="status">The categories didn't load. <button type="button" className="link" onClick={() => setAttempt((n) => n + 1)}>Try again</button></span>
          : <span className="tags-state" role="status" aria-busy="true">Loading categories…</span>}
      </div>
    );
  }
  if (tags.length === 0) return null;
  return (
    <div className="game-page-share" role="group" aria-label="Categories">
      <span>Categories</span>
      {tags.map((t) => <a key={t.slug} className="ghost btn" href={`/categories/${t.slug}`}>{t.label}</a>)}
    </div>
  );
}
