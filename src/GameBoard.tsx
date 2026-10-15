import { useEffect, useState } from "react";
import { getLeaderboard, LeaderboardEntry } from "./api";
import { Game } from "./games";

type Props = { game: Game; playerId: number | null; onClose: () => void };

/** A game's shared leaderboard: the top players' best scores, saved in start.ng's database. */
export default function GameBoard({ game, playerId, onClose }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getLeaderboard(game.slug, 10)
      .then(setEntries)
      .catch(() => setError("Couldn't load the leaderboard. Try again in a moment."));
  }, [game.slug]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="card board" role="dialog" aria-modal="true" aria-labelledby="board-title" onClick={(e) => e.stopPropagation()}>
        <div className="card-head">
          <h3 id="board-title">{game.title}</h3>
          <button type="button" className="link close" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <p className="board-sub">Top players on start.ng</p>

        {error && <p className="error">{error}</p>}
        {!error && entries === null && <p className="board-sub">Loading…</p>}
        {entries?.length === 0 && <p className="board-empty">No scores yet. Play it and be the first.</p>}
        {entries && entries.length > 0 && (
          <ol className="board-list">
            {entries.map((e) => (
              <li key={e.player_id} className={e.player_id === playerId ? "me" : ""}>
                <span className="rk">{e.rank}</span>
                <span className="dot" style={{ background: e.color ?? "var(--line)" }} />
                <span className="nm">{e.name}{e.player_id === playerId && <em> (you)</em>}</span>
                <span className="sc">{e.score.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        )}

        <a className="btn board-play" href={game.url} target="_blank" rel="noreferrer">Play {game.title} ↗</a>
      </div>
    </div>
  );
}
