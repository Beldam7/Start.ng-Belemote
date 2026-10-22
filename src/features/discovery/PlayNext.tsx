import { useEffect, useState } from "react";
import type { PagePartProps } from "../registry";
import { getNext } from "./api";

type Suggestion = { name: string; title: string };

const title = (name: string) => name.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

/** "Play next" on a game's page: one to three games to try after this one. */
export default function PlayNext({ game, user }: PagePartProps) {
  const [next, setNext] = useState<Suggestion[]>([]);
  useEffect(() => {
    if (!game) return;
    let live = true;
    getNext(game).then((r) => live && setNext(r.games.map((name) => ({ name, title: title(name) })))).catch(() => live && setNext([]));
    return () => { live = false; };
  }, [game, user?.id]);
  if (next.length === 0) return null;
  return (
    <div className="game-page-share play-next">
      <span>Play next</span>
      {next.map((n) => <a key={n.name} className="ghost btn" href={`/games/${n.name}`}>{n.title}</a>)}
    </div>
  );
}
