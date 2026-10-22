import { useEffect, useState } from "react";
import type { PageProps } from "../registry";
import { PAGES, setSeo } from "../../seo";
import { getSpotlight, type Spotlight } from "./api";
import "./spotlight.css";

const left = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "resetting now";
  const h = Math.floor(ms / 3_600_000), m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m left`;
};

/** start.ng/spotlight: this week's Game of the Week and today's daily challenge. */
export default function SpotlightPage({ user, onSignIn }: PageProps) {
  const [s, setS] = useState<Spotlight | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { setSeo(PAGES.spotlight); }, []);
  useEffect(() => {
    let live = true;
    getSpotlight().then((got) => live && setS(got)).catch(() => live && setError("Couldn't load the spotlight. Try again in a moment."));
    // Coming back from playing: show the new best, and whether the goal is done.
    const refresh = () => { if (document.visibilityState === "visible") getSpotlight().then((got) => live && setS(got)).catch(() => {}); };
    document.addEventListener("visibilitychange", refresh);
    return () => { live = false; document.removeEventListener("visibilitychange", refresh); };
  }, [user?.id]);

  const pick = s?.game_of_the_week, c = s?.challenge;
  return (
    <section className="container spotlight-page">
      <h1>Spotlight</h1>
      {error && <p className="error" role="alert">{error}</p>}
      {s === null && !error && <p className="board-sub">Loading...</p>}

      {c && (
        <div className="spot-card daily">
          <p className="eyebrow">Daily challenge · {left(c.ends_at)}</p>
          <h2>{c.goal_is_a_ceiling ? `Finish ${c.game_title} in ${c.goal_shown} or less` : `Reach ${c.goal_shown} in ${c.game_title}`}</h2>
          <p className="lead-sm">One goal a day, set from how people have been playing. {c.stat} counts, and only today's runs.</p>
          {c.done && <p className="ok" role="status">Done! Come back tomorrow for the next one.</p>}
          {c.done === false && c.best && <p className="note" role="status">Your best today: {c.best}. Keep going!</p>}
          <div className="spot-actions">
            <a className="btn" href={`/games/${c.game}`}>{c.done ? "Play again" : "Play now"}</a>
            {!user && <button type="button" className="ghost" onClick={onSignIn}>Sign in so it counts</button>}
          </div>
        </div>
      )}
      {s && !c && <p className="note">No daily challenge yet: it appears once a few games have enough plays.</p>}

      {pick && (
        <div className="spot-card week">
          <p className="eyebrow">Game of the Week</p>
          <div className="spot-game">
            {pick.cover_url && <img src={pick.cover_url} alt="" loading="lazy" />}
            <div>
              <h2>{pick.title}</h2>
              {pick.note && <p className="lead-sm">{pick.note}</p>}
              <a className="btn" href={`/games/${pick.game}`}>Play {pick.title}</a>
            </div>
          </div>
        </div>
      )}
      {s && !pick && <p className="note">No Game of the Week picked yet.</p>}
    </section>
  );
}
