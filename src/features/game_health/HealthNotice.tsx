import { useEffect, useState } from "react";
import type { YourGameProps } from "../registry";
import { mine, ownerCheck, type Health } from "./api";

// On the owner's game in Your games, when start.ng's checks keep failing: what's wrong, and "check again".
export default function HealthNotice({ game, reload }: YourGameProps) {
  const [health, setHealth] = useState<Health | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    mine().then((rows) => setHealth(rows.find((r) => r.game === game.name) ?? null));
  }, [game.name]);

  if (!health || health.status !== "unhealthy") return note ? <p className="ok" role="status">{note}</p> : null;

  async function again() {
    setBusy(true);
    setNote("");
    try {
      const r = await ownerCheck(game.name);
      setHealth(r);
      mine(true);
      if (r.status === "ok") { setNote("It loads fine now. Thanks for fixing it."); reload(); } else setNote("It still doesn't load. Push your fix, then check again.");
    } catch (e) { setNote(e instanceof Error ? e.message : "That didn't work"); } finally { setBusy(false); }
  }

  return (
    <div className="update-problem" role="status">
      <b>Not loading</b>
      <span>start.ng tried to open this game and it failed {health.failures} times in a row:</span>
      <ul className="health-problems">{health.problems.map((p, i) => <li key={i}>{p.message}</li>)}</ul>
      <span>
        Push a fix to your repo (start.ng updates by itself), then{" "}
        <button type="button" className="link" disabled={busy} onClick={again}>{busy ? "checking…" : "check again"}</button>.
      </span>
      {note && <span>{note}</span>}
    </div>
  );
}
