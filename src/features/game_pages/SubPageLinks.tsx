import { useEffect, useState } from "react";
import type { SubPage } from "./api";

type Loaded = { key: string; pages: SubPage[] };

/** "More about this game": links to a game's own pages. `id` says which game (the links are tied to it, so another game's links
 *  never show), `load` fetches them, and if that fails the visitor sees why and can try again. */
export default function SubPageLinks({ id, load }: { id: string | undefined; load: (id: string) => Promise<SubPage[]> }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState<string | null>(null); // the id whose request failed
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!id) return;
    let live = true;
    setLoaded(null);
    setFailed(null);
    load(id).then((pages) => live && setLoaded({ key: id, pages })).catch(() => live && setFailed(id));
    return () => { live = false; };
  }, [id, load, attempt]);
  if (!id) return null;
  const pages = loaded && loaded.key === id ? loaded.pages : null;
  if (failed === id || pages === null) {
    return (
      <div className="game-page-share" role="group" aria-label="More about this game">
        <span>More about this game</span>
        {failed === id
          ? <span className="tags-state" role="status">These links didn't load. <button type="button" className="link" onClick={() => setAttempt((n) => n + 1)}>Try again</button></span>
          : <span className="tags-state" role="status" aria-busy="true">Loading pages…</span>}
      </div>
    );
  }
  if (pages.length === 0) return null;
  return (
    <div className="game-page-share" role="group" aria-label="More about this game">
      <span>More about this game</span>
      {pages.map((p) => <a key={p.kind} className="ghost btn" href={p.path}>{p.label}</a>)}
    </div>
  );
}
