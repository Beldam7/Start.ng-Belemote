import { useEffect, useState } from "react";
import type { YourGameProps } from "../registry";
import { mine, ownerFixed, type FixRequest } from "./api";

// On the owner's game in Your games: what admins say is wrong, and "I fixed it".
export default function FixNotice({ game, reload }: YourGameProps) {
  const [request, setRequest] = useState<FixRequest | null>(null);
  const [writing, setWriting] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (game.hidden !== "needs_fixing") return setRequest(null);
    mine().then((rows) => setRequest(rows.find((r) => r.game === game.name) ?? null));
  }, [game.name, game.hidden]);

  if (!request) return null;

  async function send() {
    setError("");
    try {
      setRequest(await ownerFixed(request!.id, note.trim()));
      setWriting(false);
      mine(true);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't work");
    }
  }

  return (
    <div className="update-problem fix-notice" role="status">
      <b>Hidden: needs a fix</b>
      <span>{request.automatic ? "start.ng couldn't open this game, so it's hidden for now" : "Our team found a problem"}: <i>{request.note}</i></span>
      {request.status === "owner_fixed" ? (
        <span className="ok">Thanks. Our team will check it and put it back.</span>
      ) : writing ? (
        <div className="fix-notice-form">
          <textarea id={`fixed-${game.name}`} value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000}
            placeholder="What did you change? (optional)" />
          <div className="row-actions">
            <button type="button" onClick={send}>Send to our team</button>
            <button type="button" className="ghost" onClick={() => setWriting(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <span>
          Push the fix to your repo (start.ng updates by itself), then{" "}
          <button type="button" className="link" onClick={() => setWriting(true)}>tell us it's fixed</button>.
        </span>
      )}
      {error && <span className="error">{error}</span>}
    </div>
  );
}
