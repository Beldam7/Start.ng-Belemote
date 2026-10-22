import { useEffect, useState } from "react";
import type { PagePartProps } from "../registry";
import { getSpotlight, type Spotlight } from "./api";

/** On the homepage: today's daily challenge and the Game of the Week, as two small cards linking to /spotlight. */
export function HomeSpotlight({ user }: PagePartProps) {
  const [s, setS] = useState<Spotlight | null>(null);
  useEffect(() => {
    let live = true;
    getSpotlight().then((got) => live && setS(got)).catch(() => {});
    return () => { live = false; };
  }, [user?.id]);
  if (!s || (!s.challenge && !s.game_of_the_week)) return null;
  const c = s.challenge, p = s.game_of_the_week;
  return (
    <section className="container home-spotlight" aria-label="Spotlight">
      {c && (
        <a className="spot-mini" href="/spotlight">
          <span className="eyebrow">Daily challenge</span>
          <b>{c.goal_is_a_ceiling ? `Finish ${c.game_title} in ${c.goal_shown} or less` : `Reach ${c.goal_shown} in ${c.game_title}`}</b>
          {c.done ? <em>Done today ✓</em> : <em>One goal a day</em>}
        </a>
      )}
      {p && (
        <a className="spot-mini" href="/spotlight">
          <span className="eyebrow">Game of the Week</span>
          <b>{p.title}</b>
          {p.note && <em>{p.note}</em>}
        </a>
      )}
    </section>
  );
}

/** On a game's page: a tag when it is this week's pick. */
export function WeekTag({ game }: PagePartProps) {
  const [pick, setPick] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    getSpotlight().then((got) => live && setPick(got.game_of_the_week?.game ?? null)).catch(() => {});
    return () => { live = false; };
  }, []);
  if (!game || pick !== game) return null;
  return <a className="tag week-tag" href="/spotlight">Game of the Week</a>;
}
