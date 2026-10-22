import { useCallback, useEffect, useState } from "react";
import type { AdminTabProps } from "../registry";
import { adminRatings, removeRating, type AdminRating } from "./api";

// start.ng/admin#ratings: the latest ratings, and a way to take an abusive one away.

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export default function RatingsTab({ ask }: AdminTabProps) {
  const [game, setGame] = useState("");
  const [rows, setRows] = useState<AdminRating[] | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(() => {
    setError("");
    adminRatings(game.trim() || undefined).then(setRows).catch((e) => setError(e.message));
  }, [game]);
  useEffect(reload, [reload]);

  async function remove(r: AdminRating) {
    const ok = await ask({ title: "Remove this rating?", body: `${r.player}'s ${r.stars}-star rating of ${r.game}. They can rate again.`, confirm: "Remove", danger: true });
    if (ok === null) return;
    try { await removeRating(r.id); reload(); } catch (e) { setError(e instanceof Error ? e.message : "Couldn't remove it"); }
  }

  return (
    <section>
      <div className="dup-head">
        <div>
          <h2>Ratings</h2>
          <p className="note">The latest 100 ratings. Remove one that is abusive or a pile-on.</p>
        </div>
        <input value={game} onChange={(e) => setGame(e.target.value)} placeholder="Filter by game name" aria-label="Filter by game name" />
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {rows && rows.length === 0 && <p className="empty">No ratings yet.</p>}
      <div className="admin-list">
        {rows?.map((r) => (
          <article key={r.id} className="admin-item">
            <div className="admin-item-head">
              <div className="admin-item-title">
                <h3>{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)} {r.game}</h3>
                <p className="note">{r.player} · {when(r.at)}</p>
              </div>
              <button type="button" className="ghost" onClick={() => remove(r)}>Remove</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
