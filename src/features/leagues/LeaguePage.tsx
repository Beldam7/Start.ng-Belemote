import { useEffect, useState } from "react";
import type { PageProps } from "../registry";
import { shortName } from "../../BoardTable";
import { PAGES, setSeo } from "../../seo";
import { getHistory, getTable, TRACKS, type HistoryRound, type Table, type Track } from "./api";
import { countdown, label, RESULT, roundDate, TRACK_INFO } from "./words";

const fromUrl = (): Track => {
  const t = new URLSearchParams(location.search).get("track");
  return TRACKS.find((x) => x === t) ?? "daily";
};

function Dot({ color }: { color: string | undefined }) {
  return <span className="dot" style={{ background: color ?? "var(--line)" }} />;
}

/** The one line under the countdown: how to join, why nobody moves yet, or how far you are from moving up. */
function nudge(t: Table): string {
  if (t.group === null) return "Play any game to join this round.";
  if (t.waiting) return "Waiting for players. Nobody moves up or down until 10 have played.";
  const toGo = t.points_to_promotion === null ? "" : `${t.points_to_promotion} ${t.points_to_promotion === 1 ? "point" : "points"} to the promotion zone.`;
  if (t.me?.zone === "down") return `You're in the relegation zone. ${toGo || "Play more games to climb out."}`;
  if (toGo) return toGo;
  if (t.me?.zone === "up") return "You're in the promotion zone.";
  return "You're safe.";
}

/** start.ng/league: your group in each track (Sprint, Daily, Weekly), the countdown, the zones and your past rounds. */
export default function LeaguePage({ user, onSignIn }: PageProps) {
  const [track, setTrack] = useState<Track>(fromUrl);
  const [table, setTable] = useState<Table | null>(null);
  const [rounds, setRounds] = useState<HistoryRound[] | null>(null);
  const [owner, setOwner] = useState<number | null>(null); // whose table and rounds are loaded
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => setSeo(PAGES.league), []);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const ended = table ? new Date(table.ends_at).getTime() <= now : false;
  useEffect(() => {
    if (!user) return;
    const uid = user.id;
    let live = true;
    let latest = 0; // only the newest refresh may change the page, even if an older one answers later
    const load = () => {
      const n = ++latest;
      Promise.all([getTable(track), getHistory(track)])
        .then(([t, h]) => { if (live && n === latest) { setTable(t); setRounds(h); setOwner(uid); setError(""); } })
        .catch(() => live && n === latest && setError("Couldn't load your league. Try again in a moment."));
    };
    load();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") load(); }, 30000);
    return () => { live = false; window.clearInterval(timer); };
  }, [track, user?.id, ended]); // ended: a new round has started, so load it

  function choose(next: Track) {
    if (next === track) return;
    setTable(null);
    setRounds(null);
    setTrack(next);
    history.replaceState(null, "", next === "daily" ? "/league" : `/league?track=${next}`);
  }

  return (
    <section className="container tournament-page league-page">
      <div className="section-head">
        <div>
          <h1>League</h1>
          <p className="tournament-sub">Play any game to score. The top 5 in your group move up a tier and the bottom 5 move down (nobody drops below Bronze or rises past Diamond). <a href="/games">Find a game →</a></p>
        </div>
      </div>

      <div className="segmented" role="group" aria-label="Track">
        {TRACKS.map((t) => (
          <button key={t} type="button" className={track === t ? "on" : ""} aria-pressed={track === t} onClick={() => choose(t)}>{label(t)}</button>
        ))}
      </div>

      {!user ? (
        <div className="board-empty">
          <p>Sign in to see your league.</p>
          <button type="button" onClick={onSignIn}>Sign in</button>
        </div>
      ) : error ? (
        <p className="error">{error}</p>
      ) : !table || owner !== user.id ? ( // another account's league never shows, even for a moment
        <p className="board-sub">Loading…</p>
      ) : (
        <>
          <div className="tournament-status league-status">
            <div>
              <span className={`tag league-tier ${table.tier}`}>{table.tier} league</span>
              <p className="league-nudge"><b>{nudge(table)}</b></p>
              <p className="note">{TRACK_INFO[table.track]}. Your points come from your best 5 games this round, scored against everyone else's runs.</p>
            </div>
            <div className="league-clock" aria-live="off">
              <span className="note">Round ends in</span>
              <b>{countdown(table.ends_at, now)}</b>
            </div>
          </div>

          <section aria-labelledby="league-group">
            <h2 id="league-group" className="private-heading">{table.group === null ? "Your group" : `Group ${table.group}`}</h2>
            {table.group === null || table.rows.length === 0 ? (
              <p className="board-empty">You'll get a group with your first game this round. <a href="/games">Play a game</a></p>
            ) : (
              <>
                {!table.waiting && (
                  <p className="league-legend note"><span className="zone-key up" /> Promotion zone <span className="zone-key down" /> Relegation zone</p>
                )}
                <div className="board-table overall-board league-table" role="table" aria-label="Your group" style={{ gridTemplateColumns: "36px minmax(0, 1fr) auto auto" }}>
                  <div className="board-row board-head" role="row">
                    <span role="columnheader">#</span>
                    <span role="columnheader">Player</span>
                    <span role="columnheader" className="num">Games</span>
                    <span role="columnheader" className="num">Points</span>
                  </div>
                  {table.rows.map((r) => (
                    <div key={r.player.id} role="row" className={`board-row ${r.me ? "me" : ""} ${table.waiting ? "" : `zone-${r.zone}`}`}>
                      <span role="cell" className="rk">{r.place ?? "–"}</span>
                      <span role="cell" className="nm" title={r.player.name ?? "Player"}><Dot color={r.player.character?.style.primaryColor} />{shortName(r.player.name ?? "Player")}{r.me && <em> (you)</em>}</span>
                      <span role="cell" className="num">{r.games}</span>
                      <span role="cell" className="num sc">{r.points}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          <section aria-labelledby="league-history">
            <h2 id="league-history" className="private-heading">Past rounds</h2>
            {!rounds || rounds.length === 0 ? (
              <p className="board-empty">No finished rounds yet.</p>
            ) : (
              <ul className="league-history">
                {rounds.map((h) => (
                  <li key={h.starts_at}>
                    <span>{roundDate(h.starts_at, track === "sprint")}</span>
                    <span className="tag league-tier">{h.tier}</span>
                    <span className="note">{h.place ? `#${h.place}` : "–"} · {h.points} {h.points === 1 ? "point" : "points"}</span>
                    <b className={`league-result ${h.result}`}>{RESULT[h.result]}</b>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </section>
  );
}
