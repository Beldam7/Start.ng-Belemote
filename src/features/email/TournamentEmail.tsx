import { useEffect, useState } from "react";
import type { PagePartProps } from "../registry";
import { mine, setMine, subscribe, type MyEmail } from "./api";

// On start.ng/tournament: get each day's tournament (and, signed in, how you did) by email.
export default function TournamentEmail({ user }: PagePartProps) {
  return (
    <aside className="tournament-email" aria-label="Tournament emails">
      <div>
        <b>Get the tournament by email</b>
        <p className="note">One email at 6 PM: who won, and the new games. At most one a day.</p>
      </div>
      {user ? <SignedIn /> : <Visitor />}
    </aside>
  );
}

function SignedIn() {
  const [me, setMe] = useState<MyEmail | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { mine().then(setMe).catch((e) => setError(e.message)); }, []);
  if (error) return <p className="error">{error}</p>;
  if (!me) return null;
  const on = me.topics.filter((t) => t.on).map((t) => t.key);
  if (on.includes("tournament") && on.includes("results")) {
    return <p className="note">You get these, with how you did. <a href="/emails">Your emails →</a></p>;
  }
  return (
    <button type="button" onClick={() => setMine([...new Set([...on, "tournament", "results"])]).then(setMe).catch((e) => setError(e.message))}>
      Email me, with how I did
    </button>
  );
}

function Visitor() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try { setSent((await subscribe(email.trim(), ["tournament"])).detail); } catch (err) { setError(err instanceof Error ? err.message : "That didn't work"); } finally { setBusy(false); }
  }

  if (sent) return <p className="ok" role="status">{sent}</p>;
  return (
    <form className="email-signup-row" onSubmit={submit}>
      <input id="tournament-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" aria-label="Your email" />
      <button type="submit" disabled={busy || !email.trim()}>Email me</button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}
