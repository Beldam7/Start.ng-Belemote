import { useCallback, useEffect, useState } from "react";
import type { AdminTabProps } from "../registry";
import { addFeatured, adminFeatured, moveFeatured, removeFeatured, type AdminFeatured, type AdminGame } from "./api";

// start.ng/admin#featured: choose the games on the homepage's Featured and Staff picks shelves.

export default function FeaturedTab(_: AdminTabProps) {
  const [data, setData] = useState<AdminFeatured | null>(null);
  const [error, setError] = useState("");
  const [pick, setPick] = useState({ featured: "", staff: "" });

  const reload = useCallback(() => adminFeatured().then(setData).catch((e) => setError(e.message)), []);
  useEffect(() => { reload(); }, [reload]);

  async function run(job: () => Promise<void>) {
    setError("");
    try { await job(); await reload(); } catch (e) { setError(e instanceof Error ? e.message : "That didn't work"); }
  }

  function shelf(key: "featured" | "staff", title: string, hint: string) {
    const rows: AdminGame[] = data?.[key] ?? [];
    return (
      <div className="featured-shelf">
        <h3>{title}</h3>
        <p className="note">{hint}</p>
        {rows.length === 0 && <p className="empty">None yet.</p>}
        <div className="admin-list">
          {rows.map((g, i) => (
            <article key={g.game} className="admin-item">
              <div className="admin-item-head">
                <div className="admin-item-title"><h3>{g.title}</h3></div>
                <div className="newsletter-actions">
                  <button type="button" className="ghost" disabled={i === 0} onClick={() => run(() => moveFeatured(key, g.game, "up"))} aria-label={`Move ${g.title} up`}>↑</button>
                  <button type="button" className="ghost" disabled={i === rows.length - 1} onClick={() => run(() => moveFeatured(key, g.game, "down"))} aria-label={`Move ${g.title} down`}>↓</button>
                  <button type="button" className="ghost" onClick={() => run(() => removeFeatured(key, g.game))}>Remove</button>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="newsletter-actions">
          <select value={pick[key]} onChange={(e) => setPick({ ...pick, [key]: e.target.value })} aria-label={`Add to ${title}`}>
            <option value="">Add a game...</option>
            {(data?.candidates ?? []).filter((g) => !rows.some((r) => r.game === g.game)).map((g) => (
              <option key={g.game} value={g.game}>{g.title}{key === "featured" && !g.eligible ? ` (needs: ${g.missing.length})` : ""}</option>
            ))}
          </select>
          <button type="button" disabled={!pick[key]} onClick={() => run(async () => { await addFeatured(key, pick[key]); setPick({ ...pick, [key]: "" }); })}>Add</button>
        </div>
      </div>
    );
  }

  return (
    <section>
      <div className="dup-head"><div><h2>Featured</h2><p className="note">What the homepage puts first.</p></div></div>
      {error && <p className="error" role="alert">{error}</p>}
      {shelf("featured", "Featured", "Only games that pass every check can be featured (cover, description, standards, loads, leaderboard, phone-friendly).")}
      {shelf("staff", "Staff picks", "Any live game. No checklist.")}
    </section>
  );
}
