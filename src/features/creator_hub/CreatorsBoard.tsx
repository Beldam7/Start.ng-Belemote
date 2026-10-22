import { useEffect, useState } from "react";
import type { PageProps } from "../registry";
import { PAGES, setSeo } from "../../seo";
import { AvatarFace } from "../../Avatar";
import { getLeaders, type Leader } from "./api";
import "./creator_hub.css";

/** start.ng/by: the top creators, by different people who played their games in the last 30 days. */
export default function CreatorsBoard(_: PageProps) {
  const [leaders, setLeaders] = useState<Leader[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { setSeo(PAGES.creatorsBoard); }, []);
  useEffect(() => { getLeaders().then(setLeaders).catch(() => setError("Couldn't load the top creators. Try again in a moment.")); }, []);

  return (
    <section className="container creator-page">
      <h1>Top creators</h1>
      <p className="lead-sm">The people whose games the most different players opened in the last 30 days.</p>
      {error && <p className="error" role="alert">{error}</p>}
      {leaders === null && !error && <p className="board-sub">Loading...</p>}
      {leaders && leaders.length === 0 && <p className="empty">No plays yet this month. <a href="/games">Play something</a> and the board fills up.</p>}
      <ol className="creator-board">
        {leaders?.map((l, i) => (
          <li key={l.id}>
            <a href={`/by/${l.slug}`}>
              <span className="rk">{i + 1}</span>
              {l.character?.style ? <AvatarFace style={l.character.style} size={40} /> : <span className="tile">{l.name.charAt(0)}</span>}
              <span className="nm"><b>{l.name}</b><em>{l.games} {l.games === 1 ? "game" : "games"}</em></span>
              <span className="num">{l.players_30.toLocaleString()} <em>{l.players_30 === 1 ? "player" : "players"}</em></span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
