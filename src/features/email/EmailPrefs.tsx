import { useEffect, useState } from "react";
import { mine, setMine, type MyEmail } from "./api";

// A signed-in player's email choices: one switch per topic, saved as they change.
export default function EmailPrefs() {
  const [me, setMe] = useState<MyEmail | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => { mine().then(setMe).catch((e) => setError(e.message)); }, []);

  async function toggle(key: string) {
    if (!me) return;
    const on = me.topics.filter((x) => x.on).map((x) => x.key);
    const next = on.includes(key) ? on.filter((k) => k !== key) : [...on, key];
    setError("");
    setSaved(false);
    try { setMe(await setMine(next)); setSaved(true); } catch (e) { setError(e instanceof Error ? e.message : "That didn't save"); }
  }

  if (!me) return error ? <p className="error" role="alert">{error}</p> : <p className="note">Loading…</p>;
  const any = me.topics.some((x) => x.on);
  return (
    <div className="email-prefs">
      <p className="note">We write to <b>{me.email}</b>, at most once a day. Every email has a one-click unsubscribe.</p>
      {me.bad && <p className="error">Emails to this address bounced, so we've stopped sending them.</p>}
      <ul className="email-topics">
        {me.topics.map((x) => (
          <li key={x.key}>
            <label>
              <input type="checkbox" checked={x.on} onChange={() => toggle(x.key)} />
              <span>{x.label}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="note" role="status" aria-live="polite">{saved ? (any ? "Saved." : "Saved. We won't email you.") : " "}</p>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
