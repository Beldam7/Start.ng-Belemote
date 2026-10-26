import { useCallback, useEffect, useState } from "react";
import { colorsFor } from "../../games";
import { getTags, type Tag, type TagsData } from "./api";

// The category cards: a picture for the category (public/category-art/<slug>.webp, made for start.ng), the colours of the game covers behind it
// until it loads, the name and how many games.
export function TagTile({ tag }: { tag: Tag }) {
  const [a, b] = colorsFor(tag.slug);
  return (
    <a className="tag-tile" href={`/categories/${tag.slug}`} style={{ background: `url(/category-art/${tag.slug}.webp) center / cover, linear-gradient(135deg, ${a}, ${b})` }}>
      <b>{tag.label}</b>
      <span>{tag.games} {tag.games === 1 ? "game" : "games"}</span>
    </a>
  );
}

/** The tags that have a page, from /tags: `data` until they arrive, `failed` if the request did not work, and `retry` to ask again. */
export function useTags(): { data: TagsData | null; failed: boolean; retry: () => void } {
  const [data, setData] = useState<TagsData | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setFailed(false);
    getTags().then((d) => live && setData(d)).catch(() => live && setFailed(true));
    return () => { live = false; };
  }, [attempt]);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { data, failed, retry };
}

// The few shown on the homepage and /games: the friendly, popular ones first. The rest are on /categories.
const PICKS = ["endless-runners", "nigerian-themed", "brainy-games", "space-and-sci-fi", "racing-and-driving", "catch-and-dodge", "ancient-ruins-and-treasure", "with-friends"];
const MIN_SHOWN = 4; // fewer than this is not worth a section

/** `nested`: it is already inside a .container (the /games page), so it adds no side padding of its own. */
export function Picks({ heading, nested = false }: { heading: string; nested?: boolean }) {
  const wrap = nested ? "tags-picks" : "container tags-picks";
  const { data, failed, retry } = useTags();
  if (failed && !data) {
    // The request did not work: say so, keep the way to all the categories, and let the visitor try again.
    return (
      <section className={wrap} aria-label={heading}>
        <div className="tags-picks-head">
          <h2>{heading}</h2>
          <a className="link" href="/categories">All categories →</a>
        </div>
        <p className="tags-state" role="status">The categories didn't load. <button type="button" className="link" onClick={retry}>Try again</button></p>
      </section>
    );
  }
  if (!data) return null;
  const all = data.groups.flatMap((g) => g.tags);
  const picks = PICKS.map((s) => all.find((t) => t.slug === s)).filter((t): t is Tag => !!t);
  if (picks.length < MIN_SHOWN) return null;
  return (
    <section className={wrap} aria-label={heading}>
      <div className="tags-picks-head">
        <h2>{heading}</h2>
        <a className="link" href="/categories">All categories →</a>
      </div>
      <div className="tag-tiles">{picks.map((t) => <TagTile key={t.slug} tag={t} />)}</div>
    </section>
  );
}
