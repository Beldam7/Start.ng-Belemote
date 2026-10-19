import { useEffect, useState } from "react";
import { FavoriteButton } from "./Favorites";
import { User } from "./api";
import { Game, isInAppGame } from "./games";
import { PAGES, setSeo } from "./seo";

// start.ng/games/<name>: a game's own page on start.ng, shown before the game itself. Search engines
// and shared links land here (the API serves this address with the text already in it, see
// startng-be app/routers/pages.py), and Play goes on to the game's address.
export default function GamePage({ name, game, loading, user, favorite, onPlay, onLeaderboard, onSignIn }: {
  name: string;
  game: Game | undefined;
  loading: boolean;
  user: User | null;
  favorite: { on: boolean; toggle: () => void };
  onPlay: (e: React.MouseEvent, g: Game) => void;
  onLeaderboard: (g: Game) => void;
  onSignIn: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const found = !!game;

  useEffect(() => {
    if (game) {
      setSeo({
        title: `${game.title} · Play free on start.ng`,
        description: game.description ?? `Play ${game.title} free in your browser on start.ng, a game by ${game.by}.`,
        path: `/games/${game.slug}`,
      });
    } else if (!loading) {
      setSeo(PAGES.notFound);
    }
  }, [game, loading]);

  if (!found) {
    return (
      <section className="container game-page">
        <a className="back" href="/games">← All games</a>
        {loading ? (
          <div className="game-page-grid" aria-busy="true">
            <div className="art skeleton" />
            <div className="game-page-body">
              <span className="skeleton line title big" />
              <span className="skeleton line host" />
              <span className="skeleton line by" />
            </div>
          </div>
        ) : (
          <p className="empty">There's no game called “{name}” on start.ng. <a href="/games">Browse all games</a></p>
        )}
      </section>
    );
  }

  const g = game;
  const pageUrl = `${location.origin}/games/${g.slug}`;
  const description = g.description ?? `Play ${g.title} free in your browser, right here on start.ng. A game by ${g.by}.`;
  const tweet = `https://twitter.com/intent/tweet?${new URLSearchParams({ text: `Come play ${g.title} on start.ng!`, url: pageUrl })}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* no clipboard (older browsers): the address bar has the link */ }
  }

  return (
    <section className="container game-page">
      <a className="back" href="/games">← All games</a>
      <div className="game-page-grid">
        <div className="art" style={{ background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]})` }}>
          {g.cover ? <img src={g.cover} alt={`${g.title} cover`} decoding="async" /> : <span>{g.title.charAt(0)}</span>}
        </div>
        <div className="game-page-body">
          <h1>{g.title}</h1>
          <p className="game-page-by">by {g.by} · <code>{g.host}</code></p>
          <p className="game-page-description">{description}</p>
          <div className="game-page-actions">
            <a className="btn" href={g.url} {...(isInAppGame(g) ? {} : { target: "_blank", rel: "noreferrer" })} onClick={(e) => onPlay(e, g)}>
              {isInAppGame(g) ? "Play" : "Play ↗"}
            </a>
            {g.board && <button type="button" className="ghost" onClick={() => onLeaderboard(g)}>Leaderboard</button>}
            <FavoriteButton user={user} on={favorite.on} name={g.title} onToggle={favorite.toggle} onSignIn={onSignIn} />
          </div>
          <div className="game-page-share">
            <span>Share it</span>
            <a className="ghost btn" href={tweet} target="_blank" rel="noreferrer">Share on X</a>
            <button type="button" className="ghost" onClick={copy}>{copied ? "Link copied" : "Copy link"}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
