import { useCallback, useEffect, useState } from "react";
import type { AdminTabProps } from "../registry";
import { adminSpotlight, clearPick, pickGame, type AdminSpotlight } from "./api";

// start.ng/admin#spotlight: choose the Game of the Week (this week's or a later week's), and see today's daily challenge.

const mondayOf = (offsetWeeks: number) => {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offsetWeeks * 7);
  return d.toISOString().slice(0, 10);
};

export default function SpotlightTab(_: AdminTabProps) {
  const [data, setData] = useState<AdminSpotlight | null>(null);
  const [game, setGame] = useState("");
  const [note, setNote] = useState("");
  const [week, setWeek] = useState(0); // 0 this week, 1 next
  const [error, setError] = useState("");

  const reload = useCallback(() => adminSpotlight().then(setData).catch((e) => setError(e.message)), []);
  useEffect(() => { reload(); }, [reload]);

  async function save() {
    setError("");
    try { await pickGame(game, note, mondayOf(week)); setGame(""); setNote(""); await reload(); } catch (e) { setError(e instanceof Error ? e.message : "That didn't work"); }
  }
  async function clear(w: string) {
    setError("");
    try { await clearPick(w); await reload(); } catch (e) { setError(e instanceof Error ? e.message : "That didn't work"); }
  }

  const c = data?.challenge;
  return (
    <section>
      <div className="dup-head"><div><h2>Spotlight</h2><p className="note">The Game of the Week, and today's daily challenge.</p></div></div>
      {error && <p className="error" role="alert">{error}</p>}

      <h3>Game of the Week</h3>
      {data?.picks.length === 0 && <p className="empty">No pick booked.</p>}
      <div className="admin-list">
        {data?.picks.map((p) => (
          <article key={p.week_start} className="admin-item">
            <div className="admin-item-head">
              <div className="admin-item-title">
                <h3>{p.title}</h3>
                <p className="note">Week of {p.week_start} · picked by {p.picked_by}{p.note ? ` · ${p.note}` : ""}</p>
              </div>
              <button type="button" className="ghost" onClick={() => clear(p.week_start)}>Remove</button>
            </div>
          </article>
        ))}
      </div>
      <div className="newsletter-form">
        <label>
          Game
          <select value={game} onChange={(e) => setGame(e.target.value)}>
            <option value="">Choose a game...</option>
            {data?.games.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
        <label>
          Week
          <select value={week} onChange={(e) => setWeek(Number(e.target.value))}>
            <option value={0}>This week</option>
            <option value={1}>Next week</option>
            <option value={2}>In two weeks</option>
          </select>
        </label>
        <label>Why it's the pick (optional)<input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="A one-line reason" /></label>
        <div className="newsletter-actions"><button type="button" disabled={!game} onClick={save}>Set the pick</button></div>
        <p className="note">Picking again for the same week replaces it.</p>
      </div>

      <h3>Today's daily challenge</h3>
      {c ? <p>{c.goal_is_a_ceiling ? `Finish ${c.game_title} in ${c.goal_shown} or less` : `Reach ${c.goal_shown} in ${c.game_title}`}. It is made by the system from recent runs and can't be edited.</p>
         : <p className="empty">None today: no game has enough recent plays yet.</p>}
    </section>
  );
}
