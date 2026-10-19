import { useEffect, useState } from "react";
import { BoardStat, getLeaderboard, LeaderboardEntry } from "./api";
import { Game } from "./games";

const show = (stat: BoardStat, v: number | null | undefined) => {
  if (v === null || v === undefined) return "–";
  if (stat.format === "time") return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`;
  return v.toLocaleString();
};

/** A game's shared leaderboard table: the top players' best scores, saved in start.ng's database.
 *  Used in the leaderboard popup and on the game's own page. */
export default function BoardTable({ game, playerId }: { game: Game; playerId: number | null }) {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState("");
  // The game's own columns (startng.json); first one ranks, the rest break ties.
  const stats = game.board ?? [{ key: "score", label: "Score", order: "highest" as const, format: "number" as const }];
  const cols = `28px minmax(0, 1fr) ${stats.map(() => "auto").join(" ")}`;

  useEffect(() => {
    getLeaderboard(game.slug, 10)
      .then(setEntries)
      .catch(() => setError("Couldn't load the leaderboard. Try again in a moment."));
  }, [game.slug]);

  return (
    <>
      {error && <p className="error">{error}</p>}
      {!error && entries === null && <p className="board-sub">Loading…</p>}
      {entries?.length === 0 && <p className="board-empty">No scores yet. Play it and be the first.</p>}
      {entries && entries.length > 0 && (
        <div className="board-table" role="table" aria-label={`${game.title} leaderboard`}>
          <div className="board-row board-head" role="row" style={{ gridTemplateColumns: cols }}>
            <span role="columnheader">#</span>
            <span role="columnheader">Player</span>
            {stats.map((s) => <span key={s.key} role="columnheader" className="num">{s.label}</span>)}
          </div>
          {entries.map((e) => (
            <div key={e.player_id} role="row" className={`board-row ${e.player_id === playerId ? "me" : ""}`} style={{ gridTemplateColumns: cols }}>
              <span className="rk">{e.rank}</span>
              <span className="nm">
                <span className="dot" style={{ background: e.color ?? "var(--line)" }} />
                {e.name}{e.player_id === playerId && <em> (you)</em>}
              </span>
              {stats.map((s) => <span key={s.key} className="num sc">{show(s, e.stats?.[s.key] ?? (s.key === "score" ? e.score : null))}</span>)}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
