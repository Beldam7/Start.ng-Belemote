import { useEffect, useState } from "react";
import { analytics } from "./analytics";
import { FavoriteButton, indieKey, useFavorites } from "./Favorites";
import { getIndieGame, IndieGame, indieCoverUrl, removeIndieGame, trackIndiePlay, User } from "./api";
import { hostOf, indiePath } from "./indie";
import { PAGES, setSeo } from "./seo";

// start.ng/creators/<id>-<name>: the page of a game by an independent creator, which is hosted outside
// start.ng. Search engines and shared links land here (the API serves this address with the text
// already in it, see startng-be app/routers/pages.py); Play opens the creator's own link in a new tab.
export default function IndiePage({ id, user, onSignIn }: { id: number; user: User | null; onSignIn: () => void }) {
  const [game, setGame] = useState<IndieGame | null | undefined>(undefined); // undefined: loading, null: no such game
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState(false);
  const [copied, setCopied] = useState(false);
  const favs = useFavorites(user);

  useEffect(() => {
    getIndieGame(localStorage.getItem("token"), id)
      .then((g) => {
        setGame(g);
        // Old or hand-typed names in the address: show the proper one.
        if (g && location.pathname.replace(/\/$/, "") !== indiePath(g)) history.replaceState(null, "", indiePath(g) + location.search);
      })
      .catch(() => { setGame(null); setError("Couldn't load this game. Try again in a moment."); });
  }, [id, user?.id]);

  useEffect(() => {
    if (game) {
      setSeo({ title: `${game.name} · Play free on start.ng`, description: game.description, path: indiePath(game) });
    } else if (game === null) {
      setSeo(PAGES.notFound);
    }
  }, [game]);

  if (!game) {
    return (
      <section className="container game-page">
        <a className="back" href="/creators">← Independent creators</a>
        {game === undefined ? (
          <div className="game-page-grid" aria-busy="true">
            <div className="art skeleton" />
            <div className="game-page-body">
              <span className="skeleton line title big" />
              <span className="skeleton line host" />
              <span className="skeleton line by" />
            </div>
          </div>
        ) : (
          <p className="empty">{error || "There's no game at this address."} <a href="/creators">Browse games by independent creators</a></p>
        )}
      </section>
    );
  }

  const g = game;
  const pageUrl = `${location.origin}${indiePath(g)}`;
  const tweet = `https://twitter.com/intent/tweet?${new URLSearchParams({ text: `Come play ${g.name} on start.ng!`, url: pageUrl })}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      analytics.share("indie_game", String(g.id), "copy_link");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* no clipboard (older browsers): the address bar has the link */ }
  }

  async function remove() {
    if (!confirm(`Remove ${g.name} from start.ng?`)) return;
    setRemoving(true);
    try {
      await removeIndieGame(localStorage.getItem("token"), g.id);
      location.assign("/creators");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove it");
      setRemoving(false);
    }
  }

  return (
    <section className="container game-page">
      <a className="back" href="/creators">← Independent creators</a>
      <div className="game-page-grid">
        <div className="art">
          <img src={indieCoverUrl(g)} alt={`${g.name} cover`} decoding="async" />
        </div>
        <div className="game-page-body">
          <span className="tag indie-tag">Independent creator</span>
          <h1>{g.name}</h1>
          <p className="game-page-by">by {g.by} · <code>{hostOf(g.url)}</code></p>
          <p className="game-page-description">{g.description}</p>
          <p className="note">Hosted by the creator, outside start.ng. It opens in a new tab.</p>
          {error && <p className="error">{error}</p>}
          <div className="game-page-actions">
            <a className="btn" href={g.url} target="_blank" rel="noopener noreferrer" onClick={() => trackIndiePlay(g.id)}>Play ↗</a>
            <FavoriteButton user={user} on={favs.has(indieKey(g))} name={g.name} onToggle={() => favs.toggle(indieKey(g))} onSignIn={onSignIn} />
            {g.mine && <button type="button" className="link" disabled={removing} onClick={remove}>{removing ? "Removing…" : "Remove my game"}</button>}
          </div>
          <div className="game-page-share">
            <span>Share it</span>
            <a className="ghost btn" href={tweet} target="_blank" rel="noreferrer" onClick={() => analytics.share("indie_game", String(g.id), "x")}>Share on X</a>
            <button type="button" className="ghost" onClick={copy}>{copied ? "Link copied" : "Copy link"}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
