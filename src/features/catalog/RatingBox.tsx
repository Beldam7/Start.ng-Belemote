import { useEffect, useState } from "react";
import type { PagePartProps } from "../registry";
import Stars from "./Stars";
import { getRating, rate, refreshCatalog, unrate, type MyRating } from "./api";

/** Rate this game, on its page: 1 to 5 stars, once you've played it for a minute. */
export default function RatingBox({ user, onSignIn, game }: PagePartProps) {
  const [r, setR] = useState<MyRating | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!game) return;
    let live = true;
    getRating(game).then((got) => live && setR(got)).catch(() => {});
    return () => { live = false; };
  }, [game, user?.id]);

  if (!game || !r) return null;

  async function pick(stars: number) {
    if (!user) return onSignIn();
    setBusy(true);
    setError("");
    try { setR(await rate(game!, stars)); refreshCatalog(); } catch (e) { setError(e instanceof Error ? e.message : "Couldn't save your rating"); } finally { setBusy(false); }
  }

  async function clear() {
    setBusy(true);
    try { setR(await unrate(game!)); refreshCatalog(); } catch (e) { setError(e instanceof Error ? e.message : "Couldn't remove your rating"); } finally { setBusy(false); }
  }

  return (
    <div className="game-page-share rating-box">
      <span>Rate it</span>
      <span className="star-pick" role="group" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" className={r.mine && n <= r.mine ? "on" : ""} disabled={busy || (!!user && !r.can_rate)}
            aria-label={`${n} ${n === 1 ? "star" : "stars"}`} aria-pressed={r.mine === n} onClick={() => pick(n)}>★</button>
        ))}
      </span>
      <Stars avg={r.rating_avg} count={r.rating_count} />
      {r.mine && <button type="button" className="link" disabled={busy} onClick={clear}>Remove my rating</button>}
      {user && !r.can_rate && r.why_not && !r.mine && <span className="note">{r.why_not}</span>}
      {!user && <span className="note">Sign in to rate</span>}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
