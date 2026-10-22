// On the owner's game in Your games: scores in it that are being checked (startng-be app/features/integrity).
import { useEffect, useState } from "react";
import { registerYourGamePart, type YourGameProps } from "../registry";
import { gameFlags, type OwnerFlag } from "./ownerApi";

const SHOWN = 5;
const statLine = (stats: Record<string, number>) => Object.entries(stats).map(([k, v]) => `${k} ${v.toLocaleString()}`).join(" · ");

function HeldScores({ game }: YourGameProps) {
  const [open, setOpen] = useState<OwnerFlag[]>([]);

  useEffect(() => {
    let live = true;
    gameFlags(game.name).then((flags) => live && setOpen(flags.filter((f) => f.status === "open"))).catch(() => live && setOpen([]));
    return () => { live = false; };
  }, [game.name]);

  if (open.length === 0) return null;
  return (
    <div className="score-notice" role="status">
      <b>{open.length === 1 ? "1 score is being checked" : `${open.length} scores are being checked`}</b>
      <span>A run that looked too good to be true is held back. It isn't on your leaderboard or in any tournament until our team has looked at it, and the player isn't told. You don't need to do anything.</span>
      <ul>
        {open.slice(0, SHOWN).map((f) => (
          <li key={f.id}><b>{f.player}</b>: {statLine(f.stats)}{f.previous_best !== null && ` (their best before: ${f.previous_best.toLocaleString()})`}</li>
        ))}
      </ul>
      {open.length > SHOWN && <span>…and {open.length - SHOWN} more.</span>}
    </div>
  );
}

// The flag is "integrity" (the same as NAME in startng-be app/features/integrity).
registerYourGamePart({ feature: "integrity", key: "score-flags", Component: HeldScores });
