import { useEffect, useState } from "react";
import type { YourGameProps } from "../registry";
import { mine } from "./api";

// On the owner's game in Your games, when admins hid it as a copy of another game.
const titleOf = (name: string) => name.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

export default function CopyNotice({ game }: YourGameProps) {
  const [of, setOf] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    if (game.hidden !== "duplicate") return setOf(undefined);
    mine().then((rows) => setOf(rows.find((r) => r.game === game.name)?.of ?? null));
  }, [game.name, game.hidden]);
  if (of === undefined) return null;
  return (
    <div className="update-problem" role="status">
      <b>Hidden: looks like a copy</b>
      <span>
        Our team hid this game because it looks like a copy of {of ? <a href={`/games/${of}`}>{titleOf(of)}</a> : "another game on start.ng"}.
        If it's your own original, or it's different, tell the start.ng team and we'll take another look.
      </span>
    </div>
  );
}
