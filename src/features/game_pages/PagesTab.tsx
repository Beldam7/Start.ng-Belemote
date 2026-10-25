import { useCallback, useEffect, useRef, useState } from "react";
import type { AdminTabProps } from "../registry";
import { adminApprove, adminGaps, adminGenerate, adminPage, adminPages, adminSave, adminSummary, adminUnapprove, PAGE_SIZE, type Gap, type PageFull, type PageRow, type Summary } from "./api";

// start.ng/admin#game-pages: pages about each game (about, how to play, FAQ, walkthrough). They are written from the facts in a
// game's own files; they are made and published automatically; an admin can edit or take any page down. A game that says too little gets no page, and is listed so
// its creator can be asked to add a description.

const KIND: Record<string, string> = { about: "About", "how-to-play": "How to play", faq: "FAQ", walkthrough: "Walkthrough" };

function Editor({ id, onChanged }: { id: number; onChanged: () => void }) {
  const [page, setPage] = useState<PageFull | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    setError("");
    return adminPage(id).then((p) => { setPage(p); setTitle(p.title); setDescription(p.description); setBody(p.body); }).catch((e) => setError(e instanceof Error ? e.message : "Couldn't load the page"));
  }, [id]);
  useEffect(() => { load(); }, [load]);
  if (!page) {
    return error
      ? <p className="error" role="alert">{error} <button type="button" className="link" onClick={load}>Try again</button></p>
      : <p className="note" role="status" aria-busy="true">Loading…</p>;
  }

  async function run(fn: () => Promise<unknown>) {
    setBusy(true); setError("");
    try { await fn(); await load(); onChanged(); } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); } finally { setBusy(false); }
  }
  const dirty = title !== page.title || description !== page.description || body !== page.body;
  return (
    <div className="gp-editor">
      <label>Title <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} disabled={busy} /></label>
      <label>Description (what search results show) <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} disabled={busy} /></label>
      <label>Text <span className="note">## Heading, a line of text, - bullet, 1. step</span>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14} disabled={busy} />
      </label>
      {page.facts && (
        <details>
          <summary>What this was written from</summary>
          <pre className="gp-facts">{JSON.stringify(page.facts, null, 2)}</pre>
        </details>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="actions">
        <button type="button" className="ghost" disabled={busy || !dirty} onClick={() => run(() => adminSave(id, title, description, body))}>Save changes</button>
        {page.status !== "approved"
          ? <button type="button" disabled={busy || dirty} onClick={() => run(() => adminApprove(id))} title={dirty ? "Save your changes first" : ""}>Approve and publish</button>
          : <><a className="btn ghost" href={`/games/${page.game}/${page.kind}`} target="_blank" rel="noreferrer">Open the page</a>
              <button type="button" className="ghost" disabled={busy} onClick={() => run(() => adminUnapprove(id))}>Take it down</button></>}
      </div>
    </div>
  );
}

export default function PagesTab({ ask }: AdminTabProps) {
  const [status, setStatus] = useState("draft");
  const [rows, setRows] = useState<PageRow[] | null>(null);
  const [more, setMore] = useState(false); // the last request filled a whole page, so there may be more
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [gaps, setGaps] = useState<Gap[] | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const generationInProgress = useRef(false);
  const latest = useRef(0); // each list request gets a number; only the newest one may change what is shown
  const latestSummary = useRef(0); // the counts have their own numbers, so "Show more" cannot throw them away
  const [summaryFailed, setSummaryFailed] = useState(false);

  const load = useCallback((offset: number) => {
    const mine = ++latest.current;
    setError("");
    setLoading(true);
    if (offset === 0) setRows(null); // never show rows from the other filter while this one loads
    adminPages(status, offset)
      .then((r) => {
        if (mine !== latest.current) return;
        setRows((old) => (offset === 0 ? r : [...(old ?? []), ...r]));
        setMore(r.length === PAGE_SIZE);
      })
      .catch((e) => { if (mine === latest.current) setError(e instanceof Error ? e.message : "Couldn't load the pages"); })
      .finally(() => { if (mine === latest.current) setLoading(false); });
  }, [status]);
  const reload = useCallback(() => {
    load(0);
    const mine = ++latestSummary.current;
    setSummaryFailed(false);
    adminSummary().then((s) => { if (mine === latestSummary.current) setSummary(s); }).catch(() => { if (mine === latestSummary.current) setSummaryFailed(true); });
  }, [load]);
  useEffect(reload, [reload]);

  async function generate() {
    if (generationInProgress.current) return;
    generationInProgress.current = true;
    setGenerating(true);
    try {
      const ok = await ask({ title: "Make draft pages?", body: "This reads each game's files and writes draft pages from what they say. Pages already approved or edited by a person are kept.", confirm: "Make drafts" });
      if (ok === null) return;
      const c = await adminGenerate();
      setNote(`${c.draft ?? 0} drafts, ${c.approved ?? 0} approved, ${c.skipped ?? 0} not made.`);
      reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't make pages"); }
    finally { generationInProgress.current = false; setGenerating(false); }
  }

  return (
    <section>
      <div className="dup-head">
        <div>
          <h2>Game pages</h2>
          <p className="note">About, how to play, FAQ and walkthrough pages for each game, written only from what its own files say. Pages publish themselves when the text passes the safety check. Edit one or take it down here, and it stays as you leave it. {summaryFailed && !summary && "The counts didn't load. "}{summary && `${summary.approved} approved · ${summary.draft} waiting · ${summary.skipped} not made · ${summary.games_without_pages} games have no page at all.`}</p>
        </div>
        <div className="actions">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setOpen(null); }} aria-label="Show">
            <option value="draft">Waiting (taken down, or needs a look)</option>
            <option value="approved">Approved</option>
            <option value="skipped">Not made</option>
            <option value="all">Everything</option>
          </select>
          <button type="button" disabled={generating} onClick={generate}>Make draft pages</button>
        </div>
      </div>
      {note && <p className="note" role="status">{note}</p>}
      {error && <p className="error" role="alert">{error} <button type="button" className="link" onClick={reload}>Try again</button></p>}
      {loading && <p className="tags-state" role="status">Loading pages…</p>}
      {rows && rows.length === 0 && <p className="empty">Nothing here. {status === "draft" ? "Make draft pages to look for games that say enough." : ""}</p>}
      <div className="admin-list">
        {rows?.map((r) => (
          <article key={r.id} className="admin-item">
            <div className="admin-item-head">
              <div className="admin-item-title">
                <h3>{r.game} · {KIND[r.kind] ?? r.kind}</h3>
                <p className="note">{r.status === "skipped" ? r.reason : `${r.status}${r.edited ? " · edited by a person" : ""}`}</p>
              </div>
              {r.status !== "skipped" && <button type="button" className="ghost" onClick={() => setOpen(open === r.id ? null : r.id)}>{open === r.id ? "Close" : "Review"}</button>}
            </div>
            {open === r.id && <Editor id={r.id} onChanged={reload} />}
          </article>
        ))}
      </div>
      {more && !loading && <p><button type="button" className="ghost" onClick={() => load(rows?.length ?? 0)}>Show more</button></p>}
      <div className="gp-gaps">
        <button type="button" className="ghost" onClick={() => (gaps ? setGaps(null) : adminGaps().then(setGaps).catch((e) => setError(e.message)))}>{gaps ? "Hide" : "Show"} games with no page</button>
        {gaps && (
          <ul>{gaps.map((g) => <li key={g.game}><b>{g.game}</b>: {g.reasons.join(" · ")}</li>)}</ul>
        )}
      </div>
    </section>
  );
}
