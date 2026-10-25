import { useEffect, useState } from "react";
import type { PagePartProps } from "../registry";
import { getIndieSubPages, type SubPage } from "./api";

/** The independent game page part (registerPagePart, page "indie"): links to this game's About and FAQ pages. The game is its id. */
export default function IndiePages({ game }: PagePartProps) {
  const [pages, setPages] = useState<SubPage[]>([]);
  useEffect(() => {
    if (!game) return;
    let live = true;
    getIndieSubPages(game).then((p) => live && setPages(p)).catch(() => {});
    return () => { live = false; };
  }, [game]);
  if (pages.length === 0) return null;
  return (
    <section className="container game-tags" aria-label="More about this game">
      <p className="eyebrow">More about this game</p>
      <ul>{pages.map((p) => <li key={p.kind}><a href={p.path}>{p.label}</a></li>)}</ul>
    </section>
  );
}
