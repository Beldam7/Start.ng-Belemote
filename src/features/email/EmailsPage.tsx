import { useEffect, useState } from "react";
import type { PageProps } from "../registry";
import { confirm, subscribe, unsubscribe, VISITOR_TOPICS, type Done } from "./api";
import EmailPrefs from "./EmailPrefs";

// start.ng/emails: choose your emails. Also where the links in emails land:
//   /emails?confirm=<token>                  a visitor confirming their address (double opt-in)
//   /emails?unsubscribe=<token>[&topic=x]    one click: stop one topic, or everything
// Topic names inside a sentence ("We'll email you about the daily tournament and new games").
const SHORT: Record<string, string> = {
  tournament: "the daily tournament", results: "your tournament results", records: "beaten records",
  new_games: "new games", follows: "creators you follow", newsletter: "the newsletter",
};

// A confirm link works once, so each link is sent to the API once per page load (React may run effects twice).
const sentLinks = new Map<string, Promise<Done>>();
function once(key: string, run: () => Promise<Done>) {
  if (!sentLinks.has(key)) sentLinks.set(key, run());
  return sentLinks.get(key)!;
}

export default function EmailsPage({ user, onSignIn }: PageProps) {
  const q = new URLSearchParams(location.search);
  const confirmToken = q.get("confirm");
  const unsubToken = q.get("unsubscribe");
  const topic = q.get("topic");
  const [done, setDone] = useState<Done | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Your emails · start.ng";
    const run = confirmToken ? once(`c:${confirmToken}`, () => confirm(confirmToken))
      : unsubToken ? once(`u:${unsubToken}:${topic}`, () => unsubscribe(unsubToken, topic)) : null;
    run?.then(setDone).catch((e) => setError(e.message));
  }, [confirmToken, unsubToken, topic]);

  const label = (k: string) => SHORT[k] ?? k.replace("_", " ");
  const list = (keys: string[]) => keys.map(label).join(", ").replace(/, ([^,]*)$/, " and $1");

  return (
    <section className="container emails-page">
      <div className="section-head">
        <div>
          <h2>Your emails</h2>
          <p className="tournament-sub">Only what you ask for, never more than one a day.</p>
        </div>
      </div>

      {(confirmToken || unsubToken) && (
        <div className="emails-result" role="status">
          {error ? <p className="error">{error}</p>
            : !done ? <p className="note">One moment…</p>
            : confirmToken ? <p><b>You're in.</b> We'll email {done.email} about {list(done.topics)}.</p>
            : done.topics.length ? <p><b>Done.</b> {done.email} won't get {label(topic ?? "")} emails any more. You still get {list(done.topics)}.</p>
            : <p><b>You're unsubscribed.</b> We won't email {done.email} again unless you sign up.</p>}
        </div>
      )}

      {user ? <EmailPrefs /> : !done && <VisitorSignup onSignIn={onSignIn} />}
    </section>
  );
}

function VisitorSignup({ onSignIn }: { onSignIn: () => void }) {
  const [email, setEmail] = useState("");
  const [topics, setTopics] = useState<string[]>(["tournament"]);
  const [sent, setSent] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try { setSent((await subscribe(email.trim(), topics)).detail); } catch (err) { setError(err instanceof Error ? err.message : "That didn't work"); } finally { setBusy(false); }
  }

  if (sent) return <p className="ok" role="status">{sent} The link works for 7 days.</p>;
  return (
    <form className="email-signup" onSubmit={submit}>
      <p className="note">
        Get start.ng by email. We'll send a link to confirm first.{" "}
        <button type="button" className="link" onClick={onSignIn}>Sign in</button> for more, like your tournament results.
      </p>
      <ul className="email-topics">
        {VISITOR_TOPICS.map((x) => (
          <li key={x.key}>
            <label>
              <input type="checkbox" checked={topics.includes(x.key)}
                onChange={() => setTopics((t) => (t.includes(x.key) ? t.filter((k) => k !== x.key) : [...t, x.key]))} />
              <span>{x.label}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="email-signup-row">
        <input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" aria-label="Your email" />
        <button type="submit" disabled={busy || !topics.length || !email.trim()}>Send me the link</button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}
