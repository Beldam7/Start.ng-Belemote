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
      <section className="container game-tags" aria-label="More about this game">
        <p className="eyebrow">More about this game</p>
        {failed === id
          ? <p className="tags-state" role="status">These links didn't load. <button type="button" className="link" onClick={() => setAttempt((n) => n + 1)}>Try again</button></p>
          : <p className="tags-state" role="status" aria-busy="true">Loading pages…</p>}
      </section>
    );
  }
  if (pages.length === 0) return null;
  return (
    <section className="container game-tags" aria-label="More about this game">
      <p className="eyebrow">More about this game</p>
      <ul>{pages.map((p) => <li key={p.kind}><a href={p.path}>{p.label}</a></li>)}</ul>
    </section>
  );
}
