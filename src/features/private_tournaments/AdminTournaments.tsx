import { useCallback, useEffect, useState } from "react";
import { call, listGames, send, type PublishedGame } from "../../api";
import DateField from "../../DateField";
import type { AdminTabProps } from "../registry";
import type { Summary } from "./api";
import { endsText, timeLeft } from "./time";

// F9, a section of start.ng/admin#tournaments: make a tournament to share in a group. Only people who open the link and
// register see its games and standings; it never shows anywhere on start.ng.

type AdminTournament = Summary & { link: string; game_names: string[] };
const MAX_GAMES = 5;
const t = () => localStorage.getItem("token");
const list = () => call<AdminTournament[]>(t(), "/admin/private-tournaments");
const create = (body: { title: string; games: string[]; starts_at: string; ends_at: string; max_members: number | null }) =>
  call<AdminTournament>(t(), "/admin/private-tournaments", send("POST", body));
const newLink = (code: string) => call<AdminTournament>(t(), `/admin/private-tournaments/${encodeURIComponent(code)}/new-link`, send("POST"));
const remove = (code: string) => call<void>(t(), `/admin/private-tournaments/${encodeURIComponent(code)}`, send("DELETE"));

/** "2026-10-25T18:00" in the admin's own time, on the hour (the picker offers :00, :15, :30, :45). */
const localInput = (d: Date) => {
  const h = new Date(d);
  h.setMinutes(0, 0, 0);
  return new Date(h.getTime() - h.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const title = (name: string) => name.replace(/-/g, " ");

export default function AdminTournaments({ ask }: AdminTabProps) {
  const [rows, setRows] = useState<AdminTournament[] | null>(null);
  const [games, setGames] = useState<PublishedGame[]>([]);
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [start, setStart] = useState(() => localInput(new Date(Date.now() + 60 * 60_000)));
  const [end, setEnd] = useState(() => localInput(new Date(Date.now() + 25 * 60 * 60_000)));
  const [cap, setCap] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState("");

  const reload = useCallback(() => { list().then(setRows).catch((e) => setError(e.message)); }, []);
  useEffect(reload, [reload]);
  useEffect(() => {
    listGames().then((all) => setGames(all.filter((g) => g.name !== "hangout" && g.leaderboard))).catch(() => setGames([]));
  }, []);

  const shown = games.filter((g) => title(g.name).includes(query.trim().toLowerCase()));
  const toggle = (g: string) => setPicked((p) => (p.includes(g) ? p.filter((n) => n !== g) : p.length < MAX_GAMES ? [...p, g] : p));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNote("");
    try {
      const made = await create({ title: name.trim(), games: picked, starts_at: new Date(start).toISOString(),
        ends_at: new Date(end).toISOString(), max_members: cap ? Number(cap) : null });
      setNote(`Made. Share this link: ${made.link}`);
      setName("");
      setPicked([]);
      reload();
    } catch (err) { setError(err instanceof Error ? err.message : "That didn't work"); } finally { setBusy(false); }
  }

  async function copy(link: string) {
    try { await navigator.clipboard.writeText(link); setCopied(link); setTimeout(() => setCopied(""), 2000); } catch { /* shown on the page */ }
  }

  async function act(fn: () => Promise<unknown>, done: string) {
    setError("");
    setNote("");
    try { await fn(); setNote(done); reload(); } catch (err) { setError(err instanceof Error ? err.message : "That didn't work"); }
  }

  const status = (r: AdminTournament) =>
    r.finished ? "Ended" : new Date(r.starts_at).getTime() > Date.now() ? `Starts in ${timeLeft(r.starts_at).replace(" left", "")}` : timeLeft(r.ends_at);

  return (
    <section>
      <h2>Private tournaments</h2>
      <p className="note">Make a tournament for a group: copy its link and share it there. Only people who open the link and register see the games and the standings. It never shows on start.ng's lists, search or sitemap, and its page isn't indexed.</p>
      {error && <p className="error" role="alert">{error}</p>}
      {note && <p className="ok" role="status">{note}</p>}

      <form className="private-form" onSubmit={submit}>
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} minLength={3} maxLength={60} required placeholder="e.g. HNG Game Night" />
        </label>
        <fieldset className="field private-games">
          <span>Pick up to {MAX_GAMES} games ({picked.length} picked)</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search games" aria-label="Search games" />
          <div className="private-game-list">
            {shown.map((g) => (
              <label key={g.name} className={picked.includes(g.name) ? "on" : ""}>
                <input type="checkbox" checked={picked.includes(g.name)} disabled={!picked.includes(g.name) && picked.length >= MAX_GAMES} onChange={() => toggle(g.name)} />
                <span className="thumb">{g.cover_url ? <img src={g.cover_url} alt="" loading="lazy" decoding="async" /> : g.name.charAt(0).toUpperCase()}</span>
                <span className="gname">{title(g.name)}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="admin-tournament-times">
          <div className="field"><span>Starts</span><DateField time value={start} onChange={setStart} label="Starts" required /></div>
          <div className="field"><span>Ends</span><DateField time value={end} onChange={setEnd} min={start.slice(0, 10)} label="Ends" required /></div>
          <label className="field"><span>Player limit (optional)</span><input type="number" min={2} max={5000} value={cap} onChange={(e) => setCap(e.target.value)} placeholder="200" /></label>
        </div>
        <p className="note">Times are your own time. It runs from 1 hour to 30 days. Scores count between the start and the end.</p>
        <div className="private-submit">
          <button type="submit" disabled={busy || picked.length === 0 || name.trim().length < 3}>{busy ? "Making…" : "Make the tournament"}</button>
        </div>
      </form>

      <h2>Made by admins</h2>
      {rows && rows.length === 0 && <p className="empty">None yet.</p>}
      <div className="admin-list">
        {rows?.map((r) => (
          <article key={r.code} className="admin-item">
            <div className="admin-item-head">
              <div className="admin-item-title">
                <h3><a href={`/friends/${r.code}`} target="_blank" rel="noreferrer">{r.title} ↗</a> <span className={`pill ${r.finished ? "" : "waiting"}`}>{status(r)}</span></h3>
                <p className="note">
                  {endsText(r.starts_at)} to {endsText(r.ends_at)} · {r.members}{r.max_members ? ` of ${r.max_members}` : ""} registered · {r.game_names.map(title).join(", ")}
                </p>
                <p className="note"><code>{r.link}</code></p>
              </div>
              <div className="row-actions">
                <button type="button" className="ghost small" onClick={() => copy(r.link)}>{copied === r.link ? "Copied" : "Copy link"}</button>
                {!r.finished && (
                  <button type="button" className="ghost small" onClick={async () => {
                    if (await ask({ title: "Make a new link?", body: <>The old link stops working. Everyone who registered stays in.</>, confirm: "New link" }) !== null)
                      act(() => newLink(r.code), "New link made. Share the new one.");
                  }}>New link</button>
                )}
                <button type="button" className="danger small" onClick={async () => {
                  if (await ask({ title: `Delete ${r.title}?`, body: <>Its link, players and standings go for good.</>, confirm: "Delete", danger: true }) !== null)
                    act(() => remove(r.code), "Deleted.");
                }}>Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
