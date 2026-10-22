import { useEffect, useState } from "react";
import type { Game } from "../../games";
import type { PagePartProps } from "../registry";
import { getShelves, type Shelves as ShelvesData } from "./api";

const ROWS: { key: keyof ShelvesData; title: string; note?: string }[] = [
  { key: "continue_playing", title: "Continue playing" },
  { key: "featured", title: "Featured" },
  { key: "staff", title: "Staff picks" },
  { key: "new", title: "New this week", note: "Every new game shows here first" },
  { key: "most_played", title: "Most played", note: "Players who stay, not just players who click" },
  { key: "most_improved", title: "Most improved", note: "Growing the fastest" },
];

/** The homepage shelves (PRD A1): a row of games per shelf, from /discover/shelves. A shelf with no games isn't shown. */
export default function Shelves({ games, user }: PagePartProps) {
  const [shelves, setShelves] = useState<ShelvesData | null>(null);
  useEffect(() => {
    let live = true;
    getShelves().then((s) => live && setShelves(s)).catch(() => {});
    return () => { live = false; };
  }, [user?.id]);
  if (!shelves || !games) return null;
  const bySlug = new Map(games.map((g) => [g.slug, g]));
  const rows = ROWS.map((r) => ({ ...r, games: shelves[r.key].map((n) => bySlug.get(n)).filter((g): g is Game => !!g) })).filter((r) => r.games.length > 0);
  if (rows.length === 0) return null;
  return (
    <section className="container shelves" aria-label="Find a game">
      {rows.map((r) => (
        <div key={r.key} className="shelf">
          <h2>{r.title} {r.note && <span className="note">{r.note}</span>}</h2>
          <ul>
            {r.games.map((g) => (
              <li key={g.slug}>
                <a href={`/games/${g.slug}`}>
                  <span className="art" style={{ background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]})` }}>
                    {g.cover ? <img src={g.cover} alt="" loading="lazy" decoding="async" /> : <span>{g.title.charAt(0)}</span>}
                  </span>
                  <b>{g.title}</b>
                  <em>by {g.by}</em>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
