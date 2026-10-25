import { useEffect, useState } from "react";
import { reloadFeatures } from "../flags";
import type { AdminTabProps } from "../registry";
import { listFeatures, switchFeature, type FeatureRow } from "./api";
import "./feature_toggle.css";

// start.ng/admin#features: switch a feature on or off without asking for a redeploy. A switch here wins over the server's
// FEATURES setting; "Use the server setting" removes it. Super admins only.

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "");
const label = (name: string) => name.replace(/_/g, " ");

export default function FeaturesTab({ ask }: AdminTabProps) {
  const [rows, setRows] = useState<FeatureRow[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => { listFeatures().then(setRows).catch((e) => setError(e.message)); }, []);

  async function change(row: FeatureRow, enabled: boolean | null) {
    if (enabled === true && row.caution) {
      const ok = await ask({ title: `Switch on ${label(row.name)}?`, body: row.caution, confirm: "Switch on", danger: true });
      if (ok === null) return;
    }
    setBusy(row.name);
    setError("");
    try {
      setRows(await switchFeature(row.name, enabled));
      await reloadFeatures(); // the admin menu, pages and parts follow straight away, without a refresh
    } catch (e) { setError(e instanceof Error ? e.message : "That did not work"); } finally { setBusy(""); }
  }

  const q = query.trim().toLowerCase();
  const shown = (rows ?? []).filter((r) => !q || r.name.includes(q.replace(/ /g, "_")) || r.description.toLowerCase().includes(q));
  const on = (rows ?? []).filter((r) => r.enabled).length;

  return (
    <section>
      <div className="ft-head">
        <div>
          <h2>Features</h2>
          <p className="note">
            Switch a feature on or off here, with no redeploy. A switch wins over the server's FEATURES setting. It takes effect at once, and on
            every server within 10 seconds. {rows && `${on} of ${rows.length} on.`}
          </p>
        </div>
        <input className="ft-search" type="search" placeholder="Find a feature" aria-label="Find a feature" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {!rows && !error && <p className="board-sub">Loading…</p>}
      <ul className="ft-list">
        {shown.map((r) => (
          <li key={r.name} className={r.enabled ? "ft-row on" : "ft-row"}>
            <div className="ft-main">
              <div className="ft-title">
                <b>{label(r.name)}</b>
                <code>{r.name}</code>
                <span className={`ft-state ${r.enabled ? "on" : ""}`}>{r.enabled ? "On" : "Off"}</span>
                {r.caution && <span className="ft-warn" title={r.caution}>changes real behaviour</span>}
              </div>
              <p>{r.description}</p>
              <p className="ft-meta">
                {r.source === "admin" ? (
                  <>
                    Switched {r.enabled ? "on" : "off"} here by {r.changed_by}, {when(r.changed_at)}. The server setting says {r.server_on ? "on" : "off"}.{" "}
                    <button type="button" className="link" disabled={busy === r.name} onClick={() => change(r, null)}>Use the server setting</button>
                  </>
                ) : (
                  <>From the server setting ({r.server_on ? "on" : "off"}).</>
                )}
              </p>
            </div>
            <button type="button" role="switch" aria-checked={r.enabled} aria-label={`${label(r.name)} is ${r.enabled ? "on" : "off"}`}
              className="ft-switch" disabled={busy === r.name} onClick={() => change(r, !r.enabled)}><span /></button>
          </li>
        ))}
      </ul>
      {rows && shown.length === 0 && <p className="note">No feature matches.</p>}
    </section>
  );
}
