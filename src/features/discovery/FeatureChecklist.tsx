import { useEffect, useState } from "react";
import type { YourGameProps } from "../registry";
import { getFeaturing, type Featuring } from "./api";

/** In Your games: what a game needs to be featured on the homepage, and what it is missing. */
export default function FeatureChecklist({ game }: YourGameProps) {
  const [f, setF] = useState<Featuring | null>(null);
  useEffect(() => {
    let live = true;
    getFeaturing(game.name).then((got) => live && setF(got)).catch(() => {});
    return () => { live = false; };
  }, [game.name, game.updated_at]);
  if (!f) return null;
  return (
    <details className="feature-checklist">
      <summary>
        {f.featured ? "Featured on the homepage" : f.eligible ? "Ready to be featured" : "To be featured: " + f.checks.filter((c) => c.required && !c.ok).length + " to fix"}
        {f.staff_pick && " · Staff pick"}
      </summary>
      <ul>
        {f.checks.map((c) => (
          <li key={c.key} className={c.ok ? "ok" : c.required ? "todo" : "maybe"}>
            <span aria-hidden="true">{c.ok ? "✓" : c.required ? "✗" : "○"}</span> {c.label}
          </li>
        ))}
      </ul>
      <p className="note">Featured games are picked by the start.ng team from games that pass every check. New games always show under "New this week".</p>
    </details>
  );
}
