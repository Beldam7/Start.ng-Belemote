import { useEffect, useState } from "react";
import type { ProfileSectionProps } from "../registry";
import { getLeagues, type TrackSummary } from "./api";
import { label } from "./words";

/** Your tier and place in each track. The API only answers for yourself, so other players' profiles show a note. */
export default function LeagueSection({ isMe }: ProfileSectionProps) {
  const [tracks, setTracks] = useState<TrackSummary[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (isMe) getLeagues().then(setTracks).catch(() => setError("Couldn't load your league."));
  }, [isMe]);

  if (!isMe) return <p className="note">League places are private.</p>;
  if (error) return <p className="error">{error}</p>;
  if (!tracks) return <p className="board-sub">Loading…</p>;
  return (
    <div className="league-summary">
      <ul>
        {tracks.map((t) => (
          <li key={t.track}>
            <b>{label(t.track)}</b>
            <span className={`tag league-tier ${t.tier}`}>{t.tier}</span>
            <span className="note">{t.group === null ? "Not played this round" : t.me?.place ? `#${t.me.place} in your group` : "No counted games yet"}</span>
          </li>
        ))}
      </ul>
      <a href="/league">See your league →</a>
    </div>
  );
}
