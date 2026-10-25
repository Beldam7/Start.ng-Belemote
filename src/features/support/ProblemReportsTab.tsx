import { useCallback, useEffect, useState } from "react";
import type { AdminTabProps } from "../registry";
import { decide, queue, STATUS_LABEL, type AdminReport, type Queue, type Status } from "./api";

// F10, start.ng/admin#problem-reports: what players report about start.ng itself. Confirm a real bug (it pays the
// reporter), mark one as a duplicate of an earlier report, or as not a bug; mark a confirmed bug fixed.

const FILTERS: (Status | "")[] = ["", "new", "confirmed", "duplicate", "not_a_bug", "fixed"];
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "");

export default function ProblemReportsTab({ ask }: AdminTabProps) {
  const [data, setData] = useState<Queue | null>(null);
  const [filter, setFilter] = useState<Status | "">("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(0);

  const reload = useCallback(() => { setError(""); queue(filter || undefined).then(setData).catch((e) => setError(e.message)); }, [filter]);
  useEffect(reload, [reload]);

  async function act(r: AdminReport, status: Status, duplicateOf?: number) {
    const titles: Partial<Record<Status, string>> = {
      confirmed: `Confirm report #${r.id} as a real bug?`, not_a_bug: `Mark report #${r.id} as not a bug?`,
      fixed: `Mark report #${r.id} as fixed?`, duplicate: `Mark report #${r.id} as a repeat of #${duplicateOf}?`,
    };
    const body = status === "confirmed"
      ? <>{r.reporter} gets {data?.reward ?? 50} coins (once, and at most {data?.per_day ?? 3} paid reports a day). They see your note.</>
      : <>{r.reporter} sees the new status and your note.</>;
    const note = await ask({ title: titles[status] ?? "Update it?", body, confirm: "Save",
      input: { label: "A note for the reporter (optional)", initial: r.admin_note ?? "" } });
    if (note === null) return;
    setBusy(r.id);
    setError("");
    setDone("");
    try {
      const out = await decide(r.id, status, note, duplicateOf);
      setDone(status === "confirmed" ? (out.coins ? `Confirmed: ${r.reporter} got ${out.coins} coins.` : "Confirmed (no coins: paid already, today's limit reached, or the wardrobe is off).") : "Saved.");
      reload();
    } catch (e) { setError(e instanceof Error ? e.message : "That didn't work"); } finally { setBusy(0); }
  }

  return (
    <section>
      <h2>Problem reports</h2>
      <p className="note">Problems players report with start.ng itself, from the Help button. Confirming a real bug pays the reporter {data?.reward ?? 50} coins (once, at most {data?.per_day ?? 3} paid reports a day each). A repeat of an earlier report or "not a bug" pays nothing.</p>
      {error && <p className="error" role="alert">{error}</p>}
      {done && <p className="ok" role="status">{done}</p>}
      <div className="chips" role="group" aria-label="Show">
        {FILTERS.map((f) => (
          <button key={f || "all"} type="button" className={filter === f ? "on" : ""} aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f ? `${STATUS_LABEL[f]} (${data?.counts[f] ?? 0})` : "All"}
          </button>
        ))}
      </div>
      {data && data.reports.length === 0 && <p className="empty">No reports here.</p>}
      <div className="admin-list">
        {data?.reports.map((r) => (
          <article key={r.id} className="admin-item">
            <div className="admin-item-head">
              <div className="admin-item-title">
                <h3>
                  #{r.id} <span className={`pill ${r.status === "new" ? "waiting" : r.status === "confirmed" || r.status === "fixed" ? "" : "reported"}`}>{STATUS_LABEL[r.status]}</span>
                  {r.coins > 0 && <span className="pill">paid {r.coins} coins</span>}
                  {r.duplicate_of && <span className="pill">repeat of #{r.duplicate_of}</span>}
                </h3>
                <p className="note">by {r.reporter} ({r.reporter_email}) · {when(r.created_at)}{r.page ? <> · on <a href={r.page} target="_blank" rel="noreferrer">{r.page}</a></> : null}{r.browser ? ` · ${r.browser}` : ""}</p>
              </div>
              <div className="row-actions">
                {(r.status === "new" || r.status === "not_a_bug" || r.status === "duplicate") && (
                  <button type="button" disabled={!!busy} onClick={() => act(r, "confirmed")}>Real bug</button>
                )}
                {r.status === "confirmed" && <button type="button" disabled={!!busy} onClick={() => act(r, "fixed")}>Fixed</button>}
                {r.status === "new" && <button type="button" className="ghost" disabled={!!busy} onClick={() => act(r, "not_a_bug")}>Not a bug</button>}
              </div>
            </div>
            <p className="fix-note">{r.what}</p>
            {r.admin_note && <p className="fix-note"><b>Note to the reporter:</b> {r.admin_note} <span className="note">({r.decided_by}, {when(r.decided_at)})</span></p>}
            {r.similar.length > 0 && (
              <div className="support-similar">
                <span className="note">Looks like:</span>
                {r.similar.map((s) => (
                  <span key={s.id} className="support-similar-item">
                    <b>#{s.id}</b> {s.what} <span className="note">({STATUS_LABEL[s.status]})</span>
                    {r.status === "new" && <button type="button" className="link" disabled={!!busy} onClick={() => act(r, "duplicate", s.id)}>It's a repeat of #{s.id}</button>}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
